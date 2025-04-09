
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

  const fetchUserCredits = useCallback(async () => {
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
    } catch (err: any) {
      console.error('Error fetching user credits:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

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

  const upgradeToProPlan = useCallback(async () => {
    if (!user || !credits) {
      toast.error('You need to be logged in to upgrade');
      return false;
    }

    try {
      // In a real app, we would handle payment processing here
      // For now, we'll just update the is_pro flag
      const { data, error } = await supabase
        .from('apl_user_credits')
        .update({ 
          is_pro: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', credits.id)
        .select()
        .single();

      if (error) throw error;

      setCredits(data as UserCredits);
      toast.success('Successfully upgraded to Pro Plan! You now have 100 credits per month.');
      return true;
    } catch (err: any) {
      console.error('Error upgrading to pro:', err);
      toast.error('Failed to upgrade to Pro Plan. Please try again.');
      return false;
    }
  }, [user, credits]);

  // Initialize or reset credits on mount
  useEffect(() => {
    fetchUserCredits();
  }, [fetchUserCredits]);

  return {
    credits,
    loading,
    error,
    useCredit,
    upgradeToProPlan,
    refreshCredits: fetchUserCredits
  };
};
