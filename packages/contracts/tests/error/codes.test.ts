/**
 * Tests for error code definitions and helpers
 */

import { describe, expect, it } from "vitest";
import { ERROR_CODES, getCodeCategory, isInCategory } from "../../src/error/codes.js";

describe("ERROR_CODES", () => {
  describe("validation codes (1000-1999)", () => {
    it("should have INVALID_INPUT at 1000", () => {
      expect(ERROR_CODES.INVALID_INPUT).toBe(1000);
    });

    it("should have SCHEMA_VALIDATION_FAILED at 1001", () => {
      expect(ERROR_CODES.SCHEMA_VALIDATION_FAILED).toBe(1001);
    });

    it("should have TYPE_MISMATCH at 1002", () => {
      expect(ERROR_CODES.TYPE_MISMATCH).toBe(1002);
    });

    it("should have all validation codes in 1000-1999 range", () => {
      const validationCodes = [
        ERROR_CODES.INVALID_INPUT,
        ERROR_CODES.SCHEMA_VALIDATION_FAILED,
        ERROR_CODES.TYPE_MISMATCH,
        ERROR_CODES.CONSTRAINT_VIOLATION,
        ERROR_CODES.FORMAT_ERROR,
        ERROR_CODES.MISSING_REQUIRED_FIELD,
        ERROR_CODES.INVALID_FIELD_VALUE,
        ERROR_CODES.VALUE_OUT_OF_RANGE,
        ERROR_CODES.INVALID_ENUM_VALUE,
        ERROR_CODES.INVALID_ARRAY_LENGTH,
        ERROR_CODES.INVALID_OBJECT_STRUCTURE,
        ERROR_CODES.DUPLICATE_ENTRY,
        ERROR_CODES.CIRCULAR_REFERENCE,
        ERROR_CODES.INVALID_REFERENCE,
        ERROR_CODES.PARSE_ERROR,
        ERROR_CODES.SERIALIZATION_ERROR,
        ERROR_CODES.DESERIALIZATION_ERROR,
        ERROR_CODES.INVALID_JSON,
        ERROR_CODES.INVALID_XML,
        ERROR_CODES.INVALID_YAML,
        ERROR_CODES.INVALID_TOML,
      ];

      for (const code of validationCodes) {
        expect(code).toBeGreaterThanOrEqual(1000);
        expect(code).toBeLessThan(2000);
      }
    });
  });

  describe("runtime codes (2000-2999)", () => {
    it("should have RUNTIME_EXCEPTION at 2000", () => {
      expect(ERROR_CODES.RUNTIME_EXCEPTION).toBe(2000);
    });

    it("should have INTERNAL_ERROR at 2019", () => {
      expect(ERROR_CODES.INTERNAL_ERROR).toBe(2019);
    });

    it("should have UNKNOWN_ERROR at 2020", () => {
      expect(ERROR_CODES.UNKNOWN_ERROR).toBe(2020);
    });

    it("should have all runtime codes in 2000-2999 range", () => {
      const runtimeCodes = [
        ERROR_CODES.RUNTIME_EXCEPTION,
        ERROR_CODES.HOOK_EXECUTION_FAILED,
        ERROR_CODES.HOOK_NOT_FOUND,
        ERROR_CODES.DEPENDENCY_MISSING,
        ERROR_CODES.MODULE_NOT_FOUND,
        ERROR_CODES.FUNCTION_NOT_FOUND,
        ERROR_CODES.METHOD_NOT_IMPLEMENTED,
        ERROR_CODES.OPERATION_NOT_SUPPORTED,
        ERROR_CODES.ASSERTION_FAILED,
        ERROR_CODES.INVARIANT_VIOLATION,
        ERROR_CODES.UNREACHABLE_CODE,
        ERROR_CODES.STACK_OVERFLOW,
        ERROR_CODES.DIVISION_BY_ZERO,
        ERROR_CODES.NULL_POINTER_EXCEPTION,
        ERROR_CODES.UNDEFINED_BEHAVIOR,
        ERROR_CODES.CONCURRENCY_VIOLATION,
        ERROR_CODES.DEADLOCK_DETECTED,
        ERROR_CODES.RACE_CONDITION,
        ERROR_CODES.STATE_CORRUPTION,
        ERROR_CODES.INTERNAL_ERROR,
        ERROR_CODES.UNKNOWN_ERROR,
      ];

      for (const code of runtimeCodes) {
        expect(code).toBeGreaterThanOrEqual(2000);
        expect(code).toBeLessThan(3000);
      }
    });
  });

  describe("network codes (3000-3999)", () => {
    it("should have CONNECTION_REFUSED at 3000", () => {
      expect(ERROR_CODES.CONNECTION_REFUSED).toBe(3000);
    });

    it("should have CONNECTION_TIMEOUT at 3001", () => {
      expect(ERROR_CODES.CONNECTION_TIMEOUT).toBe(3001);
    });

    it("should have all network codes in 3000-3999 range", () => {
      const networkCodes = [
        ERROR_CODES.CONNECTION_REFUSED,
        ERROR_CODES.CONNECTION_TIMEOUT,
        ERROR_CODES.HOST_NOT_FOUND,
        ERROR_CODES.CONNECTION_RESET,
        ERROR_CODES.NETWORK_UNREACHABLE,
        ERROR_CODES.DNS_LOOKUP_FAILED,
        ERROR_CODES.SSL_ERROR,
        ERROR_CODES.CERTIFICATE_ERROR,
        ERROR_CODES.PROTOCOL_ERROR,
        ERROR_CODES.BAD_GATEWAY,
        ERROR_CODES.SERVICE_UNAVAILABLE,
        ERROR_CODES.GATEWAY_TIMEOUT,
        ERROR_CODES.TOO_MANY_REDIRECTS,
        ERROR_CODES.REQUEST_ABORTED,
        ERROR_CODES.RESPONSE_ERROR,
        ERROR_CODES.INVALID_RESPONSE,
        ERROR_CODES.RESPONSE_TIMEOUT,
        ERROR_CODES.UPLOAD_FAILED,
        ERROR_CODES.DOWNLOAD_FAILED,
        ERROR_CODES.STREAM_ERROR,
        ERROR_CODES.SOCKET_ERROR,
      ];

      for (const code of networkCodes) {
        expect(code).toBeGreaterThanOrEqual(3000);
        expect(code).toBeLessThan(4000);
      }
    });
  });

  describe("filesystem codes (4000-4999)", () => {
    it("should have FILE_NOT_FOUND at 4000", () => {
      expect(ERROR_CODES.FILE_NOT_FOUND).toBe(4000);
    });

    it("should have all filesystem codes in 4000-4999 range", () => {
      const filesystemCodes = [
        ERROR_CODES.FILE_NOT_FOUND,
        ERROR_CODES.PERMISSION_DENIED,
        ERROR_CODES.DISK_FULL,
        ERROR_CODES.FILE_LOCKED,
        ERROR_CODES.DIRECTORY_NOT_EMPTY,
        ERROR_CODES.PATH_NOT_FOUND,
        ERROR_CODES.FILE_ALREADY_EXISTS,
        ERROR_CODES.DIRECTORY_ALREADY_EXISTS,
        ERROR_CODES.INVALID_PATH,
        ERROR_CODES.PATH_TOO_LONG,
        ERROR_CODES.FILE_READ_ERROR,
        ERROR_CODES.FILE_WRITE_ERROR,
        ERROR_CODES.FILE_DELETE_ERROR,
        ERROR_CODES.FILE_COPY_ERROR,
        ERROR_CODES.FILE_MOVE_ERROR,
        ERROR_CODES.SYMLINK_ERROR,
        ERROR_CODES.MOUNT_ERROR,
        ERROR_CODES.UNMOUNT_ERROR,
        ERROR_CODES.FILESYSTEM_ERROR,
        ERROR_CODES.IO_ERROR,
        ERROR_CODES.ENCODING_ERROR,
      ];

      for (const code of filesystemCodes) {
        expect(code).toBeGreaterThanOrEqual(4000);
        expect(code).toBeLessThan(5000);
      }
    });
  });

  describe("configuration codes (5000-5999)", () => {
    it("should have CONFIG_NOT_FOUND at 5000", () => {
      expect(ERROR_CODES.CONFIG_NOT_FOUND).toBe(5000);
    });

    it("should have all configuration codes in 5000-5999 range", () => {
      const configCodes = [
        ERROR_CODES.CONFIG_NOT_FOUND,
        ERROR_CODES.CONFIG_INVALID,
        ERROR_CODES.CONFIG_PARSE_ERROR,
        ERROR_CODES.CONFIG_VALIDATION_FAILED,
        ERROR_CODES.CONFIG_WRITE_FAILED,
        ERROR_CODES.CONFIG_KEY_MISSING,
        ERROR_CODES.CONFIG_VALUE_INVALID,
        ERROR_CODES.CONFIG_CONFLICT,
        ERROR_CODES.CONFIG_MERGE_ERROR,
        ERROR_CODES.CONFIG_SCHEMA_ERROR,
        ERROR_CODES.ENV_VAR_MISSING,
        ERROR_CODES.ENV_VAR_INVALID,
        ERROR_CODES.SETTINGS_ERROR,
        ERROR_CODES.PREFERENCES_ERROR,
        ERROR_CODES.REGISTRY_ERROR,
        ERROR_CODES.INITIALIZATION_ERROR,
        ERROR_CODES.SETUP_ERROR,
        ERROR_CODES.MIGRATION_ERROR,
        ERROR_CODES.VERSION_MISMATCH,
        ERROR_CODES.COMPATIBILITY_ERROR,
        ERROR_CODES.FEATURE_NOT_ENABLED,
      ];

      for (const code of configCodes) {
        expect(code).toBeGreaterThanOrEqual(5000);
        expect(code).toBeLessThan(6000);
      }
    });
  });

  describe("security codes (6000-6999)", () => {
    it("should have UNAUTHORIZED_ACCESS at 6000", () => {
      expect(ERROR_CODES.UNAUTHORIZED_ACCESS).toBe(6000);
    });

    it("should have all security codes in 6000-6999 range", () => {
      const securityCodes = [
        ERROR_CODES.UNAUTHORIZED_ACCESS,
        ERROR_CODES.FORBIDDEN_OPERATION,
        ERROR_CODES.INVALID_CREDENTIALS,
        ERROR_CODES.TOKEN_EXPIRED,
        ERROR_CODES.SECURITY_VIOLATION,
        ERROR_CODES.INJECTION_ATTEMPT,
        ERROR_CODES.INVALID_TOKEN,
        ERROR_CODES.TOKEN_REVOKED,
        ERROR_CODES.INSUFFICIENT_PERMISSIONS,
        ERROR_CODES.ACCESS_DENIED,
        ERROR_CODES.ENCRYPTION_ERROR,
        ERROR_CODES.DECRYPTION_ERROR,
        ERROR_CODES.SIGNATURE_VERIFICATION_FAILED,
        ERROR_CODES.HASH_MISMATCH,
        ERROR_CODES.TAMPERING_DETECTED,
        ERROR_CODES.CSRF_VIOLATION,
        ERROR_CODES.XSS_ATTEMPT,
        ERROR_CODES.SQL_INJECTION_ATTEMPT,
        ERROR_CODES.COMMAND_INJECTION_ATTEMPT,
        ERROR_CODES.PATH_TRAVERSAL_ATTEMPT,
        ERROR_CODES.RATE_LIMIT_EXCEEDED,
      ];

      for (const code of securityCodes) {
        expect(code).toBeGreaterThanOrEqual(6000);
        expect(code).toBeLessThan(7000);
      }
    });
  });

  describe("timeout codes (7000-7999)", () => {
    it("should have OPERATION_TIMEOUT at 7000", () => {
      expect(ERROR_CODES.OPERATION_TIMEOUT).toBe(7000);
    });

    it("should have all timeout codes in 7000-7999 range", () => {
      const timeoutCodes = [
        ERROR_CODES.OPERATION_TIMEOUT,
        ERROR_CODES.REQUEST_TIMEOUT,
        ERROR_CODES.DEADLINE_EXCEEDED,
        ERROR_CODES.HOOK_TIMEOUT,
        ERROR_CODES.QUERY_TIMEOUT,
        ERROR_CODES.TRANSACTION_TIMEOUT,
        ERROR_CODES.LOCK_TIMEOUT,
        ERROR_CODES.WAIT_TIMEOUT,
        ERROR_CODES.IDLE_TIMEOUT,
        ERROR_CODES.CONNECTION_IDLE_TIMEOUT,
        ERROR_CODES.READ_TIMEOUT,
        ERROR_CODES.WRITE_TIMEOUT,
        ERROR_CODES.EXECUTION_TIMEOUT,
        ERROR_CODES.PROCESSING_TIMEOUT,
        ERROR_CODES.RESPONSE_DEADLINE_EXCEEDED,
        ERROR_CODES.KEEPALIVE_TIMEOUT,
        ERROR_CODES.HANDSHAKE_TIMEOUT,
        ERROR_CODES.NEGOTIATION_TIMEOUT,
        ERROR_CODES.STARTUP_TIMEOUT,
        ERROR_CODES.SHUTDOWN_TIMEOUT,
        ERROR_CODES.GRACEFUL_SHUTDOWN_TIMEOUT,
      ];

      for (const code of timeoutCodes) {
        expect(code).toBeGreaterThanOrEqual(7000);
        expect(code).toBeLessThan(8000);
      }
    });
  });

  describe("resource codes (8000-8999)", () => {
    it("should have OUT_OF_MEMORY at 8000", () => {
      expect(ERROR_CODES.OUT_OF_MEMORY).toBe(8000);
    });

    it("should have all resource codes in 8000-8999 range", () => {
      const resourceCodes = [
        ERROR_CODES.OUT_OF_MEMORY,
        ERROR_CODES.CPU_LIMIT_EXCEEDED,
        ERROR_CODES.DISK_QUOTA_EXCEEDED,
        ERROR_CODES.TOO_MANY_OPEN_FILES,
        ERROR_CODES.RESOURCE_UNAVAILABLE,
        ERROR_CODES.POOL_EXHAUSTED,
        ERROR_CODES.CONNECTION_POOL_EXHAUSTED,
        ERROR_CODES.THREAD_POOL_EXHAUSTED,
        ERROR_CODES.BUFFER_OVERFLOW,
        ERROR_CODES.QUEUE_FULL,
        ERROR_CODES.CACHE_FULL,
        ERROR_CODES.STORAGE_FULL,
        ERROR_CODES.BANDWIDTH_EXCEEDED,
        ERROR_CODES.QUOTA_EXCEEDED,
        ERROR_CODES.LIMIT_EXCEEDED,
        ERROR_CODES.CAPACITY_EXCEEDED,
        ERROR_CODES.RESOURCE_CONFLICT,
        ERROR_CODES.RESOURCE_LOCKED,
        ERROR_CODES.RESOURCE_BUSY,
        ERROR_CODES.RESOURCE_EXHAUSTED,
        ERROR_CODES.ALLOCATION_FAILED,
      ];

      for (const code of resourceCodes) {
        expect(code).toBeGreaterThanOrEqual(8000);
        expect(code).toBeLessThan(9000);
      }
    });
  });

  describe("auth codes (9000-9999)", () => {
    it("should have AUTHENTICATION_FAILED at 9000", () => {
      expect(ERROR_CODES.AUTHENTICATION_FAILED).toBe(9000);
    });

    it("should have all auth codes in 9000-9999 range", () => {
      const authCodes = [
        ERROR_CODES.AUTHENTICATION_FAILED,
        ERROR_CODES.AUTHORIZATION_FAILED,
        ERROR_CODES.SESSION_EXPIRED,
        ERROR_CODES.INVALID_SESSION,
        ERROR_CODES.SESSION_NOT_FOUND,
        ERROR_CODES.USER_NOT_FOUND,
        ERROR_CODES.USER_NOT_AUTHENTICATED,
        ERROR_CODES.USER_NOT_AUTHORIZED,
        ERROR_CODES.INVALID_USERNAME,
        ERROR_CODES.INVALID_PASSWORD,
        ERROR_CODES.PASSWORD_EXPIRED,
        ERROR_CODES.ACCOUNT_LOCKED,
        ERROR_CODES.ACCOUNT_DISABLED,
        ERROR_CODES.ACCOUNT_EXPIRED,
        ERROR_CODES.ACCOUNT_NOT_VERIFIED,
        ERROR_CODES.INVALID_API_KEY,
        ERROR_CODES.API_KEY_EXPIRED,
        ERROR_CODES.API_KEY_REVOKED,
        ERROR_CODES.OAUTH_ERROR,
        ERROR_CODES.SSO_ERROR,
        ERROR_CODES.MFA_REQUIRED,
      ];

      for (const code of authCodes) {
        expect(code).toBeGreaterThanOrEqual(9000);
        expect(code).toBeLessThan(10_000);
      }
    });
  });

  describe("code uniqueness", () => {
    it("should have no duplicate codes", () => {
      const codes = Object.values(ERROR_CODES);
      const uniqueCodes = new Set(codes);

      expect(uniqueCodes.size).toBe(codes.length);
    });
  });
});

