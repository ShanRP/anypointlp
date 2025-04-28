
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

// Schema for accepting invitation
const acceptRequestSchema = z.object({
  token: z.string().uuid(),
  workspaceId: z.string().uuid()
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
    const APP_URL = Deno.env.get("APP_URL") || "https://anypointlp.lovable.app";

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
    const url = new URL(req.url);
    const path = url.pathname;
    
    console.log(`Request ${requestId}: Processing request for path: ${path}`);

    // SENDING INVITATIONS
    if (path.endsWith("/send")) {
      // Parse and validate request body
      const body = await req.json();
      console.log(`Request ${requestId}: Received send invitation payload:`, JSON.stringify(body));
      
      const validationResult = inviteRequestSchema.safeParse(body);
      if (!validationResult.success) {
        console.error(`Request ${requestId} validation error:`, validationResult.error);
        return new Response(JSON.stringify({ error: "Invalid request format" }), { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400
        });
      }

      const { workspaceId, email, inviterName } = validationResult.data.arguments;

      // Check JWT authorization
      const authHeader = req.headers.get("Authorization");
      if (!authHeader) {
        console.error(`Request ${requestId}: Missing authorization header`);
        return new Response(JSON.stringify({ error: "Unauthorized request" }), { 
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        });
      }

      // Extract and verify JWT token
      const token = authHeader.replace("Bearer ", "");
      const { data: { user }, error: jwtError } = await supabase.auth.getUser(token);
      if (jwtError || !user) {
        console.error(`Request ${requestId}: Invalid JWT token`, jwtError);
        return new Response(JSON.stringify({ error: "Unauthorized request" }), { 
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        });
      }

      console.log(`Request ${requestId}: User ${user.id} is inviting ${email} to workspace ${workspaceId}`);

      // Log invitation attempt
      await supabase.from("apl_auth_logs").insert({
        user_id: user.id,
        action: "WORKSPACE_INVITATION",
        device: req.headers.get("user-agent") || "Unknown",
        ip_address: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "Unknown",
        details: {
          workspaceId,
          invitedEmail: email,
          requestId,
          timestamp: new Date().toISOString()
        }
      });

      // Get workspace details
      const { data: workspace, error: workspaceError } = await supabase
        .from("apl_workspaces")
        .select("name, user_id")
        .eq("id", workspaceId)
        .single();

      if (workspaceError || !workspace) {
        console.error(`Request ${requestId}: Error fetching workspace:`, workspaceError);
        return new Response(JSON.stringify({ error: "Workspace not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      console.log(`Request ${requestId}: Workspace found: ${workspace.name}`);

      // Check if user already exists
      const { data: existingUsers, error: userCheckError } = await supabase.auth.admin.listUsers({
        perPage: 1,
        page: 1,
        filter: { email: email }
      });

      if (userCheckError) {
        console.error(`Request ${requestId}: Error checking user existence:`, userCheckError);
      }

      let existingUserId = null;
      if (existingUsers && existingUsers.users && existingUsers.users.length > 0) {
        existingUserId = existingUsers.users[0].id;
        console.log(`Request ${requestId}: User already exists with ID: ${existingUserId}`);

        // Check if user is already a member
        if (existingUserId) {
          const { data: membershipCheck, error: membershipError } = await supabase
            .from("apl_workspace_members")
            .select("id")
            .eq("workspace_id", workspaceId)
            .eq("user_id", existingUserId)
            .maybeSingle();

          if (membershipError) {
            console.error(`Request ${requestId}: Error checking workspace membership:`, membershipError);
          }

          if (membershipCheck) {
            console.log(`Request ${requestId}: User ${existingUserId} is already a member of workspace ${workspaceId}`);
            return new Response(JSON.stringify({ error: "User is already a member of this workspace" }), {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
          }
        }
      }

      // Generate unique token for invitation
      const inviteToken = crypto.randomUUID();
      
      // Create invitation record in database
      const { data: inviteData, error: inviteError } = await supabase
        .from("apl_workspace_invitations")
        .insert([{
          workspace_id: workspaceId,
          email: email,
          status: "pending",
          created_by: user.id,
          token: inviteToken
        }])
        .select("id")
        .single();

      if (inviteError) {
        console.error(`Request ${requestId}: Error creating invitation record:`, inviteError);
        
        // Check if it's a unique constraint violation (already invited)
        if (inviteError.code === "23505") {
          return new Response(JSON.stringify({ error: "User has already been invited to this workspace" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }

        return new Response(JSON.stringify({ error: inviteError.message || "Failed to create invitation" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      console.log(`Request ${requestId}: Invitation record created successfully: ${inviteData?.id}`);

      // Generate the appropriate invite link with token
      const inviteLink = `${APP_URL}/workspace/accept-invitation?workspaceId=${workspaceId}&token=${inviteToken}`;
      console.log(`Request ${requestId}: Created invite link: ${inviteLink}`);

      // Prepare email content
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

      // Send email using Nodemailer
      try {
        console.log(`Request ${requestId}: Attempting to send email via SMTP to ${email}`);
        
        // Get SMTP settings
        const SMTP_HOSTNAME = Deno.env.get("SMTP_HOSTNAME");
        const SMTP_PORT = Deno.env.get("SMTP_PORT");
        const SMTP_USERNAME = Deno.env.get("SMTP_USERNAME");
        const SMTP_PASSWORD = Deno.env.get("SMTP_PASSWORD");
        const SMTP_FROM = Deno.env.get("SMTP_FROM") || "noreply@anypointlearningplatform.com";
        
        // Check if SMTP settings are available
        if (!SMTP_HOSTNAME || !SMTP_PORT || !SMTP_USERNAME || !SMTP_PASSWORD) {
          throw new Error("Missing SMTP configuration");
        }
        
        const transport = nodemailer.createTransport({
          host: SMTP_HOSTNAME,
          port: Number(SMTP_PORT),
          secure: Boolean(Deno.env.get("SMTP_SECURE") === "true"), 
          auth: {
            user: SMTP_USERNAME,
            pass: SMTP_PASSWORD
          }
        });
        
        await new Promise<void>((resolve, reject) => {
          transport.sendMail({
            from: SMTP_FROM,
            to: email,
            subject: subject,
            html: emailHtml
          }, (error) => {
            if (error) {
              console.error(`Request ${requestId}: SMTP email error:`, error);
              return reject(error);
            }
            console.log(`Request ${requestId}: SMTP email sent successfully to ${email}`);
            resolve();
          });
        });

        // Log successful invitation
        await supabase.from("apl_auth_logs").insert({
          user_id: user.id,
          action: "WORKSPACE_INVITATION_SUCCESS",
          device: req.headers.get("user-agent") || "Unknown",
          ip_address: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "Unknown",
          details: {
            workspaceId,
            invitedEmail: email,
            invitationId: inviteData?.id,
            requestId,
            timestamp: new Date().toISOString()
          }
        });

        return new Response(JSON.stringify({ 
          success: true, 
          message: "Invitation sent successfully" 
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      } catch (emailError) {
        console.error(`Request ${requestId}: Error sending invitation email:`, emailError);
        
        // Log the failed email sending
        await supabase.from("apl_auth_logs").insert({
          user_id: user.id,
          action: "WORKSPACE_INVITATION_EMAIL_FAILED",
          device: req.headers.get("user-agent") || "Unknown",
          ip_address: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "Unknown",
          details: {
            workspaceId,
            invitedEmail: email,
            invitationId: inviteData?.id,
            requestId,
            error: emailError.message,
            timestamp: new Date().toISOString()
          }
        });

        // Even if the email fails, we've created the invitation record
        return new Response(JSON.stringify({
          success: true,
          warning: "Invitation created but email could not be sent",
          message: "The invitation has been created, but we couldn't send the email. The user can still access it through the workspace page."
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
    } 
    // VERIFYING INVITATIONS (used by frontend)
    else if (path.endsWith("/verify")) {
      const token = url.searchParams.get("token");
      const workspaceId = url.searchParams.get("workspaceId");
      
      if (!token || !workspaceId) {
        return new Response(JSON.stringify({ 
          error: "Missing token or workspaceId parameters" 
        }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      
      console.log(`Request ${requestId}: Verifying invitation token: ${token} for workspace: ${workspaceId}`);
      
      // Check if the invitation exists and is valid
      const { data: invitation, error: inviteError } = await supabase
        .from("apl_workspace_invitations")
        .select("id, email, status, expires_at, workspace_id")
        .eq("token", token)
        .eq("workspace_id", workspaceId)
        .single();
      
      if (inviteError || !invitation) {
        console.error(`Request ${requestId}: Invalid invitation token:`, inviteError);
        return new Response(JSON.stringify({ 
          error: "Invalid invitation token" 
        }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      
      // Check if invitation is expired
      if (invitation.expires_at && new Date(invitation.expires_at) < new Date()) {
        console.log(`Request ${requestId}: Invitation token expired`);
        return new Response(JSON.stringify({ 
          error: "Invitation has expired",
          status: "expired"
        }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      
      // Check if invitation has already been used
      if (invitation.status !== "pending") {
        console.log(`Request ${requestId}: Invitation already ${invitation.status}`);
        return new Response(JSON.stringify({ 
          error: `Invitation has already been ${invitation.status}`,
          status: invitation.status
        }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      
      // Get workspace details for displaying
      const { data: workspace, error: workspaceError } = await supabase
        .from("apl_workspaces")
        .select("name")
        .eq("id", workspaceId)
        .single();
        
      if (workspaceError) {
        console.error(`Request ${requestId}: Error fetching workspace details:`, workspaceError);
      }
      
      // Return invitation details
      return new Response(JSON.stringify({
        valid: true,
        workspaceName: workspace?.name,
        email: invitation.email,
        workspaceId: invitation.workspace_id,
        status: invitation.status
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    // ACCEPTING INVITATIONS (called from frontend)
    else if (path.endsWith("/accept")) {
      const body = await req.json();
      const { token, workspaceId } = body;
      
      if (!token || !workspaceId) {
        return new Response(JSON.stringify({ 
          error: "Missing token or workspaceId" 
        }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      
      // Check JWT authorization
      const authHeader = req.headers.get("Authorization");
      if (!authHeader) {
        console.error(`Request ${requestId}: Missing authorization header`);
        return new Response(JSON.stringify({ 
          error: "Unauthorized request",
          needsAuth: true
        }), { 
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        });
      }
      
      // Extract JWT token
      const authToken = authHeader.replace("Bearer ", "");
      
      // Get the current authenticated user
      const { data: { user }, error: authError } = await supabase.auth.getUser(authToken);
      
      if (authError || !user) {
        console.error(`Request ${requestId}: Invalid authentication token`, authError);
        return new Response(JSON.stringify({ 
          error: "Authentication failed",
          needsAuth: true
        }), { 
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        });
      }
      
      console.log(`Request ${requestId}: User ${user.id} is accepting invitation to workspace ${workspaceId}`);
      
      // Verify the token and get invitation details
      const { data: invitation, error: inviteError } = await supabase
        .from("apl_workspace_invitations")
        .select("id, email, status, expires_at")
        .eq("token", token)
        .eq("workspace_id", workspaceId)
        .single();
      
      if (inviteError || !invitation) {
        console.error(`Request ${requestId}: Invalid or expired token`, inviteError);
        return new Response(JSON.stringify({ 
          error: "Invalid or expired invitation token" 
        }), { 
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        });
      }
      
      // Check if token is expired
      if (new Date(invitation.expires_at) < new Date()) {
        console.error(`Request ${requestId}: Token expired`);
        return new Response(JSON.stringify({ 
          error: "Invitation has expired" 
        }), { 
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        });
      }
      
      // Check if user's email matches invitation email
      if (user.email?.toLowerCase() !== invitation.email.toLowerCase()) {
        console.error(`Request ${requestId}: Email mismatch. Invitation for ${invitation.email}, but user is ${user.email}`);
        return new Response(JSON.stringify({ 
          error: "This invitation was sent to a different email address",
          details: "Please sign in with the email address that received the invitation" 
        }), { 
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        });
      }
      
      // Check if user is already a member
      const { data: existingMembership, error: membershipError } = await supabase
        .from("apl_workspace_members")
        .select("id")
        .eq("workspace_id", workspaceId)
        .eq("user_id", user.id)
        .maybeSingle();
        
      if (membershipError) {
        console.error(`Request ${requestId}: Error checking existing membership`, membershipError);
      }
      
      if (existingMembership) {
        console.log(`Request ${requestId}: User ${user.id} is already a member of workspace ${workspaceId}`);
        return new Response(JSON.stringify({ 
          success: true,
          message: "You are already a member of this workspace",
          alreadyMember: true 
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      
      // Begin transaction to update invitation status and add user to workspace
      // 1. Add user to workspace members
      const { error: addMemberError } = await supabase
        .from("apl_workspace_members")
        .insert({
          workspace_id: workspaceId,
          user_id: user.id,
          role: "member" // Default role for invited members
        });
        
      if (addMemberError) {
        console.error(`Request ${requestId}: Failed to add user to workspace`, addMemberError);
        return new Response(JSON.stringify({ 
          error: "Failed to add user to workspace" 
        }), { 
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        });
      }
      
      // 2. Update invitation status to accepted
      const { error: updateInviteError } = await supabase
        .from("apl_workspace_invitations")
        .update({
          status: "accepted",
          accepted_at: new Date().toISOString(),
          accepted_by: user.id
        })
        .eq("id", invitation.id);
        
      if (updateInviteError) {
        console.error(`Request ${requestId}: Failed to update invitation status`, updateInviteError);
        // Don't return error here since the user was already added to the workspace
      }
      
      // Log the successful invitation acceptance
      await supabase.from("apl_auth_logs").insert({
        user_id: user.id,
        action: "WORKSPACE_INVITATION_ACCEPTED",
        details: JSON.stringify({
          workspaceId,
          requestId,
          timestamp: new Date().toISOString()
        })
      });
      
      // Return success response
      return new Response(JSON.stringify({
        success: true,
        message: "You have successfully joined the workspace",
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    else {
      // Invalid endpoint
      return new Response(JSON.stringify({ 
        error: "Invalid endpoint. Use /send, /verify, or /accept" 
      }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
  } catch (error) {
    console.error("Error in workspace invitation function:", error);
    return new Response(JSON.stringify({ 
      error: error.message || "An unexpected error occurred" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
