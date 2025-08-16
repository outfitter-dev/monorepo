import { type AppError } from '../error';
import { type Result } from '../result';
/**
 * Create a branded type for compile-time safety
 * @template T The base type
 * @template TBrand The unique brand identifier
 */
export type Brand<T, TBrand> = T & {
  readonly __brand: TBrand;
};
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
export type Percentage = Brand<number, 'Percentage'>;
export type Timestamp = Brand<number, 'Timestamp'>;
/**
 * Type guards for branded types
 */
export declare function isUserId(value: unknown): value is UserId;
export declare function isEmail(value: unknown): value is Email;
export declare function isNonEmptyString(
  value: unknown
): value is NonEmptyString;
export declare function isPositiveInteger(
  value: unknown
): value is PositiveInteger;
export declare function isNonNegativeInteger(
  value: unknown
): value is NonNegativeInteger;
export declare function isUrl(value: unknown): value is Url;
export declare function isUuid(value: unknown): value is Uuid;
export declare function isPercentage(value: unknown): value is Percentage;
export declare function isTimestamp(value: unknown): value is Timestamp;
/**
 * Type-safe constructors with validation
 */
export declare function createUserId(id: string): Result<UserId, AppError>;
export declare function createEmail(email: string): Result<Email, AppError>;
export declare function createNonEmptyString(
  str: string
): Result<NonEmptyString, AppError>;
export declare function createPositiveInteger(
  num: number
): Result<PositiveInteger, AppError>;
export declare function createNonNegativeInteger(
  num: number
): Result<NonNegativeInteger, AppError>;
export declare function createUrl(url: string): Result<Url, AppError>;
export declare function createUuid(uuid: string): Result<Uuid, AppError>;
export declare function createPercentage(
  value: number
): Result<Percentage, AppError>;
export declare function createTimestamp(
  value: number
): Result<Timestamp, AppError>;
/**
 * Utility function to create a custom branded type
 * @param validator Function that validates the base type
 * @param errorMessage Error message for validation failure
 * @returns A constructor function for the branded type
 */
export declare function createBrandedType<T, B>(
  validator: (value: T) => boolean,
  errorMessage: string
): (value: T) => Result<Brand<T, B>, AppError>;
/**
 * Helper to extract the base type from a branded type
 */
export type Unbrand<T> = T extends Brand<infer U, any> ? U : T;
//# sourceMappingURL=branded.d.ts.map
