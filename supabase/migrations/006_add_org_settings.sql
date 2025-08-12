-- Add settings column to organizations table for storing org-wide preferences
ALTER TABLE public.organizations
ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}';

-- Set default settings for existing organizations
UPDATE public.organizations
SET settings = jsonb_build_object(
  'branding', jsonb_build_object(
    'logoUrl', '',
    'primaryColor', '',
    'secondaryColor', ''
  ),
  'defaults', jsonb_build_object(
    'formLogoUrl', '',
    'formTheme', 'light',
    'requireAuth', false
  )
)
WHERE settings = '{}' OR settings IS NULL;

-- Comment on the new column
COMMENT ON COLUMN public.organizations.settings IS 'Organization-wide settings including branding, defaults, and preferences';