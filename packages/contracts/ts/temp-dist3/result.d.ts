/**

- Result pattern for type-safe error handling without exceptions
 */
import { type AppError } from './error';
import type { DeepReadonly } from './types/index';
/**
- A successful result
 */
export interface Success<T> {
  readonly success: true;
  readonly data: T;
}
/**
- A failed result
 */
export interface Failure<E> {
  readonly success: false;
  readonly error: DeepReadonly<E>;
}
/**
- Represents a value that is either a success or a failure
 */
export type Result<T, E = AppError> = Success<T> | Failure<E>;
/**
- Create a success result
 */
export declare function success<T>(data: T): Success<T>;
/**
- Create a failure result
 */
export declare function failure<E>(error: E): Failure<E>;
/**
- Check if a result is a success
 */
export declare function isSuccess<T, E>(
  result: Result<T, E>
): result is Success<T>;
/**
- Check if a result is a failure
 */
export declare function isFailure<T, E>(
  result: Result<T, E>
): result is Failure<E>;
/**
- Maps a `Result<T, E>` to `Result<TNew, E>` by applying a function to a
- contained `Success` value, leaving an `Error` value untouched.
 */
export declare function map<T, E, TNew>(
  result: Result<T, E>,
  fn: (data: T) => TNew
): Result<TNew, E>;
/**
- Maps a `Result<T, E>` to `Result<T, ENew>` by applying a function to a
- contained `Failure` value, leaving a `Success` value untouched.
 */
export declare function mapError<T, E, ENew>(
  result: Result<T, E>,
  fn: (error: DeepReadonly<E>) => ENew
): Result<T, ENew>;
/**
- Flat maps a `Result<T, E>` to `Result<TNew, E>` by applying a function to a
- contained `Success` value.
 */
export declare function flatMap<T, E, TNew>(
  result: Result<T, E>,
  fn: (data: T) => Result<TNew, E>
): Result<TNew, E>;
/**
- Flatten nested Results
- @param result A Result containing another Result
- @returns The inner Result
 */
export declare function flatten<T, E>(
  result: Result<Result<T, E>, E>
): Result<T, E>;
/**
- Combine multiple Results into a single Result
- @param results Array of Results to combine
- @returns Success with array of values if all succeed, or first failure
 */
export declare function all<T extends ReadonlyArray<Result<unknown, unknown>>>(
  results: T
): Result<
  {
    [K in keyof T]: T[K] extends Result<infer U, unknown> ? U : never;
  },
  T[number] extends Result<unknown, infer E> ? E : never

>;
/**

- Get the value or a default if the Result is a failure
- @param result The Result to unwrap
- @param defaultValue The default value to return on failure
- @returns The success value or the default
 */
export declare function getOrElse<T, E>(
  result: Result<T, E>,
  defaultValue: T
): T;
/**
- Get the value or compute a default if the Result is a failure
- @param result The Result to unwrap
- @param fn Function to compute the default value from the error
- @returns The success value or the computed default
 */
export declare function getOrElseWith<T, E>(
  result: Result<T, E>,
  fn: (error: DeepReadonly<E>) => T
): T;
/**
- Execute a side effect on success
- @param result The Result to tap
- @param fn The side effect to execute on success
- @returns The original Result unchanged
 */
export declare function tap<T, E>(
  result: Result<T, E>,
  fn: (value: T) => void
): Result<T, E>;
/**
- Execute a side effect on failure
- @param result The Result to tap
- @param fn The side effect to execute on failure
- @returns The original Result unchanged
 */
export declare function tapError<T, E>(
  result: Result<T, E>,
  fn: (error: DeepReadonly<E>) => void
): Result<T, E>;
/**
- Convert a Result to a Promise
- @param result The Result to convert
- @returns A Promise that resolves on success or rejects on failure
 */
export declare function toPromise<T, E>(result: Result<T, E>): Promise<T>;
/**
- Create a Result from a nullable value
- @param value The nullable value
- @param error The error to use if value is null/undefined
- @returns Success if value exists, Failure otherwise
 */
export declare function fromNullable<T, E>(
  value: T | null | undefined,
  error: E
): Result<NonNullable<T>, E>;
/**
- Transforms the `Result` into a single value by calling `onSuccess` or `onFailure`.
 */
export declare function match<T, E, TSuccess, TFailure>(
  result: Result<T, E>,
  onSuccess: (data: T) => TSuccess,
  onFailure: (error: DeepReadonly<E>) => TFailure
): TSuccess | TFailure;
/**
- Unwraps a `Result`, returning the success value or throwing the error.
 */
export declare function unwrap<T>(result: Result<T, unknown>): T;
/**
- Unwraps a `Result`, returning the success value or a default value.
 */
export declare function unwrapOr<T>(
  result: Result<T, unknown>,
  defaultValue: T
): T;
/**
- Unwraps a `Result`, returning the error value or throwing if it's a success.
 */
export declare function unwrapError<E>(
  result: Result<unknown, E>
): DeepReadonly<E>;
/**
- Wraps a sync function that might throw an error into a `Result`.
-
- Note: All errors are converted to AppError using toAppError(), which may
- flatten custom error types. If you need to preserve specific error subtypes,
- handle them explicitly before calling trySync.
-
- @param fn The function to wrap
- @returns The result of the function, or a failure if an error was thrown
 */
export declare function trySync<T>(fn: () => T): Result<T, AppError>;
/**
- Wraps an async function that might throw an error into a `Result`.
-
- Note: All errors are converted to AppError using toAppError(), which may
- flatten custom error types. If you need to preserve specific error subtypes,
- handle them explicitly before calling tryAsync.
-
- @param fn The async function to wrap
- @returns A promise that resolves to the result of the function, or a failure
 */
export declare function tryAsync<T>(
  fn: () => Promise<T>
): Promise<Result<T, AppError>>;
//# sourceMappingURL=result.d.ts.map
