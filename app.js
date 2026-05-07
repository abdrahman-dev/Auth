import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import 'dotenv/config';
import connectDB from './model/mongodb.js';
import { globalLimiter } from './middleware/rateLimiter.js';

// Import router for authentication endpoints (login, register, logout, refresh)
import authRoutes from './routes/authRoutes.js'

import errorHandler from './middleware/errorHandler.js';


const app = express();
const port = process.env.PORT || 5000;

// Middleware setup for JSON parsing, CORS with frontend, and cookie handling
app.use(express.json());
app.use(cors({
  origin: 'http://localhost:5173', // or your frontend URL whatever it is 
  credentials: true               
}));
app.use(cookieParser());

// Register route handlers with rate limiting and API endpoints
app.use(globalLimiter);
app.use('/api/auth', authRoutes);

// Global error handling middleware
app.use(errorHandler);

// Establish connection to MongoDB database
connectDB();

// Start the Express server on specified port
app.listen(port, () => {
    console.log(`Running on PORT:${port}`);
});