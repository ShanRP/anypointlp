
import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const useCredits = () => {
  const [credits, setCredits] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const { user } = useAuth();

  const fetchCredits = useCallback(async () => {
    if (!user) return 0;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('apl_user_credits')
        .select('credits')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching credits:', error);
        return 0;
      }

      const userCredits = data?.credits || 0;
      setCredits(userCredits);
      return userCredits;
    } catch (err) {
      console.error('Unexpected error fetching credits:', err);
      return 0;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const checkCredits = useCallback(async (requiredCredits: number): Promise<boolean> => {
    const userCredits = await fetchCredits();
    return userCredits >= requiredCredits;
  }, [fetchCredits]);

  const deductCredits = useCallback(async (amount: number): Promise<boolean> => {
    if (!user) return false;
    
    setLoading(true);
    try {
      // First, get current credits
      const { data: currentData, error: fetchError } = await supabase
        .from('apl_user_credits')
        .select('credits')
        .eq('user_id', user.id)
        .single();

      if (fetchError) {
        toast.error('Error fetching current credits');
        return false;
      }

      const currentCredits = currentData?.credits || 0;
      
      if (currentCredits < amount) {
        toast.error('Insufficient credits');
        return false;
      }

      // Update credits
      const { error: updateError } = await supabase
        .from('apl_user_credits')
        .update({ credits: currentCredits - amount })
        .eq('user_id', user.id);

      if (updateError) {
        toast.error('Error updating credits');
        return false;
      }

      setCredits(currentCredits - amount);
      return true;
    } catch (err) {
      toast.error('Unexpected error deducting credits');
      return false;
    } finally {
      setLoading(false);
    }
  }, [user]);

  return {
    credits,
    loading,
    fetchCredits,
    checkCredits,
    deductCredits
  };
};
