/**
 * Tests for error creation, type guards, and utilities
 */

import { describe, expect, it } from "vitest";
import { ERROR_CODES } from "../../src/error/codes.js";
import type { AppError, ExtendedAppError } from "../../src/error/index.js";
import {
  createError,
  createErrorFromCode,
  formatErrorForLog,
  fromError,
  isAppError,
  isExtendedAppError,
  toAppError,
} from "../../src/error/index.js";

describe("createError", () => {
  describe("basic error creation", () => {
    it("should create error with required fields", () => {
      const error = createError(ERROR_CODES.INVALID_INPUT, "Bad input");

      expect(error.code).toBe(ERROR_CODES.INVALID_INPUT);
      expect(error.message).toBe("Bad input");
      expect(error.name).toBe("VALIDATIONError");
      expect(error.category).toBe("VALIDATION");
    });

    it("should auto-detect category from code", () => {
      const validationError = createError(ERROR_CODES.INVALID_INPUT, "Test");
      expect(validationError.category).toBe("VALIDATION");

      const networkError = createError(ERROR_CODES.CONNECTION_REFUSED, "Test");
      expect(networkError.category).toBe("NETWORK");

      const securityError = createError(ERROR_CODES.UNAUTHORIZED_ACCESS, "Test");
      expect(securityError.category).toBe("SECURITY");
    });

    it("should auto-assign severity based on category", () => {
      const validationError = createError(ERROR_CODES.INVALID_INPUT, "Test");
      expect(validationError.severity).toBe("WARNING");

      const networkError = createError(ERROR_CODES.CONNECTION_REFUSED, "Test");
      expect(networkError.severity).toBe("ERROR");

      const securityError = createError(ERROR_CODES.UNAUTHORIZED_ACCESS, "Test");
      expect(securityError.severity).toBe("CRITICAL");
    });

    it("should set recoverable and retryable flags correctly", () => {
      const validationError = createError(ERROR_CODES.INVALID_INPUT, "Test");
      expect(validationError.isRecoverable).toBeFalsy();
      expect(validationError.isRetryable).toBeFalsy();

      const networkError = createError(ERROR_CODES.CONNECTION_TIMEOUT, "Test");
      expect(networkError.isRecoverable).toBeTruthy();
      expect(networkError.isRetryable).toBeTruthy();
    });

    it("should generate correlation ID automatically", () => {
      const error = createError(ERROR_CODES.INVALID_INPUT, "Test");

      expect(error.correlationId).toBeDefined();
      expect(typeof error.correlationId).toBe("string");
      expect(error.correlationId).toMatch(/^err-/);
    });

    it("should set timestamp", () => {
      const before = Date.now();
      const error = createError(ERROR_CODES.INVALID_INPUT, "Test");
      const after = Date.now();

      expect(error.timestamp).toBeGreaterThanOrEqual(before);
      expect(error.timestamp).toBeLessThanOrEqual(after);
    });

    it("should generate unique correlation IDs", () => {
      const error1 = createError(ERROR_CODES.INVALID_INPUT, "Test 1");
      const error2 = createError(ERROR_CODES.INVALID_INPUT, "Test 2");

      expect(error1.correlationId).not.toBe(error2.correlationId);
    });
  });

  describe("error options", () => {
    it("should accept custom correlation ID", () => {
      const error = createError(ERROR_CODES.INVALID_INPUT, "Test", {
        correlationId: "custom-id-123",
      });

      expect(error.correlationId).toBe("custom-id-123");
    });

    it("should accept custom severity", () => {
      const error = createError(ERROR_CODES.INVALID_INPUT, "Test", {
        severity: "CRITICAL",
      });

      expect(error.severity).toBe("CRITICAL");
    });

    it("should accept custom name", () => {
      const error = createError(ERROR_CODES.INVALID_INPUT, "Test", {
        name: "CustomError",
      });

      expect(error.name).toBe("CustomError");
    });

    it("should accept cause", () => {
      const cause = new Error("Original error");
      const error = createError(ERROR_CODES.INTERNAL_ERROR, "Wrapped error", {
        cause,
      });

      expect(error.cause).toBe(cause);
    });

    it("should accept all options together", () => {
      const cause = new Error("Original");
      const error = createError(ERROR_CODES.INVALID_INPUT, "Test", {
        cause,
        correlationId: "req-123",
        severity: "ERROR",
        name: "MyError",
      });

      expect(error.cause).toBe(cause);
      expect(error.correlationId).toBe("req-123");
      expect(error.severity).toBe("ERROR");
      expect(error.name).toBe("MyError");
    });

    it("should not include cause field if not provided", () => {
      const error = createError(ERROR_CODES.INVALID_INPUT, "Test");

      expect("cause" in error).toBeFalsy();
    });
  });

  describe("all error categories", () => {
    it("should create errors for all categories", () => {
      const errors = [
        { code: ERROR_CODES.INVALID_INPUT, category: "VALIDATION" },
        { code: ERROR_CODES.RUNTIME_EXCEPTION, category: "RUNTIME" },
        { code: ERROR_CODES.CONNECTION_REFUSED, category: "NETWORK" },
        { code: ERROR_CODES.FILE_NOT_FOUND, category: "FILESYSTEM" },
        { code: ERROR_CODES.CONFIG_NOT_FOUND, category: "CONFIGURATION" },
        { code: ERROR_CODES.UNAUTHORIZED_ACCESS, category: "SECURITY" },
        { code: ERROR_CODES.OPERATION_TIMEOUT, category: "TIMEOUT" },
        { code: ERROR_CODES.OUT_OF_MEMORY, category: "RESOURCE" },
        { code: ERROR_CODES.AUTHENTICATION_FAILED, category: "AUTH" },
      ] as const;

      for (const { code, category } of errors) {
        const error = createError(code, "Test message");
        expect(error.category).toBe(category);
        expect(error.code).toBe(code);
      }
    });
  });
});

