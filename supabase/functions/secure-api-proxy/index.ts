
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Create a Supabase client for getting API keys
const supabaseClient = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

/**
 * This is a secure API proxy edge function
 * Instead of exposing API keys in frontend code, we use this proxy
 * to make authenticated API requests with server-side keys
 */
serve(async (req) => {
  try {
    // Get the request details
    const url = new URL(req.url);
    const path = url.searchParams.get("path");
    
    // Authenticate the request
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }
    
    // Verify the user is authenticated through Supabase
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }
    
    if (!path) {
      return new Response(
        JSON.stringify({ error: "Missing API path" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    
    // Determine which API key to use based on the path
    let apiKeyName = "DEFAULT_API_KEY";
    if (path.includes("openai")) {
      apiKeyName = "OPENAI_API_KEY";
    } else if (path.includes("github")) {
      apiKeyName = "GITHUB_API_KEY";
    }
    
    // Get the API key from Supabase
    const { data: apiKey, error: keyError } = await supabaseClient.rpc("get_api_key", { key_name: apiKeyName });
    
    if (keyError || !apiKey) {
      return new Response(
        JSON.stringify({ error: "Could not retrieve API key" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
    
    // Get the request body, if any
    let requestBody = null;
    if (req.method !== "GET" && req.method !== "HEAD") {
      requestBody = await req.json().catch(() => null);
    }
    
    // Forward the request to the actual API
    const response = await fetch(path, {
      method: req.method,
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: requestBody ? JSON.stringify(requestBody) : null,
    });
    
    // Return the API response
    const responseData = await response.json();
    
    return new Response(
      JSON.stringify(responseData),
      { 
        status: response.status, 
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*", 
        } 
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
