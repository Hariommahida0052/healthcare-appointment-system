import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMic, FiMicOff, FiVideo, FiVideoOff, FiPhoneOff, FiMaximize, FiMinimize } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import './ConsultationPage.css';

const ConsultationPage = () => {
  const { roomId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [callStatus, setCallStatus] = useState('Connecting...');
  
  const socketRef = useRef();
  const peerRef = useRef();
  const localVideoRef = useRef();
  const remoteVideoRef = useRef();

  useEffect(() => {
    // 1. Initialize Socket
    socketRef.current = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000');

    // 2. Start Local Video
    startLocalVideo();

    return () => {
      // Cleanup
      localStream?.getTracks().forEach(track => track.stop());
      socketRef.current.disconnect();
      if (peerRef.current) peerRef.current.close();
    };
  }, []);

  const startLocalVideo = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setLocalStream(stream);
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      
      // Join Room after getting stream
      socketRef.current.emit('join-room', { 
        roomId, 
        userId: user._id, 
        userName: user.fullName, 
        role: user.role 
      });

      setupSocketEvents(stream);
    } catch (err) {
      console.error('Error accessing media devices:', err);
      setCallStatus('Camera/Mic access denied');
    }
  };

  const setupSocketEvents = (stream) => {
    // When both are in room, first person creates offer
    socketRef.current.on('start-call', ({ targetSocketId }) => {
      createPeerConnection(targetSocketId, stream, true);
    });

    // Receive offer from peer
    socketRef.current.on('offer', async ({ offer, fromSocketId }) => {
      createPeerConnection(fromSocketId, stream, false);
      await peerRef.current.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await peerRef.current.createAnswer();
      await peerRef.current.setLocalDescription(answer);
      socketRef.current.emit('answer', { targetSocketId: fromSocketId, answer });
    });

    // Receive answer from peer
    socketRef.current.on('answer', async ({ answer }) => {
      await peerRef.current.setRemoteDescription(new RTCSessionDescription(answer));
    });

    // Receive ICE candidates
    socketRef.current.on('ice-candidate', async ({ candidate }) => {
      if (peerRef.current) {
        await peerRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      }
    });

    socketRef.current.on('user-left', () => {
      setRemoteStream(null);
      setCallStatus('Peer disconnected');
    });

    socketRef.current.on('call-ended', () => {
      handleEndCall();
    });
  };

  const createPeerConnection = (targetSocketId, stream, isInitiator) => {
    peerRef.current = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });

    // Add local tracks to peer
    stream.getTracks().forEach(track => peerRef.current.addTrack(track, stream));

    // Handle incoming remote track
    peerRef.current.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = event.streams[0];
      setCallStatus('Live Consultation');
    };

    // Handle ICE candidates
    peerRef.current.onicecandidate = (event) => {
      if (event.candidate) {
        socketRef.current.emit('ice-candidate', { 
          targetSocketId, 
          candidate: event.candidate 
        });
      }
    };

    if (isInitiator) {
      createOffer(targetSocketId);
    }
  };

  const createOffer = async (targetSocketId) => {
    const offer = await peerRef.current.createOffer();
    await peerRef.current.setLocalDescription(offer);
    socketRef.current.emit('offer', { targetSocketId, offer });
  };

  const toggleMute = () => {
    localStream.getAudioTracks()[0].enabled = isMuted;
    setIsMuted(!isMuted);
  };

  const toggleCamera = () => {
    localStream.getVideoTracks()[0].enabled = isCameraOff;
    setIsCameraOff(!isCameraOff);
  };

  const handleEndCall = () => {
    socketRef.current.emit('end-call', { roomId });
    navigate(user.role === 'doctor' ? '/doctor/dashboard' : '/patient/dashboard');
  };

  return (
    <div className="consultation-page">
      {/* Top Header */}
      <header className="consultation-header">
        <div className="call-info">
          <span className={`status-dot ${remoteStream ? 'live' : 'waiting'}`}></span>
          <h3>{callStatus}</h3>
          <span className="room-id">ID: {roomId.slice(0, 8)}</span>
        </div>
      </header>

      {/* Video Grid */}
      <div className={`video-container ${remoteStream ? 'dual' : 'single'}`}>
        <div className="remote-video-box">
          <video ref={remoteVideoRef} autoPlay playsInline className="remote-video" />
          {!remoteStream && (
            <div className="waiting-overlay">
              <div className="pulse-loader"></div>
              <p>Waiting for the other participant to join...</p>
            </div>
          )}
        </div>

        {/* Local Preview (Picture in Picture style if remote exists) */}
        <div className={`local-video-box ${remoteStream ? 'pip' : ''}`}>
          <video ref={localVideoRef} autoPlay playsInline muted className="local-video" />
          <div className="local-name">You ({user.fullName})</div>
        </div>
      </div>

      {/* Controls */}
      <div className="call-controls">
        <motion.button 
          whileTap={{ scale: 0.9 }}
          className={`control-btn ${isMuted ? 'off' : ''}`} 
          onClick={toggleMute}
        >
          {isMuted ? <FiMicOff /> : <FiMic />}
        </motion.button>

        <motion.button 
          whileTap={{ scale: 0.9 }}
          className="control-btn end-call-btn" 
          onClick={handleEndCall}
        >
          <FiPhoneOff />
        </motion.button>

        <motion.button 
          whileTap={{ scale: 0.9 }}
          className={`control-btn ${isCameraOff ? 'off' : ''}`} 
          onClick={toggleCamera}
        >
          {isCameraOff ? <FiVideoOff /> : <FiVideo />}
        </motion.button>
      </div>
    </div>
  );
};

export default ConsultationPage;
