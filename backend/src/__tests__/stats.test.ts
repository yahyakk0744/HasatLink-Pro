import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from './app';
import User from '../models/User';
import Listing from '../models/Listing';
import AIDiagnosis from '../models/AIDiagnosis';

// Mock firebase-admin
vi.mock('../config/firebase', () => ({
  default: {
    auth: () => ({
      verifyIdToken: vi.fn(),
    }),
  },
}));

// Mock socket
vi.mock('../socket', () => ({
  getIO: () => ({
    to: () => ({ emit: vi.fn() }),
  }),
  sendSocketNotification: vi.fn(),
  initSocket: vi.fn(),
}));

// Mock push notifications
vi.mock('../utils/pushNotification', () => ({
  sendPushToUser: vi.fn(),
}));

// Mock rate limiting to avoid throttling in tests
vi.mock('../middleware/rateLimit', () => ({
  rateLimit: (_req: any, _res: any, next: any) => next(),
  authRateLimit: (_req: any, _res: any, next: any) => next(),
}));

describe('Platform Stats Endpoint', () => {
  let authToken: string;

  beforeEach(async () => {
    // Create a test user
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Stats Test User',
        email: 'stats@example.com',
        password: 'password123',
        location: 'Ceyhan, Adana',
      });
    authToken = res.body.token;

    // Create some listings
    await request(app)
      .post('/api/listings')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'Domates',
        type: 'pazar',
        price: 10,
        location: 'Ceyhan, Adana',
      });

    await request(app)
      .post('/api/listings')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'Kamyon',
        type: 'lojistik',
        price: 5000,
        location: 'Istanbul',
      });

    // Create an AI diagnosis record directly
    await AIDiagnosis.create({
      userId: 'stats_test_user',
      disease: 'Mildew',
      confidence: 0.95,
      treatment: 'Fungicide spray',
    });
  });

  describe('GET /api/stats/platform', () => {
    it('should return correct stats shape', async () => {
      const res = await request(app).get('/api/stats/platform');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('activeListings');
      expect(res.body).toHaveProperty('registeredUsers');
      expect(res.body).toHaveProperty('cities');
      expect(res.body).toHaveProperty('aiDiagnoses');
      expect(res.body).toHaveProperty('categoryCounts');
    });

    it('should return correct counts', async () => {
      const res = await request(app).get('/api/stats/platform');

      expect(res.status).toBe(200);
      // We created 1 user and 2 active listings
      expect(res.body.registeredUsers).toBe(1);
      expect(res.body.activeListings).toBe(2);
      expect(res.body.aiDiagnoses).toBe(1);
    });

    it('should return category counts', async () => {
      const res = await request(app).get('/api/stats/platform');

      expect(res.status).toBe(200);
      expect(res.body.categoryCounts).toHaveProperty('pazar', 1);
      expect(res.body.categoryCounts).toHaveProperty('lojistik', 1);
    });

    it('should return at least 1 city', async () => {
      const res = await request(app).get('/api/stats/platform');

      expect(res.status).toBe(200);
      expect(res.body.cities).toBeGreaterThanOrEqual(1);
    });
  });

  describe('GET /api/stats/market-analytics', () => {
    it('should return analytics for a given type', async () => {
      const res = await request(app).get('/api/stats/market-analytics?type=pazar');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('avgPrice');
      expect(res.body).toHaveProperty('minPrice');
      expect(res.body).toHaveProperty('maxPrice');
      expect(res.body).toHaveProperty('count');
      expect(res.body).toHaveProperty('trend');
      expect(res.body.count).toBe(1);
      expect(res.body.avgPrice).toBe(10);
    });

    it('should require type parameter', async () => {
      const res = await request(app).get('/api/stats/market-analytics');

      expect(res.status).toBe(400);
    });
  });
});
