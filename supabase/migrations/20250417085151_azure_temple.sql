/*
  # Create email tables

  1. New Tables
    - `emails`
      - `id` (uuid, primary key)
      - `from_email` (text, required) - Sender email
      - `to_email` (text, required) - Recipient email
      - `subject` (text, required) - Email subject
      - `body` (text, required) - Email content
      - `sent_at` (timestamptz) - When the email was sent
      - `status` (text) - Email status (pending, sent, failed)
      - `error` (text) - Error message if sending failed
      - `created_at` (timestamptz)
      - `created_by` (uuid)
      - `is_active` (boolean)

  2. Security
    - Enable RLS on emails table
    - Add policies for:
      - Authenticated users can read their own emails
      - Users can only create/update/delete their own emails

  3. Notes
    - Includes status tracking for email delivery
    - Stores full email content and metadata
    - Maintains audit trail with timestamps and user references
*/

-- Create emails table
CREATE TABLE IF NOT EXISTS emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_email text NOT NULL,
  to_email text NOT NULL,
  subject text NOT NULL,
  body text NOT NULL,
  sent_at timestamptz,
  status text NOT NULL DEFAULT 'pending',
  error text,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  is_active boolean DEFAULT true,
  
  -- Add constraints
  CONSTRAINT emails_from_email_valid CHECK (from_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  CONSTRAINT emails_to_email_valid CHECK (to_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  CONSTRAINT emails_status_valid CHECK (status IN ('pending', 'sent', 'failed')),
  CONSTRAINT emails_subject_not_empty CHECK (char_length(subject) > 0),
  CONSTRAINT emails_body_not_empty CHECK (char_length(body) > 0)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS emails_from_email_idx ON emails(from_email);
CREATE INDEX IF NOT EXISTS emails_to_email_idx ON emails(to_email);
CREATE INDEX IF NOT EXISTS emails_status_idx ON emails(status);
CREATE INDEX IF NOT EXISTS emails_sent_at_idx ON emails(sent_at);
CREATE INDEX IF NOT EXISTS emails_created_by_idx ON emails(created_by);
CREATE INDEX IF NOT EXISTS emails_is_active_idx ON emails(is_active);

-- Enable Row Level Security
ALTER TABLE emails ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own emails"
  ON emails
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = created_by
    AND is_active = true
  );

CREATE POLICY "Users can create emails"
  ON emails
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own emails"
  ON emails
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can delete their own emails"
  ON emails
  FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

-- Create email_templates table for reusable templates
CREATE TABLE IF NOT EXISTS email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  subject text NOT NULL,
  body text NOT NULL,
  variables jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  is_active boolean DEFAULT true,
  
  -- Add constraints
  CONSTRAINT email_templates_name_not_empty CHECK (char_length(name) > 0),
  CONSTRAINT email_templates_subject_not_empty CHECK (char_length(subject) > 0),
  CONSTRAINT email_templates_body_not_empty CHECK (char_length(body) > 0)
);

-- Create indexes for email_templates
CREATE INDEX IF NOT EXISTS email_templates_name_idx ON email_templates(name);
CREATE INDEX IF NOT EXISTS email_templates_created_by_idx ON email_templates(created_by);
CREATE INDEX IF NOT EXISTS email_templates_is_active_idx ON email_templates(is_active);

-- Enable RLS for email_templates
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

-- Create policies for email_templates
CREATE POLICY "Users can view all active email templates"
  ON email_templates
  FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Users can create email templates"
  ON email_templates
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own email templates"
  ON email_templates
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can delete their own email templates"
  ON email_templates
  FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

-- Create updated_at trigger for email_templates
CREATE TRIGGER update_email_templates_updated_at
  BEFORE UPDATE ON email_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comments
COMMENT ON TABLE emails IS 'Stores email messages and their delivery status';
COMMENT ON TABLE email_templates IS 'Stores reusable email templates with variable placeholders';

-- Insert some default email templates
INSERT INTO email_templates (
  name,
  subject,
  body,
  variables,
  created_by
) VALUES
  (
    'welcome_participant',
    'Bienvenue à la formation {{formation_title}}',
    'Bonjour {{participant_name}},\n\nNous vous confirmons votre inscription à la formation "{{formation_title}}" qui aura lieu le {{formation_date}}.\n\nCordialement,\nL''équipe de formation',
    '{"formation_title": "string", "participant_name": "string", "formation_date": "string"}',
    auth.uid()
  ),
  (
    'formation_reminder',
    'Rappel: Formation {{formation_title}} demain',
    'Bonjour {{participant_name}},\n\nNous vous rappelons que la formation "{{formation_title}}" aura lieu demain à {{formation_time}}.\n\nLieu: {{formation_location}}\n\nCordialement,\nL''équipe de formation',
    '{"formation_title": "string", "participant_name": "string", "formation_time": "string", "formation_location": "string"}',
    auth.uid()
  ),
  (
    'formation_feedback',
    'Votre avis sur la formation {{formation_title}}',
    'Bonjour {{participant_name}},\n\nNous espérons que vous avez apprécié la formation "{{formation_title}}".\n\nMerci de prendre quelques minutes pour nous donner votre avis en cliquant sur ce lien: {{feedback_link}}\n\nCordialement,\nL''équipe de formation',
    '{"formation_title": "string", "participant_name": "string", "feedback_link": "string"}',
    auth.uid()
  );