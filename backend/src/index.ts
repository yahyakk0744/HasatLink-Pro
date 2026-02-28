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

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

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

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`HasatLink Backend running on port ${PORT}`));
