
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { getInvitationDetails, acceptWorkspaceInvitation } from '@/utils/supabaseOptimizer';

export default function AcceptInvitation() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, signIn } = useAuth();
  const [workspace, setWorkspace] = useState<any>(null);
  const [invitation, setInvitation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const token = searchParams.get('token');
  const workspaceId = searchParams.get('workspace');
  
  useEffect(() => {
    const fetchInvitationDetails = async () => {
      if (!token || !workspaceId) {
        setError('Invalid invitation link. Missing token or workspace ID.');
        setLoading(false);
        return;
      }
      
      try {
        // Get invitation details from the workspace_invitations table
        const invitationResult = await getInvitationDetails(token, workspaceId);
        
        if (invitationResult.error || !invitationResult.data) {
          setError('Invitation not found or has expired.');
          setLoading(false);
          return;
        }
        
        setInvitation(invitationResult.data);
        
        // Now get workspace details
        const { data: workspaceData, error: workspaceError } = await supabase
          .from('apl_workspaces')
          .select('name, user_id')
          .eq('id', workspaceId)
          .single();
        
        if (workspaceError || !workspaceData) {
          setError('Workspace not found.');
          setLoading(false);
          return;
        }
        
        setWorkspace(workspaceData);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching invitation details:', err);
        setError('Failed to load invitation details.');
        setLoading(false);
      }
    };
    
    fetchInvitationDetails();
  }, [token, workspaceId]);
  
  const handleAcceptInvitation = async () => {
    if (!user) {
      // Store the invitation info in sessionStorage and redirect to login
      sessionStorage.setItem('pendingInvitation', JSON.stringify({ 
        token, 
        workspaceId 
      }));
      navigate('/auth?mode=signin&redirect=workspace/accept-invitation');
      return;
    }
    
    setAccepting(true);
    
    try {
      if (!workspaceId) {
        throw new Error('Missing workspace ID');
      }
      
      // Accept the invitation using RPC function
      const result = await acceptWorkspaceInvitation(workspaceId, token);
      
      if (result.error) {
        throw new Error(result.error.message || 'Failed to accept invitation');
      }
      
      toast.success('Workspace invitation accepted successfully!');
      // Redirect to dashboard
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Error accepting invitation:', err);
      setError(err.message || 'Failed to accept invitation. Please try again.');
      toast.error(err.message || 'Failed to accept invitation');
    } finally {
      setAccepting(false);
    }
  };
  
  const handleRedirectToDashboard = () => {
    navigate('/dashboard');
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="w-full max-w-md px-8">
          <Card>
            <CardHeader className="space-y-1 text-center">
              <CardTitle className="text-2xl">Invitation</CardTitle>
              <CardDescription>Loading invitation details...</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900"></div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="w-full max-w-md px-8">
          <Card>
            <CardHeader className="space-y-1 text-center">
              <CardTitle className="text-2xl">Invitation Error</CardTitle>
              <CardDescription className="text-red-500">{error}</CardDescription>
            </CardHeader>
            <CardFooter>
              <Button onClick={handleRedirectToDashboard} className="w-full">
                Go to Dashboard
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md px-8">
        <Card>
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl">Workspace Invitation</CardTitle>
            <CardDescription>
              You've been invited to join "{workspace?.name}"
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center">
              Click below to accept the invitation and join this workspace.
            </p>
          </CardContent>
          <CardFooter className="flex flex-col space-y-2">
            <Button 
              onClick={handleAcceptInvitation} 
              className="w-full"
              disabled={accepting}
            >
              {accepting ? (
                <>
                  <span className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white"></span>
                  Accepting...
                </>
              ) : 'Accept Invitation'}
            </Button>
            <Button 
              variant="outline" 
              onClick={handleRedirectToDashboard} 
              className="w-full"
            >
              Cancel
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
