/**
 * Result type contracts
 *
 * Type-safe result handling inspired by Rust's Result<T, E>.
 * Enables explicit error handling without exceptions.
 *
 * @module result
 */

import type { AppError } from "../error/index.js";

/**
 * Result type - discriminated union for success/failure
 *
 * Represents the result of an operation that can either succeed
 * with a value of type T, or fail with an error of type E.
 *
 * This is a discriminated union with the `ok` property as the discriminator:
 * - `{ ok: true, value: T }` represents success
 * - `{ ok: false, error: E }` represents failure
 *
 * @typeParam T - The success value type
 * @typeParam E - The error type (defaults to AppError)
 *
 * @example
 * ```typescript
 * import type { Result } from '@outfitter/contracts';
 *
 * function divide(a: number, b: number): Result<number> {
 *   if (b === 0) {
 *     return { ok: false, error: { code: 2012, message: 'Division by zero', name: 'MathError' } };
 *   }
 *   return { ok: true, value: a / b };
 * }
 *
 * const result = divide(10, 2);
 * if (result.ok) {
 *   console.log('Success:', result.value); // TypeScript knows `value` exists
 * } else {
 *   console.log('Error:', result.error); // TypeScript knows `error` exists
 * }
 * ```
 */
export type Result<T, E = AppError> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E };

/**
 * Create a successful result
 *
 * @param value - The success value
 * @returns A Result representing success
 *
 * @example
 * ```typescript
 * import { ok } from '@outfitter/contracts';
 *
 * const result = ok(42);
 * console.log(result); // { ok: true, value: 42 }
 * ```
 */
export const ok = <T>(value: T): Result<T, never> => {
  return { ok: true, value };
};

/**
 * Create a failed result
 *
 * @param error - The error value
 * @returns A Result representing failure
 *
 * @example
 * ```typescript
 * import { err, ERROR_CODES } from '@outfitter/contracts';
 *
 * const result = err({
 *   code: ERROR_CODES.INVALID_INPUT,
 *   message: 'Invalid email',
 *   name: 'ValidationError',
 * });
 * console.log(result); // { ok: false, error: {...} }
 * ```
 */
export const err = <E>(error: E): Result<never, E> => {
  return { ok: false, error };
};

/**
 * Type guard - check if result is Ok
 *
 * @param result - Result to check
 * @returns True if result is Ok
 *
 * @example
 * ```typescript
 * import { ok, isOk } from '@outfitter/contracts';
 *
 * const result = ok(42);
 * if (isOk(result)) {
 *   console.log(result.value); // 42 - TypeScript knows value exists
 * }
 * ```
 */
export const isOk = <T, E>(
  result: Result<T, E>,
): result is { readonly ok: true; readonly value: T } => {
  return result.ok;
};

/**
 * Type guard - check if result is Err
 *
 * @param result - Result to check
 * @returns True if result is Err
 *
 * @example
 * ```typescript
 * import { err, isErr, ERROR_CODES } from '@outfitter/contracts';
 *
 * const result = err({
 *   code: ERROR_CODES.INVALID_INPUT,
 *   message: 'Bad input',
 *   name: 'ValidationError',
 * });
 *
 * if (isErr(result)) {
 *   console.log(result.error); // TypeScript knows error exists
 * }
 * ```
 */
export const isErr = <T, E>(
  result: Result<T, E>,
): result is { readonly ok: false; readonly error: E } => {
  return !result.ok;
};

/**
 * Unwrap a result, throwing if it's an error
 *
 * Extracts the value from an Ok result, or throws an error if
 * the result is Err. Use with caution - prefer pattern matching
 * with isOk/isErr for safer code.
 *
 * @param result - Result to unwrap
 * @returns The success value
 * @throws Error if result is Err
 *
 * @example
 * ```typescript
 * import { ok, unwrap } from '@outfitter/contracts';
 *
 * const result = ok(42);
 * const value = unwrap(result);
 * console.log(value); // 42
 *
 * const errorResult = err({ code: 1000, message: 'Error', name: 'Error' });
 * unwrap(errorResult); // Throws Error!
 * ```
 */
