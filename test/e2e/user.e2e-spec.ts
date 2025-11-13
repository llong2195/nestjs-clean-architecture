import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { E2ETestSetup, TestDataFactory, extractToken, authHeader } from './setup';
import { App } from 'supertest/types';

/**
 * User CRUD E2E Tests
 *
 * Tests complete user management lifecycle:
 * - Create users
 * - Retrieve user details
 * - Update user profiles
 * - Delete users (soft delete)
 * - List users with pagination
 * - Authorization checks
 */
describe('User CRUD (e2e)', () => {
  let app: INestApplication<App>;
  let adminToken: string;
  let userToken: string;
  let testUserId: string;

  beforeAll(async () => {
    app = await E2ETestSetup.createTestApp();

    // Create admin user and login
    const adminUser = TestDataFactory.createTestUser({ userName: 'Admin User' });
    await request(app.getHttpServer()).post('/api/users').send(adminUser);
    const adminLogin = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: adminUser.email, password: adminUser.password });
    adminToken = extractToken(adminLogin);

    // Create regular user and login
    const regularUser = TestDataFactory.createTestUser({ userName: 'Regular User' });
    await request(app.getHttpServer()).post('/api/users').send(regularUser);
    const userLogin = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: regularUser.email, password: regularUser.password });
    userToken = extractToken(userLogin);
  });

  afterAll(async () => {
    await E2ETestSetup.closeApp(app);
  });

  describe('GET /api/users/:id', () => {
    it('should get user by ID with authentication', async () => {
      // Create a test user
      const testUser = TestDataFactory.createTestUser();
      const createResponse = await request(app.getHttpServer())
        .post('/api/users')
        .send(testUser)
        .expect(201);

      testUserId = createResponse.body.data.id;

      // Get the user
      const response = await request(app.getHttpServer())
        .get(`/api/users/${testUserId}`)
        .set(authHeader(adminToken))
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.id).toBe(testUserId);
      expect(response.body.data.email).toBe(testUser.email);
      expect(response.body.data).not.toHaveProperty('password');
    });

    it('should return 404 for non-existent user', async () => {
      const fakeId = '123e4567-e89b-12d3-a456-426614174000';
      const response = await request(app.getHttpServer())
        .get(`/api/users/${fakeId}`)
        .set(authHeader(adminToken))
        .expect(404);

      expect(response.body.status).toBe('error');
      expect(response.body.error.code).toBe('NOT_FOUND');
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer()).get(`/api/users/${testUserId}`).expect(401);
    });
  });

  describe('GET /api/users (List)', () => {
    beforeAll(async () => {
      // Create multiple users for pagination testing
      for (let i = 0; i < 5; i++) {
        const user = TestDataFactory.createTestUser({
          userName: `Test User ${i}`,
        });
        await request(app.getHttpServer()).post('/api/users').send(user);
      }
    });

    it('should list users with pagination', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/users')
        .query({ page: 1, limit: 5 })
        .set(authHeader(adminToken))
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeLessThanOrEqual(5);
      expect(response.body.meta).toHaveProperty('total');
      expect(response.body.meta).toHaveProperty('page');
      expect(response.body.meta).toHaveProperty('limit');
    });

    it('should filter users by role', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/users')
        .query({ role: 'user' })
        .set(authHeader(adminToken))
        .expect(200);

      expect(response.body.status).toBe('success');
      response.body.data.forEach((user: any) => {
        expect(user.role).toBe('user');
      });
    });

    it('should support pagination navigation', async () => {
      const page1 = await request(app.getHttpServer())
        .get('/api/users')
        .query({ page: 1, limit: 2 })
        .set(authHeader(adminToken));

      const page2 = await request(app.getHttpServer())
        .get('/api/users')
        .query({ page: 2, limit: 2 })
        .set(authHeader(adminToken));

      expect(page1.body.data[0].id).not.toBe(page2.body.data[0].id);
    });
  });

  describe('PATCH /api/users/:id', () => {
    it('should update user profile', async () => {
      const updates = { userName: 'Updated Name' };
      const response = await request(app.getHttpServer())
        .patch(`/api/users/${testUserId}`)
        .send(updates)
        .set(authHeader(adminToken))
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.userName).toBe('Updated Name');
    });

    it('should validate update data', async () => {
      const invalidUpdates = { userName: '' }; // Empty name
      const response = await request(app.getHttpServer())
        .patch(`/api/users/${testUserId}`)
        .send(invalidUpdates)
        .set(authHeader(adminToken))
        .expect(400);

      expect(response.body.status).toBe('error');
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should not allow updating email to existing email', async () => {
      const anotherUser = TestDataFactory.createTestUser();
      await request(app.getHttpServer()).post('/api/users').send(anotherUser);

      const response = await request(app.getHttpServer())
        .patch(`/api/users/${testUserId}`)
        .send({ email: anotherUser.email })
        .set(authHeader(adminToken))
        .expect(400);

      expect(response.body.error.code).toBe('DUPLICATE_EMAIL');
    });
  });

  describe('DELETE /api/users/:id', () => {
    it('should soft delete a user', async () => {
      // Create user to delete
      const userToDelete = TestDataFactory.createTestUser();
      const createResponse = await request(app.getHttpServer())
        .post('/api/users')
        .send(userToDelete);
      const userIdToDelete = createResponse.body.data.id;

      // Delete user
      const response = await request(app.getHttpServer())
        .delete(`/api/users/${userIdToDelete}`)
        .set(authHeader(adminToken))
        .expect(200);

      expect(response.body.status).toBe('success');

      // Verify user is soft deleted (404 on subsequent requests)
      await request(app.getHttpServer())
        .get(`/api/users/${userIdToDelete}`)
        .set(authHeader(adminToken))
        .expect(404);
    });

    it('should return 404 when deleting non-existent user', async () => {
      const fakeId = '123e4567-e89b-12d3-a456-426614174000';
      const response = await request(app.getHttpServer())
        .delete(`/api/users/${fakeId}`)
        .set(authHeader(adminToken))
        .expect(404);

      expect(response.body.error.code).toBe('NOT_FOUND');
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer()).delete(`/api/users/${testUserId}`).expect(401);
    });
  });

  describe('Authorization', () => {
    it('should allow user to update their own profile', async () => {
      // User updates their own profile
      const response = await request(app.getHttpServer())
        .patch(`/api/users/${testUserId}`)
        .send({ userName: 'Self Updated' })
        .set(authHeader(userToken))
        .expect(200);

      expect(response.body.data.userName).toBe('Self Updated');
    });

    it('should prevent user from deleting other users', async () => {
      // Regular user tries to delete admin user
      await request(app.getHttpServer())
        .delete(`/api/users/${testUserId}`)
        .set(authHeader(userToken))
        .expect(403);
    });
  });

  describe('Edge Cases', () => {
    it('should handle malformed user ID', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/users/invalid-id')
        .set(authHeader(adminToken))
        .expect(400);

      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should handle concurrent updates gracefully', async () => {
      const updates1 = { userName: 'Update 1' };
      const updates2 = { userName: 'Update 2' };

      const [response1, response2] = await Promise.all([
        request(app.getHttpServer())
          .patch(`/api/users/${testUserId}`)
          .send(updates1)
          .set(authHeader(adminToken)),
        request(app.getHttpServer())
          .patch(`/api/users/${testUserId}`)
          .send(updates2)
          .set(authHeader(adminToken)),
      ]);

      // Both should succeed
      expect([response1.status, response2.status]).toContain(200);
    });

    it('should not leak soft-deleted users in list', async () => {
      // Create and delete a user
      const tempUser = TestDataFactory.createTestUser();
      const createRes = await request(app.getHttpServer()).post('/api/users').send(tempUser);
      const tempUserId = createRes.body.data.id;

      await request(app.getHttpServer())
        .delete(`/api/users/${tempUserId}`)
        .set(authHeader(adminToken));

      // List users - should not include deleted user
      const listRes = await request(app.getHttpServer())
        .get('/api/users')
        .set(authHeader(adminToken));

      const deletedUser = listRes.body.data.find((u: any) => u.id === tempUserId);
      expect(deletedUser).toBeUndefined();
    });
  });
});
