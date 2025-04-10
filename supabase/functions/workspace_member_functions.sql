
-- Function to check if a user is a member of a workspace
CREATE OR REPLACE FUNCTION public.check_workspace_membership(workspace_id_param uuid, user_id_param uuid)
RETURNS TABLE(id uuid, workspace_id uuid, user_id uuid, role text, created_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT m.id, m.workspace_id, m.user_id, m.role, m.created_at
  FROM public.apl_workspace_members m
  WHERE m.workspace_id = workspace_id_param
    AND m.user_id = user_id_param;
END;
$$;

-- Function to add a user to a workspace
CREATE OR REPLACE FUNCTION public.add_workspace_member(workspace_id_param uuid, user_id_param uuid, role_param text DEFAULT 'member')
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_id UUID;
BEGIN
  INSERT INTO public.apl_workspace_members(workspace_id, user_id, role)
  VALUES (workspace_id_param, user_id_param, role_param)
  RETURNING id INTO new_id;
  
  RETURN new_id;
END;
$$;
