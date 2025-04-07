
-- Create API keys table
CREATE TABLE IF NOT EXISTS apl_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key_name TEXT NOT NULL UNIQUE,
  key_value TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create RLS policies for API keys table
ALTER TABLE apl_api_keys ENABLE ROW LEVEL SECURITY;

-- Only allow admins to manage API keys
CREATE POLICY "Admin users can manage API keys" ON apl_api_keys
  USING (auth.uid() IN (SELECT auth.uid() FROM auth.users WHERE auth.jwt() ->> 'app_metadata'::text ->> 'role'::text = 'admin'));

-- Create function to securely get API key by name (only available server-side)
CREATE OR REPLACE FUNCTION apl_get_api_key(key_name text)
RETURNS text
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  api_key_value text;
BEGIN
  -- Only allow authenticated users to access this function
  IF auth.role() = 'anon' THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  
  -- Get the API key from the table
  SELECT key_value INTO api_key_value 
  FROM apl_api_keys 
  WHERE key_name = apl_get_api_key.key_name;
  
  RETURN api_key_value;
END;
$$;

-- Grant usage to authenticated users
GRANT EXECUTE ON FUNCTION apl_get_api_key TO authenticated;
