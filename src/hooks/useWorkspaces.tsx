import { useState, useEffect, useCallback } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface WorkspaceOption {
  id: string;
  name: string;
  initial: string;
  session_timeout?: string;
  invite_enabled?: boolean;
  invite_link?: string;
}

export const useWorkspaces = () => {
  const { user } = useAuth();
  const [workspaces, setWorkspaces] = useState<WorkspaceOption[]>([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState<WorkspaceOption | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchComplete, setFetchComplete] = useState(false);

  const fetchWorkspaces = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .rpc('apl_get_user_workspaces', { 
          user_id_param: user.id 
        });
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        const formattedWorkspaces = data.map((workspace: any) => ({
          id: workspace.id,
          name: workspace.name,
          initial: workspace.initial,
          session_timeout: workspace.session_timeout,
          invite_enabled: workspace.invite_enabled,
          invite_link: workspace.invite_link,
        }));
        
        setWorkspaces(formattedWorkspaces);
        
        if (!selectedWorkspace) {
          setSelectedWorkspace(formattedWorkspaces[0]);
        } else {
          const updatedSelected = formattedWorkspaces.find(w => w.id === selectedWorkspace.id);
          if (updatedSelected) {
            setSelectedWorkspace(updatedSelected);
          } else {
            setSelectedWorkspace(formattedWorkspaces[0]);
          }
        }
      } else {
        setWorkspaces([]);
        setSelectedWorkspace(null);
      }
      setFetchComplete(true);
    } catch (error) {
      console.error('Error fetching workspaces:', error);
      toast.error('Failed to load workspaces');
    } finally {
      setLoading(false);
    }
  }, [user, selectedWorkspace]);

  useEffect(() => {
    if (user) {
      if (!fetchComplete) {
        fetchWorkspaces();
      }
    } else {
      setWorkspaces([]);
      setSelectedWorkspace(null);
      setFetchComplete(false);
    }
  }, [user, fetchWorkspaces, fetchComplete]);

  const createWorkspace = async (name: string) => {
    if (!user) return null;
    
    try {
      const initial = name.charAt(0).toUpperCase();
      
      const { data, error } = await supabase
        .from('apl_workspaces')
        .insert([
          { 
            user_id: user.id,
            name,
            initial,
            session_timeout: '30 days',
            invite_enabled: false
          }
        ])
        .select()
        .single();
      
      if (error) throw error;
      
      const newWorkspace: WorkspaceOption = {
        id: data.id,
        name: data.name,
        initial: data.initial,
        session_timeout: data.session_timeout,
        invite_enabled: data.invite_enabled,
        invite_link: data.invite_link
      };
      
      setWorkspaces(prev => [...prev, newWorkspace]);
      
      setSelectedWorkspace(newWorkspace);
      
      return newWorkspace;
    } catch (error) {
      console.error('Error creating workspace:', error);
      toast.error('Failed to create workspace');
      return null;
    }
  };

  const updateWorkspace = async (workspaceId: string, updates: Partial<WorkspaceOption>) => {
    if (!user) return false;
    
    try {
      const { data, error } = await supabase
        .from('apl_workspaces')
        .update(updates)
        .eq('id', workspaceId)
        .eq('user_id', user.id)
        .select();
      
      if (error) throw error;
      
      const { data: refreshedData, error: refreshError } = await supabase
        .from('apl_workspaces')
        .select('*')
        .eq('id', workspaceId)
        .single();
        
      if (refreshError) throw refreshError;
      
      const updatedWorkspace = {
        id: refreshedData.id,
        name: refreshedData.name,
        initial: refreshedData.initial,
        session_timeout: refreshedData.session_timeout,
        invite_enabled: refreshedData.invite_enabled,
        invite_link: refreshedData.invite_link
      };
      
      setWorkspaces(prev => prev.map(w => 
        w.id === workspaceId ? updatedWorkspace : w
      ));
      
      if (selectedWorkspace?.id === workspaceId) {
        setSelectedWorkspace(updatedWorkspace);
      }
      
      return true;
    } catch (error) {
      console.error('Error updating workspace:', error);
      toast.error('Failed to update workspace');
      return false;
    }
  };

  const deleteWorkspace = async (workspaceId: string) => {
    if (!user) return false;
    
    try {
      if (workspaces.length <= 1) {
        toast.error('Cannot delete the only workspace. Please create another workspace first.');
        return false;
      }
      
      const { error } = await supabase
        .from('apl_workspaces')
        .delete()
        .eq('id', workspaceId)
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      const updatedWorkspaces = workspaces.filter(w => w.id !== workspaceId);
      setWorkspaces(updatedWorkspaces);
      
      if (selectedWorkspace?.id === workspaceId) {
        setSelectedWorkspace(updatedWorkspaces[0]);
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting workspace:', error);
      toast.error('Failed to delete workspace');
      return false;
    }
  };

  const generateInviteLink = async (workspaceId: string) => {
    if (!user) return false;
    
    try {
      console.log('Generating invite link for workspace:', workspaceId);
      
      const inviteLink = `${window.location.origin}/invite/${workspaceId}`;
      
      console.log('Generated invite link:', inviteLink);
      
      const { data, error } = await supabase
        .from('apl_workspaces')
        .update({ 
          invite_link: inviteLink,
          invite_enabled: true
        })
        .eq('id', workspaceId)
        .select();
      
      if (error) {
        console.error('Error updating workspace:', error);
        throw error;
      }
      
      const { data: refreshedData, error: refreshError } = await supabase
        .from('apl_workspaces')
        .select('*')
        .eq('id', workspaceId)
        .single();
        
      if (refreshError) {
        console.error('Error fetching refreshed data:', refreshError);
        throw refreshError;
      }
      
      const updatedWorkspace = {
        id: refreshedData.id,
        name: refreshedData.name,
        initial: refreshedData.initial,
        session_timeout: refreshedData.session_timeout,
        invite_enabled: refreshedData.invite_enabled,
        invite_link: refreshedData.invite_link
      };
      
      setWorkspaces(prev => prev.map(w => 
        w.id === workspaceId ? updatedWorkspace : w
      ));
      
      if (selectedWorkspace?.id === workspaceId) {
        setSelectedWorkspace(updatedWorkspace);
      }
      
      return inviteLink;
    } catch (error) {
      console.error('Error generating invite link:', error);
      toast.error('Failed to generate invite link');
      return false;
    }
  };

  const selectWorkspace = (workspace: WorkspaceOption) => {
    setSelectedWorkspace(workspace);
  };

  const refreshWorkspaces = () => {
    setFetchComplete(false);
  };

  return {
    workspaces,
    selectedWorkspace,
    loading,
    createWorkspace,
    updateWorkspace,
    deleteWorkspace,
    selectWorkspace,
    generateInviteLink,
    refreshWorkspaces
  };
};
