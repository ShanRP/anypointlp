
-- Function to get workspace members
CREATE OR REPLACE FUNCTION public.get_workspace_members(workspace_id_param UUID)
RETURNS TABLE (
  id UUID,
  workspace_id UUID,
  user_id UUID,
  role TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    wm.id,
    wm.workspace_id,
    wm.user_id,
    wm.role,
    wm.created_at
  FROM 
    public.apl_workspace_members wm
  WHERE 
    wm.workspace_id = workspace_id_param;
END;
$$;

-- Function to add a user to a workspace
CREATE OR REPLACE FUNCTION public.add_workspace_member(
  workspace_id_param UUID,
  user_id_param UUID,
  role_param TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_id UUID;
BEGIN
  INSERT INTO public.apl_workspace_members(
    workspace_id,
    user_id,
    role
  )
  VALUES (
    workspace_id_param,
    user_id_param,
    role_param
  )
  RETURNING id INTO new_id;
  
  RETURN new_id;
END;
$$;
