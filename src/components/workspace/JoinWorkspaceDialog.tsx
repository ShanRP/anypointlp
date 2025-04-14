
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface JoinWorkspaceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onJoinSuccess: () => void;
}

const JoinWorkspaceDialog: React.FC<JoinWorkspaceDialogProps> = ({
  isOpen,
  onClose,
  onJoinSuccess
}) => {
  const [inviteLink, setInviteLink] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState('');

  const handleJoinWorkspace = async () => {
    setError('');
    setIsJoining(true);

    try {
      // Basic validation
      if (!inviteLink.trim()) {
        setError('Please enter an invite link');
        return;
      }

      // Extract workspace ID from invite link
      // Format: {window.location.origin}/invite/{workspaceId}
      let workspaceId;
      try {
        const url = new URL(inviteLink);
        const pathParts = url.pathname.split('/');
        if (pathParts.includes('invite')) {
          const inviteIndex = pathParts.indexOf('invite');
          if (inviteIndex >= 0 && pathParts.length > inviteIndex + 1) {
            workspaceId = pathParts[inviteIndex + 1];
          }
        }
      } catch (e) {
        console.error('Error parsing URL:', e);
        setError('Invalid invite link format');
        setIsJoining(false);
        return;
      }

      if (!workspaceId) {
        setError('Could not extract workspace ID from the invite link');
        setIsJoining(false);
        return;
      }

      console.log('Extracted workspace ID:', workspaceId);

      // Verify the workspace exists and has invite enabled
      const { data: workspace, error: workspaceError } = await supabase
        .from('apl_workspaces')
        .select('*')
        .eq('id', workspaceId)
        .eq('invite_enabled', true)
        .single();

      if (workspaceError || !workspace) {
        setError('Invalid workspace or invitation has been disabled');
        setIsJoining(false);
        return;
      }

      // Call the function to add the user to the workspace
      const { data: memberData, error: memberError } = await supabase.rpc(
        'add_workspace_member',
        { 
          workspace_id_param: workspaceId, 
          user_id_param: (await supabase.auth.getUser()).data.user?.id,
          role_param: 'member'
        }
      );

      if (memberError) {
        console.error('Error joining workspace:', memberError);
        setError('Failed to join workspace');
        setIsJoining(false);
        return;
      }

      toast.success(`Successfully joined workspace: ${workspace.name}`);
      onJoinSuccess();
      onClose();
      setInviteLink('');
    } catch (error) {
      console.error('Error joining workspace:', error);
      setError('An unexpected error occurred');
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Join a Workspace</DialogTitle>
          <DialogDescription>
            Enter the invite link to join an existing workspace
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="invite-link" className="col-span-4">
              Invite Link
            </Label>
            <Input
              id="invite-link"
              value={inviteLink}
              onChange={(e) => setInviteLink(e.target.value)}
              placeholder="https://example.com/invite/workspace-id"
              className="col-span-4"
            />
            {error && (
              <p className="text-sm text-red-500 col-span-4">{error}</p>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleJoinWorkspace} disabled={isJoining}>
            {isJoining ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Joining...
              </>
            ) : (
              'Join Workspace'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default JoinWorkspaceDialog;
