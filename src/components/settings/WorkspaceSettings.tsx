
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Send, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useWorkspaces } from '@/hooks/useWorkspaces';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export const WorkspaceSettings: React.FC = () => {
  const { selectedWorkspace, updateWorkspace, refreshWorkspaces, workspacesInitialized } = useWorkspaces();
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [isSendingInvite, setIsSendingInvite] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  useEffect(() => {
    if (selectedWorkspace) {
      setEditedName(selectedWorkspace.name);
      setIsEditing(false);
    }
  }, [selectedWorkspace]);
  
  const handleRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    await refreshWorkspaces();
    setIsRefreshing(false);
  };
  
  if (!selectedWorkspace) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-gray-50 dark:bg-gray-800 rounded-lg p-8">
        <p className="text-gray-500 mb-4">No workspace selected</p>
        <Button 
          variant="outline" 
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="relative"
        >
          {isRefreshing ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Refreshing...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh Workspaces
            </>
          )}
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
    const success = await updateWorkspace(selectedWorkspace.id, {
      invite_enabled: checked
    });
    
    if (success) {
      toast.success(`Invite functionality ${checked ? 'enabled' : 'disabled'}`);
    }
  };
  
  const handleSessionTimeoutChange = async (value: string) => {
    const success = await updateWorkspace(selectedWorkspace.id, {
      session_timeout: value
    });
    
    if (success) {
      toast.success(`Session timeout updated to ${value}`);
    }
  };
  
  const validateEmail = (email: string): boolean => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const sendInvitation = async () => {
    if (!validateEmail(inviteEmail)) {
      toast.error("Please enter a valid email address");
      return;
    }
    
    setIsSendingInvite(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-workspace-invitation", {
        body: {
          type: "tool",
          name: "send-invitation",
          arguments: {
            workspaceId: selectedWorkspace.id,
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
      
      if (responseData.warning) {
        toast.warning(responseData.message || "Invitation created but email could not be sent");
      } else {
        toast.success(responseData.message || "Invitation sent successfully");
      }
      
      setInviteEmail('');
    } catch (error) {
      console.error("Error sending invitation:", error);
      
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
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={selectedWorkspace.id}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-8"
      >
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
        
        <div className="space-y-4 p-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold">Enable Workspace Invitations</h2>
              <p className="text-sm text-gray-500">Allow others to join this workspace</p>
            </div>
            <Switch 
              checked={selectedWorkspace.invite_enabled || false}
              onCheckedChange={handleInviteToggle}
            />
          </div>
          
          {selectedWorkspace.invite_enabled && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex flex-col space-y-4 mt-4"
            >
              <h3 className="text-md font-medium">Invite User by Email</h3>
              <div className="flex items-center space-x-2">
                <Input 
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="user@example.com"
                  type="email"
                  className="flex-1"
                />
                <Button 
                  onClick={sendInvitation}
                  disabled={isSendingInvite || !inviteEmail.trim()}
                >
                  {isSendingInvite ? (
                    <span className="flex items-center">
                      <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                      Sending...
                    </span>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send
                    </>
                  )}
                </Button>
              </div>
              <p className="text-sm text-gray-500">
                The user will receive an email with a link to join this workspace.
              </p>
            </motion.div>
          )}
        </div>
        
        <Separator className="my-8" />
        
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
