import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export type JobPost = {
  id: string;
  title: string;
  description: string;
  code?: string;
  status: 'open' | 'in-progress' | 'closed';
  created_at: string;
  user_id: string;
  username?: string;
  comment_count?: number;
};

export type JobComment = {
  id: string;
  post_id: string;
  user_id: string;
  username?: string;
  comment: string;
  created_at: string;
};

export function useJobBoard() {
  const [posts, setPosts] = useState<JobPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<JobPost | null>(null);
  const [comments, setComments] = useState<JobComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const subscription = supabase
      .channel('job_posts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'job_posts' }, payload => {
        const newData = payload.new;
        setPosts(prevPosts => {
          if (payload.eventType === 'INSERT'){
            return [newData, ...prevPosts];
          } else if (payload.eventType === 'UPDATE'){
            return prevPosts.map(post => post.id === newData.id ? newData : post);
          } else if (payload.eventType === 'DELETE'){
             return prevPosts.filter(post => post.id !== payload.old.id);
          }
          return prevPosts;
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  useEffect(() => {
    if (selectedPost) {
      const commentsSubscription = supabase
        .channel(`job_comments_${selectedPost.id}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'job_comments', filter: `post_id=eq.${selectedPost.id}` }, payload => {
          setComments(prevComments => {
            if (payload.eventType === 'INSERT'){
              return [payload.new, ...prevComments];
            } else if (payload.eventType === 'UPDATE'){
              return prevComments.map(comment => comment.id === payload.new.id ? payload.new : comment);
            } else if (payload.eventType === 'DELETE'){
              return prevComments.filter(comment => comment.id !== payload.old.id);
            }
            return prevComments;
          });
        })
        .subscribe();
      return () => supabase.removeChannel(commentsSubscription);
    }
  }, [selectedPost]);


  const createPost = async (title: string, description: string, code?: string) => {
    if (!user) {
      toast.error('You must be logged in to create a post');
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('apl_job_posts')
        .insert({
          title,
          description,
          code,
          user_id: user.id,
          username: user.email?.split('@')[0] || 'Anonymous',
          status: 'open'
        })
        .select('*')
        .single();

      if (error) throw error;
      toast.success('Job post created successfully');
      return data as JobPost;
    } catch (error) {
      console.error('Error creating job post:', error);
      toast.error('Failed to create job post');
      return null;
    }
  };

  const updatePostStatus = async (postId: string, status: 'open' | 'in-progress' | 'closed') => {
    try {
      const { error } = await supabase
        .from('apl_job_posts')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', postId);

      if (error) throw error;
      toast.success(`Status updated to ${status}`);
      return true;
    } catch (error) {
      console.error('Error updating post status:', error);
      toast.error('Failed to update status');
      return false;
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
        .insert({
          post_id: postId,
          comment,
          user_id: user.id,
          username: user.email?.split('@')[0] || 'Anonymous'
        })
        .select('*')
        .single();

      if (error) throw error;
      return data as JobComment;
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
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
    createPost,
    updatePostStatus,
    addComment
  };
}