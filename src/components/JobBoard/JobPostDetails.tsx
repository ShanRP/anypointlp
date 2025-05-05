
import React, { useState } from "react";
import { motion } from "framer-motion";
import { Clock, MessageSquare, ArrowLeft, Video, PhoneCall } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useJobBoard } from "@/hooks/useJobBoard";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import MonacoEditorWithFallback from "@/components/MonacoEditorWithFallback";
import { handleApiError } from "@/utils/errorHandler";

interface PostComment {
  id: string;
  username: string;
  comment: string;
  created_at: string;
}

interface JobPostDetailsProps {
  post: any;
  onBack: () => void;
  onCallInitiated: (type: "video" | "audio", userId: string, peerName: string) => void;
  onChatInitiated: (userId: string, peerName: string) => void;
}

const JobPostDetails: React.FC<JobPostDetailsProps> = ({
  post,
  onBack,
  onCallInitiated,
  onChatInitiated,
}) => {
  const { addComment, postComments, fetchComments } = useJobBoard();
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    if (post) {
      fetchComments(post.id);
    }
  }, [post, fetchComments]);

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;
    
    setIsSubmitting(true);
    try {
      await addComment(post.id, newComment);
      setNewComment("");
    } catch (error) {
      handleApiError(error, "Adding comment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (e) {
      return "Unknown date";
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center">
        <Button
          variant="ghost"
          onClick={onBack}
          className="flex items-center gap-1 text-gray-500 hover:text-gray-800"
        >
          <ArrowLeft size={16} />
          Back to board
        </Button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex justify-between items-start mb-3">
          <h1 className="text-2xl font-bold text-gray-800 leading-tight">
            {post.title}
          </h1>

          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="flex items-center gap-1"
              onClick={() => onCallInitiated("audio", post.user_id, post.username || "User")}
            >
              <PhoneCall size={16} />
              <span className="hidden sm:inline">Call</span>
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex items-center gap-1"
              onClick={() => onCallInitiated("video", post.user_id, post.username || "User")}
            >
              <Video size={16} />
              <span className="hidden sm:inline">Video</span>
            </Button>
            <Button
              size="sm"
              variant="secondary"
              className="flex items-center gap-1"
              onClick={() => onChatInitiated(post.user_id, post.username || "User")}
            >
              <MessageSquare size={16} />
              <span>Chat</span>
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-3 text-sm text-gray-500 mb-6">
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={`https://avatar.vercel.sh/${post.username || "user"}.png`} />
              <AvatarFallback>{(post.username || "U")[0]}</AvatarFallback>
            </Avatar>
            <span>{post.username || "Anonymous User"}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock size={14} />
            <span>{formatDate(post.created_at)}</span>
          </div>
        </div>

        <Card className="p-6 mb-6">
          <div className="prose max-w-none dark:prose-invert mb-6">
            <p className="whitespace-pre-line">{post.description}</p>
          </div>

          {post.code && (
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Code Sample</h3>
              <div className="border rounded-md overflow-hidden h-[300px]">
                <MonacoEditorWithFallback
                  value={post.code}
                  language="javascript"
                  options={{
                    readOnly: true,
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    lineNumbers: 'on',
                  }}
                />
              </div>
            </div>
          )}
        </Card>

        <Separator className="my-8" />

        <h2 className="text-xl font-semibold mb-4">Comments</h2>

        <div className="mb-6">
          <Textarea
            placeholder="Add your comment..."
            className="mb-2 min-h-[100px]"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
          />
          <Button
            onClick={handleSubmitComment}
            disabled={!newComment.trim() || isSubmitting}
            className="mt-2"
          >
            {isSubmitting ? "Posting..." : "Post Comment"}
          </Button>
        </div>

        <ScrollArea className="h-[400px] rounded-md border p-4">
          {postComments && postComments.length > 0 ? (
            <div className="space-y-4">
              {postComments.map((comment: PostComment) => (
                <Card key={comment.id} className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={`https://avatar.vercel.sh/${comment.username || "user"}.png`} />
                      <AvatarFallback>{(comment.username || "U")[0]}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">{comment.username || "Anonymous User"}</span>
                    <span className="text-xs text-gray-500">
                      {formatDate(comment.created_at)}
                    </span>
                  </div>
                  <p className="text-gray-700 whitespace-pre-line">{comment.comment}</p>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center p-8 text-gray-500">
              No comments yet. Be the first to comment!
            </div>
          )}
        </ScrollArea>
      </motion.div>
    </div>
  );
};

export default JobPostDetails;
