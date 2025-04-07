
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { useJobBoard, JobPost, JobComment } from '@/hooks/useJobBoard';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MessageSquare, Video, Phone, Clock, MessageCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Input } from '@/components/ui/input';
import CodeEditor from '@/components/MonacoEditor';
import { toast } from 'sonner';

interface JobPostDetailsProps {
  post: JobPost;
  onBack: () => void;
  onCallInitiated: (type: 'video' | 'audio', userId: string, username: string) => void;
  onChatInitiated: (userId: string, username: string) => void;
}

export default function JobPostDetails({ post, onBack, onCallInitiated, onChatInitiated }: JobPostDetailsProps) {
  const { user } = useAuth();
  const { comments, commentsLoading, addComment, updatePostStatus, fetchComments } = useJobBoard();
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  // Add useEffect to fetch comments when component mounts or post changes
  useEffect(() => {
    if (post && post.id) {
      fetchComments(post.id);
    }
  }, [post, fetchComments]);
  
  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;
    
    setSubmitting(true);
    const result = await addComment(post.id, comment);
    setSubmitting(false);
    
    if (result) {
      setComment('');
    }
  };
  
  const handleStatusChange = async (status: 'open' | 'in-progress' | 'closed') => {
    if (user?.id !== post.user_id) {
      toast.error("Only the post owner can change the status");
      return;
    }
    
    const success = await updatePostStatus(post.id, status);
    if (success) {
      // Status update handled by real-time subscription
    }
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-green-100 text-green-700';
      case 'in-progress':
        return 'bg-yellow-100 text-yellow-700';
      case 'closed':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };
  
  const getStatusBtnClass = (btnStatus: string) => {
    if (btnStatus === post.status) {
      return 'bg-gray-200 font-medium';
    }
    return 'bg-gray-100 hover:bg-gray-200';
  };
  
  const getRandomColor = (username?: string) => {
    const colors = [
      'bg-blue-100 text-blue-600',
      'bg-purple-100 text-purple-600',
      'bg-green-100 text-green-600',
      'bg-yellow-100 text-yellow-600',
      'bg-red-100 text-red-600',
      'bg-indigo-100 text-indigo-600',
      'bg-pink-100 text-pink-600',
    ];
    
    if (!username) return colors[0];
    const index = username.charCodeAt(0) % colors.length;
    return colors[index];
  };
  
  const getInitials = (username?: string) => {
    if (!username) return 'U';
    return username.substring(0, 2).toUpperCase();
  };
  
  const handleChatClick = () => {
    if (!user) {
      toast.error("Please login to start a chat");
      return;
    }
    
    onChatInitiated(post.user_id, post.username || 'Anonymous');
  };
  
  const handleVideoCall = () => {
    if (!user) {
      toast.error("Please login to start a video call");
      return;
    }
    
    onCallInitiated('video', post.user_id, post.username || 'Anonymous');
  };
  
  const handleAudioCall = () => {
    if (!user) {
      toast.error("Please login to start an audio call");
      return;
    }
    
    onCallInitiated('audio', post.user_id, post.username || 'Anonymous');
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div className="md:col-span-2">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6">
            <Button 
              variant="ghost" 
              onClick={onBack}
              className="mb-6 -ml-3 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              <ArrowLeft size={16} className="mr-2" />
              Back to list
            </Button>
            
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-800">{post.title}</h2>
              <motion.span
                whileHover={{ scale: 1.05 }}
                className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(post.status)}`}
              >
                {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
              </motion.span>
            </div>
            
            <div className="flex items-center gap-3 mb-6">
              <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold ${getRandomColor(post.username)}`}>
                {getInitials(post.username)}
              </div>
              <div>
                <div className="font-medium">{post.username || 'Anonymous'}</div>
                <div className="text-sm text-gray-500 flex items-center gap-1">
                  <Clock size={12} />
                  {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                </div>
              </div>
              <div className="ml-auto flex gap-2">
                <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.95 }}>
                  <Button 
                    className="p-2 h-auto rounded-full bg-purple-100 text-purple-600 hover:bg-purple-200 transition-colors"
                    onClick={handleChatClick}
                  >
                    <MessageCircle size={16} />
                  </Button>
                </motion.div>
                
                <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.95 }}>
                  <Button 
                    className="p-2 h-auto rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors"
                    onClick={handleVideoCall}
                  >
                    <Video size={16} />
                  </Button>
                </motion.div>
                
                <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.95 }}>
                  <Button 
                    className="p-2 h-auto rounded-full bg-green-100 text-green-600 hover:bg-green-200 transition-colors"
                    onClick={handleAudioCall}
                  >
                    <Phone size={16} />
                  </Button>
                </motion.div>
              </div>
            </div>
            
            <div className="prose max-w-none mb-6">
              <p>{post.description}</p>
            </div>
            
            {post.code && (
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-2">Code Snippet</h3>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <CodeEditor 
                    language="javascript"  
                    value={post.code} 
                    readOnly={true} 
                    onChange={() => {}} 
                    height="300px"
                  />
                </div>
              </div>
            )}
            
            {user?.id === post.user_id && (
              <div className="mt-6 border-t pt-6">
                <h3 className="text-lg font-medium mb-3">Update Status</h3>
                <div className="flex gap-2">
                  <Button 
                    variant="ghost" 
                    onClick={() => handleStatusChange('open')}
                    className={`text-sm px-3 py-1 h-auto ${getStatusBtnClass('open')}`}
                  >
                    Open
                  </Button>
                  <Button 
                    variant="ghost" 
                    onClick={() => handleStatusChange('in-progress')}
                    className={`text-sm px-3 py-1 h-auto ${getStatusBtnClass('in-progress')}`}
                  >
                    In Progress
                  </Button>
                  <Button 
                    variant="ghost" 
                    onClick={() => handleStatusChange('closed')}
                    className={`text-sm px-3 py-1 h-auto ${getStatusBtnClass('closed')}`}
                  >
                    Closed
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="md:col-span-1">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden h-full flex flex-col">
          <div className="p-4 border-b flex items-center">
            <MessageSquare size={18} className="text-gray-500 mr-2" />
            <h3 className="font-medium">Comments</h3>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[600px]">
            {commentsLoading ? (
              <div className="flex justify-center py-6">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-500"></div>
              </div>
            ) : comments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No comments yet. Be the first to comment!
              </div>
            ) : (
              comments.map((comment: JobComment) => (
                <motion.div 
                  key={comment.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gray-50 rounded-lg p-3"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold ${getRandomColor(comment.username)}`}>
                      {getInitials(comment.username)}
                    </div>
                    <div className="text-sm font-medium">{comment.username || 'Anonymous'}</div>
                    <div className="text-xs text-gray-500 ml-auto">
                      {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                    </div>
                  </div>
                  <p className="text-sm text-gray-700">{comment.comment}</p>
                </motion.div>
              ))
            )}
          </div>
          
          <div className="p-4 border-t mt-auto">
            <form onSubmit={handleCommentSubmit} className="flex gap-2">
              <Input 
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Add a comment..."
                disabled={!user || submitting}
                className="flex-1"
              />
              <Button 
                type="submit"
                disabled={!user || !comment.trim() || submitting}
              >
                {submitting ? 
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> : 
                  'Post'
                }
              </Button>
            </form>
            {!user && (
              <p className="text-xs text-gray-500 mt-2">
                You need to be logged in to comment.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
