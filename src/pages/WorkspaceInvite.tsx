import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

const WorkspaceInvite = () => {
  const { inviteToken } = useParams<{ inviteToken: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [workspaceName, setWorkspaceName] = useState('');

  useEffect(() => {
    const joinWorkspace = async () => {
      if (authLoading) return;
      
      if (!user) {
        // If not logged in, redirect to auth page with return URL
        navigate(`/auth?returnTo=/invite/${inviteToken}`);
        return;
      }
      
      if (!inviteToken) {
        setError('Invalid invite link');
        setLoading(false);
        return;
      }
      
      setLoading(true);
      try {
        // Find the workspace that has this invite link
        const { data: workspaces, error: findError } = await supabase
          .from('apl_workspaces')
          .select('id, name, invite_enabled')
          .eq('invite_link', `${window.location.origin}/invite/${inviteToken}`)
          .single();
        
        if (findError || !workspaces) {
          console.error('Error finding workspace:', findError);
          setError('Invalid or expired invite link');
          setLoading(false);
          return;
        }
        
        if (!workspaces.invite_enabled) {
          setError('This workspace is not currently accepting invites');
          setLoading(false);
          return;
        }
        
        setWorkspaceName(workspaces.name);
        
        // Check if user is already a member of this workspace
        // We need to work around the TypeScript error by using execBatch instead
        // until Supabase types are updated for apl_workspace_members
        const members = await supabase.rpc('get_workspace_members', { workspace_id_param: workspaces.id });
        const existingMembership = members.data?.find(m => m.user_id === user.id);
          
        if (existingMembership) {
          // User is already a member
          setSuccess(true);
          setLoading(false);
          return;
        }
        
        // Add user to workspace
        // We'll use the native SQL query to work around the TypeScript error
        const { error: joinError } = await supabase
          .rpc('add_workspace_member', { 
            workspace_id_param: workspaces.id, 
            user_id_param: user.id,
            role_param: 'member' 
          });
          
        if (joinError) {
          console.error('Error joining workspace:', joinError);
          setError('Failed to join workspace');
          setLoading(false);
          return;
        }
        
        // Success!
        setSuccess(true);
        toast.success(`You've joined the "${workspaces.name}" workspace!`);
        
      } catch (err) {
        console.error('Error processing invite:', err);
        setError('Failed to process invite');
      } finally {
        setLoading(false);
      }
    };
    
    joinWorkspace();
  }, [inviteToken, user, authLoading, navigate]);
  
  const handleNavigateToDashboard = () => {
    navigate('/dashboard');
  };
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900">
      <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
        {loading || authLoading ? (
          <div className="flex flex-col items-center justify-center space-y-4">
            <Loader2 className="h-12 w-12 text-purple-600 animate-spin" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Processing Invite</h1>
            <p className="text-gray-500 dark:text-gray-400 text-center">
              Please wait while we process your workspace invitation...
            </p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center space-y-4">
            <XCircle className="h-16 w-16 text-red-500" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Invite Error</h1>
            <p className="text-gray-500 dark:text-gray-400 text-center">{error}</p>
            <Button onClick={handleNavigateToDashboard} className="mt-4">
              Go to Dashboard
            </Button>
          </div>
        ) : success ? (
          <div className="flex flex-col items-center justify-center space-y-4">
            <CheckCircle className="h-16 w-16 text-green-500" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Success!</h1>
            <p className="text-gray-500 dark:text-gray-400 text-center">
              You have successfully joined the "{workspaceName}" workspace!
            </p>
            <Button onClick={handleNavigateToDashboard} className="mt-4">
              Go to Dashboard
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default WorkspaceInvite;
