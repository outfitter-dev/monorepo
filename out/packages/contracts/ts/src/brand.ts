/**
 * Creates a branded type.
 *
 * This is a lightweight way to create a nominal type from a primitive type.
 * For example, you can create a `UserId` type from a `string` to prevent
 * accidentally passing a regular string where a `UserId` is expected.
 *
 * @example
 * ```ts
 * type UserId = Branded<string, 'UserId'>;
 *
 * const toUserId = (id: string) => id as UserId;
 *
 * let userId = toUserId('123');
 * let normalString = 'abc';
 *
 * userId = normalString; // Type error
 * normalString = userId; // OK
 * ```
 */

declare const __brand: unique symbol;

/**
 * A branded type, combining a base type `T` with a brand `TBrand`.
 */
export interface Brand<TBrand> {
  [__brand]: TBrand;
}
export type Branded<T, TBrand> = T & Brand<TBrand>;
