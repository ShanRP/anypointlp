
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { McpServer } from "https://esm.sh/@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "https://esm.sh/zod@3.22.4";

// Define CORS headers for cross-origin requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Create an MCP server
const mcpServer = new McpServer({
  name: "WorkspaceInvitationService",
  version: "1.0.0"
});

// Add a tool for sending workspace invitations
mcpServer.tool(
  "send-invitation",
  {
    workspaceId: z.string(),
    email: z.string().email(),
    inviterName: z.string().optional()
  },
  async ({ workspaceId, email, inviterName }) => {
    try {
      // Get secure context
      const { supabase, APP_URL } = getSecureContext();
      
      // Get the workspace details
      const { data: workspace, error: workspaceError } = await supabase
        .from("apl_workspaces")
        .select("name, user_id")
        .eq("id", workspaceId)
        .single();

      if (workspaceError || !workspace) {
        console.error("Error fetching workspace:", workspaceError);
        return {
          content: [{ type: "text", text: JSON.stringify({ error: "Workspace not found" }) }],
          isError: true
        };
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
            return {
              content: [{ type: "text", text: JSON.stringify({ error: "User is already a member of this workspace" }) }],
              isError: true
            };
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
          return {
            content: [{ type: "text", text: JSON.stringify({ error: "User has already been invited to this workspace" }) }],
            isError: true
          };
        }
        
        return {
          content: [{ type: "text", text: JSON.stringify({ error: inviteError.message || "Failed to create invitation" }) }],
          isError: true
        };
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
        
        const { data, error: emailError } = await supabase.auth.admin.inviteUserByEmail(
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
        
        if (emailError) {
          throw emailError;
        }
        
        console.log("Invitation email sent successfully to:", email);
        
        return {
          content: [{ 
            type: "text", 
            text: JSON.stringify({ 
              success: true, 
              message: "Invitation sent successfully" 
            }) 
          }]
        };
        
      } catch (emailError) {
        console.error("Error sending invitation email:", emailError);
        
        // Even if the email fails, we've created the invitation record
        return {
          content: [{ 
            type: "text", 
            text: JSON.stringify({ 
              success: true, 
              warning: "Invitation created but email could not be sent",
              message: "The invitation has been created, but we couldn't send the email. The user can still access it through the workspace page."
            }) 
          }]
        };
      }
    } catch (error) {
      console.error("Error sending invitation:", error);
      return {
        content: [{ type: "text", text: JSON.stringify({ error: error.message || "An unexpected error occurred" }) }],
        isError: true
      };
    }
  }
);

// Add a resource for workspace information
mcpServer.resource(
  "workspace-info",
  new URL("workspace://info/{workspaceId}"),
  async (uri, { workspaceId }) => {
    try {
      const { supabase } = getSecureContext();
      
      const { data: workspace, error } = await supabase
        .from("apl_workspaces")
        .select("id, name, created_at")
        .eq("id", workspaceId)
        .single();
        
      if (error || !workspace) {
        return {
          contents: [{
            uri: uri.href,
            text: JSON.stringify({ error: "Workspace not found" })
          }]
        };
      }
      
      return {
        contents: [{
          uri: uri.href,
          text: JSON.stringify(workspace)
        }]
      };
    } catch (error) {
      return {
        contents: [{
          uri: uri.href,
          text: JSON.stringify({ error: error.message || "An unexpected error occurred" })
        }]
      };
    }
  }
);

// Model Context Protocol middleware to securely handle service role key
const getSecureContext = () => {
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const APP_URL = Deno.env.get("APP_URL") || "http://localhost:8080";
  
  // Validate required environment variables
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Missing required environment variables");
  }
  
  // Create Supabase client with service role key
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
  
  return { 
    supabase, 
    SUPABASE_URL, 
    APP_URL,
    timestamp: new Date().toISOString(),
    environment: Deno.env.get("ENVIRONMENT") || "development"
  };
};

// Create an HTTP adapter for the MCP server
class HttpMcpAdapter {
  constructor(private mcpServer: typeof mcpServer) {}
  
  async handleRequest(req: Request): Promise<Response> {
    // Handle CORS preflight requests
    if (req.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }
    
    try {
      const body = await req.json();
      
      if (body.type === "tool") {
        const { name, arguments: args } = body;
        
        // Call the MCP tool
        const result = await this.mcpServer.callTool(name, args);
        
        return new Response(
          JSON.stringify(result),
          { 
            status: 200, 
            headers: { 
              ...corsHeaders, 
              "Content-Type": "application/json" 
            } 
          }
        );
      } else if (body.type === "resource") {
        const { uri } = body;
        
        // Read the MCP resource
        const result = await this.mcpServer.readResource(uri);
        
        return new Response(
          JSON.stringify(result),
          { 
            status: 200, 
            headers: { 
              ...corsHeaders, 
              "Content-Type": "application/json" 
            } 
          }
        );
      } else {
        // Legacy support for the original API
        const { workspaceId, email, inviterName } = body;
        
        // Call the send-invitation tool
        const result = await this.mcpServer.callTool("send-invitation", {
          workspaceId,
          email,
          inviterName
        });
        
        // Parse the JSON from the text content
        const responseData = JSON.parse(result.content[0].text);
        
        return new Response(
          JSON.stringify(responseData),
          { 
            status: result.isError ? 400 : 200, 
            headers: { 
              ...corsHeaders, 
              "Content-Type": "application/json" 
            } 
          }
        );
      }
    } catch (error) {
      console.error("Error processing request:", error);
      
      return new Response(
        JSON.stringify({ error: error.message || "An unexpected error occurred" }),
        { 
          status: 500, 
          headers: { 
            ...corsHeaders, 
            "Content-Type": "application/json" 
          } 
        }
      );
    }
  }
}

// Create the HTTP adapter
const httpAdapter = new HttpMcpAdapter(mcpServer);

// Serve the function
serve(async (req) => {
  return await httpAdapter.handleRequest(req);
});
