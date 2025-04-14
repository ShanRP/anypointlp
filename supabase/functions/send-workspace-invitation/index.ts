
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
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const APP_URL = Deno.env.get("APP_URL") || "http://localhost:8080";

    // Validate required environment variables
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
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

    console.log(`Processing invitation for ${email} to workspace ${workspaceId}`);

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

    console.log("Workspace found:", workspace.name);

    // First check if the user with this email already exists in auth.users
    const { data: existingUser, error: userCheckError } = await supabase.auth.admin.listUsers({
      perPage: 1,
      page: 1,
      filter: {
        email: email
      }
    });

    if (userCheckError) {
      console.error("Error checking user existence:", userCheckError);
    }

    // Create the invitation record directly if needed
    const { data: inviteData, error: inviteError } = await supabase
      .from("apl_workspace_invitations")
      .insert([
        {
          workspace_id: workspaceId,
          email: email,
          status: "pending",
          created_by: workspace.user_id // The owner of the workspace
        }
      ])
      .select()
      .single();

    if (inviteError) {
      console.error("Error creating invitation record:", inviteError);
      
      // Check if it's a unique constraint violation (already invited)
      if (inviteError.code === '23505') {
        return new Response(
          JSON.stringify({ error: "User has already been invited to this workspace" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: inviteError.message || "Failed to create invitation" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Invitation record created successfully:", inviteData?.id);

    // Generate a magic link using Supabase Auth
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

    console.log("Magic link generated successfully");

    // Send email using Supabase's email service
    const inviteLink = tokenData.properties.action_link;
    const inviterDisplay = inviterName || "A user";
    
    const { error: emailError } = await supabase.auth.admin.inviteUserByEmail(email, {
      redirectTo: inviteLink,
      data: {
        workspace_id: workspaceId,
        workspace_name: workspace.name,
        inviter_name: inviterDisplay
      }
    });

    if (emailError) {
      console.error("Error sending invitation email:", emailError);
      return new Response(
        JSON.stringify({ error: "Failed to send invitation email: " + emailError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Invitation email sent successfully to:", email);

    return new Response(
      JSON.stringify({ success: true, message: "Invitation sent successfully" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error sending invitation:", error);
    return new Response(
      JSON.stringify({ error: error.message || "An unexpected error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
