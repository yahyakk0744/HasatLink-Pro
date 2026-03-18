/**
 * Creates a minimal Express app for testing, without starting the server,
 * without connecting to MongoDB (handled by setup.ts), and without Socket.IO.
 */
import express from 'express';
import cors from 'cors';
import userRoutes from '../routes/userRoutes';
import listingRoutes from '../routes/listingRoutes';

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Mount routes the same way as the real app
app.use('/api', userRoutes);
app.use('/api', listingRoutes);

export default app;
