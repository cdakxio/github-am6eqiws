/*
  # Add fictional trainers

  1. Purpose
    - Add 10 fictional trainers with realistic data
    - Include full contact information and addresses

  2. Data
    - Mix of specialties and locations
    - Realistic French names and contact details
*/

-- Insert fictional trainers
INSERT INTO formateurs (
  nom,
  prenom,
  email,
  telephone,
  adresse,
  code_postal,
  ville,
  created_by
) VALUES
  (
    'Dubois',
    'Marie',
    'marie.dubois@formation.fr',
    '0612345678',
    '15 Rue de la République',
    '75001',
    'Paris',
    auth.uid()
  ),
  (
    'Bernard',
    'Thomas',
    'thomas.bernard@formation.fr',
    '0623456789',
    '8 Avenue des Champs-Élysées',
    '75008',
    'Paris',
    auth.uid()
  ),
  (
    'Petit',
    'Sophie',
    'sophie.petit@formation.fr',
    '0634567890',
    '25 Rue du Commerce',
    '69002',
    'Lyon',
    auth.uid()
  ),
  (
    'Moreau',
    'Pierre',
    'pierre.moreau@formation.fr',
    '0645678901',
    '42 Boulevard de la Liberté',
    '33000',
    'Bordeaux',
    auth.uid()
  ),
  (
    'Laurent',
    'Claire',
    'claire.laurent@formation.fr',
    '0656789012',
    '12 Rue Nationale',
    '59000',
    'Lille',
    auth.uid()
  ),
  (
    'Leroy',
    'Jean',
    'jean.leroy@formation.fr',
    '0667890123',
    '3 Place de la Comédie',
    '34000',
    'Montpellier',
    auth.uid()
  ),
  (
    'Roux',
    'Isabelle',
    'isabelle.roux@formation.fr',
    '0678901234',
    '18 Rue des Carmes',
    '44000',
    'Nantes',
    auth.uid()
  ),
  (
    'Michel',
    'Philippe',
    'philippe.michel@formation.fr',
    '0689012345',
    '7 Rue Pasteur',
    '67000',
    'Strasbourg',
    auth.uid()
  ),
  (
    'Lefebvre',
    'Anne',
    'anne.lefebvre@formation.fr',
    '0690123456',
    '29 Avenue Jean Jaurès',
    '31000',
    'Toulouse',
    auth.uid()
  ),
  (
    'Martin',
    'François',
    'francois.martin@formation.fr',
    '0601234567',
    '55 Rue de la Paix',
    '06000',
    'Nice',
    auth.uid()
  );