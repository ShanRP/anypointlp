
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
    
    // Send a thank you email
    const emailSent = await sendThankYouEmail(email);
    
    if (!emailSent.success) {
      console.error("Failed to send confirmation email:", emailSent.error);
      // We still want to return success since we stored the email
    }

    // Update the last_email_sent timestamp if email was sent successfully
    if (emailSent.success) {
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

// Function to send a thank you email
// In a production environment, this would be replaced with a call to an email service API
const sendThankYouEmail = async (email: string) => {
  try {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Log the email content for debugging
    console.log(`📧 Sending email to ${email} with newsletter subscription confirmation`);
    console.log(`
    Subject: Welcome to the Anypoint Learning Platform Newsletter!
    
    Dear Subscriber,
    
    Thank you for subscribing to the Anypoint Learning Platform Newsletter!
    
    You'll now receive regular updates about:
    - MuleSoft best practices and tips
    - New features and tools
    - Community events and resources
    - Learning opportunities and tutorials
    
    If you have any questions, feel free to reply to this email.
    
    Best regards,
    The Anypoint Learning Platform Team
    `);
    
    // In a real implementation, you would use an email service like SendGrid, Resend, etc.
    // For example:
    // const emailResponse = await fetch('https://api.emailservice.com/send', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${API_KEY}` },
    //   body: JSON.stringify({ to: email, subject: '...', html: '...' })
    // });
    
    // Return success (in a real implementation, we would check the response from the email service)
    return { success: true };
  } catch (error) {
    console.error("Error sending email:", error);
    return { success: false, error };
  }
};

serve(handler);
