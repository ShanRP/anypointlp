
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from './useAuth';

export interface Profile {
  id: string;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export const useProfile = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState<boolean>(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!user) return null;

    setLoading(true);
    setError(null);

    try {
      // Get profile from existing profiles
      const { data, error } = await supabase
        .from('apl_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Profile not found, create a new one
          const newProfile = {
            id: user.id,
            avatar_url: null,
          };
          
          const { data: createdProfile, error: createError } = await supabase
            .from('apl_profiles')
            .insert([newProfile])
            .select('*')
            .single();

          if (createError) {
            throw createError;
          }

          setProfile(createdProfile || null);
        } else {
          throw error;
        }
      } else {
        setProfile(data);
      }
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const updateAvatar = async (avatarUrl: string) => {
    if (!user || !profile) return false;
    
    setLoading(true);
    setError(null);
    
    try {
      const { error } = await supabase
        .from('apl_profiles')
        .update({ avatar_url: avatarUrl, updated_at: new Date().toISOString() })
        .eq('id', user.id);
      
      if (error) {
        throw error;
      }
      
      // Update local state
      setProfile(prev => prev ? { ...prev, avatar_url: avatarUrl } : null);
      
      return true;
    } catch (err: any) {
      setError(err.message);
      console.error('Error updating avatar:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Call fetchProfile on component mount
  useEffect(() => {
    if (user) {
      // Using void to properly handle the Promise without causing truthiness check issues
      void fetchProfile();
    }
  }, [user, fetchProfile]);

  return {
    profile,
    loading,
    error,
    fetchProfile,
    updateAvatar
  };
};
