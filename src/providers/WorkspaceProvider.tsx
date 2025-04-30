import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface WorkspaceOption {
  id: string;
  name: string;
  initial: string;
  session_timeout?: string;
  invite_enabled?: boolean;
}

interface WorkspaceContextType {
  workspaces: WorkspaceOption[];
  selectedWorkspace: WorkspaceOption | null;
  loading: boolean;
  error: string | null;
  createWorkspace: (name: string) => Promise<WorkspaceOption | null>;
  updateWorkspace: (workspaceId: string, updates: Partial<WorkspaceOption>) => Promise<boolean>;
  deleteWorkspace: (workspaceId: string) => Promise<boolean>;
  selectWorkspace: (workspace: WorkspaceOption) => void;
  refreshWorkspaces: () => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

// Constants for caching
const WORKSPACES_CACHE_KEY = 'APL_USER_WORKSPACES';
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes

export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [workspaces, setWorkspaces] = useState<WorkspaceOption[]>([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState<WorkspaceOption | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [workspacesFetched, setWorkspacesFetched] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch workspaces when user is available
  const fetchWorkspaces = useCallback(async (forceRefresh = false) => {
    if (!user) return;
    
    setLoading(true);
    try {
      const cacheKey = `${WORKSPACES_CACHE_KEY}_${user.id}`;
      
      // Check cache first if not forcing refresh
      if (!forceRefresh) {
        const cachedData = localStorage.getItem(cacheKey);
        if (cachedData) {
          try {
            const { data, timestamp } = JSON.parse(cachedData);
            if (Date.now() - timestamp < CACHE_EXPIRY) {
              setWorkspaces(data);
              
              // Set selected workspace if not already set
              if (!selectedWorkspace && data.length > 0) {
                setSelectedWorkspace(data[0]);
              } else if (selectedWorkspace) {
                // Find and update the currently selected workspace with fresh data
                const updatedSelected = data.find(w => w.id === selectedWorkspace.id);
                if (updatedSelected) {
                  setSelectedWorkspace(updatedSelected);
                } else if (data.length > 0) {
                  // If previously selected workspace doesn't exist anymore, select first one
                  setSelectedWorkspace(data[0]);
                }
              }
              
              setWorkspacesFetched(true);
              setLoading(false);
              
              // Fetch in background to update cache
              if (user) {
                setTimeout(() => {
                  fetchWorkspacesFromDB(false);
                }, 100);
              }
              
              return;
            }
          } catch (e) {
            console.error("Error parsing cached workspaces:", e);
          }
        }
      }

      // No valid cache or force refresh, fetch from DB
      await fetchWorkspacesFromDB(true);
      
    } catch (error) {
      console.error('Error in fetchWorkspaces:', error);
      setError('Failed to load workspaces');
      setLoading(false);
    }
  }, [user, selectedWorkspace]);

  const fetchWorkspacesFromDB = async (updateLoadingState = true) => {
    if (!user) return;
    
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
          invite_enabled: workspace.invite_enabled
        }));

        // Cache the workspaces data
        localStorage.setItem(`${WORKSPACES_CACHE_KEY}_${user.id}`, JSON.stringify({
          data: formattedWorkspaces,
          timestamp: Date.now()
        }));

        setWorkspaces(formattedWorkspaces);

