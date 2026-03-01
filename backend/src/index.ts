import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db';
import errorHandler from './middleware/errorHandler';

import userRoutes from './routes/userRoutes';
import listingRoutes from './routes/listingRoutes';
import notificationRoutes from './routes/notificationRoutes';
import marketPriceRoutes from './routes/marketPriceRoutes';
import ratingRoutes from './routes/ratingRoutes';
import weatherRoutes from './routes/weatherRoutes';
import aiRoutes from './routes/aiRoutes';
import hasatlinkPazarRoutes from './routes/hasatlinkPazarRoutes';
import contactRoutes from './routes/contactRoutes';
import adRoutes from './routes/adRoutes';
import adminRoutes from './routes/adminRoutes';

dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || [
    'https://hasatlink.com',
    'https://www.hasatlink.com',
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
  ],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

// Rate limiting (in-memory, endpoint-aware)
import { rateLimit } from './middleware/rateLimit';
app.use(rateLimit);

// Input sanitization (XSS & injection protection)
import { sanitize } from './middleware/sanitize';
app.use(sanitize);

// Security headers
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Connect to MongoDB
connectDB();

// Routes
app.use('/api', userRoutes);
app.use('/api', listingRoutes);
app.use('/api', notificationRoutes);
app.use('/api', marketPriceRoutes);
app.use('/api', ratingRoutes);
app.use('/api', weatherRoutes);
app.use('/api', aiRoutes);
app.use('/api', hasatlinkPazarRoutes);
app.use('/api', contactRoutes);
app.use('/api', adRoutes);
app.use('/api', adminRoutes);

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`HasatLink Backend running on port ${PORT}`));
