/*
  # Create formations table

  1. New Tables
    - `formations`
      - `id` (uuid, primary key)
      - `titre` (text, required) - Title of the formation
      - `lieu` (text) - Location name
      - `categorie` (text) - Category of the formation
      - `date` (date, required) - Date of the formation
      - `nombre_heures` (integer) - Duration in hours
      - `adresse` (text) - Street address
      - `code_postal` (text) - Postal code
      - `ville` (text) - City
      - `url_visio` (text) - Video conference URL
      - `telephone` (text) - Contact phone number
      - `email` (text) - Contact email
      - `created_at` (timestamptz) - Creation timestamp
      - `updated_at` (timestamptz) - Last update timestamp
      - `created_by` (uuid) - Reference to auth.users
      - `is_active` (boolean) - Formation status

  2. Security
    - Enable RLS on formations table
    - Add policies for:
      - Authenticated users can read all active formations
      - Users can only create/update/delete their own formations
      - Admin users can manage all formations

  3. Triggers
    - Add trigger to automatically update updated_at timestamp
*/

-- Create formations table
CREATE TABLE IF NOT EXISTS formations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titre text NOT NULL,
  lieu text,
  categorie text,
  date date NOT NULL,
  nombre_heures integer DEFAULT 0,
  adresse text,
  code_postal text,
  ville text,
  url_visio text,
  telephone text,
  email text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  is_active boolean DEFAULT true,
  
  -- Add constraints
  CONSTRAINT formations_titre_not_empty CHECK (char_length(titre) > 0),
  CONSTRAINT formations_email_valid CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS formations_created_by_idx ON formations(created_by);
CREATE INDEX IF NOT EXISTS formations_date_idx ON formations(date);
CREATE INDEX IF NOT EXISTS formations_is_active_idx ON formations(is_active);

-- Enable Row Level Security
ALTER TABLE formations ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Allow authenticated users to read all active formations
CREATE POLICY "Users can view all active formations"
  ON formations
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Allow users to create their own formations
CREATE POLICY "Users can create formations"
  ON formations
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- Allow users to update their own formations
CREATE POLICY "Users can update own formations"
  ON formations
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

-- Allow users to delete their own formations
CREATE POLICY "Users can delete own formations"
  ON formations
  FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_formations_updated_at
  BEFORE UPDATE
  ON formations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comment to table
COMMENT ON TABLE formations IS 'Stores formation/training session information';