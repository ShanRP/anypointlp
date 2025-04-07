
// Follow this setup guide to integrate the Deno runtime with your application:
// https://deno.land/manual/examples/deploy_node_server

import { serve } from "https://deno.land/std@0.131.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

// Get the key from Supabase
async function getApiKey(supabaseClient: any, keyName: string) {
  try {
    // Call the secure SQL function to retrieve the API key
    const { data, error } = await supabaseClient.rpc('apl_get_api_key', {
      key_name: keyName,
    });

    if (error) {
      console.error('Error fetching API key:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getApiKey function:', error);
    return null;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { keyName } = await req.json();

    if (!keyName) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameter: keyName' }),
        { 
          status: 400, 
          headers: { 
            ...corsHeaders,
            "Content-Type": "application/json" 
          } 
        }
      );
    }

    // Get the Supabase client from Deno's runtime environment
    const supabaseClient = Deno.env.get("SUPABASE_CLIENT");
    
    // Get the API key from Supabase
    const apiKey = await getApiKey(supabaseClient, keyName);

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'API key not found' }),
        { 
          status: 404, 
          headers: { 
            ...corsHeaders,
            "Content-Type": "application/json" 
          } 
        }
      );
    }

    // Return the API key
    return new Response(
      JSON.stringify({ apiKey }),
      { 
        status: 200, 
        headers: { 
          ...corsHeaders,
          "Content-Type": "application/json" 
        } 
      }
    );
  } catch (error) {
    console.error('Error handling request:', error);
    
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { 
          ...corsHeaders,
          "Content-Type": "application/json" 
        } 
      }
    );
  }
});
