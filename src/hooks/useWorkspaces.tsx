
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
}

export const useWorkspaces = () => {
  const { user } = useAuth();
  const [workspaces, setWorkspaces] = useState<WorkspaceOption[]>([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState<WorkspaceOption | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchComplete, setFetchComplete] = useState(false);

  // Fetch workspaces when user is available
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
        }));
        
        setWorkspaces(formattedWorkspaces);
        
        // Set selected workspace if not already set or update it if it exists
        if (!selectedWorkspace) {
          setSelectedWorkspace(formattedWorkspaces[0]);
        } else {
          // Find and update the currently selected workspace with fresh data
          const updatedSelected = formattedWorkspaces.find(w => w.id === selectedWorkspace.id);
          if (updatedSelected) {
            setSelectedWorkspace(updatedSelected);
          } else {
            // If previously selected workspace doesn't exist anymore, select first one
            setSelectedWorkspace(formattedWorkspaces[0]);
          }
        }
      } else {
        // If no workspaces, set empty array
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

  // Reset state when user changes or logs out
  useEffect(() => {
    if (user) {
      // Only fetch if we haven't fetched yet or user changed
      if (!fetchComplete) {
        fetchWorkspaces();
      }
    } else {
      // Clear workspaces when user logs out
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
        invite_enabled: data.invite_enabled
      };
      
      // Update workspaces array with new workspace
      setWorkspaces(prev => [...prev, newWorkspace]);
      
      // Set as selected workspace
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
      
      // Fetch updated workspace data to ensure we have the latest
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
        invite_enabled: refreshedData.invite_enabled
      };
      
      // Update local state
      setWorkspaces(prev => prev.map(w => 
        w.id === workspaceId ? updatedWorkspace : w
      ));
      
      // Update selected workspace if it's the one being updated
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
      // Don't allow deletion if it's the only workspace
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
      
      // Update the workspaces list
      const updatedWorkspaces = workspaces.filter(w => w.id !== workspaceId);
      setWorkspaces(updatedWorkspaces);
      
      // If the deleted workspace was selected, select another one
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

  const selectWorkspace = (workspace: WorkspaceOption) => {
    setSelectedWorkspace(workspace);
  };

  // Manually refetch workspaces (useful when we need to refresh the list)
  const refreshWorkspaces = async () => {
    console.log('Refreshing workspaces...');
    setFetchComplete(false); // This will trigger a refetch in the useEffect
    return fetchWorkspaces(); // Return the promise for cases where we want to await the refresh
  };

  return {
    workspaces,
    selectedWorkspace,
    loading,
    createWorkspace,
    updateWorkspace,
    deleteWorkspace,
    selectWorkspace,
    refreshWorkspaces
  };
};