describe("getCodeCategory", () => {
  describe("valid category ranges", () => {
    it("should return 1000 for codes 1000-1999", () => {
      expect(getCodeCategory(1000)).toBe(1000);
      expect(getCodeCategory(1500)).toBe(1000);
      expect(getCodeCategory(1999)).toBe(1000);
    });

    it("should return 2000 for codes 2000-2999", () => {
      expect(getCodeCategory(2000)).toBe(2000);
      expect(getCodeCategory(2500)).toBe(2000);
      expect(getCodeCategory(2999)).toBe(2000);
    });

    it("should return 3000 for codes 3000-3999", () => {
      expect(getCodeCategory(3000)).toBe(3000);
      expect(getCodeCategory(3500)).toBe(3000);
      expect(getCodeCategory(3999)).toBe(3000);
    });

    it("should return 4000 for codes 4000-4999", () => {
      expect(getCodeCategory(4000)).toBe(4000);
      expect(getCodeCategory(4500)).toBe(4000);
      expect(getCodeCategory(4999)).toBe(4000);
    });

    it("should return 5000 for codes 5000-5999", () => {
      expect(getCodeCategory(5000)).toBe(5000);
      expect(getCodeCategory(5500)).toBe(5000);
      expect(getCodeCategory(5999)).toBe(5000);
    });

    it("should return 6000 for codes 6000-6999", () => {
      expect(getCodeCategory(6000)).toBe(6000);
      expect(getCodeCategory(6500)).toBe(6000);
      expect(getCodeCategory(6999)).toBe(6000);
    });

    it("should return 7000 for codes 7000-7999", () => {
      expect(getCodeCategory(7000)).toBe(7000);
      expect(getCodeCategory(7500)).toBe(7000);
      expect(getCodeCategory(7999)).toBe(7000);
    });

    it("should return 8000 for codes 8000-8999", () => {
      expect(getCodeCategory(8000)).toBe(8000);
      expect(getCodeCategory(8500)).toBe(8000);
      expect(getCodeCategory(8999)).toBe(8000);
    });

    it("should return 9000 for codes 9000-9999", () => {
      expect(getCodeCategory(9000)).toBe(9000);
      expect(getCodeCategory(9500)).toBe(9000);
      expect(getCodeCategory(9999)).toBe(9000);
    });
  });

  describe("edge cases", () => {
    it("should return 0 for code 0", () => {
      expect(getCodeCategory(0)).toBe(0);
    });

    it("should return 0 for codes 1-999", () => {
      expect(getCodeCategory(1)).toBe(0);
      expect(getCodeCategory(500)).toBe(0);
      expect(getCodeCategory(999)).toBe(0);
    });

    it("should return 10000 for codes 10000+", () => {
      expect(getCodeCategory(10_000)).toBe(10_000);
      expect(getCodeCategory(10_500)).toBe(10_000);
    });

    it("should handle negative numbers", () => {
      expect(getCodeCategory(-1)).toBe(-1000);
      expect(getCodeCategory(-1000)).toBe(-1000);
      expect(getCodeCategory(-2500)).toBe(-3000);
    });
  });

  describe("boundary values", () => {
    it("should handle category boundaries correctly", () => {
      // First code in each range
      expect(getCodeCategory(1000)).toBe(1000);
      expect(getCodeCategory(2000)).toBe(2000);
      expect(getCodeCategory(3000)).toBe(3000);

      // Last code in each range
      expect(getCodeCategory(1999)).toBe(1000);
      expect(getCodeCategory(2999)).toBe(2000);
      expect(getCodeCategory(3999)).toBe(3000);
    });
  });
});

