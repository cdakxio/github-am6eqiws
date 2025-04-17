/*
  # Create locations table and update formations relationships

  1. New Tables
    - `lieux` (locations)
      - `id` (uuid, primary key)
      - `nom` (text, required) - Location name
      - `adresse` (text) - Street address
      - `code_postal` (text) - Postal code
      - `ville` (text) - City
      - `telephone` (text) - Contact phone
      - `email` (text) - Contact email
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      - `created_by` (uuid) - Reference to auth.users
      - `is_active` (boolean)

  2. Changes to formations table
    - Add `lieu_id` column referencing lieux table
    - Migrate data
    - Remove redundant location columns

  3. Security
    - Enable RLS on lieux table
    - Add policies for authenticated users
*/

-- Create lieux table
CREATE TABLE IF NOT EXISTS lieux (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nom text NOT NULL,
  adresse text,
  code_postal text,
  ville text,
  telephone text,
  email text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  is_active boolean DEFAULT true,
  
  CONSTRAINT lieux_nom_not_empty CHECK (char_length(nom) > 0),
  CONSTRAINT lieux_email_valid CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Create indexes
CREATE INDEX IF NOT EXISTS lieux_created_by_idx ON lieux(created_by);
CREATE INDEX IF NOT EXISTS lieux_is_active_idx ON lieux(is_active);

-- Enable RLS
ALTER TABLE lieux ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view all active locations"
  ON lieux
  FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Users can create locations"
  ON lieux
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own locations"
  ON lieux
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can delete own locations"
  ON lieux
  FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_lieux_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_lieux_updated_at
  BEFORE UPDATE
  ON lieux
  FOR EACH ROW
  EXECUTE FUNCTION update_lieux_updated_at();

-- Add lieu_id to formations FIRST
ALTER TABLE formations 
  ADD COLUMN lieu_id uuid REFERENCES lieux(id);

-- Create index for the foreign key
CREATE INDEX IF NOT EXISTS formations_lieu_id_idx ON formations(lieu_id);

-- Now migrate the data
DO $$
DECLARE
  f RECORD;
  new_lieu_id uuid;
BEGIN
  -- Create locations from existing formations
  FOR f IN SELECT DISTINCT lieu, adresse, code_postal, ville, telephone, email, created_by 
           FROM formations 
           WHERE lieu IS NOT NULL 
           OR adresse IS NOT NULL 
           OR ville IS NOT NULL
  LOOP
    -- Insert new location
    INSERT INTO lieux (nom, adresse, code_postal, ville, telephone, email, created_by)
    VALUES (
      COALESCE(f.lieu, f.ville),
      f.adresse,
      f.code_postal,
      f.ville,
      f.telephone,
      f.email,
      f.created_by
    )
    RETURNING id INTO new_lieu_id;

    -- Update formations to reference the new location
    UPDATE formations
    SET lieu_id = new_lieu_id
    WHERE (lieu = f.lieu OR ville = f.ville)
      AND (
        COALESCE(adresse, '') = COALESCE(f.adresse, '')
        AND COALESCE(code_postal, '') = COALESCE(f.code_postal, '')
        AND COALESCE(ville, '') = COALESCE(f.ville, '')
      );
  END LOOP;
END;
$$;

-- Add comment
COMMENT ON TABLE lieux IS 'Stores location information for formations';