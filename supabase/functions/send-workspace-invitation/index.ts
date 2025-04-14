
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

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
    // Get environment variables
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const APP_URL = Deno.env.get("APP_URL") || "http://localhost:8080";

    // Log environment variables
    console.log("Environment Variables:");
    console.log(`SUPABASE_URL: ${SUPABASE_URL ? "Set" : "Not set"}`);
    console.log(`SUPABASE_SERVICE_ROLE_KEY: ${SUPABASE_SERVICE_ROLE_KEY ? "Set" : "Not set"}`);
    console.log(`APP_URL: ${APP_URL}`);

    // Validate required environment variables
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error("Missing required Supabase environment variables");
      return new Response(
        JSON.stringify({ error: "Missing Supabase configuration" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request
    const { workspaceId, email, inviterName } = await req.json();

    // Validate request
    if (!workspaceId || !email) {
      return new Response(
        JSON.stringify({ error: "Missing required fields (workspaceId, email)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Processing invitation for workspace: ${workspaceId}, email: ${email}`);

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

    console.log(`Found workspace: ${workspace.name}`);

    // Create the invitation in the database
    const { data: invitation, error: inviteError } = await supabase.rpc(
      "apl_invite_user_to_workspace",
      {
        workspace_id_param: workspaceId,
        email_param: email
      }
    );

    if (inviteError) {
      console.error("Error creating invitation:", inviteError);
      return new Response(
        JSON.stringify({ error: inviteError?.message || "Failed to create invitation" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Invitation created in database");

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

    console.log("Generated invitation link");
    console.log("Sending email using Supabase auth service...");

    // The magic link email will be automatically sent by Supabase Auth

    return new Response(
      JSON.stringify({ success: true, message: "Invitation sent successfully" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error processing invitation:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
