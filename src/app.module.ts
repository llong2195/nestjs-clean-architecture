import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from './shared/config/config.module';
import { DatabaseModule } from './shared/database/database.module';
import { LoggerModule } from './shared/logger/logger.module';
import { CacheModule } from './shared/cache/cache.module';
import { BullMQModule } from './shared/messaging/bullmq/bullmq.module';
import { KafkaModule } from './shared/messaging/kafka/kafka.module';
import { DomainEventsModule } from './shared/domain-events/domain-events.module';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { PostModule } from './modules/post/post.module';
import { NotificationModule } from './modules/notification/notification.module';
import { ConversationModule } from './modules/conversation/conversation.module';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    LoggerModule,
    CacheModule,
    BullMQModule,
    KafkaModule,
    DomainEventsModule,
    // Rate limiting: 100 requests per 60 seconds per IP
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 60 seconds
        limit: 100, // 100 requests
      },
    ]),
    AuthModule,
    UserModule,
    PostModule,
    NotificationModule,
    ConversationModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Global rate limiting guard
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}
