
import React, { createContext, useContext } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface UserContextType {
  credits: any;
  workspaces: any[];
  logs: any[];
  loading: boolean;
  refreshCredits: () => Promise<void>;
  refreshWorkspaces: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

// Longer cache times for less frequently changing data
const STALE_TIME = 1000 * 60 * 5; // 5 minutes

// Query keys for better cache management
const QUERY_KEYS = {
  credits: 'userCredits',
  workspaces: 'userWorkspaces',
  logs: 'userLogs',
  tasks: {
    all: 'tasks',
    integration: 'integrationTasks',
    raml: 'ramlTasks',
    munit: 'munitTasks',
    sampleData: 'sampleDataTasks',
    document: 'documentTasks',
    diagram: 'diagramTasks'
  }
};

export function UserProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const {
    data: credits,
    isLoading: isCreditsLoading,
    refetch: refreshCredits
  } = useQuery({
    queryKey: [QUERY_KEYS.credits, user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("apl_user_credits")
        .select("id, credits_used, credits_limit, reset_date, is_pro")
        .eq("user_id", user.id)
        .single();
      return data;
    },
    enabled: !!user,
    gcTime: 1000 * 60 * 30, // 30 minutes (gcTime replaces cacheTime)
    staleTime: STALE_TIME
  });

  const {
    data: workspaces = [],
    isLoading: isWorkspacesLoading,
    refetch: refreshWorkspaces
  } = useQuery({
    queryKey: [QUERY_KEYS.workspaces, user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase.rpc("apl_get_user_workspaces", {
        user_id_param: user.id,
      });
      return data || [];
    },
    enabled: !!user,
    gcTime: 1000 * 60 * 30, // 30 minutes
    staleTime: STALE_TIME
  });

  const {
    data: logs = [],
    isLoading: isLogsLoading,
  } = useQuery({
    queryKey: [QUERY_KEYS.logs, user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from("apl_auth_logs")
        .select("id, created_at, level, message") // Changed timestamp to created_at based on schema
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!user,
    gcTime: 1000 * 60 * 30, // 30 minutes
    staleTime: STALE_TIME
  });

  // Set up real-time subscriptions for critical updates only
  React.useEffect(() => {
    if (!user) return;

    const creditsChannel = supabase
      .channel("credits-changes")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "apl_user_credits",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.credits, user.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(creditsChannel);
    };
  }, [user, queryClient]);

  const loading = isCreditsLoading || isWorkspacesLoading || isLogsLoading;

  return (
    <UserContext.Provider
      value={{
        credits,
        workspaces,
        logs,
        loading,
        refreshCredits: async () => { await refreshCredits(); },
        refreshWorkspaces: async () => { await refreshWorkspaces(); },
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export const useUserContext = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUserContext must be used within a UserProvider");
  }
  return context;
};
