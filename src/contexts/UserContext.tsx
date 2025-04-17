import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { debounce } from 'lodash';

// Define types for our context data
type UserCredits = {
  id: string;
  user_id: string;
  credits_used: number;
  credits_limit: number;
  reset_date: string;
  is_pro: boolean;
  created_at: string;
  updated_at: string;
};

type WorkspaceOption = {
  id: string;
  name: string;
  initial: string;
  session_timeout?: string;
  invite_enabled?: boolean;
};

type AuthLog = {
  id: string;
  user_id: string;
  action: string;
  device?: string;
  ip_address?: string;
  created_at: string;
  details?: any;
};

interface UserContextType {
  credits: UserCredits | null;
  creditsLoading: boolean;
  refreshCredits: () => Promise<void>;
  
  workspaces: WorkspaceOption[];
  workspacesLoading: boolean;
  refreshWorkspaces: () => Promise<void>;
  
  authLogs: AuthLog[];
  authLogsLoading: boolean;
  refreshAuthLogs: () => Promise<void>;
  logAuthEvent: (action: string, details?: Record<string, any>) => Promise<void>;
  
  // Cache management
  clearCache: () => void;
}

// Create context with default value
const UserContext = createContext<UserContextType | undefined>(undefined);

// Cache durations
const CREDITS_CACHE_DURATION = 60 * 1000; // 1 minute
const WORKSPACES_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const AUTH_LOGS_CACHE_DURATION = 15 * 60 * 1000; // 15 minutes

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  
  // Credits state
  const [credits, setCredits] = useState<UserCredits | null>(null);
  const [creditsLoading, setCreditsLoading] = useState(false);
  const [lastCreditsUpdate, setLastCreditsUpdate] = useState(0);
  
  // Workspaces state
  const [workspaces, setWorkspaces] = useState<WorkspaceOption[]>([]);
  const [workspacesLoading, setWorkspacesLoading] = useState(false);
  const [lastWorkspacesUpdate, setLastWorkspacesUpdate] = useState(0);
  
  // Auth logs state
  const [authLogs, setAuthLogs] = useState<AuthLog[]>([]);
  const [authLogsLoading, setAuthLogsLoading] = useState(false);
  const [lastAuthLogsUpdate, setLastAuthLogsUpdate] = useState(0);

  // Clear all caches
  const clearCache = useCallback(() => {
    setLastCreditsUpdate(0);
    setLastWorkspacesUpdate(0);
    setLastAuthLogsUpdate(0);
  }, []);

  // Credits fetch function with caching
  const fetchUserCredits = useCallback(async (force = false) => {
    if (!user) return;
    
    const now = Date.now();
    const shouldRefetch = force || !credits || (now - lastCreditsUpdate) > CREDITS_CACHE_DURATION;
    
    if (!shouldRefetch) {
      console.log('Using cached credits data');
      return;
    }
    
    setCreditsLoading(true);
    try {
      console.log('Fetching user credits');
      
      const { data, error } = await supabase
        .from('apl_user_credits')
        .select('id, user_id, credits_used, credits_limit, reset_date, is_pro, created_at, updated_at')
        .eq('user_id', user.id)
        .single();
      
      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned" error
        throw error;
      }
      
      if (data) {
        setCredits(data);
        setLastCreditsUpdate(now);
      } else {
        // If no record, don't update the timestamp so we'll try again next time
        setCredits(null);
      }
    } catch (err) {
      console.error('Error fetching user credits:', err);
    } finally {
      setCreditsLoading(false);
    }
  }, [user, credits, lastCreditsUpdate]);

  // Workspaces fetch function with caching
  const fetchWorkspaces = useCallback(async (force = false) => {
    if (!user) return;
    
    const now = Date.now();
    const shouldRefetch = force || workspaces.length === 0 || (now - lastWorkspacesUpdate) > WORKSPACES_CACHE_DURATION;
    
    if (!shouldRefetch) {
      console.log('Using cached workspaces data');
      return;
    }
    
    setWorkspacesLoading(true);
    try {
      console.log('Fetching user workspaces');
      
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
        setLastWorkspacesUpdate(now);
      } else {
        // If no workspaces, keep timestamp updated to prevent constant refetching
        setWorkspaces([]);
        setLastWorkspacesUpdate(now);
      }
    } catch (err) {
      console.error('Error fetching workspaces:', err);
    } finally {
      setWorkspacesLoading(false);
    }
  }, [user, workspaces, lastWorkspacesUpdate]);

  // Auth logs fetch function with caching
  const fetchAuthLogs = useCallback(async (force = false) => {
    if (!user) return;
    
    const now = Date.now();
    const shouldRefetch = force || authLogs.length === 0 || (now - lastAuthLogsUpdate) > AUTH_LOGS_CACHE_DURATION;
    
    if (!shouldRefetch) {
      console.log('Using cached auth logs data');
      return;
    }
    
    setAuthLogsLoading(true);
    try {
      console.log('Fetching auth logs');
      
      // Only fetch the last 20 logs to limit data transfer
      const { data, error } = await supabase
        .from('apl_auth_logs')
        .select('id, user_id, action, device, created_at, details')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      
      setAuthLogs(data || []);
      setLastAuthLogsUpdate(now);
    } catch (err) {
      console.error('Error fetching auth logs:', err);
    } finally {
      setAuthLogsLoading(false);
    }
  }, [user, authLogs, lastAuthLogsUpdate]);

  // Log auth event with debouncing
  const logAuthEvent = useCallback(async (action: string, details?: Record<string, any>) => {
    if (!user) return;
    
    try {
      const device = navigator?.userAgent || 'Unknown device';
      
      await supabase.from('apl_auth_logs').insert({
        user_id: user.id,
        action,
        device,
        details: details ? JSON.stringify(details) : null
      });
      
      // Refresh logs but with a short delay to batch potential rapid calls
      setTimeout(() => fetchAuthLogs(true), 2000);
    } catch (error) {
      console.error('Failed to log audit event:', error);
    }
  }, [user, fetchAuthLogs]);

  // Debounced refresh functions to prevent multiple rapid calls
  const refreshCredits = useCallback(debounce(async () => {
    await fetchUserCredits(true);
  }, 300), [fetchUserCredits]);
  
  const refreshWorkspaces = useCallback(debounce(async () => {
    await fetchWorkspaces(true);
  }, 300), [fetchWorkspaces]);
  
  const refreshAuthLogs = useCallback(debounce(async () => {
    await fetchAuthLogs(true);
  }, 300), [fetchAuthLogs]);

  // Initial data loading
  useEffect(() => {
    if (user) {
      // Stagger the API calls to prevent a burst of requests on first load
      fetchUserCredits();
      
      const workspacesTimer = setTimeout(() => {
        fetchWorkspaces();
      }, 100);
      
      const logsTimer = setTimeout(() => {
        fetchAuthLogs();
      }, 300);
      
      return () => {
        clearTimeout(workspacesTimer);
        clearTimeout(logsTimer);
      };
    } else {
      // Clear data when user logs out
      setCredits(null);
      setWorkspaces([]);
      setAuthLogs([]);
      clearCache();
    }
  }, [user, fetchUserCredits, fetchWorkspaces, fetchAuthLogs, clearCache]);

  // Setup realtime subscriptions for credits updates
  useEffect(() => {
    if (!user) return;
    
    const channel = supabase
      .channel('credits-changes')
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
          setCredits(payload.new as UserCredits);
          setLastCreditsUpdate(Date.now());
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const value = {
    credits,
    creditsLoading,
    refreshCredits,
    
    workspaces,
    workspacesLoading,
    refreshWorkspaces,
    
    authLogs,
    authLogsLoading,
    refreshAuthLogs,
    logAuthEvent,
    
    clearCache
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
