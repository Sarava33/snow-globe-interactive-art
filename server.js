// WebSocket Server for Snow Globe Interactive Art
// Run with: node server.js

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3000;

// Enable CORS for all routes
app.use(cors());
app.use(express.json());

// Serve static files (for local testing)
app.use(express.static(path.join(__dirname, 'public')));

// Store connected clients
const connectedUsers = new Map();
const displays = new Map();

// Routes
app.get('/', (req, res) => {
  res.send(`
    <h1>Snow Globe Server Running</h1>
    <p>Connected Controllers (phones): ${connectedUsers.size}</p>
    <p>Connected Displays (screens): ${displays.size}</p>
    <p>Server Time: ${new Date().toISOString()}</p>
    <br>
    <a href="/controller.html">Phone Controller</a><br>
    <a href="/display.html">Main Display</a><br>
    <br>
    <h3>Debug Info:</h3>
    <p>Controllers: ${Array.from(connectedUsers.keys()).join(', ') || 'None'}</p>
    <p>Displays: ${Array.from(displays.keys()).join(', ') || 'None'}</p>
  `);
});

app.get('/debug', (req, res) => {
  res.json({
    controllers: Array.from(connectedUsers.entries()).map(([id, user]) => ({
      id,
      type: user.type,
      connectedAt: user.connectedAt,
      lastShake: user.lastShake?.timestamp || 'None'
    })),
    displays: Array.from(displays.entries()).map(([id, display]) => ({
      id,
      type: display.type,
      connectedAt: display.connectedAt
    })),
    totals: {
      controllers: connectedUsers.size,
      displays: displays.size
    }
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    connectedUsers: connectedUsers.size,
    connectedDisplays: displays.size,
    timestamp: new Date().toISOString()
  });
});

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);
  console.log(`🔍 Connection details:`);
  console.log(`   - Remote Address: ${socket.handshake.address}`);
  console.log(`   - User Agent: ${socket.handshake.headers['user-agent'] || 'Not provided'}`);
  console.log(`   - Referer: ${socket.handshake.headers.referer || 'Not provided'}`);
  console.log(`   - Time: ${new Date().toISOString()}`);
  
  // Set a timeout for registration - if no registration in 5 seconds, log warning
  const registrationTimeout = setTimeout(() => {
    console.log(`⚠️  Client ${socket.id} connected but never registered! Possible phantom connection.`);
    console.log(`⚠️  User Agent: ${socket.handshake.headers['user-agent']}`);
    console.log(`⚠️  Remote Address: ${socket.handshake.address}`);
  }, 5000);
  
  socket.on('register', (data) => {
    clearTimeout(registrationTimeout); // Clear the warning timeout
    // ... rest of registration logic
  });
  
  // Handle client type registration
  socket.on('register', (data) => {
    const { type, userAgent } = data;
    
    console.log(`📝 Registration attempt: ${socket.id} wants to be "${type}"`);
    console.log(`🔍 User Agent: ${userAgent || 'Not provided'}`);
    console.log(`🌐 Remote Address: ${socket.handshake.address}`);
    console.log(`🔗 Headers:`, socket.handshake.headers);
    
    if (type === 'controller') {
      connectedUsers.set(socket.id, {
        id: socket.id,
        type: 'controller',
        userAgent: userAgent || 'Unknown',
        connectedAt: new Date(),
        lastShake: null,
        remoteAddress: socket.handshake.address
      });
      
      console.log(`📱 Controller registered: ${socket.id} (Total controllers: ${connectedUsers.size})`);
      console.log(`📱 Controller details:`, {
        userAgent: userAgent || 'Unknown',
        remoteAddress: socket.handshake.address,
        timestamp: new Date().toISOString()
      });
      
      // Notify displays about new controller (not display connections)
      displays.forEach((display, displayId) => {
        io.to(displayId).emit('userConnected', {
          userId: socket.id,
          totalUsers: connectedUsers.size // Only count controllers as "users"
        });
      });
      
      // Send welcome message to controller
      socket.emit('connected', {
        message: 'Connected to Snow Globe!',
        userId: socket.id,
        totalUsers: connectedUsers.size // Only count controllers
      });
      
    } else if (type === 'display') {
      displays.set(socket.id, {
        id: socket.id,
        type: 'display',
        connectedAt: new Date(),
        remoteAddress: socket.handshake.address
      });
      
      console.log(`🖥️ Display registered: ${socket.id} (Total displays: ${displays.size})`);
      
      // Send current controller count to display (not including displays)
      socket.emit('userCount', {
        count: connectedUsers.size, // Only controllers
        users: Array.from(connectedUsers.values())
      });
      
    } else {
      console.log(`❌ Unknown registration type: "${type}" from ${socket.id}`);
      socket.emit('error', { message: `Unknown registration type: ${type}` });
    }
  });
  
  // Handle shake events from controllers
  socket.on('shake', (data) => {
    const user = connectedUsers.get(socket.id);
    if (!user) {
      socket.emit('error', { message: 'Not registered as controller' });
      return;
    }
    
    // Validate shake data
    if (!data.timestamp || !data.intensity || !data.acceleration) {
      console.log(`❌ Invalid shake data from ${socket.id}:`, data);
      socket.emit('error', { message: 'Invalid shake data' });
      return;
    }
    
    // Prevent spam shakes (rate limiting)
    const now = new Date();
    const lastShakeTime = user.lastShake ? new Date(user.lastShake.timestamp) : new Date(0);
    const timeSinceLastShake = now - lastShakeTime;
    
    if (timeSinceLastShake < 1000) { // Minimum 1 second between shakes
      console.log(`⏰ Shake ignored from ${socket.id}: too frequent (${timeSinceLastShake}ms) - Rate limited`);
      return;
    }
    
    const shakeData = {
      userId: socket.id,
      intensity: Math.min(Math.max(parseInt(data.intensity) || 1, 1), 10), // Clamp 1-10
      acceleration: parseFloat(data.acceleration) || 0,
      timestamp: data.timestamp,
      x: parseFloat(data.x) || 0,
      y: parseFloat(data.y) || 0,
      z: parseFloat(data.z) || 0,
      shakeNumber: data.shakeNumber || 0
    };
    
    // Update user's last shake
    user.lastShake = shakeData;
    
    console.log(`✅ VALID SHAKE #${shakeData.shakeNumber} from ${socket.id}: intensity ${shakeData.intensity}, acceleration ${shakeData.acceleration.toFixed(2)} (${displays.size} displays will receive)`);
    
    // Broadcast to all displays
    let displaysNotified = 0;
    displays.forEach((display, displayId) => {
      io.to(displayId).emit('shake', shakeData);
      displaysNotified++;
    });
    
    console.log(`📡 Shake broadcasted to ${displaysNotified} displays`);
    
    // Send confirmation back to controller
    socket.emit('shakeConfirmed', {
      intensity: shakeData.intensity,
      timestamp: shakeData.timestamp,
      acceleration: shakeData.acceleration,
      shakeNumber: shakeData.shakeNumber
    });
  });
  
  // Handle motion data (continuous stream)
  socket.on('motion', (data) => {
    const user = connectedUsers.get(socket.id);
    if (!user) return;
    
    // Only forward significant motion changes to reduce bandwidth
    // and prevent unnecessary processing
    const acceleration = parseFloat(data.totalAcceleration) || 0;
    if (acceleration > 15) { // Only forward stronger movements
      displays.forEach((display, displayId) => {
        io.to(displayId).emit('motion', {
          userId: socket.id,
          totalAcceleration: acceleration,
          x: parseFloat(data.x) || 0,
          y: parseFloat(data.y) || 0,
          z: parseFloat(data.z) || 0,
          timestamp: data.timestamp || new Date().toISOString()
        });
      });
    }
  });
  
  // Handle ping for connection health
  socket.on('ping', () => {
    socket.emit('pong', { timestamp: new Date().toISOString() });
  });
  
  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);
    
    // Check what type of client this was
    const wasUser = connectedUsers.has(socket.id);
    const wasDisplay = displays.has(socket.id);
    
    if (wasUser) {
      console.log(`📱 Controller disconnected: ${socket.id}`);
    }
    if (wasDisplay) {
      console.log(`🖥️ Display disconnected: ${socket.id}`);
    }
    
    // Remove from collections
    connectedUsers.delete(socket.id);
    displays.delete(socket.id);
    
    console.log(`📊 After disconnect: ${connectedUsers.size} controllers, ${displays.size} displays`);
    
    // Notify displays if a controller disconnected (not if display disconnected)
    if (wasUser) {
      displays.forEach((display, displayId) => {
        io.to(displayId).emit('userDisconnected', {
          userId: socket.id,
          totalUsers: connectedUsers.size // Only count controllers
        });
      });
    }
  });
  
  // Handle errors
  socket.on('error', (error) => {
    console.error(`Socket error for ${socket.id}:`, error);
  });
});

// Periodic cleanup and health broadcast
setInterval(() => {
  const stats = {
    connectedControllers: connectedUsers.size,
    connectedDisplays: displays.size,
    timestamp: new Date().toISOString()
  };
  
  // Broadcast stats to displays
  displays.forEach((display, displayId) => {
    io.to(displayId).emit('stats', stats);
  });
  
  console.log(`Server Stats: ${stats.connectedControllers} controllers, ${stats.connectedDisplays} displays`);
}, 30000); // Every 30 seconds

// Error handling
server.on('error', (error) => {
  console.error('Server error:', error);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`Snow Globe Server running on port ${PORT}`);
  console.log(`Controller URL: http://localhost:${PORT}/controller`);
  console.log(`Display URL: http://localhost:${PORT}/display`);
});

module.exports = { app, server, io };