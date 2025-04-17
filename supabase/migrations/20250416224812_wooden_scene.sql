/*
  # Fix formation ratings check constraint

  1. Changes
    - Drop and recreate the formation_ratings table with fixed constraint
    - Use a simpler check that doesn't rely on subqueries
    - Add trigger to validate participant registration instead
*/

-- Drop existing table and view
DROP VIEW IF EXISTS formation_satisfaction_stats;
DROP TABLE IF EXISTS formation_ratings;

-- Create formation_ratings table
CREATE TABLE formation_ratings (
  formation_id uuid REFERENCES formations(id) ON DELETE CASCADE,
  participant_id uuid REFERENCES participants(id) ON DELETE CASCADE,
  rating integer NOT NULL,
  comment text,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  is_active boolean DEFAULT true,
  
  -- Add primary key
  PRIMARY KEY (formation_id, participant_id),
  
  -- Add constraints
  CONSTRAINT formation_ratings_unique UNIQUE (formation_id, participant_id),
  CONSTRAINT formation_ratings_rating_range CHECK (rating BETWEEN 1 AND 5)
);

-- Create function to validate participant registration
CREATE OR REPLACE FUNCTION check_participant_registration()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM formation_participants
    WHERE formation_id = NEW.formation_id
    AND participant_id = NEW.participant_id
    AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Participant must be registered for the formation';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER validate_participant_registration
  BEFORE INSERT OR UPDATE ON formation_ratings
  FOR EACH ROW
  EXECUTE FUNCTION check_participant_registration();

-- Create indexes
CREATE INDEX formation_ratings_formation_id_idx ON formation_ratings(formation_id);
CREATE INDEX formation_ratings_participant_id_idx ON formation_ratings(participant_id);
CREATE INDEX formation_ratings_rating_idx ON formation_ratings(rating);
CREATE INDEX formation_ratings_created_by_idx ON formation_ratings(created_by);
CREATE INDEX formation_ratings_is_active_idx ON formation_ratings(is_active);

-- Enable Row Level Security
ALTER TABLE formation_ratings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view all active ratings"
  ON formation_ratings
  FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Users can rate formations they're registered for"
  ON formation_ratings
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own ratings"
  ON formation_ratings
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can delete their own ratings"
  ON formation_ratings
  FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

-- Create view for formation satisfaction stats
CREATE VIEW formation_satisfaction_stats AS
SELECT
  f.id as formation_id,
  COALESCE(
    ROUND(
      (AVG(fr.rating)::numeric / 5 * 100)::numeric,
      1
    ),
    0
  ) as satisfaction_rate,
  COUNT(fr.rating) as total_ratings,
  json_build_object(
    '1', COUNT(*) FILTER (WHERE fr.rating = 1),
    '2', COUNT(*) FILTER (WHERE fr.rating = 2),
    '3', COUNT(*) FILTER (WHERE fr.rating = 3),
    '4', COUNT(*) FILTER (WHERE fr.rating = 4),
    '5', COUNT(*) FILTER (WHERE fr.rating = 5)
  ) as rating_distribution
FROM formations f
LEFT JOIN formation_ratings fr ON f.id = fr.formation_id AND fr.is_active = true
GROUP BY f.id;

-- Add comments
COMMENT ON TABLE formation_ratings IS 'Stores participant ratings and feedback for formations';
COMMENT ON VIEW formation_satisfaction_stats IS 'Aggregated satisfaction statistics for formations';