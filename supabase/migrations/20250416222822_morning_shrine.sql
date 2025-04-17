/*
  # Fix formation participant status updates

  1. Changes
    - Drop and recreate the status constraint to properly handle all statuses
    - Add index on status column for better query performance
    - Update existing records to ensure valid status values

  2. Notes
    - Ensures all status values are properly validated
    - Improves query performance for status-based filtering
*/

-- Drop existing constraint if it exists
ALTER TABLE formation_participants
DROP CONSTRAINT IF EXISTS formation_participants_statut_valid,
DROP CONSTRAINT IF EXISTS formation_participants_statut_check;

-- Add proper constraint for status
ALTER TABLE formation_participants
ADD CONSTRAINT formation_participants_statut_valid
CHECK (statut IN ('pending', 'confirmed', 'paid'));

-- Create index for status column
CREATE INDEX IF NOT EXISTS formation_participants_statut_idx 
ON formation_participants(statut);

-- Update any null status values to 'pending'
UPDATE formation_participants 
SET statut = 'pending' 
WHERE statut IS NULL;

-- Add comment
COMMENT ON COLUMN formation_participants.statut IS 'Status for participants: pending, confirmed, or paid';