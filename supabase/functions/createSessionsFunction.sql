
-- This function will get the latest user session
CREATE OR REPLACE FUNCTION public.apl_get_user_sessions(user_id_param uuid)
RETURNS JSONB[] 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  sessions JSONB[];
BEGIN
  -- Only get the most recent session for the user
  SELECT ARRAY_AGG(
    jsonb_build_object(
      'id', s.id,
      'created_at', s.created_at,
      'last_active_at', s.updated_at,
      'user_agent', s.user_agent,
      'ip_address', s.ip
    )
  )
  INTO sessions
  FROM (
    SELECT *
    FROM auth.sessions
    WHERE user_id = user_id_param
    ORDER BY updated_at DESC
    LIMIT 1
  ) s;

  -- Handle NULL case
  IF sessions IS NULL THEN
    RETURN '{}';
  END IF;

  RETURN sessions;
END;
$$;

-- This trigger function will delete older sessions when a new one is created
CREATE OR REPLACE FUNCTION public.apl_terminate_old_sessions()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete all sessions except the most recent one
  DELETE FROM auth.sessions
  WHERE user_id = NEW.user_id
    AND id != NEW.id;
  
  RETURN NEW;
END;
$$;

-- Create the trigger on the sessions table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_trigger 
    WHERE tgname = 'trigger_terminate_old_sessions'
  ) THEN
    CREATE TRIGGER trigger_terminate_old_sessions
    AFTER INSERT ON auth.sessions
    FOR EACH ROW
    EXECUTE FUNCTION apl_terminate_old_sessions();
  END IF;
END;
$$;
