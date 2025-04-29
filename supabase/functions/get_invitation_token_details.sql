
-- Create a function to get invitation token details safely without direct table access
CREATE OR REPLACE FUNCTION get_invitation_token_details(token_value TEXT, workspace_id_value UUID)
RETURNS TABLE (
  id UUID,
  token TEXT,
  invitation_id UUID,
  workspace_id UUID,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    it.id,
    it.token,
    it.invitation_id,
    it.workspace_id,
    it.email,
    it.created_at,
    it.expires_at
  FROM 
    public.apl_invitation_tokens it
  WHERE 
    it.token = token_value
    AND it.workspace_id = workspace_id_value;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
