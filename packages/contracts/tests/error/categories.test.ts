/**
 * Tests for error categorization and severity
 */

import { describe, expect, it } from "vitest";
import type { ErrorCategory } from "../../src/error/categories.js";
import {
  categorizeError,
  getCategoriesBySeverity,
  getSeverity,
  getSeverityForCode,
  isCriticalCategory,
} from "../../src/error/categories.js";
import { ERROR_CODES } from "../../src/error/codes.js";

describe("categorizeError", () => {
  describe("VALIDATION category (1000-1999)", () => {
    it("should categorize validation codes as VALIDATION", () => {
      expect(categorizeError(ERROR_CODES.INVALID_INPUT)).toBe("VALIDATION");
      expect(categorizeError(ERROR_CODES.SCHEMA_VALIDATION_FAILED)).toBe("VALIDATION");
      expect(categorizeError(ERROR_CODES.TYPE_MISMATCH)).toBe("VALIDATION");
      expect(categorizeError(ERROR_CODES.INVALID_JSON)).toBe("VALIDATION");
    });

    it("should categorize any code in 1000-1999 range as VALIDATION", () => {
      expect(categorizeError(1000)).toBe("VALIDATION");
      expect(categorizeError(1500)).toBe("VALIDATION");
      expect(categorizeError(1999)).toBe("VALIDATION");
    });
  });

  describe("RUNTIME category (2000-2999)", () => {
    it("should categorize runtime codes as RUNTIME", () => {
      expect(categorizeError(ERROR_CODES.RUNTIME_EXCEPTION)).toBe("RUNTIME");
      expect(categorizeError(ERROR_CODES.INTERNAL_ERROR)).toBe("RUNTIME");
      expect(categorizeError(ERROR_CODES.UNKNOWN_ERROR)).toBe("RUNTIME");
      expect(categorizeError(ERROR_CODES.DEADLOCK_DETECTED)).toBe("RUNTIME");
    });

    it("should categorize any code in 2000-2999 range as RUNTIME", () => {
      expect(categorizeError(2000)).toBe("RUNTIME");
      expect(categorizeError(2500)).toBe("RUNTIME");
      expect(categorizeError(2999)).toBe("RUNTIME");
    });
  });

  describe("NETWORK category (3000-3999)", () => {
    it("should categorize network codes as NETWORK", () => {
      expect(categorizeError(ERROR_CODES.CONNECTION_REFUSED)).toBe("NETWORK");
      expect(categorizeError(ERROR_CODES.CONNECTION_TIMEOUT)).toBe("NETWORK");
      expect(categorizeError(ERROR_CODES.DNS_LOOKUP_FAILED)).toBe("NETWORK");
      expect(categorizeError(ERROR_CODES.SSL_ERROR)).toBe("NETWORK");
    });

    it("should categorize any code in 3000-3999 range as NETWORK", () => {
      expect(categorizeError(3000)).toBe("NETWORK");
      expect(categorizeError(3500)).toBe("NETWORK");
      expect(categorizeError(3999)).toBe("NETWORK");
    });
  });

  describe("FILESYSTEM category (4000-4999)", () => {
    it("should categorize filesystem codes as FILESYSTEM", () => {
      expect(categorizeError(ERROR_CODES.FILE_NOT_FOUND)).toBe("FILESYSTEM");
      expect(categorizeError(ERROR_CODES.PERMISSION_DENIED)).toBe("FILESYSTEM");
      expect(categorizeError(ERROR_CODES.DISK_FULL)).toBe("FILESYSTEM");
      expect(categorizeError(ERROR_CODES.IO_ERROR)).toBe("FILESYSTEM");
    });

    it("should categorize any code in 4000-4999 range as FILESYSTEM", () => {
      expect(categorizeError(4000)).toBe("FILESYSTEM");
      expect(categorizeError(4500)).toBe("FILESYSTEM");
      expect(categorizeError(4999)).toBe("FILESYSTEM");
    });
  });

  describe("CONFIGURATION category (5000-5999)", () => {
    it("should categorize configuration codes as CONFIGURATION", () => {
      expect(categorizeError(ERROR_CODES.CONFIG_NOT_FOUND)).toBe("CONFIGURATION");
      expect(categorizeError(ERROR_CODES.CONFIG_INVALID)).toBe("CONFIGURATION");
      expect(categorizeError(ERROR_CODES.ENV_VAR_MISSING)).toBe("CONFIGURATION");
      expect(categorizeError(ERROR_CODES.VERSION_MISMATCH)).toBe("CONFIGURATION");
    });

    it("should categorize any code in 5000-5999 range as CONFIGURATION", () => {
      expect(categorizeError(5000)).toBe("CONFIGURATION");
      expect(categorizeError(5500)).toBe("CONFIGURATION");
      expect(categorizeError(5999)).toBe("CONFIGURATION");
    });
  });

  describe("SECURITY category (6000-6999)", () => {
    it("should categorize security codes as SECURITY", () => {
      expect(categorizeError(ERROR_CODES.UNAUTHORIZED_ACCESS)).toBe("SECURITY");
      expect(categorizeError(ERROR_CODES.FORBIDDEN_OPERATION)).toBe("SECURITY");
      expect(categorizeError(ERROR_CODES.INJECTION_ATTEMPT)).toBe("SECURITY");
      expect(categorizeError(ERROR_CODES.RATE_LIMIT_EXCEEDED)).toBe("SECURITY");
    });

    it("should categorize any code in 6000-6999 range as SECURITY", () => {
      expect(categorizeError(6000)).toBe("SECURITY");
      expect(categorizeError(6500)).toBe("SECURITY");
      expect(categorizeError(6999)).toBe("SECURITY");
    });
  });

  describe("TIMEOUT category (7000-7999)", () => {
    it("should categorize timeout codes as TIMEOUT", () => {
      expect(categorizeError(ERROR_CODES.OPERATION_TIMEOUT)).toBe("TIMEOUT");
      expect(categorizeError(ERROR_CODES.REQUEST_TIMEOUT)).toBe("TIMEOUT");
      expect(categorizeError(ERROR_CODES.DEADLINE_EXCEEDED)).toBe("TIMEOUT");
      expect(categorizeError(ERROR_CODES.GRACEFUL_SHUTDOWN_TIMEOUT)).toBe("TIMEOUT");
    });

    it("should categorize any code in 7000-7999 range as TIMEOUT", () => {
      expect(categorizeError(7000)).toBe("TIMEOUT");
      expect(categorizeError(7500)).toBe("TIMEOUT");
      expect(categorizeError(7999)).toBe("TIMEOUT");
    });
  });

  describe("RESOURCE category (8000-8999)", () => {
    it("should categorize resource codes as RESOURCE", () => {
      expect(categorizeError(ERROR_CODES.OUT_OF_MEMORY)).toBe("RESOURCE");
      expect(categorizeError(ERROR_CODES.CPU_LIMIT_EXCEEDED)).toBe("RESOURCE");
      expect(categorizeError(ERROR_CODES.POOL_EXHAUSTED)).toBe("RESOURCE");
      expect(categorizeError(ERROR_CODES.ALLOCATION_FAILED)).toBe("RESOURCE");
    });

    it("should categorize any code in 8000-8999 range as RESOURCE", () => {
      expect(categorizeError(8000)).toBe("RESOURCE");
      expect(categorizeError(8500)).toBe("RESOURCE");
      expect(categorizeError(8999)).toBe("RESOURCE");
    });
  });

  describe("AUTH category (9000-9999)", () => {
    it("should categorize auth codes as AUTH", () => {
      expect(categorizeError(ERROR_CODES.AUTHENTICATION_FAILED)).toBe("AUTH");
      expect(categorizeError(ERROR_CODES.AUTHORIZATION_FAILED)).toBe("AUTH");
      expect(categorizeError(ERROR_CODES.SESSION_EXPIRED)).toBe("AUTH");
      expect(categorizeError(ERROR_CODES.MFA_REQUIRED)).toBe("AUTH");
    });

    it("should categorize any code in 9000-9999 range as AUTH", () => {
      expect(categorizeError(9000)).toBe("AUTH");
      expect(categorizeError(9500)).toBe("AUTH");
      expect(categorizeError(9999)).toBe("AUTH");
    });
  });

  describe("unknown codes", () => {
    it("should default to RUNTIME for unknown codes", () => {
      expect(categorizeError(0)).toBe("RUNTIME");
      expect(categorizeError(500)).toBe("RUNTIME");
      expect(categorizeError(10_000)).toBe("RUNTIME");
      expect(categorizeError(99_999)).toBe("RUNTIME");
    });

    it("should default to RUNTIME for negative codes", () => {
      expect(categorizeError(-1)).toBe("RUNTIME");
      expect(categorizeError(-1000)).toBe("RUNTIME");
    });
  });
});

