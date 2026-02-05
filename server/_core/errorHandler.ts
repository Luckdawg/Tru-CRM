/**
 * Centralized Error Handling
 * 
 * Provides consistent error formatting, logging, and response handling
 * across tRPC procedures and Express routes.
 */

import { TRPCError } from '@trpc/server';
import { logger, LogContext } from './logger';

/**
 * Standard error codes used across the application
 */
export enum ErrorCode {
  // Client errors (4xx)
  BAD_REQUEST = 'BAD_REQUEST',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  
  // Server errors (5xx)
  INTERNAL_ERROR = 'INTERNAL_SERVER_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  TIMEOUT = 'TIMEOUT',
}

/**
 * Application-specific error class
 */
export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public statusCode: number = 500,
    public context?: LogContext
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }

  toTRPCError(): TRPCError {
    const trpcCode = this.getTRPCCode();
    return new TRPCError({
      code: trpcCode,
      message: this.message,
      cause: this,
    });
  }

  private getTRPCCode(): any {
    switch (this.code) {
      case ErrorCode.BAD_REQUEST:
      case ErrorCode.VALIDATION_ERROR:
        return 'BAD_REQUEST';
      case ErrorCode.UNAUTHORIZED:
        return 'UNAUTHORIZED';
      case ErrorCode.FORBIDDEN:
        return 'FORBIDDEN';
      case ErrorCode.NOT_FOUND:
        return 'NOT_FOUND';
      case ErrorCode.CONFLICT:
        return 'CONFLICT';
      case ErrorCode.TIMEOUT:
        return 'TIMEOUT';
      default:
        return 'INTERNAL_SERVER_ERROR';
    }
  }
}

/**
 * Error factory functions for common scenarios
 */
export const Errors = {
  notFound: (resource: string, id: number | string, context?: LogContext) =>
    new AppError(
      ErrorCode.NOT_FOUND,
      `${resource} with id ${id} not found`,
      404,
      context
    ),

  unauthorized: (message: string = 'Authentication required', context?: LogContext) =>
    new AppError(ErrorCode.UNAUTHORIZED, message, 401, context),

  forbidden: (message: string = 'Insufficient permissions', context?: LogContext) =>
    new AppError(ErrorCode.FORBIDDEN, message, 403, context),

  validation: (message: string, context?: LogContext) =>
    new AppError(ErrorCode.VALIDATION_ERROR, message, 400, context),

  conflict: (message: string, context?: LogContext) =>
    new AppError(ErrorCode.CONFLICT, message, 409, context),

  database: (message: string, context?: LogContext) =>
    new AppError(ErrorCode.DATABASE_ERROR, message, 500, context),

  externalService: (service: string, message: string, context?: LogContext) =>
    new AppError(
      ErrorCode.EXTERNAL_SERVICE_ERROR,
      `${service}: ${message}`,
      503,
      context
    ),

  timeout: (operation: string, context?: LogContext) =>
    new AppError(ErrorCode.TIMEOUT, `Operation timed out: ${operation}`, 504, context),
};

/**
 * Log and format error for response
 */
export function handleError(error: unknown, context?: LogContext): AppError {
  // If already an AppError, just log and return
  if (error instanceof AppError) {
    logger.error(error.message, { ...context, ...error.context, errorCode: error.code }, error);
    return error;
  }

  // If TRPCError, convert to AppError
  if (error instanceof TRPCError) {
    const appError = new AppError(
      ErrorCode.INTERNAL_ERROR,
      error.message,
      500,
      context
    );
    logger.error(error.message, { ...context, trpcCode: error.code }, error);
    return appError;
  }

  // If standard Error, wrap in AppError
  if (error instanceof Error) {
    const appError = new AppError(
      ErrorCode.INTERNAL_ERROR,
      error.message,
      500,
      context
    );
    logger.error(error.message, context, error);
    return appError;
  }

  // Unknown error type
  const appError = new AppError(
    ErrorCode.INTERNAL_ERROR,
    'An unexpected error occurred',
    500,
    context
  );
  logger.error('Unknown error type', { ...context, error: String(error) });
  return appError;
}

/**
 * Express error handler middleware
 */
export function expressErrorHandler(err: any, req: any, res: any, next: any): void {
  const context: LogContext = {
    requestId: req.requestId,
    userId: req.user?.id,
    method: req.method,
    path: req.path,
  };

  const appError = handleError(err, context);

  res.status(appError.statusCode).json({
    error: {
      code: appError.code,
      message: appError.message,
      requestId: req.requestId,
    },
  });
}

/**
 * Async handler wrapper for Express routes
 * Catches async errors and passes them to error handler
 */
export function asyncHandler(fn: Function) {
  return (req: any, res: any, next: any) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Retry logic for transient failures
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: {
    maxRetries?: number;
    delayMs?: number;
    exponentialBackoff?: boolean;
    context?: LogContext;
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    delayMs = 1000,
    exponentialBackoff = true,
    context = {},
  } = options;

  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxRetries) {
        logger.error('Operation failed after max retries', { ...context, attempt, maxRetries }, lastError);
        throw error;
      }

      const delay = exponentialBackoff ? delayMs * Math.pow(2, attempt - 1) : delayMs;
      logger.warn('Operation failed, retrying', { ...context, attempt, maxRetries, delayMs: delay }, lastError);
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}
