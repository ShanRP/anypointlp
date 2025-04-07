
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 204 })
  }

  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing environment variables: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
      return new Response(
        JSON.stringify({ 
          error: 'Server configuration error',
          sessions: [] 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Get auth header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ 
          error: 'No authorization header provided',
          sessions: [] 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }
    
    // Get the token from the auth header
    const token = authHeader.replace('Bearer ', '')
    
    // Verify the user with the token
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)
    
    if (userError || !user) {
      console.error('User verification error:', userError)
      return new Response(
        JSON.stringify({ 
          error: 'Invalid token or user not found',
          sessions: [] 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }
    
    console.log(`Fetching session for user ${user.id}`)
    
    // Extract session ID from token
    const currentSessionId = token.split('.')[0];
    
    // Create a single session object for the current session
    const currentSession = {
      id: currentSessionId,
      created_at: new Date().toISOString(),
      user_agent: req.headers.get('User-Agent') || 'Unknown',
      ip_address: req.headers.get('X-Forwarded-For') || 'Unknown',
      last_active_at: new Date().toISOString(),
      isCurrentDevice: true
    };
    
    // Return only the current session
    return new Response(
      JSON.stringify({ sessions: [currentSession] }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    console.error('Unexpected error:', error)
    
    // Create a fallback session from the current request
    const currentSession = {
      id: req.headers.get('Authorization')?.replace('Bearer ', '').split('.')[0] || 'unknown',
      created_at: new Date().toISOString(),
      user_agent: req.headers.get('User-Agent') || 'Unknown',
      ip_address: req.headers.get('X-Forwarded-For') || 'Unknown',
      last_active_at: new Date().toISOString(),
      isCurrentDevice: true
    }
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        message: error.message,
        sessions: [currentSession] 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  }
})
