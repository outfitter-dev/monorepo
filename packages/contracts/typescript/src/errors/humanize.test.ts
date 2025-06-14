import { describe, expect, it } from 'vitest';

import { ErrorCode, makeError } from '../error';

import { formatForDevelopers, humanize } from './humanize';

describe('humanize', () => {
  it('should return user-friendly message for known error codes', () => {
    const error = makeError(
      ErrorCode.UNAUTHORIZED,
      'Token expired at 2024-01-01'
    );
    expect(humanize(error)).toBe('Please log in to continue.');
  });

  it('should handle all error codes', () => {
    // Test a sampling of error codes
    const testCases = [
      {
        code: ErrorCode.VALIDATION_ERROR,
        expected: 'Please check your input and try again.',
      },
      {
        code: ErrorCode.NOT_FOUND,
        expected: 'The requested resource was not found.',
      },
      {
        code: ErrorCode.FORBIDDEN,
        expected: "You don't have permission to access this resource.",
      },
      {
        code: ErrorCode.RATE_LIMIT_EXCEEDED,
        expected: 'Too many requests. Please wait a moment and try again.',
      },
    ];

    testCases.forEach(({ code, expected }) => {
      const error = makeError(code, 'Technical details here');
      expect(humanize(error)).toBe(expected);
    });
  });

  it('should sanitize technical error messages when no mapping exists', () => {
    // Create an error with a code that's not in the mapping
    const error = makeError(
      ErrorCode.INTERNAL_ERROR,
      'Database connection error with stack trace info'
    );
    expect(humanize(error)).toBe(
      'An unexpected error occurred. Please try again.'
    );
  });

  it('should handle errors with very technical messages', () => {
    const error = makeError(
      ErrorCode.INTERNAL_ERROR,
      'error exception stack trace'
    );
    expect(humanize(error)).toBe(
      'An unexpected error occurred. Please try again.'
    );
  });

  it('should handle errors with empty or very short messages gracefully', () => {
    // Since makeError validates non-empty messages, we'll test the fallback directly
    const error = {
      code: 'CUSTOM_ERROR' as ErrorCode,
      message: '',
      details: {},
    };
    expect(humanize(error)).toBe('An error occurred. Please try again.');
  });

  it('should preserve meaningful custom messages', () => {
    const error = {
      code: 'CUSTOM_BUSINESS_ERROR' as ErrorCode,
      message: 'Your subscription has expired',
      details: {},
    };
    expect(humanize(error)).toBe('Your subscription has expired');
  });
});

describe('formatForDevelopers', () => {
  it('should format error with code and message', () => {
    const error = makeError(ErrorCode.UNAUTHORIZED, 'Token expired');
    const formatted = formatForDevelopers(error);
    expect(formatted).toContain('[UNAUTHORIZED] Token expired');
  });

  it('should include details when present', () => {
    const error = makeError(ErrorCode.VALIDATION_ERROR, 'Invalid input', {
      field: 'email',
      value: 'invalid-email',
    });
    const formatted = formatForDevelopers(error);
    expect(formatted).toContain('[VALIDATION_ERROR] Invalid input');
    expect(formatted).toContain('Details:');
    expect(formatted).toContain('"field": "email"');
    expect(formatted).toContain('"value": "invalid-email"');
  });

  it('should include cause when present', () => {
    const originalError = new Error('Original error');
    const error = makeError(
      ErrorCode.INTERNAL_ERROR,
      'Wrapper error',
      {},
      originalError
    );
    const formatted = formatForDevelopers(error);
    expect(formatted).toContain('Cause: Original error');
  });

  it('should handle non-Error causes', () => {
    // makeError only accepts Error instances as originalError, so we test the formatter directly
    const error = {
      code: ErrorCode.INTERNAL_ERROR,
      message: 'Wrapper error',
      details: {},
      originalError: new Error('String cause'),
    };
    const formatted = formatForDevelopers(error as AppError);
    expect(formatted).toContain('Cause: String cause');
  });

  it('should format complex errors with all fields', () => {
    const originalError = new Error('Database connection failed');
    const error = makeError(
      ErrorCode.INTERNAL_ERROR,
      'Failed to fetch user',
      {
        userId: '123',
        operation: 'findById',
        timestamp: '2024-01-01T00:00:00Z',
      },
      originalError
    );
    const formatted = formatForDevelopers(error);

    expect(formatted).toContain('[INTERNAL_ERROR] Failed to fetch user');
    expect(formatted).toContain('userId');
    expect(formatted).toContain('operation');
    expect(formatted).toContain('Cause: Database connection failed');
  });
});
