
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

export function useJobBoard() {
  const [posts, setPosts] = useState<JobPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<JobPost | null>(null);
  const [comments, setComments] = useState<JobComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    fetchPosts();

    // Set up real-time subscription for posts
    const postsChannel = supabase
      .channel("job-posts-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "apl_job_posts" },
        () => {
          fetchPosts();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(postsChannel);
    };
  }, []);

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

  const fetchPosts = async () => {
    try {
      setLoading(true);

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

      setPosts(postsWithCommentCounts as JobPost[]);
    } catch (error) {
      console.error("Error fetching job posts:", error);
      toast.error("Failed to load job posts");
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = useCallback(async (postId: string) => {
    try {
      setCommentsLoading(true);
      const { data, error } = await supabase
        .from("apl_job_comments")
        .select("*")
        .eq("post_id", postId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setComments((data as JobComment[]) || []);
    } catch (error) {
      console.error("Error fetching comments:", error);
      toast.error("Failed to load comments");
    } finally {
      setCommentsLoading(false);
    }
  }, []);

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
      toast.success("Job post created successfully");
      return data as JobPost;
    } catch (error) {
      console.error("Error creating job post:", error);
      toast.error("Failed to create job post");
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
      toast.success(`Status updated to ${status}`);
      return true;
    } catch (error) {
      console.error("Error updating post status:", error);
      toast.error("Failed to update status");
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
  };
}
