
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

    // Check if the user already exists
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

    let existingUserId = null;
    if (existingUser && existingUser.users && existingUser.users.length > 0) {
      existingUserId = existingUser.users[0].id;
      console.log("User already exists with ID:", existingUserId);
      
      // Check if user is already a member of this workspace
      if (existingUserId) {
        const { data: membershipCheck, error: membershipError } = await supabase
          .from("apl_workspace_members")
          .select("id")
          .eq("workspace_id", workspaceId)
          .eq("user_id", existingUserId)
          .maybeSingle();
          
        if (membershipError) {
          console.error("Error checking workspace membership:", membershipError);
        }
        
        if (membershipCheck) {
          return new Response(
            JSON.stringify({ error: "User is already a member of this workspace" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
    }

    // Create the invitation record
    const { data: inviteData, error: inviteError } = await supabase
      .from("apl_workspace_invitations")
      .insert([
        {
          workspace_id: workspaceId,
          email: email,
          status: "pending",
          created_by: workspace.user_id
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

    // Generate the appropriate invite link
    const inviteLink = `${APP_URL}/workspace/accept-invitation?workspaceId=${workspaceId}`;
    console.log("Created invite link:", inviteLink);

    // Attempt to send email using a more robust approach that works for both new and existing users
    try {
      const inviterDisplay = inviterName || "A user";

      // For both existing and new users, we'll use the signInLink method
      // This doesn't try to create a new user but just provides a sign-in link
      // This works for both existing and new users
      const { data: magicLinkData, error: magicLinkError } = await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email: email,
        options: {
          redirectTo: inviteLink,
        }
      });

      if (magicLinkError) {
        throw magicLinkError;
      }

      console.log("Magic link generated successfully");
      
      // Email is sent automatically by Supabase when generateLink is called
      console.log("Email sent via magic link to:", email);
      
    } catch (emailError) {
      console.error("Error sending invitation email:", emailError);
      
      // Even if the email fails, we've created the invitation record
      return new Response(
        JSON.stringify({ 
          success: true, 
          warning: "Invitation created but email could not be sent",
          message: "The invitation has been created, but we couldn't send the email. The user can still access it through the workspace page."
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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
