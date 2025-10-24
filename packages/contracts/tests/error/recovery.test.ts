/**
 * Tests for error recovery strategies
 */

import { describe, expect, it } from "vitest";
import { ERROR_CODES } from "../../src/error/codes.js";
import {
  getBackoffDelay,
  getMaxRetryAttempts,
  getRetryDelay,
  isRecoverable,
  isRetryable,
  shouldRetry,
} from "../../src/error/recovery.js";

describe("isRecoverable", () => {
  describe("non-recoverable categories", () => {
    it("should return false for SECURITY errors", () => {
      expect(isRecoverable({ code: ERROR_CODES.UNAUTHORIZED_ACCESS })).toBeFalsy();
      expect(isRecoverable({ code: ERROR_CODES.INJECTION_ATTEMPT })).toBeFalsy();
      expect(isRecoverable({ code: ERROR_CODES.RATE_LIMIT_EXCEEDED })).toBeFalsy();
    });

    it("should return false for AUTH errors", () => {
      expect(isRecoverable({ code: ERROR_CODES.AUTHENTICATION_FAILED })).toBeFalsy();
      expect(isRecoverable({ code: ERROR_CODES.SESSION_EXPIRED })).toBeFalsy();
      expect(isRecoverable({ code: ERROR_CODES.INVALID_CREDENTIALS })).toBeFalsy();
    });

    it("should return false for VALIDATION errors", () => {
      expect(isRecoverable({ code: ERROR_CODES.INVALID_INPUT })).toBeFalsy();
      expect(isRecoverable({ code: ERROR_CODES.SCHEMA_VALIDATION_FAILED })).toBeFalsy();
      expect(isRecoverable({ code: ERROR_CODES.TYPE_MISMATCH })).toBeFalsy();
    });
  });

  describe("recoverable categories", () => {
    it("should return true for NETWORK errors", () => {
      expect(isRecoverable({ code: ERROR_CODES.CONNECTION_REFUSED })).toBeTruthy();
      expect(isRecoverable({ code: ERROR_CODES.CONNECTION_TIMEOUT })).toBeTruthy();
      expect(isRecoverable({ code: ERROR_CODES.DNS_LOOKUP_FAILED })).toBeTruthy();
      expect(isRecoverable({ code: ERROR_CODES.SERVICE_UNAVAILABLE })).toBeTruthy();
    });

    it("should return true for TIMEOUT errors", () => {
      expect(isRecoverable({ code: ERROR_CODES.OPERATION_TIMEOUT })).toBeTruthy();
      expect(isRecoverable({ code: ERROR_CODES.REQUEST_TIMEOUT })).toBeTruthy();
      expect(isRecoverable({ code: ERROR_CODES.DEADLINE_EXCEEDED })).toBeTruthy();
    });

    it("should return true for RESOURCE errors", () => {
      expect(isRecoverable({ code: ERROR_CODES.OUT_OF_MEMORY })).toBeTruthy();
      expect(isRecoverable({ code: ERROR_CODES.POOL_EXHAUSTED })).toBeTruthy();
      expect(isRecoverable({ code: ERROR_CODES.RESOURCE_UNAVAILABLE })).toBeTruthy();
    });
  });

  describe("ambiguous categories", () => {
    it("should return false for RUNTIME errors (conservative default)", () => {
      expect(isRecoverable({ code: ERROR_CODES.RUNTIME_EXCEPTION })).toBeFalsy();
      expect(isRecoverable({ code: ERROR_CODES.INTERNAL_ERROR })).toBeFalsy();
      expect(isRecoverable({ code: ERROR_CODES.UNKNOWN_ERROR })).toBeFalsy();
    });

    it("should return false for FILESYSTEM errors (conservative default)", () => {
      expect(isRecoverable({ code: ERROR_CODES.FILE_NOT_FOUND })).toBeFalsy();
      expect(isRecoverable({ code: ERROR_CODES.PERMISSION_DENIED })).toBeFalsy();
      expect(isRecoverable({ code: ERROR_CODES.IO_ERROR })).toBeFalsy();
    });

    it("should return false for CONFIGURATION errors (conservative default)", () => {
      expect(isRecoverable({ code: ERROR_CODES.CONFIG_NOT_FOUND })).toBeFalsy();
      expect(isRecoverable({ code: ERROR_CODES.CONFIG_INVALID })).toBeFalsy();
      expect(isRecoverable({ code: ERROR_CODES.ENV_VAR_MISSING })).toBeFalsy();
    });
  });
});

