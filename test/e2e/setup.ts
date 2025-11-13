import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { HttpExceptionFilter } from '../../src/common/filters/http-exception.filter';
import { TransformInterceptor } from '../../src/common/interceptors/transform.interceptor';

/**
 * E2E Test Setup Helper
 *
 * Provides utilities for setting up NestJS application instances
 * for end-to-end testing with all global pipes, filters, and interceptors.
 */

export class E2ETestSetup {
  static async createTestApp(): Promise<INestApplication> {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    const app = moduleFixture.createNestApplication();

    // Apply same middleware as main.ts
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    app.useGlobalFilters(new HttpExceptionFilter());
    app.useGlobalInterceptors(new TransformInterceptor());

    // Enable CORS for testing
    app.enableCors();

    await app.init();

    return app;
  }

  static async closeApp(app: INestApplication): Promise<void> {
    if (app) {
      await app.close();
    }
  }
}

/**
 * Test Data Factory
 *
 * Provides factory methods for creating test data
 */
export class TestDataFactory {
  static createTestUser(overrides?: Partial<any>) {
    return {
      email: `test-${Date.now()}@example.com`,
      password: 'SecurePass123!',
      userName: 'Test User',
      ...overrides,
    };
  }

  static createTestPost(_authorId: string, overrides?: Partial<any>) {
    return {
      title: `Test Post ${Date.now()}`,
      content: 'This is a test post content with sufficient length.',
      ...overrides,
    };
  }

  static createTestComment(postId: string, overrides?: Partial<any>) {
    return {
      postId,
      content: 'This is a test comment.',
      ...overrides,
    };
  }
}

/**
 * Helper to extract JWT token from login response
 */
export function extractToken(response: any): string {
  return response.body.data.accessToken;
}

/**
 * Helper to create authorization header
 */
export function authHeader(token: string): { Authorization: string } {
  return { Authorization: `Bearer ${token}` };
}
