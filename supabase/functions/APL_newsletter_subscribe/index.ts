
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
    
    // Call the send_welcome_email edge function securely
    const welcomeEmailResponse = await fetch(
      `${Deno.env.get("SUPABASE_URL")}/functions/v1/send_welcome_email`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
        },
        body: JSON.stringify({ email }),
      }
    );
    
    if (!welcomeEmailResponse.ok) {
      const errorData = await welcomeEmailResponse.json();
      console.error("Failed to send welcome email:", errorData);
      // We still want to return success since we stored the email
    } else {
      console.log("Welcome email function called successfully");
      // Update the last_email_sent timestamp
      await supabaseAdmin
        .from("apl_newsletter_subscribers")
        .update({ last_email_sent: new Date().toISOString() })
        .eq("email", email);
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
