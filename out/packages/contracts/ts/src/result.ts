/**
 * Result pattern for type-safe error handling without exceptions
 */

import { type AppError, toAppError } from './error';
import type { DeepReadonly } from './types/index';

/**
 * A successful result
 */
export interface Success<T> {
  readonly success: true;
  readonly data: T;
}

/**
 * A failed result
 */
export interface Failure<E> {
  readonly success: false;
  readonly error: DeepReadonly<E>;
}

/**
 * Represents a value that is either a success or a failure
 */
export type Result<T, E = AppError> = Success<T> | Failure<E>;

/**
 * Create a success result
 */
export function success<T>(data: T): Success<T> {
  return { success: true, data };
}

/**
 * Create a failure result
 */
export function failure<E>(error: E): Failure<E> {
  return { success: false, error: error as DeepReadonly<E> };
}

/**
 * Check if a result is a success
 */
export function isSuccess<T, E>(result: Result<T, E>): result is Success<T> {
  return result.success;
}

/**
 * Check if a result is a failure
 */
export function isFailure<T, E>(result: Result<T, E>): result is Failure<E> {
  return !result.success;
}

/**
 * Maps a `Result<T, E>` to `Result<TNew, E>` by applying a function to a
 * contained `Success` value, leaving an `Error` value untouched.
 */
export function map<T, E, TNew>(
  result: Result<T, E>,
  fn: (data: T) => TNew
): Result<TNew, E> {
  if (isSuccess(result)) {
    return success(fn(result.data));
  }
  return result;
}

/**
 * Maps a `Result<T, E>` to `Result<T, ENew>` by applying a function to a
 * contained `Failure` value, leaving a `Success` value untouched.
 */
export function mapError<T, E, ENew>(
  result: Result<T, E>,
  fn: (error: DeepReadonly<E>) => ENew
): Result<T, ENew> {
  if (isFailure(result)) {
    return failure(fn(result.error));
  }
  return result;
}

/**
 * Flat maps a `Result<T, E>` to `Result<TNew, E>` by applying a function to a
 * contained `Success` value.
 */
export function flatMap<T, E, TNew>(
  result: Result<T, E>,
  fn: (data: T) => Result<TNew, E>
): Result<TNew, E> {
  if (isSuccess(result)) {
    return fn(result.data);
  }
  return result;
}

/**
 * Flatten nested Results
 * @param result A Result containing another Result
 * @returns The inner Result
 */
export function flatten<T, E>(result: Result<Result<T, E>, E>): Result<T, E> {
  return result.success ? result.data : result;
}

/**
 * Combine multiple Results into a single Result
 * @param results Array of Results to combine
 * @returns Success with array of values if all succeed, or first failure
 */
export function all<T extends ReadonlyArray<Result<unknown, unknown>>>(
  results: T
): Result<
  { [K in keyof T]: T[K] extends Result<infer U, unknown> ? U : never },
  T[number] extends Result<unknown, infer E> ? E : never
> {
  type Values = {
    [K in keyof T]: T[K] extends Result<infer U, unknown> ? U : never;
  };
  type ErrorType = T[number] extends Result<unknown, infer E> ? E : never;

  const values: Array<unknown> = [];

  for (const result of results) {
    if (!result.success) {
      return failure(result.error) as Result<Values, ErrorType>;
    }
    values.push(result.data);
  }

  return success(values as Values);
}

/**
 * Get the value or a default if the Result is a failure
 * @param result The Result to unwrap
 * @param defaultValue The default value to return on failure
 * @returns The success value or the default
 */
export function getOrElse<T, E>(result: Result<T, E>, defaultValue: T): T {
  return result.success ? result.data : defaultValue;
}

/**
 * Get the value or compute a default if the Result is a failure
 * @param result The Result to unwrap
 * @param fn Function to compute the default value from the error
 * @returns The success value or the computed default
 */
