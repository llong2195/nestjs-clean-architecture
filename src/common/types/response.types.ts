export interface ApiResponse<T = unknown> {
  status: 'success' | 'error';
  data?: T;
  error?: ErrorDetails;
  meta: ResponseMeta;
}

export interface ErrorDetails {
  code: string;
  message: string;
  details?: unknown;
  stack?: string; // Only in development
}

export interface ResponseMeta {
  timestamp: string;
  requestId?: string;
  path?: string;
}

export type SuccessResponse<T> = {
  status: 'success';
  data: T;
  meta: ResponseMeta;
};

export type ErrorResponse = {
  status: 'error';
  error: ErrorDetails;
  meta: ResponseMeta;
};
