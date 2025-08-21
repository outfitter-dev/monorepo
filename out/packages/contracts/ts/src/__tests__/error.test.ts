import { describe, expect, it } from 'vitest';

import {
  ErrorCode,
  isAppError,
  makeError,
  toAppError,
  tryMakeError,
} from '../error';

describe('AppError', () => {
  it('should create app errors', () => {
    const error = makeError(ErrorCode.VALIDATION_ERROR, 'Invalid input', {
      field: 'email',
    });

    expect(error.code).toBe(ErrorCode.VALIDATION_ERROR);
    expect(error.message).toBe('Invalid input');
    expect(error.details).toEqual({ field: 'email' });
    expect(isAppError(error)).toBe(true);
  });

  it('should identify app errors correctly', () => {
    const appError = makeError(ErrorCode.NOT_FOUND, 'Resource not found');
    const regularError = new Error('Regular error');
    const plainObject = { code: 'SOME_CODE', message: 'Some message' };

    expect(isAppError(appError)).toBe(true);
    expect(isAppError(regularError)).toBe(false);
    expect(isAppError(plainObject)).toBe(false);
    expect(isAppError(null)).toBe(false);
    expect(isAppError(undefined)).toBe(false);
  });

  it('should convert unknown errors to app errors', () => {
    const regularError = new Error('Regular error');
    const stringError = 'String error';
    const objectError = { some: 'object' };

    const appError1 = toAppError(regularError);
    expect(appError1.code).toBe(ErrorCode.INTERNAL_ERROR);
    expect(appError1.message).toBe('Regular error');
    expect(appError1.originalError).toBe(regularError);

    const appError2 = toAppError(stringError);
    expect(appError2.code).toBe(ErrorCode.INTERNAL_ERROR);
    expect(appError2.message).toBe('Unknown error occurred');
    expect(appError2.details?.raw).toBe(stringError);

    const appError3 = toAppError(objectError);
    expect(appError3.code).toBe(ErrorCode.INTERNAL_ERROR);
    expect(appError3.details?.raw).toBe(objectError);
  });

  it('should preserve existing app errors when converting', () => {
    const originalError = makeError(ErrorCode.UNAUTHORIZED, 'Access denied');
    const convertedError = toAppError(originalError);

    expect(convertedError).toBe(originalError);
  });

  describe('makeError validation', () => {
    it('should validate error code', () => {
      expect(() => makeError('INVALID_CODE' as ErrorCode, 'message')).toThrow(
        'Invalid error code'
      );
    });

    it('should validate message is non-empty string', () => {
      expect(() => makeError(ErrorCode.VALIDATION_ERROR, '')).toThrow(
        'Error message must be a non-empty string'
      );
      expect(() => makeError(ErrorCode.VALIDATION_ERROR, '   ')).toThrow(
        'Error message cannot be empty or whitespace only'
      );
      // biome-ignore lint/suspicious/noExplicitAny: Testing runtime behavior with invalid types
      expect(() => makeError(ErrorCode.VALIDATION_ERROR, null as any)).toThrow(
        'Error message must be a non-empty string'
      );
    });

    it('should validate details is plain object', () => {
      // biome-ignore lint/suspicious/noExplicitAny: Testing runtime behavior with invalid types
      expect(() =>
        makeError(ErrorCode.VALIDATION_ERROR, 'message', [] as any)
      ).toThrow('Error details must be a plain object');
      // biome-ignore lint/suspicious/noExplicitAny: Testing runtime behavior with invalid types
      expect(() =>
        makeError(ErrorCode.VALIDATION_ERROR, 'message', null as any)
      ).toThrow('Error details must be a plain object');
      // biome-ignore lint/suspicious/noExplicitAny: Testing runtime behavior with invalid types
      expect(() =>
        makeError(ErrorCode.VALIDATION_ERROR, 'message', 'string' as any)
      ).toThrow('Error details must be a plain object');
    });

    it('should validate cause is Error instance', () => {
      expect(() =>
        // biome-ignore lint/suspicious/noExplicitAny: Testing runtime behavior with invalid types
        makeError(
          ErrorCode.VALIDATION_ERROR,
          'message',
          undefined,
          'not an error' as any
        )
      ).toThrow('Error originalError must be an Error instance');
      // biome-ignore lint/suspicious/noExplicitAny: Testing runtime behavior with invalid types
      expect(() =>
        makeError(ErrorCode.VALIDATION_ERROR, 'message', undefined, {} as any)
      ).toThrow('Error originalError must be an Error instance');
    });

    it('should accept valid inputs', () => {
      const validError = makeError(
        ErrorCode.VALIDATION_ERROR,
        'Valid message',
        { key: 'value' },
        new Error('cause')
      );
      expect(validError.code).toBe(ErrorCode.VALIDATION_ERROR);
      expect(validError.message).toBe('Valid message');
      expect(validError.details).toEqual({ key: 'value' });
      expect(validError.originalError).toBeInstanceOf(Error);
    });
  });

  describe('tryMakeError', () => {
    it('should return success for valid inputs', () => {
      const result = tryMakeError(ErrorCode.VALIDATION_ERROR, 'Valid message');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.code).toBe(ErrorCode.VALIDATION_ERROR);
        expect(result.data.message).toBe('Valid message');
      }
    });

    it('should return failure for invalid error code', () => {
      const result = tryMakeError('INVALID_CODE', 'message');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Invalid error code');
      }
    });

    it('should return failure for invalid message', () => {
      const result = tryMakeError(ErrorCode.VALIDATION_ERROR, '');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain(
          'Error message must be a non-empty string'
        );
      }
    });

    it('should return failure for invalid details', () => {
      const result = tryMakeError(ErrorCode.VALIDATION_ERROR, 'message', []);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Error details must be a plain object');
      }
    });

    it('should return failure for invalid cause', () => {
      const result = tryMakeError(
        ErrorCode.VALIDATION_ERROR,
        'message',
        undefined,
        'not an error'
      );
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain(
          'Error originalError must be an Error instance'
        );
      }
    });
  });
});
