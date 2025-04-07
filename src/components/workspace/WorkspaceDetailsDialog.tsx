
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Clipboard, Check, Copy, Trash, Edit, Save } from 'lucide-react';
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
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Reset states when dialog opens
  React.useEffect(() => {
    if (isOpen && workspace) {
      setWorkspaceName(workspace.name);
      setIsEditing(false);
      setIsDeleting(false);
      setIsCopied(false);
    }
  }, [isOpen, workspace]);

  if (!workspace) return null;

  const appUrl = `${window.location.origin}/workspace/${workspace.id}`;

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(appUrl);
    setIsCopied(true);
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
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
                onClick={handleCopyUrl}
              >
                {isCopied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
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
