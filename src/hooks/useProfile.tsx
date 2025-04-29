
import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { toast } from 'sonner';
import { handleApiError } from '@/utils/errorHandler';

export const useProfile = () => {
  const { user } = useAuth();
  const { toast: legacyToast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);

  const updateUsername = async (newUsername: string) => {
    if (!user) return;
    
    setIsUpdating(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { username: newUsername }
      });

      if (error) throw error;

      legacyToast({
        title: "Success",
        description: "Username updated successfully",
      });
    } catch (error) {
      legacyToast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update username",
      });
    } finally {
      setIsUpdating(false);
    }
  };
  
  const changePassword = async (currentPassword: string, newPassword: string) => {
    if (!user) return { success: false, error: "You must be logged in to change your password" };
    
    setIsUpdating(true);
    try {
      // First verify the current password by attempting to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email!,
        password: currentPassword
      });
      
      if (signInError) {
        setIsUpdating(false);
        return { success: false, error: "Current password is incorrect" };
      }
      
      // Now update the password
      const { error } = await supabase.auth.updateUser({ 
        password: newPassword 
      });

      if (error) throw error;
      
      toast.success("Password changed successfully");
      setIsUpdating(false);
      return { success: true, error: null };
    } catch (error) {
      const message = handleApiError(error, "Password change");
      setIsUpdating(false);
      return { success: false, error: message || "Failed to change password" };
    }
  };

  return {
    updateUsername,
    changePassword,
    isUpdating
  };
};
