
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get email from request body
    const { email } = await req.json();
    
    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        { 
          status: 400, 
          headers: { 
            "Content-Type": "application/json",
            ...corsHeaders 
          }
        }
      );
    }

    // Get the Supabase URL and service role key from environment variables
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    // Create a Supabase client with the service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Create HTML for email
    const emailHtml = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            h1 { color: #5a67d8; }
            h2 { color: #4c51bf; margin-top: 24px; }
            .footer { margin-top: 30px; padding-top: 15px; border-top: 1px solid #ddd; font-size: 14px; color: #666; }
          </style>
        </head>
        <body>
          <h1>Welcome to the Anypoint Learning Platform!</h1>
          <p>Thank you for subscribing to our newsletter! We're excited to have you join our community of MuleSoft enthusiasts and API developers.</p>
          
          <h2>Here's what you can expect:</h2>
          <ul>
            <li>Latest updates on MuleSoft and API development best practices</li>
            <li>Exclusive tutorials and guides for building better integrations</li>
            <li>Early access to new features and tools we're developing</li>
            <li>Invitations to webinars and online events</li>
            <li>Tips and tricks from industry experts</li>
          </ul>
          
          <h2>Coming soon to our platform:</h2>
          <ul>
            <li>Advanced AI-powered MuleSoft flow generation</li>
            <li>Interactive DataWeave transformation tools</li>
            <li>Comprehensive API documentation generators</li>
            <li>Integration with popular CI/CD pipelines</li>
            <li>Enhanced visualization tools for your API ecosystem</li>
          </ul>
          
          <p>You'll be the first to know when these exciting features are released!</p>
          
          <p>If you have any questions or feedback, feel free to reply to this email or contact our support team.</p>
          
          <div class="footer">
            <p>Thank you again for subscribing, and welcome to the Anypoint Learning Platform community!</p>
            <p>Best regards,<br>The Anypoint Learning Platform Team</p>
          </div>
        </body>
      </html>
    `;
    
    // Get the Resend API key from environment variables
    const resendApiKey = Deno.env.get("RESEND_API_KEY")!;
    
    // Send email using Resend API
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${resendApiKey}`
      },
      body: JSON.stringify({
        from: "Anypoint Learning Platform <noreply@anypointlearningplatform.com>",
        to: email,
        subject: "Welcome to the Anypoint Learning Platform Newsletter!",
        html: emailHtml
      })
    });
    
    const result = await response.json();
    console.log("Email sending result:", result);
    
    // Update the last_email_sent timestamp in the database
    await supabase
      .from('apl_newsletter_subscribers')
      .update({ last_email_sent: new Date().toISOString() })
      .eq('email', email);
    
    return new Response(
      JSON.stringify({ success: true, message: "Welcome email sent" }),
      { 
        status: 200, 
        headers: { 
          "Content-Type": "application/json",
          ...corsHeaders 
        } 
      }
    );
  } catch (error) {
    console.error("Error in send-welcome-email function:", error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { 
          "Content-Type": "application/json",
          ...corsHeaders 
        } 
      }
    );
  }
});
