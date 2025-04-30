import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface UserCredits {
  id: string;
  user_id: string;
  credits_used: number;
  credits_limit: number;
  reset_date: string;
  is_pro: boolean;
  created_at: string;
  updated_at: string;
}

interface UserCreditsContextType {
  credits: UserCredits | null;
  loading: boolean;
  error: string | null;
  useCredit: () => Promise<boolean>;
  upgradeToProPlan: () => Promise<boolean>;
  refreshCredits: () => void;
  showUpgradeDialog: boolean;
  setShowUpgradeDialog: React.Dispatch<React.SetStateAction<boolean>>;
}

const UserCreditsContext = createContext<UserCreditsContextType | undefined>(undefined);

// Constants for caching
const CREDITS_CACHE_KEY = 'APL_USER_CREDITS';
const CREDITS_CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes

export const UserCreditsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [credits, setCredits] = useState<UserCredits | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  
  // Track if fetch has been performed to prevent multiple calls
  const [hasFetched, setHasFetched] = useState(false);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);

  const fetchUserCredits = useCallback(async () => {
    // Skip if no user
    if (!user) {
      setLoading(false);
      return;
    }

    // Check for cached credits first
    const cachedCredits = localStorage.getItem(CREDITS_CACHE_KEY);
    if (cachedCredits) {
      try {
        const { data, timestamp, userId } = JSON.parse(cachedCredits);
        // Only use cache if it's for the current user and not expired
        if (userId === user.id && Date.now() - timestamp < CREDITS_CACHE_EXPIRY) {
          setCredits(data);
          setLoading(false);
          setHasFetched(true);
          
          // Fetch in background to update cache
          fetchCreditsFromDB(false);
          return;
        }
      } catch (e) {
        console.error("Error parsing cached credits:", e);
      }
    }
    
    // No valid cache, fetch from DB with loading indicator
    fetchCreditsFromDB(true);
  }, [user]);

  const fetchCreditsFromDB = async (showLoading = true) => {
    if (!user) return;
    
    if (showLoading) {
      setLoading(true);
    }
    
    try {
      console.log("Fetching user credits for user:", user.id);
      // First check if the user already has a credits record
      const { data, error: fetchError } = await supabase
        .from('apl_user_credits')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "no rows returned" error
        throw fetchError;
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
        
        // Cache the new credits data
        localStorage.setItem(CREDITS_CACHE_KEY, JSON.stringify({
          data: newData,
          timestamp: Date.now(),
          userId: user.id
        }));
        
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
          
          // Cache the updated credits data
          localStorage.setItem(CREDITS_CACHE_KEY, JSON.stringify({
            data: updatedData,
            timestamp: Date.now(),
            userId: user.id
          }));
          
          setCredits(updatedData as UserCredits);
        } else {
          // Cache the existing credits data
          localStorage.setItem(CREDITS_CACHE_KEY, JSON.stringify({
            data,
            timestamp: Date.now(),
            userId: user.id
          }));
          
          setCredits(data as UserCredits);
        }
      }
      
      // Mark as fetched
      setHasFetched(true);
    } catch (err: any) {
      console.error('Error fetching user credits:', err);
      setError(err.message);
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  const useCredit = useCallback(async () => {
    if (!user) {
      toast.error('You need to be logged in to use credits');
      return false;
    }

    // If credits are still loading, wait for them
    if (loading) {
      // Don't show a loading toast, just wait silently
      let attempts = 0;
      const maxAttempts = 10; // Try for up to 5 seconds (10 * 500ms)
      
      while (loading && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 500));
        attempts++;
      }
      
      // If still loading after timeout, try to fetch credits directly
      if (loading || !credits) {
        // Try to fetch credits one more time
        await fetchUserCredits();
        
        // If still no credits after direct fetch, show error
        if (!credits) {
          toast.error('Unable to verify your credits. Please refresh the page.');
          return false;
        }
      }
    }
    
    // Now we should have credits, but double-check
    if (!credits) {
      // One final attempt to get credits
      await fetchUserCredits();
      
      // If still no credits, show error
      if (!credits) {
        toast.error('Unable to verify your credits. Please refresh the page.');
        return false;
      }
    }

    // Check if user is pro, pro users have 100 credits per month
    const proLimit = credits.is_pro ? 100 : 3;
    
    // Check if user has reached the limit
    if (credits.credits_used >= proLimit) {
      toast.error(`You've reached your daily credit limit of ${proLimit} tasks. Upgrade to Pro for more!`);
      // Trigger the upgrade dialog
      setShowUpgradeDialog(true);
      return false;
    }

    try {
      // Increment credits used
      const newCreditsUsed = credits.credits_used + 1;
      
      const { data, error } = await supabase
        .from('apl_user_credits')
        .update({ 
          credits_used: newCreditsUsed,
          updated_at: new Date().toISOString()
        })
        .eq('id', credits.id)
        .select()
        .single();

      if (error) throw error;

      console.log("Credit used, updated data:", data);
      
      // Update cache with new credit data
      localStorage.setItem(CREDITS_CACHE_KEY, JSON.stringify({
        data,
        timestamp: Date.now(),
        userId: user.id
      }));
      
      setCredits(data as UserCredits);
      
      // If this is their last credit, show a warning and open upgrade dialog for non-pro users
      if (newCreditsUsed === proLimit) {
        toast.warning(`You've used your last credit for today. Credits will reset tomorrow.`);
        // Also show upgrade dialog for non-pro users
        if (!credits.is_pro) {
          setShowUpgradeDialog(true);
        }
      } else if (proLimit - newCreditsUsed <= 2) {
        toast.info(`You have ${proLimit - newCreditsUsed} credits remaining today.`);
      }
      
      return true;
    } catch (err: any) {
      console.error('Error using credit:', err);
      toast.error('Failed to use credit. Please try again.');
      return false;
    }
  }, [user, credits, loading, fetchUserCredits]);

  const upgradeToProPlan = useCallback(async () => {
    if (!user || !credits) {
      toast.error('You need to be logged in to upgrade');
      return false;
    }

    try {
      // This function now just triggers the Stripe checkout
      // The actual upgrade happens after webhook confirmation
      // We don't modify the database here anymore
      return true;
    } catch (err: any) {
      console.error('Error upgrading to pro:', err);
      toast.error('Failed to upgrade to Pro Plan. Please try again.');
      return false;
    }
  }, [user, credits]);

  // Set up realtime subscription to credit changes
  useEffect(() => {
    if (!user) return;
    
    // console.log("Setting up realtime subscription for user credits");
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
          // Update local state with the new data
          setCredits(payload.new as UserCredits);
          
          // Also update the cache
          localStorage.setItem(CREDITS_CACHE_KEY, JSON.stringify({
            data: payload.new,
            timestamp: Date.now(),
            userId: user.id
          }));
        }
      )
      .subscribe();
      
    return () => {
      // console.log("Cleaning up realtime subscription");
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Initialize credits only once when the user is set
  useEffect(() => {
    if (user && !hasFetched) {
      console.log("Initializing user credits");
      fetchUserCredits();
    } else if (!user) {
      // Reset state when user logs out
      setCredits(null);
      setLoading(false);
      setHasFetched(false);
    }
  }, [user, fetchUserCredits, hasFetched]);

  // Refresh function that can be called externally
  const refreshCredits = useCallback(() => {
    console.log("Manually refreshing credits");
    setHasFetched(false);
    fetchUserCredits();
  }, [fetchUserCredits]);

  const value = {
    credits,
    loading,
    error,
    useCredit,
    upgradeToProPlan,
    refreshCredits,
    showUpgradeDialog,
    setShowUpgradeDialog
  };

  return (
    <UserCreditsContext.Provider value={value}>
      {children}
    </UserCreditsContext.Provider>
  );
};

export const useUserCredits = () => {
  const context = useContext(UserCreditsContext);
  if (context === undefined) {
    throw new Error('useUserCredits must be used within a UserCreditsProvider');
  }
  return context;
};
