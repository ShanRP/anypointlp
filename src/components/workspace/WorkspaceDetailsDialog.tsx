
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Trash, Edit, Save, Send, Mail, Shield, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { createDebouncedQuery, logAuditEvent, getWorkspaceDetails } from '@/utils/supabaseOptimizer';
import { WorkspaceOption } from '@/hooks/useWorkspaces';

type WorkspaceDetailsDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  workspace: WorkspaceOption | null;
  onDelete: (id: string) => Promise<boolean>;
  onUpdate: (id: string, updates: Partial<WorkspaceOption>) => Promise<boolean>;
};

const WorkspaceDetailsDialog: React.FC<WorkspaceDetailsDialogProps> = ({
  isOpen,
  onClose,
  workspace,
  onDelete,
  onUpdate
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [workspaceName, setWorkspaceName] = useState('');
  const [inviteEnabled, setInviteEnabled] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [isSendingInvite, setIsSendingInvite] = useState(false);
  const { user } = useAuth();

  // Reset states when dialog opens
  useEffect(() => {
    if (isOpen && workspace) {
      setWorkspaceName(workspace.name);
      setInviteEnabled(workspace.invite_enabled || false);
      setIsEditing(false);
      setIsDeleting(false);
      setInviteEmail('');
    }
  }, [isOpen, workspace]);

  if (!workspace) return null;

  const handleDelete = async () => {
    if (!workspace || !user) return;
    
    setIsDeleting(true);
    try {
      // Log delete attempt for audit purposes
      await logAuditEvent(user.id, 'DELETE_WORKSPACE', {
        workspaceId: workspace.id,
        workspaceName: workspace.name,
        timestamp: new Date().toISOString()
      });
      
      const success = await onDelete(workspace.id);
      if (success) {
        toast.success("Workspace deleted successfully");
        onClose();
      } else {
        toast.error("Failed to delete workspace");
      }
    } catch (error) {
      console.error("Error deleting workspace:", error);
      toast.error("An error occurred while deleting the workspace");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUpdate = async () => {
    if (!workspace || !workspaceName.trim() || !user) return;
    
    setIsUpdating(true);
    try {
      // Log update attempt for audit purposes
      await logAuditEvent(user.id, 'UPDATE_WORKSPACE', {
        workspaceId: workspace.id,
        workspaceName: workspaceName,
        inviteEnabled: inviteEnabled,
        previousName: workspace.name,
        previousInviteEnabled: workspace.invite_enabled,
        timestamp: new Date().toISOString()
      });
      
      const success = await onUpdate(workspace.id, { 
        name: workspaceName,
        invite_enabled: inviteEnabled
      });
      
      if (success) {
        toast.success("Workspace updated successfully");
        setIsEditing(false);
      } else {
        toast.error("Failed to update workspace");
      }
    } catch (error) {
      console.error("Error updating workspace:", error);
      toast.error("An error occurred while updating the workspace");
    } finally {
      setIsUpdating(false);
    }
  };

  const validateEmail = (email: string): boolean => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const debouncedSendInvitation = createDebouncedQuery(async () => {
    if (!workspace || !validateEmail(inviteEmail) || !user) {
      toast.error("Please enter a valid email address");
      return;
    }
    
    setIsSendingInvite(true);
    try {
      // Log invitation attempt for audit purposes
      await logAuditEvent(user.id, 'INVITE_WORKSPACE_MEMBER', {
        workspaceId: workspace.id,
        invitedEmail: inviteEmail,
        timestamp: new Date().toISOString()
      });
      
      const { data, error } = await supabase.functions.invoke("send-workspace-invitation", {
        body: {
          type: "tool",
          name: "send-invitation",
          arguments: {
            workspaceId: workspace.id,
            email: inviteEmail,
            inviterName: user?.user_metadata?.username || user?.email
          }
        }
      });
      
      if (error) {
        throw error;
      }
      
      if (data.isError) {
        const errorData = JSON.parse(data.content[0].text);
        throw new Error(errorData.error || "Failed to send invitation");
      }
      
      const responseData = JSON.parse(data.content[0].text);
      
      // Log successful invitation for audit
      await logAuditEvent(user.id, 'INVITE_WORKSPACE_MEMBER_SUCCESS', {
        workspaceId: workspace.id,
        invitedEmail: inviteEmail,
        timestamp: new Date().toISOString()
      });
      
      if (responseData.warning) {
        toast.warning(responseData.message || "Invitation created but email could not be sent");
      } else {
        toast.success(responseData.message || "Invitation sent successfully");
      }
      
      setInviteEmail('');
    } catch (error) {
      console.error("Error sending invitation:", error);
      
      // Log failed invitation for audit
      await logAuditEvent(user.id, 'INVITE_WORKSPACE_MEMBER_FAILED', {
        workspaceId: workspace.id,
        invitedEmail: inviteEmail,
        error: error.message,
        timestamp: new Date().toISOString()
      });
      
      if (error.message && error.message.includes("already a member")) {
        toast.error("User is already a member of this workspace");
      } else if (error.message && error.message.includes("already been invited")) {
        toast.error("User has already been invited to this workspace");
      } else {
        toast.error("Failed to send invitation");
      }
    } finally {
      setIsSendingInvite(false);
    }
  }, 300);

  const sendInvitation = () => {
    debouncedSendInvitation();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl">Workspace Details</DialogTitle>
          <div className="text-xs text-gray-500 mt-1">
            <Shield className="h-3 w-3 inline-block mr-1" />
            All changes are logged for audit and compliance
          </div>
        </DialogHeader>
        
        <motion.div 
          className="space-y-6 py-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Workspace Name
            </label>
            {isEditing ? (
              <div className="flex space-x-2">
                <Input
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  autoFocus
                  className="flex-1"
                />
                <Button 
                  size="icon" 
                  onClick={handleUpdate}
                  disabled={isUpdating || !workspaceName.trim()}
                >
                  <Save className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <span className="text-lg font-medium">{workspace.name}</span>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  onClick={() => setIsEditing(true)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {isEditing && (
            <div className="flex items-center space-x-2">
              <Switch
                id="invite-enabled"
                checked={inviteEnabled}
                onCheckedChange={setInviteEnabled}
              />
              <Label htmlFor="invite-enabled">Enable workspace invitations</Label>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Invite via Email
              </label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Input 
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="user@example.com"
                type="email"
                className="flex-1"
                disabled={!inviteEnabled}
              />
              <Button 
                onClick={sendInvitation}
                disabled={isSendingInvite || !inviteEnabled || !inviteEmail.trim()}
                className="whitespace-nowrap"
              >
                {isSendingInvite ? (
                  <>
                    <Mail className="h-4 w-4 mr-2 animate-pulse" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send
                  </>
                )}
              </Button>
            </div>
            
            {!inviteEnabled && (
              <Alert variant="default" className="bg-muted">
                <AlertDescription className="text-sm">
                  Enable workspace invitations to invite users
                </AlertDescription>
              </Alert>
            )}
            
            <div className="text-xs text-muted-foreground mt-1">
              {inviteEnabled ? "Enter an email address to send an invitation" : ""}
            </div>
          </div>
          
          <DialogFooter className="flex justify-between">
            <Button 
              variant="destructive" 
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex items-center space-x-1"
            >
              <Trash className="h-4 w-4 mr-1" />
              <span>Delete Workspace</span>
            </Button>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </DialogFooter>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
};

export default WorkspaceDetailsDialog;