        // Set selected workspace if not already set or update it if it exists
        if (!selectedWorkspace && formattedWorkspaces.length > 0) {
          setSelectedWorkspace(formattedWorkspaces[0]);
        } else if (selectedWorkspace) {
          // Find and update the currently selected workspace with fresh data
          const updatedSelected = formattedWorkspaces.find(w => w.id === selectedWorkspace.id);
          if (updatedSelected) {
            setSelectedWorkspace(updatedSelected);
          } else if (formattedWorkspaces.length > 0) {
            // If previously selected workspace doesn't exist anymore, select first one
            setSelectedWorkspace(formattedWorkspaces[0]);
          }
        }
      } else {
        // If no workspaces, set empty array
        setWorkspaces([]);
        setSelectedWorkspace(null);
        localStorage.removeItem(`${WORKSPACES_CACHE_KEY}_${user.id}`);
      }
      
      setWorkspacesFetched(true);
    } catch (error) {
      console.error('Error fetching workspaces from DB:', error);
      setError('Failed to load workspaces');
    } finally {
      if (updateLoadingState) {
        setLoading(false);
      }
      setIsRefreshing(false);
    }
  };

  // Reset state when user changes or logs out
  useEffect(() => {
    if (user) {
      // Only fetch if we haven't fetched yet or user changed
      if (!workspacesFetched) {
        fetchWorkspaces();
      }
    } else {
      // Clear workspaces when user logs out
      setWorkspaces([]);
      setSelectedWorkspace(null);
      setWorkspacesFetched(false);
    }
  }, [user, fetchWorkspaces, workspacesFetched]);

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
      
      // Update cache
      const cacheKey = `${WORKSPACES_CACHE_KEY}_${user.id}`;
      const cachedData = localStorage.getItem(cacheKey);
      if (cachedData) {
        try {
          const { data: cachedWorkspaces, timestamp } = JSON.parse(cachedData);
          localStorage.setItem(cacheKey, JSON.stringify({
            data: [...cachedWorkspaces, newWorkspace],
            timestamp: Date.now()
          }));
        } catch (e) {
          console.error("Error updating workspace cache:", e);
        }
      }

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
      const { error } = await supabase
        .from('apl_workspaces')
        .update(updates)
        .eq('id', workspaceId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Update local state
      const updatedWorkspaces = workspaces.map(w => 
        w.id === workspaceId ? { ...w, ...updates } : w
      );
      
      setWorkspaces(updatedWorkspaces);
      
      // Update cache
      const cacheKey = `${WORKSPACES_CACHE_KEY}_${user.id}`;
      localStorage.setItem(cacheKey, JSON.stringify({
        data: updatedWorkspaces,
        timestamp: Date.now()
      }));

      // Update selected workspace if it's the one being updated
      if (selectedWorkspace?.id === workspaceId) {
        setSelectedWorkspace({ ...selectedWorkspace, ...updates });
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
      
      // Update cache
      const cacheKey = `${WORKSPACES_CACHE_KEY}_${user.id}`;
      localStorage.setItem(cacheKey, JSON.stringify({
        data: updatedWorkspaces,
        timestamp: Date.now()
      }));

      // If the deleted workspace was selected, select another one
      if (selectedWorkspace?.id === workspaceId) {
        const newSelectedWorkspace = updatedWorkspaces[0];
        setSelectedWorkspace(newSelectedWorkspace);
      }

      return true;
    } catch (error) {
      console.error('Error deleting workspace:', error);
      toast.error('Failed to delete workspace');
      return false;
    }
  };

  const refreshWorkspaces = async () => {
    if (isRefreshing) return; // Prevent multiple simultaneous refreshes
    
    setIsRefreshing(true);
    console.log('Manually refreshing workspaces...');
    await fetchWorkspaces(true); // Force refresh
  };

  const selectWorkspace = (workspace: WorkspaceOption) => {
    if (selectedWorkspace?.id !== workspace.id) {
      setSelectedWorkspace(workspace);
    }
  };

  // Set up realtime subscription for workspace changes
  useEffect(() => {
    if (!user) return;
    
    const workspacesChannel = supabase
      .channel('workspace-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen for all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'apl_workspaces',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Workspace changed in realtime:', payload);
          // Refresh workspaces to get the latest data
          refreshWorkspaces();
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(workspacesChannel);
    };
  }, [user, refreshWorkspaces]);

  const value = {
    workspaces,
    selectedWorkspace,
    loading,
    error,
    createWorkspace,
    updateWorkspace,
    deleteWorkspace,
    selectWorkspace,
    refreshWorkspaces
  };

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspaces = () => {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error('useWorkspaces must be used within a WorkspaceProvider');
  }
  return context;
};
