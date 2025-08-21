/**
 * Utility types for better TypeScript development
 */

// TypeScript built-in utility types are available globally and don't need to be re-exported

/**
 * Make all properties deeply readonly
 */
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends Array<infer U>
    ? Array<DeepReadonly<U>>
    : T[P] extends Record<string, unknown>
      ? DeepReadonly<T[P]>
      : T[P];
};

/**
 * Make all properties deeply partial
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends Array<infer U>
    ? Array<DeepPartial<U>>
    : T[P] extends Record<string, unknown>
      ? DeepPartial<T[P]>
      : T[P];
};

/**
 * Extract keys of T that are required
 */
export type RequiredKeys<T> = {
  [K in keyof T]-?: object extends Pick<T, K> ? never : K;
}[keyof T];

/**
 * Extract keys of T that are optional
 */
export type OptionalKeys<T> = {
  [K in keyof T]-?: object extends Pick<T, K> ? K : never;
}[keyof T];

/**
 * Flatten a type to show all properties at once
 */
export type Flatten<T> = T extends infer U ? { [K in keyof U]: U[K] } : never;

/**
 * Get the value type of an array
 */
export type ArrayElement<T> = T extends Array<infer U> ? U : never;

/**
 * Create a union of all object values
 */
export type ValueOf<T> = T[keyof T];

/**
 * Create a type that requires at least one of the given keys
 */
export type RequireAtLeastOne<T, Keys extends keyof T = keyof T> = Pick<
  T,
  Exclude<keyof T, Keys>
> &
  {
    [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>>;
  }[Keys];

/**
 * JSON-serializable type
 */
export type JsonValue =
  | string
  | number
  | boolean
  | null
  | Array<JsonValue>
  | { [key: string]: JsonValue };

/**
 * Make a type JSON-serializable by removing functions and symbols
 */
export type Jsonify<T> = T extends JsonValue
  ? T
  : T extends bigint | symbol | ((...args: Array<unknown>) => unknown)
    ? never
    : T extends Array<infer U>
      ? Array<Jsonify<U>>
      : T extends Record<string, unknown>
        ? { [K in keyof T]: Jsonify<T[K]> }
        : never;

// Re-export branded types
export * from './branded';
