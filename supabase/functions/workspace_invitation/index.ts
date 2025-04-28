
import { serve } from "https://deno.land/std@0.131.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.23.0";
import * as z from "https://deno.land/x/zod@v3.21.4/mod.ts";
import nodemailer from "npm:nodemailer@6.9.10";

// Set up CORS headers for browser requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

// Schema for sending invitation
const inviteRequestSchema = z.object({
  type: z.literal("tool"),
  name: z.literal("send-invitation"),
  arguments: z.object({
    workspaceId: z.string().uuid(),
    email: z.string().email(),
    inviterName: z.string().optional()
  })
});

// Schema for verifying/accepting invitation
const invitationActionSchema = z.object({
  token: z.string().uuid(),
  workspaceId: z.string().uuid(),
  email: z.string().email().optional()
});

// Main handler function
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders
    });
  }

  try {
    // Get environment variables
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const APP_URL = Deno.env.get("APP_URL") || "http://localhost:3000";

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing Supabase environment variables");
    }

    // Create Supabase admin client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Generate request ID for logging
    const requestId = crypto.randomUUID();
    console.log(`Processing request ${requestId}`);

    // Parse request body
    const body = await req.json();
    console.log(`Request body:`, body);

    // Handle sending invitation
    if (body.type === "tool" && body.name === "send-invitation") {
      const validationResult = inviteRequestSchema.safeParse(body);
      if (!validationResult.success) {
        console.error(`Invalid request format:`, validationResult.error);
        return new Response(
          JSON.stringify({ error: "Invalid request format" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
      }

      const { workspaceId, email, inviterName } = validationResult.data.arguments;

      // Verify JWT token
      const authHeader = req.headers.get("Authorization");
      if (!authHeader) {
        return new Response(
          JSON.stringify({ error: "Unauthorized" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
        );
      }

      const token = authHeader.replace("Bearer ", "");
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      
      if (authError || !user) {
        return new Response(
          JSON.stringify({ error: "Invalid authentication" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
        );
      }

      // Check if workspace exists
      const { data: workspace, error: workspaceError } = await supabase
        .from("apl_workspaces")
        .select("name")
        .eq("id", workspaceId)
        .single();

      if (workspaceError || !workspace) {
        return new Response(
          JSON.stringify({ error: "Workspace not found" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
        );
      }

      // Check if user is already a member
      const { data: membership } = await supabase
        .from("apl_workspace_members")
        .select("id")
        .eq("workspace_id", workspaceId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (membership) {
        return new Response(
          JSON.stringify({ error: "User is already a member of this workspace" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
      }

      // Generate invitation token
      const inviteToken = crypto.randomUUID();

      // Create invitation record
      const { error: inviteError } = await supabase
        .from("apl_workspace_invitations")
        .insert({
          workspace_id: workspaceId,
          email: email,
          status: "pending",
          created_by: user.id,
          token: inviteToken
        });

      if (inviteError) {
        console.error("Error creating invitation:", inviteError);
        return new Response(
          JSON.stringify({ error: "Failed to create invitation" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
        );
      }

      // Send email
      try {
        const transport = nodemailer.createTransport({
          host: Deno.env.get("SMTP_HOSTNAME"),
          port: Number(Deno.env.get("SMTP_PORT")),
          secure: Boolean(Deno.env.get("SMTP_SECURE") === "true"),
          auth: {
            user: Deno.env.get("SMTP_USERNAME"),
            pass: Deno.env.get("SMTP_PASSWORD")
          }
        });

        const inviteUrl = `${APP_URL}/workspace/accept-invitation?workspaceId=${workspaceId}&token=${inviteToken}`;
        
        await transport.sendMail({
          from: Deno.env.get("SMTP_FROM") || "noreply@example.com",
          to: email,
          subject: `Invitation to join workspace "${workspace.name}"`,
          html: `
            <h1>Workspace Invitation</h1>
            <p>${inviterName || "Someone"} has invited you to join the workspace "${workspace.name}"</p>
            <p><a href="${inviteUrl}">Click here to accept the invitation</a></p>
          `
        });

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } catch (emailError) {
        console.error("Error sending email:", emailError);
        return new Response(
          JSON.stringify({ error: "Failed to send invitation email" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
        );
      }
    } 
    // Handle verifying/accepting invitation
    else {
      const validationResult = invitationActionSchema.safeParse(body);
      if (!validationResult.success) {
        return new Response(
          JSON.stringify({ error: "Invalid request format" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
      }

      const { token, workspaceId, email } = validationResult.data;

      // Get invitation details
      const { data: invitation, error: inviteError } = await supabase
        .from("apl_workspace_invitations")
        .select("*")
        .eq("token", token)
        .eq("workspace_id", workspaceId)
        .single();

      if (inviteError || !invitation) {
        return new Response(
          JSON.stringify({ error: "Invalid invitation" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
        );
      }

      // Verify JWT token if accepting invitation
      if (email) {
        const authHeader = req.headers.get("Authorization");
        if (!authHeader) {
          return new Response(
            JSON.stringify({ error: "Unauthorized" }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
          );
        }

        const jwtToken = authHeader.replace("Bearer ", "");
        const { data: { user }, error: authError } = await supabase.auth.getUser(jwtToken);
        
        if (authError || !user || user.email !== email) {
          return new Response(
            JSON.stringify({ error: "Invalid authentication" }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
          );
        }

        // Check if already a member
        const { data: existingMember } = await supabase
          .from("apl_workspace_members")
          .select()
          .eq("workspace_id", workspaceId)
          .eq("user_id", user.id)
          .maybeSingle();

        if (existingMember) {
          return new Response(
            JSON.stringify({ alreadyMember: true }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Add to workspace
        const { error: memberError } = await supabase
          .from("apl_workspace_members")
          .insert({
            workspace_id: workspaceId,
            user_id: user.id,
            role: "member"
          });

        if (memberError) {
          console.error("Error adding member:", memberError);
          return new Response(
            JSON.stringify({ error: "Failed to add member to workspace" }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
          );
        }

        // Update invitation status
        await supabase
          .from("apl_workspace_invitations")
          .update({
            status: "accepted",
            accepted_at: new Date().toISOString(),
            accepted_by: user.id
          })
          .eq("id", invitation.id);

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Just verifying invitation
      return new Response(
        JSON.stringify({
          valid: true,
          email: invitation.email,
          status: invitation.status
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
