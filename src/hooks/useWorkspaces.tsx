
import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { clearCacheByPrefix } from '@/utils/supabaseOptimizer';

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
  const [activeRequests, setActiveRequests] = useState<Record<string, Promise<any>>>({});

  // Fetch workspaces when user is available
  const fetchWorkspaces = useCallback(async (forceRefresh = false) => {
    if (!user) return;
    
    const requestKey = `fetch-workspaces-${user.id}`;
    
    // If there's already an active request for this data, return it
    if (!forceRefresh && activeRequests[requestKey]) {
      return activeRequests[requestKey];
    }
    
    setLoading(true);
    
    // Create a new request and store it
    const request = (async () => {
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
          
          setWorkspaces(cachedWorkspaces);
          
          if (!selectedWorkspace && cachedWorkspaces.length > 0) {
            setSelectedWorkspace(cachedWorkspaces[0]);
          } else if (selectedWorkspace) {
            const updatedSelected = cachedWorkspaces.find(w => w.id === selectedWorkspace.id);
            if (updatedSelected) {
              setSelectedWorkspace(updatedSelected);
            } else if (cachedWorkspaces.length > 0) {
              setSelectedWorkspace(cachedWorkspaces[0]);
            }
          }
          setFetchComplete(true);
          return cachedWorkspaces;
        }

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

          const cachedWorkspaces = data.map((workspace: any) => ({
            id: workspace.id,
            name: workspace.name,
            initial: workspace.initial,
            session_timeout: workspace.session_timeout,
            invite_enabled: workspace.invite_enabled,
            cachedAt: Date.now()
          }));

          setWorkspaces(formattedWorkspaces);
          setCache(prev => ({...prev, [cacheKey]: cachedWorkspaces}));

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
          setFetchComplete(true);
          return formattedWorkspaces;
        } else {
          // If no workspaces, set empty array
          setWorkspaces([]);
          setSelectedWorkspace(null);
          setCache(prev => ({...prev, [cacheKey]: []}));
          setFetchComplete(true);
          return [];
        }
      } catch (error) {
        console.error('Error fetching workspaces:', error);
        // Only show error toast when explicitly refreshing
        if (forceRefresh) {
          toast.error('Failed to load workspaces');
        }
        return [];
      } finally {
        setLoading(false);
        setIsRefreshing(false);
        // Remove this request from active requests
        setActiveRequests(prev => {
          const newRequests = {...prev};
          delete newRequests[requestKey];
          return newRequests;
        });
      }
    })();
    
    // Store the promise
    setActiveRequests(prev => ({
      ...prev,
      [requestKey]: request
    }));
    
    return request;
  }, [user, selectedWorkspace, cache, activeRequests]);

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
      setCache({});
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
      
      // Update cache with proper CachedWorkspace objects
      const updatedCachedWorkspaces = cache[user.id]?.map(w => 
        w.id === workspaceId ? { ...w, ...updates, cachedAt: Date.now() } : w
      ) || [];
      
      setCache(prev => ({...prev, [user.id]: updatedCachedWorkspaces}));

      // Update selected workspace if it's the one being updated
      if (selectedWorkspace?.id === workspaceId) {
        setSelectedWorkspace({ ...selectedWorkspace, ...updates });
      }
      
      // Clear any cached data related to this workspace
      clearCacheByPrefix(`workspace-${workspaceId}`);

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
      
      // Update cache with proper CachedWorkspace objects
      const updatedCachedWorkspaces = cache[user.id]?.filter(w => w.id !== workspaceId) || [];
      setCache(prev => ({...prev, [user.id]: updatedCachedWorkspaces}));

      // If the deleted workspace was selected, select another one
      if (selectedWorkspace?.id === workspaceId) {
        setSelectedWorkspace(updatedWorkspaces[0]);
      }
      
      // Clear any cached data related to this workspace
      clearCacheByPrefix(`workspace-${workspaceId}`);

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
    return fetchWorkspaces(true); // Force refresh
  };

  return {
    workspaces,
    selectedWorkspace,
    loading,
    createWorkspace,
    updateWorkspace,
    deleteWorkspace,
    selectWorkspace: (workspace: WorkspaceOption) => setSelectedWorkspace(workspace),
    refreshWorkspaces,
    fetchWorkspaces
  };
};
