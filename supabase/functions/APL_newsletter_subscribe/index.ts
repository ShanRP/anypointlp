
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

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
    if (!email || !email.includes('@')) {
      return new Response(
        JSON.stringify({ error: "Invalid email format" }),
        { 
          status: 400, 
          headers: { "Content-Type": "application/json", ...corsHeaders } 
        }
      );
    }

    // In a real implementation, we would:
    // 1. Store the email in a database table
    // 2. Send a confirmation email
    
    console.log(`Newsletter subscription received for: ${email}`);
    
    // Simulate sending an email (in production this would call an email service API)
    const emailSent = await sendThankYouEmail(email);
    
    if (!emailSent.success) {
      throw new Error("Failed to send confirmation email");
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
    console.log(`📧 Simulated email sent to ${email} with newsletter subscription confirmation`);
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
    
    // Return success
    return { success: true };
  } catch (error) {
    console.error("Error sending email:", error);
    return { success: false, error };
  }
};

serve(handler);
