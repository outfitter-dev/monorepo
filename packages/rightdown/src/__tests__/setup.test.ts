import { describe, it, expect } from 'vitest';
import { success, failure, makeError, isSuccess, isFailure } from '@outfitter/contracts';
import { RIGHTDOWN_ERROR_CODES } from '../core/errors.js';

describe('Test Setup', () => {
  it('should have access to @outfitter/contracts', () => {
    // Test success creation
    const successResult = success('test');
    expect(isSuccess(successResult)).toBe(true);
    if (successResult.success) {
      expect(successResult.data).toBe('test');
    }

    // Test failure creation
    const failureResult = failure(makeError(RIGHTDOWN_ERROR_CODES.VALIDATION_ERROR, 'Test error'));
    expect(isFailure(failureResult)).toBe(true);
    if (!failureResult.success) {
      expect(failureResult.error.code).toBe('VALIDATION_ERROR');
    }
  });

  it('should have proper error codes defined', () => {
    expect(RIGHTDOWN_ERROR_CODES.FILE_NOT_FOUND).toBe('NOT_FOUND');
    expect(RIGHTDOWN_ERROR_CODES.FORMATTER_NOT_FOUND).toBe('NOT_FOUND');
  });
});