export const unwrap = <T, E>(result: Result<T, E>): T => {
  if (result.ok) {
    return result.value;
  }
  throw new Error(`Called unwrap on an Err value: ${JSON.stringify(result.error)}`);
};

/**
 * Unwrap a result with a default value
 *
 * Extracts the value from an Ok result, or returns the default
 * value if the result is Err. Safe alternative to unwrap().
 *
 * @param result - Result to unwrap
 * @param defaultValue - Default value if result is Err
 * @returns The success value or default value
 *
 * @example
 * ```typescript
 * import { ok, err, unwrapOr } from '@outfitter/contracts';
 *
 * const okResult = ok(42);
 * console.log(unwrapOr(okResult, 0)); // 42
 *
 * const errResult = err({ code: 1000, message: 'Error', name: 'Error' });
 * console.log(unwrapOr(errResult, 0)); // 0
 * ```
 */
export const unwrapOr = <T, E>(result: Result<T, E>, defaultValue: T): T => {
  return result.ok ? result.value : defaultValue;
};

/**
 * Unwrap a result with a default function
 *
 * Extracts the value from an Ok result, or calls the default
 * function with the error to compute a value if the result is Err.
 *
 * @param result - Result to unwrap
 * @param defaultFn - Function to compute default value from error
 * @returns The success value or computed default
 *
 * @example
 * ```typescript
 * import { ok, err, unwrapOrElse } from '@outfitter/contracts';
 *
 * const okResult = ok(42);
 * console.log(unwrapOrElse(okResult, (e) => 0)); // 42
 *
 * const errResult = err({ code: 1000, message: 'Error', name: 'Error' });
 * console.log(unwrapOrElse(errResult, (e) => e.code)); // 1000
 * ```
 */
export const unwrapOrElse = <T, E>(result: Result<T, E>, defaultFn: (error: E) => T): T => {
  return result.ok ? result.value : defaultFn(result.error);
};

/**
 * Map a Result's success value
 *
 * Transforms the success value using the provided function,
 * leaving error values unchanged. This is a functor operation.
 *
 * @param result - Result to map
 * @param fn - Function to transform the success value
 * @returns New Result with transformed value
 *
 * @example
 * ```typescript
 * import { ok, err, map } from '@outfitter/contracts';
 *
 * const result = ok(5);
 * const doubled = map(result, x => x * 2);
 * console.log(doubled); // { ok: true, value: 10 }
 *
 * const errorResult = err({ code: 1000, message: 'Error', name: 'Error' });
 * const mapped = map(errorResult, x => x * 2);
 * console.log(mapped); // { ok: false, error: {...} } - unchanged
 * ```
 */
export const map = <T, U, E>(result: Result<T, E>, fn: (value: T) => U): Result<U, E> => {
  return result.ok ? ok(fn(result.value)) : result;
};

/**
 * Map a Result's error value
 *
 * Transforms the error value using the provided function,
 * leaving success values unchanged.
 *
 * @param result - Result to map
 * @param fn - Function to transform the error value
 * @returns New Result with transformed error
 *
 * @example
 * ```typescript
 * import { ok, err, mapErr, ERROR_CODES } from '@outfitter/contracts';
 *
 * const error = err({ code: ERROR_CODES.INVALID_INPUT, message: 'Bad', name: 'Error' });
 * const mapped = mapErr(error, e => ({
 *   ...e,
 *   message: `Validation failed: ${e.message}`,
 * }));
 *
 * const okResult = ok(42);
 * const mapped2 = mapErr(okResult, e => ({ ...e, message: 'New' }));
 * console.log(mapped2); // { ok: true, value: 42 } - unchanged
 * ```
 */
export const mapErr = <T, E, F>(result: Result<T, E>, fn: (error: E) => F): Result<T, F> => {
  return result.ok ? result : err(fn(result.error));
};

