import { describe, expect, it } from 'vitest';

import { ErrorCode, isAppError, makeError, toAppError } from '../error';
import {
  failure,
  isFailure,
  isSuccess,
  success,
  tryAsync,
  trySync,
} from '../result';

describe('Result Pattern Integration', () => {
  describe('Error handling with Result pattern', () => {
    it('should handle sync operations with Result pattern', () => {
      const syncOperation = () => {
        throw new Error('Sync operation failed');
      };

      const result = trySync(syncOperation);

      expect(isFailure(result)).toBe(true);
      if (!result.success) {
        expect(result.error.message).toBe('Sync operation failed');
      }
    });

    it('should handle async operations with Result pattern', async () => {
      const asyncOperation = async () => {
        throw new Error('Async operation failed');
      };

      const result = await tryAsync(asyncOperation);

      expect(isFailure(result)).toBe(true);
      if (!result.success) {
        expect(result.error.message).toBe('Async operation failed');
      }
    });

    it('should handle successful operations', async () => {
      const successfulOperation = async () => {
        return { data: 'success' };
      };

      const result = await tryAsync(successfulOperation);

      expect(isSuccess(result)).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({ data: 'success' });
      }
    });
  });

  describe('Error conversion and type safety', () => {
    it('should convert unknown errors to AppError', () => {
      const unknownError = { message: 'Some object error' };
      const appError = toAppError(unknownError);

      expect(appError.code).toBe(ErrorCode.INTERNAL_ERROR);
      expect(appError.message).toBe('Unknown error occurred');
      expect(appError.details?.raw).toBe(unknownError);
    });
  });

  describe('Common patterns and workflows', () => {
    it('should chain Result operations correctly', async () => {
      const step1 = async (input: string) => {
        if (input === 'fail-step1') {
          return failure(
            makeError(ErrorCode.VALIDATION_ERROR, 'Step 1 failed')
          );
        }
        return success(`step1-${input}`);
      };

      const step2 = async (input: string) => {
        if (input.includes('fail-step2')) {
          return failure(
            makeError(ErrorCode.EXTERNAL_SERVICE_ERROR, 'Step 2 failed')
          );
        }
        return success(`step2-${input}`);
      };

      // Test successful chain
      const result1 = await step1('success');
      if (result1.success) {
        const result2 = await step2(result1.data);
        expect(isSuccess(result2)).toBe(true);
        if (result2.success) {
          expect(result2.data).toBe('step2-step1-success');
        }
      }

      // Test failed chain
      const failResult = await step1('fail-step1');
      expect(isFailure(failResult)).toBe(true);
      if (!failResult.success) {
        expect(failResult.error.code).toBe(ErrorCode.VALIDATION_ERROR);
      }
    });

    it('should handle multiple operations with different error types', () => {
      const operations = [
        trySync(() => {
          throw new Error('Operation 1 failed');
        }),
        trySync(() => 'success'),
        trySync(() => {
          const error = makeError(ErrorCode.NOT_FOUND, 'Resource not found');
          throw new Error(error.message);
        }),
      ];

      expect(isFailure(operations[0])).toBe(true);
      expect(isSuccess(operations[1])).toBe(true);
      expect(isFailure(operations[2])).toBe(true);

      if (operations[0] && !operations[0].success) {
        expect(operations[0].error.message).toBe('Operation 1 failed');
      }

      if (operations[1]?.success) {
        expect(operations[1].data).toBe('success');
      }

      if (operations[2] && !operations[2].success) {
        expect(isAppError(operations[2].error)).toBe(true);
        expect(operations[2].error.message).toBe('Resource not found');
      }
    });
  });

  describe('Real-world usage patterns', () => {
    it('should handle database-like operations', async () => {
      // Simulate database operations that can fail
      const fetchUser = async (id: string) => {
        if (id === 'not-found') {
          return failure(
            makeError(ErrorCode.NOT_FOUND, 'User not found', { userId: id })
          );
        }
        if (id === 'db-error') {
          return failure(
            makeError(
              ErrorCode.EXTERNAL_SERVICE_ERROR,
              'Database connection failed'
            )
          );
        }
        return success({
          id,
          name: `User ${id}`,
          email: `user${id}@example.com`,
        });
      };

      // Test successful fetch
      const userResult = await fetchUser('123');
      expect(isSuccess(userResult)).toBe(true);
      if (userResult.success) {
        expect(userResult.data.id).toBe('123');
        expect(userResult.data.name).toBe('User 123');
      }

      // Test not found
      const notFoundResult = await fetchUser('not-found');
      expect(isFailure(notFoundResult)).toBe(true);
      if (!notFoundResult.success) {
        expect(notFoundResult.error.code).toBe(ErrorCode.NOT_FOUND);
        expect(notFoundResult.error.details?.userId).toBe('not-found');
      }

      // Test service error
      const errorResult = await fetchUser('db-error');
      expect(isFailure(errorResult)).toBe(true);
      if (!errorResult.success) {
        expect(errorResult.error.code).toBe(ErrorCode.EXTERNAL_SERVICE_ERROR);
      }
    });
  });
});
