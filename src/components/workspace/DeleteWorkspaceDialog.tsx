
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from 'lucide-react';

interface DeleteWorkspaceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceName: string;
  onDelete: () => Promise<void>;
}

const DeleteWorkspaceDialog: React.FC<DeleteWorkspaceDialogProps> = ({
  isOpen,
  onClose,
  workspaceName,
  onDelete
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDelete = async () => {
    setIsSubmitting(true);
    
    try {
      await onDelete();
      onClose();
    } catch (error) {
      console.error('Error deleting workspace:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-500">
            <AlertTriangle className="h-5 w-5" />
            Delete Workspace
          </DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete the
            workspace "{workspaceName}" and all associated tasks and data.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Are you sure you want to delete this workspace?
          </p>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            type="button" 
            variant="destructive" 
            onClick={handleDelete}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Deleting..." : "Delete workspace"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteWorkspaceDialog;
