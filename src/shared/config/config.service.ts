import { Injectable } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';
import { StringValue } from 'ms';

@Injectable()
export class AppConfigService {
  constructor(private configService: NestConfigService) {}

  // Application
  get nodeEnv(): string {
    return this.configService.get<string>('NODE_ENV', 'development');
  }

  get port(): number {
    return this.configService.get<number>('PORT', 3000);
  }

  get isDevelopment(): boolean {
    return this.nodeEnv === 'development';
  }

  get isProduction(): boolean {
    return this.nodeEnv === 'production';
  }

  // Database
  get databaseUrl(): string {
    return this.configService.get<string>('DATABASE_URL')!;
  }

  get databaseHost(): string {
    return this.configService.get<string>('DATABASE_HOST', 'localhost');
  }

  get databasePort(): number {
    return this.configService.get<number>('DATABASE_PORT', 5432);
  }

  get databaseUser(): string {
    return this.configService.get<string>('DATABASE_USER')!;
  }

  get databasePassword(): string {
    return this.configService.get<string>('DATABASE_PASSWORD')!;
  }

  get databaseName(): string {
    return this.configService.get<string>('DATABASE_NAME')!;
  }

  // Redis
  get redisUrl(): string {
    return this.configService.get<string>('REDIS_URL')!;
  }

  get redisHost(): string {
    return this.configService.get<string>('REDIS_HOST', 'localhost');
  }

  get redisPort(): number {
    return this.configService.get<number>('REDIS_PORT', 6379);
  }

  // JWT
  get jwtSecret(): string {
    return this.configService.get<string>('JWT_SECRET')!;
  }

  get jwtExpiresIn(): StringValue {
    return this.configService.get<StringValue>('JWT_EXPIRES_IN', '15m');
  }

  get refreshTokenExpiresIn(): StringValue {
    return this.configService.get<StringValue>('REFRESH_TOKEN_EXPIRES_IN', '7d');
  }

  // Google OAuth
  get googleClientId(): string | undefined {
    return this.configService.get<string>('GOOGLE_CLIENT_ID');
  }

  get googleClientSecret(): string | undefined {
    return this.configService.get<string>('GOOGLE_CLIENT_SECRET');
  }

  get googleCallbackUrl(): string | undefined {
    return this.configService.get<string>('GOOGLE_CALLBACK_URL');
  }

  // Kafka
  get kafkaBrokers(): string {
    return this.configService.get<string>('KAFKA_BROKERS', 'localhost:9092');
  }

  get kafkaClientId(): string {
    return this.configService.get<string>('KAFKA_CLIENT_ID', 'nestjs-clean-architecture');
  }

  get kafkaGroupId(): string {
    return this.configService.get<string>('KAFKA_GROUP_ID', 'nestjs-clean-architecture-group');
  }

  // BullMQ
  get bullRedisHost(): string {
    return this.configService.get<string>('BULL_REDIS_HOST', 'localhost');
  }

  get bullRedisPort(): number {
    return this.configService.get<number>('BULL_REDIS_PORT', 6379);
  }

  // Logging
  get logLevel(): string {
    return this.configService.get<string>('LOG_LEVEL', 'debug');
  }

  // Storage
  get uploadDir(): string {
    return this.configService.get<string>('UPLOAD_DIR', './uploads');
  }

  get baseUrl(): string {
    return this.configService.get<string>('BASE_URL', 'http://localhost:3000');
  }

  get awsRegion(): string | undefined {
    return this.configService.get<string>('AWS_REGION');
  }

  get awsS3Bucket(): string | undefined {
    return this.configService.get<string>('AWS_S3_BUCKET');
  }

  get awsAccessKeyId(): string | undefined {
    return this.configService.get<string>('AWS_ACCESS_KEY_ID');
  }

  get awsSecretAccessKey(): string | undefined {
    return this.configService.get<string>('AWS_SECRET_ACCESS_KEY');
  }

  get storageType(): 'local' | 's3' {
    return this.configService.get<'local' | 's3'>('STORAGE_TYPE', 'local');
  }
}
