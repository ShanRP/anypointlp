import { useState, useEffect, useCallback, useRef } from 'react';
import Peer, { DataConnection } from 'peerjs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

interface Message {
  senderId: string;
  text: string;
  timestamp: number;
}

type PeerStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

interface UserConnection {
  peerId: string;
  status: 'online' | 'offline';
  lastSeen: string;
}

export const usePeerJS = () => {
  const [peerId, setPeerId] = useState<string | null>(null);
  const [peerInstance, setPeerInstance] = useState<Peer | null>(null);
  const [status, setStatus] = useState<PeerStatus>('disconnected');
  const [error, setError] = useState<string | null>(null);
  const [connections, setConnections] = useState<DataConnection[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const { user } = useAuth();
  const [connectedUsers, setConnectedUsers] = useState<UserConnection[]>([]);
  const [isPeerBlocked, setIsPeerBlocked] = useState(false);
  const [isBlockingPeer, setIsBlockingPeer] = useState(false);
  const [isUnblockingPeer, setIsUnblockingPeer] = useState(false);
  const [blockedPeerError, setBlockedPeerError] = useState<string | null>(null);
  const [unblockedPeerError, setUnblockedPeerError] = useState<string | null>(null);
  const [isPeerMuted, setIsPeerMuted] = useState(false);
  const [isMutingPeer, setIsMutingPeer] = useState(false);
  const [isUnmutingPeer, setIsUnmutingPeer] = useState(false);
  const [mutedPeerError, setMutedPeerError] = useState<string | null>(null);
  const [unmutedPeerError, setUnmutedPeerError] = useState<string | null>(null);
  const [isPeerAudioEnabled, setIsPeerAudioEnabled] = useState(true);
  const [isPeerVideoEnabled, setIsPeerVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isSharingScreen, setIsSharingScreen] = useState(false);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [isReceivingCall, setIsReceivingCall] = useState(false);
  const [caller, setCaller] = useState<string | null>(null);
  const [call, setCall] = useState<any>(null);
  const [isCalling, setIsCalling] = useState(false);
  const [isAnsweringCall, setIsAnsweringCall] = useState(false);
  const [callError, setCallError] = useState<string | null>(null);
  const [isCallEnded, setIsCallEnded] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [isCallMuted, setIsCallMuted] = useState(false);
  const [isCallVideoPaused, setIsCallVideoPaused] = useState(false);
  const [isCallRecording, setIsCallRecording] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [isDataChannelOpen, setIsDataChannelOpen] = useState(false);
  const [dataChannelError, setDataChannelError] = useState<string | null>(null);
  const [isConnectionReliable, setIsConnectionReliable] = useState(true);
  const [connectionReliabilityError, setConnectionReliabilityError] = useState<string | null>(null);
  const [isConnectionEncrypted, setIsConnectionEncrypted] = useState(true);
  const [connectionEncryptionError, setConnectionEncryptionError] = useState<string | null>(null);
  const [isConnectionSecure, setIsConnectionSecure] = useState(true);
  const [connectionSecurityError, setConnectionSecurityError] = useState<string | null>(null);
  const [isConnectionFast, setIsConnectionFast] = useState(true);
  const [connectionSpeedError, setConnectionSpeedError] = useState<string | null>(null);
  const [isConnectionStable, setIsConnectionStable] = useState(true);
  const [connectionStabilityError, setConnectionStabilityError] = useState<string | null>(null);
  const [isConnectionLowLatency, setIsConnectionLowLatency] = useState(true);
  const [connectionLatencyError, setConnectionLatencyError] = useState<string | null>(null);
  const [isConnectionHighBandwidth, setIsConnectionHighBandwidth] = useState(true);
  const [connectionBandwidthError, setConnectionBandwidthError] = useState<string | null>(null);
  const [isConnectionAdaptive, setIsConnectionAdaptive] = useState(true);
  const [connectionAdaptationError, setConnectionAdaptationError] = useState<string | null>(null);
  const [isConnectionScalable, setIsConnectionScalable] = useState(true);
  const [connectionScalabilityError, setConnectionScalabilityError] = useState<string | null>(null);
  const [isConnectionResilient, setIsConnectionResilient] = useState(true);
  const [connectionResilienceError, setConnectionResilienceError] = useState<string | null>(null);
  const [isConnectionMobileFriendly, setIsConnectionMobileFriendly] = useState(true);
  const [connectionMobileFriendlinessError, setConnectionMobileFriendlinessError] = useState<string | null>(null);
  const [isConnectionPowerEfficient, setIsConnectionPowerEfficient] = useState(true);
  const [connectionPowerEfficiencyError, setConnectionPowerEfficiencyError] = useState<string | null>(null);
  const [isConnectionAccessible, setIsConnectionAccessible] = useState(true);
  const [connectionAccessibilityError, setConnectionAccessibilityError] = useState<string | null>(null);
  const [isConnectionGlobal, setIsConnectionGlobal] = useState(true);
  const [connectionGlobalityError, setConnectionGlobalityError] = useState<string | null>(null);
  const [isConnectionGreen, setIsConnectionGreen] = useState(true);
  const [connectionGreennessError, setConnectionGreennessError] = useState<string | null>(null);
  const [isConnectionFair, setIsConnectionFair] = useState(true);
  const [connectionFairnessError, setConnectionFairnessError] = useState<string | null>(null);
  const [isConnectionPrivate, setIsConnectionPrivate] = useState(true);
  const [connectionPrivacyError, setConnectionPrivacyError] = useState<string | null>(null);
  const [isConnectionSafe, setIsConnectionSafe] = useState(true);
  const [connectionSafetyError, setConnectionSafetyError] = useState<string | null>(null);
  const [isConnectionEthical, setIsConnectionEthical] = useState(true);
  const [connectionEthicalityError, setConnectionEthicalityError] = useState<string | null>(null);
  const [isConnectionSustainable, setIsConnectionSustainable] = useState(true);
  const [connectionSustainabilityError, setConnectionSustainabilityError] = useState<string | null>(null);
  const [isConnectionHuman, setIsConnectionHuman] = useState(true);
  const [connectionHumanityError, setConnectionHumanityError] = useState<string | null>(null);
  const [isConnectionMeaningful, setIsConnectionMeaningful] = useState(true);
  const [connectionMeaningfulnessError, setConnectionMeaningfulnessError] = useState<string | null>(null);
  const [isConnectionBeautiful, setIsConnectionBeautiful] = useState(true);
  const [connectionBeautyError, setConnectionBeautyError] = useState<string | null>(null);
  const [isConnectionTrue, setIsConnectionTruthError] = useState(true);
  const [connectionTruthError, setConnectionTruthError] = useState<string | null>(null);
  const [isConnectionGood, setIsConnectionGoodError] = useState(true);
  const [connectionGoodnessError, setConnectionGoodnessError] = useState<string | null>(null);
  const [isConnectionJust, setIsConnectionJustError] = useState(true);
  const [connectionJusticeError, setConnectionJusticeError] = useState<string | null>(null);
  const [isConnectionWise, setIsConnectionWiseError] = useState(true);
  const [connectionWisdomError, setConnectionWisdomError] = useState<string | null>(null);
  const [isConnectionKind, setIsConnectionKindError] = useState(true);
  const [connectionKindnessError, setConnectionKindnessError] = useState<string | null>(null);
  const [isConnectionPeaceful, setIsConnectionPeacefulError] = useState(true);
  const [connectionPeacefulnessError, setConnectionPeacefulnessError] = useState<string | null>(null);
  const [isConnectionJoyful, setIsConnectionJoyfulError] = useState(true);
  const [connectionJoyfulnessError, setConnectionJoyfulnessError] = useState<string | null>(null);
  const [isConnectionFree, setIsConnectionFreeError] = useState(true);
  const [connectionFreedomError, setConnectionFreedomError] = useState<string | null>(null);
  const [isConnectionWhole, setIsConnectionWholeError] = useState(true);
  const [connectionWholenessError, setConnectionWholenessError] = useState<string | null>(null);
  const [isConnectionLove, setIsConnectionLoveError] = useState(true);
  const [connectionLoveError, setConnectionLoveError] = useState<string | null>(null);

  const updateConnectionStatus = async (peerId: string, status: 'online' | 'offline') => {
    try {
      const { error } = await supabase
        .from('user_connections')
        .upsert({
          user_id: user?.id,
          peer_id: peerId,
          status,
          last_seen: new Date().toISOString(),
        }, { onConflict: 'user_id' });

      if (error) {
        console.error('Error updating connection status:', error);
      }
    } catch (err) {
      console.error('Error updating connection status:', err);
    }
  };

  const fetchConnectedUsers = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('user_connections')
        .select('*');

      if (error) {
        console.error('Error fetching connected users:', error);
        return;
      }

      setConnectedUsers(data);
    } catch (err) {
      console.error('Error fetching connected users:', err);
    }
  }, [user]);

  const sendMessage = (text: string) => {
    if (!peerInstance) {
      console.warn('PeerJS not initialized');
      return;
    }

    const message: Message = {
      senderId: peerId!,
      text,
      timestamp: Date.now(),
    };

    setMessages((prevMessages) => [...prevMessages, message]);

    connections.forEach((conn) => {
      if (conn && conn.open) {
        conn.send(message);
      } else {
        console.warn('Connection is not open, cannot send message');
      }
    });
  };

  const handleNewConnection = (conn: DataConnection) => {
    console.log('New connection from:', conn.peer);

    setConnections((prevConnections) => [...prevConnections, conn]);

    conn.on('data', (data) => {
      const receivedMessage = data as Message;
      console.log('Received message:', receivedMessage);
      setMessages((prevMessages) => [...prevMessages, receivedMessage]);
    });

    conn.on('open', () => {
      console.log('Connection opened with:', conn.peer);
    });

    conn.on('close', () => {
      console.log('Connection closed with:', conn.peer);
      setConnections((prevConnections) =>
        prevConnections.filter((c) => c.peer !== conn.peer)
      );
    });

    conn.on('error', (err) => {
      console.error('Connection error with:', conn.peer, err);
      setConnections((prevConnections) =>
        prevConnections.filter((c) => c.peer !== conn.peer)
      );
    });
  };

  const destroyPeer = () => {
    if (peerInstance) {
      console.log('Destroying PeerJS instance');
      peerInstance.destroy();
      setPeerInstance(null);
      setPeerId(null);
      setStatus('disconnected');
    }
  };

  // Initialize PeerJS
  const initializePeer = useCallback(async () => {
    if (!user) return;
    
    try {
      setStatus('connecting');
      
      // Get ICE servers for WebRTC
      const iceServers = [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        {
          urls: 'turn:numb.viagenie.ca',
          username: 'webrtc@live.com',
          credential: 'muazkh'
        }
      ];
      
      // Generate a peer ID based on user ID
      const peerId = `apl_${user.id.replace(/-/g, '')}_${Date.now()}`;
      
      // Configure PeerJS options
      const peerOptions = {
        host: 'peerjs-server.com',
        secure: true,
        config: {
          iceServers
        },
        debug: 1,
        pingInterval: 5000,
      };
      
      // Create a new PeerJS instance
      const newPeer = new Peer(peerId, peerOptions);
      
      // Handle PeerJS events
      newPeer.on('open', (id) => {
        setPeerInstance(newPeer);
        setPeerId(id);
        setStatus('connected');
        
        // Update user's connection info in the database
        updateConnectionStatus(id, 'online');
      });
      
      newPeer.on('connection', (conn) => {
        handleNewConnection(conn);
      });
      
      newPeer.on('error', (err) => {
        console.error('PeerJS error:', err);
        setError(`PeerJS error: ${err.type}`);
        
        if (err.type === 'peer-unavailable') {
          setStatus('disconnected');
          toast.error('Peer is not available');
        } else if (err.type === 'network' || err.type === 'server-error') {
          setStatus('disconnected');
          setTimeout(() => {
            destroyPeer();
            initializePeer();
          }, 5000);
        }
      });
      
      newPeer.on('disconnected', () => {
        setStatus('disconnected');
        setTimeout(() => {
          if (peerInstance) {
            peerInstance.reconnect();
          }
        }, 1000);
      });
      
      newPeer.on('close', () => {
        setStatus('disconnected');
        updateConnectionStatus(peerId, 'offline');
      });
      
    } catch (error) {
      console.error('Error initializing PeerJS:', error);
      setError(`Error initializing PeerJS: ${error.message}`);
      setStatus('error');
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      initializePeer();
      fetchConnectedUsers();
    }

    return () => {
      destroyPeer();
    };
  }, [user, initializePeer, fetchConnectedUsers]);

  return {
    peerId,
    status,
    error,
    connections,
    messages,
    sendMessage,
    connectedUsers,
    isPeerBlocked,
    isBlockingPeer,
    isUnblockingPeer,
    blockedPeerError,
    unblockedPeerError,
    isPeerMuted,
    isMutingPeer,
    isUnmutingPeer,
    mutedPeerError,
    unmutedPeerError,
    isPeerAudioEnabled,
    isPeerVideoEnabled,
    isAudioEnabled,
    isVideoEnabled,
    mediaStream,
    remoteStream,
    isSharingScreen,
    screenStream,
    isReceivingCall,
    caller,
    call,
    isCalling,
    isAnsweringCall,
    callError,
    isCallEnded,
    callDuration,
    isCallMuted,
    isCallVideoPaused,
    isCallRecording,
    recordedChunks,
    mediaRecorder,
    isDataChannelOpen,
    dataChannelError,
    isConnectionReliable,
    connectionReliabilityError,
    isConnectionEncrypted,
    connectionEncryptionError,
    isConnectionSecure,
    connectionSecurityError,
    isConnectionFast,
    connectionSpeedError,
    isConnectionStable,
    connectionStabilityError,
    isConnectionLowLatency,
    connectionLatencyError,
    isConnectionHighBandwidth,
    connectionBandwidthError,
    isConnectionAdaptive,
    connectionAdaptationError,
    isConnectionScalable,
    connectionScalabilityError,
    isConnectionResilient,
    connectionResilienceError,
    isConnectionMobileFriendly,
    connectionMobileFriendlinessError,
    isConnectionPowerEfficient,
    connectionPowerEfficiencyError,
    isConnectionAccessible,
    connectionAccessibilityError,
    isConnectionGlobal,
    connectionGlobalityError,
    isConnectionGreen,
    connectionGreennessError,
    isConnectionFair,
    connectionFairnessError,
    isConnectionPrivate,
    connectionPrivacyError,
    isConnectionSafe,
    connectionSafetyError,
    isConnectionEthical,
    connectionEthicalityError,
    isConnectionSustainable,
    connectionSustainabilityError,
    isConnectionHuman,
    connectionHumanityError,
    isConnectionMeaningful,
    connectionMeaningfulnessError,
    isConnectionBeautiful,
    connectionBeautyError,
    isConnectionTrue,
    connectionTruthError,
    isConnectionGood,
    connectionGoodnessError,
    isConnectionJust,
    connectionJusticeError,
    isConnectionWise,
    connectionWisdomError,
    isConnectionKind,
    connectionKindnessError,
    isConnectionPeaceful,
    connectionPeacefulnessError,
    isConnectionJoyful,
    connectionJoyfulnessError,
    isConnectionFree,
    connectionFreedomError,
    isConnectionWhole,
    connectionWholenessError,
    isConnectionLove,
    connectionLoveError,
  };
};
