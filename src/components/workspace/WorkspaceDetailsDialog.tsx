
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Clipboard, Check, Copy, Trash, Edit, Save, Link, Share2 } from 'lucide-react';
import { WorkspaceOption } from '@/hooks/useWorkspaces';
import { Alert, AlertDescription } from '@/components/ui/alert';

type WorkspaceDetailsDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  workspace: WorkspaceOption | null;
  onDelete: (id: string) => Promise<boolean>;
  onUpdate: (id: string, updates: Partial<WorkspaceOption>) => Promise<boolean>;
  onGenerateInviteLink: (id: string) => Promise<string | boolean>;
};

const WorkspaceDetailsDialog: React.FC<WorkspaceDetailsDialogProps> = ({
  isOpen,
  onClose,
  workspace,
  onDelete,
  onUpdate,
  onGenerateInviteLink
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [workspaceName, setWorkspaceName] = useState('');
  const [inviteEnabled, setInviteEnabled] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [inviteLink, setInviteLink] = useState('');

  // Reset states when dialog opens
  useEffect(() => {
    if (isOpen && workspace) {
      setWorkspaceName(workspace.name);
      setInviteEnabled(workspace.invite_enabled || false);
      setIsEditing(false);
      setIsDeleting(false);
      setIsCopied(false);
      setInviteLink(workspace.invite_link || '');
    }
  }, [isOpen, workspace]);

  if (!workspace) return null;

  const appUrl = `${window.location.origin}/workspace/${workspace.id}`;

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setIsCopied(true);
    toast.success('Link copied to clipboard!');
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleDelete = async () => {
    if (!workspace) return;
    
    setIsDeleting(true);
    try {
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
    if (!workspace || !workspaceName.trim()) return;
    
    setIsUpdating(true);
    try {
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

  const handleGenerateInviteLink = async () => {
    if (!workspace) return;
    
    setIsGeneratingLink(true);
    try {
      const result = await onGenerateInviteLink(workspace.id);
      
      if (typeof result === 'string') {
        setInviteLink(result);
        toast.success("Invite link generated successfully");
      } else {
        toast.error("Failed to generate invite link");
      }
    } catch (error) {
      console.error("Error generating invite link:", error);
      toast.error("An error occurred while generating the invite link");
    } finally {
      setIsGeneratingLink(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl">Workspace Details</DialogTitle>
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
                Invite Link
              </label>
              <Button
                size="sm"
                variant="outline"
                className="flex items-center gap-1" 
                onClick={handleGenerateInviteLink}
                disabled={isGeneratingLink}
              >
                {isGeneratingLink ? (
                  <>
                    <Clipboard className="h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Link className="h-4 w-4" />
                    Generate Link
                  </>
                )}
              </Button>
            </div>
            
            {inviteLink ? (
              <div className="flex items-center space-x-2">
                <Input 
                  value={inviteLink}
                  readOnly 
                  className="flex-1 bg-gray-50 dark:bg-gray-800 text-sm"
                />
                <Button 
                  size="icon" 
                  variant="outline" 
                  onClick={() => handleCopyUrl(inviteLink)}
                >
                  {isCopied ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            ) : (
              <Alert variant="default" className="bg-muted">
                <AlertDescription className="text-sm">
                  Generate an invite link to allow others to join this workspace
                </AlertDescription>
              </Alert>
            )}
            
            <div className="text-xs text-muted-foreground mt-1">
              Anyone with this link can join your workspace after authentication
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
