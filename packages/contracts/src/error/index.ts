/**
 * Error handling contracts
 *
 * Provides type-safe error definitions with comprehensive metadata,
 * categorization, and recovery heuristics.
 *
 * @module error
 */

import {
  categorizeError,
  type ErrorCategory,
  type ErrorSeverity,
  getSeverity,
} from "./categories.js";
import { ERROR_CODES, type ErrorCode, isErrorCode } from "./codes.js";
import { isRecoverable, isRetryable } from "./recovery.js";

// Re-export all types and utilities
export type { ErrorCategory, ErrorSeverity } from "./categories.js";
export {
  categorizeError,
  getCategoriesBySeverity,
  getSeverity,
  getSeverityForCode,
  isCriticalCategory,
} from "./categories.js";
export type { ErrorCode } from "./codes.js";
export { ERROR_CODES, getCodeCategory, isErrorCode, isInCategory } from "./codes.js";
export {
  getBackoffDelay,
  getMaxRetryAttempts,
  getRetryDelay,
  isRecoverable,
  isRetryable,
  shouldRetry,
} from "./recovery.js";

/**
 * Base error interface
 *
 * Minimal error contract with just code, message, and name.
 * All custom errors must at least satisfy this interface.
 *
 * @example
 * ```typescript
 * import type { AppError } from '@outfitter/contracts';
 *
 * const error: AppError = {
 *   code: 1000,
 *   message: 'Invalid input provided',
 *   name: 'ValidationError',
 * };
 * ```
 */
export interface AppError {
  /** Numeric error code for programmatic handling */
  readonly code: number;
  /** Human-readable error message */
  readonly message: string;
  /** Error name (typically the error class name) */
  readonly name: string;
  /** Optional underlying cause */
  readonly cause?: Error;
}

/**
 * Extended error interface with full metadata
 *
 * Comprehensive error contract with categorization, severity,
 * correlation tracking, and recovery metadata.
 *
 * @example
 * ```typescript
 * import { ERROR_CODES, type ExtendedAppError } from '@outfitter/contracts';
 *
 * const error: ExtendedAppError = {
 *   code: ERROR_CODES.CONNECTION_TIMEOUT,
 *   message: 'Connection timed out after 30s',
 *   name: 'NetworkError',
 *   severity: 'ERROR',
 *   category: 'NETWORK',
 *   correlationId: 'req-123-abc',
 *   timestamp: Date.now(),
 *   isRecoverable: true,
 *   isRetryable: true,
 * };
 * ```
 */
export interface ExtendedAppError extends AppError {
  /** Error severity level (CRITICAL, ERROR, WARNING, INFO) */
  readonly severity: ErrorSeverity;
  /** Error category for systematic classification */
  readonly category: ErrorCategory;
  /** Unique ID for tracking this error across systems */
  readonly correlationId: string;
  /** Timestamp when the error occurred (milliseconds since epoch) */
  readonly timestamp: number;
  /** Whether the error might be recoverable */
  readonly isRecoverable: boolean;
  /** Whether the operation should be retried */
  readonly isRetryable: boolean;
}

/**
 * Generate a correlation ID
 *
 * Creates a unique identifier for tracking errors across systems.
 * Uses a simple timestamp-based approach with random suffix.
 *
 * @returns Unique correlation ID
 *
 * @internal
 */
const generateCorrelationId = (): string => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 9);
  return `err-${timestamp}-${random}`;
};

/**
 * Create an error object
 *
 * Factory function for creating ExtendedAppError objects with
 * automatic category detection, severity assignment, and recovery
 * heuristics.
 *
 * @param code - Error code from ERROR_CODES
 * @param message - Human-readable error message
 * @param options - Additional error options
 * @returns Fully populated ExtendedAppError
 *
 * @example
 * ```typescript
 * import { ERROR_CODES, createError } from '@outfitter/contracts';
 *
 * // Minimal usage - category and severity auto-detected
 * const error = createError(
 *   ERROR_CODES.INVALID_INPUT,
 *   'Email format is invalid'
 * );
 *
 * // With cause and correlation ID
 * const error2 = createError(
 *   ERROR_CODES.CONNECTION_REFUSED,
 *   'Failed to connect to database',
 *   {
 *     cause: originalError,
 *     correlationId: 'req-123',
 *   }
 * );
 *
 * // Override severity
 * const error3 = createError(
 *   ERROR_CODES.FILE_NOT_FOUND,
 *   'Config file not found',
 *   {
 *     severity: 'CRITICAL', // Override default
 *   }
 * );
 * ```
 */