describe("isInCategory", () => {
  describe("valid category checks", () => {
    it("should return true for codes in VALIDATION category (1000)", () => {
      expect(isInCategory(ERROR_CODES.INVALID_INPUT, 1000)).toBe(true);
      expect(isInCategory(ERROR_CODES.SCHEMA_VALIDATION_FAILED, 1000)).toBe(true);
      expect(isInCategory(1500, 1000)).toBe(true);
      expect(isInCategory(1999, 1000)).toBe(true);
    });

    it("should return true for codes in RUNTIME category (2000)", () => {
      expect(isInCategory(ERROR_CODES.RUNTIME_EXCEPTION, 2000)).toBe(true);
      expect(isInCategory(ERROR_CODES.INTERNAL_ERROR, 2000)).toBe(true);
      expect(isInCategory(2500, 2000)).toBe(true);
    });

    it("should return true for codes in NETWORK category (3000)", () => {
      expect(isInCategory(ERROR_CODES.CONNECTION_REFUSED, 3000)).toBe(true);
      expect(isInCategory(ERROR_CODES.CONNECTION_TIMEOUT, 3000)).toBe(true);
      expect(isInCategory(3500, 3000)).toBe(true);
    });

    it("should return true for codes in FILESYSTEM category (4000)", () => {
      expect(isInCategory(ERROR_CODES.FILE_NOT_FOUND, 4000)).toBe(true);
      expect(isInCategory(ERROR_CODES.PERMISSION_DENIED, 4000)).toBe(true);
    });

    it("should return true for codes in CONFIGURATION category (5000)", () => {
      expect(isInCategory(ERROR_CODES.CONFIG_NOT_FOUND, 5000)).toBe(true);
      expect(isInCategory(ERROR_CODES.CONFIG_INVALID, 5000)).toBe(true);
    });

    it("should return true for codes in SECURITY category (6000)", () => {
      expect(isInCategory(ERROR_CODES.UNAUTHORIZED_ACCESS, 6000)).toBe(true);
      expect(isInCategory(ERROR_CODES.FORBIDDEN_OPERATION, 6000)).toBe(true);
    });

    it("should return true for codes in TIMEOUT category (7000)", () => {
      expect(isInCategory(ERROR_CODES.OPERATION_TIMEOUT, 7000)).toBe(true);
      expect(isInCategory(ERROR_CODES.REQUEST_TIMEOUT, 7000)).toBe(true);
    });

    it("should return true for codes in RESOURCE category (8000)", () => {
      expect(isInCategory(ERROR_CODES.OUT_OF_MEMORY, 8000)).toBe(true);
      expect(isInCategory(ERROR_CODES.CPU_LIMIT_EXCEEDED, 8000)).toBe(true);
    });

    it("should return true for codes in AUTH category (9000)", () => {
      expect(isInCategory(ERROR_CODES.AUTHENTICATION_FAILED, 9000)).toBe(true);
      expect(isInCategory(ERROR_CODES.AUTHORIZATION_FAILED, 9000)).toBe(true);
    });
  });

  describe("invalid category checks", () => {
    it("should return false for codes not in the specified category", () => {
      expect(isInCategory(ERROR_CODES.INVALID_INPUT, 2000)).toBe(false);
      expect(isInCategory(ERROR_CODES.CONNECTION_REFUSED, 1000)).toBe(false);
      expect(isInCategory(ERROR_CODES.FILE_NOT_FOUND, 3000)).toBe(false);
    });

    it("should return false for boundary mismatches", () => {
      // 1999 is in 1000 category, not 2000
      expect(isInCategory(1999, 2000)).toBe(false);

      // 2000 is in 2000 category, not 1000
      expect(isInCategory(2000, 1000)).toBe(false);
    });
  });

  describe("edge cases", () => {
    it("should handle zero category", () => {
      expect(isInCategory(0, 0)).toBe(true);
      expect(isInCategory(500, 0)).toBe(true);
      expect(isInCategory(999, 0)).toBe(true);
    });

    it("should handle codes outside defined ranges", () => {
      expect(isInCategory(10_000, 10_000)).toBe(true);
      expect(isInCategory(10_500, 10_000)).toBe(true);
    });
  });
});
