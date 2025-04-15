
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase admin client with service role key to bypass RLS
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );
    
    // Get all pro users
    const { data: proUsers, error: fetchError } = await supabaseAdmin
      .from('apl_user_credits')
      .select('id, user_id, credits_used, is_pro')
      .eq('is_pro', true);
      
    if (fetchError) {
      throw new Error(`Error fetching pro users: ${fetchError.message}`);
    }
    
    const now = new Date();
    const results = [];
    
    // Add 100 credits to each pro user's account
    for (const user of proUsers) {
      const { error: updateError } = await supabaseAdmin
        .from('apl_user_credits')
        .update({
          credits_used: Math.max(0, user.credits_used - 100), // Add credits by reducing credits_used
          updated_at: now.toISOString()
        })
        .eq('id', user.id);
        
      results.push({
        user_id: user.user_id,
        success: !updateError,
        error: updateError ? updateError.message : null
      });
      
      if (updateError) {
        console.error(`Error updating credits for user ${user.user_id}:`, updateError);
      }
    }
    
    return new Response(JSON.stringify({
      processed: proUsers.length,
      results: results
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error('Error processing monthly credit topup:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
