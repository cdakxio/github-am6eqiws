/*
  # Add formation participant status management

  1. Changes
    - Add status types to parametres table
    - Add status column to formation_participants table
    - Add constraints and validation

  2. Notes
    - Status values: pending, confirmed, paid
    - Default status is 'pending'
    - Only non-institute formations use paid status
*/

-- Add status parameter types if not exists
INSERT INTO parametres (type, code, libelle, ordre, created_by)
VALUES
  ('statut_participant', 'pending', 'En attente', 1, auth.uid()),
  ('statut_participant', 'confirmed', 'Confirmé', 2, auth.uid()),
  ('statut_participant', 'paid', 'Payé', 3, auth.uid())
ON CONFLICT (type, code) DO NOTHING;

-- Add type column to formations to distinguish institute formations
ALTER TABLE formations
ADD COLUMN IF NOT EXISTS type text DEFAULT 'standard';

-- Add comment
COMMENT ON COLUMN formations.type IS 'Type of formation: institut or standard';

-- Add constraint to validate formation type
ALTER TABLE formations
ADD CONSTRAINT formations_type_check
CHECK (type IN ('institut', 'standard'));

-- Update formation_participants status constraint
ALTER TABLE formation_participants
DROP CONSTRAINT IF EXISTS formation_participants_statut_valid;

ALTER TABLE formation_participants
ADD CONSTRAINT formation_participants_statut_valid
CHECK (
  statut IN ('pending', 'confirmed', 'paid')
);

-- Add comment
COMMENT ON COLUMN formation_participants.statut IS 'Status for participants: pending, confirmed, or paid (paid only for non-institute formations)';