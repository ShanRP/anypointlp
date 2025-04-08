
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
    // In a real implementation, you would use an email service API
    // Here we're simulating the email sending process
    
    console.log(`Sending email to ${email}`);
    
    // Email content with more information about the product and future updates
    const emailContent = `
    Subject: Welcome to the Anypoint Learning Platform Newsletter!
    
    Dear Subscriber,
    
    Thank you for subscribing to the Anypoint Learning Platform Newsletter! We're excited to have you join our community of MuleSoft enthusiasts and API developers.
    
    With your subscription, you'll receive:
    
    1. Latest updates on MuleSoft and API development best practices
    2. Exclusive tutorials and guides for building better integrations
    3. Early access to new features and tools we're developing
    4. Invitations to webinars and online events
    5. Tips and tricks from industry experts
    
    We're constantly working on enhancing our platform with new features, including:
    
    - Advanced AI-powered MuleSoft flow generation
    - Interactive DataWeave transformation tools
    - Comprehensive API documentation generators
    - Integration with popular CI/CD pipelines
    - Enhanced visualization tools for your API ecosystem
    
    You'll be the first to know when these exciting features are released!
    
    If you have any questions or feedback, feel free to reply to this email or contact our support team.
    
    Thank you again for subscribing, and welcome to the Anypoint Learning Platform community!
    
    Best regards,
    The Anypoint Learning Platform Team
    `;
    
    console.log("Email content:", emailContent);
    
    // Simulate actual email sending by making a call to an email service
    // This is where you would integrate with SendGrid, Mailgun, AWS SES, etc.
    // For now, we'll just log the attempt and return success
    
    // In a real implementation, we would do something like:
    // const response = await fetch('https://api.emailservice.com/send', {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'Authorization': `Bearer ${EMAIL_SERVICE_API_KEY}`
    //   },
    //   body: JSON.stringify({
    //     to: email,
    //     from: 'newsletter@anypointlp.com',
    //     subject: 'Welcome to the Anypoint Learning Platform Newsletter!',
    //     html: emailContent
    //   })
    // });
    // return { success: response.ok };
    
    // For this implementation, we'll assume the email was sent successfully
    console.log(`Email successfully sent to ${email}`);
    return { success: true };
  } catch (error) {
    console.error("Error sending email:", error);
    return { success: false, error };
  }
};

serve(handler);
