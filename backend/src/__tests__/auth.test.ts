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

// Mock jose so /api/auth/apple native path can be exercised without real Apple keys
const joseVerifyMock = vi.fn();
vi.mock('jose', () => ({
  createRemoteJWKSet: vi.fn(() => ({})),
  jwtVerify: (...args: unknown[]) => joseVerifyMock(...args),
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

  describe('POST /api/auth/apple (native identityToken path)', () => {
    it('creates a new user from a valid Apple identityToken', async () => {
      joseVerifyMock.mockResolvedValueOnce({
        payload: { sub: 'apple_sub_111', email: 'apple-new@example.com' },
      });

      const res = await request(app)
        .post('/api/auth/apple')
        .send({ appleIdentityToken: 'fake.apple.token', appleFallbackName: 'Apple User' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user.email).toBe('apple-new@example.com');
      expect(res.body.user.name).toBe('Apple User');

      const inDb = await User.findOne({ email: 'apple-new@example.com' });
      expect(inDb).toBeTruthy();
      expect(inDb?.appleSub).toBe('apple_sub_111');
      expect(inDb?.authProvider).toBe('apple');
    });

    it('re-uses an existing user when appleSub matches', async () => {
      joseVerifyMock.mockResolvedValueOnce({
        payload: { sub: 'apple_sub_222', email: 'apple-existing@example.com' },
      });
      const first = await request(app)
        .post('/api/auth/apple')
        .send({ appleIdentityToken: 'fake.apple.token.1' });
      expect(first.status).toBe(200);

      // Second sign-in: Apple omits email after the first login; we should still find the user by sub
      joseVerifyMock.mockResolvedValueOnce({
        payload: { sub: 'apple_sub_222' },
      });
      const second = await request(app)
        .post('/api/auth/apple')
        .send({ appleIdentityToken: 'fake.apple.token.2' });
      expect(second.status).toBe(200);
      expect(second.body.user.userId).toBe(first.body.user.userId);
    });

    it('returns 401 when identityToken fails Apple JWKS verification', async () => {
      joseVerifyMock.mockRejectedValueOnce(new Error('signature invalid'));

      const res = await request(app)
        .post('/api/auth/apple')
        .send({ appleIdentityToken: 'bad.token' });

      expect(res.status).toBe(401);
      expect(res.body.message).toBe('Apple kimlik doğrulaması başarısız');
    });

    it('returns 400 when neither appleIdentityToken nor idToken is provided', async () => {
      const res = await request(app).post('/api/auth/apple').send({});
      expect(res.status).toBe(400);
    });
  });
});
