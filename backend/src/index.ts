import dotenv from 'dotenv';
dotenv.config();

import { initSentry, Sentry } from './config/sentry';
initSentry();

import express from 'express';
import { createServer } from 'http';
import path from 'path';
import cors from 'cors';
import compression from 'compression';
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
import blogRoutes from './routes/blogRoutes';
import dealerRoutes from './routes/dealerRoutes';
import shareRoutes from './routes/shareRoutes';
import priceAlertRoutes from './routes/priceAlertRoutes';
import uploadRoutes from './routes/uploadRoutes';
import offerRoutes from './routes/offerRoutes';
import satelliteRoutes from './routes/satelliteRoutes';
import settingsRoutes from './routes/settingsRoutes';
import forumRoutes from './routes/forumRoutes';
import jobRoutes from './routes/jobRoutes';
import referralRoutes from './routes/referralRoutes';
import weatherAlertRoutes from './routes/weatherAlertRoutes';
import harvestCalendarRoutes from './routes/harvestCalendarRoutes';
import logisticsRoutes from './routes/logisticsRoutes';
import sponsoredContentRoutes from './routes/sponsoredContentRoutes';
import { expireOutdatedDealers } from './controllers/dealerController';
import { processExpiredDeletions } from './controllers/userController';

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
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Rate limiting (in-memory, endpoint-aware)
import { rateLimit } from './middleware/rateLimit';
app.use(rateLimit);

// Input sanitization (XSS & injection protection)
import { sanitize } from './middleware/sanitize';
app.use(sanitize);

// Track user activity (lastActiveAt)
import trackActivity from './middleware/trackActivity';
app.use(trackActivity);

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
app.use('/api', blogRoutes);
app.use('/api', dealerRoutes);
app.use('/api', shareRoutes);
app.use('/api', priceAlertRoutes);
app.use('/api', uploadRoutes);
app.use('/api', offerRoutes);
app.use('/api', satelliteRoutes);
app.use('/api', settingsRoutes);
app.use('/api', forumRoutes);
app.use('/api', jobRoutes);
app.use('/api', referralRoutes);
app.use('/api', weatherAlertRoutes);
app.use('/api', harvestCalendarRoutes);
app.use('/api', logisticsRoutes);
app.use('/api', sponsoredContentRoutes);

// VAPID public key endpoint
app.get('/api/push/vapid-key', (_req, res) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY || 'BBQR8Itsvely1iLKMQrjuNbs3pCFq_m1x9KF3vrODBzLaPpSAd7cyOSJ_RibGPC1R6PKtBTGIWUX06HwgnlVbJA' });
});

// Sentry error handler (must be before custom errorHandler)
Sentry.setupExpressErrorHandler(app);

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`HasatLink Backend running on port ${PORT}`);

  // Auto-expire dealers every hour
  setInterval(async () => {
    const count = await expireOutdatedDealers();
    if (count > 0) console.log(`[CRON] ${count} bayi süresi dolduğu için devre dışı bırakıldı`);
  }, 60 * 60 * 1000);

  // Process expired account deletions every 6 hours
  setInterval(async () => {
    const count = await processExpiredDeletions();
    if (count > 0) console.log(`[CRON] ${count} hesap 30 günlük süre dolduğu için silindi`);
  }, 6 * 60 * 60 * 1000);

});
