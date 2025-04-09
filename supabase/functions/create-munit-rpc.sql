
CREATE OR REPLACE FUNCTION public.apl_insert_munit_task(
  workspace_id text,
  task_id text,
  task_name text,
  user_id uuid,
  description text DEFAULT '',
  flow_implementation text DEFAULT '',
  flow_description text DEFAULT '',
  munit_content text DEFAULT '',
  runtime text DEFAULT '',
  number_of_scenarios integer DEFAULT 1,
  category text DEFAULT 'munit'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_id UUID;
BEGIN
  INSERT INTO public.apl_munit_tasks(
    workspace_id,
    task_id,
    task_name,
    user_id,
    description,
    flow_implementation,
    flow_description,
    munit_content,
    runtime,
    number_of_scenarios,
    category
  ) VALUES (
    workspace_id,
    task_id,
    task_name,
    user_id,
    description,
    flow_implementation,
    flow_description,
    munit_content,
    runtime,
    number_of_scenarios,
    category
  ) RETURNING id INTO new_id;
  
  RETURN new_id;
END;
$$;
