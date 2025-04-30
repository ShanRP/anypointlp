// Update imports and fix the component structure to use addComment instead of createComment
import React, { useState, useEffect } from 'react';
import { useJobBoard, JobPost, JobComment } from '@/hooks/useJobBoard';
import { formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { MessageCircle, Code } from 'lucide-react';
import { toast } from 'sonner';

interface JobPostDetailsProps {
  post: JobPost;
  onBack: () => void;
  onCallInitiated: (type: "audio" | "video", userId: string, peerName: string) => void;
  onChatInitiated: (userId: string, peerName: string) => void;
}

const JobPostDetails = ({ post, onBack, onCallInitiated, onChatInitiated }) => {
  const [commentInput, setCommentInput] = useState('');
  const { comments, commentsLoading, fetchComments, addComment, updatePostStatus } = useJobBoard();
  const [showConfirmation, setShowConfirmation] = useState(false);

  useEffect(() => {
    fetchComments(post.id);
  }, [post.id, fetchComments]);

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

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentInput.trim()) return;

    const newComment = await addComment(post.id, commentInput);
    if (newComment) {
      setCommentInput('');
    }
  };

  const handleStatusChange = async (status: string) => {
    const success = await updatePostStatus(post.id, status);
    if (success) {
      setShowConfirmation(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <Card className="flex-1 flex flex-col">
        <CardHeader>
          <Button variant="ghost" onClick={onBack} className="mb-4 justify-start">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Job Board
          </Button>
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {post.username ? getInitials(post.username) : 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="text-sm text-muted-foreground">
                {post.username || 'Anonymous'} • {formatDate(post.created_at)}
              </div>
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">{post.title}</CardTitle>
          <CardDescription>{post.description}</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 overflow-auto">
          {post.code && (
            <div className="mb-4 bg-muted rounded-md p-3 text-xs font-mono">
              <Code className="inline-block h-4 w-4 mr-2 text-muted-foreground opacity-70" />
              {post.code}
            </div>
          )}

          <h4 className="text-lg font-semibold mt-4 mb-2">Comments</h4>
          {commentsLoading ? (
            <p>Loading comments...</p>
          ) : (
            <div className="space-y-2">
              {comments.map((comment) => (
                <div key={comment.id} className="border rounded-md p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="bg-secondary text-secondary-foreground">
                        {comment.username ? getInitials(comment.username) : 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-sm font-medium">{comment.username || 'Anonymous'}</div>
                    <div className="text-xs text-muted-foreground ml-auto">{formatDate(comment.created_at)}</div>
                  </div>
                  <p className="text-sm">{comment.comment}</p>
                </div>
              ))}
            </div>
          )}

          <form onSubmit={handleAddComment} className="mt-4">
            <Input
              type="text"
              placeholder="Add a comment..."
              value={commentInput}
              onChange={(e) => setCommentInput(e.target.value)}
            />
            <Button type="submit" className="mt-2">
              Add Comment
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default JobPostDetails;
