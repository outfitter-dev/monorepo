import type { AppError } from '../error';
import { ErrorCode } from '../error';

/**
 * User-friendly error messages for each error code.
 * These messages are suitable for display in UI components.
 */
const errorMessages: Record<ErrorCode, string> = {
  [ErrorCode.VALIDATION_ERROR]: 'Please check your input and try again.',
  [ErrorCode.NOT_FOUND]: 'The requested resource was not found.',
  [ErrorCode.UNAUTHORIZED]: 'Please log in to continue.',
  [ErrorCode.FORBIDDEN]: "You don't have permission to access this resource.",
  [ErrorCode.CONFLICT]: 'A conflict occurred. Please refresh and try again.',
  [ErrorCode.INTERNAL_ERROR]: 'An unexpected error occurred. Please try again.',
  [ErrorCode.EXTERNAL_SERVICE_ERROR]:
    'External service is unavailable. Please try again later.',
  [ErrorCode.RATE_LIMIT_EXCEEDED]:
    'Too many requests. Please wait a moment and try again.',
};

/**
 * Convert an AppError to a user-friendly message suitable for display in UI.
 * Falls back to the error's message if no specific user-friendly message exists.
 *
 * @param error - The AppError to humanize
 * @returns A user-friendly error message
 *
 * @example
 * ```ts
 * const error = makeError(ErrorCode.AUTH_EXPIRED, 'Token expired at 2024-01-01');
 * const message = humanize(error); // "Your session has expired. Please log in again."
 * ```
 */
export function humanize(error: AppError): string {
  // Use the predefined user-friendly message if available
  const friendlyMessage = errorMessages[error.code];
  if (friendlyMessage) {
    return friendlyMessage;
  }

  // For custom error codes or missing messages, use a sanitized version of the error message
  // Remove technical details that might confuse users
  const sanitized = error.message
    .replace(/\b(error|exception|stack|trace)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  // If the message is too technical or empty after sanitization, use a generic message
  if (!sanitized || sanitized.length < 5) {
    return 'An error occurred. Please try again.';
  }

  return sanitized;
}

/**
 * Convert an AppError to a detailed message suitable for developers/logs.
 * Includes error code, message, and relevant details.
 *
 * @param error - The AppError to format
 * @returns A detailed error message for debugging
 */
export function formatForDevelopers(error: AppError): string {
  const parts = [`[${error.code}] ${error.message}`];

  if (error.details && Object.keys(error.details).length > 0) {
    parts.push(`Details: ${JSON.stringify(error.details, null, 2)}`);
  }

  if (error.originalError) {
    parts.push(`Cause: ${error.originalError.message}`);
  }

  return parts.join('\n');
}