describe("createErrorFromCode", () => {
  it("should create error with generic message", () => {
    const error = createErrorFromCode(ERROR_CODES.CONNECTION_TIMEOUT);

    expect(error.code).toBe(ERROR_CODES.CONNECTION_TIMEOUT);
    expect(error.message).toBe("NETWORK error occurred");
    expect(error.category).toBe("NETWORK");
  });

  it("should generate category-based message", () => {
    const validationError = createErrorFromCode(ERROR_CODES.INVALID_INPUT);
    expect(validationError.message).toBe("VALIDATION error occurred");

    const securityError = createErrorFromCode(ERROR_CODES.UNAUTHORIZED_ACCESS);
    expect(securityError.message).toBe("SECURITY error occurred");
  });

  it("should accept options", () => {
    const cause = new Error("Original");
    const error = createErrorFromCode(ERROR_CODES.INTERNAL_ERROR, {
      cause,
      correlationId: "test-123",
      severity: "CRITICAL",
    });

    expect(error.cause).toBe(cause);
    expect(error.correlationId).toBe("test-123");
    expect(error.severity).toBe("CRITICAL");
  });

  it("should set all metadata correctly", () => {
    const error = createErrorFromCode(ERROR_CODES.CONNECTION_TIMEOUT);

    expect(error.severity).toBe("ERROR");
    expect(error.isRecoverable).toBeTruthy();
    expect(error.isRetryable).toBeTruthy();
    expect(error.timestamp).toBeDefined();
    expect(error.correlationId).toBeDefined();
  });
});