describe("isRetryable", () => {
  describe("retryable categories", () => {
    it("should return true for NETWORK errors", () => {
      expect(isRetryable({ code: ERROR_CODES.CONNECTION_REFUSED })).toBeTruthy();
      expect(isRetryable({ code: ERROR_CODES.CONNECTION_TIMEOUT })).toBeTruthy();
      expect(isRetryable({ code: ERROR_CODES.NETWORK_UNREACHABLE })).toBeTruthy();
    });

    it("should return true for TIMEOUT errors", () => {
      expect(isRetryable({ code: ERROR_CODES.OPERATION_TIMEOUT })).toBeTruthy();
      expect(isRetryable({ code: ERROR_CODES.REQUEST_TIMEOUT })).toBeTruthy();
      expect(isRetryable({ code: ERROR_CODES.DEADLINE_EXCEEDED })).toBeTruthy();
    });
  });

  describe("non-retryable categories", () => {
    it("should return false for VALIDATION errors", () => {
      expect(isRetryable({ code: ERROR_CODES.INVALID_INPUT })).toBeFalsy();
      expect(isRetryable({ code: ERROR_CODES.SCHEMA_VALIDATION_FAILED })).toBeFalsy();
    });

    it("should return false for SECURITY errors", () => {
      expect(isRetryable({ code: ERROR_CODES.UNAUTHORIZED_ACCESS })).toBeFalsy();
      expect(isRetryable({ code: ERROR_CODES.INJECTION_ATTEMPT })).toBeFalsy();
    });

    it("should return false for AUTH errors", () => {
      expect(isRetryable({ code: ERROR_CODES.AUTHENTICATION_FAILED })).toBeFalsy();
      expect(isRetryable({ code: ERROR_CODES.SESSION_EXPIRED })).toBeFalsy();
    });

    it("should return false for RUNTIME errors", () => {
      expect(isRetryable({ code: ERROR_CODES.RUNTIME_EXCEPTION })).toBeFalsy();
      expect(isRetryable({ code: ERROR_CODES.INTERNAL_ERROR })).toBeFalsy();
    });

    it("should return false for FILESYSTEM errors", () => {
      expect(isRetryable({ code: ERROR_CODES.FILE_NOT_FOUND })).toBeFalsy();
      expect(isRetryable({ code: ERROR_CODES.PERMISSION_DENIED })).toBeFalsy();
    });

    it("should return false for CONFIGURATION errors", () => {
      expect(isRetryable({ code: ERROR_CODES.CONFIG_NOT_FOUND })).toBeFalsy();
      expect(isRetryable({ code: ERROR_CODES.ENV_VAR_MISSING })).toBeFalsy();
    });

    it("should return false for RESOURCE errors (recoverable but not auto-retryable)", () => {
      expect(isRetryable({ code: ERROR_CODES.OUT_OF_MEMORY })).toBeFalsy();
      expect(isRetryable({ code: ERROR_CODES.POOL_EXHAUSTED })).toBeFalsy();
    });
  });
});

