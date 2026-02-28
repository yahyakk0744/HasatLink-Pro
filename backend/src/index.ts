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

dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

// Rate limiting (in-memory)
const rateMap = new Map<string, { count: number; reset: number }>();
app.use((req, res, next) => {
  const ip = req.ip || 'unknown';
  const now = Date.now();
  const entry = rateMap.get(ip);
  if (!entry || now > entry.reset) {
    rateMap.set(ip, { count: 1, reset: now + 60_000 });
    return next();
  }
  entry.count++;
  if (entry.count > 100) {
    res.status(429).json({ message: 'Çok fazla istek, lütfen bekleyin' });
    return;
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

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`HasatLink Backend running on port ${PORT}`));