describe("isAppError", () => {
  describe("valid AppError objects", () => {
    it("should return true for minimal AppError", () => {
      const error: AppError = {
        code: 1000,
        message: "Test error",
        name: "TestError",
      };

      expect(isAppError(error)).toBeTruthy();
    });

    it("should return true for AppError with cause", () => {
      const error: AppError = {
        code: 1000,
        message: "Test error",
        name: "TestError",
        cause: new Error("Cause"),
      };

      expect(isAppError(error)).toBeTruthy();
    });

    it("should return true for ExtendedAppError", () => {
      const error = createError(ERROR_CODES.INVALID_INPUT, "Test");
      expect(isAppError(error)).toBeTruthy();
    });
  });

  describe("invalid objects", () => {
    it("should return false for null", () => {
      expect(isAppError(null)).toBeFalsy();
    });

    it("should return false for undefined", () => {
      expect(isAppError(undefined)).toBeFalsy();
    });

    it("should return false for primitive values", () => {
      expect(isAppError(42)).toBeFalsy();
      expect(isAppError("error")).toBeFalsy();
      expect(isAppError(true)).toBeFalsy();
    });

    it("should return false for standard Error", () => {
      expect(isAppError(new Error("Test"))).toBeFalsy();
    });

    it("should return false for object missing code", () => {
      expect(isAppError({ message: "Test", name: "Error" })).toBeFalsy();
    });

    it("should return false for object missing message", () => {
      expect(isAppError({ code: 1000, name: "Error" })).toBeFalsy();
    });

    it("should return false for object missing name", () => {
      expect(isAppError({ code: 1000, message: "Test" })).toBeFalsy();
    });

    it("should return false for object with wrong types", () => {
      expect(isAppError({ code: "1000", message: "Test", name: "Error" })).toBeFalsy();
      expect(isAppError({ code: 1000, message: 123, name: "Error" })).toBeFalsy();
      expect(isAppError({ code: 1000, message: "Test", name: 123 })).toBeFalsy();
    });

    it("should return false for empty object", () => {
      expect(isAppError({})).toBeFalsy();
    });
  });
});

describe("isExtendedAppError", () => {
  describe("valid ExtendedAppError objects", () => {
    it("should return true for createError output", () => {
      const error = createError(ERROR_CODES.INVALID_INPUT, "Test");
      expect(isExtendedAppError(error)).toBeTruthy();
    });

    it("should return true for manually constructed ExtendedAppError", () => {
      const error: ExtendedAppError = {
        code: 1000,
        message: "Test",
        name: "TestError",
        severity: "WARNING",
        category: "VALIDATION",
        correlationId: "test-123",
        timestamp: Date.now(),
        isRecoverable: false,
        isRetryable: false,
      };

      expect(isExtendedAppError(error)).toBeTruthy();
    });
  });

  describe("invalid objects", () => {
    it("should return false for minimal AppError (missing extended fields)", () => {
      const error: AppError = {
        code: 1000,
        message: "Test",
        name: "Error",
      };

      expect(isExtendedAppError(error)).toBeFalsy();
    });

    it("should return false for null/undefined", () => {
      expect(isExtendedAppError(null)).toBeFalsy();
      expect(isExtendedAppError(undefined)).toBeFalsy();
    });

    it("should return false for standard Error", () => {
      expect(isExtendedAppError(new Error("Test"))).toBeFalsy();
    });

    it("should return false for AppError missing severity", () => {
      const error = {
        code: 1000,
        message: "Test",
        name: "Error",
        category: "VALIDATION",
        correlationId: "test",
        timestamp: Date.now(),
        isRecoverable: false,
        isRetryable: false,
      };

      expect(isExtendedAppError(error)).toBeFalsy();
    });

    it("should return false for AppError with wrong field types", () => {
      const error = {
        code: 1000,
        message: "Test",
        name: "Error",
        severity: 123, // Should be string
        category: "VALIDATION",
        correlationId: "test",
        timestamp: Date.now(),
        isRecoverable: false,
        isRetryable: false,
      };

      expect(isExtendedAppError(error)).toBeFalsy();
    });
  });
});

describe("fromError", () => {
  it("should convert standard Error to ExtendedAppError", () => {
    const original = new Error("Original error");
    const appError = fromError(original);

    expect(isExtendedAppError(appError)).toBeTruthy();
    expect(appError.message).toBe("Original error");
    expect(appError.code).toBe(ERROR_CODES.INTERNAL_ERROR);
    expect(appError.cause).toBe(original);
  });

  it("should preserve error name", () => {
    const original = new TypeError("Type error");
    const appError = fromError(original);

    expect(appError.name).toBe("TypeError");
  });

  it("should accept custom code", () => {
    const original = new Error("Test");
    const appError = fromError(original, ERROR_CODES.RUNTIME_EXCEPTION);

    expect(appError.code).toBe(ERROR_CODES.RUNTIME_EXCEPTION);
  });

  it("should set correct category based on code", () => {
    const original = new Error("Test");
    const appError = fromError(original, ERROR_CODES.CONNECTION_TIMEOUT);

    expect(appError.category).toBe("NETWORK");
    expect(appError.severity).toBe("ERROR");
  });

  it("should set metadata correctly", () => {
    const original = new Error("Test");
    const appError = fromError(original);

    expect(appError.correlationId).toBeDefined();
    expect(appError.timestamp).toBeDefined();
    expect(typeof appError.isRecoverable).toBe("boolean");
    expect(typeof appError.isRetryable).toBe("boolean");
  });
});