describe("shouldRetry", () => {
  describe("retryable errors within attempt limit", () => {
    it("should return true for first attempt (0) of retryable error", () => {
      const error = { code: ERROR_CODES.CONNECTION_TIMEOUT };
      expect(shouldRetry(error, 0)).toBeTruthy();
    });

    it("should return true for second attempt (1) of retryable error", () => {
      const error = { code: ERROR_CODES.CONNECTION_TIMEOUT };
      expect(shouldRetry(error, 1)).toBeTruthy();
    });

    it("should return true for third attempt (2) of retryable error", () => {
      const error = { code: ERROR_CODES.CONNECTION_TIMEOUT };
      expect(shouldRetry(error, 2)).toBeTruthy();
    });
  });

  describe("retryable errors exceeding attempt limit", () => {
    it("should return false when attempt count equals max attempts (default 3)", () => {
      const error = { code: ERROR_CODES.CONNECTION_TIMEOUT };
      expect(shouldRetry(error, 3)).toBeFalsy();
    });

    it("should return false when attempt count exceeds max attempts", () => {
      const error = { code: ERROR_CODES.CONNECTION_TIMEOUT };
      expect(shouldRetry(error, 4)).toBeFalsy();
      expect(shouldRetry(error, 10)).toBeFalsy();
    });
  });

  describe("non-retryable errors", () => {
    it("should return false for validation errors regardless of attempt count", () => {
      const error = { code: ERROR_CODES.INVALID_INPUT };
      expect(shouldRetry(error, 0)).toBeFalsy();
      expect(shouldRetry(error, 1)).toBeFalsy();
    });

    it("should return false for security errors regardless of attempt count", () => {
      const error = { code: ERROR_CODES.UNAUTHORIZED_ACCESS };
      expect(shouldRetry(error, 0)).toBeFalsy();
      expect(shouldRetry(error, 1)).toBeFalsy();
    });

    it("should return false for auth errors regardless of attempt count", () => {
      const error = { code: ERROR_CODES.AUTHENTICATION_FAILED };
      expect(shouldRetry(error, 0)).toBeFalsy();
    });
  });

  describe("custom max attempts", () => {
    it("should respect custom maxAttempts parameter", () => {
      const error = { code: ERROR_CODES.CONNECTION_TIMEOUT };

      expect(shouldRetry(error, 0, 1)).toBeTruthy(); // First attempt, max 1
      expect(shouldRetry(error, 1, 1)).toBeFalsy(); // Second attempt, exceeded

      expect(shouldRetry(error, 4, 5)).toBeTruthy(); // Within custom limit
      expect(shouldRetry(error, 5, 5)).toBeFalsy(); // Exceeded custom limit
    });

    it("should handle maxAttempts of 0 (no retries)", () => {
      const error = { code: ERROR_CODES.CONNECTION_TIMEOUT };
      expect(shouldRetry(error, 0, 0)).toBeFalsy();
    });

    it("should handle large maxAttempts", () => {
      const error = { code: ERROR_CODES.CONNECTION_TIMEOUT };
      expect(shouldRetry(error, 99, 100)).toBeTruthy();
      expect(shouldRetry(error, 100, 100)).toBeFalsy();
    });
  });
});

