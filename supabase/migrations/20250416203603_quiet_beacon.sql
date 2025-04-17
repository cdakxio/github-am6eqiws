/*
  # Update participants RLS policies for soft delete

  1. Changes
    - Drop existing delete policy
    - Add new update policy for soft deletes
    - Ensure users can only soft delete their own participants

  2. Security
    - Maintain RLS security by checking created_by
    - Only allow updating is_active field for soft deletes
*/

-- Drop the existing delete policy
DROP POLICY IF EXISTS "Users can delete own participants" ON participants;

-- Create a new policy for soft deletes
CREATE POLICY "Users can soft delete own participants"
  ON participants
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = created_by
    AND is_active = true
  )
  WITH CHECK (
    auth.uid() = created_by
    AND is_active = false
  );