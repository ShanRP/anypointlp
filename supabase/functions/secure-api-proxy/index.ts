
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.6';

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Create a Supabase client with the Service Role Key
const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Get the JWT token from the request
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(
      JSON.stringify({ error: 'Missing Authorization header' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
    );
  }

  try {
    // Extract the token from the header
    const token = authHeader.replace('Bearer ', '');
    
    // Verify the token
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    // Get the query parameters
    const url = new URL(req.url);
    const path = url.searchParams.get('path');

    if (!path) {
      return new Response(
        JSON.stringify({ error: 'Missing path parameter' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Get the request body if present
    let body = null;
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      const contentType = req.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        body = await req.json();
      } else {
        body = await req.text();
      }
    }

    // Get the API key for the requested API
    const apiType = path.includes('openai') ? 'OPENAI_API_KEY' : 
                     path.includes('github') ? 'GITHUB_API_KEY' : 
                     path.includes('anthropic') ? 'ANTHROPIC_API_KEY' : 
                     'API_KEY';

    const { data: apiKey, error: apiKeyError } = await supabase.rpc('apl_get_api_key', { key_name: apiType });
    
    if (apiKeyError || !apiKey) {
      console.error('Error fetching API key:', apiKeyError);
      return new Response(
        JSON.stringify({ error: 'Failed to retrieve API key' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Prepare request headers
    const headers = new Headers();
    headers.set('Content-Type', 'application/json');
    
    // Set the appropriate Authorization header based on the API type
    if (apiType === 'OPENAI_API_KEY') {
      headers.set('Authorization', `Bearer ${apiKey}`);
    } else if (apiType === 'GITHUB_API_KEY') {
      headers.set('Authorization', `token ${apiKey}`);
    } else if (apiType === 'ANTHROPIC_API_KEY') {
      headers.set('x-api-key', apiKey);
    }

    // Make the request to the external API
    const response = await fetch(path, {
      method: req.method,
      headers,
      body: body ? (typeof body === 'string' ? body : JSON.stringify(body)) : null,
    });

    // Get the response data
    const responseData = await response.json();

    return new Response(
      JSON.stringify(responseData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: response.status }
    );
  } catch (error) {
    console.error('Error in secure-api-proxy:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