/**
 * Chain Results together (flatMap/bind)
 *
 * Applies a function that returns a Result to the success value
 * of another Result. This enables chaining multiple operations
 * that can fail.
 *
 * @param result - Result to chain from
 * @param fn - Function that takes success value and returns a new Result
 * @returns The Result returned by fn, or original error
 *
 * @example
 * ```typescript
 * import { ok, err, andThen, ERROR_CODES } from '@outfitter/contracts';
 *
 * function parseNumber(s: string): Result<number> {
 *   const n = Number(s);
 *   if (Number.isNaN(n)) {
 *     return err({ code: ERROR_CODES.PARSE_ERROR, message: 'Not a number', name: 'ParseError' });
 *   }
 *   return ok(n);
 * }
 *
 * function divide(a: number, b: number): Result<number> {
 *   if (b === 0) {
 *     return err({ code: ERROR_CODES.DIVISION_BY_ZERO, message: 'Div by zero', name: 'MathError' });
 *   }
 *   return ok(a / b);
 * }
 *
 * const result = andThen(parseNumber('10'), n => divide(n, 2));
 * console.log(result); // { ok: true, value: 5 }
 * ```
 */
export const andThen = <T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => Result<U, E>,
): Result<U, E> => {
  return result.ok ? fn(result.value) : result;
};

/**
 * Combine Results with OR logic
 *
 * Returns the first Ok result, or the second result if the first is Err.
 *
 * @param result - First result to try
 * @param other - Fallback result
 * @returns First Ok result or the fallback
 *
 * @example
 * ```typescript
 * import { ok, err, orElse } from '@outfitter/contracts';
 *
 * const error1 = err({ code: 1000, message: 'Error 1', name: 'Error' });
 * const success = ok(42);
 *
 * console.log(orElse(error1, success)); // { ok: true, value: 42 }
 * console.log(orElse(success, error1)); // { ok: true, value: 42 }
 * ```
 */
export const orElse = <T, E, F>(result: Result<T, E>, other: Result<T, F>): Result<T, F> => {
  return result.ok ? result : other;
};

/**
 * Match on a Result
 *
 * Pattern matching for Results. Executes one of two functions
 * based on whether the Result is Ok or Err.
 *
 * @param result - Result to match on
 * @param branches - Object with ok and err handler functions
 * @returns The return value of the executed handler
 *
 * @example
 * ```typescript
 * import { ok, err, match } from '@outfitter/contracts';
 *
 * const result = ok(42);
 * const message = match(result, {
 *   ok: (value) => `Success: ${value}`,
 *   err: (error) => `Failed: ${error.message}`,
 * });
 * console.log(message); // "Success: 42"
 *
 * const errorResult = err({ code: 1000, message: 'Bad input', name: 'Error' });
 * const errorMessage = match(errorResult, {
 *   ok: (value) => `Success: ${value}`,
 *   err: (error) => `Failed: ${error.message}`,
 * });
 * console.log(errorMessage); // "Failed: Bad input"
 * ```
 */
export const match = <T, E, R>(
  result: Result<T, E>,
  branches: {
    readonly ok: (value: T) => R;
    readonly err: (error: E) => R;
  },
): R => {
  return result.ok ? branches.ok(result.value) : branches.err(result.error);
};

/**
 * Collect an array of Results into a Result of array
 *
 * Takes an array of Results and combines them into a single Result.
 * If all Results are Ok, returns Ok with an array of all values.
 * If any Result is Err, returns the first error encountered.
 *
 * @param results - Array of Results to collect
 * @returns Result containing array of values, or first error
 *
 * @example
 * ```typescript
 * import { ok, err, collect } from '@outfitter/contracts';
 *
 * const allOk = collect([ok(1), ok(2), ok(3)]);
 * console.log(allOk); // { ok: true, value: [1, 2, 3] }
 *
 * const hasError = collect([ok(1), err({ code: 1000, message: 'Error', name: 'Error' }), ok(3)]);
 * console.log(hasError); // { ok: false, error: {...} }
 * ```
 */
