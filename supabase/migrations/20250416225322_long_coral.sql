/*
  # Fix formation ratings and satisfaction stats

  1. Changes
    - Drop and recreate the formation_ratings table with fixed constraints
    - Use a trigger-based validation instead of check constraint
    - Ensure proper satisfaction rate calculation

  2. Security
    - Maintain existing RLS policies
    - Keep participant registration validation
*/

-- Drop existing view and table if they exist
DROP VIEW IF EXISTS formation_satisfaction_stats;
DROP TABLE IF EXISTS formation_ratings CASCADE;

-- Create formation_ratings table
CREATE TABLE formation_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  formation_id uuid REFERENCES formations(id) ON DELETE CASCADE,
  participant_id uuid REFERENCES participants(id) ON DELETE CASCADE,
  rating integer NOT NULL,
  comment text,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  is_active boolean DEFAULT true,
  
  -- Add constraints
  CONSTRAINT formation_ratings_rating_range CHECK (rating BETWEEN 1 AND 5)
);

-- Create function to validate participant registration
CREATE OR REPLACE FUNCTION validate_participant_registration()
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
CREATE TRIGGER check_participant_registration
  BEFORE INSERT OR UPDATE ON formation_ratings
  FOR EACH ROW
  EXECUTE FUNCTION validate_participant_registration();

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
WITH rating_stats AS (
  SELECT
    formation_id,
    COUNT(*) as total_ratings,
    AVG(rating) as avg_rating,
    json_build_object(
      '1', COUNT(*) FILTER (WHERE rating = 1),
      '2', COUNT(*) FILTER (WHERE rating = 2),
      '3', COUNT(*) FILTER (WHERE rating = 3),
      '4', COUNT(*) FILTER (WHERE rating = 4),
      '5', COUNT(*) FILTER (WHERE rating = 5)
    ) as rating_distribution
  FROM formation_ratings
  WHERE is_active = true
  GROUP BY formation_id
)
SELECT
  f.id as formation_id,
  COALESCE(
    ROUND(
      (rs.avg_rating / 5 * 100)::numeric,
      1
    ),
    0
  ) as satisfaction_rate,
  COALESCE(rs.total_ratings, 0) as total_ratings,
  COALESCE(rs.rating_distribution, json_build_object(
    '1', 0,
    '2', 0,
    '3', 0,
    '4', 0,
    '5', 0
  )) as rating_distribution
FROM formations f
LEFT JOIN rating_stats rs ON f.id = rs.formation_id;

-- Add comments
COMMENT ON TABLE formation_ratings IS 'Stores participant ratings and feedback for formations';
COMMENT ON VIEW formation_satisfaction_stats IS 'Aggregated satisfaction statistics for formations';