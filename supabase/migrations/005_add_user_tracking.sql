-- Add user tracking columns to submissions table
ALTER TABLE public.submissions
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS user_data JSONB;

-- Add index for user_id for faster queries
CREATE INDEX IF NOT EXISTS idx_submissions_user_id ON public.submissions(user_id);

-- Add index for finding submissions by user and form
CREATE INDEX IF NOT EXISTS idx_submissions_user_form ON public.submissions(user_id, form_id);

-- Update RLS policies to allow users to view their own submissions
CREATE POLICY "Users can view their own submissions" 
ON public.submissions
FOR SELECT
USING (user_id = auth.uid());

-- Comment on new columns
COMMENT ON COLUMN public.submissions.user_id IS 'The authenticated user who submitted the form';
COMMENT ON COLUMN public.submissions.user_data IS 'User metadata captured at submission time (email, name, etc.)';