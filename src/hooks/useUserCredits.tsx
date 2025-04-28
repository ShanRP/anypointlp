
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface UserCredits {
  credits_used: number;
  credits_limit: number;
  is_pro: boolean;
  reset_date: string;
}

export function useUserCredits() {
  const [credits, setCredits] = useState<number>(0);
  const [creditsLimit, setCreditsLimit] = useState<number>(3);
  const [isPro, setIsPro] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState<boolean>(false);
  const { user } = useAuth();

  const fetchUserCredits = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('apl_user_credits')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setCredits(data.credits_used);
        setCreditsLimit(data.credits_limit);
        setIsPro(data.is_pro);
      } else {
        // If no credits record exists, create one
        const { data: newData, error: insertError } = await supabase
          .from('apl_user_credits')
          .insert({
            user_id: user.id,
            credits_used: 0,
            credits_limit: 3,
            is_pro: false,
            reset_date: new Date().toISOString() // Convert Date to ISO string
          })
          .select()
          .single();

        if (insertError) throw insertError;

        if (newData) {
          setCredits(newData.credits_used);
          setCreditsLimit(newData.credits_limit);
          setIsPro(newData.is_pro);
        }
      }
    } catch (error) {
      console.error('Error fetching user credits:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchUserCredits();
  }, [fetchUserCredits]);

  const useCredit = async (): Promise<boolean> => {
    if (!user) {
      toast.error('You must be logged in to use credits');
      return false;
    }

    if (credits >= creditsLimit && !isPro) {
      toast.error('You have reached your daily credit limit. Upgrade to Pro for unlimited usage.');
      return false;
    }

    try {
      const { error } = await supabase
        .from('apl_user_credits')
        .update({ credits_used: credits + 1 })
        .eq('user_id', user.id);

      if (error) throw error;

      setCredits(prev => prev + 1);
      return true;
    } catch (error) {
      console.error('Error using credit:', error);
      toast.error('Failed to use credit');
      return false;
    }
  };

  // Add refreshCredits function
  const refreshCredits = () => {
    fetchUserCredits();
  };

  return {
    credits,
    creditsLimit,
    isPro,
    loading,
    useCredit,
    fetchUserCredits,
    refreshCredits,
    creditsRemaining: creditsLimit - credits,
    showUpgradeDialog,
    setShowUpgradeDialog
  };
}
