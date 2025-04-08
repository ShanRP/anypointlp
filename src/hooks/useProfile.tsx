import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

export const useProfile = () => {
  const { user } = useAuth();
  const [isUpdating, setIsUpdating] = useState(false);

  const updateUsername = async (newUsername: string) => {
    if (!user) return;
    
    setIsUpdating(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { username: newUsername }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Username updated successfully",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update username",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return {
    updateUsername,
    isUpdating
  };
};
