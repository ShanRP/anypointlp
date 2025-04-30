
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
  comment_count?: number;
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
  const [commentsLoading, setCommentsLoading] = useState(false);
  
  const fetchPosts = useCallback(async () => {
    setLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('apl_job_posts')
        .select('*, apl_job_comments(count)')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      // Process data to add comment count
      const postsWithCommentCount = data?.map(post => {
        const commentCount = post.apl_job_comments?.length || 0;
        return {
          ...post,
          comment_count: commentCount
        };
      }) || [];
      
      setPosts(postsWithCommentCount);
      return postsWithCommentCount;
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
      
      let username = user.email?.split('@')[0] || 'Anonymous';
      
      // Try to get username from profiles if table exists
      try {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('username, full_name')
          .eq('id', user.id)
          .single();
          
        if (profileData) {
          username = profileData.username || profileData.full_name || username;
        }
      } catch (profileError) {
        // If profiles table doesn't exist or error occurs, continue with email username
        console.log('Could not fetch profile data', profileError);
      }
      
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
      const newPost = { ...data, comment_count: 0 };
      setPosts(prevPosts => [newPost, ...prevPosts]);
      
      return data;
    } catch (error) {
      handleApiError(error, "Creating post");
      return null;
    } finally {
      setSubmitting(false);
    }
  };
  
  const fetchComments = async (postId: string) => {
    setCommentsLoading(true);
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
    } finally {
      setCommentsLoading(false);
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
      
      let username = user.email?.split('@')[0] || 'Anonymous';
      
      // Try to get username from profiles if table exists
      try {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('username, full_name')
          .eq('id', user.id)
          .single();
          
        if (profileData) {
          username = profileData.username || profileData.full_name || username;
        }
      } catch (profileError) {
        // If profiles table doesn't exist, continue with email username
        console.log('Could not fetch profile data', profileError);
      }
      
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
      
      // Update comment count in the posts list
      setPosts(prevPosts => prevPosts.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            comment_count: (post.comment_count || 0) + 1
          };
        }
        return post;
      }));
      
      return data;
    } catch (error) {
      handleApiError(error, "Creating comment");
      return null;
    }
  };
  
  const updatePostStatus = async (postId: string, status: string) => {
    try {
      const { data, error } = await supabase
        .from('apl_job_posts')
        .update({ status })
        .eq('id', postId)
        .select()
        .single();
        
      if (error) throw error;
      
      // Update the post in the list and selected post
      setPosts(prevPosts => prevPosts.map(post => 
        post.id === postId ? { ...post, status } : post
      ));
      
      if (selectedPost && selectedPost.id === postId) {
        setSelectedPost({ ...selectedPost, status });
      }
      
      return data;
    } catch (error) {
      handleApiError(error, "Updating post status");
      return null;
    }
  };
  
  return {
    posts,
    loading,
    selectedPost,
    setSelectedPost,
    comments,
    commentsLoading,
    submitting,
    createPost,
    fetchComments,
    createComment,
    fetchPosts,
    updatePostStatus
  };
};
