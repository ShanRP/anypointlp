
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SubscribeRequest {
  email: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the email from the request body
    const { email }: SubscribeRequest = await req.json();

    // Validate the email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: "Invalid email format" }),
        { 
          status: 400, 
          headers: { "Content-Type": "application/json", ...corsHeaders } 
        }
      );
    }

    // Initialize Supabase client with service role key for RLS bypass
    // The service role key is stored as a secret in the Supabase platform
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Check if the email already exists
    const { data: existingSubscriber, error: lookupError } = await supabaseAdmin
      .from("apl_newsletter_subscribers")
      .select("id, email")
      .eq("email", email)
      .single();
    
    if (lookupError && lookupError.code !== "PGRST116") { // PGRST116 is "no rows returned" error
      throw new Error(`Error checking existing subscriber: ${lookupError.message}`);
    }

    if (existingSubscriber) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `${email} is already subscribed to our newsletter. Thank you for your continued interest!`,
          alreadySubscribed: true
        }),
        { 
          status: 200, 
          headers: { "Content-Type": "application/json", ...corsHeaders } 
        }
      );
    }

    // Insert the email into the subscribers table
    const { error: insertError } = await supabaseAdmin
      .from("apl_newsletter_subscribers")
      .insert([{ email, status: "active" }]);

    if (insertError) {
      throw new Error(`Error saving subscriber: ${insertError.message}`);
    }
    
    console.log(`Newsletter subscription received for: ${email}`);
    
    // Call the database function to send welcome email, which uses the service role key securely from database settings
    const { data: emailResult, error: functionError } = await supabaseAdmin.rpc(
      'send_welcome_email',
      { subscriber_email: email }
    );

    if (functionError) {
      console.error("Error calling send_welcome_email function:", functionError);
      // We still want to return success since we stored the email
    } else {
      console.log("Welcome email function called successfully:", emailResult);
    }

    // Return success response
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Successfully subscribed ${email} to the newsletter. Confirmation email sent.` 
      }),
      { 
        status: 200, 
        headers: { "Content-Type": "application/json", ...corsHeaders } 
      }
    );
  } catch (error: any) {
    console.error("Error in newsletter subscribe function:", error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { "Content-Type": "application/json", ...corsHeaders } 
      }
    );
  }
};

serve(handler);
