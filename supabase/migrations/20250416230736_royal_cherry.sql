/*
  # Add rating column to formations table

  1. Changes
    - Add `rating` column to formations table
    - Add constraint to ensure rating is between 0 and 100
    - Create index for efficient querying
*/

-- Add rating column
ALTER TABLE formations
ADD COLUMN rating integer DEFAULT 0;

-- Add constraint for rating range
ALTER TABLE formations
ADD CONSTRAINT formations_rating_range
CHECK (rating BETWEEN 0 AND 100);

-- Create index
CREATE INDEX formations_rating_idx ON formations(rating);

-- Add comment
COMMENT ON COLUMN formations.rating IS 'Formation satisfaction rating as a percentage (0-100)';