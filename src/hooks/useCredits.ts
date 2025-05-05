
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface UserCredits {
  id: string;
  user_id: string;
  credits_used: number;
  credits_limit: number;
  is_pro: boolean;
  reset_date: string;
  created_at: string;
  updated_at: string;
}

export const useCredits = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [creditsData, setCreditsData] = useState<UserCredits | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchCredits();
    }
  }, [user]);

  const fetchCredits = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('apl_user_credits')
        .select()
        .eq('user_id', user.id)
        .single();
      
      if (error) {
        throw error;
      }
      
      if (data) {
        setCreditsData(data);
      } else {
        // Create initial credits record if none exists
        const { data: newData, error: insertError } = await supabase
          .from('apl_user_credits')
          .insert({
            user_id: user.id,
            credits_used: 0,
            credits_limit: 3,
            reset_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
            is_pro: false
          })
          .select()
          .single();
        
        if (insertError) {
          throw insertError;
        }
        
        setCreditsData(newData);
      }
    } catch (err: any) {
      console.error('Error fetching credits:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const useCredit = async () => {
    if (!user || !creditsData) {
      return false;
    }
    
    // Check if user has available credits
    if (creditsData.credits_used >= creditsData.credits_limit && !creditsData.is_pro) {
      return false;
    }
    
    try {
      const { error } = await supabase
        .from('apl_user_credits')
        .update({
          credits_used: creditsData.is_pro ? creditsData.credits_used : creditsData.credits_used + 1,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);
      
      if (error) {
        throw error;
      }
      
      // Update local state
      setCreditsData(prev => {
        if (!prev) return null;
        return {
          ...prev,
          credits_used: prev.is_pro ? prev.credits_used : prev.credits_used + 1
        };
      });
      
      return true;
    } catch (err: any) {
      console.error('Error using credit:', err);
      setError(err.message);
      return false;
    }
  };

  const resetCredits = async () => {
    if (!user) return false;
    
    try {
      const { error } = await supabase
        .from('apl_user_credits')
        .update({
          credits_used: 0,
          reset_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);
      
      if (error) {
        throw error;
      }
      
      await fetchCredits();
      return true;
    } catch (err: any) {
      console.error('Error resetting credits:', err);
      setError(err.message);
      return false;
    }
  };

  const upgradeAccountStatus = async (isPro: boolean) => {
    if (!user) return false;
    
    try {
      const { error } = await supabase
        .from('apl_user_credits')
        .update({
          is_pro: isPro,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);
      
      if (error) {
        throw error;
      }
      
      await fetchCredits();
      return true;
    } catch (err: any) {
      console.error('Error updating account status:', err);
      setError(err.message);
      return false;
    }
  };

  // Calculate remaining credits
  const remainingCredits = creditsData 
    ? (creditsData.is_pro 
      ? Infinity 
      : Math.max(0, creditsData.credits_limit - creditsData.credits_used))
    : 0;

  // Check if user has available credits
  const hasCredits = creditsData 
    ? (creditsData.is_pro || creditsData.credits_used < creditsData.credits_limit)
    : false;

  return {
    loading,
    error,
    creditsData,
    remainingCredits,
    hasCredits,
    useCredit,
    resetCredits,
    refreshCredits: fetchCredits,
    upgradeAccountStatus,
    isPro: creditsData?.is_pro || false
  };
};
