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
export declare function assertNever(value: never): never;
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
export declare function exhaustiveCheck<T>(_value: never, defaultValue: T): T;
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
export declare function assert(
  condition: unknown,
  message?: string
): asserts condition;
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
export declare function assertDefined<T>(
  value: T,
  message?: string
): asserts value is NonNullable<T>;
/**
 * Type guard to check if a value is defined
 *
 * @example
 * ```ts
 * const values = [1, null, 2, undefined, 3];
 * const defined = values.filter(isDefined); // number[]
 * ```
 */
export declare function isDefined<T>(value: T): value is NonNullable<T>;
/**
 * Type guard to check if a value is null or undefined
 */
export declare function isNullish(value: unknown): value is null | undefined;
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
export declare function assertUnreachable(): never;
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
export declare function assertIsString(value: unknown): asserts value is string;
/**
 * Assert that a value is a number
 */
export declare function assertIsNumber(value: unknown): asserts value is number;
/**
 * Assert that a value is an array
 */
export declare function assertIsArray<T = unknown>(
  value: unknown
): asserts value is Array<T>;
/**
 * Type guard to check if a value is a string
 */
export declare function isString(value: unknown): value is string;
/**
 * Type guard to check if a value is a number
 */
export declare function isNumber(value: unknown): value is number;
/**
 * Type guard to check if a value is an object (excluding null)
 */
export declare function isObject(
  value: unknown
): value is Record<string, unknown>;
//# sourceMappingURL=assert.d.ts.map
