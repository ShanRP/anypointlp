
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

  try {
    // This function should be triggered by a cron job or admin
    const authHeader = req.headers.get('Authorization');
    const isAdminRequest = authHeader && authHeader.startsWith('Bearer ');
    
    if (!isAdminRequest) {
      // For scheduled cron jobs, validate with a simple key check
      const { key } = await req.json();
      const expectedKey = Deno.env.get('CRON_SECRET_KEY');
      
      if (!key || key !== expectedKey) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
        );
      }
    } else {
      // For admin requests, validate the JWT
      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: userError } = await supabase.auth.getUser(token);
      
      if (userError || !user) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
        );
      }
      
      // Check if user is an admin (implement your admin check logic here)
      // For example:
      const { data: profile, error: profileError } = await supabase
        .from('apl_profiles')
        .select('role')
        .eq('user_id', user.id)
        .single();
        
      if (profileError || !profile || profile.role !== 'admin') {
        return new Response(
          JSON.stringify({ error: 'Admin access required' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
        );
      }
    }
    
    // Process the monthly credits top-up for Pro users
    const { data: proUsers, error: usersError } = await supabase
      .from('apl_user_credits')
      .select('id, user_id, credits_limit')
      .eq('is_pro', true);
      
    if (usersError) {
      console.error('Error fetching pro users:', usersError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch pro users' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }
    
    if (!proUsers || proUsers.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No pro users found', count: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }
    
    // Update each pro user with a credits reset
    const results = [];
    
    for (const user of proUsers) {
      // Pro users get 100 credits per month
      const { data, error } = await supabase
        .from('apl_user_credits')
        .update({
          credits_used: 0,
          credits_limit: 100,
          reset_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        })
        .eq('id', user.id)
        .select();
        
      results.push({
        user_id: user.user_id,
        success: !error,
        error: error ? error.message : null
      });
    }
    
    return new Response(
      JSON.stringify({ 
        message: 'Monthly credits processed',
        count: proUsers.length,
        results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('Error in monthly-credit-topup:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
