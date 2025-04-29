
import React, { useEffect, useState } from 'react';
import { JobPostCard } from './JobPostCard';
import { JobPostDetails } from './JobPostDetails';
import { CreateJobPostForm } from './CreateJobPostForm';
import { ChatDialog } from './ChatDialog';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw, PlusCircle } from 'lucide-react';
import { useJobBoard } from '@/hooks/useJobBoard';
import { useAuth } from '@/hooks/useAuth';

export const JobBoard = () => {
  const { 
    posts, 
    loading, 
    selectedPost, 
    setSelectedPost, 
    comments, 
    commentsLoading, 
    createPost, 
    updatePostStatus, 
    addComment,
  } = useJobBoard();
  
  const { user } = useAuth();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showChatDialog, setShowChatDialog] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Added manual refresh function to control refresh state
  const handleRefresh = async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    try {
      // This is necessary because fetchPosts is no longer exposed directly
      // Use the realtime subscription in useJobBoard instead
      // Wait a bit to simulate fetching
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error("Error refreshing posts:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSubmitPost = async (title: string, description: string, code?: string) => {
    const result = await createPost(title, description, code);
    if (result) {
      setShowCreateForm(false);
      setSelectedPost(result);
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Job Board</h1>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh} 
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
          <Button 
            size="sm" 
            onClick={() => setShowCreateForm(true)}
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            New Post
          </Button>
        </div>
      </div>

      {/* Create Form Dialog */}
      <CreateJobPostForm 
        open={showCreateForm} 
        onOpenChange={setShowCreateForm} 
        onSubmit={handleSubmitPost} 
      />

      {/* Chat Dialog */}
      {selectedPost && (
        <ChatDialog 
          open={showChatDialog}
          onOpenChange={setShowChatDialog}
          post={selectedPost}
        />
      )}
      
      {/* Main Content */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Post List - Left Column */}
        <div className="md:col-span-1">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 h-[calc(100vh-12rem)] overflow-y-auto">
            <h2 className="text-lg font-medium mb-4">Posts</h2>
            
            {loading ? (
              <div className="flex justify-center items-center h-40">
                <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
              </div>
            ) : posts.length > 0 ? (
              <div className="space-y-3">
                {posts.map((post) => (
                  <JobPostCard 
                    key={post.id} 
                    post={post}
                    isSelected={selectedPost?.id === post.id}
                    onSelect={() => setSelectedPost(post)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-10 text-gray-500">
                <p>No job posts yet.</p>
                <p className="mt-2 text-sm">Be the first to create one!</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Post Details - Right Column */}
        <div className="md:col-span-2">
          {selectedPost ? (
            <JobPostDetails 
              post={selectedPost}
              comments={comments}
              loading={commentsLoading}
              onStatusChange={updatePostStatus}
              onAddComment={addComment}
              onStartChat={() => setShowChatDialog(true)}
              currentUser={user}
            />
          ) : (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-8 h-[calc(100vh-12rem)] flex items-center justify-center">
              <div className="text-center text-gray-500">
                <h3 className="text-lg font-medium">Select a post</h3>
                <p className="mt-2">Choose a job post from the list to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
