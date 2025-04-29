
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export const AcceptInvitation = () => {
  const { token, workspace_id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [invitationDetails, setInvitationDetails] = useState<any>(null);

  useEffect(() => {
    const getInvitationDetails = async () => {
      if (!token || !workspace_id) {
        setError('Invalid invitation link');
        setLoading(false);
        return;
      }

      try {
        // Use getInvitationDetails from supabaseOptimizer
        const { data: inviteDetails, error } = await supabase
          .functions.invoke('get-invitation-details', {
            body: { token, workspace_id }
          });

        if (error) throw error;
        
        const inviteData = inviteDetails?.data;
        
        if (!inviteData) {
          throw new Error('Invitation not found or expired');
        }
        
        setInvitationDetails(inviteData);
      } catch (err) {
        console.error('Error fetching invitation details:', err);
        setError('This invitation is invalid or has expired');
      } finally {
        setLoading(false);
      }
    };

    getInvitationDetails();
  }, [token, workspace_id]);

  const handleAcceptInvitation = async () => {
    if (!user || !token || !workspace_id) {
      toast.error('You need to be logged in to accept this invitation');
      navigate('/auth?next=accept-invitation');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .functions.invoke('accept-workspace-invitation', {
          body: { token, workspace_id }
        });
      
      if (error) throw error;
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      toast.success('You have successfully joined the workspace!');
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Error accepting invitation:', err);
      setError(err.message || 'Failed to accept invitation');
      toast.error('Failed to join workspace');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Invitation Error</h1>
          <p className="text-gray-700 dark:text-gray-300 mb-6">{error}</p>
          <Button onClick={() => navigate('/')}>
            Return to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-2xl font-bold mb-4 text-center">Workspace Invitation</h1>
        
        {!user ? (
          <>
            <p className="text-center mb-6">
              You need to sign in to accept this invitation.
            </p>
            <div className="flex justify-center">
              <Button onClick={() => navigate('/auth?next=accept-invitation')}>
                Sign In
              </Button>
            </div>
          </>
        ) : (
          <>
            <p className="text-center mb-6">
              You've been invited to join a workspace.
            </p>
            <div className="flex justify-center space-x-4">
              <Button variant="outline" onClick={() => navigate('/')}>
                Decline
              </Button>
              <Button onClick={handleAcceptInvitation} disabled={loading}>
                {loading ? 'Accepting...' : 'Accept Invitation'}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