export const collect = <T, E>(results: readonly Result<T, E>[]): Result<T[], E> => {
  const values: T[] = [];

  for (const result of results) {
    if (!result.ok) {
      return result;
    }
    values.push(result.value);
  }

  return ok(values);
};

/**
 * Try to execute a function and return a Result
 *
 * Wraps a potentially-throwing function in a Result.
 * Catches any thrown errors and converts them to Err results.
 *
 * @param fn - Function to execute
 * @param errorMapper - Optional function to map caught errors
 * @returns Result of the function execution
 *
 * @example
 * ```typescript
 * import { tryCatch, ERROR_CODES } from '@outfitter/contracts';
 *
 * const result = tryCatch(() => {
 *   return JSON.parse('{"valid": "json"}');
 * });
 * console.log(result); // { ok: true, value: {valid: 'json'} }
 *
 * const errorResult = tryCatch(
 *   () => JSON.parse('invalid json'),
 *   (error) => ({
 *     code: ERROR_CODES.PARSE_ERROR,
 *     message: error instanceof Error ? error.message : 'Parse failed',
 *     name: 'ParseError',
 *   })
 * );
 * console.log(errorResult); // { ok: false, error: {...} }
 * ```
 */
export const tryCatch = <T, E = AppError>(
  fn: () => T,
  errorMapper?: (error: unknown) => E,
): Result<T, E> => {
  try {
    return ok(fn());
  } catch (error) {
    const mappedError = errorMapper
      ? errorMapper(error)
      : // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
        ({
          code: 2019,
          message: error instanceof Error ? error.message : String(error),
          name: "RuntimeError",
        } as E);

    return err(mappedError);
  }
};

/**
 * Async version of tryCatch
 *
 * Wraps an async function in a Result, catching any thrown errors
 * or rejected promises.
 *
 * @param fn - Async function to execute
 * @param errorMapper - Optional function to map caught errors
 * @returns Promise resolving to Result
 *
 * @example
 * ```typescript
 * import { tryCatchAsync, ERROR_CODES } from '@outfitter/contracts';
 *
 * const result = await tryCatchAsync(async () => {
 *   const response = await fetch('https://api.example.com');
 *   return response.json();
 * });
 *
 * if (result.ok) {
 *   console.log('Data:', result.value);
 * } else {
 *   console.error('Error:', result.error);
 * }
 * ```
 */
export const tryCatchAsync = async <T, E = AppError>(
  fn: () => Promise<T>,
  errorMapper?: (error: unknown) => E,
): Promise<Result<T, E>> => {
  try {
    const value = await fn();
    return ok(value);
  } catch (error) {
    const mappedError = errorMapper
      ? errorMapper(error)
      : // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
        ({
          code: 2019,
          message: error instanceof Error ? error.message : String(error),
          name: "RuntimeError",
        } as E);

    return err(mappedError);
  }
};

/**
 * Sequences an array of Results, collecting all successes or returning first error
 *
 * Processes Results sequentially, collecting all success values into an array.
 * Returns the first error encountered, short-circuiting the rest.
 *
 * @param results - Array of Results to sequence
 * @returns Result containing array of all values, or first error
 *
 * @example
 * ```typescript
 * import { ok, err, sequence } from '@outfitter/contracts';
 *
 * const allOk = sequence([ok(1), ok(2), ok(3)]);
 * console.log(allOk); // { ok: true, value: [1, 2, 3] }
 *
 * const hasError = sequence([ok(1), err({ code: 1000, message: 'Error', name: 'Error' }), ok(3)]);
 * console.log(hasError); // { ok: false, error: {...} }
 * ```
 */
export const sequence = <T, E>(results: readonly Result<T, E>[]): Result<T[], E> => {
  return collect(results);
};

