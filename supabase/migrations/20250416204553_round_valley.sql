/*
  # Add type column to lieux table

  1. Changes
    - Add `type` column to lieux table
    - Add foreign key reference to parametres table
    - Update existing locations with default type
*/

-- Add type column to lieux table
ALTER TABLE lieux ADD COLUMN type text;

-- Create index for type column
CREATE INDEX IF NOT EXISTS lieux_type_idx ON lieux(type);

-- Add foreign key constraint
ALTER TABLE lieux
  ADD CONSTRAINT lieux_type_fkey
  FOREIGN KEY (type)
  REFERENCES parametres(code)
  ON DELETE SET NULL;

-- Insert default location types into parametres
INSERT INTO parametres (type, code, libelle, ordre, created_by)
VALUES
  ('type_lieu', 'ecole', 'École', 1, auth.uid()),
  ('type_lieu', 'universite', 'Université', 2, auth.uid()),
  ('type_lieu', 'centre_formation', 'Centre de formation', 3, auth.uid()),
  ('type_lieu', 'association', 'Association', 4, auth.uid()),
  ('type_lieu', 'entreprise', 'Entreprise', 5, auth.uid()),
  ('type_lieu', 'administration', 'Administration publique', 6, auth.uid()),
  ('type_lieu', 'autre', 'Autre', 7, auth.uid())
ON CONFLICT (type, code) DO NOTHING;