describe("getSeverity", () => {
  it("should return WARNING for VALIDATION category", () => {
    expect(getSeverity("VALIDATION")).toBe("WARNING");
  });

  it("should return ERROR for RUNTIME category", () => {
    expect(getSeverity("RUNTIME")).toBe("ERROR");
  });

  it("should return ERROR for NETWORK category", () => {
    expect(getSeverity("NETWORK")).toBe("ERROR");
  });

  it("should return ERROR for FILESYSTEM category", () => {
    expect(getSeverity("FILESYSTEM")).toBe("ERROR");
  });

  it("should return ERROR for CONFIGURATION category", () => {
    expect(getSeverity("CONFIGURATION")).toBe("ERROR");
  });

  it("should return CRITICAL for SECURITY category", () => {
    expect(getSeverity("SECURITY")).toBe("CRITICAL");
  });

  it("should return WARNING for TIMEOUT category", () => {
    expect(getSeverity("TIMEOUT")).toBe("WARNING");
  });

  it("should return ERROR for RESOURCE category", () => {
    expect(getSeverity("RESOURCE")).toBe("ERROR");
  });

  it("should return ERROR for AUTH category", () => {
    expect(getSeverity("AUTH")).toBe("ERROR");
  });

  describe("all categories", () => {
    it("should have defined severity for all categories", () => {
      const categories: ErrorCategory[] = [
        "VALIDATION",
        "RUNTIME",
        "NETWORK",
        "FILESYSTEM",
        "CONFIGURATION",
        "SECURITY",
        "TIMEOUT",
        "RESOURCE",
        "AUTH",
      ];

      for (const category of categories) {
        const severity = getSeverity(category);
        expect(severity).toBeDefined();
        expect(["CRITICAL", "ERROR", "WARNING", "INFO"]).toContain(severity);
      }
    });
  });
});

