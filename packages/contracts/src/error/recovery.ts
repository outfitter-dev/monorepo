/**
 * Error recovery strategies
 *
 * Provides heuristics for determining if errors are recoverable,
 * retryable, and calculating retry delays with exponential backoff.
 *
 * @module error/recovery
 */

import { categorizeError, type ErrorCategory } from "./categories.js";
import type { ErrorCode } from "./codes.js";

/**
 * Categories that are never recoverable
 *
 * These represent permanent failures that require user intervention
 * or indicate programming errors.
 */
const NON_RECOVERABLE_CATEGORIES: ErrorCategory[] = ["SECURITY", "AUTH", "VALIDATION"];

/**
 * Categories that are typically recoverable
 *
 * These represent transient failures that may succeed on retry.
 */
const RECOVERABLE_CATEGORIES: ErrorCategory[] = ["NETWORK", "TIMEOUT", "RESOURCE"];

/**
 * Check if an error is recoverable
 *
 * Determines whether an error represents a transient failure
 * that might succeed if retried, or a permanent failure requiring
 * intervention.
 *
 * Non-recoverable categories:
 * - SECURITY: Security violations are permanent
 * - AUTH: Authentication failures require user action
 * - VALIDATION: Invalid input won't become valid on retry
 *
 * Recoverable categories:
 * - NETWORK: Connection issues may be temporary
 * - TIMEOUT: May succeed with more time
 * - RESOURCE: Resources may become available
 *
 * @param error - Error object with code property
 * @returns True if the error might be recoverable
 *
 * @example
 * ```typescript
 * import { ERROR_CODES, isRecoverable } from '@outfitter/contracts';
 *
 * const networkError = { code: ERROR_CODES.CONNECTION_REFUSED };
 * console.log(isRecoverable(networkError)); // true
 *
 * const validationError = { code: ERROR_CODES.INVALID_INPUT };
 * console.log(isRecoverable(validationError)); // false
 * ```
 */
export const isRecoverable = (error: { readonly code: ErrorCode }): boolean => {
  const category = categorizeError(error.code);

  // Check non-recoverable categories first
  if (NON_RECOVERABLE_CATEGORIES.includes(category)) {
    return false;
  }

  // Check recoverable categories
  if (RECOVERABLE_CATEGORIES.includes(category)) {
    return true;
  }

  // For other categories (RUNTIME, FILESYSTEM, CONFIGURATION),
  // default to non-recoverable to be safe
  return false;
};

/**
 * Check if an error is retryable
 *
 * Determines whether an operation should be retried based on
 * the error type. An error is retryable if:
 * 1. It is recoverable (transient failure)
 * 2. The category suggests retry would be beneficial
 *
 * This is more restrictive than isRecoverable - all retryable
 * errors are recoverable, but not all recoverable errors should
 * be automatically retried.
 *
 * @param error - Error object with code property
 * @returns True if the operation should be retried
 *
 * @example
 * ```typescript
 * import { ERROR_CODES, isRetryable } from '@outfitter/contracts';
 *
 * const timeout = { code: ERROR_CODES.CONNECTION_TIMEOUT };
 * console.log(isRetryable(timeout)); // true
 *
 * const notFound = { code: ERROR_CODES.FILE_NOT_FOUND };
 * console.log(isRetryable(notFound)); // false
 * ```
 */
export const isRetryable = (error: { readonly code: ErrorCode }): boolean => {
  const category = categorizeError(error.code);

  // Only specific categories are good candidates for automatic retry
  const retryableCategories: ErrorCategory[] = ["NETWORK", "TIMEOUT"];

  return retryableCategories.includes(category);
};

/**
 * Determine if an operation should be retried
 *
 * Combines error retryability with attempt count and maximum
 * retry limits to make a final retry decision.
 *
 * @param error - Error object with code property
 * @param attemptCount - Number of attempts made so far (0-indexed)
 * @param maxAttempts - Maximum number of retry attempts (default: 3)
 * @returns True if the operation should be retried
 *
 * @example
 * ```typescript
 * import { ERROR_CODES, shouldRetry } from '@outfitter/contracts';
 *
 * const error = { code: ERROR_CODES.CONNECTION_TIMEOUT };
 *
 * // First attempt failed
 * console.log(shouldRetry(error, 0)); // true (will retry)
 *
 * // Fourth attempt failed (exceeded default max of 3)
 * console.log(shouldRetry(error, 3)); // false (no more retries)
 *
 * // Custom max attempts
 * console.log(shouldRetry(error, 5, 10)); // true (under limit)
 * ```
 */
export const shouldRetry = (
  error: { readonly code: ErrorCode },
  attemptCount: number,
  maxAttempts = 3,
): boolean => {
  // Check if we've exceeded max attempts
  if (attemptCount >= maxAttempts) {
    return false;
  }

  // Check if error is retryable
  return isRetryable(error);
};

