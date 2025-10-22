/**
 * Branded type utilities
 *
 * Provides nominal typing through brand symbols, enabling compile-time
 * distinction between structurally identical types. Useful for preventing
 * common mistakes like passing an email where a username is expected.
 *
 * @module branded
 */

import { ERROR_CODES } from "../error/codes.js";
import { createError, type ExtendedAppError } from "../error/index.js";
import { err, ok, type Result } from "../result/index.js";

/**
 * Brand a type with a unique symbol for nominal typing
 *
 * Creates a nominal type by intersecting the base type with a unique brand.
 * The brand is phantom data that exists only at compile time.
 *
 * @typeParam T - The base type to brand
 * @typeParam B - The brand identifier (string literal)
 *
 * @example
 * ```typescript
 * import type { Brand } from '@outfitter/contracts/branded';
 *
 * type UserId = Brand<string, 'UserId'>;
 * type Username = Brand<string, 'Username'>;
 *
 * // These are now distinct types at compile time
 * const userId: UserId = 'user-123' as UserId;
 * const username: Username = 'john_doe' as Username;
 *
 * function getUser(id: UserId): void {
 *   // ...
 * }
 *
 * getUser(userId); // OK
 * getUser(username); // Type error! Username is not assignable to UserId
 * ```
 */
export type Brand<T, B> = T & { readonly __brand: B };

/**
 * Create a branded type constructor
 *
 * Casts a value to a branded type. Use with caution - prefer using
 * validation constructors like `email()` or `uuid()` which validate
 * the input before branding.
 *
 * @param value - The value to brand
 * @returns The value cast to the branded type
 *
 * @example
 * ```typescript
 * import { brand, type Brand } from '@outfitter/contracts/branded';
 *
 * type PositiveInt = Brand<number, 'PositiveInt'>;
 *
 * // Unsafe - no validation!
 * const value = brand<number, 'PositiveInt'>(42);
 *
 * // Better - use validation constructors
 * import { positiveInt } from '@outfitter/contracts/branded';
 * const safeValue = positiveInt(42); // Returns Result
 * ```
 */
export const brand = <T, B extends string>(value: T): Brand<T, B> => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Branded types require type assertion by design
  return value as Brand<T, B>;
};

/**
 * Type guard for branded types
 *
 * Checks if a value satisfies both the base type validator and the brand.
 * Note: This only validates the base type - brands are compile-time only.
 *
 * @param value - Value to check
 * @param validator - Type guard for the base type
 * @returns True if value passes the validator
 *
 * @example
 * ```typescript
 * import { isBranded, type Brand } from '@outfitter/contracts/branded';
 *
 * type PositiveInt = Brand<number, 'PositiveInt'>;
 *
 * const isNumber = (v: unknown): v is number => typeof v === 'number';
 *
 * if (isBranded<number, 'PositiveInt'>(value, isNumber)) {
 *   // value is typed as Brand<number, 'PositiveInt'>
 * }
 * ```
 */
export const isBranded = <T, B extends string>(
  value: unknown,
  validator: (v: unknown) => v is T,
): value is Brand<T, B> => {
  return validator(value);
};

/**
 * Common branded types
 */

/**
 * Positive integer brand
 *
 * Represents an integer greater than zero.
 */
export type PositiveInt = Brand<number, "PositiveInt">;

/**
 * Non-empty string brand
 *
 * Represents a string with at least one character.
 */
export type NonEmptyString = Brand<string, "NonEmptyString">;

/**
 * Email address brand
 *
 * Represents a valid email address format.
 */
export type Email = Brand<string, "Email">;

/**
 * UUID brand
 *
 * Represents a valid UUID v4 format.
 */
export type UUID = Brand<string, "UUID">;

/**
 * Create a positive integer
 *
 * Validates that a number is a positive integer (greater than zero)
 * and returns a branded PositiveInt type.
 *
 * @param n - Number to validate
 * @returns Result containing PositiveInt or error
 *
 * @example
 * ```typescript
 * import { positiveInt } from '@outfitter/contracts/branded';
 *
 * const result1 = positiveInt(42);
 * // { ok: true, value: 42 as PositiveInt }
 *
 * const result2 = positiveInt(-5);
 * // { ok: false, error: { code: 1001, message: '...', ... } }
 *
 * const result3 = positiveInt(3.14);
 * // { ok: false, error: { code: 1001, message: '...', ... } }
 * ```
 */
