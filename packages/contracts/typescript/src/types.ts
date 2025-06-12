export type AnyFunction = (...args: Array<unknown>) => unknown;

/**
 * Make all properties in T deeply readonly
 */
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};