describe("getRetryDelay", () => {
  describe("exponential backoff", () => {
    it("should calculate correct delays for first few attempts (no jitter)", () => {
      expect(getRetryDelay(0, { baseDelay: 1000, maxDelay: 30_000, useJitter: false })).toBe(1000); // 1000 * 2^0
      expect(getRetryDelay(1, { baseDelay: 1000, maxDelay: 30_000, useJitter: false })).toBe(2000); // 1000 * 2^1
      expect(getRetryDelay(2, { baseDelay: 1000, maxDelay: 30_000, useJitter: false })).toBe(4000); // 1000 * 2^2
      expect(getRetryDelay(3, { baseDelay: 1000, maxDelay: 30_000, useJitter: false })).toBe(8000); // 1000 * 2^3
      expect(getRetryDelay(4, { baseDelay: 1000, maxDelay: 30_000, useJitter: false })).toBe(
        16_000,
      ); // 1000 * 2^4
    });

    it("should use default baseDelay of 1000ms", () => {
      expect(getRetryDelay(0, { maxDelay: 30_000, useJitter: false })).toBe(1000);
      expect(getRetryDelay(1, { maxDelay: 30_000, useJitter: false })).toBe(2000);
    });

    it("should use default maxDelay of 30000ms", () => {
      expect(getRetryDelay(10, { baseDelay: 1000, useJitter: false })).toBe(30_000);
    });
  });

  describe("delay capping", () => {
    it("should cap delay at maxDelay", () => {
      // 1000 * 2^10 = 1,024,000 but should cap at 30,000
      expect(getRetryDelay(10, { baseDelay: 1000, maxDelay: 30_000, useJitter: false })).toBe(
        30_000,
      );
      expect(getRetryDelay(20, { baseDelay: 1000, maxDelay: 30_000, useJitter: false })).toBe(
        30_000,
      );
    });

    it("should respect custom maxDelay", () => {
      expect(getRetryDelay(5, { baseDelay: 1000, maxDelay: 10_000, useJitter: false })).toBe(
        10_000,
      );
      expect(getRetryDelay(10, { baseDelay: 100, maxDelay: 5000, useJitter: false })).toBe(5000);
    });
  });

  describe("jitter", () => {
    it("should add jitter when useJitter is true (default)", () => {
      const delays = new Set<number>();

      // Run multiple times to verify jitter is working
      for (let i = 0; i < 10; i++) {
        const delay = getRetryDelay(2, { baseDelay: 1000, maxDelay: 30_000, useJitter: true });
        delays.add(delay);

        // Should be around 4000ms ± 10% (3600-4400)
        expect(delay).toBeGreaterThanOrEqual(3600);
        expect(delay).toBeLessThanOrEqual(4400);
      }

      // With jitter, we should get different values
      expect(delays.size).toBeGreaterThan(1);
    });

    it("should not add jitter when useJitter is false", () => {
      const delay1 = getRetryDelay(2, { baseDelay: 1000, maxDelay: 30_000, useJitter: false });
      const delay2 = getRetryDelay(2, { baseDelay: 1000, maxDelay: 30_000, useJitter: false });
      const delay3 = getRetryDelay(2, { baseDelay: 1000, maxDelay: 30_000, useJitter: false });

      // All should be exactly the same
      expect(delay1).toBe(4000);
      expect(delay2).toBe(4000);
      expect(delay3).toBe(4000);
    });

    it("should apply jitter to capped delays", () => {
      const delay = getRetryDelay(10, { baseDelay: 1000, maxDelay: 30_000, useJitter: true });

      // Capped at 30000, with ±10% jitter = 27000-33000
      expect(delay).toBeGreaterThanOrEqual(27_000);
      expect(delay).toBeLessThanOrEqual(33_000);
    });
  });

  describe("custom base delays", () => {
    it("should work with different base delays", () => {
      expect(getRetryDelay(0, { baseDelay: 500, maxDelay: 30_000, useJitter: false })).toBe(500);
      expect(getRetryDelay(1, { baseDelay: 500, maxDelay: 30_000, useJitter: false })).toBe(1000);
      expect(getRetryDelay(2, { baseDelay: 500, maxDelay: 30_000, useJitter: false })).toBe(2000);

      expect(getRetryDelay(0, { baseDelay: 2000, maxDelay: 30_000, useJitter: false })).toBe(2000);
      expect(getRetryDelay(1, { baseDelay: 2000, maxDelay: 30_000, useJitter: false })).toBe(4000);
    });
  });

  describe("edge cases", () => {
    it("should handle attempt count of 0", () => {
      expect(getRetryDelay(0, { baseDelay: 1000, maxDelay: 30_000, useJitter: false })).toBe(1000);
    });

    it("should handle very small base delays", () => {
      expect(getRetryDelay(0, { baseDelay: 1, maxDelay: 30_000, useJitter: false })).toBe(1);
      expect(getRetryDelay(5, { baseDelay: 1, maxDelay: 30_000, useJitter: false })).toBe(32);
    });

    it("should return integer values with jitter", () => {
      for (let i = 0; i < 10; i++) {
        const delay = getRetryDelay(3, { baseDelay: 1000, maxDelay: 30_000, useJitter: true });
        expect(Number.isInteger(delay)).toBeTruthy();
      }
    });
  });
});

