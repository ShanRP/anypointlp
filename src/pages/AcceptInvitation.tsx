
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Loader2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CustomButton } from '@/components/ui/CustomButton';
import { useWorkspaces } from '@/hooks/useWorkspaces';
import { toast } from 'sonner';

const AcceptInvitationPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { refreshWorkspaces } = useWorkspaces();
  const [status, setStatus] = useState<'loading' | 'accepted' | 'error' | 'unauthorized'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [workspaceName, setWorkspaceName] = useState<string>('');
  const [invitationId, setInvitationId] = useState<string>('');
  
  const workspaceId = searchParams.get('workspaceId');

  useEffect(() => {
    console.log("AcceptInvitationPage mounted with workspaceId:", workspaceId);
    console.log("User:", user);
    
    const acceptInvitation = async () => {
      if (loading) {
        console.log("Auth is still loading, waiting...");
        return;
      }
      
      if (!user) {
        console.log("No authenticated user found, setting unauthorized status");
        setStatus('unauthorized');
        return;
      }
      
      if (!workspaceId) {
        console.log("No workspaceId found in URL params");
        setStatus('error');
        setErrorMessage('Invalid invitation link. Missing workspace ID.');
        return;
      }
      
      try {
        console.log('Accepting invitation for workspace:', workspaceId, 'User:', user.id);
        
        // Get workspace details first
        const { data: workspace, error: workspaceError } = await supabase
          .from('apl_workspaces')
          .select('name')
          .eq('id', workspaceId)
          .single();
        
        if (workspaceError) {
          console.error('Workspace not found:', workspaceError);
          throw new Error('Workspace not found');
        }
        
        console.log('Found workspace:', workspace.name);
        setWorkspaceName(workspace.name);
        
        // Check if invitation exists for user's email
        const { data: invitationData, error: invitationError } = await supabase
          .from('apl_workspace_invitations')
          .select('*')
          .eq('workspace_id', workspaceId)
          .eq('email', user.email)
          .eq('status', 'pending')
          .single();
          
        if (invitationError || !invitationData) {
          console.error('Invitation not found:', invitationError);
          
          // Check if there's any invitation regardless of status
          const { data: anyInvitation } = await supabase
            .from('apl_workspace_invitations')
            .select('status')
            .eq('workspace_id', workspaceId)
            .eq('email', user.email)
            .single();
            
          if (anyInvitation && anyInvitation.status === 'accepted') {
            throw new Error('Invitation has already been accepted');
          } else {
            throw new Error('Invitation not found or expired');
          }
        }
        
        console.log('Found valid invitation:', invitationData.id);
        setInvitationId(invitationData.id);
        
        // Step 1: First check if the user is already a member
        const { data: existingMembership, error: membershipError } = await supabase
          .from('apl_workspace_members')
          .select('id')
          .eq('workspace_id', workspaceId)
          .eq('user_id', user.id)
          .maybeSingle();
          
        if (membershipError) {
          console.error('Error checking membership:', membershipError);
        }
        
        // If user is not already a member, add them
        if (!existingMembership) {
          console.log('User is not a member yet, adding them to workspace');
          
          // Add the user as a member directly
          const { error: addMemberError } = await supabase
            .from('apl_workspace_members')
            .insert({
              workspace_id: workspaceId,
              user_id: user.id,
              role: 'member'
            });
            
          if (addMemberError) {
            console.error('Error adding member:', addMemberError);
            throw new Error('Failed to add you to the workspace');
          }
          
          // Duplicate the workspace for this user
          console.log('Creating a workspace record for the invited user');
          
          // First get the original workspace details for replication
          const { data: sourceWorkspace, error: sourceWorkspaceError } = await supabase
            .from('apl_workspaces')
            .select('name, initial, session_timeout, invite_enabled')
            .eq('id', workspaceId)
            .single();
            
          if (sourceWorkspaceError) {
            console.error('Error fetching source workspace:', sourceWorkspaceError);
          } else {
            // Create a new workspace record for this user that references the same workspace
            const { error: workspaceCreateError } = await supabase
              .from('apl_workspaces')
              .insert({
                id: workspaceId, // Use the same ID to ensure it's the same workspace
                user_id: user.id, // But assign to the invited user
                name: sourceWorkspace.name,
                initial: sourceWorkspace.initial,
                session_timeout: sourceWorkspace.session_timeout,
                invite_enabled: sourceWorkspace.invite_enabled,
                is_invited_workspace: true // Flag to indicate this is a shared workspace record
              });
              
            if (workspaceCreateError) {
              // This error may occur if the workspace already exists for the user, which is fine
              console.error('Error creating workspace record:', workspaceCreateError);
              console.log('This error might be expected if the workspace record already exists');
            } else {
              console.log('Successfully created workspace record for invited user');
            }
          }
        } else {
          console.log('User is already a member of this workspace');
        }
        
        // Step 2: Update the invitation status
        const { error: updateError } = await supabase
          .from('apl_workspace_invitations')
          .update({
            status: 'accepted',
            accepted_at: new Date().toISOString(),
            accepted_by: user.id
          })
          .eq('id', invitationData.id);
          
        if (updateError) {
          console.error('Error updating invitation status:', updateError);
          // Don't throw error here, as the membership has been created already
        }
        
        // Refresh the workspaces list to include the newly added workspace
        console.log('Refreshing workspaces list...');
        await refreshWorkspaces();
        toast.success(`You've been added to the workspace: ${workspace.name}`);
        
        setStatus('accepted');
      } catch (error) {
        console.error('Error accepting invitation:', error);
        setStatus('error');
        setErrorMessage(error.message || 'Failed to accept invitation');
      }
    };
    
    acceptInvitation();
  }, [workspaceId, user, loading, navigate, refreshWorkspaces]);
  
  const renderContent = () => {
    switch (status) {
      case 'loading':
        return (
          <div className="flex flex-col items-center justify-center p-6">
            <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
            <p className="text-lg">Processing your invitation...</p>
          </div>
        );
        
      case 'accepted':
        return (
          <>
            <CardHeader>
              <div className="flex justify-center mb-4">
                <CheckCircle className="h-16 w-16 text-green-500" />
              </div>
              <CardTitle className="text-center text-2xl">Invitation Accepted!</CardTitle>
              <CardDescription className="text-center">
                You are now a member of "{workspaceName}"
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center">
                You can now access and collaborate in this workspace.
              </p>
            </CardContent>
            <CardFooter className="flex justify-center pt-6">
              <CustomButton 
                onClick={() => navigate('/dashboard')}
                size="lg"
              >
                Go to Dashboard
              </CustomButton>
            </CardFooter>
          </>
        );
        
      case 'error':
        return (
          <>
            <CardHeader>
              <div className="flex justify-center mb-4">
                <XCircle className="h-16 w-16 text-red-500" />
              </div>
              <CardTitle className="text-center text-2xl">Something Went Wrong</CardTitle>
              <CardDescription className="text-center">
                We couldn't process your invitation.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert variant="destructive">
                <AlertDescription>
                  {errorMessage || "The invitation is invalid or has expired."}
                </AlertDescription>
              </Alert>
            </CardContent>
            <CardFooter className="flex justify-center gap-4">
              <Button variant="outline" onClick={() => navigate('/dashboard')}>
                Back to Dashboard
              </Button>
            </CardFooter>
          </>
        );
        
      case 'unauthorized':
        return (
          <>
            <CardHeader>
              <div className="flex justify-center mb-4">
                <AlertCircle className="h-16 w-16 text-yellow-500" />
              </div>
              <CardTitle className="text-center text-2xl">Authentication Required</CardTitle>
              <CardDescription className="text-center">
                You need to be logged in to accept this invitation.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center mb-4">
                Please sign in or create an account to join this workspace.
              </p>
            </CardContent>
            <CardFooter className="flex justify-center">
              <CustomButton 
                onClick={() => navigate('/auth', { state: { returnUrl: `/workspace/accept-invitation?workspaceId=${workspaceId}` } })}
                size="lg"
              >
                Sign In
              </CustomButton>
            </CardFooter>
          </>
        );
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md">
        {renderContent()}
      </Card>
    </div>
  );
};

export default AcceptInvitationPage;