describe("toAppError", () => {
  describe("ExtendedAppError input", () => {
    it("should return same object if already ExtendedAppError", () => {
      const original = createError(ERROR_CODES.INVALID_INPUT, "Test");
      const result = toAppError(original);

      expect(result).toBe(original); // Same reference
    });
  });

  describe("AppError input", () => {
    it("should upgrade AppError to ExtendedAppError", () => {
      const appError: AppError = {
        code: ERROR_CODES.INVALID_INPUT,
        message: "Test message",
        name: "ValidationError",
      };

      const result = toAppError(appError);

      expect(isExtendedAppError(result)).toBeTruthy();
      expect(result.code).toBe(ERROR_CODES.INVALID_INPUT);
      expect(result.message).toBe("Test message");
      expect(result.name).toBe("ValidationError");
    });

    it("should preserve cause when upgrading", () => {
      const cause = new Error("Original");
      const appError: AppError = {
        code: ERROR_CODES.INVALID_INPUT,
        message: "Test",
        name: "Error",
        cause,
      };

      const result = toAppError(appError);

      expect(result.cause).toBe(cause);
    });

    it("should use UNKNOWN_ERROR for invalid codes", () => {
      const appError = {
        code: 99_999, // Invalid code
        message: "Test",
        name: "Error",
      };

      const result = toAppError(appError);

      expect(result.code).toBe(ERROR_CODES.UNKNOWN_ERROR);
    });

    it("should preserve valid error codes", () => {
      const appError = {
        code: ERROR_CODES.CONNECTION_TIMEOUT,
        message: "Test",
        name: "Error",
      };

      const result = toAppError(appError);

      expect(result.code).toBe(ERROR_CODES.CONNECTION_TIMEOUT);
      expect(result.category).toBe("NETWORK");
    });
  });

  describe("Error object input", () => {
    it("should convert standard Error", () => {
      const error = new Error("Standard error");
      const result = toAppError(error);

      expect(isExtendedAppError(result)).toBeTruthy();
      expect(result.message).toBe("Standard error");
      expect(result.code).toBe(ERROR_CODES.UNKNOWN_ERROR);
    });

    it("should use custom code if provided", () => {
      const error = new Error("Test");
      const result = toAppError(error, ERROR_CODES.INTERNAL_ERROR);

      expect(result.code).toBe(ERROR_CODES.INTERNAL_ERROR);
    });
  });

  describe("string input", () => {
    it("should convert string to ExtendedAppError", () => {
      const result = toAppError("String error message");

      expect(isExtendedAppError(result)).toBeTruthy();
      expect(result.message).toBe("String error message");
      expect(result.code).toBe(ERROR_CODES.UNKNOWN_ERROR);
    });

    it("should use custom code for string errors", () => {
      const result = toAppError("Test", ERROR_CODES.RUNTIME_EXCEPTION);

      expect(result.code).toBe(ERROR_CODES.RUNTIME_EXCEPTION);
    });
  });

  describe("object with message input", () => {
    it("should extract message from object", () => {
      const obj = { message: "Object error message", other: "data" };
      const result = toAppError(obj);

      expect(result.message).toBe("Object error message");
      expect(result.code).toBe(ERROR_CODES.UNKNOWN_ERROR);
    });
  });

  describe("unknown input", () => {
    it("should stringify unknown types", () => {
      const result1 = toAppError(42);
      expect(result1.message).toBe("42");

      const result2 = toAppError(true);
      expect(result2.message).toBe("true");

      const result3 = toAppError({ complex: "object" });
      expect(result3.message).toContain("object");
    });

    it("should handle null", () => {
      const result = toAppError(null);
      expect(result.message).toBe("null");
    });

    it("should handle undefined", () => {
      const result = toAppError(undefined);
      expect(result.message).toBe("undefined");
    });
  });
});

