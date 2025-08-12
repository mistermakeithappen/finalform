-- Add missing columns to forms table for autosave functionality
ALTER TABLE forms 
ADD COLUMN IF NOT EXISTS fields JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS logic JSONB DEFAULT '[]';

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_forms_fields ON forms USING gin (fields);
CREATE INDEX IF NOT EXISTS idx_forms_org_id ON forms(org_id);
CREATE INDEX IF NOT EXISTS idx_forms_status ON forms(status);