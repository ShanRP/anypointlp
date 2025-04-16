
import { serve } from "https://deno.land/std@0.131.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.23.0";
import * as z from "https://deno.land/x/zod@v3.21.4/mod.ts";

// Set up CORS headers for browser requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Create request schema using Zod
const inviteRequestSchema = z.object({
  type: z.literal("tool"),
  name: z.literal("send-invitation"),
  arguments: z.object({
    workspaceId: z.string().uuid(),
    email: z.string().email(),
    inviterName: z.string().optional(),
  }),
});

// Main handler function
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get environment variables for Supabase connection
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const APP_URL = Deno.env.get("APP_URL") || "https://app.anypointlearningplatform.com";

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing Supabase environment variables");
    }

    // Create Supabase admin client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Parse and validate request body
    const body = await req.json();
    const validationResult = inviteRequestSchema.safeParse(body);
    
    if (!validationResult.success) {
      console.error("Validation error:", validationResult.error);
      return new Response(
        JSON.stringify({
          content: [{ type: "text", text: JSON.stringify({ error: "Invalid request format" }) }],
          isError: true,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const { workspaceId, email, inviterName } = validationResult.data.arguments;
    
    // Get the workspace details - only select what's needed
    const { data: workspace, error: workspaceError } = await supabase
      .from("apl_workspaces")
      .select("name, user_id")
      .eq("id", workspaceId)
      .single();

    if (workspaceError || !workspace) {
      console.error("Error fetching workspace:", workspaceError);
      return new Response(
        JSON.stringify({
          content: [{ type: "text", text: JSON.stringify({ error: "Workspace not found" }) }],
          isError: true,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Workspace found:", workspace.name);

    // Check if the user already exists - only fetch necessary fields
    const { data: existingUsers, error: userCheckError } = await supabase.auth.admin.listUsers({
      perPage: 1,
      page: 1,
      filter: {
        email: email,
      },
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
            JSON.stringify({
              content: [{ type: "text", text: JSON.stringify({ error: "User is already a member of this workspace" }) }],
              isError: true,
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
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
          created_by: workspace.user_id,
        },
      ])
      .select("id") // Only select ID to minimize data transfer
      .single();

    if (inviteError) {
      console.error("Error creating invitation record:", inviteError);

      // Check if it's a unique constraint violation (already invited)
      if (inviteError.code === "23505") {
        return new Response(
          JSON.stringify({
            content: [{ type: "text", text: JSON.stringify({ error: "User has already been invited to this workspace" }) }],
            isError: true,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({
          content: [{ type: "text", text: JSON.stringify({ error: inviteError.message || "Failed to create invitation" }) }],
          isError: true,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
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
      // Use inviteUserByEmail for all users (both new and existing)
      console.log("Sending invitation email to:", email);

      const { data, error: emailError } = await supabase.auth.admin.inviteUserByEmail(email, {
        redirectTo: inviteLink,
        data: {
          workspace_id: workspaceId,
          workspace_name: workspace.name,
          inviter_name: inviterDisplay,
        },
      });

      if (emailError) {
        throw emailError;
      }

      console.log("Invitation email sent successfully to:", email);

      return new Response(
        JSON.stringify({
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: true,
                message: "Invitation sent successfully",
              }),
            },
          ],
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } catch (emailError) {
      console.error("Error sending invitation email:", emailError);

      // Even if the email fails, we've created the invitation record
      return new Response(
        JSON.stringify({
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: true,
                warning: "Invitation created but email could not be sent",
                message: "The invitation has been created, but we couldn't send the email. The user can still access it through the workspace page.",
              }),
            },
          ],
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("Error in invitation process:", error);
    return new Response(
      JSON.stringify({
        content: [{ type: "text", text: JSON.stringify({ error: error.message || "An unexpected error occurred" }) }],
        isError: true,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
