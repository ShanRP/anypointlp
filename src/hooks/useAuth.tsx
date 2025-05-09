
import { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session, User, Provider } from '@supabase/supabase-js';
import { UAParser } from 'ua-parser-js';
import { logAuditEvent } from '@/utils/supabaseOptimizer';
import { toast } from 'sonner';

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
  lastActivity: Date;
  updateLastActivity: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Constants for security settings
const SESSION_ACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes
const SESSION_CACHE_LIFETIME = 10000; // 10 seconds

const logAuthEvent = async (userId: string, action: string) => {
  try {
    const parser = new UAParser();
    const result = parser.getResult();
    const deviceInfo = `${result.os.name || 'Unknown OS'} / ${result.browser.name || 'Unknown Browser'} ${result.browser.version || ''}`;
    
    await logAuditEvent(userId, action, { 
      device: deviceInfo, 
      timestamp: new Date().toISOString() 
    });
  } catch (error) {
    console.error("Error logging auth event:", error);
  }
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastActivity, setLastActivity] = useState(new Date());
  const sessionCache = useRef<any[]>([]);
  const sessionCacheTime = useRef<number>(0);
  const activityInterval = useRef<any>(null);
  const pendingAuthAction = useRef<boolean>(false);

  // Function to update the last activity timestamp
  const updateLastActivity = useCallback(() => {
    setLastActivity(new Date());
  }, []);

  // Auto logout after inactivity
  useEffect(() => {
    // Check for inactivity
    const checkActivity = () => {
      if (!session) return;
      
      const now = new Date();
      const inactiveTime = now.getTime() - lastActivity.getTime();
      
      if (inactiveTime > SESSION_ACTIVITY_TIMEOUT) {
        console.log('Session expired due to inactivity');
        signOut();
      }
    };

    // Set up activity checking
    if (session) {
      activityInterval.current = setInterval(checkActivity, 60000); // Check every minute
    }

    // Setup event listeners for activity tracking
    const activityEvents = ['mousedown', 'keydown', 'touchstart', 'scroll'];
    const handleActivity = () => updateLastActivity();
    
    activityEvents.forEach(event => {
      window.addEventListener(event, handleActivity);
    });

    return () => {
      if (activityInterval.current) {
        clearInterval(activityInterval.current);
      }
      
      activityEvents.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [session, lastActivity, updateLastActivity]);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        // If session exists, update last activity
        if (session) {
          updateLastActivity();
        }
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
          // Update last activity on sign in
          updateLastActivity();
          
          setTimeout(async () => {
            try {
              await logAuthEvent(session.user.id, 'SIGN IN');
              sessionCache.current = [];
              sessionCacheTime.current = 0;
              
              // Check for pending invitation
              const pendingInviteUrl = localStorage.getItem('pendingInviteUrl');
              if (pendingInviteUrl) {
                // Clear the stored invitation
                localStorage.removeItem('pendingInviteUrl');
                // Redirect to the invitation URL
                window.location.href = pendingInviteUrl;
              }
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
  }, [user, updateLastActivity]);

  const signIn = async (email: string, password: string) => {
    try {
      if (pendingAuthAction.current) {
        return { error: new Error("Authentication action already in progress") };
      }
      
      pendingAuthAction.current = true;
      toast.loading("Signing in...");

      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      toast.dismiss();
      pendingAuthAction.current = false;

      if (error) {
        toast.error(error.message);
      } else if (data?.user) {
        toast.success("Signed in successfully!");
        await logAuthEvent(data.user.id, 'SIGN IN');
        updateLastActivity();
      }
      
      return { error };
    } catch (error) {
      toast.dismiss();
      pendingAuthAction.current = false;
      console.error("Error signing in:", error);
      toast.error("Failed to sign in");
      return { error };
    }
  };

  const signUp = async (email: string, password: string, options?: any) => {
    try {
      if (pendingAuthAction.current) {
        return { data: null, error: new Error("Authentication action already in progress") };
      }

      pendingAuthAction.current = true;
      toast.loading("Creating account...");

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
      
      toast.dismiss();
      pendingAuthAction.current = false;

      if (error) {
        toast.error(error.message);
      } else if (data?.user) {
        toast.success("Account created successfully!");
        logAuthEvent(data.user.id, 'SIGN UP');
      }
      
      return { data, error };
    } catch (error) {
      toast.dismiss();
      pendingAuthAction.current = false;
      console.error("Error signing up:", error);
      toast.error("Failed to create account");
      return { data: null, error };
    }
  };

  const signInWithProvider = async (provider: Provider) => {
    try {
      if (pendingAuthAction.current) {
        toast.error("Authentication action already in progress");
        return;
      }

      pendingAuthAction.current = true;
      toast.loading(`Connecting to ${provider}...`);

      const baseUrl = window.location.origin.replace(/\/$/, '');
      const redirectUrl = `${baseUrl}/auth/callback`;
      
      console.log("Using redirect URL:", redirectUrl);
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: redirectUrl,
        },
      });
      
      // Only dismiss toast if there's an error since successful OAuth redirects away
      if (error) {
        toast.dismiss();
        pendingAuthAction.current = false;
        toast.error(`Failed to connect with ${provider}`);
        console.error("Error signing in with provider:", error);
      } else {
        console.log("Provider auth initiated:", data);
        updateLastActivity();
      }
    } catch (error) {
      toast.dismiss();
      pendingAuthAction.current = false;
      console.error("Error initiating provider auth:", error);
      toast.error(`Failed to connect with ${provider}`);
    }
  };

  const signOut = async () => {
    try {
      if (pendingAuthAction.current) {
        toast.error("Authentication action already in progress");
        return;
      }

      pendingAuthAction.current = true;
      toast.loading("Signing out...");

      if (user) {
        await logAuthEvent(user.id, 'SIGN OUT');
      }
      
      await supabase.auth.signOut();
      
      toast.dismiss();
      pendingAuthAction.current = false;
      toast.success("Signed out successfully");
    } catch (error) {
      toast.dismiss();
      pendingAuthAction.current = false;
      console.error("Error signing out:", error);
      toast.error("Failed to sign out");
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
      if (pendingAuthAction.current) {
        throw new Error("Authentication action already in progress");
      }
      
      pendingAuthAction.current = true;
      toast.loading("Signing out session...");
      
      const currentSessionId = session.access_token.split('.')[0];
      const isCurrentSession = sessionId === currentSessionId || sessionId === session.access_token;
      
      if (isCurrentSession) {
        pendingAuthAction.current = false;
        toast.dismiss();
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
        
        toast.dismiss();
        pendingAuthAction.current = false;
        toast.success("Session signed out successfully");
      } catch (error) {
        toast.dismiss();
        pendingAuthAction.current = false;
        console.error("Error invoking session signout function:", error);
        toast.error("Failed to sign out session");
        throw error;
      }
    } catch (error) {
      toast.dismiss();
      pendingAuthAction.current = false;
      console.error("Error in signOutSession:", error);
      toast.error("Failed to sign out session");
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
    lastActivity,
    updateLastActivity,
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
