
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { AnimatePresence, motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

const AuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const { toast } = useToast();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Check if this is an email verification callback
  const isEmailVerification = searchParams.get('type') === 'email_change' || 
                             searchParams.get('type') === 'signup' || 
                             searchParams.get('type') === 'recovery';

  // Check if this is a workspace invitation callback
  const workspaceId = searchParams.get('workspaceId');
  const isWorkspaceInvitation = !!workspaceId;

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        setIsLoading(true);
        console.log('Auth callback initiated. Path:', location.pathname);
        console.log('Search params:', Object.fromEntries(searchParams.entries()));
        
        // Extract token from the URL - handle different parameter names
        const token = 
          searchParams.get('token') || 
          searchParams.get('access_token') || 
          searchParams.get('refresh_token');
        
        const tokenType = searchParams.get('type');
        console.log('Token type:', tokenType);
        
        if (isEmailVerification) {
          console.log('Email verification detected:', tokenType);
          
          if (token) {
            if (tokenType === 'signup') {
              console.log('Verifying signup with token');
              // Verify signup with token if present
              const { error: verifyError } = await supabase.auth.verifyOtp({
                token_hash: token,
                type: 'signup',
              });
              
              if (verifyError) {
                console.error('Error verifying signup:', verifyError);
                setError(verifyError.message);
                toast({
                  variant: "destructive",
                  title: "Verification failed",
                  description: verifyError.message,
                });
              } else {
                toast({
                  title: "Email Verified",
                  description: "Your email has been verified. Please sign in to continue.",
                });
              }
            }
          }
          
          // Always redirect to auth page after email verification
          setTimeout(() => {
            navigate('/auth', { replace: true });
          }, 1500);
          return;
        }
        
        const { data, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Error getting session:', sessionError);
          setError('Failed to retrieve session. Please try logging in again.');
          navigate('/auth', { replace: true });
          return;
        }
        
        if (!data.session) {
          console.error('No session found');
          
          // If this is a workspace invitation but no session, redirect to auth with return URL
          if (isWorkspaceInvitation) {
            console.log('Workspace invitation detected, redirecting to auth with return URL');
            navigate(`/auth`, { 
              replace: true,
              state: { returnUrl: `/workspace/accept-invitation?workspaceId=${workspaceId}` }
            });
            return;
          }
          
          setError('No session found. Please try logging in again.');
          navigate('/auth', { replace: true });
          return;
        }
        
        console.log('Authentication successful', data.session);
        
        // If this is a workspace invitation, redirect to accept invitation page
        if (isWorkspaceInvitation) {
          console.log('Redirecting to accept invitation page with workspaceId:', workspaceId);
          navigate(`/workspace/accept-invitation?workspaceId=${workspaceId}`, { replace: true });
          return;
        }
        
        navigate('/dashboard', { replace: true });
      } catch (error) {
        console.error('Error during auth callback:', error);
        setError('An unexpected error occurred. Please try again.');
        navigate('/auth', { replace: true });
      } finally {
        setIsLoading(false);
      }
    };

    handleAuthCallback();
  }, [navigate, toast, isEmailVerification, isWorkspaceInvitation, workspaceId, searchParams, location.pathname]);

  // Show a loading indicator while processing
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-purple-50 to-white">
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-white p-8 rounded-xl shadow-md max-w-md w-full text-center"
      >
        <AnimatePresence>
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center"
            >
              <Loader2 className="h-12 w-12 text-purple-600 animate-spin mb-4" />
              <h3 className="text-xl font-medium text-gray-900">
                {isEmailVerification ? 'Verifying your email...' : 'Processing authentication...'}
              </h3>
              <p className="text-gray-500 mt-2">Please wait while we verify your credentials</p>
            </motion.div>
          ) : error ? (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-red-500"
            >
              <p>{error}</p>
              <button 
                onClick={() => navigate('/auth')}
                className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
              >
                Back to Sign In
              </button>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default AuthCallback;
