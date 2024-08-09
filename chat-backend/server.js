const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const Message = require('./models/Message');

const app = express();
app.use(cors({
    origin: 'http://localhost:3000', // Your frontend URL
    methods: 'GET,POST',
    allowedHeaders: 'Content-Type,Authorization',
  }));
app.use(bodyParser.json());

mongoose.connect('mongodb://localhost/chat-app', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const JWT_SECRET = 'your_jwt_secret_key'; // Use a secure key in production

// Registration endpoint
app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  try {
    const newUser = new User({ username, password });
    await newUser.save();
    res.json({ success: true });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

// Login endpoint
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (user && await user.comparePassword(password)) {
      const token = jwt.sign({ username: user.username }, JWT_SECRET, { expiresIn: '1h' });
      res.json({ success: true, token });
    } else {
      res.json({ success: false });
    }
  });
  

// Middleware to verify JWT
// server.js
const authenticateJWT = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    console.log('Token:', token); // Log token for debugging
    if (!token) return res.sendStatus(401);
  
    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (err) {
        console.error('JWT verification failed:', err); // Log verification error
        return res.sendStatus(403);
      }
      req.user = user;
      next();
    });
  };
  

// Get messages endpoint
// Get messages endpoint
app.get('/messages', authenticateJWT, async (req, res) => {
    try {
      const messages = await Message.find().sort({ timestamp: 1 });
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  


// Post message endpoint
app.post('/messages', authenticateJWT, async (req, res) => {
    const { user, text } = req.body;
  
    try {
      const newMessage = new Message({ user, text });
      await newMessage.save();
      res.json(newMessage);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));