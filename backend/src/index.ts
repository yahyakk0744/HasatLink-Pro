import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import compression from 'compression';
import dotenv from 'dotenv';
import connectDB from './config/db';
import errorHandler from './middleware/errorHandler';
import { initSocket } from './socket';

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
import commentRoutes from './routes/commentRoutes';

dotenv.config();

const app = express();
const httpServer = createServer(app);

// Initialize Socket.IO
initSocket(httpServer);

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
app.use(compression());
app.use(express.json({ limit: '10mb' }));

// Rate limiting (in-memory, endpoint-aware)
import { rateLimit } from './middleware/rateLimit';
app.use(rateLimit);

// Input sanitization (XSS & injection protection)
import { sanitize } from './middleware/sanitize';
app.use(sanitize);

// Security headers + cache control for public GET endpoints
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  // Cache public GET responses for 5 minutes
  if (req.method === 'GET' && !req.headers.authorization) {
    res.setHeader('Cache-Control', 'public, max-age=300');
  } else {
    res.setHeader('Cache-Control', 'no-store');
  }
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
app.use('/api', commentRoutes);

// VAPID public key endpoint
app.get('/api/push/vapid-key', (_req, res) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY || 'BBQR8Itsvely1iLKMQrjuNbs3pCFq_m1x9KF3vrODBzLaPpSAd7cyOSJ_RibGPC1R6PKtBTGIWUX06HwgnlVbJA' });
});

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => console.log(`HasatLink Backend running on port ${PORT}`));
