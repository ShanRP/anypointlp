
-- Function to get all tasks in a workspace
CREATE OR REPLACE FUNCTION apl_get_workspace_tasks(workspace_id_param UUID)
RETURNS SETOF JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    jsonb_build_object(
      'id', id,
      'task_id', task_id,
      'task_name', task_name,
      'created_at', created_at,
      'description', COALESCE(description, ''),
      'category', COALESCE(category, 'dataweave')
    )
  FROM 
    apl_dataweave_tasks
  WHERE 
    workspace_id = workspace_id_param
  ORDER BY 
    created_at DESC;
END;
$$;

-- Add category column to apl_dataweave_tasks if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'apl_dataweave_tasks' AND column_name = 'category'
  ) THEN
    ALTER TABLE apl_dataweave_tasks ADD COLUMN category TEXT;
  END IF;
END$$;

-- Update existing tasks to have proper categories if they don't already
UPDATE apl_dataweave_tasks 
SET category = 'dataweave' 
WHERE category IS NULL;
