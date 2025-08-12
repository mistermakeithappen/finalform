-- Add custom_domain field to organizations table for white-label support
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS custom_domain TEXT UNIQUE;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_organizations_custom_domain ON organizations(custom_domain);

-- Add comment
COMMENT ON COLUMN organizations.custom_domain IS 'Custom domain for white-labeled form URLs (e.g., forms.company.com)';