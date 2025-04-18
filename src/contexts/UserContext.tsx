
import React, { createContext, useContext } from "react";
import { useQuery } from "@tanstack/react-query";
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

const CACHE_TIME = 1000 * 60 * 5; // 5 minutes
const STALE_TIME = 1000 * 60 * 1; // 1 minute

export function UserProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  const {
    data: credits,
    isLoading: isCreditsLoading,
    refetch: refreshCredits
  } = useQuery({
    queryKey: ['userCredits', user?.id],
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
    cacheTime: CACHE_TIME,
    staleTime: STALE_TIME
  });

  const {
    data: workspaces = [],
    isLoading: isWorkspacesLoading,
    refetch: refreshWorkspaces
  } = useQuery({
    queryKey: ['userWorkspaces', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase.rpc("apl_get_user_workspaces", {
        user_id_param: user.id,
      });
      return data || [];
    },
    enabled: !!user,
    cacheTime: CACHE_TIME,
    staleTime: STALE_TIME
  });

  const {
    data: logs = [],
    isLoading: isLogsLoading,
  } = useQuery({
    queryKey: ['userLogs', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from("apl_auth_logs")
        .select("id, timestamp, level, message")
        .eq("user_id", user.id)
        .order("timestamp", { ascending: false });
      return data || [];
    },
    enabled: !!user,
    cacheTime: CACHE_TIME,
    staleTime: STALE_TIME
  });

  // Set up real-time subscriptions for critical updates
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
        () => refreshCredits()
      )
      .subscribe();

    const workspacesChannel = supabase
      .channel("workspaces-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "apl_workspaces",
          filter: `user_id=eq.${user.id}`,
        },
        () => refreshWorkspaces()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(creditsChannel);
      supabase.removeChannel(workspacesChannel);
    };
  }, [user, refreshCredits, refreshWorkspaces]);

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
