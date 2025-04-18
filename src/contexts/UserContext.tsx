import React, { createContext, useContext, useEffect, useState } from "react";
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

export function UserProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [credits, setCredits] = useState<any>(null);
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCredits = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("apl_user_credits")
      .select("id, credits_used, credits_limit, reset_date, is_pro")
      .eq("user_id", user.id)
      .single();
    setCredits(data);
  };

  const fetchWorkspaces = async () => {
    if (!user) return;
    const { data } = await supabase.rpc("apl_get_user_workspaces", {
      user_id_param: user.id,
    });
    setWorkspaces(data || []);
  };

  const fetchLogs = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("apl_auth_logs")
      .select("id, timestamp, level, message")
      .eq("user_id", user.id)
      .order("timestamp", { ascending: false });
    setLogs(data || []);
  };

  useEffect(() => {
    if (user) {
      Promise.all([fetchCredits(), fetchWorkspaces(), fetchLogs()]).finally(
        () => setLoading(false),
      );
    }
  }, [user]);

  // Set up real-time subscriptions
  useEffect(() => {
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
        fetchCredits,
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
        fetchWorkspaces,
      )
      .subscribe();

    return () => {
      supabase.removeChannel(creditsChannel);
      supabase.removeChannel(workspacesChannel);
    };
  }, [user]);

  return (
    <UserContext.Provider
      value={{
        credits,
        workspaces,
        logs,
        loading,
        refreshCredits: fetchCredits,
        refreshWorkspaces: fetchWorkspaces,
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
