const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app); // Create HTTP server
const io = new Server(server, {
  cors: {
    origin: "*", // Update this in production
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Root route
app.get('/', (req, res) => {
  res.send('✅ Node.js + MongoDB backend is live!');
});

// MongoDB connection
const mongoURI = 'mongodb+srv://ESP:KICK1234@cluster0.ft1i1q0.mongodb.net/esp-data?retryWrites=true&w=majority&appName=Cluster0';
mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ MongoDB connected'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// Schema and model
const forceSchema = new mongoose.Schema({
  force: Number,
  timestamp: { type: Date, default: Date.now }
});
const ForceData = mongoose.model('ForceData', forceSchema);

// WebSocket connection
io.on('connection', (socket) => {
  console.log('📡 Client connected');

  socket.on('disconnect', () => {
    console.log('❌ Client disconnected');
  });
});

// POST endpoint - updated to emit via Socket.IO
app.post('/force', async (req, res) => {
  console.log("📥 Received data from ESP32:", JSON.stringify(req.body));

  const { force } = req.body;
  if (typeof force !== 'number' || force <= 0) {
    return res.status(400).json({ error: 'Invalid force value' });
  }

  try {
    const entry = new ForceData({ force });
    await entry.save();

    // Emit the new data to all connected clients
    io.emit('newForceData', {
      time: entry.timestamp.getTime(),
      force: entry.force
    });

    res.status(201).json({ message: 'Force data saved', data: entry });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET endpoint
app.get('/force', async (req, res) => {
  try {
    const data = await ForceData.find().sort({ timestamp: -1 });
    const formatted = data.map(entry => ({
      time: entry.timestamp.getTime(),
      force: entry.force
    }));
    res.json(formatted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not fetch data' });
  }
});

// Start server with WebSocket support
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