describe("getBackoffDelay", () => {
  describe("exponential backoff (default multiplier = 2)", () => {
    it("should match getRetryDelay with default multiplier", () => {
      expect(
        getBackoffDelay(0, { baseDelay: 1000, multiplier: 2, maxDelay: 30_000, useJitter: false }),
      ).toBe(1000);
      expect(
        getBackoffDelay(1, { baseDelay: 1000, multiplier: 2, maxDelay: 30_000, useJitter: false }),
      ).toBe(2000);
      expect(
        getBackoffDelay(2, { baseDelay: 1000, multiplier: 2, maxDelay: 30_000, useJitter: false }),
      ).toBe(4000);
      expect(
        getBackoffDelay(3, { baseDelay: 1000, multiplier: 2, maxDelay: 30_000, useJitter: false }),
      ).toBe(8000);
    });
  });

  describe("linear backoff (multiplier = 1)", () => {
    it("should calculate linear backoff correctly", () => {
      // With multiplier 1, should be baseDelay * 1^attemptCount = baseDelay
      expect(
        getBackoffDelay(0, { baseDelay: 1000, multiplier: 1, maxDelay: 30_000, useJitter: false }),
      ).toBe(1000);
      expect(
        getBackoffDelay(1, { baseDelay: 1000, multiplier: 1, maxDelay: 30_000, useJitter: false }),
      ).toBe(1000);
      expect(
        getBackoffDelay(2, { baseDelay: 1000, multiplier: 1, maxDelay: 30_000, useJitter: false }),
      ).toBe(1000);
      expect(
        getBackoffDelay(3, { baseDelay: 1000, multiplier: 1, maxDelay: 30_000, useJitter: false }),
      ).toBe(1000);
    });
  });

  describe("aggressive backoff (multiplier > 2)", () => {
    it("should calculate aggressive backoff with multiplier 3", () => {
      expect(
        getBackoffDelay(0, { baseDelay: 1000, multiplier: 3, maxDelay: 30_000, useJitter: false }),
      ).toBe(1000); // 1000 * 3^0
      expect(
        getBackoffDelay(1, { baseDelay: 1000, multiplier: 3, maxDelay: 30_000, useJitter: false }),
      ).toBe(3000); // 1000 * 3^1
      expect(
        getBackoffDelay(2, { baseDelay: 1000, multiplier: 3, maxDelay: 30_000, useJitter: false }),
      ).toBe(9000); // 1000 * 3^2
      expect(
        getBackoffDelay(3, { baseDelay: 1000, multiplier: 3, maxDelay: 30_000, useJitter: false }),
      ).toBe(27_000); // 1000 * 3^3
    });

    it("should cap aggressive backoff at maxDelay", () => {
      expect(
        getBackoffDelay(4, { baseDelay: 1000, multiplier: 3, maxDelay: 30_000, useJitter: false }),
      ).toBe(30_000); // Would be 81000, capped at 30000
    });
  });

  describe("jitter support", () => {
    it("should add jitter when enabled", () => {
      const delays = new Set<number>();

      for (let i = 0; i < 10; i++) {
        const delay = getBackoffDelay(2, {
          baseDelay: 1000,
          multiplier: 2,
          maxDelay: 30_000,
          useJitter: true,
        });
        delays.add(delay);

        // 4000 ± 10% = 3600-4400
        expect(delay).toBeGreaterThanOrEqual(3600);
        expect(delay).toBeLessThanOrEqual(4400);
      }

      expect(delays.size).toBeGreaterThan(1);
    });

    it("should not add jitter when disabled", () => {
      const delay1 = getBackoffDelay(2, {
        baseDelay: 1000,
        multiplier: 2,
        maxDelay: 30_000,
        useJitter: false,
      });
      const delay2 = getBackoffDelay(2, {
        baseDelay: 1000,
        multiplier: 2,
        maxDelay: 30_000,
        useJitter: false,
      });

      expect(delay1).toBe(4000);
      expect(delay2).toBe(4000);
    });
  });

  describe("delay capping", () => {
    it("should respect maxDelay parameter", () => {
      expect(
        getBackoffDelay(10, { baseDelay: 1000, multiplier: 2, maxDelay: 10_000, useJitter: false }),
      ).toBe(10_000);
      expect(
        getBackoffDelay(5, { baseDelay: 1000, multiplier: 3, maxDelay: 5000, useJitter: false }),
      ).toBe(5000);
    });
  });

  describe("fractional multipliers", () => {
    it("should work with multipliers less than 1", () => {
      expect(
        getBackoffDelay(0, {
          baseDelay: 1000,
          multiplier: 0.5,
          maxDelay: 30_000,
          useJitter: false,
        }),
      ).toBe(1000); // 1000 * 0.5^0
      expect(
        getBackoffDelay(1, {
          baseDelay: 1000,
          multiplier: 0.5,
          maxDelay: 30_000,
          useJitter: false,
        }),
      ).toBe(500); // 1000 * 0.5^1
      expect(
        getBackoffDelay(2, {
          baseDelay: 1000,
          multiplier: 0.5,
          maxDelay: 30_000,
          useJitter: false,
        }),
      ).toBe(250); // 1000 * 0.5^2
    });

    it("should work with decimal multipliers", () => {
      expect(
        getBackoffDelay(1, {
          baseDelay: 1000,
          multiplier: 1.5,
          maxDelay: 30_000,
          useJitter: false,
        }),
      ).toBe(1500);
      expect(
        getBackoffDelay(2, {
          baseDelay: 1000,
          multiplier: 1.5,
          maxDelay: 30_000,
          useJitter: false,
        }),
      ).toBe(2250);
    });
  });
});