describe("getSeverityForCode", () => {
  it("should return WARNING for validation error codes", () => {
    expect(getSeverityForCode(ERROR_CODES.INVALID_INPUT)).toBe("WARNING");
    expect(getSeverityForCode(ERROR_CODES.SCHEMA_VALIDATION_FAILED)).toBe("WARNING");
    expect(getSeverityForCode(1500)).toBe("WARNING");
  });

  it("should return ERROR for runtime error codes", () => {
    expect(getSeverityForCode(ERROR_CODES.RUNTIME_EXCEPTION)).toBe("ERROR");
    expect(getSeverityForCode(ERROR_CODES.INTERNAL_ERROR)).toBe("ERROR");
    expect(getSeverityForCode(2500)).toBe("ERROR");
  });

  it("should return ERROR for network error codes", () => {
    expect(getSeverityForCode(ERROR_CODES.CONNECTION_REFUSED)).toBe("ERROR");
    expect(getSeverityForCode(ERROR_CODES.CONNECTION_TIMEOUT)).toBe("ERROR");
    expect(getSeverityForCode(3500)).toBe("ERROR");
  });

  it("should return ERROR for filesystem error codes", () => {
    expect(getSeverityForCode(ERROR_CODES.FILE_NOT_FOUND)).toBe("ERROR");
    expect(getSeverityForCode(ERROR_CODES.PERMISSION_DENIED)).toBe("ERROR");
    expect(getSeverityForCode(4500)).toBe("ERROR");
  });

  it("should return ERROR for configuration error codes", () => {
    expect(getSeverityForCode(ERROR_CODES.CONFIG_NOT_FOUND)).toBe("ERROR");
    expect(getSeverityForCode(ERROR_CODES.CONFIG_INVALID)).toBe("ERROR");
    expect(getSeverityForCode(5500)).toBe("ERROR");
  });

  it("should return CRITICAL for security error codes", () => {
    expect(getSeverityForCode(ERROR_CODES.UNAUTHORIZED_ACCESS)).toBe("CRITICAL");
    expect(getSeverityForCode(ERROR_CODES.INJECTION_ATTEMPT)).toBe("CRITICAL");
    expect(getSeverityForCode(6500)).toBe("CRITICAL");
  });

  it("should return WARNING for timeout error codes", () => {
    expect(getSeverityForCode(ERROR_CODES.OPERATION_TIMEOUT)).toBe("WARNING");
    expect(getSeverityForCode(ERROR_CODES.REQUEST_TIMEOUT)).toBe("WARNING");
    expect(getSeverityForCode(7500)).toBe("WARNING");
  });

  it("should return ERROR for resource error codes", () => {
    expect(getSeverityForCode(ERROR_CODES.OUT_OF_MEMORY)).toBe("ERROR");
    expect(getSeverityForCode(ERROR_CODES.POOL_EXHAUSTED)).toBe("ERROR");
    expect(getSeverityForCode(8500)).toBe("ERROR");
  });

  it("should return ERROR for auth error codes", () => {
    expect(getSeverityForCode(ERROR_CODES.AUTHENTICATION_FAILED)).toBe("ERROR");
    expect(getSeverityForCode(ERROR_CODES.SESSION_EXPIRED)).toBe("ERROR");
    expect(getSeverityForCode(9500)).toBe("ERROR");
  });

  it("should return ERROR (via RUNTIME category) for unknown codes", () => {
    expect(getSeverityForCode(0)).toBe("ERROR");
    expect(getSeverityForCode(500)).toBe("ERROR");
    expect(getSeverityForCode(10_000)).toBe("ERROR");
  });
});

