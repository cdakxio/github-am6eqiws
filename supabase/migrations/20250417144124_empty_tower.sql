/*
  # Update location types

  1. Changes
    - Update existing 'Institut' type to 'In-Situ'
    - Add new 'Formation Ouverte' type
    - Update existing locations to use new type
*/

-- First, add the new type
INSERT INTO parametres (type, code, libelle, ordre, created_by)
VALUES
  ('type_lieu', 'formation_ouverte', 'Formation Ouverte', 8, auth.uid());

-- Update existing Institut type to In-Situ
UPDATE parametres 
SET libelle = 'In-Situ'
WHERE type = 'type_lieu' 
AND libelle = 'Institut';

-- Update existing locations to use new type
UPDATE lieux
SET type = 'in_situ'
WHERE type = 'institut';