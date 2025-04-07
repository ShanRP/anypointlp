
import React from 'react';
import { motion } from 'framer-motion';
import { Phone, Video, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

type CallNotificationType = 'video' | 'audio';

interface CallNotificationProps {
  isVisible: boolean;
  caller: string;
  callType: CallNotificationType;
  onAccept: () => void;
  onDecline: () => void;
}

const CallNotification = ({
  isVisible,
  caller,
  callType,
  onAccept,
  onDecline
}: CallNotificationProps) => {
  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -100, opacity: 0 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center"
    >
      <div className="bg-white shadow-lg border border-gray-200 rounded-b-lg p-4 max-w-md w-full mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-purple-100 p-3">
            {callType === 'video' ? (
              <Video size={24} className="text-purple-600" />
            ) : (
              <Phone size={24} className="text-purple-600" />
            )}
          </div>
          <div>
            <h4 className="font-medium text-gray-900">Incoming {callType} call</h4>
            <p className="text-sm text-gray-500">from {caller}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              onClick={onDecline}
              variant="outline"
              className="rounded-full p-2 h-auto border-red-200 text-red-500 hover:bg-red-50 hover:text-red-600"
            >
              <X size={20} />
            </Button>
          </motion.div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              onClick={onAccept}
              className="rounded-full px-4 py-2 bg-green-500 hover:bg-green-600 text-white"
            >
              Answer
            </Button>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default CallNotification;