/**
 * Calculate retry delay with exponential backoff
 *
 * Implements exponential backoff with optional jitter to prevent
 * thundering herd problems. The delay increases exponentially with
 * each attempt:
 *
 * - Attempt 1: baseDelay
 * - Attempt 2: baseDelay * 2
 * - Attempt 3: baseDelay * 4
 * - Attempt 4: baseDelay * 8
 *
 * Jitter adds randomness (±10%) to prevent synchronized retries.
 *
 * @param attemptCount - Number of attempts made so far (0-indexed)
 * @param baseDelay - Base delay in milliseconds (default: 1000)
 * @param maxDelay - Maximum delay cap in milliseconds (default: 30000)
 * @param useJitter - Whether to add random jitter (default: true)
 * @returns Delay in milliseconds before next retry
 *
 * @example
 * ```typescript
 * import { getRetryDelay } from '@outfitter/contracts';
 *
 * // First retry: ~1000ms (with jitter: 900-1100ms)
 * console.log(getRetryDelay(0));
 *
 * // Second retry: ~2000ms (with jitter: 1800-2200ms)
 * console.log(getRetryDelay(1));
 *
 * // Third retry: ~4000ms (with jitter: 3600-4400ms)
 * console.log(getRetryDelay(2));
 *
 * // Custom settings, no jitter
 * const delay = getRetryDelay(2, 500, 10000, false);
 * console.log(delay); // 2000 (exactly)
 * ```
 */
export const getRetryDelay = (
  attemptCount: number,
  options: {
    baseDelay?: number;
    maxDelay?: number;
    useJitter?: boolean;
  } = {},
): number => {
  const { baseDelay = 1000, maxDelay = 30_000, useJitter = true } = options;

  // Calculate exponential backoff: baseDelay * 2^attemptCount
  const exponentialDelay = baseDelay * 2 ** attemptCount;

  // Cap at maxDelay
  const clampedDelay = Math.min(exponentialDelay, maxDelay);

  // Add jitter if requested (±10%)
  if (useJitter) {
    const jitterFactor = 0.1;
    const jitter = clampedDelay * jitterFactor * (Math.random() * 2 - 1);
    return Math.floor(clampedDelay + jitter);
  }

  return clampedDelay;
};

/**
 * Calculate backoff delay with custom multiplier
 *
 * More flexible version of getRetryDelay that allows custom
 * backoff multipliers instead of just exponential (2^n).
 *
 * @param attemptCount - Number of attempts made so far (0-indexed)
 * @param baseDelay - Base delay in milliseconds
 * @param multiplier - Backoff multiplier (default: 2)
 * @param maxDelay - Maximum delay cap in milliseconds
 * @param useJitter - Whether to add random jitter
 * @returns Delay in milliseconds before next retry
 *
 * @example
 * ```typescript
 * import { getBackoffDelay } from '@outfitter/contracts';
 *
 * // Exponential backoff (default)
 * console.log(getBackoffDelay(2, 1000, 2)); // ~4000ms
 *
 * // Linear backoff (multiplier = 1)
 * console.log(getBackoffDelay(2, 1000, 1)); // ~3000ms
 *
 * // Aggressive backoff (multiplier = 3)
 * console.log(getBackoffDelay(2, 1000, 3)); // ~9000ms
 * ```
 */
export const getBackoffDelay = (
  attemptCount: number,
  options: {
    baseDelay: number;
    multiplier?: number;
    maxDelay?: number;
    useJitter?: boolean;
  },
): number => {
  const { baseDelay, multiplier = 2, maxDelay = 30_000, useJitter = true } = options;

  // Calculate delay: baseDelay * (1 + attemptCount * multiplier)
  const calculatedDelay = baseDelay * multiplier ** attemptCount;

  // Cap at maxDelay
  const clampedDelay = Math.min(calculatedDelay, maxDelay);

  // Add jitter if requested (±10%)
  if (useJitter) {
    const jitterFactor = 0.1;
    const jitter = clampedDelay * jitterFactor * (Math.random() * 2 - 1);
    return Math.floor(clampedDelay + jitter);
  }

  return clampedDelay;
};

/**
 * Get recommended max retry attempts for an error
 *
 * Returns a recommended maximum number of retry attempts based
 * on the error category:
 * - Network errors: 3 retries
 * - Timeout errors: 2 retries
 * - Resource errors: 5 retries (resources may need time to free up)
 * - Others: 0 retries (not retryable)
 *
 * @param error - Error object with code property
 * @returns Recommended max retry attempts
 *
 * @example
 * ```typescript
 * import { ERROR_CODES, getMaxRetryAttempts } from '@outfitter/contracts';
 *
 * const network = { code: ERROR_CODES.CONNECTION_REFUSED };
 * console.log(getMaxRetryAttempts(network)); // 3
 *
 * const timeout = { code: ERROR_CODES.OPERATION_TIMEOUT };
 * console.log(getMaxRetryAttempts(timeout)); // 2
 *
 * const validation = { code: ERROR_CODES.INVALID_INPUT };
 * console.log(getMaxRetryAttempts(validation)); // 0
 * ```
 */
export const getMaxRetryAttempts = (error: { readonly code: ErrorCode }): number => {
  const category = categorizeError(error.code);

  // Only specific categories are retryable
  // eslint-disable-next-line @typescript-eslint/switch-exhaustiveness-check
  switch (category) {
    case "NETWORK": {
      return 3;
    }
    case "TIMEOUT": {
      return 2;
    }
    case "RESOURCE": {
      return 5;
    }
    default: {
      return 0;
    }
  }
};
