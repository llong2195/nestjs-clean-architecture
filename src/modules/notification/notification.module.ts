import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule, type JwtModuleOptions } from '@nestjs/jwt';
import { NotificationOrmEntity } from './infrastructure/persistence/notification.orm-entity';
import { NotificationRepository } from './infrastructure/persistence/notification.repository';
import { SendNotificationUseCase } from './application/use-cases/send-notification.use-case';
import { NotificationGateway } from './interface/websocket/notification.gateway';
import { ConfigModule } from '../../shared/config/config.module';
import { AppConfigService } from '../../shared/config/config.service';

/**
 * Notification Module
 *
 * Provides notification functionality including:
 * - Creating and storing notifications
 * - Real-time delivery via WebSocket with JWT authentication
 * - Background processing for email/push notifications
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([NotificationOrmEntity]),
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: AppConfigService): JwtModuleOptions => ({
        secret: configService.jwtSecret,
        signOptions: {
          expiresIn: configService.jwtExpiresIn,
        },
      }),
      inject: [AppConfigService],
    }),
  ],
  providers: [
    // Repository
    {
      provide: 'INotificationRepository',
      useClass: NotificationRepository,
    },
    // Use cases
    SendNotificationUseCase,
    // WebSocket gateway
    NotificationGateway,
  ],
  exports: [SendNotificationUseCase, NotificationGateway],
})
export class NotificationModule {}
