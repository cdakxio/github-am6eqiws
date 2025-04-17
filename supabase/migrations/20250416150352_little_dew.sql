/*
  # Add distance column to formation_formateurs table

  1. Changes
    - Add `distance_km` column to formation_formateurs table
      - Stores the calculated distance in kilometers between formateur and formation location
      - Nullable integer column
      - Used for tracking travel distance for reporting and planning

  2. Notes
    - Distance is stored in kilometers
    - Null value indicates distance hasn't been calculated yet
*/

-- Add distance_km column to formation_formateurs
ALTER TABLE formation_formateurs
ADD COLUMN distance_km integer;

-- Add comment
COMMENT ON COLUMN formation_formateurs.distance_km IS 'Distance in kilometers between formateur location and formation location';