import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from './app';
import User from '../models/User';

// Mock firebase-admin to avoid initialization errors in tests
vi.mock('../config/firebase', () => ({
  default: {
    auth: () => ({
      verifyIdToken: vi.fn(),
    }),
  },
}));

// Mock socket to avoid initialization errors
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

describe('Auth Endpoints', () => {
  const testUser = {
    name: 'Test User',
    email: 'test@example.com',
    password: 'password123',
  };

  describe('POST /api/auth/register', () => {
    it('should register a new user and return token', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(testUser);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('user');
      expect(res.body.user.email).toBe(testUser.email);
      expect(res.body.user.name).toBe(testUser.name);
      expect(res.body.user).not.toHaveProperty('password');
    });

    it('should reject duplicate email registration', async () => {
      // First registration
      await request(app)
        .post('/api/auth/register')
        .send(testUser);

      // Duplicate registration
      const res = await request(app)
        .post('/api/auth/register')
        .send(testUser);

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Bu email zaten kayıtlı');
    });

    it('should reject registration with profane name', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'orospu test',
          email: 'profane@example.com',
          password: 'password123',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Uygunsuz');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with correct credentials', async () => {
      // First register
      await request(app)
        .post('/api/auth/register')
        .send(testUser);

      // Then login
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: testUser.email, password: testUser.password });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user.email).toBe(testUser.email);
    });

    it('should reject wrong password', async () => {
      // Register first
      await request(app)
        .post('/api/auth/register')
        .send(testUser);

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: testUser.email, password: 'wrongpassword' });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Email veya şifre hatalı');
    });

    it('should reject non-existent email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'nonexistent@example.com', password: 'password123' });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Email veya şifre hatalı');
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return current user with valid token', async () => {
      // Register and get token
      const registerRes = await request(app)
        .post('/api/auth/register')
        .send(testUser);

      const token = registerRes.body.token;

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.email).toBe(testUser.email);
      expect(res.body.name).toBe(testUser.name);
      expect(res.body).not.toHaveProperty('password');
    });

    it('should reject request without token', async () => {
      const res = await request(app).get('/api/auth/me');

      expect(res.status).toBe(401);
    });

    it('should reject request with invalid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalidtoken123');

      expect(res.status).toBe(401);
    });

    it('should return 404 for non-existent user in token', async () => {
      const fakeToken = jwt.sign({ userId: 'non_existent_user' }, process.env.JWT_SECRET!);

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${fakeToken}`);

      expect(res.status).toBe(404);
    });
  });
});
