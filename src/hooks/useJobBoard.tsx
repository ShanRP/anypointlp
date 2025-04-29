
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export type JobPost = {
  id: string;
  title: string;
  description: string;
  code?: string;
  status: "open" | "in-progress" | "closed";
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

// Cache to store job posts and reduce API calls
const postsCache = {
  data: null as JobPost[] | null,
  timestamp: 0,
  expiryTime: 60 * 1000, // 1 minute cache
};

// Cache to store comments for each post
const commentsCache = new Map<string, {
  data: JobComment[],
  timestamp: number
}>();

export function useJobBoard() {
  const [posts, setPosts] = useState<JobPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<JobPost | null>(null);
  const [comments, setComments] = useState<JobComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const { user } = useAuth();
  const [activeRequests, setActiveRequests] = useState<Record<string, Promise<any>>>({});

  const fetchPosts = useCallback(async (forceRefresh = false) => {
    // Check if we have a cached version and it's not expired
    const now = Date.now();
    if (!forceRefresh && postsCache.data && (now - postsCache.timestamp < postsCache.expiryTime)) {
      setPosts(postsCache.data);
      setLoading(false);
      return postsCache.data;
    }
    
    const requestKey = 'fetch-job-posts';
    
    // If there's already an active request, return it
    if (!forceRefresh && activeRequests[requestKey]) {
      return activeRequests[requestKey].then(() => posts);
    }
    
    try {
      setLoading(true);
      
      const fetchRequest = (async () => {
        try {
          // First get posts
          const { data: postsData, error: postsError } = await supabase
            .from("apl_job_posts")
            .select("*")
            .order("created_at", { ascending: false });

          if (postsError) throw postsError;

          // Create a postsWithCommentCounts array to store our final result
          const postsWithCommentCounts = [];

          // Process each post individually to get its comment count
          for (const post of postsData || []) {
            // Count comments for this post
            const { count, error } = await supabase
              .from("apl_job_comments")
              .select("*", { count: "exact", head: true })
              .eq("post_id", post.id);

            if (error) {
              console.error("Error counting comments for post", post.id, error);
              // Continue with next post even if there's an error
              postsWithCommentCounts.push({
                ...post,
                comment_count: 0,
              });
            } else {
              // Add the post with its comment count
              postsWithCommentCounts.push({
                ...post,
                comment_count: count || 0,
              });
            }
          }

          // Update cache
          postsCache.data = postsWithCommentCounts as JobPost[];
          postsCache.timestamp = Date.now();
          
          // Update state
          setPosts(postsWithCommentCounts as JobPost[]);
          return postsWithCommentCounts as JobPost[];
        } catch (error) {
          console.error("Error fetching job posts:", error);
          toast.error("Failed to load job posts");
          throw error;
        } finally {
          setLoading(false);
          // Remove this request from active requests
          setActiveRequests(prev => {
            const newRequests = {...prev};
            delete newRequests[requestKey];
            return newRequests;
          });
        }
      })();
      
      // Store the promise
      setActiveRequests(prev => ({
        ...prev,
        [requestKey]: fetchRequest
      }));
      
      return fetchRequest;
    } catch (error) {
      console.error("Error fetching job posts:", error);
      setLoading(false);
      return [];
    }
  }, [posts, activeRequests]);

  useEffect(() => {
    // Initial fetch of posts
    fetchPosts();

    // Set up real-time subscription for posts
    const postsChannel = supabase
      .channel("job-posts-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "apl_job_posts" },
        () => {
          // When posts change, invalidate cache and refetch
          postsCache.data = null;
          fetchPosts(true);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(postsChannel);
    };
  }, [fetchPosts]);

  useEffect(() => {
    if (selectedPost) {
      fetchComments(selectedPost.id);

      // Set up real-time subscription for comments
      const commentsChannel = supabase
        .channel("job-comments-changes")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "apl_job_comments",
            filter: `post_id=eq.${selectedPost.id}`,
          },
          () => {
            fetchComments(selectedPost.id);
          },
        )
        .subscribe();

      return () => {
        supabase.removeChannel(commentsChannel);
      };
    }
  }, [selectedPost]);

  const fetchComments = useCallback(async (postId: string, forceRefresh = false) => {
    // Check if we have cached comments
    const cachedComments = commentsCache.get(postId);
    const now = Date.now();
    if (!forceRefresh && cachedComments && (now - cachedComments.timestamp < 60000)) { // 1 min cache
      setComments(cachedComments.data);
      return cachedComments.data;
    }
    
    const requestKey = `fetch-comments-${postId}`;
    
    // If there's already an active request, return it
    if (!forceRefresh && activeRequests[requestKey]) {
      return activeRequests[requestKey];
    }
    
    try {
      setCommentsLoading(true);
      
      const fetchRequest = (async () => {
        try {
          const { data, error } = await supabase
            .from("apl_job_comments")
            .select("*")
            .eq("post_id", postId)
            .order("created_at", { ascending: true });

          if (error) throw error;
          
          const commentsData = data as JobComment[];
          
          // Update cache
          commentsCache.set(postId, {
            data: commentsData,
            timestamp: now
          });
          
          setComments(commentsData);
          return commentsData;
        } catch (error) {
          console.error("Error fetching comments:", error);
          toast.error("Failed to load comments");
          throw error;
        } finally {
          setCommentsLoading(false);
          // Remove this request from active requests
          setActiveRequests(prev => {
            const newRequests = {...prev};
            delete newRequests[requestKey];
            return newRequests;
          });
        }
      })();
      
      // Store the promise
      setActiveRequests(prev => ({
        ...prev,
        [requestKey]: fetchRequest
      }));
      
      return fetchRequest;
    } catch (error) {
      console.error("Error fetching comments:", error);
      setCommentsLoading(false);
      return [];
    }
  }, [activeRequests]);

  const createPost = async (
    title: string,
    description: string,
    code?: string,
  ) => {
    if (!user) {
      toast.error("You must be logged in to create a post");
      return null;
    }

    try {
      const { data, error } = await supabase
        .from("apl_job_posts")
        .insert({
          title,
          description,
          code,
          user_id: user.id,
          username: user.email?.split("@")[0] || "Anonymous",
          status: "open",
        })
        .select("*")
        .single();

      if (error) throw error;
      
      // Invalidate posts cache
      postsCache.data = null;
      
      toast.success("Job post created successfully");
      return data as JobPost;
    } catch (error) {
      console.error("Error creating job post:", error);
      return null;
    }
  };

  const updatePostStatus = async (
    postId: string,
    status: "open" | "in-progress" | "closed",
  ) => {
    try {
      const { error } = await supabase
        .from("apl_job_posts")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", postId);

      if (error) throw error;
      
      // Update the post in the cache if it exists
      if (postsCache.data) {
        postsCache.data = postsCache.data.map(post => 
          post.id === postId ? { ...post, status } : post
        );
      }
      
      // Update the post in the state
      setPosts(prev => 
        prev.map(post => post.id === postId ? { ...post, status } : post)
      );
      
      // Update selected post if it's the one being updated
      if (selectedPost?.id === postId) {
        setSelectedPost(prev => prev ? { ...prev, status } : null);
      }
      
      toast.success(`Status updated to ${status}`);
      return true;
    } catch (error) {
      console.error("Error updating post status:", error);
      return false;
    }
  };

  const addComment = async (postId: string, comment: string) => {
    if (!user) {
      toast.error("You must be logged in to comment");
      return null;
    }

    try {
      const { data, error } = await supabase
        .from("apl_job_comments")
        .insert({
          post_id: postId,
          comment,
          user_id: user.id,
          username: user.email?.split("@")[0] || "Anonymous",
        })
        .select("*")
        .single();

      if (error) throw error;
      
      // Invalidate comments cache for this post
      commentsCache.delete(postId);
      
      // Update post comment count in cache if it exists
      if (postsCache.data) {
        postsCache.data = postsCache.data.map(post => {
          if (post.id === postId) {
            return {
              ...post,
              comment_count: (post.comment_count || 0) + 1
            };
          }
          return post;
        });
      }
      
      // Update post comment count in state
      setPosts(prev => 
        prev.map(post => {
          if (post.id === postId) {
            return {
              ...post,
              comment_count: (post.comment_count || 0) + 1
            };
          }
          return post;
        })
      );
      
      return data as JobComment;
    } catch (error) {
      console.error("Error adding comment:", error);
      toast.error("Failed to add comment");
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
    addComment,
    fetchComments,
    fetchPosts
  };
}
