
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Clipboard, Check, Copy, Trash, Edit, Save, Link } from 'lucide-react';
import { WorkspaceOption } from '@/hooks/useWorkspaces';
import { Label } from "@/components/ui/label";

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
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [inviteEnabled, setInviteEnabled] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);

  // Reset states when dialog opens
  useEffect(() => {
    if (isOpen && workspace) {
      setWorkspaceName(workspace.name);
      setIsEditing(false);
      setIsDeleting(false);
      setIsCopied(false);
      setInviteEnabled(workspace.invite_enabled || false);
      setInviteLink(workspace.invite_link || '');
    }
  }, [isOpen, workspace]);

  if (!workspace) return null;

  const appUrl = `${window.location.origin}/workspace/${workspace.id}`;
  const fullInviteLink = workspace.invite_link || '';

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setIsCopied(true);
    toast.success("Link copied to clipboard");
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
      const success = await onUpdate(workspace.id, { name: workspaceName });
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

  const handleToggleInvite = async (enabled: boolean) => {
    setIsUpdating(true);
    try {
      if (enabled && !workspace.invite_link) {
        setIsGeneratingLink(true);
        // Generate a new invite link if one doesn't exist
        const success = await onUpdate(workspace.id, { 
          invite_enabled: enabled 
        });
        
        if (success) {
          toast.success(enabled ? "Invite link enabled" : "Invite link disabled");
          setInviteEnabled(enabled);
        } else {
          toast.error("Failed to update invite settings");
        }
      } else {
        // Just toggle the enabled status
        const success = await onUpdate(workspace.id, { 
          invite_enabled: enabled 
        });
        
        if (success) {
          toast.success(enabled ? "Invite link enabled" : "Invite link disabled");
          setInviteEnabled(enabled);
        } else {
          toast.error("Failed to update invite settings");
        }
      }
    } catch (error) {
      console.error("Error updating invite settings:", error);
      toast.error("An error occurred while updating invite settings");
    } finally {
      setIsUpdating(false);
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

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Workspace URL
            </label>
            <div className="flex items-center space-x-2">
              <Input 
                value={appUrl} 
                readOnly 
                className="flex-1 bg-gray-50 dark:bg-gray-800"
              />
              <Button 
                size="icon" 
                variant="outline" 
                onClick={() => handleCopyUrl(appUrl)}
              >
                {isCopied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
          
          <div className="space-y-4 border rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Invite Link</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Allow others to join this workspace</p>
              </div>
              <Switch 
                checked={inviteEnabled} 
                onCheckedChange={handleToggleInvite}
                disabled={isUpdating}
              />
            </div>
            
            {inviteEnabled && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-2"
              >
                {workspace.invite_link ? (
                  <div className="flex items-center space-x-2">
                    <Input 
                      value={workspace.invite_link} 
                      readOnly 
                      className="flex-1 text-xs bg-white dark:bg-gray-700"
                    />
                    <Button 
                      size="icon" 
                      variant="outline" 
                      onClick={() => handleCopyUrl(workspace.invite_link || '')}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                ) : isGeneratingLink ? (
                  <div className="flex items-center justify-center p-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-700"></div>
                    <span className="ml-2 text-sm">Generating link...</span>
                  </div>
                ) : (
                  <div className="flex justify-center">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleToggleInvite(true)}
                      className="flex items-center gap-2"
                    >
                      <Link className="h-4 w-4" />
                      Generate Invite Link
                    </Button>
                  </div>
                )}
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Anyone with this link can join your workspace after signing in
                </p>
              </motion.div>
            )}
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
