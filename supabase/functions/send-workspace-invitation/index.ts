
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
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

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
    const { data: existingUsers, error: userCheckError } = await supabase.auth.admin.listUsers({
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
    if (existingUsers && existingUsers.users && existingUsers.users.length > 0) {
      existingUserId = existingUsers.users[0].id;
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

    const inviterDisplay = inviterName || "A user";
    const subject = `Invitation to join workspace "${workspace.name}"`;
    const emailHtml = `
      <h1>Workspace Invitation</h1>
      <p>${inviterDisplay} has invited you to join the workspace "${workspace.name}".</p>
      <p>Click the button below to accept the invitation:</p>
      <p>
        <a href="${inviteLink}" style="display: inline-block; background-color: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">
          Accept Invitation
        </a>
      </p>
      <p>If the button doesn't work, copy and paste this URL into your browser:</p>
      <p>${inviteLink}</p>
      <p>This invitation will expire in 7 days.</p>
    `;

    try {
      if (existingUserId) {
        // For existing users, use a custom email instead of sendEmail (which doesn't exist)
        console.log("Sending email to existing user using raw email");
        
        // Use the createEmailLink method with the service role client to get a magic link
        const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
          type: "magiclink",
          email: email,
          options: {
            redirectTo: inviteLink
          }
        });
        
        if (linkError) {
          throw linkError;
        }
        
        // Now use the emailPasswordReset function to send a custom email
        const { error: emailError } = await supabase.auth.resetPasswordForEmail(
          email,
          {
            redirectTo: inviteLink
          }
        );
        
        if (emailError) {
          throw emailError;
        }
      } else {
        // For new users, use invite user
        console.log("Inviting new user with email invite");
        
        const { error: inviteError } = await supabase.auth.admin.inviteUserByEmail(
          email,
          {
            redirectTo: inviteLink,
            data: {
              workspace_id: workspaceId,
              workspace_name: workspace.name,
              inviter_name: inviterDisplay
            }
          }
        );
        
        if (inviteError) {
          throw inviteError;
        }
      }
      
      console.log("Invitation email sent successfully to:", email);
      
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
