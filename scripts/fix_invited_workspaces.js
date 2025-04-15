
/**
 * This script helps fix workspace access for invited users
 * It can be run manually in a Node.js environment with the Supabase JavaScript client
 * 
 * Usage:
 * 1. Install dependencies: npm install @supabase/supabase-js dotenv
 * 2. Create a .env file with SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
 * 3. Run: node fix_invited_workspaces.js
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client with service role key (admin access)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixInvitedWorkspaces() {
  console.log('Starting workspace invitation fix script...');
  
  try {
    // Get all workspace memberships
    const { data: memberships, error: membershipError } = await supabase
      .from('apl_workspace_members')
      .select('workspace_id, user_id');
      
    if (membershipError) {
      console.error('Error fetching memberships:', membershipError);
      return;
    }
    
    console.log(`Found ${memberships.length} workspace memberships to process`);
    
    let successCount = 0;
    let errorCount = 0;
    
    // Process each membership
    for (const membership of memberships) {
      const { workspace_id, user_id } = membership;
      
      // Check if user already has a workspace record
      const { data: existingRecord, error: checkError } = await supabase
        .from('apl_workspaces')
        .select('id')
        .eq('id', workspace_id)
        .eq('user_id', user_id)
        .maybeSingle();
        
      if (checkError) {
        console.error(`Error checking workspace record for user ${user_id}:`, checkError);
        errorCount++;
        continue;
      }
      
      // If no record exists, create one
      if (!existingRecord) {
        // Get details of the original workspace
        const { data: sourceWorkspace, error: sourceError } = await supabase
          .from('apl_workspaces')
          .select('name, initial, session_timeout, invite_enabled')
          .eq('id', workspace_id)
          .single();
          
        if (sourceError) {
          console.error(`Error fetching source workspace ${workspace_id}:`, sourceError);
          errorCount++;
          continue;
        }
        
        // Create a duplicate workspace record for the invited user
        const { error: insertError } = await supabase
          .from('apl_workspaces')
          .insert({
            id: workspace_id,
            user_id: user_id,
            name: sourceWorkspace.name,
            initial: sourceWorkspace.initial,
            session_timeout: sourceWorkspace.session_timeout,
            invite_enabled: sourceWorkspace.invite_enabled,
            is_invited_workspace: true
          });
          
        if (insertError) {
          console.error(`Error creating workspace record for user ${user_id}:`, insertError);
          errorCount++;
          continue;
        }
        
        console.log(`Created workspace record for user ${user_id}, workspace ${workspace_id}`);
        successCount++;
      } else {
        console.log(`User ${user_id} already has a record for workspace ${workspace_id}`);
        successCount++;
      }
    }
    
    console.log('Fix script completed:');
    console.log(`- ${successCount} workspaces processed successfully`);
    console.log(`- ${errorCount} errors encountered`);
    
  } catch (error) {
    console.error('Unexpected error in fix script:', error);
  }
}

fixInvitedWorkspaces().catch(console.error);