export const createError = (
  code: ErrorCode,
  message: string,
  options?: {
    readonly cause?: Error;
    readonly correlationId?: string;
    readonly severity?: ErrorSeverity;
    readonly name?: string;
  },
): ExtendedAppError => {
  const category = categorizeError(code);
  const severity = options?.severity ?? getSeverity(category);
  const correlationId = options?.correlationId ?? generateCorrelationId();
  const name = options?.name ?? `${category}Error`;

  const errorObj: ExtendedAppError = {
    code,
    message,
    name,
    ...(options?.cause ? { cause: options.cause } : {}),
    severity,
    category,
    correlationId,
    timestamp: Date.now(),
    isRecoverable: isRecoverable({ code }),
    isRetryable: isRetryable({ code }),
  };

  return errorObj;
};

/**
 * Create error from code only
 *
 * Convenience function for creating errors when you only have a code.
 * Generates a generic message based on the category.
 *
 * @param code - Error code from ERROR_CODES
 * @param options - Additional error options
 * @returns ExtendedAppError with generic message
 *
 * @example
 * ```typescript
 * import { ERROR_CODES, createErrorFromCode } from '@outfitter/contracts';
 *
 * const error = createErrorFromCode(ERROR_CODES.CONNECTION_TIMEOUT);
 * console.log(error.message); // "NETWORK error occurred"
 * ```
 */
export const createErrorFromCode = (
  code: ErrorCode,
  options?: {
    readonly cause?: Error;
    readonly correlationId?: string;
    readonly severity?: ErrorSeverity;
  },
): ExtendedAppError => {
  const category = categorizeError(code);
  const message = `${category} error occurred`;

  return createError(code, message, options);
};

/**
 * Check if an object is an AppError
 *
 * Type guard to check if an unknown value conforms to the AppError interface.
 *
 * @param value - Value to check
 * @returns True if value is an AppError
 *
 * @example
 * ```typescript
 * import { isAppError } from '@outfitter/contracts';
 *
 * function handleError(error: unknown): void {
 *   if (isAppError(error)) {
 *     console.log('Error code:', error.code);
 *     console.log('Message:', error.message);
 *   }
 * }
 * ```
 */
export const isAppError = (value: unknown): value is AppError => {
  return (
    typeof value === "object" &&
    value !== null &&
    "code" in value &&
    typeof value.code === "number" &&
    "message" in value &&
    typeof value.message === "string" &&
    "name" in value &&
    typeof value.name === "string"
  );
};

/**
 * Check if an object is an ExtendedAppError
 *
 * Type guard to check if an unknown value conforms to the ExtendedAppError interface.
 *
 * @param value - Value to check
 * @returns True if value is an ExtendedAppError
 *
 * @example
 * ```typescript
 * import { isExtendedAppError } from '@outfitter/contracts';
 *
 * function handleError(error: unknown): void {
 *   if (isExtendedAppError(error)) {
 *     console.log('Severity:', error.severity);
 *     console.log('Category:', error.category);
 *     console.log('Retryable:', error.isRetryable);
 *   }
 * }
 * ```
 */
export const isExtendedAppError = (value: unknown): value is ExtendedAppError => {
  return (
    isAppError(value) &&
    "severity" in value &&
    typeof value.severity === "string" &&
    "category" in value &&
    typeof value.category === "string" &&
    "correlationId" in value &&
    typeof value.correlationId === "string" &&
    "timestamp" in value &&
    typeof value.timestamp === "number" &&
    "isRecoverable" in value &&
    typeof value.isRecoverable === "boolean" &&
    "isRetryable" in value &&
    typeof value.isRetryable === "boolean"
  );
};

