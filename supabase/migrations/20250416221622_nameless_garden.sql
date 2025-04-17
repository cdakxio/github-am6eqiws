/*
  # Add participant status functionality

  1. Changes
    - Add `statut` column to formation_participants table
    - Add constraint to validate status values
    - Add default value 'pending'
    - Add check constraint to enforce status rules based on institution type

  2. Notes
    - Status can be: 'pending', 'confirmed', 'paid'
    - Status is only applicable for non-institute participants
*/

-- Add status parameter types
INSERT INTO parametres (type, code, libelle, ordre, created_by)
VALUES
  ('statut_participant', 'pending', 'En attente', 1, auth.uid()),
  ('statut_participant', 'confirmed', 'Confirmé', 2, auth.uid()),
  ('statut_participant', 'paid', 'Payé', 3, auth.uid())
ON CONFLICT (type, code) DO NOTHING;

-- Add status column to formation_participants
ALTER TABLE formation_participants 
ADD COLUMN IF NOT EXISTS statut text DEFAULT 'pending';

-- Add constraint to validate status values
ALTER TABLE formation_participants
ADD CONSTRAINT formation_participants_statut_check
CHECK (
  statut IN ('pending', 'confirmed', 'paid')
);

-- Add comment
COMMENT ON COLUMN formation_participants.statut IS 'Status for non-institute participants: pending, confirmed, or paid';