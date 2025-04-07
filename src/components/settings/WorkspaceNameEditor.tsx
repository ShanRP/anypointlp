
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export const WorkspaceNameEditor: React.FC = () => {
  const [workspaceName, setWorkspaceName] = useState('Personal Workspace');
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(workspaceName);
  
  const handleEdit = () => {
    setEditedName(workspaceName);
    setIsEditing(true);
  };
  
  const handleSave = () => {
    if (editedName.trim()) {
      setWorkspaceName(editedName);
      setIsEditing(false);
      toast.success('Workspace name updated successfully');
    } else {
      toast.error('Workspace name cannot be empty');
    }
  };
  
  const handleCancel = () => {
    setEditedName(workspaceName);
    setIsEditing(false);
  };

  return (
    <div className="flex justify-between items-center">
      <div>
        <h2 className="text-lg font-semibold">Workspace Name</h2>
      </div>
      <div className="flex items-center">
        {isEditing ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center space-x-2"
          >
            <Input
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              className="w-64"
              autoFocus
            />
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleSave}
            >
              Save
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleCancel}
            >
              Cancel
            </Button>
          </motion.div>
        ) : (
          <div className="flex items-center">
            <span className="text-gray-700 dark:text-gray-300 mr-4">
              {workspaceName}
            </span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleEdit}
            >
              Edit
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
