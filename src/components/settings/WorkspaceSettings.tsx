
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Clipboard, Check } from 'lucide-react';
import { toast } from 'sonner';
import { useWorkspaces } from '@/hooks/useWorkspaces';

export const WorkspaceSettings: React.FC = () => {
  const { selectedWorkspace, updateWorkspace, generateInviteLink, refreshWorkspaces } = useWorkspaces();
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  
  // Reset edited name when workspace changes
  useEffect(() => {
    if (selectedWorkspace) {
      setEditedName(selectedWorkspace.name);
      setIsEditing(false);
      setIsCopied(false);
    }
  }, [selectedWorkspace]);
  
  // Early return if no workspace is selected
  if (!selectedWorkspace) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-gray-50 dark:bg-gray-800 rounded-lg p-8">
        <p className="text-gray-500 mb-4">No workspace selected</p>
        <Button variant="outline" onClick={refreshWorkspaces}>
          Refresh Workspaces
        </Button>
      </div>
    );
  }
  
  const handleEdit = () => {
    setEditedName(selectedWorkspace.name);
    setIsEditing(true);
  };
  
  const handleSave = async () => {
    if (editedName.trim()) {
      const initial = editedName.charAt(0).toUpperCase();
      const success = await updateWorkspace(selectedWorkspace.id, {
        name: editedName,
        initial
      });
      
      if (success) {
        setIsEditing(false);
        toast.success('Workspace name updated successfully');
        // Refresh workspaces to ensure UI is updated
        refreshWorkspaces();
      }
    } else {
      toast.error('Workspace name cannot be empty');
    }
  };
  
  const handleCancel = () => {
    setEditedName(selectedWorkspace.name);
    setIsEditing(false);
  };

  const handleInviteToggle = async (checked: boolean) => {
    let inviteLink = selectedWorkspace.invite_link;
    
    // If enabling invites and no link exists, generate one
    if (checked && !inviteLink) {
      const generatedLink = await generateInviteLink(selectedWorkspace.id);
      if (typeof generatedLink === 'string') {
        inviteLink = generatedLink;
      }
    }
    
    const success = await updateWorkspace(selectedWorkspace.id, {
      invite_enabled: checked,
      invite_link: inviteLink
    });
    
    if (success) {
      toast.success(`Invite link ${checked ? 'enabled' : 'disabled'}`);
      // Refresh workspaces to ensure UI is updated
      refreshWorkspaces();
    }
  };
  
  const handleSessionTimeoutChange = async (value: string) => {
    const success = await updateWorkspace(selectedWorkspace.id, {
      session_timeout: value
    });
    
    if (success) {
      toast.success(`Session timeout updated to ${value}`);
      // Refresh workspaces to ensure UI is updated
      refreshWorkspaces();
    }
  };
  
  const copyInviteLink = () => {
    if (selectedWorkspace.invite_link) {
      navigator.clipboard.writeText(selectedWorkspace.invite_link);
      setIsCopied(true);
      toast.success('Invite link copied to clipboard');
      
      setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    }
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={selectedWorkspace.id} // Add key to force re-render when workspace changes
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-8"
      >
        {/* Workspace Name Section */}
        <div className="flex justify-between items-center p-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div>
            <h2 className="text-lg font-semibold">Workspace Name</h2>
            <p className="text-sm text-gray-500">ID: {selectedWorkspace.id?.substring(0, 8)}</p>
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
                  {selectedWorkspace.name}
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
        
        <Separator className="my-8" />
        
        {/* Enable Invite Link Section */}
        <div className="space-y-4 p-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold">Enable Invite Link</h2>
              <p className="text-sm text-gray-500">Allow others to join this workspace</p>
            </div>
            <Switch 
              checked={selectedWorkspace.invite_enabled || false}
              onCheckedChange={handleInviteToggle}
            />
          </div>
          
          {selectedWorkspace.invite_enabled && selectedWorkspace.invite_link && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center mt-4 bg-white dark:bg-gray-700 p-3 rounded-md"
            >
              <Input 
                value={selectedWorkspace.invite_link} 
                readOnly 
                className="flex-1 mr-2" 
              />
              <Button
                variant="outline"
                size="icon"
                onClick={copyInviteLink}
                className="h-10 w-10"
              >
                {isCopied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Clipboard className="h-4 w-4" />
                )}
              </Button>
            </motion.div>
          )}
        </div>
        
        <Separator className="my-8" />
        
        {/* Session Timeout Section */}
        <div className="flex justify-between items-center p-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div>
            <h2 className="text-lg font-semibold">Session Timeout</h2>
            <p className="text-sm text-gray-500">Set how long users can stay logged in</p>
          </div>
          <div className="w-[200px]">
            <Select 
              value={selectedWorkspace.session_timeout || '30 days'} 
              onValueChange={handleSessionTimeoutChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select timeout" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15 days">15 days</SelectItem>
                <SelectItem value="30 days">30 days</SelectItem>
                <SelectItem value="60 days">60 days</SelectItem>
                <SelectItem value="90 days">90 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
