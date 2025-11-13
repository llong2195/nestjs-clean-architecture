import { HttpExceptionFilter } from '../../src/common/filters/http-exception.filter';
import { ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { ErrorCode } from '../../src/common/types/error-codes.enum';

describe('Error Response Format', () => {
  let filter: HttpExceptionFilter;
  let mockResponse: Partial<Response>;
  let mockArgumentsHost: ArgumentsHost;

  beforeEach(() => {
    filter = new HttpExceptionFilter();

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockArgumentsHost = {
      switchToHttp: jest.fn().mockReturnValue({
        getResponse: () => mockResponse,
        getRequest: () => ({
          url: '/test',
          method: 'GET',
        }),
      }),
    } as unknown as ArgumentsHost;
  });

  it('should match OpenAPI ErrorResponse schema for validation errors', () => {
    const exception = new HttpException(
      {
        message: 'Invalid email format',
        errorCode: ErrorCode.VALIDATION_ERROR,
        details: [
          {
            field: 'email',
            message: 'Invalid email format',
          },
        ],
      },
      HttpStatus.BAD_REQUEST,
    );

    filter.catch(exception, mockArgumentsHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'error',
        error: expect.objectContaining({
          code: ErrorCode.VALIDATION_ERROR,
          message: 'Invalid email format',
          details: expect.arrayContaining([
            expect.objectContaining({
              field: 'email',
              message: 'Invalid email format',
            }),
          ]),
        }),
        meta: expect.objectContaining({
          timestamp: expect.any(String),
          path: '/test',
        }),
      }),
    );
  });

  it('should match OpenAPI ErrorResponse schema for 404 errors', () => {
    const exception = new HttpException(
      {
        message: 'User not found',
        errorCode: ErrorCode.USER_NOT_FOUND,
      },
      HttpStatus.NOT_FOUND,
    );

    filter.catch(exception, mockArgumentsHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'error',
        error: expect.objectContaining({
          code: ErrorCode.USER_NOT_FOUND,
          message: 'User not found',
        }),
        meta: expect.objectContaining({
          timestamp: expect.any(String),
          path: '/test',
        }),
      }),
    );
  });

  it('should extract custom error code from exception response', () => {
    const exception = new HttpException(
      {
        message: 'Email already exists',
        errorCode: ErrorCode.DUPLICATE_EMAIL,
      },
      HttpStatus.CONFLICT,
    );

    filter.catch(exception, mockArgumentsHost);

    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({
          code: ErrorCode.DUPLICATE_EMAIL,
        }),
      }),
    );
  });

  it('should fall back to status-based error code when custom code not provided', () => {
    const exception = new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);

    filter.catch(exception, mockArgumentsHost);

    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({
          code: ErrorCode.UNAUTHORIZED,
        }),
      }),
    );
  });
});
