import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import { Server } from 'socket.io';
import http from 'http';
import handleSocketEvents from './socket.js';

// Load environment variables
dotenv.config();

// Import route files
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import jobRoutes from './routes/jobRoutes.js';
import bidRoutes from './routes/bidRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import clientVerificationRoutes from './routes/clientVerificationRoutes.js';
import uploadTestRoutes from './routes/uploadTestRoute.js';
import freelancerRoutes from './routes/freelancerRoutes.js';
import userProfileRoutes from './routes/userProfileRoutes.js';
import issueRoutes from './routes/issueRoutes.js';
import zoomRoutes from './routes/zoomRoutes.js';

// Initialize app
const app = express();
const PORT = process.env.PORT || 5000;
const server = http.createServer(app);


const corsOptions = {
  origin: 'http://localhost:5173', // or your frontend URL
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200
};


app.use(cors(corsOptions));
const io = new Server(server, {
  pingInterval: 10000,
  pingTimeout: 5000,
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// socket.io
handleSocketEvents(io);





// Connect to database
connectDB();

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));
app.use(cors());
app.use(morgan('dev'));

app.use('/api/zoom', zoomRoutes);
// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/client-verification', clientVerificationRoutes);
app.use('/api/bids', bidRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/upload', uploadTestRoutes);
app.use('/api/freelancer', freelancerRoutes);
app.use('/api/user-profile', userProfileRoutes);
app.use('/api/issues', issueRoutes);

// API documentation route
app.get('/api', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Welcome to Freelance Platform API',
    version: '1.0.0',
    documentation: {
      endpoints: [
        { path: '/api/auth', description: 'Authentication endpoints' },
        { path: '/api/users', description: 'User management endpoints' },
        { path: '/api/jobs', description: 'Job posting and management endpoints' },
        { path: '/api/bids', description: 'Bid submission and management endpoints' },
        { path: '/api/reviews', description: 'Review creation and management endpoints' },
        { path: '/api/messages', description: 'Messaging system endpoints' },
        { path: '/api/payments', description: 'Payment processing endpoints' },
        { path: '/api/categories', description: 'Job categories endpoints' },
        { path: '/api/admin', description: 'Admin only endpoints' }
      ]
    }
  });
});

// API health route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'API is running',
    time: new Date()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  res.status(statusCode).json({ 
    success: false, 
    message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Not Found - ${req.originalUrl}`
  });
});

// Start server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;