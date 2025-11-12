import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Socket } from 'socket.io';
import { JwtPayload } from '../guards/ws-jwt-auth.guard';

/**
 * Extract current authenticated user from WebSocket connection
 * Usage: @WsCurrentUser() user: JwtPayload
 */
export const WsCurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): JwtPayload => {
    const client: Socket = ctx.switchToWs().getClient<Socket>();
    return client.data.user;
  },
);
