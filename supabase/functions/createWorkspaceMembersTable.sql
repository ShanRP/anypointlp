
-- This function will create a workspace_members table
CREATE TABLE IF NOT EXISTS public.apl_workspace_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.apl_workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(workspace_id, user_id)
);

-- Add RLS policies
ALTER TABLE public.apl_workspace_members ENABLE ROW LEVEL SECURITY;

-- Workspace owners can view members
CREATE POLICY "Workspace owners can view members"
  ON public.apl_workspace_members
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.apl_workspaces w
      WHERE w.id = workspace_id AND w.user_id = auth.uid()
    )
  );

-- Members can view workspaces they belong to
CREATE POLICY "Members can view their workspaces"
  ON public.apl_workspace_members
  FOR SELECT
  USING (user_id = auth.uid());

-- Allow workspace owner to add members
CREATE POLICY "Workspace owners can add members"
  ON public.apl_workspace_members
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.apl_workspaces w
      WHERE w.id = workspace_id AND w.user_id = auth.uid()
    ) OR user_id = auth.uid() -- Allow users to add themselves via invite links
  );
