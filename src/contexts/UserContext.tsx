
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

interface UserContextProps {
  user: any;
  profile: any;
  loading: boolean;
  credits: {
    used: number;
    limit: number;
    resetDate: string;
    isPro: boolean;
  } | null;
  setUser: React.Dispatch<React.SetStateAction<any>>;
  workspaces: any[];
  signOut: () => Promise<void>;
  refreshCredits: () => void;
  refreshProfile: () => void;
}

const UserContext = createContext<UserContextProps | undefined>(undefined);

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Use React Query for fetching user credits
  const { 
    data: creditsData,
    refetch: refreshCredits,
    isLoading: creditsLoading
  } = useQuery({
    queryKey: ['user-credits', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase.from('apl_user_credits').select('*').eq('user_id', user.id).single();
      
      if (error) {
        console.error('Error fetching credits:', error);
        return null;
      }
      
      return data ? {
        id: data.id,
        used: data.credits_used,
        limit: data.credits_limit,
        resetDate: data.reset_date,
        isPro: data.is_pro
      } : null;
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5 // 5 minutes
  });

  // Fetch workspaces
  const {
    data: workspaces,
    refetch: refreshWorkspaces,
    isLoading: workspacesLoading
  } = useQuery({
    queryKey: ['user-workspaces', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase.rpc('apl_get_user_workspaces', { user_id_param: user.id });
      
      if (error) {
        console.error('Error fetching workspaces:', error);
        return [];
      }
      
      return data || [];
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5 // 5 minutes
  });

  // Fetch user profile
  const {
    data: profile,
    refetch: refreshProfile,
    isLoading: profileLoading
  } = useQuery({
    queryKey: ['user-profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase.from('apl_profiles').select('*').eq('id', user.id).single();
      
      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }
      
      return data;
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5 // 5 minutes
  });

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser(session.user);
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    );

    // Check for initial session
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
      }
      setLoading(false);
    };

    checkSession();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const value = {
    user,
    profile,
    loading: loading || creditsLoading || workspacesLoading || profileLoading,
    credits: creditsData,
    setUser,
    workspaces: workspaces || [],
    signOut,
    refreshCredits,
    refreshProfile
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
