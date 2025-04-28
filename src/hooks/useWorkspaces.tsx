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

interface CachedWorkspace extends WorkspaceOption {
  cachedAt: number;
}

export const useWorkspaces = () => {
  const { user } = useAuth();
  const [workspaces, setWorkspaces] = useState<WorkspaceOption[]>([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState<WorkspaceOption | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchComplete, setFetchComplete] = useState(false);
  const [cache, setCache] = useState<{[key:string]: CachedWorkspace[]}>({});
  const [fetchAttempted, setFetchAttempted] = useState(false);

  const fetchWorkspaces = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    console.log('Fetching workspaces for user:', user.id);
    setLoading(true);
    try {
      const cacheKey = user.id;
      if(cache[cacheKey] && 
         cache[cacheKey].length > 0 && 
         cache[cacheKey][0].cachedAt && 
         Date.now() - cache[cacheKey][0].cachedAt < 300000) {
        
        console.log('Using cached workspaces');
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
        setLoading(false);
        return;
      }

      console.log('Fetching workspaces from API');
      const { data, error } = await supabase
        .rpc('apl_get_user_workspaces', { 
          user_id_param: user.id 
        });

      if (error) {
        console.error('Error fetching workspaces:', error);
        throw error;
      }

      console.log('Workspaces data received:', data);

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

        console.log('Formatted workspaces:', formattedWorkspaces);
        setWorkspaces(formattedWorkspaces);
        setCache(prev => ({...prev, [cacheKey]: cachedWorkspaces}));

        if (!selectedWorkspace && formattedWorkspaces.length > 0) {
          console.log('Setting initial selected workspace:', formattedWorkspaces[0]);
          setSelectedWorkspace(formattedWorkspaces[0]);
        } else if (selectedWorkspace) {
          const updatedSelected = formattedWorkspaces.find(w => w.id === selectedWorkspace.id);
          if (updatedSelected) {
            console.log('Updating selected workspace:', updatedSelected);
            setSelectedWorkspace(updatedSelected);
          } else if (formattedWorkspaces.length > 0) {
            console.log('Previous workspace not found, selecting first:', formattedWorkspaces[0]);
            setSelectedWorkspace(formattedWorkspaces[0]);
          }
        }
      } else {
        console.log("No workspaces found, creating default workspace");
        const newWorkspace = await createWorkspace("Personal Workspace");
        if (newWorkspace) {
          console.log('Created default workspace:', newWorkspace);
          setWorkspaces([newWorkspace]);
          setSelectedWorkspace(newWorkspace);
          setCache(prev => ({...prev, [cacheKey]: [{...newWorkspace, cachedAt: Date.now()}]}));
        } else {
          console.warn('Failed to create default workspace');
          setWorkspaces([]);
          setSelectedWorkspace(null);
          setCache(prev => ({...prev, [cacheKey]: []}));
        }
      }
      setFetchComplete(true);
    } catch (error) {
      console.error('Error fetching workspaces:', error);
      toast.error('Failed to load workspaces');
    } finally {
      setFetchAttempted(true);
      setLoading(false);
    }
  }, [user, selectedWorkspace, cache]);

  useEffect(() => {
    console.log('User state changed:', user?.id, 'fetchComplete:', fetchComplete);
    if (user) {
      if (!fetchComplete || !fetchAttempted) {
        fetchWorkspaces();
      }
    } else {
      console.log('Clearing workspace state');
      setWorkspaces([]);
      setSelectedWorkspace(null);
      setFetchComplete(false);
      setFetchAttempted(false);
      setCache({});
      setLoading(false);
    }
  }, [user, fetchWorkspaces, fetchComplete, fetchAttempted]);

  const createWorkspace = async (name: string) => {
    if (!user) return null;

    try {
      const initial = name.charAt(0).toUpperCase();

      console.log('Creating workspace:', name);
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

      console.log('Workspace created:', data);
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

      setWorkspaces(prev => [...prev, newWorkspace]);
      setCache(prev => ({
        ...prev, 
        [user.id]: [...(prev[user.id] || []), cachedWorkspace]
      }));

      setSelectedWorkspace(newWorkspace);
      toast.success(`Workspace "${name}" created successfully`);
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

      const updatedWorkspaces = workspaces.map(w => 
        w.id === workspaceId ? { ...w, ...updates } : w
      );
      
      setWorkspaces(updatedWorkspaces);
      
      const updatedCachedWorkspaces = cache[user.id]?.map(w => 
        w.id === workspaceId ? { ...w, ...updates, cachedAt: Date.now() } : w
      ) || [];
      
      setCache(prev => ({...prev, [user.id]: updatedCachedWorkspaces}));

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
      
      const updatedCachedWorkspaces = cache[user.id]?.filter(w => w.id !== workspaceId) || [];
      setCache(prev => ({...prev, [user.id]: updatedCachedWorkspaces}));

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

  const refreshWorkspaces = async () => {
    console.log('Refreshing workspaces...');
    setFetchComplete(false); 
    setFetchAttempted(false);
    return fetchWorkspaces();
  };

  return {
    workspaces,
    selectedWorkspace,
    loading,
    createWorkspace,
    updateWorkspace,
    deleteWorkspace,
    selectWorkspace: (workspace: WorkspaceOption) => setSelectedWorkspace(workspace),
    refreshWorkspaces
  };
};
