import { Injectable } from '@nestjs/common';
import * as winston from 'winston';
import { AppConfigService } from '../config/config.service';

@Injectable()
export class LoggerService {
  private logger: winston.Logger;

  constructor(private readonly configService: AppConfigService) {
    const isDevelopment = this.configService.isDevelopment;
    const logLevel = this.configService.logLevel || 'info';

    // Development format: pretty and colorized
    const devFormat = winston.format.combine(
      winston.format.colorize(),
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.printf((info) => {
        const timestamp = info.timestamp as string;
        const level = info.level;
        const message = info.message as string;
        const context = info.context as string | undefined;
        const requestId = info.requestId as string | undefined;
        const {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          timestamp: _,
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          level: __,
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          message: ___,
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          context: ____,
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          requestId: _____,
          ...meta
        } = info;

        const metaStr = Object.keys(meta).length > 0 ? JSON.stringify(meta, null, 2) : '';
        const contextStr = context ? `[${context}]` : '';
        const requestIdStr = requestId ? `[${requestId}]` : '';
        return `${timestamp} ${level} ${contextStr}${requestIdStr}: ${message} ${metaStr}`;
      }),
    );

    // Production format: structured JSON
    const prodFormat = winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json(),
    );

    this.logger = winston.createLogger({
      level: logLevel,
      format: isDevelopment ? devFormat : prodFormat,
      transports: [
        new winston.transports.Console(),
        // In production, you might add File or external transports (e.g., Syslog, Elasticsearch)
      ],
    });
  }

  log(message: string, context?: string, requestId?: string): void {
    this.logger.info(message, { context, requestId });
  }

  info(message: string, meta?: Record<string, unknown>): void {
    this.logger.info(message, meta);
  }

  debug(message: string, context?: string, requestId?: string): void {
    this.logger.debug(message, { context, requestId });
  }

  warn(message: string, context?: string, requestId?: string): void {
    this.logger.warn(message, { context, requestId });
  }

  error(message: string, trace?: string, context?: string, requestId?: string): void {
    this.logger.error(message, { trace, context, requestId });
  }

  verbose(message: string, context?: string, requestId?: string): void {
    this.logger.verbose(message, { context, requestId });
  }
}
