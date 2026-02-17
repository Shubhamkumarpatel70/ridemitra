const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || '*',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/rides', require('./routes/rides'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/driver', require('./routes/driver'));
app.use('/api/driver', require('./routes/driverRegistration'));
app.use('/api/coupons', require('./routes/coupons'));
app.use('/api/otp', require('./routes/otp'));

// Serve frontend static files (single deploy)
const frontendDist = path.join(__dirname, '../frontend/dist');
app.use(express.static(frontendDist));
// SPA fallback: non-API GET requests serve index.html
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'Not found' });
  }
  res.sendFile(path.join(frontendDist, 'index.html'));
});

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ride-mitra', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB Connected'))
.catch(err => console.error('MongoDB connection error:', err));

// Socket.io for WebRTC signaling
const activeRooms = new Map(); // roomId -> { adminId, driverId }

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Admin joins room
  socket.on('admin-join', ({ roomId, driverId }) => {
    socket.join(roomId);
    socket.roomId = roomId;
    socket.role = 'admin';
    socket.driverId = driverId;
    
    if (!activeRooms.has(roomId)) {
      activeRooms.set(roomId, { adminId: socket.id, driverId: null });
    } else {
      activeRooms.get(roomId).adminId = socket.id;
    }
    
    console.log(`Admin ${socket.id} joined room ${roomId}`);
    socket.to(roomId).emit('admin-joined');
  });

  // Driver joins room
  socket.on('driver-join', ({ roomId }) => {
    socket.join(roomId);
    socket.roomId = roomId;
    socket.role = 'driver';
    
    if (!activeRooms.has(roomId)) {
      activeRooms.set(roomId, { adminId: null, driverId: socket.id });
    } else {
      activeRooms.get(roomId).driverId = socket.id;
    }
    
    console.log(`Driver ${socket.id} joined room ${roomId}`);
    socket.to(roomId).emit('driver-joined');
  });

  // WebRTC signaling: offer
  socket.on('offer', ({ roomId, offer }) => {
    socket.to(roomId).emit('offer', { offer, from: socket.id });
  });

  // WebRTC signaling: answer
  socket.on('answer', ({ roomId, answer }) => {
    socket.to(roomId).emit('answer', { answer, from: socket.id });
  });

  // WebRTC signaling: ICE candidate
  socket.on('ice-candidate', ({ roomId, candidate }) => {
    socket.to(roomId).emit('ice-candidate', { candidate, from: socket.id });
  });

  // Driver camera status update
  socket.on('driver-camera-status', ({ roomId, cameraEnabled }) => {
    socket.to(roomId).emit('driver-camera-status', { cameraEnabled });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    if (socket.roomId) {
      const room = activeRooms.get(socket.roomId);
      if (room) {
        if (socket.role === 'admin') {
          room.adminId = null;
          socket.to(socket.roomId).emit('admin-left');
        } else if (socket.role === 'driver') {
          room.driverId = null;
          socket.to(socket.roomId).emit('driver-left');
        }
        
        // Clean up empty rooms
        if (!room.adminId && !room.driverId) {
          activeRooms.delete(socket.roomId);
        }
      }
    }
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Socket.io signaling server ready`);
});

