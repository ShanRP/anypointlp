
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { handleApiError } from '@/utils/errorHandler';

export type JobPost = {
  id: string;
  title: string;
  description: string;
  code?: string;
  status: string;
  created_at: string;
  user_id: string;
  username?: string;
};

export type JobComment = {
  id: string;
  post_id: string;
  user_id: string;
  comment: string;
  created_at: string;
  username?: string;
};

export const useJobBoard = () => {
  const [posts, setPosts] = useState<JobPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState<JobComment[]>([]);
  const [selectedPost, setSelectedPost] = useState<JobPost | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Added fetchPosts function that was missing
  const fetchPosts = useCallback(async () => {
    setLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('apl_job_posts')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      setPosts(data || []);
      return data;
    } catch (error) {
      handleApiError(error, "Error fetching posts");
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const createPost = async (title: string, description: string, code?: string) => {
    setSubmitting(true);
    
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError) throw userError;
      
      const user = userData.user;
      
      if (!user) {
        toast.error("You need to be logged in to create a post");
        return null;
      }
      
      // Get username
      const { data: profileData } = await supabase
        .from('profiles')
        .select('username, full_name')
        .eq('id', user.id)
        .single();
        
      const username = profileData?.username || profileData?.full_name || user.email?.split('@')[0] || 'Anonymous';
      
      const { data, error } = await supabase
        .from('apl_job_posts')
        .insert([
          { 
            title, 
            description, 
            code, 
            user_id: user.id,
            username
          }
        ])
        .select()
        .single();
        
      if (error) throw error;
      
      // Add the post to the list
      setPosts(prevPosts => [data, ...prevPosts]);
      
      return data;
    } catch (error) {
      handleApiError(error, "Creating post");
      return null;
    } finally {
      setSubmitting(false);
    }
  };
  
  const fetchComments = async (postId: string) => {
    try {
      const { data, error } = await supabase
        .from('apl_job_comments')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });
        
      if (error) throw error;
      
      setComments(data || []);
      return data;
    } catch (error) {
      handleApiError(error, "Fetching comments");
      return [];
    }
  };
  
  const createComment = async (postId: string, comment: string) => {
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError) throw userError;
      
      const user = userData.user;
      
      if (!user) {
        toast.error("You need to be logged in to comment");
        return null;
      }
      
      // Get username
      const { data: profileData } = await supabase
        .from('profiles')
        .select('username, full_name')
        .eq('id', user.id)
        .single();
        
      const username = profileData?.username || profileData?.full_name || user.email?.split('@')[0] || 'Anonymous';
      
      const { data, error } = await supabase
        .from('apl_job_comments')
        .insert([
          { 
            post_id: postId, 
            comment,
            user_id: user.id,
            username
          }
        ])
        .select()
        .single();
        
      if (error) throw error;
      
      // Add the comment to the list
      setComments(prevComments => [...prevComments, data]);
      
      return data;
    } catch (error) {
      handleApiError(error, "Creating comment");
      return null;
    }
  };
  
  return {
    posts,
    loading,
    selectedPost,
    setSelectedPost,
    comments,
    submitting,
    createPost,
    fetchComments,
    createComment,
    fetchPosts // Add fetchPosts to the return object
  };
};
