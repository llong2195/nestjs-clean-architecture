import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { E2ETestSetup, TestDataFactory, authHeader } from './setup';

/**
 * Authentication Flow E2E Tests
 *
 * Tests the complete authentication flow including:
 * - User registration
 * - Login with email/password
 * - JWT token validation
 * - Refresh token flow
 * - Protected route access
 * - Logout
 *
 * Prerequisites:
 * - PostgreSQL database running
 * - Redis running
 * - Test database seeded/migrated
 */
describe('Auth (e2e)', () => {
  let app: INestApplication;
  let testUser: any;
  let accessToken: string;
  let refreshToken: string;

  beforeAll(async () => {
    app = await E2ETestSetup.createTestApp();
  });

  afterAll(async () => {
    await E2ETestSetup.closeApp(app);
  });

  describe('POST /api/users (Registration)', () => {
    it('should create a new user', async () => {
      testUser = TestDataFactory.createTestUser();

      const response = await request(app.getHttpServer())
        .post('/api/users')
        .send(testUser)
        .expect(201);

      expect(response.body.status).toBe('success');
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.email).toBe(testUser.email);
      expect(response.body.data.userName).toBe(testUser.userName);
      expect(response.body.data).not.toHaveProperty('password'); // Password should not be returned
      expect(response.body.meta).toHaveProperty('timestamp');
      expect(response.body.meta).toHaveProperty('requestId');
    });

    it('should reject duplicate email', async () => {
      const duplicateUser = TestDataFactory.createTestUser({ email: testUser.email });

      const response = await request(app.getHttpServer())
        .post('/api/users')
        .send(duplicateUser)
        .expect(400);

      expect(response.body.status).toBe('error');
      expect(response.body.error.code).toBe('DUPLICATE_EMAIL');
    });

    it('should validate email format', async () => {
      const invalidUser = TestDataFactory.createTestUser({ email: 'invalid-email' });

      const response = await request(app.getHttpServer())
        .post('/api/users')
        .send(invalidUser)
        .expect(400);

      expect(response.body.status).toBe('error');
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should validate password strength', async () => {
      const weakPasswordUser = TestDataFactory.createTestUser({ password: 'weak' });

      const response = await request(app.getHttpServer())
        .post('/api/users')
        .send(weakPasswordUser)
        .expect(400);

      expect(response.body.status).toBe('error');
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('refreshToken');
      expect(response.body.data.user.email).toBe(testUser.email);

      // Store tokens for subsequent tests
      accessToken = response.body.data.accessToken;
      refreshToken = response.body.data.refreshToken;

      // Verify JWT structure
      expect(accessToken).toMatch(/^eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+$/);
    });

    it('should reject invalid credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'WrongPassword123!',
        })
        .expect(401);

      expect(response.body.status).toBe('error');
      expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('should reject non-existent user', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'SomePassword123!',
        })
        .expect(401);

      expect(response.body.status).toBe('error');
      expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
    });
  });

  describe('Protected Routes', () => {
    it('should access protected route with valid token', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/users')
        .set(authHeader(accessToken))
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data).toBeInstanceOf(Array);
    });

    it('should reject request without token', async () => {
      const response = await request(app.getHttpServer()).get('/api/users').expect(401);

      expect(response.body.status).toBe('error');
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should reject request with invalid token', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/users')
        .set(authHeader('invalid.token.here'))
        .expect(401);

      expect(response.body.status).toBe('error');
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should reject request with expired token', async () => {
      // This would require a token that's actually expired
      // In a real test, you might mock the time or create a token with past expiry
      // For now, we'll skip this test or use a fixture
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should refresh access token with valid refresh token', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('refreshToken');

      // New tokens should be different from old ones
      expect(response.body.data.accessToken).not.toBe(accessToken);
      expect(response.body.data.refreshToken).not.toBe(refreshToken);

      // Update tokens for subsequent tests
      accessToken = response.body.data.accessToken;
      refreshToken = response.body.data.refreshToken;
    });

    it('should reject invalid refresh token', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/refresh')
        .send({ refreshToken: 'invalid-refresh-token' })
        .expect(401);

      expect(response.body.status).toBe('error');
      expect(response.body.error.code).toBe('INVALID_REFRESH_TOKEN');
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout and invalidate tokens', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/logout')
        .set(authHeader(accessToken))
        .send({ refreshToken })
        .expect(200);

      expect(response.body.status).toBe('success');
    });

    it('should reject requests with logged out token', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/users')
        .set(authHeader(accessToken))
        .expect(401);

      expect(response.body.status).toBe('error');
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });
  });

  describe('Google OAuth Flow', () => {
    it('should redirect to Google OAuth consent page', async () => {
      const response = await request(app.getHttpServer()).get('/api/auth/google').expect(302);

      expect(response.headers.location).toContain('accounts.google.com');
      expect(response.headers.location).toContain('oauth2');
    });

    it('should handle OAuth callback', async () => {
      // This test would require mocking the Google OAuth service
      // or using a test OAuth provider
      // For now, we'll skip the actual OAuth flow test
    });
  });

  describe('Token Security', () => {
    it('should not leak sensitive information in error responses', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'WrongPassword',
        })
        .expect(401);

      // Should not reveal whether email exists
      expect(response.body.error.message).not.toContain('email not found');
      expect(response.body.error.message).not.toContain('password incorrect');
      expect(response.body.error.message).toBe('Invalid credentials');
    });

    it('should implement rate limiting on auth endpoints', async () => {
      // Make multiple rapid requests
      const requests = Array(20)
        .fill(null)
        .map(() =>
          request(app.getHttpServer()).post('/api/auth/login').send({
            email: 'test@example.com',
            password: 'wrong',
          }),
        );

      const responses = await Promise.all(requests);

      // At least one request should be rate limited (429)
      const rateLimitedResponses = responses.filter((r) => r.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });
});
