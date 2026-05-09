/**
 * WebRTC Video Signaling Server
 * ──────────────────────────────
 * This file handles all Socket.IO events needed for
 * WebRTC peer-to-peer video consultation between
 * a patient and a doctor.
 *
 * HOW IT WORKS:
 * 1. Both users join a room using the appointment's videoRoomId
 * 2. When both are present, signaling begins
 * 3. Patient sends an "offer" (WebRTC SDP)
 * 4. Doctor responds with an "answer" (WebRTC SDP)
 * 5. Both exchange ICE candidates (network info)
 * 6. WebRTC peer connection is established → Video flows directly!
 *
 * The server only RELAYS messages — it never sees the video stream.
 */

// Track who is in each room: { roomId: [socketId1, socketId2] }
const rooms = {};

// Track online users: { userId: socketId }
const onlineUsers = {};

const setupVideoSignaling = (io) => {

  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    // ──────────────────────────────────────────────────────
    // EVENT: user-online
    // Purpose: Register a logged-in user to track online status
    // ──────────────────────────────────────────────────────
    socket.on('user-online', (userId) => {
      onlineUsers[userId] = socket.id;
      console.log(`👤 User online: ${userId} → socket: ${socket.id}`);
    });

    // ──────────────────────────────────────────────────────
    // EVENT: join-room
    // Purpose: Patient or Doctor joins the video consultation room
    // Emits: 'room-joined' to the joiner, 'user-joined' to others in room
    // ──────────────────────────────────────────────────────
    socket.on('join-room', ({ roomId, userId, userName, role }) => {
      console.log(`🚪 ${userName} (${role}) joining room: ${roomId}`);

      // Add socket to the room
      socket.join(roomId);

      // Track room members
      if (!rooms[roomId]) {
        rooms[roomId] = [];
      }

      // Add user to room if not already there
      if (!rooms[roomId].find(u => u.userId === userId)) {
        rooms[roomId].push({ socketId: socket.id, userId, userName, role });
      }

      // Tell the joiner they are in the room
      socket.emit('room-joined', {
        roomId,
        participants: rooms[roomId],
        yourSocketId: socket.id,
      });

      // Tell everyone else in the room that someone joined
      socket.to(roomId).emit('user-joined', {
        socketId: socket.id,
        userId,
        userName,
        role,
      });

      console.log(`👥 Room ${roomId} now has ${rooms[roomId].length} participant(s)`);

      // If 2 people are now in the room, signal them to start the call
      if (rooms[roomId].length === 2) {
        // Tell the FIRST person (who joined earlier) to create the WebRTC offer
        const firstParticipant = rooms[roomId][0];
        io.to(firstParticipant.socketId).emit('start-call', {
          targetSocketId: socket.id,  // second person's socket ID
        });
        console.log(`📞 Both users in room ${roomId} — starting call...`);
      }
    });

    // ──────────────────────────────────────────────────────
    // EVENT: offer
    // Purpose: Patient sends WebRTC offer to Doctor
    // This is the first step of WebRTC handshake
    // ──────────────────────────────────────────────────────
    socket.on('offer', ({ targetSocketId, offer }) => {
      console.log(`📤 Offer sent from ${socket.id} to ${targetSocketId}`);
      io.to(targetSocketId).emit('offer', {
        offer,
        fromSocketId: socket.id,
      });
    });

    // ──────────────────────────────────────────────────────
    // EVENT: answer
    // Purpose: Doctor sends WebRTC answer back to Patient
    // Second step of WebRTC handshake
    // ──────────────────────────────────────────────────────
    socket.on('answer', ({ targetSocketId, answer }) => {
      console.log(`📥 Answer sent from ${socket.id} to ${targetSocketId}`);
      io.to(targetSocketId).emit('answer', {
        answer,
        fromSocketId: socket.id,
      });
    });

    // ──────────────────────────────────────────────────────
    // EVENT: ice-candidate
    // Purpose: Exchange ICE candidates (network routing info)
    // Both sides send these to help WebRTC find the best path
    // ──────────────────────────────────────────────────────
    socket.on('ice-candidate', ({ targetSocketId, candidate }) => {
      io.to(targetSocketId).emit('ice-candidate', {
        candidate,
        fromSocketId: socket.id,
      });
    });

    // ──────────────────────────────────────────────────────
    // EVENT: toggle-audio
    // Purpose: Tell the other person you muted/unmuted
    // ──────────────────────────────────────────────────────
    socket.on('toggle-audio', ({ roomId, isMuted }) => {
      socket.to(roomId).emit('peer-audio-toggle', {
        socketId: socket.id,
        isMuted,
      });
    });

    // ──────────────────────────────────────────────────────
    // EVENT: toggle-video
    // Purpose: Tell the other person you turned camera on/off
    // ──────────────────────────────────────────────────────
    socket.on('toggle-video', ({ roomId, isCameraOff }) => {
      socket.to(roomId).emit('peer-video-toggle', {
        socketId: socket.id,
        isCameraOff,
      });
    });

    // ──────────────────────────────────────────────────────
    // EVENT: end-call
    // Purpose: One person ends the call — notify the other
    // ──────────────────────────────────────────────────────
    socket.on('end-call', ({ roomId }) => {
      console.log(`📵 Call ended in room: ${roomId}`);
      socket.to(roomId).emit('call-ended', {
        message: 'The other person has ended the call',
      });

      // Clean up room
      if (rooms[roomId]) {
        delete rooms[roomId];
      }
    });

    // ──────────────────────────────────────────────────────
    // EVENT: disconnect
    // Purpose: Auto-cleanup when user closes browser/tab
    // ──────────────────────────────────────────────────────
    socket.on('disconnect', () => {
      console.log(`🔌 Socket disconnected: ${socket.id}`);

      // Remove from onlineUsers
      for (const userId in onlineUsers) {
        if (onlineUsers[userId] === socket.id) {
          delete onlineUsers[userId];
          break;
        }
      }

      // Remove from all rooms and notify others
      for (const roomId in rooms) {
        const index = rooms[roomId].findIndex(u => u.socketId === socket.id);
        if (index !== -1) {
          const leavingUser = rooms[roomId][index];
          rooms[roomId].splice(index, 1);

          // Tell remaining participants this user left
          socket.to(roomId).emit('user-left', {
            socketId: socket.id,
            userId: leavingUser.userId,
            userName: leavingUser.userName,
          });

          // If room is now empty, delete it
          if (rooms[roomId].length === 0) {
            delete rooms[roomId];
          }

          break;
        }
      }
    });
  });

  console.log('✅ WebRTC Video Signaling server ready');
};

module.exports = { setupVideoSignaling };
