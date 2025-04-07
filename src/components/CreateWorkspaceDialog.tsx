
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useLanguage } from '@/providers/LanguageProvider';
import { motion } from "framer-motion";

type CreateWorkspaceDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onCreateWorkspace: (name: string) => void;
};

const CreateWorkspaceDialog: React.FC<CreateWorkspaceDialogProps> = ({
  isOpen,
  onClose,
  onCreateWorkspace
}) => {
  const [workspaceName, setWorkspaceName] = useState('');
  const { t } = useLanguage();
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!workspaceName.trim()) {
      toast.error(t('workspace.nameRequired') || 'Workspace name is required');
      return;
    }
    
    onCreateWorkspace(workspaceName);
    setWorkspaceName('');
    onClose();
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('workspace.create') || 'Create Workspace'}</DialogTitle>
        </DialogHeader>
        
        <motion.form 
          onSubmit={handleSubmit} 
          className="space-y-4 py-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="space-y-2">
            <Input
              id="workspace-name"
              placeholder={t('workspace.namePlaceholder') || 'Enter workspace name'}
              value={workspaceName}
              onChange={(e) => setWorkspaceName(e.target.value)}
              autoFocus
              className="w-full"
            />
          </div>
          
          <DialogFooter>
            <Button variant="outline" type="button" onClick={onClose}>
              {t('common.cancel') || 'Cancel'}
            </Button>
            <Button type="submit">{t('common.submit') || 'Create'}</Button>
          </DialogFooter>
        </motion.form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateWorkspaceDialog;
