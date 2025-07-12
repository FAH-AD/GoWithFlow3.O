import dotenv from 'dotenv';
import jwt from 'jsonwebtoken'; // You missed this import earlier

dotenv.config(); // Load environment variables

const users = new Map();

const handleSocketEvents = (io) => {
  global.io = io; // Optional, if you want io globally accessible

  // Socket.IO middleware: JWT authentication
  io.use((socket, next) => {
    const token = socket.handshake.query.token;

    if (!token) {
      return next(new Error("Authentication error: Token not provided"));
    }

    console.log("JWT token received:", token);

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET); // Verify token
      socket.user = decoded; // Attach decoded user to socket
      next();
    } catch (error) {
      console.error("JWT verification failed:", error.message);
      return next(new Error("Authentication error: Invalid token"));
    }
  });

  // Now, after authentication -> setup event listeners
  io.on('connection', (socket) => {
    console.log('A user connected:', socket.user?.id);

    // Store user with their socket id
    users.set(socket.user.id, socket.id);
    console.log(users,'users are here')

    // Join conversation room
    socket.on('join', (conversationId) => {
      console.log(`User ${socket.user.id} joining conversation ${conversationId}`);
      socket.join(conversationId);
    });

    // Leave conversation room
    socket.on('leave', (conversationId) => {
      console.log(`User ${socket.user.id} leaving conversation ${conversationId}`);
      socket.leave(conversationId);
    });

    // Send a message to a conversation
    socket.on('send-message', (message) => {
      const receiverSocketId = users.get(message.receiverId)
      console.log("Receiver socket ID:", receiverSocketId);
      console.log("receiver Id",message.receiverId)
      console.log("sender Id", message.message.sender._id)
      socket.to(receiverSocketId).emit("receive-message", message.message)
      socket.to(message.conversationId).emit('new_message', message.message); // EMIT matching frontend
    });
    

    // Listen for received message (if needed separately)
    socket.on('receive-message', (message) => {
      console.log("Message received on server:", message);
    });

    // Typing indicators
    socket.on('typing', (conversationId) => {
      socket.to(conversationId).emit('typing');
    });

    socket.on('stopTyping', (conversationId) => {
      socket.to(conversationId).emit('stopTyping');
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.user?.id);
      users.delete(socket.user.id); // Remove user from active users map
    });
  });
};

export default handleSocketEvents;
