
-- Function that allows retrieving API keys stored in supabase settings securely
create or replace function apl_get_api_key(key_name text)
returns text
language plpgsql security definer
as $$
declare
  api_key_value text;
begin
  -- Only allow authenticated users to access this function
  if auth.role() = 'anon' then
    raise exception 'Not authorized';
  end if;
  
  -- Get the API key from Supabase settings
  -- This function assumes you've stored the API keys in Supabase settings
  -- through the dashboard or API
  -- The key name should match the setting name
  select current_setting('app.settings.' || key_name, true) into api_key_value;
  
  return api_key_value;
end;
$$;

-- Grant usage to authenticated users
grant execute on function apl_get_api_key to authenticated;
