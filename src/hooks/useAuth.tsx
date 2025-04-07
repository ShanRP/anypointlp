import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session, User, Provider } from '@supabase/supabase-js';
import { UAParser } from 'ua-parser-js';

type AuthContextType = {
  session: Session | null;
  user: User | null;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, options?: any) => Promise<{ error: any; data: any }>;
  signInWithProvider: (provider: Provider) => Promise<void>;
  signOut: () => Promise<void>;
  loading: boolean;
  getUserSessions: () => Promise<any[]>;
  signOutSession: (sessionId: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const logAuthEvent = async (userId: string, action: string) => {
  try {
    const parser = new UAParser();
    const result = parser.getResult();
    const deviceInfo = `${result.os.name || 'Unknown OS'} / ${result.browser.name || 'Unknown Browser'} ${result.browser.version || ''}`;
    
    await supabase.from('apl_auth_logs').insert({
      user_id: userId,
      action,
      device: deviceInfo,
    });
  } catch (error) {
    console.error("Error logging auth event:", error);
  }
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const sessionCache = useRef<any[]>([]);
  const sessionCacheTime = useRef<number>(0);
  const SESSION_CACHE_LIFETIME = 10000; // 10 seconds

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching session:", error);
        setLoading(false);
      }
    };

    fetchSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("Auth state changed:", event, session?.user?.email);
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        if (event === 'SIGNED_IN' && session?.user) {
          setTimeout(async () => {
            try {
              await logAuthEvent(session.user.id, 'SIGN IN');
              sessionCache.current = [];
              sessionCacheTime.current = 0;
            } catch (error) {
              console.error("Error handling sign in:", error);
            }
          }, 0);
        } else if (event === 'SIGNED_OUT' && user) {
          logAuthEvent(user.id, 'SIGN OUT');
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (!error && data?.user) {
        await logAuthEvent(data.user.id, 'SIGN IN');
      }
      return { error };
    } catch (error) {
      console.error("Error signing in:", error);
      return { error };
    }
  };

  const signUp = async (email: string, password: string, options?: any) => {
    try {
      const baseUrl = window.location.origin.replace(/\/$/, '');
      const redirectTo = `${baseUrl}/auth/callback`;
      
      console.log("Setting up signup with redirect URL:", redirectTo);
      
      const { data, error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          emailRedirectTo: redirectTo,
          data: options?.username ? { username: options.username } : undefined
        }
      });
      
      if (!error && data?.user) {
        logAuthEvent(data.user.id, 'SIGN UP');
      }
      return { data, error };
    } catch (error) {
      console.error("Error signing up:", error);
      return { data: null, error };
    }
  };

  const signInWithProvider = async (provider: Provider) => {
    try {
      const baseUrl = window.location.origin.replace(/\/$/, '');
      const redirectUrl = `${baseUrl}/auth/callback`;
      
      console.log("Using redirect URL:", redirectUrl);
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: redirectUrl,
        },
      });
      
      if (error) {
        console.error("Error signing in with provider:", error);
      } else {
        console.log("Provider auth initiated:", data);
      }
    } catch (error) {
      console.error("Error initiating provider auth:", error);
    }
  };

  const signOut = async () => {
    try {
      if (user) {
        await logAuthEvent(user.id, 'SIGN OUT');
      }
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const getUserSessions = async () => {
    if (!user || !session) {
      console.log("No user or session for getUserSessions");
      return [];
    }
    
    const now = Date.now();
    
    // Check cache first
    if (sessionCache.current.length > 0 && 
        now - sessionCacheTime.current < SESSION_CACHE_LIFETIME) {
      console.log("Using cached session data");
      return sessionCache.current;
    }
    
    try {
      const currentSessionId = session.access_token.split('.')[0];
      
      const currentSession = {
        id: currentSessionId,
        created_at: new Date().toISOString(),
        user_agent: navigator.userAgent,
        ip_address: "Current device",
        last_active_at: new Date().toISOString(),
        isCurrentDevice: true
      };
      
      sessionCache.current = [currentSession];
      sessionCacheTime.current = now;
      
      return sessionCache.current;
    } catch (error) {
      console.error("Error getting user sessions:", error);
      
      const fallbackSession = {
        id: session.access_token.split('.')[0],
        created_at: new Date().toISOString(),
        user_agent: navigator.userAgent,
        ip_address: "Current device",
        last_active_at: new Date().toISOString(),
        isCurrentDevice: true
      };
      
      sessionCache.current = [fallbackSession];
      sessionCacheTime.current = now;
      return sessionCache.current;
    }
  };

  const signOutSession = async (sessionId: string) => {
    if (!user || !session) {
      throw new Error("No authenticated user");
    }
    
    try {
      const currentSessionId = session.access_token.split('.')[0];
      const isCurrentSession = sessionId === currentSessionId || sessionId === session.access_token;
      
      if (isCurrentSession) {
        return await signOut();
      }
      
      try {
        const { error } = await supabase.functions.invoke('signOutSession', {
          method: 'POST',
          body: { sessionId },
        });

        if (error) {
          console.error("Error signing out session:", error);
          throw error;
        }
        
        sessionCache.current = [];
        sessionCacheTime.current = 0;
      } catch (error) {
        console.error("Error invoking session signout function:", error);
        throw error;
      }
    } catch (error) {
      console.error("Error in signOutSession:", error);
      throw error;
    }
  };

  const value = {
    session,
    user,
    signIn,
    signUp,
    signInWithProvider,
    signOut,
    loading,
    getUserSessions,
    signOutSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
