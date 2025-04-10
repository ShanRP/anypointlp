
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
        // First check if the workspace exists
        const { data: workspaceData, error: workspaceError } = await supabase
          .from('apl_workspaces')
          .select('*')
          .eq('id', workspaceId)
          .single();

        if (workspaceError || !workspaceData) {
          setError('Workspace not found or invitation link is invalid');
          setLoading(false);
          return;
        }

        setWorkspace(workspaceData);

        // If user is logged in, check if they're already a member
        if (user) {
          const { data: membershipData, error: membershipError } = await supabase
            .rpc('check_workspace_membership', {
              workspace_id_param: workspaceId,
              user_id_param: user.id
            });

          if (!membershipError && membershipData && membershipData.length > 0) {
            // User is already a member, redirect to dashboard
            toast.info('You are already a member of this workspace');
            navigate('/dashboard');
            return;
          }

          // User is not a member, they can join
          setLoading(false);
        } else {
          // User is not logged in, they need to authenticate
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
      navigate(`/auth?redirect=/workspace/${workspaceId}`);
      return;
    }

    setLoading(true);
    try {
      // Add user as member
      const { data, error: insertError } = await supabase
        .rpc('add_workspace_member', {
          workspace_id_param: workspaceId,
          user_id_param: user.id,
          role_param: 'member'
        });

      if (insertError) {
        throw insertError;
      }

      toast.success('Successfully joined workspace!');
      navigate('/dashboard');
    } catch (err) {
      console.error('Error joining workspace:', err);
      toast.error('Failed to join workspace');
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