export function getOrElseWith<T, E>(
  result: Result<T, E>,
  fn: (error: DeepReadonly<E>) => T
): T {
  return result.success ? result.data : fn(result.error);
}

/**
 * Execute a side effect on success
 * @param result The Result to tap
 * @param fn The side effect to execute on success
 * @returns The original Result unchanged
 */
export function tap<T, E>(
  result: Result<T, E>,
  fn: (value: T) => void
): Result<T, E> {
  if (result.success) {
    fn(result.data);
  }
  return result;
}

/**
 * Execute a side effect on failure
 * @param result The Result to tap
 * @param fn The side effect to execute on failure
 * @returns The original Result unchanged
 */
export function tapError<T, E>(
  result: Result<T, E>,
  fn: (error: DeepReadonly<E>) => void
): Result<T, E> {
  if (!result.success) {
    fn(result.error);
  }
  return result;
}

/**
 * Convert a Result to a Promise
 * @param result The Result to convert
 * @returns A Promise that resolves on success or rejects on failure
 */
export function toPromise<T, E>(result: Result<T, E>): Promise<T> {
  return result.success
    ? Promise.resolve(result.data)
    : Promise.reject(result.error);
}

/**
 * Create a Result from a nullable value
 * @param value The nullable value
 * @param error The error to use if value is null/undefined
 * @returns Success if value exists, Failure otherwise
 */
export function fromNullable<T, E>(
  value: T | null | undefined,
  error: E
): Result<NonNullable<T>, E> {
  return value !== null && value !== undefined
    ? success(value as NonNullable<T>)
    : failure(error);
}

/**
 * Transforms the `Result` into a single value by calling `onSuccess` or `onFailure`.
 */
export function match<T, E, TSuccess, TFailure>(
  result: Result<T, E>,
  onSuccess: (data: T) => TSuccess,
  onFailure: (error: DeepReadonly<E>) => TFailure
): TSuccess | TFailure {
  if (isSuccess(result)) {
    return onSuccess(result.data);
  }
  return onFailure(result.error);
}

/**
 * Unwraps a `Result`, returning the success value or throwing the error.
 */
export function unwrap<T>(result: Result<T, unknown>): T {
  if (isSuccess(result)) {
    return result.data;
  }
  throw result.error;
}

/**
 * Unwraps a `Result`, returning the success value or a default value.
 */
export function unwrapOr<T>(result: Result<T, unknown>, defaultValue: T): T {
  if (isSuccess(result)) {
    return result.data;
  }
  return defaultValue;
}

/**
 * Unwraps a `Result`, returning the error value or throwing if it's a success.
 */
export function unwrapError<E>(result: Result<unknown, E>): DeepReadonly<E> {
  if (isFailure(result)) {
    return result.error;
  }
  throw new Error('Called unwrapError on a Success');
}

/**
 * Wraps a sync function that might throw an error into a `Result`.
 *
 * Note: All errors are converted to AppError using toAppError(), which may
 * flatten custom error types. If you need to preserve specific error subtypes,
 * handle them explicitly before calling trySync.
 *
 * @param fn The function to wrap
 * @returns The result of the function, or a failure if an error was thrown
 */
export function trySync<T>(fn: () => T): Result<T, AppError> {
  try {
    return success(fn());
  } catch (error) {
    return failure(toAppError(error));
  }
}

/**
 * Wraps an async function that might throw an error into a `Result`.
 *
 * Note: All errors are converted to AppError using toAppError(), which may
 * flatten custom error types. If you need to preserve specific error subtypes,
 * handle them explicitly before calling tryAsync.
 *
 * @param fn The async function to wrap
 * @returns A promise that resolves to the result of the function, or a failure
 */
export async function tryAsync<T>(
  fn: () => Promise<T>
): Promise<Result<T, AppError>> {
  try {
    return success(await fn());
  } catch (error) {
    return failure(toAppError(error));
  }
}