export const positiveInt = (n: number): Result<PositiveInt, ExtendedAppError> => {
  if (typeof n !== "number" || Number.isNaN(n)) {
    return err(createError(ERROR_CODES.INVALID_INPUT, "Value must be a number"));
  }

  if (!Number.isInteger(n)) {
    return err(createError(ERROR_CODES.INVALID_INPUT, "Value must be an integer"));
  }

  if (n <= 0) {
    return err(createError(ERROR_CODES.INVALID_INPUT, "Value must be greater than zero"));
  }

  return ok(brand<number, "PositiveInt">(n));
};

/**
 * Create a non-empty string
 *
 * Validates that a string has at least one character and returns
 * a branded NonEmptyString type.
 *
 * @param s - String to validate
 * @returns Result containing NonEmptyString or error
 *
 * @example
 * ```typescript
 * import { nonEmptyString } from '@outfitter/contracts/branded';
 *
 * const result1 = nonEmptyString("hello");
 * // { ok: true, value: "hello" as NonEmptyString }
 *
 * const result2 = nonEmptyString("");
 * // { ok: false, error: { code: 1001, message: '...', ... } }
 *
 * const result3 = nonEmptyString("   ");
 * // { ok: false, error: { code: 1001, message: '...', ... } }
 * ```
 */
export const nonEmptyString = (s: string): Result<NonEmptyString, ExtendedAppError> => {
  if (typeof s !== "string") {
    return err(createError(ERROR_CODES.INVALID_INPUT, "Value must be a string"));
  }

  const trimmed = s.trim();
  if (trimmed.length === 0) {
    return err(createError(ERROR_CODES.INVALID_INPUT, "String must not be empty"));
  }

  return ok(brand<string, "NonEmptyString">(trimmed));
};

/**
 * Email validation regex
 *
 * Basic email validation pattern. Matches most common email formats.
 * Not 100% RFC-compliant but sufficient for most use cases.
 *
 * @internal
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Create an email address
 *
 * Validates that a string matches email format and returns
 * a branded Email type.
 *
 * @param s - String to validate as email
 * @returns Result containing Email or error
 *
 * @example
 * ```typescript
 * import { email } from '@outfitter/contracts/branded';
 *
 * const result1 = email("user@example.com");
 * // { ok: true, value: "user@example.com" as Email }
 *
 * const result2 = email("invalid-email");
 * // { ok: false, error: { code: 1001, message: '...', ... } }
 *
 * const result3 = email("user@");
 * // { ok: false, error: { code: 1001, message: '...', ... } }
 * ```
 */
export const email = (s: string): Result<Email, ExtendedAppError> => {
  if (typeof s !== "string") {
    return err(createError(ERROR_CODES.INVALID_INPUT, "Value must be a string"));
  }

  const trimmed = s.trim();
  if (!EMAIL_REGEX.test(trimmed)) {
    return err(createError(ERROR_CODES.INVALID_INPUT, "Invalid email format"));
  }

  return ok(brand<string, "Email">(trimmed));
};

/**
 * UUID v4 validation regex
 *
 * Validates UUID v4 format: 8-4-4-4-12 hexadecimal characters.
 *
 * @internal
 */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Create a UUID
 *
 * Validates that a string matches UUID v4 format and returns
 * a branded UUID type.
 *
 * @param s - String to validate as UUID
 * @returns Result containing UUID or error
 *
 * @example
 * ```typescript
 * import { uuid } from '@outfitter/contracts/branded';
 *
 * const result1 = uuid("550e8400-e29b-41d4-a716-446655440000");
 * // { ok: true, value: "550e8400-e29b-41d4-a716-446655440000" as UUID }
 *
 * const result2 = uuid("invalid-uuid");
 * // { ok: false, error: { code: 1001, message: '...', ... } }
 *
 * const result3 = uuid("550e8400-e29b-31d4-a716-446655440000"); // wrong version
 * // { ok: false, error: { code: 1001, message: '...', ... } }
 * ```
 */
export const uuid = (s: string): Result<UUID, ExtendedAppError> => {
  if (typeof s !== "string") {
    return err(createError(ERROR_CODES.INVALID_INPUT, "Value must be a string"));
  }

  const trimmed = s.trim().toLowerCase();
  if (!UUID_REGEX.test(trimmed)) {
    return err(createError(ERROR_CODES.INVALID_INPUT, "Invalid UUID format"));
  }

  return ok(brand<string, "UUID">(trimmed));
};
