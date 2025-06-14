/**
 * Exhaustiveness checking utilities for TypeScript
 */

/**
 * Assert that a value is never (used for exhaustive checks)
 * This will cause a compile error if all cases are not handled
 *
 * @example
 * ```ts
 * function processStatus(status: 'active' | 'inactive' | 'pending') {
 *   switch (status) {
 *     case 'active':
 *       return 'Active';
 *     case 'inactive':
 *       return 'Inactive';
 *     case 'pending':
 *       return 'Pending';
 *     default:
 *       return assertNever(status); // Compile error if case missed
 *   }
 * }
 * ```
 */
export function assertNever(value: never): never {
  throw new Error(`Unhandled value: ${JSON.stringify(value)}`);
}

/**
 * Check exhaustiveness and return a default value instead of throwing
 * Useful when you want to handle unknown cases gracefully
 *
 * @example
 * ```ts
 * function getStatusColor(status: 'active' | 'inactive' | 'pending') {
 *   switch (status) {
 *     case 'active':
 *       return 'green';
 *     case 'inactive':
 *       return 'gray';
 *     default:
 *       return exhaustiveCheck(status, 'blue'); // Returns 'blue' for unhandled cases
 *   }
 * }
 * ```
 */
export function exhaustiveCheck<T>(_value: never, defaultValue: T): T {
  // In production, you might want to log this to an error tracking service
  // console.warn(`Unhandled case: ${JSON.stringify(_value)}`);
  return defaultValue;
}

/**
 * Assert a condition is true, narrowing the type
 *
 * @example
 * ```ts
 * function processUser(user: { name?: string }) {
 *   assert(user.name, 'User must have a name');
 *   // user.name is now string (not string | undefined)
 *   console.log(user.name.toUpperCase());
 * }
 * ```
 */
export function assert(
  condition: unknown,
  message?: string
): asserts condition {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

/**
 * Assert that a value is defined (not null or undefined)
 *
 * @example
 * ```ts
 * function processConfig(config?: Config) {
 *   assertDefined(config, 'Config is required');
 *   // config is now Config (not Config | undefined)
 *   return config.apiUrl;
 * }
 * ```
 */
export function assertDefined<T>(
  value: T,
  message?: string
): asserts value is NonNullable<T> {
  if (value === null || value === undefined) {
    throw new Error(message || 'Value must be defined');
  }
}

/**
 * Type guard to check if a value is defined
 *
 * @example
 * ```ts
 * const values = [1, null, 2, undefined, 3];
 * const defined = values.filter(isDefined); // number[]
 * ```
 */
export function isDefined<T>(value: T): value is NonNullable<T> {
  return value !== null && value !== undefined;
}

/**
 * Type guard to check if a value is null or undefined
 */
export function isNullish(value: unknown): value is null | undefined {
  return value === null || value === undefined;
}

/**
 * Assert that code is unreachable
 * This is useful for ensuring all code paths are covered
 *
 * @example
 * ```ts
 * function processAction(action: Action) {
 *   if (action.type === 'create') {
 *     return handleCreate(action);
 *   } else if (action.type === 'update') {
 *     return handleUpdate(action);
 *   } else if (action.type === 'delete') {
 *     return handleDelete(action);
 *   }
 *   assertUnreachable(); // Ensures all action types are handled
 * }
 * ```
 */
export function assertUnreachable(): never {
  throw new Error('This code should be unreachable');
}

/**
 * Assert that a value is a string
 *
 * @example
 * ```ts
 * function processInput(input: unknown) {
 *   assertIsString(input);
 *   // input is now string
 *   return input.toUpperCase();
 * }
 * ```
 */
export function assertIsString(value: unknown): asserts value is string {
  if (typeof value !== 'string') {
    throw new TypeError(`Expected string, got ${typeof value}`);
  }
}

/**
 * Assert that a value is a number
 */
export function assertIsNumber(value: unknown): asserts value is number {
  if (typeof value !== 'number') {
    throw new TypeError(`Expected number, got ${typeof value}`);
  }
}

/**
 * Assert that a value is an array
 */
export function assertIsArray<T = unknown>(
  value: unknown
): asserts value is Array<T> {
  if (!Array.isArray(value)) {
    throw new TypeError(`Expected array, got ${typeof value}`);
  }
}

/**
 * Type guard to check if a value is a string
 */
export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

/**
 * Type guard to check if a value is a number
 */
export function isNumber(value: unknown): value is number {
  return typeof value === 'number';
}

/**
 * Type guard to check if a value is an object (excluding null)
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
