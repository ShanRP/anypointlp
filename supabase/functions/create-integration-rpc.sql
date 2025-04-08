
-- Create a stored procedure to save integration tasks
CREATE OR REPLACE FUNCTION public.apl_save_integration_task(
  p_task_id TEXT,
  p_task_name TEXT,
  p_description TEXT,
  p_user_id UUID,
  p_workspace_id TEXT,
  p_category TEXT DEFAULT 'integration',
  p_runtime TEXT DEFAULT NULL,
  p_raml_content TEXT DEFAULT NULL,
  p_generated_code TEXT DEFAULT NULL,
  p_flow_summary TEXT DEFAULT NULL,
  p_flow_implementation TEXT DEFAULT NULL,
  p_flow_constants TEXT DEFAULT NULL,
  p_pom_dependencies TEXT DEFAULT NULL,
  p_compilation_check TEXT DEFAULT NULL,
  p_diagrams JSONB DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  new_id UUID;
BEGIN
  INSERT INTO public.apl_integration_tasks(
    task_id,
    task_name,
    description,
    user_id,
    workspace_id,
    category,
    runtime,
    raml_content,
    generated_code,
    flow_summary,
    flow_implementation,
    flow_constants,
    pom_dependencies,
    compilation_check,
    diagrams
  ) VALUES (
    p_task_id,
    p_task_name,
    p_description,
    p_user_id,
    p_workspace_id,
    p_category,
    p_runtime,
    p_raml_content,
    p_generated_code,
    p_flow_summary,
    p_flow_implementation,
    p_flow_constants,
    p_pom_dependencies,
    p_compilation_check,
    p_diagrams
  ) RETURNING id INTO new_id;
  
  RETURN new_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to the function
GRANT EXECUTE ON FUNCTION public.apl_save_integration_task TO authenticated;
GRANT EXECUTE ON FUNCTION public.apl_save_integration_task TO anon;
