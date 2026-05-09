const express = require('express');
const http = require('http');
const cors = require('cors');
const dotenv = require('dotenv');
const { Server } = require('socket.io');
const connectDB = require('./config/db');
const { startReminderCron } = require('./utils/reminderCron');
const { setupVideoSignaling } = require('./socket/videoSignaling');

dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Create HTTP server (required for Socket.IO)
const server = http.createServer(app);

// Attach Socket.IO to the HTTP server
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

// Setup WebRTC video signaling events
setupVideoSignaling(io);

// ⚠️ Stripe Webhook must be registered BEFORE express.json()
// Stripe requires raw (unparsed) request body to verify signature
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));

// Middleware
app.use(cors());
app.use(express.json());

// Test Route
app.get('/', (req, res) => {
  res.json({ message: '🏥 Healthcare API is running!' });
});

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/patients', require('./routes/patientRoutes'));
app.use('/api/doctors', require('./routes/doctorRoutes'));
app.use('/api/appointments', require('./routes/appointmentRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));

const PORT = process.env.PORT || 5000;

// Use server.listen (not app.listen) because Socket.IO needs the http server
server.listen(PORT, () => {
  console.log(`✅ Server + Socket.IO running on http://localhost:${PORT}`);
  startReminderCron();
});
