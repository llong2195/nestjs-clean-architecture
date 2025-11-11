import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { v7 as uuid } from 'uuid';

// Extend Express Request to include requestId
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      id?: string;
    }
  }
}

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    // Generate or use existing request ID from header
    const requestId = (req.headers['x-request-id'] as string) || uuid();

    // Attach to request object
    req.id = requestId;

    // Add to response headers
    res.setHeader('X-Request-ID', requestId);

    next();
  }
}
