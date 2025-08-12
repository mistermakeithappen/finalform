-- Create a function to handle new user registration
-- This will be called from the application after signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS void AS $$
DECLARE
  new_org_id UUID;
  org_slug TEXT;
  user_email TEXT;
  company_name TEXT;
BEGIN
  -- Get the current user's email and metadata
  user_email := auth.jwt() ->> 'email';
  company_name := COALESCE(
    auth.jwt() -> 'user_metadata' ->> 'company_name',
    SPLIT_PART(user_email, '@', 1) || '''s Organization'
  );
  
  -- Check if user already has an organization
  IF EXISTS (SELECT 1 FROM org_users WHERE user_id = auth.uid()) THEN
    RETURN;
  END IF;
  
  -- Generate a unique org slug from email
  org_slug := LOWER(SPLIT_PART(user_email, '@', 1) || '-' || SUBSTRING(gen_random_uuid()::TEXT, 1, 8));
  
  -- Create a new organization for the user
  INSERT INTO organizations (name, slug)
  VALUES (company_name, org_slug)
  RETURNING id INTO new_org_id;
  
  -- Add the user as owner of the organization
  INSERT INTO org_users (user_id, org_id, role)
  VALUES (auth.uid(), new_org_id, 'owner');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;

-- Create sample data for development (optional - remove in production)
-- This creates a demo organization with sample forms
DO $$
DECLARE
  demo_org_id UUID;
  demo_form_id UUID;
  demo_version_id UUID;
BEGIN
  -- Check if demo org already exists
  IF EXISTS (SELECT 1 FROM organizations WHERE slug = 'demo-construction') THEN
    RETURN;
  END IF;

  -- Create demo organization
  INSERT INTO organizations (name, slug)
  VALUES ('Demo Construction Co', 'demo-construction')
  RETURNING id INTO demo_org_id;
  
  -- Create a sample form
  INSERT INTO forms (
    org_id,
    name,
    slug,
    description,
    status,
    theme
  ) VALUES (
    demo_org_id,
    'Roofing Quote Request',
    'roofing-quote',
    'Get a quick estimate for your roofing project',
    'published',
    '{"primaryColor": "#6366f1", "accentColor": "#8b5cf6"}'::jsonb
  ) RETURNING id INTO demo_form_id;
  
  -- Create form version with sample schema
  INSERT INTO form_versions (
    form_id,
    version_number,
    schema
  ) VALUES (
    demo_form_id,
    1,
    '{
      "id": "roofing-form",
      "version": 1,
      "name": "Roofing Quote Request",
      "description": "Get a quick estimate for your roofing project",
      "fields": [
        {
          "id": "f_name",
          "type": "text",
          "key": "name",
          "label": "Full Name",
          "required": true,
          "placeholder": "John Doe",
          "grid": {"col": 6}
        },
        {
          "id": "f_email",
          "type": "email",
          "key": "email",
          "label": "Email Address",
          "required": true,
          "placeholder": "john@example.com",
          "grid": {"col": 6}
        },
        {
          "id": "f_phone",
          "type": "phone",
          "key": "phone",
          "label": "Phone Number",
          "required": true,
          "placeholder": "(555) 123-4567",
          "grid": {"col": 6}
        },
        {
          "id": "f_project_type",
          "type": "select",
          "key": "projectType",
          "label": "Project Type",
          "required": true,
          "options": [
            {"label": "New Roof Installation", "value": "new"},
            {"label": "Roof Replacement", "value": "replacement"},
            {"label": "Roof Repair", "value": "repair"},
            {"label": "Inspection Only", "value": "inspection"}
          ],
          "grid": {"col": 6}
        },
        {
          "id": "f_property_type",
          "type": "radio",
          "key": "propertyType",
          "label": "Property Type",
          "required": true,
          "options": [
            {"label": "Residential", "value": "residential"},
            {"label": "Commercial", "value": "commercial"}
          ],
          "grid": {"col": 12}
        },
        {
          "id": "f_address",
          "type": "address",
          "key": "address",
          "label": "Property Address",
          "required": true,
          "components": {
            "street1": true,
            "street2": true,
            "city": true,
            "state": true,
            "zip": true,
            "country": false
          },
          "grid": {"col": 12}
        },
        {
          "id": "f_measurements",
          "type": "section",
          "key": "measurements_section",
          "title": "Roof Measurements",
          "description": "Please provide approximate measurements if known",
          "fields": [
            {
              "id": "f_roof_area",
              "type": "number",
              "key": "roofArea",
              "label": "Approximate Roof Area (sq ft)",
              "placeholder": "2000",
              "grid": {"col": 4}
            },
            {
              "id": "f_stories",
              "type": "number",
              "key": "stories",
              "label": "Number of Stories",
              "placeholder": "2",
              "validation": {"min": 1, "max": 5},
              "grid": {"col": 4}
            },
            {
              "id": "f_pitch",
              "type": "select",
              "key": "pitch",
              "label": "Roof Pitch",
              "options": [
                {"label": "Flat", "value": "flat"},
                {"label": "Low (2/12 - 4/12)", "value": "low"},
                {"label": "Medium (5/12 - 8/12)", "value": "medium"},
                {"label": "Steep (9/12+)", "value": "steep"}
              ],
              "grid": {"col": 4}
            }
          ]
        },
        {
          "id": "f_materials",
          "type": "matrix",
          "key": "materials",
          "label": "Materials Needed (if known)",
          "columns": [
            {"key": "item", "label": "Item", "type": "text", "width": 4},
            {"key": "quantity", "label": "Quantity", "type": "number", "width": 2},
            {"key": "unit", "label": "Unit", "type": "select", "width": 2, "options": [
              {"label": "Squares", "value": "squares"},
              {"label": "Linear Feet", "value": "lf"},
              {"label": "Pieces", "value": "pieces"}
            ]}
          ],
          "allowAddRow": true,
          "allowDeleteRow": true,
          "maxRows": 10,
          "grid": {"col": 12}
        },
        {
          "id": "f_timeline",
          "type": "select",
          "key": "timeline",
          "label": "Project Timeline",
          "required": true,
          "options": [
            {"label": "ASAP / Emergency", "value": "emergency"},
            {"label": "Within 1 week", "value": "1week"},
            {"label": "Within 1 month", "value": "1month"},
            {"label": "Within 3 months", "value": "3months"},
            {"label": "Just getting quotes", "value": "planning"}
          ],
          "grid": {"col": 6}
        },
        {
          "id": "f_budget",
          "type": "select",
          "key": "budget",
          "label": "Estimated Budget",
          "options": [
            {"label": "Under $5,000", "value": "under5k"},
            {"label": "$5,000 - $10,000", "value": "5to10k"},
            {"label": "$10,000 - $20,000", "value": "10to20k"},
            {"label": "$20,000 - $50,000", "value": "20to50k"},
            {"label": "Over $50,000", "value": "over50k"}
          ],
          "grid": {"col": 6}
        },
        {
          "id": "f_notes",
          "type": "textarea",
          "key": "notes",
          "label": "Additional Notes",
          "placeholder": "Please describe any specific concerns or requirements...",
          "rows": 4,
          "grid": {"col": 12}
        },
        {
          "id": "f_consent",
          "type": "checkbox",
          "key": "consent",
          "text": "I agree to be contacted regarding this quote request",
          "required": true,
          "grid": {"col": 12}
        }
      ],
      "logic": [
        {
          "id": "rule_commercial",
          "when": {"field": "propertyType", "op": "=", "value": "commercial"},
          "actions": [
            {"type": "show", "target": "f_business_name"},
            {"type": "require", "target": "f_business_name"}
          ]
        }
      ],
      "settings": {
        "submitText": "Request Quote",
        "submitAction": "message",
        "submitMessage": "Thank you! We will contact you within 24 hours with your quote.",
        "allowSave": false,
        "captcha": false
      }
    }'::jsonb
  ) RETURNING id INTO demo_version_id;
  
  -- Update form with current version
  UPDATE forms 
  SET current_version_id = demo_version_id 
  WHERE id = demo_form_id;
  
  -- Add a sample webhook (disabled by default)
  INSERT INTO webhooks (
    form_id,
    name,
    url,
    secret,
    events,
    is_active
  ) VALUES (
    demo_form_id,
    'Email Notification',
    'https://hooks.zapier.com/hooks/catch/123456/abcdef/',
    gen_random_uuid()::TEXT,
    ARRAY['form.submitted'],
    false
  );
  
END $$;