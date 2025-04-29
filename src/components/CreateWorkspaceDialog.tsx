
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useLanguage } from '@/providers/LanguageProvider';
import { motion } from "framer-motion";

type CreateWorkspaceDialogProps = {
  onSuccess?: () => void;
};

const CreateWorkspaceDialog: React.FC<CreateWorkspaceDialogProps> = ({
  onSuccess
}) => {
  const [workspaceName, setWorkspaceName] = useState('');
  const { t } = useLanguage();
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!workspaceName.trim()) {
      toast.error(t('workspace.nameRequired') || 'Workspace name is required');
      return;
    }
    
    // Here you would typically call an API to create the workspace
    // For now we'll just simulate success
    setTimeout(() => {
      toast.success(t('workspace.created') || 'Workspace created successfully');
      setWorkspaceName('');
      if (onSuccess) {
        onSuccess();
      }
    }, 500);
  };
  
  return (
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
      
      <div className="flex justify-end space-x-2">
        <Button type="submit">{t('common.submit') || 'Create'}</Button>
      </div>
    </motion.form>
  );
};

export default CreateWorkspaceDialog;
