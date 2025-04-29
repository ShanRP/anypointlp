
import { useState, useEffect, useCallback } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { optimizeRequest, preventDuplicateCalls } from '@/utils/networkOptimizer';

export interface WorkspaceOption {
  id: string;
  name: string;
  initial: string;
  session_timeout?: string;
  invite_enabled?: boolean;
}

interface CachedWorkspace extends WorkspaceOption {
  cachedAt: number;
}

export const useWorkspaces = () => {
  const { user } = useAuth();
  const [workspaces, setWorkspaces] = useState<WorkspaceOption[]>([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState<WorkspaceOption | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchComplete, setFetchComplete] = useState(false);
  const [cache, setCache] = useState<{[key:string]: CachedWorkspace[]}>({});
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [workspacesInitialized, setWorkspacesInitialized] = useState(false);

  // Use preventDuplicateCalls to avoid multiple simultaneous fetches
  const fetchWorkspacesOptimized = preventDuplicateCalls(
    async (forceRefresh = false, userId = '') => {
      if (!user) return { 
        workspaceList: [], 
        workspaceCache: {},
        selectedWorkspaceData: null 
      };
      
      setLoading(true);
      try {
        const cacheKey = user.id;
        if(!forceRefresh && 
           cache[cacheKey] && 
           cache[cacheKey].length > 0 && 
           cache[cacheKey][0].cachedAt && 
           Date.now() - cache[cacheKey][0].cachedAt < 300000) { // Check cache expiry (5 minutes)
          
          const cachedWorkspaces = cache[cacheKey].map(w => {
            const { cachedAt, ...workspace } = w;
            return workspace;
          });
          
          // Find currently selected workspace in cache
          let currentSelected = selectedWorkspace;
          if (!selectedWorkspace && cachedWorkspaces.length > 0) {
            currentSelected = cachedWorkspaces[0];
          } else if (selectedWorkspace) {
            const updatedSelected = cachedWorkspaces.find(w => w.id === selectedWorkspace.id);
            if (updatedSelected) {
              currentSelected = updatedSelected;
            } else if (cachedWorkspaces.length > 0) {
              currentSelected = cachedWorkspaces[0];
            }
          }
          
          return { 
            workspaceList: cachedWorkspaces, 
            workspaceCache: cache,
            selectedWorkspaceData: currentSelected 
          };
        }

        // Use optimizeRequest for the Supabase call
        const { data, error } = await optimizeRequest(
          () => supabase.rpc('apl_get_user_workspaces', { user_id_param: user.id }),
          `workspaces-${user.id}`,
          forceRefresh ? 0 : 300000 // 0ms if force refresh, 5 minutes otherwise
        );

        if (error) throw error;

        if (data && data.length > 0) {
          const formattedWorkspaces = data.map((workspace: any) => ({
            id: workspace.id,
            name: workspace.name,
            initial: workspace.initial,
            session_timeout: workspace.session_timeout,
            invite_enabled: workspace.invite_enabled
          }));

          const cachedWorkspaces = data.map((workspace: any) => ({
            id: workspace.id,
            name: workspace.name,
            initial: workspace.initial,
            session_timeout: workspace.session_timeout,
            invite_enabled: workspace.invite_enabled,
            cachedAt: Date.now()
          }));
          
          // Update the workspaceCache
          const workspaceCache = {...cache, [cacheKey]: cachedWorkspaces};

          // Find the appropriate selected workspace
          let currentSelected = selectedWorkspace;
          if (!selectedWorkspace && formattedWorkspaces.length > 0) {
            currentSelected = formattedWorkspaces[0];
          } else if (selectedWorkspace) {
            // Find and update the currently selected workspace with fresh data
            const updatedSelected = formattedWorkspaces.find(w => w.id === selectedWorkspace.id);
            if (updatedSelected) {
              currentSelected = updatedSelected;
            } else if (formattedWorkspaces.length > 0) {
              // If previously selected workspace doesn't exist anymore, select first one
              currentSelected = formattedWorkspaces[0];
            }
          }
          
          return { 
            workspaceList: formattedWorkspaces, 
            workspaceCache: workspaceCache,
            selectedWorkspaceData: currentSelected 
          };
        } else {
          // If no workspaces, return empty arrays
          return { 
            workspaceList: [], 
            workspaceCache: {...cache, [cacheKey]: []},
            selectedWorkspaceData: null 
          };
        }
      } catch (error) {
        console.error('Error fetching workspaces:', error);
        throw error;
      }
    },
    (forceRefresh, userId = '') => `fetch-workspaces-${userId || (user?.id || 'anonymous')}`
  );

  // Fetch workspaces when user is available
  const fetchWorkspaces = useCallback(async (forceRefresh = false) => {
    if (!user) return;
    
    // Prevent multiple simultaneous refreshes
    if (isRefreshing && !forceRefresh) return;
    
    setIsRefreshing(true);
    try {
      const result = await fetchWorkspacesOptimized(forceRefresh, user.id);
      
      // Update state with the fetched data
      setWorkspaces(result.workspaceList);
      setCache(result.workspaceCache);
      
      if (result.selectedWorkspaceData) {
        setSelectedWorkspace(result.selectedWorkspaceData);
      } else if (result.workspaceList.length > 0) {
        setSelectedWorkspace(result.workspaceList[0]);
      } else {
        setSelectedWorkspace(null);
      }
      
      setFetchComplete(true);
      setWorkspacesInitialized(true);
    } catch (error) {
      console.error('Error fetching workspaces:', error);
      // Only show error toast when explicitly refreshing
      if (forceRefresh) {
        toast.error('Failed to load workspaces');
      }
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [user, selectedWorkspace, cache, isRefreshing, fetchWorkspacesOptimized]);

  // Reset state when user changes or logs out
  useEffect(() => {
    if (user) {
      // Only fetch if we haven't fetched yet or user changed
      if (!workspacesInitialized) {
        fetchWorkspaces();
      }
    } else {
      // Clear workspaces when user logs out
      setWorkspaces([]);
      setSelectedWorkspace(null);
      setFetchComplete(false);
      setCache({});
      setWorkspacesInitialized(false);
    }
  }, [user, fetchWorkspaces, workspacesInitialized]);

  // Create optimized CRUD operations
  const createWorkspace = useCallback(async (name: string) => {
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

      const cachedWorkspace = {
        ...newWorkspace,
        cachedAt: Date.now()
      };

      // Update workspaces array with new workspace
      setWorkspaces(prev => [...prev, newWorkspace]);
      setCache(prev => ({
        ...prev, 
        [user.id]: [...(prev[user.id] || []), cachedWorkspace]
      }));

      // Set as selected workspace
      setSelectedWorkspace(newWorkspace);

      return newWorkspace;
    } catch (error) {
      console.error('Error creating workspace:', error);
      return null;
    }
  }, [user]);

  const updateWorkspace = useCallback(async (workspaceId: string, updates: Partial<WorkspaceOption>) => {
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
      
      // Update cache with proper CachedWorkspace objects
      const updatedCachedWorkspaces = cache[user.id]?.map(w => 
        w.id === workspaceId ? { ...w, ...updates, cachedAt: Date.now() } : w
      ) || [];
      
      setCache(prev => ({...prev, [user.id]: updatedCachedWorkspaces}));

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
  }, [user, workspaces, cache, selectedWorkspace]);

  const deleteWorkspace = useCallback(async (workspaceId: string) => {
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
      
      // Update cache with proper CachedWorkspace objects
      const updatedCachedWorkspaces = cache[user.id]?.filter(w => w.id !== workspaceId) || [];
      setCache(prev => ({...prev, [user.id]: updatedCachedWorkspaces}));

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
  }, [user, workspaces, cache, selectedWorkspace]);

  const refreshWorkspaces = useCallback(async () => {
    if (isRefreshing) return; // Prevent multiple simultaneous refreshes
    
    setIsRefreshing(true);
    console.log('Manually refreshing workspaces...');
    return fetchWorkspaces(true); // Force refresh
  }, [fetchWorkspaces, isRefreshing]);

  return {
    workspaces,
    selectedWorkspace,
    loading,
    createWorkspace,
    updateWorkspace,
    deleteWorkspace,
    selectWorkspace: (workspace: WorkspaceOption) => setSelectedWorkspace(workspace),
    refreshWorkspaces,
    workspacesInitialized
  };
};
