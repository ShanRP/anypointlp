
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { CheckCircle, Loader2, AlertCircle, ArrowRight } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

// Import directly from utils/supabaseOptimizer to use the type-safe functions
import { getInvitationDetails, acceptWorkspaceInvitation } from '@/utils/supabaseOptimizer';

const AcceptInvitation = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, session } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [workspaceName, setWorkspaceName] = useState<string>('');
  const [processingAcceptance, setProcessingAcceptance] = useState(false);
  
  // Get parameters from URL
  const workspaceId = searchParams.get('workspaceId');
  const token = searchParams.get('token');

  useEffect(() => {
    const checkInvitation = async () => {
      if (!workspaceId || !token) {
        setError('Invalid invitation link. Missing workspace ID or token.');
        setLoading(false);
        return;
      }

      try {
        // First, check if the workspace exists
        const { data: workspace, error: workspaceError } = await supabase
          .from('apl_workspaces')
          .select('name')
          .eq('id', workspaceId)
          .single();

        if (workspaceError || !workspace) {
          console.error('Error fetching workspace:', workspaceError);
          setError('Workspace not found. The invitation link may be invalid.');
          setLoading(false);
          return;
        }

        setWorkspaceName(workspace.name);
        
        // Check if the token exists and is valid
        const result = await getInvitationDetails(token, workspaceId);
        
        if (result.error || !result.data) {
          console.error('Error validating invitation token:', result.error);
          setError('The invitation token is invalid or has expired.');
          setLoading(false);
          return;
        }
        
        const tokenData = result.data;
        
        // Check if token is expired
        if (new Date(tokenData.expires_at) < new Date()) {
          setError('This invitation has expired. Please request a new invitation.');
          setLoading(false);
          return;
        }
        
        // If user is logged in, check if their email matches the invitation
        if (user && user.email && tokenData.email.toLowerCase() !== user.email.toLowerCase()) {
          setError(`This invitation was sent to ${tokenData.email}. Please sign in with that email address.`);
          setLoading(false);
          return;
        }

        // If we get here, the invitation is valid
        setLoading(false);
      } catch (error) {
        console.error('Error checking invitation:', error);
        setError('An error occurred while checking the invitation.');
        setLoading(false);
      }
    };

    checkInvitation();
  }, [workspaceId, token, user]);

  const handleAcceptInvitation = async () => {
    if (!workspaceId || !token) {
      return;
    }
    
    setProcessingAcceptance(true);
    
    try {
      if (!user || !session) {
        // If not authenticated, redirect to auth page with return URL
        const returnUrl = `/workspace/accept-invitation?workspaceId=${workspaceId}&token=${token}`;
        navigate(`/auth`, { 
          state: { returnUrl }
        });
        return;
      }
      
      // User is authenticated, proceed with accepting invitation
      const { data, error } = await acceptWorkspaceInvitation(workspaceId, token);
      
      if (error) {
        throw new Error(error.message || 'Failed to accept invitation');
      }
      
      if (data.alreadyMember) {
        toast({
          title: "Already a member",
          description: "You are already a member of this workspace."
        });
      } else {
        toast({
          title: "Success",
          description: "You have successfully joined the workspace."
        });
      }
      
      setSuccess(true);
      
      // Redirect to dashboard after a short delay
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (error: any) {
      console.error('Error accepting invitation:', error);
      setError(error.message || 'Failed to accept invitation');
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || 'Failed to accept invitation'
      });
    } finally {
      setProcessingAcceptance(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-purple-50 to-white p-4">
      <Card className="max-w-md w-full shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-medium text-center">Workspace Invitation</CardTitle>
          <CardDescription className="text-center">
            {loading ? "Validating invitation..." : workspaceName && `You've been invited to join "${workspaceName}"`}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-8"
              >
                <Loader2 className="h-10 w-10 text-purple-600 animate-spin mb-4" />
                <p className="text-gray-600">Checking invitation details...</p>
              </motion.div>
            ) : error ? (
              <motion.div
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center text-center py-6"
              >
                <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
                <h3 className="text-lg font-medium text-red-800 mb-2">Invitation Error</h3>
                <p className="text-gray-600 mb-6">{error}</p>
                <Button onClick={() => navigate('/auth')} variant="outline">
                  Go to Sign In
                </Button>
              </motion.div>
            ) : success ? (
              <motion.div
                key="success"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center text-center py-6"
              >
                <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
                <h3 className="text-lg font-medium text-green-800 mb-2">Invitation Accepted</h3>
                <p className="text-gray-600 mb-6">
                  You have successfully joined the workspace. Redirecting to dashboard...
                </p>
                <Button onClick={() => navigate('/dashboard')} variant="outline">
                  Go to Dashboard Now
                </Button>
              </motion.div>
            ) : (
              <motion.div
                key="accept"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center py-6"
              >
                <p className="text-center text-gray-600 mb-6">
                  {user ? 
                    `Click the button below to join "${workspaceName}".` :
                    `You need to sign in to join "${workspaceName}". Clicking accept will redirect you to sign in first.`
                  }
                </p>
                <Button 
                  onClick={handleAcceptInvitation} 
                  disabled={processingAcceptance}
                  className="w-full"
                >
                  {processingAcceptance ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Accept Invitation
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  );
};

export default AcceptInvitation;