/**
 * Like sequence but processes Results in parallel (same semantics, different name for clarity)
 *
 * Conceptually processes Results in parallel, though the actual implementation
 * is identical to sequence since Results are already evaluated. The name signals
 * intent for async operations that were run in parallel before being sequenced.
 *
 * @param results - Array of Results to process in parallel
 * @returns Result containing array of all values, or first error
 *
 * @example
 * ```typescript
 * import { ok, err, parallel } from '@outfitter/contracts';
 *
 * // Process multiple async operations in parallel, then sequence their results
 * const results = await Promise.all([
 *   fetchUser(1),
 *   fetchUser(2),
 *   fetchUser(3),
 * ]);
 * const combined = parallel(results);
 * ```
 */
export const parallel = <T, E>(results: readonly Result<T, E>[]): Result<T[], E> => {
  return collect(results);
};

/**
 * Partitions Results into successes and failures
 *
 * Separates an array of Results into two arrays: one containing all
 * success values, and one containing all error values.
 *
 * @param results - Array of Results to partition
 * @returns Object with successes and failures arrays
 *
 * @example
 * ```typescript
 * import { ok, err, partition } from '@outfitter/contracts';
 *
 * const results = [
 *   ok(1),
 *   err({ code: 1000, message: 'Error 1', name: 'Error' }),
 *   ok(3),
 *   err({ code: 1001, message: 'Error 2', name: 'Error' }),
 * ];
 *
 * const { successes, failures } = partition(results);
 * console.log(successes); // [1, 3]
 * console.log(failures); // [{ code: 1000, ... }, { code: 1001, ... }]
 * ```
 */
export const partition = <T, E>(
  results: readonly Result<T, E>[],
): {
  readonly successes: T[];
  readonly failures: E[];
} => {
  const successes: T[] = [];
  const failures: E[] = [];

  for (const result of results) {
    if (result.ok) {
      successes.push(result.value);
    } else {
      failures.push(result.error);
    }
  }

  return { successes, failures };
};

/**
 * Combines two Results into a tuple
 *
 * Takes two Results and combines them into a single Result containing
 * a tuple of both values. Returns the first error if either fails.
 *
 * @param r1 - First Result
 * @param r2 - Second Result
 * @returns Result containing tuple of both values, or first error
 *
 * @example
 * ```typescript
 * import { ok, err, combine2 } from '@outfitter/contracts';
 *
 * const result = combine2(ok(1), ok("hello"));
 * console.log(result); // { ok: true, value: [1, "hello"] }
 *
 * const errorResult = combine2(ok(1), err({ code: 1000, message: 'Error', name: 'Error' }));
 * console.log(errorResult); // { ok: false, error: {...} }
 * ```
 */
export const combine2 = <T1, T2, E>(r1: Result<T1, E>, r2: Result<T2, E>): Result<[T1, T2], E> => {
  if (!r1.ok) {
    return r1;
  }
  if (!r2.ok) {
    return r2;
  }
  return ok([r1.value, r2.value]);
};

/**
 * Combines three Results into a tuple
 *
 * Takes three Results and combines them into a single Result containing
 * a tuple of all values. Returns the first error if any fails.
 *
 * @param r1 - First Result
 * @param r2 - Second Result
 * @param r3 - Third Result
 * @returns Result containing tuple of all values, or first error
 *
 * @example
 * ```typescript
 * import { ok, err, combine3 } from '@outfitter/contracts';
 *
 * const result = combine3(ok(1), ok("hello"), ok(true));
 * console.log(result); // { ok: true, value: [1, "hello", true] }
 *
 * const errorResult = combine3(
 *   ok(1),
 *   err({ code: 1000, message: 'Error', name: 'Error' }),
 *   ok(true)
 * );
 * console.log(errorResult); // { ok: false, error: {...} }
 * ```
 */
export const combine3 = <T1, T2, T3, E>(
  r1: Result<T1, E>,
  r2: Result<T2, E>,
  r3: Result<T3, E>,
): Result<[T1, T2, T3], E> => {
  if (!r1.ok) {
    return r1;
  }
  if (!r2.ok) {
    return r2;
  }
  if (!r3.ok) {
    return r3;
  }
  return ok([r1.value, r2.value, r3.value]);
};

// Re-export async combinators
export { parallelAsync, sequenceAsync } from "./combinators.js";
