/**
 * API Error Handler Middleware
 * Centralized error handling for API routes
 */

import { NextResponse } from 'next/server';
import { AppError, ValidationError } from '../errors';
import { logger } from '../logger';

export interface ErrorResponse {
  error: {
    message: string;
    code?: string;
    statusCode: number;
    fields?: Record<string, string>;
    timestamp: string;
    path?: string;
  };
}

/**
 * Format error response
 */
export function formatErrorResponse(
  error: Error | AppError,
  path?: string
): ErrorResponse {
  const timestamp = new Date().toISOString();

  if (error instanceof AppError) {
    const response: ErrorResponse = {
      error: {
        message: error.message,
        code: error.code,
        statusCode: error.statusCode,
        timestamp,
        path,
      },
    };

    // Add validation fields if it's a ValidationError
    if (error instanceof ValidationError && error.fields) {
      response.error.fields = error.fields;
    }

    return response;
  }

  // Unknown error - don't expose details in production
  const isDevelopment = process.env.NODE_ENV !== 'production';
  
  return {
    error: {
      message: isDevelopment ? error.message : 'An unexpected error occurred',
      code: 'INTERNAL_SERVER_ERROR',
      statusCode: 500,
      timestamp,
      path,
    },
  };
}

/**
 * Handle API errors
 */
export function handleApiError(error: Error | AppError, request?: Request): NextResponse {
  const path = request?.url;

  // Log error
  if (error instanceof AppError) {
    if (error.statusCode >= 500) {
      logger.error(error.message, error, {
        code: error.code,
        path,
      });
    } else {
      logger.warn(error.message, {
        code: error.code,
        statusCode: error.statusCode,
        path,
      });
    }
  } else {
    logger.error('Unhandled error', error, { path });
  }

  const errorResponse = formatErrorResponse(error, path);
  const statusCode = error instanceof AppError ? error.statusCode : 500;

  return NextResponse.json(errorResponse, { status: statusCode });
}

/**
 * Async handler wrapper for API routes
 * Automatically catches and handles errors
 */
export function asyncHandler(
  handler: (request: Request, context?: any) => Promise<NextResponse>
) {
  return async (request: Request, context?: any): Promise<NextResponse> => {
    try {
      return await handler(request, context);
    } catch (error) {
      return handleApiError(error as Error, request);
    }
  };
}

/**
 * Validate request body
 */
export async function validateRequestBody<T>(request: Request): Promise<T> {
  try {
    const body = await request.json();
    return body as T;
  } catch (error) {
    throw new AppError('Invalid JSON in request body', 400, 'INVALID_JSON');
  }
}

/**
 * Extract query parameters
 */
export function getQueryParams(request: Request): URLSearchParams {
  const url = new URL(request.url);
  return url.searchParams;
}

/**
 * Parse pagination params
 */
export function parsePaginationParams(searchParams: URLSearchParams): {
  page: number;
  limit: number;
} {
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '50', 10);

  return {
    page: Math.max(1, page),
    limit: Math.min(100, Math.max(1, limit)), // Max 100 items per page
  };
}

/**
 * Parse date params
 */
export function parseDateParam(dateString: string | null): Date | undefined {
  if (!dateString) return undefined;
  
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? undefined : date;
}
