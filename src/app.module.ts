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

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    LoggerModule,
    CacheModule,
    BullMQModule,
    KafkaModule,
    DomainEventsModule,
    AuthModule,
    UserModule,
    PostModule,
    NotificationModule,
    ConversationModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}
