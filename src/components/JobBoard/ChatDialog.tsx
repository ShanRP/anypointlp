
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Send, User, MessageCircle } from 'lucide-react';
import { format } from 'date-fns';

interface ChatMessage {
  text: string;
  sender: string;
  timestamp: string;
  fromMe: boolean;
}

interface ChatDialogProps {
  isOpen: boolean;
  onClose: () => void;
  peerName: string;
  peerId: string;
  messages: ChatMessage[];
  onSendMessage: (message: string, peerId: string) => boolean;
}

const ChatDialog = ({
  isOpen,
  onClose,
  peerName,
  peerId,
  messages,
  onSendMessage
}: ChatDialogProps) => {
  const [message, setMessage] = useState('');
  const messageEndRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (isOpen && messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isOpen, messages]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      const success = onSendMessage(message, peerId);
      if (success) {
        setMessage('');
      }
    }
  };
  
  const formatTimestamp = (timestamp: string) => {
    try {
      return format(new Date(timestamp), 'h:mm a');
    } catch (e) {
      return '';
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="p-0 sm:max-w-md w-full custom-sheet-content">
        <div className="flex flex-col h-full">
          <SheetHeader className="border-b p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100">
                  <User className="h-5 w-5 text-purple-600" />
                </div>
                <SheetTitle>{peerName}</SheetTitle>
              </div>
              {/* Removed the custom close button that was causing duplication */}
            </div>
          </SheetHeader>
          
          <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
            <AnimatePresence>
              {messages.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center h-full text-center p-6"
                >
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                    <MessageCircle size={32} className="text-purple-600" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-700 mb-2">Start chatting with {peerName}</h3>
                  <p className="text-gray-500 text-sm">
                    Your messages are private and only shared between you and {peerName}.
                  </p>
                </motion.div>
              ) : (
                messages.map((msg, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className={`mb-3 flex ${msg.fromMe ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] px-4 py-2 rounded-2xl ${
                        msg.fromMe
                          ? 'bg-purple-600 text-white rounded-br-none'
                          : 'bg-white border border-gray-200 rounded-bl-none'
                      }`}
                    >
                      <div className="flex flex-col">
                        <span className={`text-xs mb-1 ${msg.fromMe ? 'text-purple-200' : 'text-gray-500'}`}>
                          {msg.fromMe ? 'You' : msg.sender}
                        </span>
                        <span>{msg.text}</span>
                        <span className={`text-xs mt-1 self-end ${msg.fromMe ? 'text-purple-200' : 'text-gray-400'}`}>
                          {formatTimestamp(msg.timestamp)}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
            <div ref={messageEndRef} />
          </div>
          
          <div className="border-t p-4">
            <form onSubmit={handleSubmit} className="flex items-center gap-2">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  type="submit"
                  disabled={!message.trim()}
                  className={`rounded-full p-3 h-auto ${!message.trim() ? 'opacity-50' : ''}`}
                >
                  <Send size={18} />
                </Button>
              </motion.div>
            </form>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ChatDialog;
