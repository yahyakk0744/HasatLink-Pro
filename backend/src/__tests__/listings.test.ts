import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from './app';
import User from '../models/User';
import Listing from '../models/Listing';

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

describe('Listings Endpoints', () => {
  let authToken: string;
  let testUserId: string;

  beforeEach(async () => {
    // Create a test user and get auth token
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Ahmet Kaya',
        email: 'listingtest@example.com',
        password: 'password123',
      });

    authToken = res.body.token;
    testUserId = res.body.user.userId;
  });

  const sampleListing = {
    title: 'Taze Domates',
    description: 'Organik domates, 500kg stok',
    type: 'pazar',
    price: 25,
    amount: 500,
    unit: 'kg',
    location: 'Ceyhan, Adana',
    phone: '05551234567',
  };

  describe('POST /api/listings', () => {
    it('should create a new listing', async () => {
      const res = await request(app)
        .post('/api/listings')
        .set('Authorization', `Bearer ${authToken}`)
        .send(sampleListing);

      expect(res.status).toBe(201);
      expect(res.body.title).toBe(sampleListing.title);
      expect(res.body.type).toBe('pazar');
      expect(res.body.price).toBe(25);
      expect(res.body.userId).toBe(testUserId);
    });

    it('should reject listing creation without auth', async () => {
      const res = await request(app)
        .post('/api/listings')
        .send(sampleListing);

      expect(res.status).toBe(401);
    });

    it('should reject listing with profane title', async () => {
      const res = await request(app)
        .post('/api/listings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ ...sampleListing, title: 'siktir git domates' });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Uygunsuz');
    });
  });

  describe('GET /api/listings', () => {
    it('should return paginated listings', async () => {
      // Create a listing first
      await request(app)
        .post('/api/listings')
        .set('Authorization', `Bearer ${authToken}`)
        .send(sampleListing);

      const res = await request(app).get('/api/listings');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('listings');
      expect(res.body).toHaveProperty('total');
      expect(res.body).toHaveProperty('page');
      expect(res.body).toHaveProperty('totalPages');
      expect(res.body.listings.length).toBeGreaterThanOrEqual(1);
    });

    it('should filter listings by type', async () => {
      // Create a pazar listing
      await request(app)
        .post('/api/listings')
        .set('Authorization', `Bearer ${authToken}`)
        .send(sampleListing);

      // Create a lojistik listing
      await request(app)
        .post('/api/listings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ ...sampleListing, title: 'Kamyon Kiralama', type: 'lojistik' });

      const res = await request(app).get('/api/listings?type=pazar');

      expect(res.status).toBe(200);
      expect(res.body.listings.every((l: any) => l.type === 'pazar')).toBe(true);
    });

    it('should search listings by title', async () => {
      await request(app)
        .post('/api/listings')
        .set('Authorization', `Bearer ${authToken}`)
        .send(sampleListing);

      const res = await request(app).get('/api/listings?search=Domates');

      expect(res.status).toBe(200);
      expect(res.body.listings.length).toBeGreaterThanOrEqual(1);
      expect(res.body.listings[0].title).toContain('Domates');
    });
  });

  describe('GET /api/listings/:id', () => {
    it('should return listing detail with seller info', async () => {
      const createRes = await request(app)
        .post('/api/listings')
        .set('Authorization', `Bearer ${authToken}`)
        .send(sampleListing);

      const listingId = createRes.body._id;

      const res = await request(app).get(`/api/listings/${listingId}`);

      expect(res.status).toBe(200);
      expect(res.body.title).toBe(sampleListing.title);
      expect(res.body).toHaveProperty('sellerName');
      expect(res.body).toHaveProperty('sellerRating');
    });

    it('should return 404 for non-existent listing', async () => {
      const res = await request(app).get('/api/listings/000000000000000000000000');

      expect(res.status).toBe(404);
    });
  });

  describe('PUT /api/listings/:id', () => {
    it('should update own listing', async () => {
      const createRes = await request(app)
        .post('/api/listings')
        .set('Authorization', `Bearer ${authToken}`)
        .send(sampleListing);

      const listingId = createRes.body._id;

      const res = await request(app)
        .put(`/api/listings/${listingId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ price: 30, title: 'Taze Domates Guncel' });

      expect(res.status).toBe(200);
      expect(res.body.price).toBe(30);
    });

    it('should reject update from different user', async () => {
      // Create listing with first user
      const createRes = await request(app)
        .post('/api/listings')
        .set('Authorization', `Bearer ${authToken}`)
        .send(sampleListing);

      const listingId = createRes.body._id;

      // Register a second user
      const secondUserRes = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Other User',
          email: 'other@example.com',
          password: 'password123',
        });

      const otherToken = secondUserRes.body.token;

      const res = await request(app)
        .put(`/api/listings/${listingId}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send({ price: 999 });

      expect(res.status).toBe(403);
    });
  });

  describe('DELETE /api/listings/:id', () => {
    it('should delete own listing', async () => {
      const createRes = await request(app)
        .post('/api/listings')
        .set('Authorization', `Bearer ${authToken}`)
        .send(sampleListing);

      const listingId = createRes.body._id;

      const res = await request(app)
        .delete(`/api/listings/${listingId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('İlan silindi');

      // Verify it's gone
      const getRes = await request(app).get(`/api/listings/${listingId}`);
      expect(getRes.status).toBe(404);
    });

    it('should reject deletion from different user', async () => {
      const createRes = await request(app)
        .post('/api/listings')
        .set('Authorization', `Bearer ${authToken}`)
        .send(sampleListing);

      const listingId = createRes.body._id;

      // Register a second user
      const secondUserRes = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Other User',
          email: 'other2@example.com',
          password: 'password123',
        });

      const res = await request(app)
        .delete(`/api/listings/${listingId}`)
        .set('Authorization', `Bearer ${secondUserRes.body.token}`);

      expect(res.status).toBe(403);
    });
  });
});
