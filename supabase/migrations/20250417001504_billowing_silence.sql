/*
  # Add pricing fields to formations table

  1. Changes
    - Add `prix_unitaire` column for per-person pricing
    - Add `prix_total` column for total formation price
    - Add `prix_htva` boolean flag to indicate if price is excluding VAT
    - Add constraints to ensure only one price type is set
    - Add indexes for new columns

  2. Notes
    - Prices are stored in cents to avoid floating point issues
    - Either prix_unitaire or prix_total must be set, not both
    - prix_htva defaults to true (prices are typically excluding VAT)
*/

-- Add pricing columns
ALTER TABLE formations
ADD COLUMN prix_unitaire integer,
ADD COLUMN prix_total integer,
ADD COLUMN prix_htva boolean DEFAULT true;

-- Add constraint to ensure only one price type is set
ALTER TABLE formations
ADD CONSTRAINT formations_prix_check
CHECK (
  (prix_unitaire IS NULL AND prix_total IS NOT NULL) OR
  (prix_unitaire IS NOT NULL AND prix_total IS NULL) OR
  (prix_unitaire IS NULL AND prix_total IS NULL)
);

-- Add constraint for non-negative prices
ALTER TABLE formations
ADD CONSTRAINT formations_prix_unitaire_positive
CHECK (prix_unitaire IS NULL OR prix_unitaire >= 0),
ADD CONSTRAINT formations_prix_total_positive
CHECK (prix_total IS NULL OR prix_total >= 0);

-- Create indexes
CREATE INDEX formations_prix_unitaire_idx ON formations(prix_unitaire);
CREATE INDEX formations_prix_total_idx ON formations(prix_total);
CREATE INDEX formations_prix_htva_idx ON formations(prix_htva);

-- Add comments
COMMENT ON COLUMN formations.prix_unitaire IS 'Price per person in cents (exclusive with prix_total)';
COMMENT ON COLUMN formations.prix_total IS 'Total formation price in cents (exclusive with prix_unitaire)';
COMMENT ON COLUMN formations.prix_htva IS 'Whether the price is excluding VAT (true) or including VAT (false)';