describe("isCriticalCategory", () => {
  it("should return true for SECURITY category", () => {
    expect(isCriticalCategory("SECURITY")).toBeTruthy();
  });

  it("should return false for VALIDATION category", () => {
    expect(isCriticalCategory("VALIDATION")).toBeFalsy();
  });

  it("should return false for RUNTIME category", () => {
    expect(isCriticalCategory("RUNTIME")).toBeFalsy();
  });

  it("should return false for NETWORK category", () => {
    expect(isCriticalCategory("NETWORK")).toBeFalsy();
  });

  it("should return false for FILESYSTEM category", () => {
    expect(isCriticalCategory("FILESYSTEM")).toBeFalsy();
  });

  it("should return false for CONFIGURATION category", () => {
    expect(isCriticalCategory("CONFIGURATION")).toBeFalsy();
  });

  it("should return false for TIMEOUT category", () => {
    expect(isCriticalCategory("TIMEOUT")).toBeFalsy();
  });

  it("should return false for RESOURCE category", () => {
    expect(isCriticalCategory("RESOURCE")).toBeFalsy();
  });

  it("should return false for AUTH category", () => {
    expect(isCriticalCategory("AUTH")).toBeFalsy();
  });

  describe("all non-critical categories", () => {
    it("should return false for all categories except SECURITY", () => {
      const nonCriticalCategories: ErrorCategory[] = [
        "VALIDATION",
        "RUNTIME",
        "NETWORK",
        "FILESYSTEM",
        "CONFIGURATION",
        "TIMEOUT",
        "RESOURCE",
        "AUTH",
      ];

      for (const category of nonCriticalCategories) {
        expect(isCriticalCategory(category)).toBeFalsy();
      }
    });
  });
});

