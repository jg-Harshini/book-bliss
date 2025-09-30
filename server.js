const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const http = require('http');
const path = require('path');

const authRoutes = require('./routes/auth');
const bookRoutes = require('./routes/Admin');
const authorRoutes = require('./routes/Author');
const communityRoutes = require("./routes/community");
const chatbotRoutes = require('./routes/chatbot');
const openLibraryRoute = require('./routes/openLibrary');
const userRoutes = require('./routes/users');

// Models used by socket events
const User = require('./models/User');
const Community = require('./models/Community');
const Message = require('./models/Message');

const app = express();
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server, { cors: { origin: '*' } });

// Middleware
app.use(bodyParser.json());
app.use(cors());
app.use(express.static(path.join(__dirname, 'public'))); // Serve frontend files


// MongoDB connection
mongoose.connect('mongodb+srv://thorhammer78165:fcHevi0MBKJ5l83P@cluster.a0zl0xi.mongodb.net/?retryWrites=true&w=majority&appName=Cluster', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/authors', authorRoutes);
app.use("/api/community", communityRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/open-library', openLibraryRoute);
app.use('/api/users', userRoutes);


app.get('/', (req, res) => {
  res.send('Login app is running...');
});

// Socket.IO - real-time community chat
io.on('connection', (socket) => {
  // client requests to join a community room for live updates
  socket.on('joinCommunity', ({ communityId }) => {
    if (!communityId) return;
    const room = `community:${communityId}`;
    socket.join(room);
  });

  // client sends a message
  socket.on('sendMessage', async ({ communityId, userId, text }, ack) => {
    try {
      if (!communityId || !userId || !text) {
        return ack && ack({ error: 'communityId, userId and text are required' });
      }
      const [user, community] = await Promise.all([
        User.findById(userId),
        Community.findById(communityId)
      ]);
      if (!user || !community) return ack && ack({ error: 'User or Community not found' });
      const isMember = (user.joinedCommunities || []).some((c) => String(c) === String(community._id));
      if (!isMember) return ack && ack({ error: 'Join the community to send messages' });

      const msg = await new Message({ community: community._id, sender: user._id, text }).save();
      const populated = await msg.populate('sender', 'username profile.displayName');
      const room = `community:${communityId}`;
      io.to(room).emit('newMessage', populated);
      return ack && ack({ ok: true });
    } catch (err) {
      console.error('socket sendMessage error', err);
      return ack && ack({ error: 'Error sending message' });
    }
  });
});

// Start server
const PORT = 3000;
server.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
