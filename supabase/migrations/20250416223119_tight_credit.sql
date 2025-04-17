/*
  # Fix formation participants status updates

  1. Changes
    - Add updated_at column to formation_participants table
    - Add updated_by column for tracking who made the change
    - Create trigger to automatically update updated_at timestamp
    - Add indexes for better query performance

  2. Notes
    - Ensures all status updates are properly tracked
    - Improves query performance
*/

-- Add updated_at and updated_by columns
ALTER TABLE formation_participants
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now(),
ADD COLUMN IF NOT EXISTS updated_by uuid REFERENCES auth.users(id);

-- Create indexes
CREATE INDEX IF NOT EXISTS formation_participants_updated_at_idx ON formation_participants(updated_at);
CREATE INDEX IF NOT EXISTS formation_participants_updated_by_idx ON formation_participants(updated_by);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_formation_participants_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger
DROP TRIGGER IF EXISTS update_formation_participants_updated_at ON formation_participants;
CREATE TRIGGER update_formation_participants_updated_at
  BEFORE UPDATE ON formation_participants
  FOR EACH ROW
  EXECUTE FUNCTION update_formation_participants_updated_at();

-- Add comments
COMMENT ON COLUMN formation_participants.updated_at IS 'Timestamp of last update';
COMMENT ON COLUMN formation_participants.updated_by IS 'Reference to the user who made the last update';