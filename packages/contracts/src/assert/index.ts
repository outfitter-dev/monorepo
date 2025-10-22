/**
 * Assertion utilities
 *
 * Provides type-safe assertions that return Result types instead of throwing.
 * Enables explicit error handling for invariant checks and validations.
 *
 * @module assert
 */

import type { ErrorCode } from "../error/codes.js";
import { ERROR_CODES } from "../error/codes.js";
import { createError, type ExtendedAppError } from "../error/index.js";
import { err, ok, type Result } from "../result/index.js";

/**
 * Non-empty array type
 *
 * Tuple type representing an array with at least one element.
 * The first element is required, followed by zero or more elements.
 */
export type NonEmptyArray<T> = readonly [T, ...T[]];

/**
 * Assert a condition is true, return Result
 *
 * Checks a boolean condition and returns Ok(void) if true,
 * or an error if false. Use for runtime invariant checks.
 *
 * @param condition - Boolean condition to check
 * @param message - Error message if condition is false
 * @param code - Optional error code (defaults to ASSERTION_FAILED)
 * @returns Result containing void on success, or error
 *
 * @example
 * ```typescript
 * import { assert } from '@outfitter/contracts/assert';
 *
 * const result = assert(x > 0, 'x must be positive');
 * if (result.ok) {
 *   // Condition passed
 * }
 *
 * // With custom error code
 * const result2 = assert(
 *   user.isAdmin,
 *   'User must be admin',
 *   ERROR_CODES.UNAUTHORIZED
 * );
 * ```
 */
export const assert = (
  condition: boolean,
  message: string,
  code?: ErrorCode,
): Result<void, ExtendedAppError> => {
  if (condition) {
    return ok(undefined);
  }

  const errorCode = code ?? ERROR_CODES.ASSERTION_FAILED;
  return err(createError(errorCode, message));
};

/**
 * Assert value is defined (not null/undefined)
 *
 * Type guard that checks if a value is neither null nor undefined.
 * Returns a Result containing the narrowed type on success.
 *
 * @param value - Value to check
 * @param message - Error message if value is null/undefined
 * @returns Result containing defined value or error
 *
 * @example
 * ```typescript
 * import { assertDefined } from '@outfitter/contracts/assert';
 *
 * function processUser(user: User | null): Result<void, ExtendedAppError> {
 *   const result = assertDefined(user, 'User not found');
 *   if (!result.ok) {
 *     return result;
 *   }
 *   // result.value is User (not null)
 *   console.log(result.value.name);
 *   return ok(undefined);
 * }
 *
 * const maybeValue: string | undefined = getValue();
 * const result = assertDefined(maybeValue, 'Value is required');
 * if (result.ok) {
 *   // result.value is string (not undefined)
 *   console.log(result.value.toUpperCase());
 * }
 * ```
 */
export const assertDefined = <T>(
  value: T | null | undefined,
  message: string,
): Result<T, ExtendedAppError> => {
  if (value !== null && value !== undefined) {
    return ok(value);
  }

  return err(createError(ERROR_CODES.ASSERTION_FAILED, message));
};

/**
 * Assert array is non-empty
 *
 * Type guard that checks if an array has at least one element.
 * Returns a Result containing the NonEmptyArray type on success.
 *
 * @param array - Array to check
 * @param message - Error message if array is empty
 * @returns Result containing non-empty array or error
 *
 * @example
 * ```typescript
 * import { assertNonEmpty } from '@outfitter/contracts/assert';
 *
 * function processItems(items: string[]): Result<void, ExtendedAppError> {
 *   const result = assertNonEmpty(items, 'Items array cannot be empty');
 *   if (!result.ok) {
 *     return result;
 *   }
 *
 *   // result.value is NonEmptyArray<string>
 *   const [first, ...rest] = result.value;
 *   console.log('First item:', first); // Safe - guaranteed to exist
 *
 *   return ok(undefined);
 * }
 *
 * const emptyArray: number[] = [];
 * const result1 = assertNonEmpty(emptyArray, 'Array is empty');
 * // { ok: false, error: {...} }
 *
 * const filledArray = [1, 2, 3];
 * const result2 = assertNonEmpty(filledArray, 'Array is empty');
 * // { ok: true, value: [1, 2, 3] as NonEmptyArray<number> }
 * ```
 */
export const assertNonEmpty = <T>(
  array: readonly T[],
  message: string,
): Result<NonEmptyArray<T>, ExtendedAppError> => {
  if (array.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Type narrowing requires assertion after runtime check
    return ok(array as NonEmptyArray<T>);
  }

  return err(createError(ERROR_CODES.ASSERTION_FAILED, message));
};

/**
 * Assert value matches predicate
 *
 * Generic assertion that checks if a value satisfies a predicate function.
 * Returns the value unchanged if the predicate passes.
 *
 * @param value - Value to check
 * @param predicate - Function that tests the value
 * @param message - Error message if predicate returns false
 * @returns Result containing value or error
 *
 * @example
 * ```typescript
 * import { assertMatches } from '@outfitter/contracts/assert';
 *
 * // Check if number is even
 * const result1 = assertMatches(
 *   42,
 *   (n) => n % 2 === 0,
 *   'Number must be even'
 * );
 * // { ok: true, value: 42 }
 *
 * // Check if string matches pattern
 * const result2 = assertMatches(
 *   'user@example.com',
 *   (s) => s.includes('@'),
 *   'Must be a valid email'
 * );
 *
 * // Check custom business logic
 * const result3 = assertMatches(
 *   user,
 *   (u) => u.age >= 18,
 *   'User must be at least 18 years old'
 * );
 *
 * // Chain multiple assertions
 * import { andThen } from '@outfitter/contracts/result';
 *
 * const result = assertMatches(input, (s) => s.length >= 8, 'Too short')
 *   .ok && andThen(
 *     assertMatches(input, (s) => /[A-Z]/.test(s), 'Must have uppercase'),
 *     (s) => ok(s)
 *   );
 * ```
 */
export const assertMatches = <T>(
  value: T,
  predicate: (v: T) => boolean,
  message: string,
): Result<T, ExtendedAppError> => {
  if (predicate(value)) {
    return ok(value);
  }

  return err(createError(ERROR_CODES.ASSERTION_FAILED, message));
};
