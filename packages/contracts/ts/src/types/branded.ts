import { type AppError, ErrorCode, makeError } from '../error';
import { failure, type Result, success } from '../result';

/**
 * Create a branded type for compile-time safety
 * @template T The base type
 * @template TBrand The unique brand identifier
 */
export type Brand<T, TBrand> = T & { readonly __brand: TBrand };

/**
 * Common branded types for domain modeling
 */
export type UserId = Brand<string, 'UserId'>;
export type Email = Brand<string, 'Email'>;
export type NonEmptyString = Brand<string, 'NonEmptyString'>;
export type PositiveInteger = Brand<number, 'PositiveInteger'>;
export type NonNegativeInteger = Brand<number, 'NonNegativeInteger'>;
export type Url = Brand<string, 'Url'>;
export type Uuid = Brand<string, 'Uuid'>;
export type Percentage = Brand<number, 'Percentage'>; // 0-100
export type Timestamp = Brand<number, 'Timestamp'>; // Unix timestamp in ms

/**
 * Type guards for branded types
 */
export function isUserId(value: unknown): value is UserId {
  return typeof value === 'string' && /^[a-zA-Z0-9_-]+$/.test(value);
}

export function isEmail(value: unknown): value is Email {
  return typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function isNonEmptyString(value: unknown): value is NonEmptyString {
  return typeof value === 'string' && value.trim().length > 0;
}

export function isPositiveInteger(value: unknown): value is PositiveInteger {
  return typeof value === 'number' && Number.isInteger(value) && value > 0;
}

export function isNonNegativeInteger(
  value: unknown
): value is NonNegativeInteger {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0;
}

export function isUrl(value: unknown): value is Url {
  if (typeof value !== 'string') return false;
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

export function isUuid(value: unknown): value is Uuid {
  return (
    typeof value === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value
    )
  );
}

export function isPercentage(value: unknown): value is Percentage {
  return typeof value === 'number' && value >= 0 && value <= 100;
}

export function isTimestamp(value: unknown): value is Timestamp {
  return typeof value === 'number' && value > 0 && Number.isInteger(value);
}

/**
 * Type-safe constructors with validation
 */
export function createUserId(id: string): Result<UserId, AppError> {
  if (!id.trim()) {
    return failure(
      makeError(ErrorCode.VALIDATION_ERROR, 'User ID cannot be empty')
    );
  }
  if (!/^[a-zA-Z0-9_-]+$/.test(id)) {
    return failure(
      makeError(
        ErrorCode.VALIDATION_ERROR,
        'Invalid user ID format. Only alphanumeric characters, underscores, and hyphens are allowed',
        { providedId: id }
      )
    );
  }
  return success(id as UserId);
}

export function createEmail(email: string): Result<Email, AppError> {
  const trimmed = email.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(trimmed)) {
    return failure(
      makeError(ErrorCode.VALIDATION_ERROR, 'Invalid email format', {
        providedEmail: email,
      })
    );
  }

  return success(trimmed as Email);
}

export function createNonEmptyString(
  str: string
): Result<NonEmptyString, AppError> {
  const trimmed = str.trim();
  if (!trimmed) {
    return failure(
      makeError(
        ErrorCode.VALIDATION_ERROR,
        'String cannot be empty or contain only whitespace'
      )
    );
  }
  return success(trimmed as NonEmptyString);
}

export function createPositiveInteger(
  num: number
): Result<PositiveInteger, AppError> {
  if (!Number.isInteger(num)) {
    return failure(
      makeError(ErrorCode.VALIDATION_ERROR, 'Value must be an integer', {
        providedValue: num,
      })
    );
  }
  if (num <= 0) {
    return failure(
      makeError(ErrorCode.VALIDATION_ERROR, 'Value must be positive', {
        providedValue: num,
      })
    );
  }
  return success(num as PositiveInteger);
}

export function createNonNegativeInteger(
  num: number
): Result<NonNegativeInteger, AppError> {
  if (!Number.isInteger(num)) {
    return failure(
      makeError(ErrorCode.VALIDATION_ERROR, 'Value must be an integer', {
        providedValue: num,
      })
    );
  }
  if (num < 0) {
    return failure(
      makeError(ErrorCode.VALIDATION_ERROR, 'Value must be non-negative', {
        providedValue: num,
      })
    );
  }
  return success(num as NonNegativeInteger);
}

export function createUrl(url: string): Result<Url, AppError> {
  try {
    new URL(url);
    return success(url as Url);
  } catch (error) {
    return failure(
      makeError(
        ErrorCode.VALIDATION_ERROR,
        'Invalid URL format',
        { providedUrl: url },
        error as Error
      )
    );
  }
}

export function createUuid(uuid: string): Result<Uuid, AppError> {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  if (!uuidRegex.test(uuid)) {
    return failure(
      makeError(ErrorCode.VALIDATION_ERROR, 'Invalid UUID format', {
        providedUuid: uuid,
      })
    );
  }

  return success(uuid.toLowerCase() as Uuid);
}

export function createPercentage(value: number): Result<Percentage, AppError> {
  if (value < 0 || value > 100) {
    return failure(
      makeError(
        ErrorCode.VALIDATION_ERROR,
        'Percentage must be between 0 and 100',
        {
          providedValue: value,
        }
      )
    );
  }
  return success(value as Percentage);
}

export function createTimestamp(value: number): Result<Timestamp, AppError> {
  if (!Number.isInteger(value)) {
    return failure(
      makeError(ErrorCode.VALIDATION_ERROR, 'Timestamp must be an integer', {
        providedValue: value,
      })
    );
  }
  if (value <= 0) {
    return failure(
      makeError(ErrorCode.VALIDATION_ERROR, 'Timestamp must be positive', {
        providedValue: value,
      })
    );
  }
  return success(value as Timestamp);
}

/**
 * Utility function to create a custom branded type
 * @param validator Function that validates the base type
 * @param errorMessage Error message for validation failure
 * @returns A constructor function for the branded type
 */
export function createBrandedType<T, B>(
  validator: (value: T) => boolean,
  errorMessage: string
): (value: T) => Result<Brand<T, B>, AppError> {
  return (value: T) => {
    if (!validator(value)) {
      return failure(
        makeError(ErrorCode.VALIDATION_ERROR, errorMessage, {
          providedValue: value,
        })
      );
    }
    return success(value as Brand<T, B>);
  };
}

/**
 * Helper to extract the base type from a branded type
 */
// biome-ignore lint/suspicious/noExplicitAny: Required for generic constraint in conditional types
export type Unbrand<T> = T extends Brand<infer U, any> ? U : T;
