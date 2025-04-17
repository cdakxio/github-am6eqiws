/*
  # Add formation satisfaction ratings

  1. New Tables
    - `formation_ratings`
      - `formation_id` (uuid, references formations)
      - `participant_id` (uuid, references participants)
      - `rating` (integer, 1-5) - Star rating
      - `comment` (text) - Optional feedback
      - `created_at` (timestamptz)
      - `created_by` (uuid)
      - `is_active` (boolean)

  2. Security
    - Enable RLS on formation_ratings table
    - Add policies for:
      - Authenticated users can read all active ratings
      - Users can only rate formations they're registered for
      - Users can only update/delete their own ratings

  3. Notes
    - Each participant can only rate a formation once
    - Ratings are on a 1-5 scale
    - Comments are optional
*/

-- Create formation_ratings table
CREATE TABLE IF NOT EXISTS formation_ratings (
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
  CONSTRAINT formation_ratings_rating_range CHECK (rating BETWEEN 1 AND 5),
  CONSTRAINT formation_ratings_participant_registered CHECK (
    EXISTS (
      SELECT 1 FROM formation_participants fp
      WHERE fp.formation_id = formation_ratings.formation_id
      AND fp.participant_id = formation_ratings.participant_id
      AND fp.is_active = true
    )
  )
);

-- Create indexes
CREATE INDEX IF NOT EXISTS formation_ratings_formation_id_idx ON formation_ratings(formation_id);
CREATE INDEX IF NOT EXISTS formation_ratings_participant_id_idx ON formation_ratings(participant_id);
CREATE INDEX IF NOT EXISTS formation_ratings_rating_idx ON formation_ratings(rating);
CREATE INDEX IF NOT EXISTS formation_ratings_created_by_idx ON formation_ratings(created_by);
CREATE INDEX IF NOT EXISTS formation_ratings_is_active_idx ON formation_ratings(is_active);

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
  WITH CHECK (
    auth.uid() = created_by
    AND EXISTS (
      SELECT 1 FROM formation_participants fp
      WHERE fp.formation_id = formation_ratings.formation_id
      AND fp.participant_id = formation_ratings.participant_id
      AND fp.is_active = true
    )
  );

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

-- Add comment
COMMENT ON TABLE formation_ratings IS 'Stores participant ratings and feedback for formations';

-- Create view for formation satisfaction stats
CREATE OR REPLACE VIEW formation_satisfaction_stats AS
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

-- Add comment
COMMENT ON VIEW formation_satisfaction_stats IS 'Aggregated satisfaction statistics for formations';