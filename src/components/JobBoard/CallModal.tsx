import React, { useRef, forwardRef, useImperativeHandle, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Phone, Video, X, Mic, MicOff, VideoOff, Loader2, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';

type CallModalProps = {
  isOpen: boolean;
  onClose: () => void;
  callType: 'video' | 'audio' | null;
  peerName: string;
  localVideoRef: React.RefObject<HTMLVideoElement>;
  remoteVideoRef: React.RefObject<HTMLVideoElement>;
};

export type CallModalHandle = {
  open: (type: 'video' | 'audio', peerName: string) => void;
  close: () => void;
};

const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 }
};

const bounce = {
  initial: { scale: 0.9, opacity: 0 },
  animate: { 
    scale: 1, 
    opacity: 1, 
    transition: { 
      type: "spring", 
      stiffness: 300,
      damping: 10
    } 
  }
};

const CallModal = forwardRef<CallModalHandle, CallModalProps>(
  ({ isOpen, onClose, callType, peerName, localVideoRef, remoteVideoRef }, ref) => {
    const [audioEnabled, setAudioEnabled] = useState(true);
    const [videoEnabled, setVideoEnabled] = useState(true);
    const [connectingState, setConnectingState] = useState<'connecting' | 'connected' | 'failed' | 'permission_denied' | null>(null);
    const [connectingProgress, setConnectingProgress] = useState(0);
    const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
    
    useEffect(() => {
      if (isOpen && !connectingState) {
        setConnectingState('connecting');
        setConnectingProgress(0);
        
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
        }
        
        progressIntervalRef.current = setInterval(() => {
          setConnectingProgress(prev => {
            const newValue = prev + 1;
            if (newValue > 95) return prev + 0.1; 
            if (newValue > 85) return prev + 0.5;
            return newValue;
          });
        }, 50);
        
        const connectionTimeout = setTimeout(() => {
          if (localVideoRef.current?.srcObject || remoteVideoRef.current?.srcObject) {
            setConnectingState('connected');
            if (progressIntervalRef.current) {
              clearInterval(progressIntervalRef.current);
              setConnectingProgress(100);
            }
          } else {
            setConnectingState('failed');
            if (progressIntervalRef.current) {
              clearInterval(progressIntervalRef.current);
            }
          }
        }, 10000);
        
        return () => {
          clearTimeout(connectionTimeout);
          if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
          }
        };
      }
    }, [isOpen, localVideoRef, remoteVideoRef]);
    
    useEffect(() => {
      if (!isOpen) {
        setConnectingState(null);
        setConnectingProgress(0);
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
        }
      }
    }, [isOpen]);
    
    useEffect(() => {
      const checkStreams = () => {
        if (connectingState === 'permission_denied') {
          return;
        }
        
        if (
          (remoteVideoRef.current?.srcObject && 
           (remoteVideoRef.current.srcObject as MediaStream).active)
        ) {
          setConnectingState('connected');
          setConnectingProgress(100);
          if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
          }
        }
      };
      
      checkStreams();
      const interval = setInterval(checkStreams, 1000);
      
      return () => clearInterval(interval);
    }, [remoteVideoRef, connectingState]);
    
    useEffect(() => {
      const handleError = (event: ErrorEvent) => {
        if (event.error?.name === 'NotAllowedError' || 
            event.message?.includes('Permission denied') ||
            event.message?.includes('NotAllowedError')) {
          setConnectingState('permission_denied');
          if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
          }
        }
      };
      
      const originalConsoleError = console.error;
      console.error = (...args) => {
        const errorMessage = args.join(' ');
        if (errorMessage.includes('NotAllowedError') || 
            errorMessage.includes('Permission denied')) {
          setConnectingState('permission_denied');
          if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
          }
        }
        originalConsoleError.apply(console, args);
      };
      
      window.addEventListener('error', handleError);
      
      return () => {
        window.removeEventListener('error', handleError);
        console.error = originalConsoleError;
      };
    }, []);
    
    const toggleAudio = () => {
      if (localVideoRef.current?.srcObject) {
        const stream = localVideoRef.current.srcObject as MediaStream;
        stream.getAudioTracks().forEach(track => {
          track.enabled = !audioEnabled;
        });
        setAudioEnabled(!audioEnabled);
      }
    };
    
    const toggleVideo = () => {
      if (localVideoRef.current?.srcObject) {
        const stream = localVideoRef.current.srcObject as MediaStream;
        stream.getVideoTracks().forEach(track => {
          track.enabled = !videoEnabled;
        });
        setVideoEnabled(!videoEnabled);
      }
    };
    
    const openDeviceSettings = () => {
      const mediaConstraints = {
        audio: true,
        video: callType === 'video'
      };
      
      toast.info(`Requesting ${callType === 'video' ? 'camera and microphone' : 'microphone'} access...`);
      
      navigator.mediaDevices.getUserMedia(mediaConstraints)
        .then(stream => {
          stream.getTracks().forEach(track => track.stop());
          toast.success('Permission granted! Try calling again.');
          onClose();
        })
        .catch(err => {
          console.error('Could not get device permissions:', err);
          
          if (err.name === 'NotAllowedError') {
            toast.error('Access denied. Please enable permissions in your browser settings.', {
              duration: 5000
            });
          } else if (err.name === 'NotFoundError') {
            toast.error(`${callType === 'video' ? 'Camera' : 'Microphone'} not found. Please check your device.`, {
              duration: 5000
            });
          } else {
            toast.error('Could not access your devices. Please check browser settings.');
          }
        });
    };

    useImperativeHandle(ref, () => ({
      open: (type, name) => {
        // This is handled by parent component
      },
      close: () => {
        onClose();
      }
    }));

    if (!isOpen) return null;

    return (
      <AnimatePresence>
        {isOpen && (
          <motion.div
            {...fadeIn}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-xl overflow-hidden shadow-2xl max-w-2xl w-full"
            >
              <div className="flex justify-between items-center p-4 border-b">
                <div className="flex items-center gap-2">
                  {callType === 'video' ? <Video size={20} /> : <Phone size={20} />}
                  <h3 className="font-medium">
                    {callType === 'video' ? 'Video' : 'Audio'} call with {peerName}
                  </h3>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
                  <X size={20} />
                </Button>
              </div>

              <div className="relative">
                {connectingState === 'connecting' && (
                  <div className="absolute inset-0 bg-black bg-opacity-75 z-10 flex flex-col items-center justify-center p-8">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    >
                      <Loader2 className="h-10 w-10 text-white mb-4" />
                    </motion.div>
                    <h3 className="text-white text-xl mb-2">Connecting...</h3>
                    <p className="text-gray-300 mb-4 text-center">Establishing secure connection with {peerName}</p>
                    <div className="w-full max-w-md">
                      <Progress value={connectingProgress} className="h-2" />
                    </div>
                  </div>
                )}
                
                {connectingState === 'permission_denied' && (
                  <motion.div
                    className="absolute inset-0 bg-black bg-opacity-75 z-10 flex flex-col items-center justify-center p-8"
                    {...fadeIn}
                  >
                    <motion.div 
                      className="rounded-full bg-yellow-100 p-4 mb-4"
                      {...bounce}
                    >
                      <Settings size={32} className="text-yellow-600" />
                    </motion.div>
                    <h3 className="text-white text-xl mb-2">Permission Required</h3>
                    <p className="text-gray-300 mb-4 text-center">
                      This call requires access to your {callType === 'video' ? 'camera and microphone' : 'microphone'}.
                      Please grant permission in your browser settings.
                    </p>
                    <div className="flex gap-3">
                      <Button 
                        onClick={openDeviceSettings}
                        className="bg-white text-black hover:bg-gray-100"
                      >
                        Grant Permission
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={onClose}
                        className="border-gray-600 text-white hover:bg-gray-800"
                      >
                        Cancel
                      </Button>
                    </div>
                  </motion.div>
                )}
                
                {connectingState === 'failed' && (
                  <div className="absolute inset-0 bg-black bg-opacity-75 z-10 flex flex-col items-center justify-center p-8">
                    <div className="rounded-full bg-red-100 p-4 mb-4">
                      <X size={32} className="text-red-600" />
                    </div>
                    <h3 className="text-white text-xl mb-2">Connection Failed</h3>
                    <p className="text-gray-300 mb-4 text-center">Unable to establish connection with {peerName}. They may be offline or unavailable.</p>
                    <Button 
                      onClick={onClose}
                      className="bg-white text-black hover:bg-gray-100"
                    >
                      Close
                    </Button>
                  </div>
                )}
                
                {callType === 'video' && (
                  <div className="bg-black aspect-video w-full">
                    <video 
                      ref={remoteVideoRef} 
                      autoPlay 
                      playsInline 
                      className="w-full h-full object-cover"
                    />
                    
                    <div className="absolute bottom-4 right-4 w-1/4 aspect-video bg-gray-900 rounded-lg overflow-hidden border-2 border-white shadow-lg">
                      <video 
                        ref={localVideoRef} 
                        autoPlay 
                        playsInline 
                        muted 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                )}
                
                {callType === 'audio' && (
                  <div className="bg-gray-100 p-10 flex items-center justify-center">
                    <div className="w-24 h-24 rounded-full bg-purple-100 flex items-center justify-center">
                      <Phone size={40} className="text-purple-600" />
                    </div>
                    <audio ref={remoteVideoRef} autoPlay />
                    <audio ref={localVideoRef} autoPlay muted />
                  </div>
                )}
              </div>

              <div className="p-4 flex justify-center gap-4">
                <Button 
                  variant="outline" 
                  className={`rounded-full p-3 ${audioEnabled ? 'bg-gray-100' : 'bg-red-100 text-red-600'}`}
                  onClick={toggleAudio}
                >
                  {audioEnabled ? <Mic size={20} /> : <MicOff size={20} />}
                </Button>
                
                {callType === 'video' && (
                  <Button 
                    variant="outline" 
                    className={`rounded-full p-3 ${videoEnabled ? 'bg-gray-100' : 'bg-red-100 text-red-600'}`}
                    onClick={toggleVideo}
                  >
                    {videoEnabled ? <Video size={20} /> : <VideoOff size={20} />}
                  </Button>
                )}
                
                <Button 
                  variant="destructive" 
                  className="rounded-full px-6"
                  onClick={onClose}
                >
                  End Call
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }
);

CallModal.displayName = 'CallModal';
export default CallModal;
