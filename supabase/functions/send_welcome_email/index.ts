
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@1.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  email: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const resend = new Resend(Deno.env.get("RESEND_API_KEY") ?? "");

    // Get email from the request body
    const { email }: EmailRequest = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        { 
          status: 400, 
          headers: { "Content-Type": "application/json", ...corsHeaders } 
        }
      );
    }

    console.log(`Sending welcome email to ${email}`);

    // Email content with product information and future updates
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
    </html>`;

    // Send the welcome email using Resend
    const { data, error } = await resend.emails.send({
      from: "Anypoint Learning Platform <onboarding@resend.dev>",
      to: email,
      subject: "Welcome to the Anypoint Learning Platform Newsletter!",
      html: emailHtml,
    });

    if (error) {
      console.error("Error sending email:", error);
      throw new Error(`Email sending failed: ${error.message}`);
    }

    console.log("Email sent successfully:", data);

    // Update the last_email_sent timestamp in the database
    const { error: updateError } = await supabaseClient
      .from("apl_newsletter_subscribers")
      .update({ last_email_sent: new Date().toISOString() })
      .eq("email", email);

    if (updateError) {
      console.error("Error updating last_email_sent:", updateError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Welcome email sent successfully",
        emailId: data?.id
      }),
      { 
        status: 200, 
        headers: { "Content-Type": "application/json", ...corsHeaders } 
      }
    );
  } catch (error: any) {
    console.error("Error in send_welcome_email function:", error);
    
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
