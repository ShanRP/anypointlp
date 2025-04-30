
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from './useAuth';

export interface JobPost {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  title: string;
  description: string;
  code?: string;
  status: string;
  username?: string;
  comment_count?: number;
}

export interface JobComment {
  id: string;
  post_id: string;
  user_id: string;
  created_at: string;
  comment: string;
  username?: string;
}

export const useJobBoard = () => {
  const [posts, setPosts] = useState<JobPost[]>([]);
  const [selectedPost, setSelectedPost] = useState<JobPost>({} as JobPost);
  const [comments, setComments] = useState<JobComment[]>([]);
  const [loading, setLoading] = useState(false);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const { user } = useAuth();

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('apl_job_posts')
        .select('*, apl_job_comments(count)')
        .order('created_at', { ascending: false });

      if (error) {
        toast.error('Error fetching posts: ' + error.message);
        return;
      }

      // Process the data to extract comment counts
      const postsWithComments = data.map(post => {
        // Handle the comment count aggregation result
        const commentCount = post.apl_job_comments?.[0]?.count || 0;
        const postWithCount = {
          ...post,
          comment_count: commentCount
        };
        
        // Remove the nested comments array
        delete postWithCount.apl_job_comments;
        
        return postWithCount;
      });

      // Fetch usernames if needed
      for (const post of postsWithComments) {
        if (post.user_id) {
          try {
            const { data: userData } = await supabase.auth.admin.getUserById(post.user_id);
            if (userData?.user) {
              post.username = userData.user.email?.split('@')[0] || 'User';
            }
          } catch (err) {
            console.log('Could not fetch user details, continuing with available data');
          }
        }
      }

      setPosts(postsWithComments);
    } catch (err: any) {
      toast.error('Unexpected error: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchComments = useCallback(async (postId: string) => {
    setCommentsLoading(true);
    try {
      const { data, error } = await supabase
        .from('apl_job_comments')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) {
        toast.error('Error fetching comments: ' + error.message);
        return [];
      }

      // Fetch usernames for comments if needed
      for (const comment of data) {
        if (comment.user_id) {
          try {
            const { data: userData } = await supabase.auth.admin.getUserById(comment.user_id);
            if (userData?.user) {
              comment.username = userData.user.email?.split('@')[0] || 'User';
            }
          } catch (err) {
            console.log('Could not fetch user details for comments, continuing with available data');
          }
        }
      }

      setComments(data);
      return data;
    } catch (err: any) {
      toast.error('Unexpected error fetching comments: ' + err.message);
      return [];
    } finally {
      setCommentsLoading(false);
    }
  }, []);

  const createPost = async (title: string, description: string, code?: string) => {
    if (!user) {
      toast.error('You must be logged in to create a post');
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('apl_job_posts')
        .insert([
          {
            title,
            description,
            code,
            status: 'open',
            user_id: user.id,
          },
        ])
        .select();

      if (error) {
        toast.error('Error creating post: ' + error.message);
        return null;
      }

      toast.success('Post created successfully!');
      await fetchPosts();
      return data[0];
    } catch (err: any) {
      toast.error('Unexpected error: ' + err.message);
      return null;
    }
  };

  const addComment = async (postId: string, comment: string) => {
    if (!user) {
      toast.error('You must be logged in to comment');
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('apl_job_comments')
        .insert([
          {
            post_id: postId,
            comment,
            user_id: user.id,
          },
        ])
        .select();

      if (error) {
        toast.error('Error adding comment: ' + error.message);
        return null;
      }

      toast.success('Comment added successfully!');
      await fetchComments(postId);
      return data[0];
    } catch (err: any) {
      toast.error('Unexpected error: ' + err.message);
      return null;
    }
  };

  const updatePostStatus = async (postId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('apl_job_posts')
        .update({ status })
        .eq('id', postId);

      if (error) {
        toast.error('Error updating post status: ' + error.message);
        return false;
      }

      toast.success(`Post marked as ${status}`);
      // Update the selected post status
      setSelectedPost(prev => ({ ...prev, status }));
      
      // Also update in the posts array
      setPosts(prev => 
        prev.map(post => 
          post.id === postId 
            ? { ...post, status } 
            : post
        )
      );
      
      return true;
    } catch (err: any) {
      toast.error('Unexpected error: ' + err.message);
      return false;
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  return {
    posts,
    loading,
    selectedPost,
    setSelectedPost,
    comments,
    commentsLoading,
    fetchComments,
    createPost,
    addComment,
    updatePostStatus,
    fetchPosts
  };
};
