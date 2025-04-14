
import { useState, useEffect, useCallback } from 'react';
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

export const useUserCredits = () => {
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

    setLoading(true);
    setError(null);

    try {
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
        setCredits(newData as UserCredits);
      } else {
        // Check if we need to reset credits (reset_date has passed)
        const resetDate = new Date(data.reset_date);
        const now = new Date();

        if (now > resetDate) {
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
          setCredits(updatedData as UserCredits);
        } else {
          setCredits(data as UserCredits);
        }
      }
      
      // Mark as fetched
      setHasFetched(true);
    } catch (err: any) {
      console.error('Error fetching user credits:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user]); // Only depend on user

  const useCredit = useCallback(async () => {
    if (!user || !credits) {
      toast.error('You need to be logged in to use credits');
      return false;
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

      setCredits(data as UserCredits);
      
      // If this is their last credit, show a warning
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
  }, [user, credits]);

  // For test purposes only - the real upgrade will be through Stripe
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
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Initialize credits only once when the user is set
  useEffect(() => {
    if (user && !hasFetched) {
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
    setHasFetched(false);
    fetchUserCredits();
  }, [fetchUserCredits]);

  return {
    credits,
    loading,
    error,
    useCredit,
    upgradeToProPlan,
    refreshCredits,
    showUpgradeDialog,
    setShowUpgradeDialog
  };
};
