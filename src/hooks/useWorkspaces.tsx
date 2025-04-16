
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { clearTableCache } from '@/utils/supabaseOptimizer';

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
  
  // Use refs to track changes to reduce unnecessary effects
  const prevUserId = useRef<string | null>(null);
  const prevSelectedWorkspaceId = useRef<string | null>(null);
  
  // Debounce fetch to prevent multiple calls
  let fetchTimeoutId: ReturnType<typeof setTimeout> | null = null;

  // Fetch workspaces when user is available
  const fetchWorkspaces = useCallback(async () => {
    if (!user) return;
    
    // Cancel any existing fetch timeout
    if (fetchTimeoutId) {
      clearTimeout(fetchTimeoutId);
      fetchTimeoutId = null;
    }
    
    // Clear any stale cache for workspaces
    clearTableCache('apl_workspaces');
    
    // Update the previous user ID
    prevUserId.current = user.id;
    
    setLoading(true);
    try {
      console.log('Fetching workspaces for user:', user.id);
      
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
          prevSelectedWorkspaceId.current = formattedWorkspaces[0].id;
        } else {
          // Find and update the currently selected workspace with fresh data
          const updatedSelected = formattedWorkspaces.find(w => w.id === selectedWorkspace.id);
          if (updatedSelected) {
            setSelectedWorkspace(updatedSelected);
            prevSelectedWorkspaceId.current = updatedSelected.id;
          } else {
            // If previously selected workspace doesn't exist anymore, select first one
            setSelectedWorkspace(formattedWorkspaces[0]);
            prevSelectedWorkspaceId.current = formattedWorkspaces[0].id;
          }
        }
      } else {
        // If no workspaces, set empty array
        setWorkspaces([]);
        setSelectedWorkspace(null);
        prevSelectedWorkspaceId.current = null;
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
      // Check if user has changed
      const userChanged = prevUserId.current !== user.id;
      
      // Only fetch if we haven't fetched yet, user changed, or we need a refresh
      if (!fetchComplete || userChanged) {
        fetchWorkspaces();
      }
    } else {
      // Clear workspaces when user logs out
      setWorkspaces([]);
      setSelectedWorkspace(null);
      setFetchComplete(false);
      prevUserId.current = null;
      prevSelectedWorkspaceId.current = null;
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
      prevSelectedWorkspaceId.current = newWorkspace.id;
      
      // Clear cache to ensure fresh data on next fetch
      clearTableCache('apl_workspaces');
      
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
      
      // Get the updated workspace directly from the update result
      const updatedWorkspace = data[0] ? {
        id: data[0].id,
        name: data[0].name,
        initial: data[0].initial,
        session_timeout: data[0].session_timeout,
        invite_enabled: data[0].invite_enabled
      } : null;
      
      if (updatedWorkspace) {
        // Update local state
        setWorkspaces(prev => prev.map(w => 
          w.id === workspaceId ? updatedWorkspace : w
        ));
        
        // Update selected workspace if it's the one being updated
        if (selectedWorkspace?.id === workspaceId) {
          setSelectedWorkspace(updatedWorkspace);
        }
        
        // Clear cache
        clearTableCache('apl_workspaces');
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
        prevSelectedWorkspaceId.current = updatedWorkspaces[0].id;
      }
      
      // Clear cache
      clearTableCache('apl_workspaces');
      
      return true;
    } catch (error) {
      console.error('Error deleting workspace:', error);
      toast.error('Failed to delete workspace');
      return false;
    }
  };

  const selectWorkspace = (workspace: WorkspaceOption) => {
    // Only update if actually changing workspaces
    if (selectedWorkspace?.id !== workspace.id) {
      setSelectedWorkspace(workspace);
      prevSelectedWorkspaceId.current = workspace.id;
    }
  };

  // Manually refetch workspaces (useful when we need to refresh the list)
  const refreshWorkspaces = async () => {
    console.log('Refreshing workspaces...');
    
    // Don't trigger multiple fetches in quick succession
    if (fetchTimeoutId) {
      clearTimeout(fetchTimeoutId);
    }
    
    // Debounce refresh requests
    fetchTimeoutId = setTimeout(() => {
      setFetchComplete(false); // This will trigger a refetch in the useEffect
      fetchTimeoutId = null;
    }, 300);
    
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
