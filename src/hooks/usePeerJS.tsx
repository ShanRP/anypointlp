import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

type MediaType = 'chat' | 'video' | 'audio';

// Connection states for better tracking
type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'failed';

export function usePeerJS() {
  const { user } = useAuth();
  const [peer, setPeer] = useState<any>(null);
  const [peerId, setPeerId] = useState<string | null>(null);
  const [connections, setConnections] = useState<Record<string, any>>({});
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const MAX_RECONNECT_ATTEMPTS = 10; // Increased from 5
  const [permissionStatus, setPermissionStatus] = useState<{ audio: boolean; video: boolean }>({
    audio: false,
    video: false
  });
  
  // Call notification state
  const [incomingCall, setIncomingCall] = useState<{
    call: any;
    caller: string;
    type: 'video' | 'audio';
  } | null>(null);

  // Chat state
  const [chatMessages, setChatMessages] = useState<Record<string, any[]>>({});
  const [activeChat, setActiveChat] = useState<string | null>(null);
  
  // Connection quality monitoring
  const [connectionQuality, setConnectionQuality] = useState<'unknown' | 'good' | 'medium' | 'poor'>('unknown');
  const connectionQualityCheckRef = useRef<NodeJS.Timeout | null>(null);

  // Check for device permissions
  useEffect(() => {
    const checkPermissions = async () => {
      try {
        // Check if permissions API is available
        if (navigator.permissions) {
          const audioResult = await navigator.permissions.query({ name: 'microphone' as PermissionName });
          const videoResult = await navigator.permissions.query({ name: 'camera' as PermissionName });
          
          setPermissionStatus({
            audio: audioResult.state === 'granted',
            video: videoResult.state === 'granted'
          });
          
          // Set up listeners for permission changes
          audioResult.onchange = () => setPermissionStatus(prev => ({ 
            ...prev, 
            audio: audioResult.state === 'granted' 
          }));
          
          videoResult.onchange = () => setPermissionStatus(prev => ({ 
            ...prev, 
            video: videoResult.state === 'granted' 
          }));
        }
      } catch (err) {
        console.log('Cannot query permissions API, will check at connection time');
      }
    };
    
    checkPermissions();
  }, []);

  // Cleanup function
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      
      if (connectionQualityCheckRef.current) {
        clearInterval(connectionQualityCheckRef.current);
      }
      
      if (peer) {
        Object.values(connections).forEach((conn: any) => {
          if (conn.close) conn.close();
        });
        peer.destroy();
      }
      
      // Clean up any media streams
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
      }
      
      if (remoteVideoRef.current?.srcObject) {
        (remoteVideoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Save chat messages to local storage
  useEffect(() => {
    if (Object.keys(chatMessages).length > 0) {
      localStorage.setItem('chatMessages', JSON.stringify(chatMessages));
    }
  }, [chatMessages]);

  // Load chat messages from local storage
  useEffect(() => {
    const savedMessages = localStorage.getItem('chatMessages');
    if (savedMessages) {
      try {
        setChatMessages(JSON.parse(savedMessages));
      } catch (e) {
        console.error('Error parsing saved chat messages:', e);
      }
    }
  }, []);

  // Function to fetch ICE servers dynamically
  const fetchIceServers = useCallback(async () => {
    try {
      // In a production app, you would fetch from your backend
      // For now, we'll return a combination of free and reliable servers
      return [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun.stunprotocol.org:3478' },
        { urls: 'stun:stun.voip.blackberry.com:3478' },
        { 
          urls: 'turn:global.turn.twilio.com:3478?transport=udp',
          username: 'f4b4035eaa76f4a55de5f4351567653ee4ff6fa97b50b6b334fcc1be9c27212d',
          credential: 'w1WpauEsFbAMI/9IxU0vyDlAEuU='
        },
        { 
          urls: 'turn:global.turn.twilio.com:3478?transport=tcp',
          username: 'f4b4035eaa76f4a55de5f4351567653ee4ff6fa97b50b6b334fcc1be9c27212d',
          credential: 'w1WpauEsFbAMI/9IxU0vyDlAEuU='
        },
        { 
          urls: 'turn:global.turn.twilio.com:443?transport=tcp',
          username: 'f4b4035eaa76f4a55de5f4351567653ee4ff6fa97b50b6b334fcc1be9c27212d',
          credential: 'w1WpauEsFbAMI/9IxU0vyDlAEuU='
        }
      ];
    } catch (error) {
      console.error('Failed to fetch ICE servers:', error);
      // Fallback to basic STUN servers
      return [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ];
    }
  }, []);

  // Enhanced PeerJS initialization with better error handling
  const initializePeer = useCallback(async () => {
    if (peer && peer.open) return peer;
    
    setConnectionError(null);
    setConnectionState('connecting');

    try {
      console.log('Initializing PeerJS...');
      // Dynamically import PeerJS
      const { Peer } = await import('peerjs');
      
      const peerIdToUse = user?.id || `guest-${Math.random().toString(36).substr(2, 9)}`;
      console.log('Creating peer with ID:', peerIdToUse);
      
      // Get fresh ICE servers
      const iceServers = await fetchIceServers();
      
      // Try multiple PeerJS servers in case one fails
      const peerServers = [
        { host: 'peerjs-server.herokuapp.com', secure: true },
        { host: 'peerjs.com', secure: true },
        { host: '0.peerjs.com', secure: true },
        // Fallback to default PeerJS server if none of the above work
        {}
      ];
      
      let newPeer = null;
      let serverIndex = 0;
      let peerError = null;
      
      // Try each server until one works or we run out of options
      while (!newPeer && serverIndex < peerServers.length) {
        try {
          const serverConfig = peerServers[serverIndex];
          
          newPeer = new Peer(peerIdToUse, {
            config: {
              'iceServers': iceServers
            },
            debug: 1, // Reduced debug level
            ...serverConfig,
            pingInterval: 5000, // More frequent ping to detect connection issues
          });
          
          // Wait for the peer to open or error
          await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
              reject(new Error('Peer connection timeout'));
            }, 15000);
            
            newPeer.on('open', () => {
              clearTimeout(timeout);
              resolve(true);
            });
            
            newPeer.on('error', (err) => {
              clearTimeout(timeout);
              reject(err);
            });
          });
          
          // If we get here, the peer is open
          break;
        } catch (err) {
          peerError = err;
          console.warn(`Failed to connect to PeerJS server ${serverIndex}:`, err);
          
          // Clean up the failed peer
          if (newPeer) {
            newPeer.destroy();
            newPeer = null;
          }
          
          serverIndex++;
        }
      }
      
      // If we couldn't connect to any server
      if (!newPeer) {
        throw peerError || new Error('Failed to connect to any PeerJS server');
      }

      // Handle successful connection
      newPeer.on('open', (id) => {
        console.log('My peer ID is: ' + id);
        setPeerId(id);
        setIsConnected(true);
        setConnectionState('connected');
        reconnectAttemptsRef.current = 0; // Reset reconnect attempts on successful connection
        toast.success(`Connected to peer network as ${id.substring(0, 8)}...`);
        
        // Start monitoring connection quality
        startConnectionQualityMonitoring(newPeer);
      });

      // Improved error handling
      newPeer.on('error', (err) => {
        console.error('PeerJS error:', err);
        let errorMessage = '';
        
        if (err.type === 'peer-unavailable') {
          errorMessage = 'User is offline or unavailable';
          setConnectionState('disconnected');
        } else if (err.type === 'browser-incompatible') {
          errorMessage = 'Your browser does not support WebRTC connections';
          setConnectionState('failed');
        } else if (err.name === 'NotAllowedError' || err.message?.includes('Permission denied')) {
          errorMessage = 'Microphone/camera access denied. Please allow access in your browser settings.';
          setConnectionState('failed');
        } else if (err.type === 'network' || err.type === 'unavailable-id' || err.type === 'socket-error') {
          errorMessage = 'Network issue detected. Attempting to reconnect...';
          setConnectionState('reconnecting');
          attemptReconnect();
          return; // Don't show error toast for reconnection attempts
        } else if (err.type === 'server-error') {
          errorMessage = 'Server error. Trying alternative connection method...';
          setConnectionState('reconnecting');
          attemptReconnect(true);
          return; // Don't show error toast for reconnection attempts
        } else if (err.type === 'disconnected') {
          errorMessage = 'Disconnected from server. Reconnecting...';
          setConnectionState('reconnecting');
          attemptReconnect();
          return;
        } else {
          errorMessage = `Connection error: ${err.message || 'Unknown error'}`;
          setConnectionState('failed');
        }
        
        setConnectionError(errorMessage);
        toast.error(errorMessage);
      });

      // Handle disconnection
      newPeer.on('disconnected', () => {
        console.log('Peer disconnected from server');
        setConnectionState('reconnecting');
        
        // Try to reconnect
        newPeer.reconnect();
        
        // If reconnect doesn't work after a timeout, try our custom reconnect
        setTimeout(() => {
          if (connectionState !== 'connected') {
            attemptReconnect();
          }
        }, 5000);
      });

      // Handle incoming data connections
      newPeer.on('connection', (conn) => {
        setupDataConnection(conn);
      });

      // Handle incoming media connections
      newPeer.on('call', (call) => {
        // Get metadata from the call if available
        const metadata = call.metadata || {};
        const callType = metadata.type || 'audio';
        const callerName = metadata.username || 'Unknown';
        
        // Show notification for incoming call
        setIncomingCall({
          call,
          caller: callerName,
          type: callType
        });
      });

      setPeer(newPeer);
      return newPeer;
    } catch (error) {
      console.error('Failed to initialize PeerJS:', error);
      setConnectionError('Failed to initialize communication');
      setConnectionState('failed');
      toast.error('Failed to initialize communication. Retrying...');
      
      // Attempt to reconnect
      attemptReconnect();
      return null;
    }
  }, [user, fetchIceServers, connectionState]);

  // Start monitoring connection quality
  const startConnectionQualityMonitoring = useCallback((activePeer) => {
    if (connectionQualityCheckRef.current) {
      clearInterval(connectionQualityCheckRef.current);
    }
    
    connectionQualityCheckRef.current = setInterval(() => {
      // Check if we have any active connections
      const activeConnections = Object.values(connections);
      
      if (activeConnections.length === 0) {
        setConnectionQuality('unknown');
        return;
      }
      
      // Check if peer is still connected
      if (!activePeer || !activePeer.open) {
        setConnectionQuality('poor');
        return;
      }
      
      // For WebRTC connections, we could check stats like packet loss, etc.
      // This is a simplified version
      const allConnectionsOpen = activeConnections.every((conn: any) => conn.open);
      
      if (allConnectionsOpen) {
        setConnectionQuality('good');
      } else {
        setConnectionQuality('medium');
      }
    }, 10000); // Check every 10 seconds
  }, [connections]);

  // Enhanced reconnection mechanism
  const attemptReconnect = useCallback((useAlternativeServer = false) => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    reconnectAttemptsRef.current += 1;
    setConnectionState('reconnecting');
    
    if (reconnectAttemptsRef.current > MAX_RECONNECT_ATTEMPTS) {
            toast.error('Failed to connect after multiple attempts. Please try again later.');
      setConnectionState('failed');
      reconnectAttemptsRef.current = 0;
      return;
    }
    
    const delay = Math.min(1000 * Math.pow(1.5, reconnectAttemptsRef.current), 10000);
    
    console.log(`Attempting to reconnect (attempt ${reconnectAttemptsRef.current}/${MAX_RECONNECT_ATTEMPTS}) in ${delay/1000}s...`);
    
    reconnectTimeoutRef.current = setTimeout(() => {
      if (peer) {
        peer.destroy();
      }
      setPeer(null);
      initializePeer();
    }, delay);
  }, [peer, initializePeer]);

  const requestMediaPermissions = async (type: 'video' | 'audio'): Promise<boolean> => {
    try {
      toast.info(`Requesting ${type} permission...`);
      const constraints = { 
        audio: true,
        video: type === 'video'
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      // Stop the stream right away, we just needed the permission
      stream.getTracks().forEach(track => track.stop());
      
      // Update permission status
      setPermissionStatus(prev => ({
        ...prev,
        audio: true,
        video: type === 'video' ? true : prev.video
      }));
      
      return true;
    } catch (error) {
      console.error('Permission request failed:', error);
      toast.error(`${type === 'video' ? 'Camera' : 'Microphone'} access denied. Please enable in your browser settings.`, {
        duration: 6000,
      });
      return false;
    }
  };

  const answerCall = async (call: any) => {
    setIncomingCall(null); // Clear the notification
    
    try {
      // First try with requested media type
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: call.metadata?.type === 'video', 
        audio: true 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      call.answer(stream);
      call.on('stream', (remoteStream: MediaStream) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStream;
        }
      });
      
      toast.success('Call connected');
    } catch (err) {
      console.error('Failed to get local stream', err);
      
      if (err instanceof Error && err.name === 'NotAllowedError') {
        toast.error('Microphone/camera access denied. Call cannot be established.', {
          duration: 6000,
        });
        
        // Try to answer with just audio if video was requested but denied
        if (call.metadata?.type === 'video') {
          try {
            const audioOnlyStream = await navigator.mediaDevices.getUserMedia({ 
              video: false, 
              audio: true 
            });
            
            call.answer(audioOnlyStream);
            call.on('stream', (remoteStream: MediaStream) => {
              if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = remoteStream;
              }
            });
            
            toast.warning('Video unavailable. Connected with audio only.');
            return;
          } catch (audioErr) {
            console.error('Failed to get audio-only stream', audioErr);
          }
        }
      }
      
      // Last resort: try to answer without any media
      try {
        call.answer();
        toast.warning('Answering call without media access');
      } catch (fallbackErr) {
        console.error('Failed to answer call:', fallbackErr);
        toast.error('Could not establish connection');
      }
    }

    // Set up call monitoring
    const callQualityInterval = setInterval(() => {
      if (call.peerConnection) {
        call.peerConnection.getStats(null).then((stats: any) => {
          stats.forEach((report: any) => {
            if (report.type === 'transport') {
              console.log('Call transport stats:', report);
            }
          });
        }).catch(err => {
          console.error('Failed to get call stats:', err);
        });
      }
    }, 10000);

    call.on('close', () => {
      clearInterval(callQualityInterval);
      toast.info('Call ended');
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
    });
    
    call.on('error', (err: any) => {
      clearInterval(callQualityInterval);
      console.error('Call error:', err);
      toast.error('Call error: ' + (err.message || 'Connection issue'));
    });
  };
  
  const declineCall = () => {
    if (incomingCall) {
      // Close the call without answering
      incomingCall.call.close();
      setIncomingCall(null);
      toast.info(`Declined call from ${incomingCall.caller}`);
    }
  };

  const setupDataConnection = (conn: any) => {
    // Add heartbeat to keep connection alive
    const heartbeatInterval = setInterval(() => {
      if (conn.open) {
        try {
          conn.send({ type: 'heartbeat', timestamp: Date.now() });
        } catch (e) {
          console.log('Heartbeat failed, connection may be closed');
        }
      } else {
        clearInterval(heartbeatInterval);
      }
    }, 15000); // Reduced to 15 seconds for more frequent checks
    
    // Add connection quality monitoring
    const connectionMonitorInterval = setInterval(() => {
      if (conn.peerConnection) {
        conn.peerConnection.getStats(null).then((stats: any) => {
          // Process connection stats if needed
        }).catch(err => {
          console.error('Failed to get connection stats:', err);
        });
      }
    }, 10000);
    
    conn.on('open', () => {
      // Add this connection to our state
      setConnections(prev => ({ ...prev, [conn.peer]: conn }));
      
      const username = conn.metadata?.username || 'User';
      toast.success(`Connected to ${username}`);
      
      // Initialize chat array for this peer if it doesn't exist
      setChatMessages(prev => {
        if (!prev[conn.peer]) {
          return {
            ...prev,
            [conn.peer]: []
          };
        }
        return prev;
      });
      
      // Send a welcome message
      try {
        conn.send({
          type: 'chat',
          message: 'Connected successfully!',
          sender: user?.email?.split('@')[0] || 'Anonymous',
          system: true
        });
      } catch (e) {
        console.error('Failed to send welcome message:', e);
      }
      
      conn.on('data', (data: any) => {
        // Ignore heartbeat messages
        if (data.type === 'heartbeat') return;
        
        if (data.type === 'chat') {
          // Store the message in chat history
          setChatMessages(prev => {
            const updatedMessages = [...(prev[conn.peer] || []), {
              text: data.message,
              sender: data.sender || username,
              timestamp: new Date().toISOString(),
              fromMe: false,
              system: data.system || false
            }];
            
            return {
              ...prev,
              [conn.peer]: updatedMessages
            };
          });
          
          // Show notification only if not actively chatting with this peer
          if (activeChat !== conn.peer && !data.system) {
            toast.info(`${username}: ${data.message}`);
          }
        }
      });
    });

    conn.on('close', () => {
      clearInterval(heartbeatInterval);
      clearInterval(connectionMonitorInterval);
      
      setConnections(prev => {
        const newConnections = { ...prev };
        delete newConnections[conn.peer];
        return newConnections;
      });
      
      // Add a system message to the chat
      setChatMessages(prev => {
        if (prev[conn.peer]) {
          return {
            ...prev,
            [conn.peer]: [
              ...prev[conn.peer],
              {
                text: 'Disconnected',
                sender: 'System',
                timestamp: new Date().toISOString(),
                fromMe: false,
                system: true
              }
            ]
          };
        }
        return prev;
      });
      
      toast.info(`Disconnected from ${conn.metadata?.username || 'user'}`);
    });
    
    conn.on('error', (err: any) => {
      clearInterval(heartbeatInterval);
      clearInterval(connectionMonitorInterval);
      console.error('Connection error:', err);
      toast.error('Connection error: ' + (err.message || 'Unknown error'));
      
      // Try to reconnect the data connection if possible
      if (peer && peer.open) {
        setTimeout(() => {
          try {
            const newConn = peer.connect(conn.peer, {
              reliable: true,
              metadata: conn.metadata
            });
            setupDataConnection(newConn);
          } catch (reconnectErr) {
            console.error('Failed to reconnect data connection:', reconnectErr);
          }
        }, 3000);
      }
    });
  };

  // Enhanced connection method with retry and fallback mechanisms
  const connect = async (userId: string, username: string, mediaType: MediaType) => {
    if (!user) {
      toast.error('You need to be logged in to connect');
      return;
    }

    if (userId === user.id) {
      toast.error('You cannot connect to yourself');
      return;
    }

    setIsConnecting(true);
    setConnectionError(null);
    
    try {
      // Request permissions first if this is an audio or video call
      if (mediaType === 'audio' || mediaType === 'video') {
        const permissionGranted = await requestMediaPermissions(mediaType);
        if (!permissionGranted) {
          setIsConnecting(false);
          return;
        }
      }
      
      const activePeer = await initializePeer();
      if (!activePeer) {
        setIsConnecting(false);
        return;
      }

      console.log(`Attempting to connect to ${userId} for ${mediaType}`);
      
      if (mediaType === 'chat') {
        // First check if we already have an open connection
        if (connections[userId] && connections[userId].open) {
          setActiveChat(userId);
          setIsConnecting(false);
          toast.info(`Resuming chat with ${username}`);
          return;
        }
        
        // Create data connection for chat
        const conn = activePeer.connect(userId, {
          reliable: true,
          serialization: 'json', // Ensure JSON serialization
          metadata: {
            username: user.email?.split('@')[0] || 'Anonymous',
            mediaType,
            userId: user.id
          }
        });
        
        let connectionTimeoutId = setTimeout(() => {
          toast.error('Connection timed out. Please try again.');
          setIsConnecting(false);
        }, 20000); // 20 seconds timeout
        
        conn.on('open', () => {
          clearTimeout(connectionTimeoutId);
          setupDataConnection(conn);
          setActiveChat(userId);
          setIsConnecting(false);
        });
        
        conn.on('error', (err: any) => {
          clearTimeout(connectionTimeoutId);
          console.error('Connection error:', err);
          toast.error('Connection failed: ' + (err.message || 'Unable to reach peer'));
          setIsConnecting(false);
          
          // Try alternative approach - sometimes the initial connection fails but a second attempt works
          setTimeout(() => {
            toast.info('Trying alternative connection method...');
            try {
              const alternativeConn = activePeer.connect(userId, {
                reliable: true,
                serialization: 'json',
                metadata: {
                  username: user.email?.split('@')[0] || 'Anonymous',
                  mediaType,
                  userId: user.id,
                  retry: true
                }
              });
              
              let altConnectionTimeoutId = setTimeout(() => {
                toast.error('Alternative connection timed out.');
              }, 20000);
              
              alternativeConn.on('open', () => {
                clearTimeout(altConnectionTimeoutId);
                setupDataConnection(alternativeConn);
                setActiveChat(userId);
                toast.success('Connected using alternative method');
              });
              
              alternativeConn.on('error', (altErr: any) => {
                clearTimeout(altConnectionTimeoutId);
                console.error('Alternative connection error:', altErr);
                toast.error('All connection attempts failed');
              });
            } catch (altConnErr) {
              console.error('Failed to create alternative connection:', altConnErr);
            }
          }, 2000);
        });
      } else {
        // Get user media for video/audio calls with appropriate constraints
        const constraints = {
          video: mediaType === 'video' ? {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user'
          } : false,
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        };

        toast.info('Requesting access to microphone/camera...');
        
        try {
          const stream = await navigator.mediaDevices.getUserMedia(constraints);
          
          // Set local video stream
          if (videoRef.current && mediaType === 'video') {
            videoRef.current.srcObject = stream;
            videoRef.current.muted = true; // Mute local video to prevent echo
          }
          
          // First establish a data connection for signaling and chat
          const dataConn = activePeer.connect(userId, {
            reliable: true,
            metadata: {
              username: user.email?.split('@')[0] || 'Anonymous',
              mediaType: 'chat',
              callPending: true
            }
          });
          
          dataConn.on('open', () => {
            setupDataConnection(dataConn);
            
            // Now call the peer
            console.log(`Calling peer ${userId}...`);
            const call = activePeer.call(userId, stream, {
              metadata: {
                username: user.email?.split('@')[0] || 'Anonymous',
                type: mediaType,
                userId: user.id
              }
            });
            
            let callTimeoutId = setTimeout(() => {
              toast.error('Call connection timed out. Please try again.');
              call.close();
              setIsConnecting(false);
            }, 30000); // 30 seconds timeout
            
            call.on('stream', (remoteStream) => {
              clearTimeout(callTimeoutId);
              console.log('Received remote stream');
              if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = remoteStream;
              }
              setIsConnecting(false);
              
              // Send a chat message that call is connected
              try {
                dataConn.send({
                  type: 'chat',
                  message: `${mediaType === 'video' ? 'Video' : 'Audio'} call connected`,
                                    sender: 'System',
                  system: true
                });
              } catch (e) {
                console.error('Failed to send call connected message:', e);
              }
            });
            
            // Monitor call quality
            const callQualityInterval = setInterval(() => {
              if (call.peerConnection) {
                call.peerConnection.getStats(null).then((stats: any) => {
                  let hasAudioOrVideo = false;
                  let packetLoss = 0;
                  let jitter = 0;
                  
                  stats.forEach((report: any) => {
                    if (report.type === 'inbound-rtp' && (report.kind === 'audio' || report.kind === 'video')) {
                      hasAudioOrVideo = true;
                      if (report.packetsLost && report.packetsReceived) {
                        packetLoss = report.packetsLost / (report.packetsLost + report.packetsReceived);
                      }
                      if (report.jitter) {
                        jitter = report.jitter;
                      }
                    }
                  });
                  
                  // Update connection quality based on stats
                  if (!hasAudioOrVideo) {
                    setConnectionQuality('poor');
                  } else if (packetLoss > 0.1 || jitter > 50) {
                    setConnectionQuality('poor');
                  } else if (packetLoss > 0.05 || jitter > 30) {
                    setConnectionQuality('medium');
                  } else {
                    setConnectionQuality('good');
                  }
                }).catch(err => {
                  console.error('Failed to get call stats:', err);
                });
              }
            }, 5000);
            
            call.on('close', () => {
              clearInterval(callQualityInterval);
              console.log('Call closed');
              toast.info('Call ended');
              
              // Stop local stream
              if (videoRef.current?.srcObject) {
                (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
                videoRef.current.srcObject = null;
              }
              
              // Send a chat message that call ended
              try {
                if (dataConn.open) {
                  dataConn.send({
                    type: 'chat',
                    message: 'Call ended',
                    sender: 'System',
                    system: true
                  });
                }
              } catch (e) {
                console.error('Failed to send call ended message:', e);
              }
              
              setIsConnecting(false);
            });
            
            call.on('error', (err) => {
              clearTimeout(callTimeoutId);
              clearInterval(callQualityInterval);
              console.error('Call error:', err);
              toast.error('Call error: ' + (err.message || 'Connection issue'));
              setIsConnecting(false);
              
              // Try to gracefully handle the error
              if (videoRef.current?.srcObject) {
                (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
                videoRef.current.srcObject = null;
              }
              
              // Send a chat message about call failure if data connection is still open
              try {
                if (dataConn.open) {
                  dataConn.send({
                    type: 'chat',
                    message: 'Call failed: ' + (err.message || 'Connection issue'),
                    sender: 'System',
                    system: true
                  });
                }
              } catch (e) {
                console.error('Failed to send call failure message:', e);
              }
            });
          });
          
          dataConn.on('error', (err) => {
            console.error('Data connection error during call setup:', err);
            toast.error('Connection error: ' + (err.message || 'Unknown error'));
            setIsConnecting(false);
          });
          
          toast.success(`Connecting to ${username}...`);
        } catch (mediaError) {
          console.error('Media error:', mediaError);
          
          if (mediaError instanceof Error && mediaError.name === 'NotAllowedError') {
            toast.error('Microphone/camera access denied. Please enable in your browser settings.', {
              duration: 6000,
            });
          } else if (mediaError instanceof Error && mediaError.name === 'NotFoundError') {
            toast.error('No microphone/camera found. Please check your device.', {
              duration: 6000,
            });
          } else {
            toast.error('Failed to access media devices. Call aborted.');
          }
          
          setIsConnecting(false);
          
          // If this was a video call, try falling back to audio-only
          if (mediaType === 'video') {
            setTimeout(() => {
              toast.info('Trying audio-only call instead...');
              connect(userId, username, 'audio');
            }, 2000);
          }
        }
      }
    } catch (error) {
      console.error('Connection error:', error);
      let errorMessage = 'Failed to establish connection';
      
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          errorMessage = 'Microphone/camera access denied. Please enable in your browser settings.';
        } else if (error.message) {
          errorMessage = `Error: ${error.message}`;
        }
      }
      
      setConnectionError(errorMessage);
      toast.error(errorMessage);
      setIsConnecting(false);
    }
  };

  const sendChatMessage = (message: string, recipientId: string) => {
    const connection = connections[recipientId];
    if (connection && connection.open) {
      try {
        const messageObj = {
          type: 'chat',
          message,
          sender: user?.email?.split('@')[0] || 'Anonymous'
        };
        
        connection.send(messageObj);
        
        // Add message to chat history
        setChatMessages(prev => {
          const updatedMessages = [...(prev[recipientId] || []), {
            text: message,
            sender: user?.email?.split('@')[0] || 'Anonymous',
            timestamp: new Date().toISOString(),
            fromMe: true
          }];
          
          return {
            ...prev,
            [recipientId]: updatedMessages
          };
        });
        
        return true;
      } catch (error) {
        console.error('Failed to send message:', error);
        
        // Add error message to chat history
        setChatMessages(prev => {
          const updatedMessages = [...(prev[recipientId] || []), {
            text: 'Message failed to send. Please try again.',
            sender: 'System',
            timestamp: new Date().toISOString(),
            fromMe: false,
            system: true,
            error: true
          }];
          
          return {
            ...prev,
            [recipientId]: updatedMessages
          };
        });
        
        toast.error('Failed to send message. Connection may be lost.');
        
        // Try to reconnect
        if (peer && peer.open) {
          try {
            const newConn = peer.connect(recipientId, {
              reliable: true,
              metadata: connection.metadata
            });
            
            newConn.on('open', () => {
              setupDataConnection(newConn);
              // Try to resend the message
              setTimeout(() => {
                sendChatMessage(message, recipientId);
              }, 500);
            });
          } catch (reconnectErr) {
            console.error('Failed to reconnect for message retry:', reconnectErr);
          }
        }
        
        return false;
      }
    } else {
      // No active connection, try to establish one first
      toast.info('Reconnecting to send message...');
      
      // Get username from chat history if available
      let username = 'User';
      if (chatMessages[recipientId] && chatMessages[recipientId].length > 0) {
        const lastMessage = chatMessages[recipientId].find(msg => !msg.fromMe);
        if (lastMessage) {
          username = lastMessage.sender;
        }
      }
      
      connect(recipientId, username, 'chat');
      
      // Add pending message to chat history
      setChatMessages(prev => {
        const updatedMessages = [...(prev[recipientId] || []), {
          text: message,
          sender: user?.email?.split('@')[0] || 'Anonymous',
          timestamp: new Date().toISOString(),
          fromMe: true,
          pending: true
        }];
        
        return {
          ...prev,
          [recipientId]: updatedMessages
        };
      });
      
      return false;
    }
  };

  const disconnectAll = () => {
    Object.values(connections).forEach((conn: any) => {
      if (conn.open) {
        try {
          conn.send({
            type: 'chat',
            message: 'Disconnected',
            sender: 'System',
            system: true
          });
        } catch (e) {
          console.error('Failed to send disconnect message:', e);
        }
        conn.close();
      }
    });
    setConnections({});
    
    // Stop any active media streams
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    
    if (remoteVideoRef.current?.srcObject) {
      (remoteVideoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
      remoteVideoRef.current.srcObject = null;
    }
    
    toast.info('Disconnected from all peers');
  };

  const startChat = (userId: string, username: string) => {
    connect(userId, username, 'chat');
  };

  const startVideo = (userId: string, username: string) => {
    connect(userId, username, 'video');
  };

  const startAudio = (userId: string, username: string) => {
    connect(userId, username, 'audio');
  };

  // Function to check if a peer is online
  const checkPeerOnline = async (peerId: string): Promise<boolean> => {
    if (!peer || !peer.open) {
      await initializePeer();
    }
    
    return new Promise((resolve) => {
      // Set a timeout for the check
      const timeoutId = setTimeout(() => {
        resolve(false);
      }, 5000);
      
      try {
        // Try to establish a temporary connection
        const tempConn = peer.connect(peerId, {
          reliable: true,
          metadata: {
            username: user?.email?.split('@')[0] || 'Anonymous',
            statusCheck: true
          }
        });
        
        tempConn.on('open', () => {
          clearTimeout(timeoutId);
          // Close the connection right away
          tempConn.close();
          resolve(true);
        });
        
        tempConn.on('error', () => {
          clearTimeout(timeoutId);
          resolve(false);
        });
      } catch (error) {
        clearTimeout(timeoutId);
        resolve(false);
      }
    });
  };

  return {
    peerId,
    isConnecting,
    isConnected,
    connectionState,
    connectionError,
    connectionQuality,
    connections,
    permissionStatus,
    incomingCall,
    answerCall,
    declineCall,
    startChat,
    startVideo,
    startAudio,
    sendChatMessage,
    disconnectAll,
    checkPeerOnline,
    videoRef,
    remoteVideoRef,
    activeChat,
    setActiveChat,
    chatMessages
  };
}
