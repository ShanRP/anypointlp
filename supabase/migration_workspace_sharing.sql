
-- This SQL script adds support for shared workspaces
-- Run this in the Supabase SQL editor

-- Add a new column to flag if a workspace record is from an invitation
ALTER TABLE apl_workspaces ADD COLUMN IF NOT EXISTS is_invited_workspace BOOLEAN DEFAULT FALSE;

-- Create an index to improve query performance
CREATE INDEX IF NOT EXISTS idx_workspace_user ON apl_workspaces(user_id, id);

-- Update RLS policies to handle shared workspaces correctly
-- First, drop any existing policies that might conflict
DROP POLICY IF EXISTS "Users can view their own workspaces" ON apl_workspaces;

-- Then create the new policy
CREATE POLICY "Users can view their own workspaces" 
ON apl_workspaces 
FOR SELECT 
USING (auth.uid() = user_id);

-- Add constraint to ensure workspace records are unique per user
ALTER TABLE apl_workspaces 
DROP CONSTRAINT IF EXISTS unique_user_workspace;

ALTER TABLE apl_workspaces 
ADD CONSTRAINT unique_user_workspace UNIQUE (user_id, id);

-- Make sure workspace_members table has correct RLS policies
DROP POLICY IF EXISTS "Users can view their workspace memberships" ON apl_workspace_members;

CREATE POLICY "Users can view their workspace memberships" 
ON apl_workspace_members 
FOR SELECT 
USING (auth.uid() = user_id);

-- Add unique constraint to ensure a user can only be a member of a workspace once
ALTER TABLE apl_workspace_members 
DROP CONSTRAINT IF EXISTS unique_workspace_member;

ALTER TABLE apl_workspace_members 
ADD CONSTRAINT unique_workspace_member UNIQUE (workspace_id, user_id);

-- Add function for inviting users to a workspace
CREATE OR REPLACE FUNCTION invite_user_to_workspace(
  p_workspace_id UUID,
  p_user_id UUID,
  p_role TEXT DEFAULT 'member'
) RETURNS BOOLEAN AS $$
DECLARE
  workspace_exists BOOLEAN;
  already_member BOOLEAN;
  workspace_owner UUID;
  workspace_name TEXT;
  workspace_initial TEXT;
  workspace_session_timeout TEXT;
  workspace_invite_enabled BOOLEAN;
BEGIN
  -- Check if workspace exists
  SELECT EXISTS(SELECT 1 FROM apl_workspaces WHERE id = p_workspace_id LIMIT 1) INTO workspace_exists;
  
  IF NOT workspace_exists THEN
    RAISE EXCEPTION 'Workspace does not exist';
  END IF;
  
  -- Check if user is already a member
  SELECT EXISTS(
    SELECT 1 FROM apl_workspace_members 
    WHERE workspace_id = p_workspace_id AND user_id = p_user_id
  ) INTO already_member;
  
  IF already_member THEN
    RETURN FALSE; -- Already a member, no action needed
  END IF;
  
  -- Get workspace details from owner's record
  SELECT 
    user_id, name, initial, session_timeout, invite_enabled
  INTO 
    workspace_owner, workspace_name, workspace_initial, workspace_session_timeout, workspace_invite_enabled
  FROM apl_workspaces 
  WHERE id = p_workspace_id
  LIMIT 1;
  
  -- Add user as a member
  INSERT INTO apl_workspace_members (workspace_id, user_id, role)
  VALUES (p_workspace_id, p_user_id, p_role);
  
  -- Create workspace record for the new member
  INSERT INTO apl_workspaces (
    id, 
    user_id, 
    name, 
    initial,
    session_timeout,
    invite_enabled,
    is_invited_workspace
  ) VALUES (
    p_workspace_id,
    p_user_id,
    workspace_name,
    workspace_initial,
    workspace_session_timeout,
    workspace_invite_enabled,
    TRUE
  )
  ON CONFLICT (user_id, id) DO UPDATE
  SET 
    name = workspace_name,
    initial = workspace_initial,
    session_timeout = workspace_session_timeout,
    invite_enabled = workspace_invite_enabled,
    is_invited_workspace = TRUE;
    
  -- Update invitation status if it exists
  UPDATE apl_workspace_invitations
  SET 
    status = 'accepted',
    accepted_at = NOW(),
    accepted_by = p_user_id
  WHERE 
    workspace_id = p_workspace_id AND
    accepted_by IS NULL AND
    status = 'pending';
    
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add function to get all workspaces for a user (owned and shared)
CREATE OR REPLACE FUNCTION apl_get_user_workspaces(user_id_param UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  initial TEXT,
  session_timeout TEXT,
  invite_enabled BOOLEAN,
  is_invited_workspace BOOLEAN,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    w.id,
    w.name,
    w.initial,
    w.session_timeout,
    w.invite_enabled,
    w.is_invited_workspace,
    w.created_at
  FROM apl_workspaces w
  WHERE w.user_id = user_id_param
  ORDER BY w.is_invited_workspace ASC, w.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
