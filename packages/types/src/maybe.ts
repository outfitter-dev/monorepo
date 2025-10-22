/**
 * Maybe type utilities for handling optional and nullable values
 * @module
 */

/**
 * Represents a value that can be null
 */
export type Nullable<T> = T | null;

/**
 * Represents a value that can be undefined
 */
export type Optional<T> = T | undefined;

/**
 * Represents a value that can be null or undefined
 */
export type Maybe<T> = T | null | undefined;

/**
 * Type guard to check if a value is defined (not null or undefined)
 */
export function isDefined<T>(value: Maybe<T>): value is T {
  return value !== null && value !== undefined;
}

/**
 * Type guard to check if a value is null
 */
export function isNull<T>(value: Maybe<T>): value is null {
  return value === null;
}

/**
 * Type guard to check if a value is undefined
 */
export function isUndefined<T>(value: Maybe<T>): value is undefined {
  return value === undefined;
}

/**
 * Type guard to check if a value is nullish (null or undefined)
 */
export function isNullish<T>(value: Maybe<T>): value is null | undefined {
  return value === null || value === undefined;
}

/**
 * Get a value or return a default if nullish
 */
export function getOrElse<T>(value: Maybe<T>, defaultValue: T): T {
  return isDefined(value) ? value : defaultValue;
}

/**
 * Get a value or compute a default if nullish
 */
export function getOrElseLazy<T>(value: Maybe<T>, defaultFn: () => T): T {
  return isDefined(value) ? value : defaultFn();
}

/**
 * Map over a maybe value
 */
export function mapMaybe<T, U>(value: Maybe<T>, fn: (val: T) => U): Maybe<U> {
  return isDefined(value) ? fn(value) : value;
}

/**
 * Chain maybe operations (flatMap)
 */
export function chainMaybe<T, U>(value: Maybe<T>, fn: (val: T) => Maybe<U>): Maybe<U> {
  return isDefined(value) ? fn(value) : value;
}

/**
 * Filter a maybe value with a predicate
 */
export function filterMaybe<T>(value: Maybe<T>, predicate: (val: T) => boolean): Maybe<T> {
  if (!isDefined(value)) {
    return value;
  }
  return predicate(value) ? value : undefined;
}

/**
 * Convert undefined to null
 */
export function undefinedToNull<T>(value: Maybe<T>): Nullable<T> {
  return value === undefined ? null : value;
}

/**
 * Convert null to undefined
 */
export function nullToUndefined<T>(value: Maybe<T>): Optional<T> {
  return value === null ? undefined : value;
}
