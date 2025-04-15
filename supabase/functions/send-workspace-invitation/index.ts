
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.6';
import { Resend } from 'npm:resend@2.0.0';

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const resendApiKey = Deno.env.get('RESEND_API_KEY') || '';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Create a Supabase client with the Service Role Key
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Initialize Resend
const resend = resendApiKey ? new Resend(resendApiKey) : null;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Get the JWT token from the request
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(
      JSON.stringify({ error: 'Missing Authorization header' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
    );
  }

  try {
    // Extract the token from the header
    const token = authHeader.replace('Bearer ', '');
    
    // Verify the token
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    const { workspaceId, email, inviteUrl } = await req.json();
    
    if (!workspaceId || !email || !inviteUrl) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: workspaceId, email, and inviteUrl are required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Check if Resend API key is configured
    if (!resend) {
      return new Response(
        JSON.stringify({ error: 'Email service not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Get workspace details
    const { data: workspace, error: workspaceError } = await supabase
      .from('apl_workspaces')
      .select('name, user_id')
      .eq('id', workspaceId)
      .eq('user_id', user.id)
      .single();
    
    if (workspaceError || !workspace) {
      console.error('Error fetching workspace:', workspaceError);
      return new Response(
        JSON.stringify({ error: 'Workspace not found or access denied' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    // Create the invitation record
    const { data: invitation, error: invitationError } = await supabase
      .from('apl_workspace_invitations')
      .insert([
        {
          workspace_id: workspaceId,
          email: email,
          status: 'pending',
          created_by: user.id
        }
      ])
      .select()
      .single();
    
    if (invitationError) {
      console.error('Error creating invitation:', invitationError);
      
      // Check if it's a duplicate invitation
      if (invitationError.message.includes('unique constraint')) {
        return new Response(
          JSON.stringify({ error: 'An invitation has already been sent to this email address' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 409 }
        );
      }
      
      return new Response(
        JSON.stringify({ error: 'Failed to create invitation' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Get inviter details
    const { data: profile } = await supabase
      .from('apl_profiles')
      .select('username, full_name')
      .eq('user_id', user.id)
      .single();
    
    const inviterName = profile?.full_name || profile?.username || user.email || 'A user';

    // Send the invitation email
    try {
      const { data: emailResponse, error: emailError } = await resend.emails.send({
        from: 'Anypoint Learning Platform <noreply@anypointlearningplatform.com>',
        to: [email],
        subject: `Invitation to join ${workspace.name} workspace`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #5a67d8;">Workspace Invitation</h2>
            <p>${inviterName} has invited you to join the <strong>${workspace.name}</strong> workspace on Anypoint Learning Platform.</p>
            <p>Use the link below to accept the invitation:</p>
            <p>
              <a href="${inviteUrl}" style="background-color: #5a67d8; color: white; padding: 10px 15px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 10px 0;">
                Accept Invitation
              </a>
            </p>
            <p style="color: #666; font-size: 14px; margin-top: 30px;">
              If you didn't expect this invitation, you can safely ignore this email.
            </p>
          </div>
        `
      });

      if (emailError) {
        console.error('Error sending email:', emailError);
        return new Response(
          JSON.stringify({ error: 'Failed to send invitation email', invitation }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }

      return new Response(
        JSON.stringify({ success: true, invitation, email: emailResponse }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    } catch (emailError) {
      console.error('Error sending email:', emailError);
      return new Response(
        JSON.stringify({ error: 'Failed to send invitation email', invitation }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in send-workspace-invitation:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
