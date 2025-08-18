/**

- Advanced TypeScript utilities that complement type-fest
-
- Utilities for advanced patterns not covered by type-fest.
 */

/**

- Get all paths to properties in a nested object as string literals
 */
export type DeepKeys<T> = T extends object
  ? {
      [K in keyof T]: K extends string | number
        ? T[K] extends object
          ? `${K}` | `${K}.${DeepKeys<T[K]>}`
          : `${K}`
        : never;
    }[keyof T]
  : never;

/**

- Get the type at a specific deep path in an object
 */
export type DeepGet<T, P extends string> = P extends `${infer K}.${infer Rest}`
  ? K extends keyof T
    ? DeepGet<T[K], Rest>
    : never
  : P extends keyof T
    ? T[P]
    : never;

/**

- Template literal type for URL path parameters
- Extract parameters like :id from "/users/:id/posts/:postId"
 */
export type ExtractRouteParams<T extends string> =
  T extends `${infer _Start}:${infer Param}/${infer Rest}`
    ? Param | ExtractRouteParams<Rest>
    : T extends `${infer _Start}:${infer Param}`
      ? Param
      : never;

/**

- Template literal type for environment variable patterns
 */
export type EnvVarPattern<T extends string> =
  T extends `${infer Prefix}_${infer Suffix}`
    ? `${Uppercase<Prefix>}_${Uppercase<Suffix>}`
    : Uppercase<T>;

/**

- Type-safe string interpolation for known patterns
 */
export type Interpolate<
  T extends string,
  Values extends Record<string, string | number>,
> = T extends `${infer Before}{${infer Key}}${infer After}`
  ? Key extends keyof Values
    ? `${Before}${Values[Key]}${Interpolate<After, Values>}`
    : T
  : T;

/**

- Utilities for discriminated unions
 */
export type DiscriminatedUnion<T, K extends keyof T> = T extends Record<
  K,
  infer V
>
  ? V extends PropertyKey
    ? T & Record<K, V>
    : never
  : never;

/**

- Extract discriminator values from a discriminated union
 */
export type DiscriminatorValues<T, K extends keyof T> = T extends Record<
  K,
  infer V
>
  ? V
  : never;

/**

- Create a type-safe switch for discriminated unions
 */
export type Switch<
  T,
  K extends keyof T,
  Cases extends Record<PropertyKey, unknown>,
> = T extends Record<K, infer V>
  ? V extends keyof Cases
    ? Cases[V]
    : never
  : never;
