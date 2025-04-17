/*
  # Add available spots to formations

  1. Changes
    - Add `nombre_places` column to formations table
    - Add constraint to ensure positive number
    - Add index for better query performance

  2. Notes
    - Default value is null (unlimited spots)
    - Positive integer values indicate limited spots
*/

-- Add nombre_places column
ALTER TABLE formations
ADD COLUMN nombre_places integer;

-- Add constraint for positive values
ALTER TABLE formations
ADD CONSTRAINT formations_nombre_places_check
CHECK (nombre_places IS NULL OR nombre_places > 0);

-- Create index
CREATE INDEX IF NOT EXISTS formations_nombre_places_idx ON formations(nombre_places);

-- Add comment
COMMENT ON COLUMN formations.nombre_places IS 'Number of available spots (null for unlimited)';