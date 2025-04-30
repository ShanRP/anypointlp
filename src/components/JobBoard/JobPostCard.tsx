
import React from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Video, Phone, Clock, MessageCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { JobPost } from '@/hooks/useJobBoard';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { usePeerJS } from '@/hooks/usePeerJS';

type JobPostCardProps = {
  post: JobPost;
  onClick: () => void;
  onCallInitiated: (type: 'video' | 'audio', userId: string, username: string) => void;
  onChatInitiated: (userId: string, username: string) => void;
};

export default function JobPostCard({ post, onClick, onCallInitiated, onChatInitiated }: JobPostCardProps) {
  const { user } = useAuth();
  const { isConnecting } = usePeerJS();
  
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

  const getInitials = (username?: string) => {
    if (!username) return 'U';
    return username.substring(0, 2).toUpperCase();
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
  
  const handleChatClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      toast.error("Please login to start a chat");
      return;
    }
    
    if (isConnecting) {
      toast.info("Already connecting to a peer");
      return;
    }
    
    onChatInitiated(post.user_id, post.username || 'Anonymous');
  };
  
  const handleVideoCall = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      toast.error("Please login to start a video call");
      return;
    }
    
    if (isConnecting) {
      toast.info("Already connecting to a peer");
      return;
    }
    
    onCallInitiated('video', post.user_id, post.username || 'Anonymous');
  };
  
  const handleAudioCall = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      toast.error("Please login to start an audio call");
      return;
    }
    
    if (isConnecting) {
      toast.info("Already connecting to a peer");
      return;
    }
    
    onCallInitiated('audio', post.user_id, post.username || 'Anonymous');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
      transition={{ duration: 0.3 }}
      className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:border-purple-200 cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${getRandomColor(post.username)}`}>
            {getInitials(post.username)}
          </div>
          <div>
            <h3 className="font-semibold">{post.username || 'Anonymous'}</h3>
            <p className="text-sm text-gray-500 flex items-center gap-1">
              <Clock size={12} />
              {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
            </p>
          </div>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(post.status)}`}>
          {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
        </span>
      </div>
      <h3 className="text-lg font-bold mb-2">{post.title}</h3>
      <p className="text-gray-600 mb-4">
        {post.description.length > 150 
          ? `${post.description.substring(0, 150)}...` 
          : post.description}
      </p>
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.95 }}>
            <Button 
              className="relative p-2 h-auto rounded-full bg-purple-100 text-purple-600 hover:bg-purple-200 transition-colors"
              onClick={handleChatClick}
            >
              <MessageCircle size={16} />
            </Button>
          </motion.div>
          
          <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.95 }}>
            <Button 
              className="relative p-2 h-auto rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors"
              onClick={handleVideoCall}
              disabled={isConnecting}
            >
              <Video size={16} />
            </Button>
          </motion.div>
          
          <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.95 }}>
            <Button 
              className="relative p-2 h-auto rounded-full bg-green-100 text-green-600 hover:bg-green-200 transition-colors"
              onClick={handleAudioCall}
              disabled={isConnecting}
            >
              <Phone size={16} />
            </Button>
          </motion.div>
          
          <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.95 }}>
            <Button 
              className="relative p-2 h-auto rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                onClick();
              }}
            >
              <MessageSquare size={16} />
              {(post.comment_count && post.comment_count > 0) && (
                <span className="absolute -top-1 -right-1 bg-purple-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                  {post.comment_count > 9 ? '9+' : post.comment_count}
                </span>
              )}
            </Button>
          </motion.div>
        </div>
        {post.code && (
          <span className="text-xs bg-gray-100 px-2 py-1 rounded-full text-gray-600">
            Has code snippet
          </span>
        )}
      </div>
    </motion.div>
  );
}
