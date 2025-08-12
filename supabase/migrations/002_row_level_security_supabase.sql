-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE submission_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_objects ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE transcriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pdf_exports ENABLE ROW LEVEL SECURITY;

-- Helper function to get user's org_id (using auth.uid() which is allowed)
CREATE OR REPLACE FUNCTION get_user_org_id()
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT org_id FROM org_users 
    WHERE user_id = auth.uid() 
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user belongs to org
CREATE OR REPLACE FUNCTION user_in_org(check_org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM org_users 
    WHERE user_id = auth.uid() 
    AND org_id = check_org_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check user role in org
CREATE OR REPLACE FUNCTION user_role_in_org(check_org_id UUID)
RETURNS TEXT AS $$
BEGIN
  RETURN (
    SELECT role FROM org_users 
    WHERE user_id = auth.uid() 
    AND org_id = check_org_id
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Organizations policies
CREATE POLICY "Users can view their organizations" ON organizations
  FOR SELECT USING (user_in_org(id));

CREATE POLICY "Org owners can update their organization" ON organizations
  FOR UPDATE USING (user_role_in_org(id) = 'owner');

-- Org users policies
CREATE POLICY "Users can view org members" ON org_users
  FOR SELECT USING (user_in_org(org_id));

CREATE POLICY "Org admins can manage users" ON org_users
  FOR ALL USING (user_role_in_org(org_id) IN ('owner', 'admin'));

-- Projects policies
CREATE POLICY "Org members can view projects" ON projects
  FOR SELECT USING (user_in_org(org_id));

CREATE POLICY "Editors can create projects" ON projects
  FOR INSERT WITH CHECK (user_role_in_org(org_id) IN ('owner', 'admin', 'editor'));

CREATE POLICY "Editors can update projects" ON projects
  FOR UPDATE USING (user_role_in_org(org_id) IN ('owner', 'admin', 'editor'));

CREATE POLICY "Admins can delete projects" ON projects
  FOR DELETE USING (user_role_in_org(org_id) IN ('owner', 'admin'));

-- Forms policies
CREATE POLICY "Org members can view forms" ON forms
  FOR SELECT USING (user_in_org(org_id));

CREATE POLICY "Editors can create forms" ON forms
  FOR INSERT WITH CHECK (user_role_in_org(org_id) IN ('owner', 'admin', 'editor'));

CREATE POLICY "Editors can update forms" ON forms
  FOR UPDATE USING (user_role_in_org(org_id) IN ('owner', 'admin', 'editor'));

CREATE POLICY "Admins can delete forms" ON forms
  FOR DELETE USING (user_role_in_org(org_id) IN ('owner', 'admin'));

-- Public policy for published forms (anonymous access)
CREATE POLICY "Public can view published forms" ON forms
  FOR SELECT USING (status = 'published');

-- Form versions policies
CREATE POLICY "Org members can view form versions" ON form_versions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM forms 
      WHERE forms.id = form_versions.form_id 
      AND user_in_org(forms.org_id)
    )
  );

CREATE POLICY "Editors can create form versions" ON form_versions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM forms 
      WHERE forms.id = form_versions.form_id 
      AND user_role_in_org(forms.org_id) IN ('owner', 'admin', 'editor')
    )
  );

-- Public policy for published form versions
CREATE POLICY "Public can view published form versions" ON form_versions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM forms 
      WHERE forms.id = form_versions.form_id 
      AND forms.status = 'published'
    )
  );

-- Fields policies
CREATE POLICY "Org members can view fields" ON fields
  FOR SELECT USING (user_in_org(org_id) OR is_system = true);

CREATE POLICY "Editors can manage fields" ON fields
  FOR ALL USING (user_role_in_org(org_id) IN ('owner', 'admin', 'editor'));

-- Submissions policies
CREATE POLICY "Org members can view submissions" ON submissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM forms 
      WHERE forms.id = submissions.form_id 
      AND user_in_org(forms.org_id)
    )
  );

