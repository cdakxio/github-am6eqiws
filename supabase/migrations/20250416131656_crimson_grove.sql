/*
  # Add formation-formateurs relationship

  1. New Tables
    - `formation_formateurs` (junction table)
      - `formation_id` (uuid, references formations)
      - `formateur_id` (uuid, references formateurs)
      - `created_at` (timestamptz)
      - `created_by` (uuid, references auth.users)

  2. Security
    - Enable RLS on formation_formateurs table
    - Add policies for:
      - Authenticated users can read all relationships
      - Users can only create/delete relationships for formations they own

  3. Changes
    - Add foreign key constraints with cascading deletes
    - Add unique constraint to prevent duplicate assignments
*/

-- Create formation_formateurs junction table
CREATE TABLE IF NOT EXISTS formation_formateurs (
  formation_id uuid REFERENCES formations(id) ON DELETE CASCADE,
  formateur_id uuid REFERENCES formateurs(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  
  -- Add primary key
  PRIMARY KEY (formation_id, formateur_id),
  
  -- Add constraints
  CONSTRAINT formation_formateurs_unique UNIQUE (formation_id, formateur_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS formation_formateurs_formation_id_idx ON formation_formateurs(formation_id);
CREATE INDEX IF NOT EXISTS formation_formateurs_formateur_id_idx ON formation_formateurs(formateur_id);
CREATE INDEX IF NOT EXISTS formation_formateurs_created_by_idx ON formation_formateurs(created_by);

-- Enable Row Level Security
ALTER TABLE formation_formateurs ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Allow authenticated users to read all relationships
CREATE POLICY "Users can view all formation-formateur relationships"
  ON formation_formateurs
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow users to create relationships for formations they own
CREATE POLICY "Users can create formation-formateur relationships"
  ON formation_formateurs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = created_by
    AND EXISTS (
      SELECT 1 FROM formations f
      WHERE f.id = formation_id
      AND f.created_by = auth.uid()
    )
  );

-- Allow users to delete relationships for formations they own
CREATE POLICY "Users can delete formation-formateur relationships"
  ON formation_formateurs
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM formations f
      WHERE f.id = formation_id
      AND f.created_by = auth.uid()
    )
  );

-- Add comment to table
COMMENT ON TABLE formation_formateurs IS 'Junction table linking formations with their assigned trainers';