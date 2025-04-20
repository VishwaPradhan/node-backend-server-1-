const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Root route (🚀 added this part)
app.get('/', (req, res) => {
  res.send('✅ Node.js + MongoDB backend is live!');
});

// Hardcoded MongoDB Atlas URI
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

// POST endpoint
app.post('/force', async (req, res) => {
  console.log("📥 Received data from ESP32:", JSON.stringify(req.body));

  const { force } = req.body;
  if (typeof force !== 'number' || force <= 0) {
    return res.status(400).json({ error: 'Invalid force value' });
  }

  try {
    const entry = new ForceData({ force });
    await entry.save();
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

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server is running at http://localhost:${PORT}`);
});