-- Anonymous users can submit to published forms
CREATE POLICY "Public can submit to published forms" ON submissions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM forms 
      WHERE forms.id = submissions.form_id 
      AND forms.status = 'published'
    )
  );

-- Submission items policies
CREATE POLICY "Org members can view submission items" ON submission_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM submissions 
      JOIN forms ON forms.id = submissions.form_id
      WHERE submissions.id = submission_items.submission_id 
      AND user_in_org(forms.org_id)
    )
  );

CREATE POLICY "Public can insert submission items" ON submission_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM submissions 
      JOIN forms ON forms.id = submissions.form_id
      WHERE submissions.id = submission_items.submission_id 
      AND forms.status = 'published'
    )
  );

-- Webhooks policies
CREATE POLICY "Org members can view webhooks" ON webhooks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM forms 
      WHERE forms.id = webhooks.form_id 
      AND user_in_org(forms.org_id)
    )
  );

CREATE POLICY "Admins can manage webhooks" ON webhooks
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM forms 
      WHERE forms.id = webhooks.form_id 
      AND user_role_in_org(forms.org_id) IN ('owner', 'admin')
    )
  );

-- Webhook deliveries policies
CREATE POLICY "Org members can view webhook deliveries" ON webhook_deliveries
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM webhooks 
      JOIN forms ON forms.id = webhooks.form_id
      WHERE webhooks.id = webhook_deliveries.webhook_id 
      AND user_in_org(forms.org_id)
    )
  );

-- Audit logs policies
CREATE POLICY "Org members can view audit logs" ON audit_logs
  FOR SELECT USING (user_in_org(org_id));

CREATE POLICY "System can insert audit logs" ON audit_logs
  FOR INSERT WITH CHECK (true);

-- File objects policies
CREATE POLICY "Org members can view files" ON file_objects
  FOR SELECT USING (user_in_org(org_id));

CREATE POLICY "Public can upload files for submissions" ON file_objects
  FOR INSERT WITH CHECK (
    submission_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM submissions 
      JOIN forms ON forms.id = submissions.form_id
      WHERE submissions.id = file_objects.submission_id 
      AND forms.status = 'published'
    )
  );

-- Org integrations policies
CREATE POLICY "Admins can view org integrations" ON org_integrations
  FOR SELECT USING (user_role_in_org(org_id) IN ('owner', 'admin'));

CREATE POLICY "Owners can manage org integrations" ON org_integrations
  FOR ALL USING (user_role_in_org(org_id) = 'owner');

-- Domains policies
CREATE POLICY "Org members can view domains" ON domains
  FOR SELECT USING (user_in_org(org_id));

CREATE POLICY "Owners can manage domains" ON domains
  FOR ALL USING (user_role_in_org(org_id) = 'owner');

-- Recordings policies
CREATE POLICY "Org members can view recordings" ON recordings
  FOR SELECT USING (user_in_org(org_id));

CREATE POLICY "Public can create recordings for published forms" ON recordings
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM forms 
      WHERE forms.id = recordings.form_id 
      AND forms.status = 'published'
    )
  );

-- Transcriptions policies
CREATE POLICY "Org members can view transcriptions" ON transcriptions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM recordings 
      WHERE recordings.id = transcriptions.recording_id 
      AND user_in_org(recordings.org_id)
    )
  );

CREATE POLICY "System can manage transcriptions" ON transcriptions
  FOR ALL USING (true);

-- PDF exports policies
CREATE POLICY "Org members can view PDF exports" ON pdf_exports
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM submissions 
      JOIN forms ON forms.id = submissions.form_id
      WHERE submissions.id = pdf_exports.submission_id 
      AND user_in_org(forms.org_id)
    )
  );

CREATE POLICY "System can manage PDF exports" ON pdf_exports
  FOR ALL USING (true);