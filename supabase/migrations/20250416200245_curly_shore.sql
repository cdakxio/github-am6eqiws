/*
  # Create parametres and participants tables

  1. New Tables
    - `parametres`
      - `id` (uuid, primary key)
      - `type` (text, required) - Parameter type (e.g., 'type_institution')
      - `code` (text, required) - Parameter code
      - `libelle` (text, required) - Parameter label
      - `ordre` (integer) - Display order
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      - `created_by` (uuid) - Reference to auth.users
      - `is_active` (boolean)

    - `participants`
      - `id` (uuid, primary key)
      - `prenom` (text, required)
      - `nom` (text, required)
      - `telephone` (text)
      - `email` (text, required)
      - `fonction` (text)
      - `is_responsable` (boolean)
      - `type_institution` (text) - References parametres.code where type = 'type_institution'
      - `nom_institution` (text)
      - `rue` (text)
      - `code_postal` (text)
      - `ville` (text)
      - `telephone_institution` (text)
      - `adresse_facturation` (text)
      - `commentaire` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      - `created_by` (uuid)
      - `is_active` (boolean)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users
*/

-- Create parametres table
CREATE TABLE IF NOT EXISTS parametres (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,
  code text NOT NULL,
  libelle text NOT NULL,
  ordre integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  is_active boolean DEFAULT true,
  
  -- Add constraints
  CONSTRAINT parametres_type_not_empty CHECK (char_length(type) > 0),
  CONSTRAINT parametres_code_not_empty CHECK (char_length(code) > 0),
  CONSTRAINT parametres_libelle_not_empty CHECK (char_length(libelle) > 0),
  CONSTRAINT parametres_type_code_unique UNIQUE (type, code)
);

-- Create indexes for parametres
CREATE INDEX IF NOT EXISTS parametres_type_idx ON parametres(type);
CREATE INDEX IF NOT EXISTS parametres_is_active_idx ON parametres(is_active);
CREATE INDEX IF NOT EXISTS parametres_created_by_idx ON parametres(created_by);

-- Enable RLS for parametres
ALTER TABLE parametres ENABLE ROW LEVEL SECURITY;

-- Create policies for parametres
CREATE POLICY "Users can view all active parameters"
  ON parametres
  FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Users can create parameters"
  ON parametres
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own parameters"
  ON parametres
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can delete own parameters"
  ON parametres
  FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

-- Create updated_at trigger for parametres
CREATE TRIGGER update_parametres_updated_at
  BEFORE UPDATE ON parametres
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create participants table
CREATE TABLE IF NOT EXISTS participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prenom text NOT NULL,
  nom text NOT NULL,
  telephone text,
  email text NOT NULL,
  fonction text,
  is_responsable boolean DEFAULT false,
  type_institution text,
  nom_institution text,
  rue text,
  code_postal text,
  ville text,
  telephone_institution text,
  adresse_facturation text,
  commentaire text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  is_active boolean DEFAULT true,
  
  -- Add constraints
  CONSTRAINT participants_prenom_not_empty CHECK (char_length(prenom) > 0),
  CONSTRAINT participants_nom_not_empty CHECK (char_length(nom) > 0),
  CONSTRAINT participants_email_valid CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  CONSTRAINT participants_type_institution_valid CHECK (
    NOT is_responsable 
    OR (is_responsable AND type_institution IS NOT NULL)
  ),
  CONSTRAINT participants_nom_institution_valid CHECK (
    NOT is_responsable 
    OR (is_responsable AND nom_institution IS NOT NULL)
  )
);

-- Create indexes for participants
CREATE INDEX IF NOT EXISTS participants_nom_idx ON participants(nom);
CREATE INDEX IF NOT EXISTS participants_email_idx ON participants(email);
CREATE INDEX IF NOT EXISTS participants_is_active_idx ON participants(is_active);
CREATE INDEX IF NOT EXISTS participants_created_by_idx ON participants(created_by);
CREATE INDEX IF NOT EXISTS participants_type_institution_idx ON participants(type_institution);

-- Enable RLS for participants
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;

-- Create policies for participants
CREATE POLICY "Users can view all active participants"
  ON participants
  FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Users can create participants"
  ON participants
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own participants"
  ON participants
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can delete own participants"
  ON participants
  FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

-- Create updated_at trigger for participants
CREATE TRIGGER update_participants_updated_at
  BEFORE UPDATE ON participants
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comments
COMMENT ON TABLE parametres IS 'Stores system parameters like institution types';
COMMENT ON TABLE participants IS 'Stores participant information';

-- Insert default institution types
INSERT INTO parametres (type, code, libelle, ordre, created_by)
VALUES
  ('type_institution', 'ecole', 'École', 1, auth.uid()),
  ('type_institution', 'universite', 'Université', 2, auth.uid()),
  ('type_institution', 'centre_formation', 'Centre de formation', 3, auth.uid()),
  ('type_institution', 'association', 'Association', 4, auth.uid()),
  ('type_institution', 'entreprise', 'Entreprise', 5, auth.uid()),
  ('type_institution', 'administration', 'Administration publique', 6, auth.uid()),
  ('type_institution', 'autre', 'Autre', 7, auth.uid());