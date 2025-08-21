import { describe, expect, it, vi } from 'vitest';

import { isAppError } from '../error';
import {
  all,
  failure,
  flatMap,
  flatten,
  fromNullable,
  getOrElse,
  getOrElseWith,
  isFailure,
  isSuccess,
  map,
  mapError,
  success,
  tap,
  tapError,
  toPromise,
  tryAsync,
  trySync,
} from '../result';

describe('Result pattern', () => {
  it('should create successful results', () => {
    const result = success('hello');

    expect(result.success).toBe(true);
    expect(result.data).toBe('hello');
    expect(isSuccess(result)).toBe(true);
    expect(isFailure(result)).toBe(false);
  });

  it('should create failure results', () => {
    const error = new Error('something went wrong');
    const result = failure(error);

    expect(result.success).toBe(false);
    expect(result.error).toBe(error);
    expect(isSuccess(result)).toBe(false);
    expect(isFailure(result)).toBe(true);
  });

  it('should handle async success', async () => {
    const asyncFn = async () => 'async result';
    const result = await tryAsync(asyncFn);

    expect(isSuccess(result)).toBe(true);
    if (isSuccess(result)) {
      expect(result.data).toBe('async result');
    }
  });

  it('should handle async errors', async () => {
    const asyncFn = async () => {
      throw new Error('async error');
    };
    const result = await tryAsync(asyncFn);

    expect(isFailure(result)).toBe(true);
    if (isFailure(result)) {
      expect(isAppError(result.error)).toBe(true);
      expect(result.error.message).toBe('async error');
    }
  });

  it('should handle sync success', () => {
    const syncFn = () => 'sync result';
    const result = trySync(syncFn);

    expect(isSuccess(result)).toBe(true);
    if (isSuccess(result)) {
      expect(result.data).toBe('sync result');
    }
  });

  it('should handle sync errors', () => {
    const syncFn = () => {
      throw new Error('sync error');
    };
    const result = trySync(syncFn);

    expect(isFailure(result)).toBe(true);
    if (isFailure(result)) {
      expect(isAppError(result.error)).toBe(true);
      expect(result.error.message).toBe('sync error');
    }
  });

  describe('map', () => {
    it('should map success values', () => {
      const result = success(5);
      const mapped = map(result, (x) => x * 2);

      expect(isSuccess(mapped)).toBe(true);
      if (isSuccess(mapped)) {
        expect(mapped.data).toBe(10);
      }
    });

    it('should not map failure values', () => {
      const error = new Error('fail');
      const result = failure(error);
      const mapped = map(result, (x: number) => x * 2);

      expect(isFailure(mapped)).toBe(true);
      if (isFailure(mapped)) {
        expect(mapped.error).toBe(error);
      }
    });
  });

  describe('mapError', () => {
    it('should not map success values', () => {
      const result = success(5);
      const mapped = mapError(result, () => new Error('new error'));

      expect(isSuccess(mapped)).toBe(true);
      if (isSuccess(mapped)) {
        expect(mapped.data).toBe(5);
      }
    });

    it('should map failure values', () => {
      const result = failure(new Error('old'));
      const mapped = mapError(
        result,
        (err) => new Error(`wrapped: ${err.message}`)
      );

      expect(isFailure(mapped)).toBe(true);
      if (isFailure(mapped)) {
        expect(mapped.error.message).toBe('wrapped: old');
      }
    });
  });

  describe('flatMap', () => {
    it('should chain successful operations', () => {
      const result = success(5);
      const chained = flatMap(result, (x) => success(x * 2));

      expect(isSuccess(chained)).toBe(true);
      if (isSuccess(chained)) {
        expect(chained.data).toBe(10);
      }
    });

    it('should short-circuit on first failure', () => {
      const error = new Error('fail');
      const result = failure(error);
      const chained = flatMap(result, (x: number) => success(x * 2));

      expect(isFailure(chained)).toBe(true);
      if (isFailure(chained)) {
        expect(chained.error).toBe(error);
      }
    });

    it('should propagate failure from chained operation', () => {
      const result = success(5);
      const error = new Error('chained fail');
      const chained = flatMap(result, () => failure(error));

      expect(isFailure(chained)).toBe(true);
      if (isFailure(chained)) {
        expect(chained.error).toBe(error);
      }
    });
  });

  describe('flatten', () => {
    it('should flatten nested success', () => {
      const nested = success(success(42));
      const flat = flatten(nested);

      expect(isSuccess(flat)).toBe(true);
      if (isSuccess(flat)) {
        expect(flat.data).toBe(42);
      }
    });

    it('should flatten outer failure', () => {
      const error = new Error('outer');
      const nested = failure(error);
      const flat = flatten(nested);

      expect(isFailure(flat)).toBe(true);
      if (isFailure(flat)) {
        expect(flat.error).toBe(error);
      }
    });

    it('should flatten inner failure', () => {
      const error = new Error('inner');
      const nested = success(failure(error));
      const flat = flatten(nested);

      expect(isFailure(flat)).toBe(true);
      if (isFailure(flat)) {
        expect(flat.error).toBe(error);
      }
    });
  });

  describe('all', () => {
    it('should combine all successes', () => {
      const results = [success(1), success(2), success(3)] as const;
      const combined = all(results);

      expect(isSuccess(combined)).toBe(true);
      if (isSuccess(combined)) {
        expect(combined.data).toEqual([1, 2, 3]);
      }
    });

    it('should fail on first failure', () => {
      const error = new Error('fail');
      const results = [success(1), failure(error), success(3)] as const;
      const combined = all(results);

      expect(isFailure(combined)).toBe(true);
      if (isFailure(combined)) {
        expect(combined.error).toBe(error);
      }
    });

    it('should handle empty array', () => {
      const results: Result<number, Error>[] = [];
      const combined = all(results);

      expect(isSuccess(combined)).toBe(true);
      if (isSuccess(combined)) {
        expect(combined.data).toEqual([]);
      }
    });
  });

  describe('getOrElse', () => {
    it('should return value on success', () => {
      const result = success(42);
      expect(getOrElse(result, 0)).toBe(42);
    });

    it('should return default on failure', () => {
      const result = failure(new Error('fail'));
      expect(getOrElse(result, 0)).toBe(0);
    });
  });

  describe('getOrElseWith', () => {
    it('should return value on success', () => {
      const result = success(42);
      expect(getOrElseWith(result, () => 0)).toBe(42);
    });

    it('should compute default on failure', () => {
      const result = failure(new Error('fail'));
      expect(getOrElseWith(result, (err) => err.message.length)).toBe(4);
    });
  });

  describe('tap', () => {
    it('should execute side effect on success', () => {
      const sideEffect = vi.fn();
      const result = success(42);
      const tapped = tap(result, sideEffect);

      expect(sideEffect).toHaveBeenCalledWith(42);
      expect(tapped).toBe(result);
    });

    it('should not execute side effect on failure', () => {
      const sideEffect = vi.fn();
      const result = failure(new Error('fail'));
      const tapped = tap(result, sideEffect);

      expect(sideEffect).not.toHaveBeenCalled();
      expect(tapped).toBe(result);
    });
  });

  describe('tapError', () => {
    it('should not execute side effect on success', () => {
      const sideEffect = vi.fn();
      const result = success(42);
      const tapped = tapError(result, sideEffect);

      expect(sideEffect).not.toHaveBeenCalled();
      expect(tapped).toBe(result);
    });

    it('should execute side effect on failure', () => {
      const sideEffect = vi.fn();
      const error = new Error('fail');
      const result = failure(error);
      const tapped = tapError(result, sideEffect);

      expect(sideEffect).toHaveBeenCalledWith(error);
      expect(tapped).toBe(result);
    });
  });

  describe('toPromise', () => {
    it('should resolve on success', async () => {
      const result = success(42);
      const value = await toPromise(result);
      expect(value).toBe(42);
    });

    it('should reject on failure', async () => {
      const error = new Error('fail');
      const result = failure(error);
      await expect(toPromise(result)).rejects.toBe(error);
    });
  });

  describe('fromNullable', () => {
    it('should create success for non-null values', () => {
      const result = fromNullable(42, new Error('null'));
      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data).toBe(42);
      }
    });

    it('should create failure for null', () => {
      const error = new Error('null');
      const result = fromNullable(null, error);
      expect(isFailure(result)).toBe(true);
      if (isFailure(result)) {
        expect(result.error).toBe(error);
      }
    });

    it('should create failure for undefined', () => {
      const error = new Error('undefined');
      const result = fromNullable(undefined, error);
      expect(isFailure(result)).toBe(true);
      if (isFailure(result)) {
        expect(result.error).toBe(error);
      }
    });

    it('should handle falsy values that are not null/undefined', () => {
      expect(isSuccess(fromNullable(0, new Error('null')))).toBe(true);
      expect(isSuccess(fromNullable('', new Error('null')))).toBe(true);
      expect(isSuccess(fromNullable(false, new Error('null')))).toBe(true);
    });
  });

  describe('non-Error types', () => {
    it('should handle string errors in tryAsync', async () => {
      const result = await tryAsync<number, string>(async () => {
        throw new Error('string error');
      });

      expect(isFailure(result)).toBe(true);
      if (isFailure(result)) {
        expect(isAppError(result.error)).toBe(true);
        expect(result.error.message).toBe('string error');
      }
    });

    it('should handle string errors in trySync', () => {
      const result = trySync<number, string>(() => {
        throw new Error('string error');
      });

      expect(isFailure(result)).toBe(true);
      if (isFailure(result)) {
        expect(isAppError(result.error)).toBe(true);
        expect(result.error.message).toBe('string error');
      }
    });
  });
});
