
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
    // Create Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing environment variables: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
      throw new Error('Server configuration error')
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Get auth header from request
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header provided' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }
    
    // Get the token
    const token = authHeader.replace('Bearer ', '')
    
    // Verify the user with the token
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)
    
    if (userError || !user) {
      console.error('User verification error:', userError)
      return new Response(
        JSON.stringify({ error: 'Invalid token or user not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }
    
    // Get the session ID from the request body
    const { sessionId } = await req.json()
    
    if (!sessionId) {
      return new Response(
        JSON.stringify({ error: 'No session ID provided' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    console.log(`Attempting to sign out session ${sessionId} for user ${user.id}`)
    
    // Use the admin API to revoke the specific session
    const { error } = await supabase.auth.admin.signOut(sessionId)
    
    if (error) {
      console.error('Error signing out session:', error)
      
      // If the specific session signout fails, try signing out by user ID
      try {
        const { error: userSignOutError } = await supabase.auth.admin.signOut({
          userId: user.id,
          sessionId: sessionId
        })
        
        if (userSignOutError) {
          console.error('Error signing out user session:', userSignOutError)
          return new Response(
            JSON.stringify({ 
              error: 'Failed to sign out session', 
              details: userSignOutError.message 
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
          )
        }
        
        return new Response(
          JSON.stringify({ success: true, message: 'Session signed out successfully' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )
      } catch (fallbackError) {
        console.error('Error with fallback sign out:', fallbackError)
        return new Response(
          JSON.stringify({ 
            error: 'Failed to sign out session', 
            details: fallbackError.message 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        )
      }
    }
    
    return new Response(
      JSON.stringify({ success: true, message: 'Session signed out successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        message: error.message 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