describe("formatErrorForLog", () => {
  it("should format ExtendedAppError for logging", () => {
    const error = createError(ERROR_CODES.CONNECTION_TIMEOUT, "Connection failed");
    const formatted = formatErrorForLog(error);

    expect(formatted.message).toBe("Connection failed");
    expect(formatted.code).toBe(ERROR_CODES.CONNECTION_TIMEOUT);
    expect(formatted.category).toBe("NETWORK");
    expect(formatted.severity).toBe("ERROR");
    expect(formatted.correlationId).toBe(error.correlationId);
    expect(formatted.timestamp).toBe(error.timestamp);
    expect(formatted.isRecoverable).toBeTruthy();
    expect(formatted.isRetryable).toBeTruthy();
  });

  it("should include cause message if present", () => {
    const cause = new Error("Original error");
    const error = createError(ERROR_CODES.INTERNAL_ERROR, "Wrapped error", { cause });
    const formatted = formatErrorForLog(error);

    expect(formatted.cause).toBe("Original error");
  });

  it("should not include cause field if no cause", () => {
    const error = createError(ERROR_CODES.INVALID_INPUT, "Test");
    const formatted = formatErrorForLog(error);

    expect("cause" in formatted).toBeFalsy();
  });

  it("should be JSON-serializable", () => {
    const error = createError(ERROR_CODES.INVALID_INPUT, "Test error");
    const formatted = formatErrorForLog(error);

    expect(() => JSON.stringify(formatted)).not.toThrow();

    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    const json = JSON.parse(JSON.stringify(formatted)) as { code: number; message: string };
    expect(json.message).toBe("Test error");
    expect(json.code).toBe(ERROR_CODES.INVALID_INPUT);
  });

  it("should format all error types correctly", () => {
    const errors = [
      createError(ERROR_CODES.INVALID_INPUT, "Validation"),
      createError(ERROR_CODES.INTERNAL_ERROR, "Runtime"),
      createError(ERROR_CODES.CONNECTION_REFUSED, "Network"),
      createError(ERROR_CODES.FILE_NOT_FOUND, "Filesystem"),
      createError(ERROR_CODES.CONFIG_NOT_FOUND, "Config"),
      createError(ERROR_CODES.UNAUTHORIZED_ACCESS, "Security"),
      createError(ERROR_CODES.OPERATION_TIMEOUT, "Timeout"),
      createError(ERROR_CODES.OUT_OF_MEMORY, "Resource"),
      createError(ERROR_CODES.AUTHENTICATION_FAILED, "Auth"),
    ];

    for (const error of errors) {
      const formatted = formatErrorForLog(error);

      expect(formatted).toHaveProperty("message");
      expect(formatted).toHaveProperty("code");
      expect(formatted).toHaveProperty("category");
      expect(formatted).toHaveProperty("severity");
      expect(formatted).toHaveProperty("correlationId");
      expect(formatted).toHaveProperty("timestamp");
      expect(formatted).toHaveProperty("isRecoverable");
      expect(formatted).toHaveProperty("isRetryable");
    }
  });

  it("should create readonly output", () => {
    const error = createError(ERROR_CODES.INVALID_INPUT, "Test");
    const formatted = formatErrorForLog(error);

    // TypeScript should enforce readonly, but we can't test that at runtime
    // Just verify the structure is correct
    expect(typeof formatted.message).toBe("string");
    expect(typeof formatted.code).toBe("number");
  });
});

describe("error immutability", () => {
  it("should create readonly error objects", () => {
    const error = createError(ERROR_CODES.INVALID_INPUT, "Test");

    // TypeScript enforces readonly at compile time
    // At runtime, objects are still mutable in JS, but the type system prevents it
    expect(error.code).toBe(ERROR_CODES.INVALID_INPUT);
    expect(error.message).toBe("Test");
  });

  it("should not allow modifying error properties (type check)", () => {
    const error = createError(ERROR_CODES.INVALID_INPUT, "Test");

    // This would be a TypeScript compile error:
    // error.code = 2000;
    // error.message = "Changed";

    // Verify original values are preserved
    expect(error.code).toBe(ERROR_CODES.INVALID_INPUT);
    expect(error.message).toBe("Test");
  });
});
