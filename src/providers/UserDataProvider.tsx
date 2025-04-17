
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { WorkspaceOption } from '@/hooks/useWorkspaces';
import { UserCredits } from '@/hooks/useUserCredits';

interface UserDataContextType {
  // Workspace data
  workspaces: WorkspaceOption[];
  selectedWorkspace: WorkspaceOption | null;
  workspacesLoading: boolean;
  refreshWorkspaces: () => Promise<void>;
  selectWorkspace: (workspace: WorkspaceOption) => void;

  // Credits data
  credits: UserCredits | null;
  creditsLoading: boolean;
  refreshCredits: () => Promise<void>;
  
  // Auth logs
  authLogs: any[] | null;
  authLogsLoading: boolean;
  refreshAuthLogs: () => Promise<void>;
}

const UserDataContext = createContext<UserDataContextType | undefined>(undefined);

export function UserDataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  // Workspaces state
  const [workspaces, setWorkspaces] = useState<WorkspaceOption[]>([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState<WorkspaceOption | null>(null);
  const [workspacesLoading, setWorkspacesLoading] = useState(false);
  const [workspacesFetchComplete, setWorkspacesFetchComplete] = useState(false);

  // Credits state
  const [credits, setCredits] = useState<UserCredits | null>(null);
  const [creditsLoading, setCreditsLoading] = useState(false);
  const [creditsFetchComplete, setCreditsFetchComplete] = useState(false);

  // Auth logs state
  const [authLogs, setAuthLogs] = useState<any[] | null>(null);
  const [authLogsLoading, setAuthLogsLoading] = useState(false);
  const [authLogsFetchComplete, setAuthLogsFetchComplete] = useState(false);

  // Fetch workspaces
  const fetchWorkspaces = useCallback(async () => {
    if (!user) return;
    
    setWorkspacesLoading(true);
    try {
      console.log("Centralized fetching workspaces for user:", user.id);
      const { data, error } = await supabase
        .rpc('apl_get_user_workspaces', { 
          user_id_param: user.id 
        })
        .maybeSingle();
      
      if (error) throw error;
      
      if (data && Array.isArray(data) && data.length > 0) {
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
      setWorkspacesFetchComplete(true);
    } catch (error) {
      console.error('Error in centralized workspaces fetch:', error);
      toast.error('Failed to load workspaces');
    } finally {
      setWorkspacesLoading(false);
    }
  }, [user, selectedWorkspace]);

  // Fetch user credits
  const fetchCredits = useCallback(async () => {
    if (!user) return;

    setCreditsLoading(true);
    try {
      console.log("Centralized fetching credits for user:", user.id);
      const { data, error } = await supabase
        .from('apl_user_credits')
        .select('id, user_id, credits_used, credits_limit, reset_date, is_pro, created_at, updated_at')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned" error
        throw error;
      }

      // If no record exists, create one
      if (!data) {
        console.log("No credits record found, creating new one");
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);

        const { data: newData, error: insertError } = await supabase
          .from('apl_user_credits')
          .insert({
            user_id: user.id,
            credits_used: 0,
            credits_limit: 3,
            reset_date: tomorrow.toISOString(),
            is_pro: false
          })
          .select()
          .single();

        if (insertError) throw insertError;
        console.log("New credits record created:", newData);
        setCredits(newData as UserCredits);
      } else {
        console.log("Credits record found:", data);
        // Check if we need to reset credits (reset_date has passed)
        const resetDate = new Date(data.reset_date);
        const now = new Date();

        if (now > resetDate) {
          console.log("Reset date has passed, resetting credits");
          // Reset credits and set new reset date
          const tomorrow = new Date(now);
          tomorrow.setDate(tomorrow.getDate() + 1);
          tomorrow.setHours(0, 0, 0, 0);

          const { data: updatedData, error: updateError } = await supabase
            .from('apl_user_credits')
            .update({
              credits_used: 0,
              reset_date: tomorrow.toISOString()
            })
            .eq('id', data.id)
            .select()
            .single();

          if (updateError) throw updateError;
          console.log("Credits reset, new data:", updatedData);
          setCredits(updatedData as UserCredits);
        } else {
          setCredits(data as UserCredits);
        }
      }
      
      setCreditsFetchComplete(true);
    } catch (err: any) {
      console.error('Error in centralized credits fetch:', err);
      setCredits(null);
    } finally {
      setCreditsLoading(false);
    }
  }, [user]);

  // Fetch auth logs
  const fetchAuthLogs = useCallback(async () => {
    if (!user) return;

    setAuthLogsLoading(true);
    try {
      console.log("Centralized fetching auth logs for user:", user.id);
      const { data, error } = await supabase
        .from('apl_auth_logs')
        .select('id, user_id, action, device, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      
      setAuthLogs(data || []);
      setAuthLogsFetchComplete(true);
    } catch (err) {
      console.error('Error in centralized auth logs fetch:', err);
      setAuthLogs([]);
    } finally {
      setAuthLogsLoading(false);
    }
  }, [user]);

  // Initialize data fetching when user changes
  useEffect(() => {
    if (user) {
      // Only fetch if we haven't fetched yet or user changed
      if (!workspacesFetchComplete) {
        fetchWorkspaces();
      }
      if (!creditsFetchComplete) {
        fetchCredits();
      }
      if (!authLogsFetchComplete) {
        fetchAuthLogs();
      }
    } else {
      // Clear data when user logs out
      setWorkspaces([]);
      setSelectedWorkspace(null);
      setWorkspacesFetchComplete(false);
      
      setCredits(null);
      setCreditsFetchComplete(false);
      
      setAuthLogs(null);
      setAuthLogsFetchComplete(false);
    }
  }, [
    user, 
    fetchWorkspaces, 
    fetchCredits, 
    fetchAuthLogs, 
    workspacesFetchComplete, 
    creditsFetchComplete, 
    authLogsFetchComplete
  ]);

  // Set up realtime subscription to credit changes
  useEffect(() => {
    if (!user) return;
    
    console.log("Setting up centralized realtime subscription for user credits");
    const channel = supabase
      .channel('user-data-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'apl_user_credits',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Credits updated in realtime:', payload);
          // Update local state with the new data
          setCredits(payload.new as UserCredits);
        }
      )
      .subscribe();
      
    return () => {
      console.log("Cleaning up centralized realtime subscription");
      supabase.removeChannel(channel);
    };
  }, [user]);

  const selectWorkspace = (workspace: WorkspaceOption) => {
    setSelectedWorkspace(workspace);
  };

  const refreshWorkspaces = async () => {
    console.log('Manually refreshing centralized workspaces');
    setWorkspacesFetchComplete(false);
    await fetchWorkspaces();
  };

  const refreshCredits = async () => {
    console.log('Manually refreshing centralized credits');
    setCreditsFetchComplete(false);
    await fetchCredits();
  };

  const refreshAuthLogs = async () => {
    console.log('Manually refreshing centralized auth logs');
    setAuthLogsFetchComplete(false);
    await fetchAuthLogs();
  };

  const value = {
    workspaces,
    selectedWorkspace,
    workspacesLoading,
    refreshWorkspaces,
    selectWorkspace,
    
    credits,
    creditsLoading,
    refreshCredits,
    
    authLogs,
    authLogsLoading,
    refreshAuthLogs,
  };

  return (
    <UserDataContext.Provider value={value}>
      {children}
    </UserDataContext.Provider>
  );
}

export const useUserData = () => {
  const context = useContext(UserDataContext);
  if (context === undefined) {
    throw new Error('useUserData must be used within a UserDataProvider');
  }
  return context;
};
