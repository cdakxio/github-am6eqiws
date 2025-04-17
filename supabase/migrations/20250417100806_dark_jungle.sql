/*
  # Add response columns to emails table

  1. Changes
    - Add `response` column to store AI-generated/edited responses
    - Add `response_at` timestamp to track when response was added
    - Add `response_by` column to track which user added the response
    - Add indexes for new columns
    - Update comments and documentation

  2. Notes
    - Response is stored as HTML text
    - Response tracking includes timestamp and user reference
    - Indexes added for efficient querying
*/

-- Add response columns to emails table
ALTER TABLE emails
ADD COLUMN response text,
ADD COLUMN response_at timestamptz,
ADD COLUMN response_by uuid REFERENCES auth.users(id);

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS emails_response_at_idx ON emails(response_at);
CREATE INDEX IF NOT EXISTS emails_response_by_idx ON emails(response_by);

-- Add comments
COMMENT ON COLUMN emails.response IS 'AI-generated and user-edited response content';
COMMENT ON COLUMN emails.response_at IS 'Timestamp when response was added';
COMMENT ON COLUMN emails.response_by IS 'Reference to the user who added the response';