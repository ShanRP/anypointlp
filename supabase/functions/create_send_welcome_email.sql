
-- Function to send welcome email to a subscriber
CREATE OR REPLACE FUNCTION public.send_welcome_email(subscriber_email TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
  url TEXT := 'https://xrdzfyxesrcbkatygoij.supabase.co/functions/v1/send_welcome_email';
  payload JSONB := json_build_object('email', subscriber_email);
  service_role_key TEXT;
BEGIN
  -- Get the service role key from the database secrets
  service_role_key := current_setting('app.settings.SUPABASE_SERVICE_ROLE_KEY', true);
  
  -- Call the edge function to send the email
  SELECT 
    COALESCE(
      content::jsonb,
      jsonb_build_object('error', 'Failed to send email')
    )
  INTO result
  FROM http((
    'POST',
    url,
    ARRAY[
      ('Content-Type', 'application/json'),
      ('Authorization', 'Bearer ' || service_role_key)
    ],
    payload::TEXT,
    NULL
  )::http_request);
  
  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;
