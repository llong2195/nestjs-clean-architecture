import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { AppConfigService } from '../../shared/config/config.service';

export interface JwtPayload {
  sub: string; // user ID
  email: string;
  role?: string;
  iat?: number;
  exp?: number;
}

/**
 * WebSocket JWT Authentication Guard
 * Validates JWT tokens from WebSocket handshake query or auth headers
 */
@Injectable()
export class WsJwtAuthGuard implements CanActivate {
  private readonly logger = new Logger(WsJwtAuthGuard.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: AppConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const client: Socket = context.switchToWs().getClient<Socket>();
      const token = this.extractToken(client);

      if (!token) {
        this.logger.warn('No token provided in WebSocket connection');
        throw new WsException('Unauthorized: No token provided');
      }

      const payload = await this.verifyToken(token);

      // Attach user payload to socket for later use
      client.data.user = payload;

      this.logger.log(`WebSocket authenticated: user ${payload.sub}`);
      return true;
    } catch (error) {
      this.logger.error(`WebSocket authentication failed: ${(error as Error).message}`);
      throw new WsException('Unauthorized: Invalid token');
    }
  }

  /**
   * Extract token from query parameters or authorization header
   */
  private extractToken(client: Socket): string | null {
    // Try query parameter first (e.g., ?token=...)
    const tokenFromQuery = client.handshake.query?.token as string;
    if (tokenFromQuery) {
      return tokenFromQuery;
    }

    // Try authorization header (e.g., Authorization: Bearer <token>)
    const authHeader = client.handshake.headers?.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    // Try auth object (some clients send it this way)
    const tokenFromAuth = client.handshake.auth?.token as string;
    if (tokenFromAuth) {
      return tokenFromAuth;
    }

    return null;
  }

  /**
   * Verify JWT token and return payload
   */
  private async verifyToken(token: string): Promise<JwtPayload> {
    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: this.configService.jwtSecret,
      });

      return payload;
    } catch (error) {
      this.logger.error(`Token verification failed: ${(error as Error).message}`);
      throw new WsException('Invalid or expired token');
    }
  }
}
