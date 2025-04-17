/*
  # Add formation participants functionality

  1. New Tables
    - `formation_participants`
      - `formation_id` (uuid, references formations)
      - `participant_id` (uuid, references participants)
      - `statut` (text) - Status of the registration
      - `date_inscription` (timestamptz)
      - `created_at` (timestamptz)
      - `created_by` (uuid, references auth.users)
      - `is_active` (boolean)

  2. Security
    - Enable RLS on formation_participants table
    - Add policies for:
      - Authenticated users can read all active registrations
      - Users can only create/update/delete their own registrations

  3. Notes
    - Each participant can only be registered once per formation
    - Registration status can be: 'pending', 'confirmed', 'cancelled'
*/

-- Create formation_participants table
CREATE TABLE IF NOT EXISTS formation_participants (
  formation_id uuid REFERENCES formations(id) ON DELETE CASCADE,
  participant_id uuid REFERENCES participants(id) ON DELETE CASCADE,
  statut text NOT NULL DEFAULT 'pending',
  date_inscription timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  is_active boolean DEFAULT true,
  
  -- Add primary key
  PRIMARY KEY (formation_id, participant_id),
  
  -- Add constraints
  CONSTRAINT formation_participants_unique UNIQUE (formation_id, participant_id),
  CONSTRAINT formation_participants_statut_valid CHECK (
    statut IN ('pending', 'confirmed', 'cancelled')
  )
);

-- Create indexes
CREATE INDEX IF NOT EXISTS formation_participants_formation_id_idx ON formation_participants(formation_id);
CREATE INDEX IF NOT EXISTS formation_participants_participant_id_idx ON formation_participants(participant_id);
CREATE INDEX IF NOT EXISTS formation_participants_created_by_idx ON formation_participants(created_by);
CREATE INDEX IF NOT EXISTS formation_participants_is_active_idx ON formation_participants(is_active);
CREATE INDEX IF NOT EXISTS formation_participants_statut_idx ON formation_participants(statut);

-- Enable Row Level Security
ALTER TABLE formation_participants ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view all active registrations"
  ON formation_participants
  FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Users can create registrations"
  ON formation_participants
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own registrations"
  ON formation_participants
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can delete own registrations"
  ON formation_participants
  FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

-- Add comment
COMMENT ON TABLE formation_participants IS 'Stores formation participant registrations';