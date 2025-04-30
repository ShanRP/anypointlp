import React, { useState, useEffect } from 'react';
import { useJobBoard } from '@/hooks/useJobBoard';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { ArrowLeft, Send, Code, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const JobPostDetails = () => {
  const { 
    selectedPost, 
    setSelectedPost, 
    comments, 
    fetchComments,
    createComment,
    commentsLoading,
    updatePostStatus 
  } = useJobBoard();
  const { user } = useAuth();
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (selectedPost) {
      fetchComments(selectedPost.id);
    }
  }, [selectedPost, fetchComments]);

  const handleBack = () => {
    setSelectedPost(null);
  };

  const handleCommentSubmit = async () => {
    if (!commentText.trim()) {
      toast.error('Comment cannot be empty');
      return;
    }

    setIsSubmitting(true);
    try {
      await createComment(selectedPost!.id, commentText);
      setCommentText('');
      toast.success('Comment added successfully');
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (status: string) => {
    if (!selectedPost) return;
    
    try {
      await updatePostStatus(selectedPost.id, status);
      toast.success(`Post marked as ${status}`);
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (error) {
      return 'Invalid date';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'open':
        return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-900';
      case 'closed':
        return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-900';
      case 'solved':
        return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-900';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700';
    }
  };

  if (!selectedPost) {
    return null;
  }

  const canChangeStatus = user && selectedPost.user_id === user.id;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center mb-4">
        <Button variant="ghost" size="sm" onClick={handleBack} className="mr-2">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <h2 className="text-xl font-bold flex-1">Post Details</h2>
        {canChangeStatus && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                Change Status
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleStatusChange('open')}>
                <AlertCircle className="h-4 w-4 mr-2 text-green-500" />
                Mark as Open
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleStatusChange('solved')}>
                <CheckCircle className="h-4 w-4 mr-2 text-blue-500" />
                Mark as Solved
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleStatusChange('closed')}>
                <XCircle className="h-4 w-4 mr-2 text-red-500" />
                Mark as Closed
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <Card className="mb-4">
        <CardHeader>
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {selectedPost.username ? getInitials(selectedPost.username) : 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="text-sm text-muted-foreground">
                {selectedPost.username || 'Anonymous'} • {formatDate(selectedPost.created_at)}
              </div>
            </div>
            <Badge 
              variant="outline" 
              className={`${getStatusColor(selectedPost.status)} capitalize`}
            >
              {selectedPost.status}
            </Badge>
          </div>
          <CardTitle className="text-xl font-bold">
            {selectedPost.title}
          </CardTitle>
          <CardDescription className="mt-1 whitespace-pre-wrap">
            {selectedPost.description}
          </CardDescription>
        </CardHeader>
        {selectedPost.code && (
          <CardContent>
            <div className="bg-muted rounded-md p-3 font-mono text-sm overflow-auto max-h-96">
              <pre>{selectedPost.code}</pre>
            </div>
          </CardContent>
        )}
      </Card>

      <div className="flex-1 overflow-hidden flex flex-col">
        <h3 className="text-lg font-semibold mb-2">Comments</h3>
        
        <ScrollArea className="flex-1 pr-4">
          {commentsLoading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : comments.length > 0 ? (
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="bg-muted/50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="bg-primary/20 text-primary text-xs">
                        {comment.username ? getInitials(comment.username) : 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-sm font-medium">
                      {comment.username || 'Anonymous'}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatDate(comment.created_at)}
                    </div>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{comment.comment}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No comments yet. Be the first to comment!
            </div>
          )}
        </ScrollArea>

        <Separator className="my-4" />

        <div className="mt-auto">
          <div className="flex gap-2">
            <Textarea
              placeholder="Add a comment..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="min-h-[80px]"
            />
          </div>
          <div className="flex justify-end mt-2">
            <Button 
              onClick={handleCommentSubmit} 
              disabled={isSubmitting || !commentText.trim()}
            >
              {isSubmitting ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Comment
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobPostDetails;
