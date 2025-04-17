/*
  # Create formateurs table

  1. New Tables
    - `formateurs`
      - `id` (uuid, primary key)
      - `nom` (text, required) - Last name
      - `prenom` (text, required) - First name
      - `email` (text, required) - Email address
      - `telephone` (text) - Phone number
      - `adresse` (text) - Street address
      - `code_postal` (text) - Postal code
      - `ville` (text) - City
      - `created_at` (timestamptz) - Creation timestamp
      - `updated_at` (timestamptz) - Last update timestamp
      - `created_by` (uuid) - Reference to auth.users
      - `is_active` (boolean) - Trainer status

  2. Security
    - Enable RLS on formateurs table
    - Add policies for:
      - Authenticated users can read all active trainers
      - Users can only create/update/delete their own trainers
*/

-- Create formateurs table
CREATE TABLE IF NOT EXISTS formateurs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nom text NOT NULL,
  prenom text NOT NULL,
  email text NOT NULL,
  telephone text,
  adresse text,
  code_postal text,
  ville text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  is_active boolean DEFAULT true,
  
  -- Add constraints
  CONSTRAINT formateurs_nom_not_empty CHECK (char_length(nom) > 0),
  CONSTRAINT formateurs_prenom_not_empty CHECK (char_length(prenom) > 0),
  CONSTRAINT formateurs_email_valid CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Create indexes
CREATE INDEX IF NOT EXISTS formateurs_created_by_idx ON formateurs(created_by);
CREATE INDEX IF NOT EXISTS formateurs_is_active_idx ON formateurs(is_active);
CREATE INDEX IF NOT EXISTS formateurs_nom_idx ON formateurs(nom);
CREATE INDEX IF NOT EXISTS formateurs_email_idx ON formateurs(email);

-- Enable Row Level Security
ALTER TABLE formateurs ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Allow authenticated users to read all active trainers
CREATE POLICY "Users can view all active trainers"
  ON formateurs
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Allow users to create their own trainers
CREATE POLICY "Users can create trainers"
  ON formateurs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- Allow users to update their own trainers
CREATE POLICY "Users can update own trainers"
  ON formateurs
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

-- Allow users to delete their own trainers
CREATE POLICY "Users can delete own trainers"
  ON formateurs
  FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_formateurs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_formateurs_updated_at
  BEFORE UPDATE
  ON formateurs
  FOR EACH ROW
  EXECUTE FUNCTION update_formateurs_updated_at();

-- Add comment to table
COMMENT ON TABLE formateurs IS 'Stores trainer information';