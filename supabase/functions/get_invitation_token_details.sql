
-- Function to get invitation token details
CREATE OR REPLACE FUNCTION public.get_invitation_token_details(
  token_param TEXT,
  workspace_id_param UUID
)
RETURNS TABLE (
  invitation_id UUID,
  workspace_id UUID,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    it.invitation_id,
    it.workspace_id,
    it.email,
    it.created_at,
    it.expires_at
  FROM public.apl_invitation_tokens it
  WHERE it.token = token_param
  AND it.workspace_id = workspace_id_param;
END;
$$;
