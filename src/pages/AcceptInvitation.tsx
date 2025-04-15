
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

const AcceptInvitationPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { refreshWorkspaces } = useWorkspaces();
  const [status, setStatus] = useState<'loading' | 'accepted' | 'error' | 'unauthorized'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [workspaceName, setWorkspaceName] = useState<string>('');
  
  const workspaceId = searchParams.get('workspaceId');

  useEffect(() => {
    const acceptInvitation = async () => {
      if (loading) return;
      
      if (!user) {
        setStatus('unauthorized');
        return;
      }
      
      if (!workspaceId) {
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
          throw new Error('Invitation not found or already used');
        }
        
        console.log('Found valid invitation:', invitationData.id);
        
        // Accept the invitation
        const { data, error } = await supabase.rpc('apl_accept_workspace_invitation', {
          workspace_id_param: workspaceId,
          user_id_param: user.id
        });
        
        if (error) {
          console.error('Error accepting invitation:', error);
          throw error;
        }
        
        console.log('Successfully accepted invitation:', data);
        
        // Make sure to refresh workspaces list
        refreshWorkspaces();
        
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
