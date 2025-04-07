import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useJobBoard } from '@/hooks/useJobBoard';
import JobPostCard from './JobPostCard';
import JobPostDetails from './JobPostDetails';
import CreateJobPostForm from './CreateJobPostForm';
import { Button } from '@/components/ui/button';
import { PlusCircle, Loader2, UserX } from 'lucide-react';
import CallModal, { CallModalHandle } from './CallModal';
import CallNotification from './CallNotification';
import ChatDialog from './ChatDialog';
import { usePeerJS } from '@/hooks/usePeerJS';
import { toast } from 'sonner';

export default function JobBoard() {
  const { posts, loading, selectedPost, setSelectedPost, createPost } = useJobBoard();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const { 
    videoRef, 
    remoteVideoRef, 
    startVideo, 
    startAudio, 
    isConnecting, 
    incomingCall,
    answerCall,
    declineCall,
    startChat,
    sendChatMessage,
    activeChat,
    setActiveChat,
    chatMessages
  } = usePeerJS();
  
  const [callModalOpen, setCallModalOpen] = useState(false);
  const [callType, setCallType] = useState<'video' | 'audio' | null>(null);
  const [callPeer, setCallPeer] = useState('');
  const [chatOpen, setChatOpen] = useState(false);
  const [chatPeer, setChatPeer] = useState({ id: '', name: '' });
  
  const callModalRef = useRef<CallModalHandle>(null);
  
  const handleCreatePost = async (values: { 
    title: string; 
    description: string; 
    code?: string;
  }) => {
    const result = await createPost(values.title, values.description, values.code);
    if (result) {
      setShowCreateForm(false);
      toast.success("Your post has been published!");
    }
  };

  const handleBackToList = () => {
    setSelectedPost(null);
  };

  const handleCallInitiated = (type: 'video' | 'audio', userId: string, peerName: string) => {
    setCallType(type);
    setCallPeer(peerName);
    setCallModalOpen(true);
    
    // Start the call
    if (type === 'video') {
      startVideo(userId, peerName);
    } else {
      startAudio(userId, peerName);
    }
  };
  
  const handleChatInitiated = (userId: string, peerName: string) => {
    setChatPeer({ id: userId, name: peerName });
    setChatOpen(true);
    setActiveChat(userId);
    startChat(userId, peerName);
  };

  const handleCloseCallModal = () => {
    setCallModalOpen(false);
    setCallType(null);
    
    // Make sure to stop any active media streams
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    
    if (remoteVideoRef.current?.srcObject) {
      (remoteVideoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
      remoteVideoRef.current.srcObject = null;
    }
  };
  
  const handleCloseChatDialog = () => {
    setChatOpen(false);
    setActiveChat(null);
  };
  
  const handleAcceptCall = () => {
    if (incomingCall) {
      setCallType(incomingCall.type);
      setCallPeer(incomingCall.caller);
      setCallModalOpen(true);
      answerCall(incomingCall.call);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-6 sm:px-8 py-12">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex justify-between items-center mb-10"
      >
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Developer Community Board</h2>
          <p className="text-gray-500 mt-1">Connect with other developers and solve problems together</p>
        </div>
        
        {!selectedPost && !showCreateForm && (
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button 
              onClick={() => setShowCreateForm(true)}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 px-5 py-6"
              size="lg"
            >
              <PlusCircle size={18} />
              Post a Problem
            </Button>
          </motion.div>
        )}
        
        {(selectedPost || showCreateForm) && (
          <Button 
            variant="outline" 
            onClick={() => {
              setSelectedPost(null);
              setShowCreateForm(false);
            }}
            className="border-gray-300 hover:bg-gray-100"
          >
            Back to List
          </Button>
        )}
      </motion.div>

      <AnimatePresence mode="wait">
        {loading && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col justify-center items-center h-[50vh]"
          >
            <Loader2 className="h-12 w-12 animate-spin text-purple-500 mb-4" />
            <p className="text-gray-500">Loading posts...</p>
          </motion.div>
        )}

        {!loading && showCreateForm && (
          <motion.div
            key="create-form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <CreateJobPostForm 
              onSubmit={handleCreatePost} 
              onCancel={() => setShowCreateForm(false)} 
            />
          </motion.div>
        )}

        {!loading && selectedPost && (
          <motion.div
            key="post-details"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <JobPostDetails 
              post={selectedPost}
              onBack={handleBackToList}
              onCallInitiated={handleCallInitiated}
              onChatInitiated={handleChatInitiated}
            />
          </motion.div>
        )}

        {!loading && !selectedPost && !showCreateForm && (
          <motion.div
            key="posts-grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {posts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {posts.map(post => (
                  <JobPostCard 
                    key={post.id} 
                    post={post} 
                    onClick={() => setSelectedPost(post)}
                    onCallInitiated={handleCallInitiated}
                    onChatInitiated={handleChatInitiated}
                  />
                ))}
              </div>
            ) : (
              <motion.div 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }}
                className="text-center p-16 bg-gray-50 rounded-xl border border-gray-200"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                  <UserX size={32} className="text-gray-400" />
                </div>
                <h3 className="text-xl font-medium text-gray-700 mb-2">No posts yet</h3>
                <p className="text-gray-500 mb-6 max-w-md mx-auto">Be the first to share your problem or question with the community.</p>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button 
                    onClick={() => setShowCreateForm(true)}
                    className="bg-purple-600 hover:bg-purple-700 px-6"
                    size="lg"
                  >
                    Create a Post
                  </Button>
                </motion.div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Call Notification for incoming calls */}
      <AnimatePresence>
        {incomingCall && (
          <CallNotification
            isVisible={!!incomingCall}
            caller={incomingCall.caller}
            callType={incomingCall.type}
            onAccept={handleAcceptCall}
            onDecline={declineCall}
          />
        )}
      </AnimatePresence>

      {/* Call Modal for active calls */}
      <CallModal
        ref={callModalRef}
        isOpen={callModalOpen}
        onClose={handleCloseCallModal}
        callType={callType}
        peerName={callPeer}
        localVideoRef={videoRef}
        remoteVideoRef={remoteVideoRef}
      />
      
      {/* Chat Dialog for messaging */}
      <ChatDialog
        isOpen={chatOpen}
        onClose={handleCloseChatDialog}
        peerName={chatPeer.name}
        peerId={chatPeer.id}
        messages={chatMessages[chatPeer.id] || []}
        onSendMessage={(peerId, message) => sendChatMessage(peerId, message)}
      />
    </div>
  );
}
