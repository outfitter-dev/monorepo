import type { AppError } from '../error';
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
export declare function humanize(error: AppError): string;
/**
 * Convert an AppError to a detailed message suitable for developers/logs.
 * Includes error code, message, and relevant details.
 *
 * @param error - The AppError to format
 * @returns A detailed error message for debugging
 */
export declare function formatForDevelopers(error: AppError): string;
//# sourceMappingURL=humanize.d.ts.map
