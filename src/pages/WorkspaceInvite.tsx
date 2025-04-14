
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const WorkspaceInvite = () => {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const [loading, setLoading] = useState(true);
  const [workspace, setWorkspace] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const checkWorkspace = async () => {
      if (!workspaceId) {
        setError('Invalid workspace link');
        setLoading(false);
        return;
      }

      try {
        console.log('Checking workspace with ID:', workspaceId);
        
        // First check if the workspace exists and has invites enabled
        const { data: workspaceData, error: workspaceError } = await supabase
          .from('apl_workspaces')
          .select('*')
          .eq('id', workspaceId)
          .eq('invite_enabled', true)
          .single();

        console.log('Workspace query result:', { workspaceData, workspaceError });

        if (workspaceError || !workspaceData) {
          console.error('Error fetching workspace:', workspaceError);
          setError('Workspace not found or invitation link is invalid');
          setLoading(false);
          return;
        }

        console.log('Found workspace with invites enabled:', workspaceData);
        setWorkspace(workspaceData);

        // If user is logged in, check if they're already a member
        if (user) {
          console.log('User is logged in, checking membership');
          const { data: memberData, error: memberError } = await supabase
            .from('apl_workspace_members')
            .select('*')
            .eq('workspace_id', workspaceId)
            .eq('user_id', user.id);

          console.log('Membership check result:', { memberData, memberError });

          if (memberError) {
            console.error('Error checking membership:', memberError);
          }

          if (memberData && memberData.length > 0) {
            // User is already a member, redirect to dashboard
            console.log('User is already a member');
            toast.info('You are already a member of this workspace');
            navigate('/dashboard');
            return;
          }

          // User is not a member, they can join
          console.log('User is not a member, can join');
          setLoading(false);
        } else {
          // User is not logged in, they need to authenticate
          console.log('User is not logged in');
          setLoading(false);
        }
      } catch (err) {
        console.error('Error checking workspace:', err);
        setError('Failed to verify workspace invitation');
        setLoading(false);
      }
    };

    checkWorkspace();
  }, [workspaceId, user, navigate]);

  const handleJoinWorkspace = async () => {
    if (!user || !workspaceId) {
      // Redirect to auth with return URL
      const redirectPath = `/invite/${workspaceId}`;
      navigate(`/auth?redirect=${encodeURIComponent(redirectPath)}`);
      return;
    }

    setLoading(true);
    try {
      console.log('Joining workspace', { workspaceId, userId: user.id });
      
      // Check if the workspace still has invites enabled before joining
      const { data: workspaceData, error: workspaceError } = await supabase
        .from('apl_workspaces')
        .select('invite_enabled')
        .eq('id', workspaceId)
        .single();
        
      if (workspaceError || !workspaceData || !workspaceData.invite_enabled) {
        throw new Error('Workspace not found or invitation has been disabled');
      }
      
      // Check if user is already a member (double-check)
      const { data: existingMember, error: memberCheckError } = await supabase
        .from('apl_workspace_members')
        .select('id')
        .eq('workspace_id', workspaceId)
        .eq('user_id', user.id)
        .single();
      
      if (existingMember) {
        toast.info('You are already a member of this workspace');
        navigate('/dashboard');
        return;
      }

      console.log('Attempting to insert membership record:', {
        workspace_id: workspaceId,
        user_id: user.id,
        role: 'member'
      });
      
      // Add user as member - modified to include better logging and error reporting
      const { data, error: insertError } = await supabase
        .from('apl_workspace_members')
        .insert({
          workspace_id: workspaceId,
          user_id: user.id,
          role: 'member'
        })
        .select();

      if (insertError) {
        console.error('Error joining workspace:', insertError);
        throw new Error(`Failed to join workspace: ${insertError.message}`);
      }

      console.log('Successfully joined workspace:', data);
      toast.success('Successfully joined workspace!');
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Error joining workspace:', err);
      toast.error('Failed to join workspace: ' + (err.message || 'Unknown error'));
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Workspace Invitation</CardTitle>
            <CardDescription>Processing your invitation</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center py-6">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="mt-4 text-center text-muted-foreground">Please wait while we verify the invitation...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Invalid Invitation</CardTitle>
            <CardDescription>There was a problem with this workspace invitation</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center py-6">
            <p className="text-center text-destructive mb-4">{error}</p>
            <Button variant="outline" onClick={() => navigate('/')}>Return to Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Workspace Invitation</CardTitle>
          <CardDescription>You've been invited to join a workspace</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col py-6">
          {workspace && (
            <div className="mb-6">
              <h3 className="font-medium text-lg mb-2">Workspace: {workspace.name}</h3>
              <p className="text-muted-foreground">Join this workspace to collaborate with team members</p>
            </div>
          )}
          
          <Button 
            onClick={handleJoinWorkspace} 
            className="w-full"
          >
            {user ? 'Join Workspace' : 'Sign in to Join Workspace'}
          </Button>
          
          <Button 
            variant="outline" 
            onClick={() => navigate('/')} 
            className="w-full mt-4"
          >
            Cancel
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default WorkspaceInvite;
