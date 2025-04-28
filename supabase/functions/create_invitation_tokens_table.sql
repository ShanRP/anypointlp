
-- Create a table for storing invitation tokens
CREATE TABLE IF NOT EXISTS public.apl_invitation_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT NOT NULL UNIQUE,
  invitation_id UUID REFERENCES public.apl_workspace_invitations(id),
  workspace_id UUID REFERENCES public.apl_workspaces(id) NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '7 days'),
  
  CONSTRAINT unique_token UNIQUE (token)
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_invitation_tokens_token ON public.apl_invitation_tokens(token);
CREATE INDEX IF NOT EXISTS idx_invitation_tokens_workspace ON public.apl_invitation_tokens(workspace_id);

-- Add row level security
ALTER TABLE public.apl_invitation_tokens ENABLE ROW LEVEL SECURITY;

-- Only allow the service role to manage tokens
CREATE POLICY "Service role can manage invitation tokens"
ON public.apl_invitation_tokens
USING (true)
WITH CHECK (true);
