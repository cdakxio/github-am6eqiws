/*
  # Insert fictional locations

  1. Data
    - Insert 10 diverse training locations across France
    - Include mix of different types (schools, universities, training centers)
    - Add realistic contact information and addresses
    - Set created_by to current user

  2. Notes
    - All locations are marked as active
    - Each location has complete contact information
    - Addresses are realistic French addresses
*/

-- Insert fictional locations
INSERT INTO lieux (
  nom,
  type,
  adresse,
  code_postal,
  ville,
  telephone,
  email,
  created_by
) VALUES
  (
    'Centre de Formation Parisien',
    'Institut',
    '25 Rue du Faubourg Saint-Honoré',
    '75008',
    'Paris',
    '0145789632',
    'contact@cfp-paris.fr',
    auth.uid()
  ),
  (
    'Institut Lyonnais des Compétences',
    'Institut',
    '15 Rue de la République',
    '69002',
    'Lyon',
    '0478456321',
    'accueil@ilc-lyon.fr',
    auth.uid()
  ),
  (
    'Campus Méditerranée',
    'Institut',
    '42 Boulevard Michelet',
    '13008',
    'Marseille',
    '0491234567',
    'info@campus-mediterranee.fr',
    auth.uid()
  ),
  (
    'Espace Formation Lille',
    'Institut',
    '8 Rue Nationale',
    '59000',
    'Lille',
    '0320789456',
    'contact@ef-lille.fr',
    auth.uid()
  ),
  (
    'Centre d''Excellence Nantais',
    'Institut',
    '3 Allée Duquesne',
    '44000',
    'Nantes',
    '0240567891',
    'formation@cen-nantes.fr',
    auth.uid()
  ),
  (
    'Institut Toulousain de Formation',
    'Institut',
    '18 Rue des Carmes',
    '31000',
    'Toulouse',
    '0561234789',
    'contact@itf-toulouse.fr',
    auth.uid()
  ),
  (
    'Centre Alsacien des Métiers',
    'Institut',
    '12 Place Kléber',
    '67000',
    'Strasbourg',
    '0388456123',
    'info@cam-strasbourg.fr',
    auth.uid()
  ),
  (
    'Institut Bordelais de Formation',
    'Institut',
    '56 Cours de l''Intendance',
    '33000',
    'Bordeaux',
    '0556789123',
    'contact@ibf-bordeaux.fr',
    auth.uid()
  ),
  (
    'Centre de Formation Azuréen',
    'Institut',
    '27 Promenade des Anglais',
    '06000',
    'Nice',
    '0493567812',
    'info@cfa-nice.fr',
    auth.uid()
  ),
  (
    'Institut Rennais des Compétences',
    'Institut',
    '4 Rue de la Monnaie',
    '35000',
    'Rennes',
    '0299345678',
    'contact@irc-rennes.fr',
    auth.uid()
  );