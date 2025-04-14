
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { SmtpClient } from "https://deno.land/x/smtp@v0.7.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const SMTP_HOST = Deno.env.get("SMTP_HOST") || "";
    const SMTP_PORT = parseInt(Deno.env.get("SMTP_PORT") || "587");
    const SMTP_USERNAME = Deno.env.get("SMTP_USERNAME") || "";
    const SMTP_PASSWORD = Deno.env.get("SMTP_PASSWORD") || "";
    const SMTP_FROM_EMAIL = Deno.env.get("SMTP_FROM_EMAIL") || "noreply@example.com";
    const APP_URL = Deno.env.get("APP_URL") || "http://localhost:8080";

    // Validate required environment variables
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !SMTP_HOST || !SMTP_USERNAME || !SMTP_PASSWORD) {
      console.error("Missing required environment variables");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request
    const { workspaceId, email, inviterName } = await req.json();

    // Validate request
    if (!workspaceId || !email) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client with service role key
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get the workspace details
    const { data: workspace, error: workspaceError } = await supabase
      .from("apl_workspaces")
      .select("name, user_id")
      .eq("id", workspaceId)
      .single();

    if (workspaceError || !workspace) {
      console.error("Error fetching workspace:", workspaceError);
      return new Response(
        JSON.stringify({ error: "Workspace not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create the invitation in the database
    const { data: invitation, error: inviteError } = await supabase.rpc(
      "apl_invite_user_to_workspace",
      {
        workspace_id_param: workspaceId,
        email_param: email
      }
    );

    if (inviteError || !invitation) {
      console.error("Error creating invitation:", inviteError);
      return new Response(
        JSON.stringify({ error: inviteError?.message || "Failed to create invitation" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate a short-lived JWT token for invitation
    const { data: tokenData, error: tokenError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: email,
      options: {
        redirectTo: `${APP_URL}/workspace/accept-invitation?workspaceId=${workspaceId}`,
      },
    });

    if (tokenError || !tokenData) {
      console.error("Error generating invitation link:", tokenError);
      return new Response(
        JSON.stringify({ error: "Failed to generate invitation link" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Connect to the SMTP server
    const client = new SmtpClient();
    await client.connectTLS({
      hostname: SMTP_HOST,
      port: SMTP_PORT,
      username: SMTP_USERNAME,
      password: SMTP_PASSWORD,
    });

    // Prepare HTML email content
    const inviteLink = tokenData.properties.action_link;
    const inviterDisplay = inviterName || "A user";
    const htmlContent = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; margin-bottom: 20px; }
            .button { display: inline-block; padding: 10px 20px; background-color: #4f46e5; color: white; 
                      text-decoration: none; border-radius: 5px; font-weight: bold; }
            .footer { margin-top: 30px; font-size: 12px; color: #666; text-align: center; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>Workspace Invitation</h2>
            </div>
            
            <p>Hello,</p>
            
            <p>${inviterDisplay} has invited you to join the workspace "${workspace.name}" on Anypoint Learning Platform.</p>
            
            <p>Click the button below to accept this invitation:</p>
            
            <p style="text-align: center; margin: 30px 0;">
              <a href="${inviteLink}" class="button">Accept Invitation</a>
            </p>
            
            <p>If you don't have an account yet, you'll be able to create one when you follow the link.</p>
            
            <p>If you didn't expect this invitation, you can safely ignore this email.</p>
            
            <div class="footer">
              <p>This invitation is valid for 7 days.</p>
              <p>© 2025 Anypoint Learning Platform</p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Send the email
    await client.send({
      from: SMTP_FROM_EMAIL,
      to: email,
      subject: `Workspace Invitation: ${workspace.name}`,
      content: htmlContent,
      html: htmlContent,
    });

    await client.close();

    return new Response(
      JSON.stringify({ success: true, message: "Invitation sent successfully" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error sending invitation:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