describe("getMaxRetryAttempts", () => {
  describe("NETWORK category", () => {
    it("should return 3 for network errors", () => {
      expect(getMaxRetryAttempts({ code: ERROR_CODES.CONNECTION_REFUSED })).toBe(3);
      expect(getMaxRetryAttempts({ code: ERROR_CODES.CONNECTION_TIMEOUT })).toBe(3);
      expect(getMaxRetryAttempts({ code: ERROR_CODES.DNS_LOOKUP_FAILED })).toBe(3);
      expect(getMaxRetryAttempts({ code: ERROR_CODES.SERVICE_UNAVAILABLE })).toBe(3);
    });
  });

  describe("TIMEOUT category", () => {
    it("should return 2 for timeout errors", () => {
      expect(getMaxRetryAttempts({ code: ERROR_CODES.OPERATION_TIMEOUT })).toBe(2);
      expect(getMaxRetryAttempts({ code: ERROR_CODES.REQUEST_TIMEOUT })).toBe(2);
      expect(getMaxRetryAttempts({ code: ERROR_CODES.DEADLINE_EXCEEDED })).toBe(2);
    });
  });

  describe("RESOURCE category", () => {
    it("should return 5 for resource errors", () => {
      expect(getMaxRetryAttempts({ code: ERROR_CODES.OUT_OF_MEMORY })).toBe(5);
      expect(getMaxRetryAttempts({ code: ERROR_CODES.POOL_EXHAUSTED })).toBe(5);
      expect(getMaxRetryAttempts({ code: ERROR_CODES.RESOURCE_UNAVAILABLE })).toBe(5);
    });
  });

  describe("non-retryable categories", () => {
    it("should return 0 for VALIDATION errors", () => {
      expect(getMaxRetryAttempts({ code: ERROR_CODES.INVALID_INPUT })).toBe(0);
      expect(getMaxRetryAttempts({ code: ERROR_CODES.SCHEMA_VALIDATION_FAILED })).toBe(0);
    });

    it("should return 0 for SECURITY errors", () => {
      expect(getMaxRetryAttempts({ code: ERROR_CODES.UNAUTHORIZED_ACCESS })).toBe(0);
      expect(getMaxRetryAttempts({ code: ERROR_CODES.INJECTION_ATTEMPT })).toBe(0);
    });

    it("should return 0 for AUTH errors", () => {
      expect(getMaxRetryAttempts({ code: ERROR_CODES.AUTHENTICATION_FAILED })).toBe(0);
      expect(getMaxRetryAttempts({ code: ERROR_CODES.SESSION_EXPIRED })).toBe(0);
    });

    it("should return 0 for RUNTIME errors", () => {
      expect(getMaxRetryAttempts({ code: ERROR_CODES.RUNTIME_EXCEPTION })).toBe(0);
      expect(getMaxRetryAttempts({ code: ERROR_CODES.INTERNAL_ERROR })).toBe(0);
    });

    it("should return 0 for FILESYSTEM errors", () => {
      expect(getMaxRetryAttempts({ code: ERROR_CODES.FILE_NOT_FOUND })).toBe(0);
      expect(getMaxRetryAttempts({ code: ERROR_CODES.PERMISSION_DENIED })).toBe(0);
    });

    it("should return 0 for CONFIGURATION errors", () => {
      expect(getMaxRetryAttempts({ code: ERROR_CODES.CONFIG_NOT_FOUND })).toBe(0);
      expect(getMaxRetryAttempts({ code: ERROR_CODES.ENV_VAR_MISSING })).toBe(0);
    });
  });
});
