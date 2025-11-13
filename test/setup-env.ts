/**
 * Test Environment Setup
 * Sets environment variables required for all test runs
 */

// Set NODE_ENV to 'test' for all test runs
process.env.NODE_ENV = 'test';

// Required environment variables for configuration validation
process.env.PORT = '3000';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-unit-tests';
process.env.JWT_EXPIRATION = '1h';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key';
process.env.JWT_REFRESH_EXPIRATION = '7d';

// Database configuration (test)
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '5432';
process.env.DB_USERNAME = 'postgres';
process.env.DB_PASSWORD = 'postgres';
process.env.DB_DATABASE = 'test_db';
process.env.DB_SYNCHRONIZE = 'false';
process.env.DB_LOGGING = 'false';

// Redis configuration (test)
process.env.REDIS_HOST = 'localhost';
process.env.REDIS_PORT = '6379';
process.env.REDIS_TTL = '3600';

// Kafka configuration (test)
process.env.KAFKA_BROKERS = 'localhost:9092';
process.env.KAFKA_CLIENT_ID = 'test-client';
process.env.KAFKA_GROUP_ID = 'test-group';

// Google OAuth (test)
process.env.GOOGLE_CLIENT_ID = 'test-google-client-id';
process.env.GOOGLE_CLIENT_SECRET = 'test-google-client-secret';
process.env.GOOGLE_CALLBACK_URL = 'http://localhost:3000/api/auth/google/callback';

// Rate Limiting (test)
process.env.THROTTLE_TTL = '60';
process.env.THROTTLE_LIMIT = '100';

// CORS (test)
process.env.CORS_ORIGIN = '*';

// Storage configuration (test)
process.env.STORAGE_TYPE = 'local';
process.env.UPLOAD_DIR = './uploads';
process.env.BASE_URL = 'http://localhost:3000';
process.env.AWS_REGION = 'us-east-1';
process.env.AWS_S3_BUCKET = 'test-bucket';
process.env.AWS_ACCESS_KEY_ID = 'test-access-key';
process.env.AWS_SECRET_ACCESS_KEY = 'test-secret-key';

// i18n configuration (test)
process.env.DEFAULT_LANGUAGE = 'en';

// Cache TTL
process.env.CACHE_TTL = '3600';
