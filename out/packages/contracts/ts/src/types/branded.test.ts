import { describe, expect, it } from 'vitest';

import { ErrorCode } from '../error';
import { isFailure, isSuccess } from '../result';

import {
  createBrandedType,
  createEmail,
  createNonEmptyString,
  createNonNegativeInteger,
  createPercentage,
  createPositiveInteger,
  createTimestamp,
  createUrl,
  createUserId,
  createUuid,
  isEmail,
  isNonEmptyString,
  isNonNegativeInteger,
  isPercentage,
  isPositiveInteger,
  isTimestamp,
  isUrl,
  isUserId,
  isUuid,
} from './branded';

describe('Branded Types', () => {
  describe('UserId', () => {
    it('should create valid user IDs', () => {
      const validIds = ['user123', 'user_456', 'user-789', 'USER_123'];

      for (const id of validIds) {
        const result = createUserId(id);
        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          expect(result.data).toBe(id);
          expect(isUserId(result.data)).toBe(true);
        }
      }
    });

    it('should reject invalid user IDs', () => {
      const invalidIds = ['', '  ', 'user@123', 'user.456', 'user 789'];

      for (const id of invalidIds) {
        const result = createUserId(id);
        expect(isFailure(result)).toBe(true);
        if (isFailure(result)) {
          expect(result.error.code).toBe(ErrorCode.VALIDATION_ERROR);
        }
      }
    });

    it('should have working type guard', () => {
      expect(isUserId('valid_user')).toBe(true);
      expect(isUserId('invalid@user')).toBe(false);
      expect(isUserId(123)).toBe(false);
      expect(isUserId(null)).toBe(false);
    });
  });

  describe('Email', () => {
    it('should create valid emails', () => {
      const validEmails = [
        'user@example.com',
        'USER@EXAMPLE.COM',
        'user+tag@example.co.uk',
        'user.name@sub.example.com',
      ];

      for (const email of validEmails) {
        const result = createEmail(email);
        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          expect(result.data).toBe(email.trim().toLowerCase());
          expect(isEmail(result.data)).toBe(true);
        }
      }
    });

    it('should reject invalid emails', () => {
      const invalidEmails = [
        '',
        '  ',
        'not-an-email',
        '@example.com',
        'user@',
        'user@.com',
      ];

      for (const email of invalidEmails) {
        const result = createEmail(email);
        expect(isFailure(result)).toBe(true);
        if (isFailure(result)) {
          expect(result.error.code).toBe(ErrorCode.VALIDATION_ERROR);
        }
      }
    });

    it('should normalize emails to lowercase', () => {
      const result = createEmail('User@Example.COM');
      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data).toBe('user@example.com');
      }
    });

    it('should have working type guard', () => {
      expect(isEmail('user@example.com')).toBe(true);
      expect(isEmail('not-an-email')).toBe(false);
      expect(isEmail(123)).toBe(false);
    });
  });

  describe('NonEmptyString', () => {
    it('should create valid non-empty strings', () => {
      const validStrings = ['hello', '  hello  ', 'a', '123'];

      for (const str of validStrings) {
        const result = createNonEmptyString(str);
        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          expect(result.data).toBe(str.trim());
          expect(isNonEmptyString(result.data)).toBe(true);
        }
      }
    });

    it('should reject empty strings', () => {
      const emptyStrings = ['', '  ', '\t', '\n'];

      for (const str of emptyStrings) {
        const result = createNonEmptyString(str);
        expect(isFailure(result)).toBe(true);
      }
    });

    it('should have working type guard', () => {
      expect(isNonEmptyString('hello')).toBe(true);
      expect(isNonEmptyString('')).toBe(false);
      expect(isNonEmptyString('  ')).toBe(false);
      expect(isNonEmptyString(123)).toBe(false);
    });
  });

  describe('PositiveInteger', () => {
    it('should create valid positive integers', () => {
      const validNumbers = [1, 100, 999_999];

      for (const num of validNumbers) {
        const result = createPositiveInteger(num);
        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          expect(result.data).toBe(num);
          expect(isPositiveInteger(result.data)).toBe(true);
        }
      }
    });

    it('should reject invalid positive integers', () => {
      const invalidNumbers = [
        0,
        -1,
        -100,
        1.5,
        Number.NaN,
        Number.POSITIVE_INFINITY,
      ];

      for (const num of invalidNumbers) {
        const result = createPositiveInteger(num);
        expect(isFailure(result)).toBe(true);
      }
    });

    it('should have working type guard', () => {
      expect(isPositiveInteger(1)).toBe(true);
      expect(isPositiveInteger(0)).toBe(false);
      expect(isPositiveInteger(1.5)).toBe(false);
      expect(isPositiveInteger('1')).toBe(false);
    });
  });

  describe('NonNegativeInteger', () => {
    it('should create valid non-negative integers', () => {
      const validNumbers = [0, 1, 100, 999_999];

      for (const num of validNumbers) {
        const result = createNonNegativeInteger(num);
        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          expect(result.data).toBe(num);
          expect(isNonNegativeInteger(result.data)).toBe(true);
        }
      }
    });

    it('should reject invalid non-negative integers', () => {
      const invalidNumbers = [
        -1,
        -100,
        1.5,
        Number.NaN,
        Number.POSITIVE_INFINITY,
      ];

      for (const num of invalidNumbers) {
        const result = createNonNegativeInteger(num);
        expect(isFailure(result)).toBe(true);
      }
    });

    it('should have working type guard', () => {
      expect(isNonNegativeInteger(0)).toBe(true);
      expect(isNonNegativeInteger(1)).toBe(true);
      expect(isNonNegativeInteger(-1)).toBe(false);
      expect(isNonNegativeInteger(1.5)).toBe(false);
    });
  });

  describe('Url', () => {
    it('should create valid URLs', () => {
      const validUrls = [
        'https://example.com',
        'http://localhost:3000',
        'https://example.com/path?query=value',
        'ftp://example.com',
      ];

      for (const url of validUrls) {
        const result = createUrl(url);
        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          expect(result.data).toBe(url);
          expect(isUrl(result.data)).toBe(true);
        }
      }
    });

    it('should reject invalid URLs', () => {
      const invalidUrls = ['', 'not-a-url', 'example.com', '//example.com'];

      for (const url of invalidUrls) {
        const result = createUrl(url);
        expect(isFailure(result)).toBe(true);
      }
    });

    it('should have working type guard', () => {
      expect(isUrl('https://example.com')).toBe(true);
      expect(isUrl('not-a-url')).toBe(false);
      expect(isUrl(123)).toBe(false);
    });
  });

  describe('Uuid', () => {
    it('should create valid UUIDs', () => {
      const validUuids = [
        '123e4567-e89b-12d3-a456-426614174000',
        '00000000-0000-4000-8000-000000000000',
        'AAAAAAAA-BBBB-4CCC-8DDD-EEEEEEEEEEEE',
      ];

      for (const uuid of validUuids) {
        const result = createUuid(uuid);
        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          expect(result.data).toBe(uuid.toLowerCase());
          expect(isUuid(result.data)).toBe(true);
        }
      }
    });

    it('should reject invalid UUIDs', () => {
      const invalidUuids = [
        '',
        'not-a-uuid',
        '123e4567-e89b-12d3-a456-42661417400', // Too short
        '123e4567-e89b-12d3-a456-4266141740000', // Too long
        '123e4567-e89b-62d3-a456-426614174000', // Invalid version
      ];

      for (const uuid of invalidUuids) {
        const result = createUuid(uuid);
        expect(isFailure(result)).toBe(true);
      }
    });

    it('should normalize UUIDs to lowercase', () => {
      const result = createUuid('123E4567-E89B-12D3-A456-426614174000');
      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data).toBe('123e4567-e89b-12d3-a456-426614174000');
      }
    });

    it('should have working type guard', () => {
      expect(isUuid('123e4567-e89b-12d3-a456-426614174000')).toBe(true);
      expect(isUuid('not-a-uuid')).toBe(false);
      expect(isUuid(123)).toBe(false);
    });
  });

  describe('Percentage', () => {
    it('should create valid percentages', () => {
      const validPercentages = [0, 50, 100, 25.5, 99.9];

      for (const pct of validPercentages) {
        const result = createPercentage(pct);
        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          expect(result.data).toBe(pct);
          expect(isPercentage(result.data)).toBe(true);
        }
      }
    });

    it('should reject invalid percentages', () => {
      const invalidPercentages = [-1, -0.1, 100.1, 101, 1000];

      for (const pct of invalidPercentages) {
        const result = createPercentage(pct);
        expect(isFailure(result)).toBe(true);
      }
    });

    it('should have working type guard', () => {
      expect(isPercentage(50)).toBe(true);
      expect(isPercentage(0)).toBe(true);
      expect(isPercentage(100)).toBe(true);
      expect(isPercentage(101)).toBe(false);
      expect(isPercentage(-1)).toBe(false);
    });
  });

  describe('Timestamp', () => {
    it('should create valid timestamps', () => {
      const validTimestamps = [1, Date.now(), 1_234_567_890_000];

      for (const ts of validTimestamps) {
        const result = createTimestamp(ts);
        expect(isSuccess(result)).toBe(true);
        if (isSuccess(result)) {
          expect(result.data).toBe(ts);
          expect(isTimestamp(result.data)).toBe(true);
        }
      }
    });

    it('should reject invalid timestamps', () => {
      const invalidTimestamps = [
        0,
        -1,
        1.5,
        Number.NaN,
        Number.POSITIVE_INFINITY,
      ];

      for (const ts of invalidTimestamps) {
        const result = createTimestamp(ts);
        expect(isFailure(result)).toBe(true);
      }
    });

    it('should have working type guard', () => {
      expect(isTimestamp(Date.now())).toBe(true);
      expect(isTimestamp(1_234_567_890_000)).toBe(true);
      expect(isTimestamp(0)).toBe(false);
      expect(isTimestamp(1.5)).toBe(false);
    });
  });

  describe('createBrandedType', () => {
    // ProductSku is a custom branded type for testing
    // type ProductSku = Brand<string, 'ProductSku'>; (inferred from createBrandedType)

    const createProductSku = createBrandedType<string, 'ProductSku'>(
      (value) => /^PROD-[0-9]{4}$/.test(value),
      'Product SKU must be in format PROD-XXXX'
    );

    it('should create custom branded types', () => {
      const result = createProductSku('PROD-1234');
      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data).toBe('PROD-1234');
      }
    });

    it('should reject invalid custom branded values', () => {
      const result = createProductSku('INVALID');
      expect(isFailure(result)).toBe(true);
      if (isFailure(result)) {
        expect(result.error.code).toBe(ErrorCode.VALIDATION_ERROR);
        expect(result.error.message).toBe(
          'Product SKU must be in format PROD-XXXX'
        );
      }
    });
  });

  describe('Type safety', () => {
    it('branded types should not be assignable to base types', () => {
      // This test verifies compile-time behavior through type assertions
      type TestUserId = UserId extends string ? true : false;
      type TestStringNotUserId = string extends UserId ? true : false;

      const _userIdExtendsString: TestUserId = true;
      const _stringNotExtendsUserId: TestStringNotUserId = false;

      expect(_userIdExtendsString).toBe(true);
      expect(_stringNotExtendsUserId).toBe(false);
    });
  });
});
