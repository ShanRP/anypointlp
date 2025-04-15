
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

-- Optional: Add a unique constraint to ensure one workspace record per user/workspace combination
ALTER TABLE apl_workspaces 
DROP CONSTRAINT IF EXISTS unique_user_workspace;

ALTER TABLE apl_workspaces 
ADD CONSTRAINT unique_user_workspace UNIQUE (user_id, id);