describe("getCategoriesBySeverity", () => {
  it("should return SECURITY for CRITICAL severity", () => {
    const critical = getCategoriesBySeverity("CRITICAL");
    expect(critical).toEqual(["SECURITY"]);
  });

  it("should return multiple categories for ERROR severity", () => {
    const errors = getCategoriesBySeverity("ERROR");
    expect(errors).toContain("RUNTIME");
    expect(errors).toContain("NETWORK");
    expect(errors).toContain("FILESYSTEM");
    expect(errors).toContain("CONFIGURATION");
    expect(errors).toContain("RESOURCE");
    expect(errors).toContain("AUTH");
    expect(errors.length).toBe(6);
  });

  it("should return VALIDATION and TIMEOUT for WARNING severity", () => {
    const warnings = getCategoriesBySeverity("WARNING");
    expect(warnings).toContain("VALIDATION");
    expect(warnings).toContain("TIMEOUT");
    expect(warnings.length).toBe(2);
  });

  it("should return empty array for INFO severity (no categories use it)", () => {
    const info = getCategoriesBySeverity("INFO");
    expect(info).toEqual([]);
  });

  describe("severity coverage", () => {
    it("should account for all 9 categories across severities", () => {
      const critical = getCategoriesBySeverity("CRITICAL");
      const errors = getCategoriesBySeverity("ERROR");
      const warnings = getCategoriesBySeverity("WARNING");
      const info = getCategoriesBySeverity("INFO");

      const total = critical.length + errors.length + warnings.length + info.length;
      expect(total).toBe(9); // All 9 categories accounted for
    });
  });

  describe("return type", () => {
    it("should return array of ErrorCategory strings", () => {
      const result = getCategoriesBySeverity("ERROR");
      expect(Array.isArray(result)).toBeTruthy();

      for (const cat of result) {
        expect(typeof cat).toBe("string");
      }
    });
  });
});

describe("category and severity integration", () => {
  it("should maintain consistent mapping between categorize and getSeverity", () => {
    const testCodes = [
      {
        code: ERROR_CODES.INVALID_INPUT,
        expectedCategory: "VALIDATION",
        expectedSeverity: "WARNING",
      },
      { code: ERROR_CODES.INTERNAL_ERROR, expectedCategory: "RUNTIME", expectedSeverity: "ERROR" },
      {
        code: ERROR_CODES.CONNECTION_REFUSED,
        expectedCategory: "NETWORK",
        expectedSeverity: "ERROR",
      },
      {
        code: ERROR_CODES.FILE_NOT_FOUND,
        expectedCategory: "FILESYSTEM",
        expectedSeverity: "ERROR",
      },
      {
        code: ERROR_CODES.CONFIG_NOT_FOUND,
        expectedCategory: "CONFIGURATION",
        expectedSeverity: "ERROR",
      },
      {
        code: ERROR_CODES.UNAUTHORIZED_ACCESS,
        expectedCategory: "SECURITY",
        expectedSeverity: "CRITICAL",
      },
      {
        code: ERROR_CODES.OPERATION_TIMEOUT,
        expectedCategory: "TIMEOUT",
        expectedSeverity: "WARNING",
      },
      { code: ERROR_CODES.OUT_OF_MEMORY, expectedCategory: "RESOURCE", expectedSeverity: "ERROR" },
      {
        code: ERROR_CODES.AUTHENTICATION_FAILED,
        expectedCategory: "AUTH",
        expectedSeverity: "ERROR",
      },
    ] as const;

    for (const { code, expectedCategory, expectedSeverity } of testCodes) {
      const category = categorizeError(code);
      const severity = getSeverity(category);

      expect(category).toBe(expectedCategory);
      expect(severity).toBe(expectedSeverity);

      // Also test getSeverityForCode directly
      expect(getSeverityForCode(code)).toBe(expectedSeverity);
    }
  });
});
