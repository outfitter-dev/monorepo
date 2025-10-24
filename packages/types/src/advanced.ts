/**
 * Advanced TypeScript utility types
 * @module
 */

/**
 * Get all paths to properties in a nested object as string literals
 * @example
 * type User = { name: string; address: { city: string; zip: number } };
 * type Paths = DeepKeys<User>; // "name" | "address" | "address.city" | "address.zip"
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
 * Get the type at a specific deep path in an object
 * @example
 * type User = { name: string; address: { city: string; zip: number } };
 * type City = DeepGet<User, "address.city">; // string
 */
export type DeepGet<T, P extends string> = P extends `${infer K}.${infer Rest}`
  ? K extends keyof T
    ? DeepGet<T[K], Rest>
    : never
  : P extends keyof T
    ? T[P]
    : never;

/**
 * Template literal type for URL path parameters
 * Extract parameters like :id from "/users/:id/posts/:postId"
 * @example
 * type Params = ExtractRouteParams<"/users/:id/posts/:postId">; // "id" | "postId"
 */
export type ExtractRouteParams<T extends string> =
  T extends `${infer _Start}:${infer Param}/${infer Rest}`
    ? Param | ExtractRouteParams<Rest>
    : T extends `${infer _Start}:${infer Param}`
      ? Param
      : never;

/**
 * Template literal type for environment variable patterns
 * @example
 * type Var = EnvVarPattern<"api_key">; // "API_KEY"
 */
export type EnvVarPattern<T extends string> = T extends `${infer Prefix}_${infer Suffix}`
  ? `${Uppercase<Prefix>}_${Uppercase<Suffix>}`
  : Uppercase<T>;

/**
 * Type-safe string interpolation for known patterns
 * @example
 * type Template = Interpolate<"Hello {name}", { name: "World" }>; // "Hello World"
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
 * Utilities for discriminated unions
 * @example
 * type Action = { type: "add"; value: number } | { type: "remove" };
 * type AddAction = DiscriminatedUnion<Action, "type">; // { type: "add"; value: number } | { type: "remove" }
 */
export type DiscriminatedUnion<T, K extends keyof T> = T extends Record<K, infer V>
  ? V extends PropertyKey
    ? T & Record<K, V>
    : never
  : never;

/**
 * Extract discriminator values from a discriminated union
 * @example
 * type Action = { type: "add"; value: number } | { type: "remove" };
 * type ActionTypes = DiscriminatorValues<Action, "type">; // "add" | "remove"
 */
export type DiscriminatorValues<T, K extends keyof T> = T extends Record<K, infer V> ? V : never;

/**
 * Create a type-safe switch for discriminated unions
 * @example
 * type Action = { type: "add"; value: number } | { type: "remove" };
 * type Result = Switch<Action, "type", { add: string; remove: number }>; // string | number
 */
export type Switch<
  T,
  K extends keyof T,
  Cases extends Record<PropertyKey, unknown>,
> = T extends Record<K, infer V> ? (V extends keyof Cases ? Cases[V] : never) : never;