/**
 * Convert a generic Error to an AppError
 *
 * Converts standard JavaScript Error objects into AppError format.
 * Assigns RUNTIME category and INTERNAL_ERROR code by default.
 *
 * @param error - Standard Error object
 * @param code - Optional error code (defaults to INTERNAL_ERROR)
 * @returns ExtendedAppError
 *
 * @example
 * ```typescript
 * import { ERROR_CODES, fromError } from '@outfitter/contracts';
 *
 * try {
 *   throw new Error('Something went wrong');
 * } catch (error) {
 *   const appError = fromError(error as Error);
 *   console.log(appError.code); // 2019 (INTERNAL_ERROR)
 *
 *   // Or with specific code
 *   const appError2 = fromError(
 *     error as Error,
 *     ERROR_CODES.RUNTIME_EXCEPTION
 *   );
 * }
 * ```
 */
export const fromError = (
  error: Error,
  code: ErrorCode = ERROR_CODES.INTERNAL_ERROR,
): ExtendedAppError => {
  return createError(code, error.message, {
    cause: error,
    name: error.name,
  });
};

/**
 * Convert unknown error to AppError
 *
 * Safely converts any thrown value (Error, string, etc.) into an AppError.
 * Handles all common error types gracefully.
 *
 * @param error - Unknown error value
 * @param code - Optional error code (defaults to UNKNOWN_ERROR)
 * @returns ExtendedAppError
 *
 * @example
 * ```typescript
 * import { toAppError } from '@outfitter/contracts';
 *
 * try {
 *   throw 'string error';
 * } catch (error) {
 *   const appError = toAppError(error);
 *   console.log(appError.message); // "string error"
 * }
 *
 * try {
 *   throw new Error('real error');
 * } catch (error) {
 *   const appError = toAppError(error);
 *   console.log(appError.message); // "real error"
 * }
 * ```
 */
export const toAppError = (
  error: unknown,
  code: ErrorCode = ERROR_CODES.UNKNOWN_ERROR,
): ExtendedAppError => {
  // Already an AppError
  if (isExtendedAppError(error)) {
    return error;
  }

  if (isAppError(error)) {
    // If it's already an AppError but not ErrorCode, treat as generic error
    const errorCode = isErrorCode(error.code) ? error.code : ERROR_CODES.UNKNOWN_ERROR;

    const options: {
      cause?: Error;
      name?: string;
    } = { name: error.name };

    if (error.cause) {
      options.cause = error.cause;
    }

    return createError(errorCode, error.message, options);
  }

  // Standard Error object
  if (error instanceof Error) {
    return fromError(error, code);
  }

  // String error
  if (typeof error === "string") {
    return createError(code, error);
  }

  // Object with message property
  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return createError(code, error.message);
  }

  // Unknown error type - stringify it
  return createError(code, String(error));
};

/**
 * Format error for logging
 *
 * Creates a structured log-friendly representation of an error.
 *
 * @param error - Error to format
 * @returns Log-friendly error object
 *
 * @example
 * ```typescript
 * import { createError, ERROR_CODES, formatErrorForLog } from '@outfitter/contracts';
 *
 * const error = createError(ERROR_CODES.CONNECTION_TIMEOUT, 'Timeout');
 * const logEntry = formatErrorForLog(error);
 *
 * console.log(JSON.stringify(logEntry, null, 2));
 * // {
 * //   "message": "Timeout",
 * //   "code": 3001,
 * //   "category": "NETWORK",
 * //   "severity": "ERROR",
 * //   "correlationId": "err-...",
 * //   "timestamp": 1234567890,
 * //   "isRecoverable": true,
 * //   "isRetryable": true
 * // }
 * ```
 */
export const formatErrorForLog = (
  error: ExtendedAppError,
): {
  readonly message: string;
  readonly code: number;
  readonly category: ErrorCategory;
  readonly severity: ErrorSeverity;
  readonly correlationId: string;
  readonly timestamp: number;
  readonly isRecoverable: boolean;
  readonly isRetryable: boolean;
  readonly cause?: string;
} => {
  return {
    message: error.message,
    code: error.code,
    category: error.category,
    severity: error.severity,
    correlationId: error.correlationId,
    timestamp: error.timestamp,
    isRecoverable: error.isRecoverable,
    isRetryable: error.isRetryable,
    ...(error.cause?.message ? { cause: error.cause.message } : {}),
  };
};
