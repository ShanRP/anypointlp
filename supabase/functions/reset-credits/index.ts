
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    // Create a Supabase client with the service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: 'Missing environment variables' }),
        { headers: { 'Content-Type': 'application/json' }, status: 500 }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get current time
    const now = new Date();
    
    // Reset credits for users whose reset_date has passed
    const { data, error } = await supabase
      .from('apl_user_credits')
      .update({
        credits_used: 0,
        reset_date: new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate() + 1
        ).toISOString()
      })
      .lt('reset_date', now.toISOString())
      .select();
      
    if (error) {
      console.error('Error resetting credits:', error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { headers: { 'Content-Type': 'application/json' }, status: 500 }
      );
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Credits reset successfully',
        usersAffected: data?.length || 0
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in reset-credits function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { 'Content-Type': 'application/json' }, status: 500 }
    );
  }
})
