/**
 * Result combinator functions
 * @module result/combinators
 */

import type { Result } from "./index.js";
import { ok } from "./index.js";

/**
 * Sequences an array of Promise<Result> values sequentially
 *
 * Awaits each Promise in order and collects successful Results into an array.
 * Returns the first error encountered, short-circuiting remaining promises.
 * Processes promises one at a time, not in parallel.
 *
 * @param promises - Array of Promises returning Results to sequence
 * @returns Promise resolving to Result containing array of values, or first error
 *
 * @example
 * ```typescript
 * import { sequenceAsync } from '@outfitter/contracts/result/combinators';
 *
 * const results = await sequenceAsync([
 *   Promise.resolve(ok(1)),
 *   Promise.resolve(ok(2)),
 *   Promise.resolve(ok(3)),
 * ]);
 * console.log(results); // { ok: true, value: [1, 2, 3] }
 *
 * const withError = await sequenceAsync([
 *   Promise.resolve(ok(1)),
 *   Promise.resolve(err({ code: 1000, message: 'Error', name: 'Error' })),
 *   Promise.resolve(ok(3)), // This won't be awaited due to short-circuit
 * ]);
 * console.log(withError); // { ok: false, error: {...} }
 * ```
 */
export const sequenceAsync = async <T, E>(
  promises: readonly Promise<Result<T, E>>[],
): Promise<Result<T[], E>> => {
  const values: T[] = [];

  for (const promise of promises) {
    const result = await promise;
    if (!result.ok) {
      return result;
    }
    values.push(result.value);
  }

  return ok(values);
};

/**
 * Processes an array of Promise<Result> values in parallel
 *
 * Awaits all Promises concurrently using Promise.all and collects successful
 * Results into an array. Returns the first error encountered (though all
 * promises will still complete due to Promise.all semantics).
 *
 * @param promises - Array of Promises returning Results to process in parallel
 * @returns Promise resolving to Result containing array of values, or first error
 *
 * @example
 * ```typescript
 * import { parallelAsync } from '@outfitter/contracts/result/combinators';
 *
 * const results = await parallelAsync([
 *   fetchUser(1),
 *   fetchUser(2),
 *   fetchUser(3),
 * ]);
 *
 * if (results.ok) {
 *   console.log('All users:', results.value); // [user1, user2, user3]
 * } else {
 *   console.error('First error:', results.error);
 * }
 * ```
 */
export const parallelAsync = async <T, E>(
  promises: readonly Promise<Result<T, E>>[],
): Promise<Result<T[], E>> => {
  const results = await Promise.all(promises);

  const values: T[] = [];
  for (const result of results) {
    if (!result.ok) {
      return result;
    }
    values.push(result.value);
  }

  return ok(values);
};
