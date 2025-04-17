/*
  # Add updated_by column to lieux table

  1. Changes
    - Add `updated_by` column to `lieux` table referencing auth.users
    - Create index for the new column
    
  2. Security
    - No changes to existing policies required
*/

-- Add updated_by column
ALTER TABLE lieux 
  ADD COLUMN updated_by uuid REFERENCES auth.users(id);

-- Create index for the new column
CREATE INDEX IF NOT EXISTS lieux_updated_by_idx ON lieux(updated_by);

-- Add comment
COMMENT ON COLUMN lieux.updated_by IS 'Reference to the user who last updated the location';