
import { serve } from "https://deno.land/std@0.131.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.23.0";

// Set up CORS headers for browser requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*", 
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

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

    // Parse request parameters
    const { token, workspaceId } = await req.json();
    
    // Generate request ID for tracking
    const requestId = crypto.randomUUID();
    console.log(`Processing invitation acceptance: ${requestId} for token ${token} and workspace ${workspaceId}`);
    
    if (!token || !workspaceId) {
      return new Response(
        JSON.stringify({
          error: "Missing required parameters: token and workspaceId are required",
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Check JWT authorization
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error(`Request ${requestId}: Missing authorization header`);
      return new Response(
        JSON.stringify({ error: "Unauthorized request" }),
        { 
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }
    
    // Extract JWT token 
    const authToken = authHeader.replace('Bearer ', '');
    
    // Get the current authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser(authToken);
    
    if (authError || !user) {
      console.error(`Request ${requestId}: Invalid authentication token`, authError);
      return new Response(
        JSON.stringify({ error: "Authentication failed" }),
        { 
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }
    
    console.log(`Request ${requestId}: User ${user.id} is accepting invitation to workspace ${workspaceId}`);
    
    // Verify the token and get invitation details
    const { data: tokenData, error: tokenError } = await supabase
      .from("apl_invitation_tokens")
      .select("invitation_id, workspace_id, email, expires_at")
      .eq("token", token)
      .eq("workspace_id", workspaceId)
      .single();
      
    if (tokenError || !tokenData) {
      console.error(`Request ${requestId}: Invalid or expired token`, tokenError);
      return new Response(
        JSON.stringify({ error: "Invalid or expired invitation token" }),
        { 
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }
    
    // Check if token is expired
    if (new Date(tokenData.expires_at) < new Date()) {
      console.error(`Request ${requestId}: Token expired`);
      return new Response(
        JSON.stringify({ error: "Invitation has expired" }),
        { 
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }
    
    // Check if user's email matches invitation email
    if (user.email?.toLowerCase() !== tokenData.email.toLowerCase()) {
      console.error(`Request ${requestId}: Email mismatch. Invitation for ${tokenData.email}, but user is ${user.email}`);
      return new Response(
        JSON.stringify({ 
          error: "This invitation was sent to a different email address",
          details: "Please sign in with the email address that received the invitation" 
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
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
      return new Response(
        JSON.stringify({ 
          success: true,
          message: "You are already a member of this workspace",
          alreadyMember: true 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
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
      return new Response(
        JSON.stringify({ error: "Failed to add user to workspace" }),
        { 
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }
    
    // 2. Update invitation status to accepted
    const { error: updateInviteError } = await supabase
      .from("apl_workspace_invitations")
      .update({
        status: "accepted",
        accepted_at: new Date().toISOString(),
        accepted_by: user.id
      })
      .eq("id", tokenData.invitation_id);
      
    if (updateInviteError) {
      console.error(`Request ${requestId}: Failed to update invitation status`, updateInviteError);
      // Don't return error here since the user was already added to the workspace
    }
    
    // 3. Delete or invalidate the used token
    const { error: deleteTokenError } = await supabase
      .from("apl_invitation_tokens")
      .delete()
      .eq("token", token);
      
    if (deleteTokenError) {
      console.error(`Request ${requestId}: Failed to delete used token`, deleteTokenError);
      // Non-critical error, continue
    }
    
    // Log the successful invitation acceptance
    await supabase.from("apl_auth_logs").insert({
      user_id: user.id,
      action: "WORKSPACE_INVITATION_ACCEPTED",
      device: req.headers.get("user-agent") || "Unknown",
      ip_address: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "Unknown",
      details: {
        workspaceId,
        requestId,
        timestamp: new Date().toISOString()
      }
    });
    
    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        message: "You have successfully joined the workspace",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
    
  } catch (error) {
    console.error("Error in invitation acceptance:", error);
    return new Response(
      JSON.stringify({ error: error.message || "An unexpected error occurred" }),
      { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
