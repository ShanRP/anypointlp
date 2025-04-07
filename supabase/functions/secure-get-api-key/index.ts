
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0'

interface RequestBody {
  keyName: string;
}

serve(async (req) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Content-Type': 'application/json'
  };

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers });
  }

  try {
    // Get the request data
    const body: RequestBody = await req.json();
    const { keyName } = body;

    if (!keyName) {
      return new Response(
        JSON.stringify({ error: 'Key name is required' }),
        { status: 400, headers }
      );
    }

    // Create a Supabase client with the Deno runtime
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get the settings key value (stored in Supabase settings)
    const { data: apiKey, error } = await supabaseClient
      .from('apl_api_keys')
      .select('key_value')
      .eq('key_name', keyName)
      .single();

    if (error) {
      console.error('Error fetching API key:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to retrieve API key' }),
        { status: 500, headers }
      );
    }

    return new Response(
      JSON.stringify({ apiKey: apiKey.key_value }),
      { status: 200, headers }
    );
  } catch (error) {
    console.error('Error:', error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers }
    );
  }
});
