import { HttpException, HttpStatus } from '@nestjs/common';
import { ErrorCode } from '../types/error-codes.enum';

/**
 * User Not Found Exception
 */
export class UserNotFoundException extends HttpException {
  constructor(identifier: string) {
    super(
      {
        statusCode: HttpStatus.NOT_FOUND,
        message: `User not found: ${identifier}`,
        errorCode: ErrorCode.USER_NOT_FOUND,
      },
      HttpStatus.NOT_FOUND,
    );
  }
}

/**
 * Duplicate Email Exception
 */
export class DuplicateEmailException extends HttpException {
  constructor(email: string) {
    super(
      {
        statusCode: HttpStatus.CONFLICT,
        message: `Email already exists: ${email}`,
        errorCode: ErrorCode.DUPLICATE_EMAIL,
      },
      HttpStatus.CONFLICT,
    );
  }
}

/**
 * Invalid Credentials Exception
 */
export class InvalidCredentialsException extends HttpException {
  constructor() {
    super(
      {
        statusCode: HttpStatus.UNAUTHORIZED,
        message: 'Invalid email or password',
        errorCode: ErrorCode.INVALID_CREDENTIALS,
      },
      HttpStatus.UNAUTHORIZED,
    );
  }
}

/**
 * Post Not Found Exception
 */
export class PostNotFoundException extends HttpException {
  constructor(postId: string) {
    super(
      {
        statusCode: HttpStatus.NOT_FOUND,
        message: `Post not found: ${postId}`,
        errorCode: ErrorCode.POST_NOT_FOUND,
      },
      HttpStatus.NOT_FOUND,
    );
  }
}

/**
 * Duplicate Slug Exception
 */
export class DuplicateSlugException extends HttpException {
  constructor(slug: string) {
    super(
      {
        statusCode: HttpStatus.CONFLICT,
        message: `Post with slug "${slug}" already exists`,
        errorCode: ErrorCode.DUPLICATE_EMAIL, // Reuse similar error code
      },
      HttpStatus.CONFLICT,
    );
  }
}

/**
 * Invalid Post Status Exception
 */
export class InvalidPostStatusException extends HttpException {
  constructor(currentStatus: string, targetStatus: string) {
    super(
      {
        statusCode: HttpStatus.BAD_REQUEST,
        message: `Cannot transition from ${currentStatus} to ${targetStatus}`,
        errorCode: ErrorCode.INVALID_POST_STATUS,
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}

/**
 * Unauthorized Access Exception
 */
export class UnauthorizedAccessException extends HttpException {
  constructor(resource: string) {
    super(
      {
        statusCode: HttpStatus.FORBIDDEN,
        message: `Unauthorized access to ${resource}`,
        errorCode: ErrorCode.UNAUTHORIZED_ACCESS,
      },
      HttpStatus.FORBIDDEN,
    );
  }
}
