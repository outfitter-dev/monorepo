/**
 * Tests for branded type utilities
 */

import { describe, expect, it } from "vitest";
import {
  type Brand,
  brand,
  email,
  isBranded,
  nonEmptyString,
  positiveInt,
  uuid,
} from "../../src/branded/index.js";
import { ERROR_CODES } from "../../src/error/codes.js";

describe("brand", () => {
  it("should brand a value", () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- Type is used for documentation
    type UserId = Brand<string, "UserId">;
    const userId = brand<string, "UserId">("user-123");

    // TypeScript should treat this as branded
    expect(userId).toBe("user-123");
  });

  it("should brand numbers", () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- Type is used for documentation
    type Age = Brand<number, "Age">;
    const age = brand<number, "Age">(25);

    expect(age).toBe(25);
  });

  it("should create distinct types at compile time", () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- Type is used for documentation
    type UserId = Brand<string, "UserId">;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- Type is used for documentation
    type Username = Brand<string, "Username">;

    const userId = brand<string, "UserId">("user-123");
    const username = brand<string, "Username">("john_doe");

    // At runtime, these are just strings
    expect(typeof userId).toBe("string");
    expect(typeof username).toBe("string");

    // But TypeScript should treat them as distinct types
    // This test can't verify compile-time behavior, but documents intent
    expect(userId).not.toBe(username);
  });
});

describe("isBranded", () => {
  it("should validate branded types with type guard", () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- Type is used for documentation
    type PositiveInt = Brand<number, "PositiveInt">;
    // eslint-disable-next-line unicorn/consistent-function-scoping -- Test helper
    const isNumber = (v: unknown): v is number => typeof v === "number";

    expect(isBranded<number, "PositiveInt">(42, isNumber)).toBeTruthy();
    expect(isBranded<number, "PositiveInt">("not a number", isNumber)).toBeFalsy();
    expect(isBranded<number, "PositiveInt">(null, isNumber)).toBeFalsy();
    expect(isBranded<number, "PositiveInt">(undefined, isNumber)).toBeFalsy();
  });

  it("should work with string validators", () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- Type is used for documentation
    type Email = Brand<string, "Email">;
    // eslint-disable-next-line unicorn/consistent-function-scoping -- Test helper
    const isString = (v: unknown): v is string => typeof v === "string";

    expect(isBranded<string, "Email">("test@example.com", isString)).toBeTruthy();
    expect(isBranded<string, "Email">(123, isString)).toBeFalsy();
  });

  it("should work with custom validators", () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- Type is used for documentation
    type EvenNumber = Brand<number, "EvenNumber">;
    // eslint-disable-next-line unicorn/consistent-function-scoping -- Test helper
    const isEven = (v: unknown): v is number => typeof v === "number" && v % 2 === 0;

    expect(isBranded<number, "EvenNumber">(42, isEven)).toBeTruthy();
    expect(isBranded<number, "EvenNumber">(43, isEven)).toBeFalsy();
    expect(isBranded<number, "EvenNumber">("42", isEven)).toBeFalsy();
  });
});

describe("positiveInt", () => {
  it("should accept positive integers", () => {
    const result = positiveInt(42);

    expect(result.ok).toBeTruthy();
    if (result.ok) {
      expect(result.value).toBe(42);
    }
  });

  it("should accept 1", () => {
    const result = positiveInt(1);

    expect(result.ok).toBeTruthy();
    if (result.ok) {
      expect(result.value).toBe(1);
    }
  });

  it("should reject zero", () => {
    const result = positiveInt(0);

    expect(result.ok).toBeFalsy();
    if (!result.ok) {
      expect(result.error.code).toBe(ERROR_CODES.INVALID_INPUT);
      expect(result.error.message).toContain("greater than zero");
    }
  });

  it("should reject negative numbers", () => {
    const result = positiveInt(-5);

    expect(result.ok).toBeFalsy();
    if (!result.ok) {
      expect(result.error.code).toBe(ERROR_CODES.INVALID_INPUT);
      expect(result.error.message).toContain("greater than zero");
    }
  });

  it("should reject floats", () => {
    const result = positiveInt(3.14);

    expect(result.ok).toBeFalsy();
    if (!result.ok) {
      expect(result.error.code).toBe(ERROR_CODES.INVALID_INPUT);
      expect(result.error.message).toContain("integer");
    }
  });

  it("should reject NaN", () => {
    const result = positiveInt(Number.NaN);

    expect(result.ok).toBeFalsy();
    if (!result.ok) {
      expect(result.error.code).toBe(ERROR_CODES.INVALID_INPUT);
      expect(result.error.message).toContain("number");
    }
  });

  it("should reject non-numbers", () => {
    // @ts-expect-error Testing runtime validation
    const result = positiveInt("42");

    expect(result.ok).toBeFalsy();
    if (!result.ok) {
      expect(result.error.code).toBe(ERROR_CODES.INVALID_INPUT);
    }
  });

  it("should accept large positive integers", () => {
    const result = positiveInt(999999);

    expect(result.ok).toBeTruthy();
    if (result.ok) {
      expect(result.value).toBe(999999);
    }
  });
});

describe("nonEmptyString", () => {
  it("should accept non-empty strings", () => {
    const result = nonEmptyString("hello");

    expect(result.ok).toBeTruthy();
    if (result.ok) {
      expect(result.value).toBe("hello");
    }
  });

  it("should accept single character strings", () => {
    const result = nonEmptyString("x");

    expect(result.ok).toBeTruthy();
    if (result.ok) {
      expect(result.value).toBe("x");
    }
  });

  it("should trim and validate", () => {
    const result = nonEmptyString("  hello  ");

    expect(result.ok).toBeTruthy();
    if (result.ok) {
      expect(result.value).toBe("hello"); // Trimmed
    }
  });

  it("should reject empty strings", () => {
    const result = nonEmptyString("");

    expect(result.ok).toBeFalsy();
    if (!result.ok) {
      expect(result.error.code).toBe(ERROR_CODES.INVALID_INPUT);
      expect(result.error.message).toContain("not be empty");
    }
  });

  it("should reject whitespace-only strings", () => {
    const result = nonEmptyString("   ");

    expect(result.ok).toBeFalsy();
    if (!result.ok) {
      expect(result.error.code).toBe(ERROR_CODES.INVALID_INPUT);
      expect(result.error.message).toContain("not be empty");
    }
  });

  it("should reject non-strings", () => {
    // @ts-expect-error Testing runtime validation
    const result = nonEmptyString(42);

    expect(result.ok).toBeFalsy();
    if (!result.ok) {
      expect(result.error.code).toBe(ERROR_CODES.INVALID_INPUT);
      expect(result.error.message).toContain("string");
    }
  });

  it("should accept strings with special characters", () => {
    const result = nonEmptyString("hello@world.com");

    expect(result.ok).toBeTruthy();
    if (result.ok) {
      expect(result.value).toBe("hello@world.com");
    }
  });

  it("should accept multiline strings", () => {
    const result = nonEmptyString("line1\nline2");

    expect(result.ok).toBeTruthy();
    if (result.ok) {
      expect(result.value).toBe("line1\nline2");
    }
  });
});

describe("email", () => {
  it("should accept valid email addresses", () => {
    const testEmails = [
      "user@example.com",
      "john.doe@example.com",
      "user+tag@example.co.uk",
      "test123@test-domain.com",
      "user_name@example.com",
    ];

    for (const testEmail of testEmails) {
      const result = email(testEmail);
      expect(result.ok).toBeTruthy();
      if (result.ok) {
        expect(result.value).toBe(testEmail);
      }
    }
  });

  it("should trim whitespace", () => {
    const result = email("  user@example.com  ");

    expect(result.ok).toBeTruthy();
    if (result.ok) {
      expect(result.value).toBe("user@example.com");
    }
  });

  it("should reject invalid email formats", () => {
    const invalidEmails = [
      "not-an-email",
      "@example.com",
      "user@",
      "user",
      "user@.com",
      "user@domain",
      "",
      "   ",
      "user @example.com",
      "user@exam ple.com",
    ];

    for (const invalidEmail of invalidEmails) {
      const result = email(invalidEmail);
      expect(result.ok).toBeFalsy();
      if (!result.ok) {
        expect(result.error.code).toBe(ERROR_CODES.INVALID_INPUT);
        expect(result.error.message).toContain("email");
      }
    }
  });

  it("should reject non-strings", () => {
    // @ts-expect-error Testing runtime validation
    const result = email(42);

    expect(result.ok).toBeFalsy();
    if (!result.ok) {
      expect(result.error.code).toBe(ERROR_CODES.INVALID_INPUT);
      expect(result.error.message).toContain("string");
    }
  });

  it("should handle edge cases", () => {
    // @ts-expect-error Testing runtime validation
    expect(email(null).ok).toBeFalsy();
    // @ts-expect-error Testing runtime validation
    expect(email(undefined).ok).toBeFalsy();
    // @ts-expect-error Testing runtime validation
    expect(email({}).ok).toBeFalsy();
  });
});

describe("uuid", () => {
  it("should accept valid UUID v4", () => {
    const validUuids = [
      "550e8400-e29b-41d4-a716-446655440000",
      "6ba7b810-9dad-41d1-80b4-00c04fd430c8",
      "7c9e6679-7425-40de-944b-e07fc1f90ae7",
      "ABCDEF12-3456-4789-ABCD-EF0123456789", // Uppercase
      "abcdef12-3456-4789-abcd-ef0123456789", // Lowercase
    ];

    for (const validUuid of validUuids) {
      const result = uuid(validUuid);
      expect(result.ok).toBeTruthy();
      if (result.ok) {
        // Should normalize to lowercase
        expect(result.value).toBe(validUuid.toLowerCase());
      }
    }
  });

  it("should trim and normalize to lowercase", () => {
    const result = uuid("  550E8400-E29B-41D4-A716-446655440000  ");

    expect(result.ok).toBeTruthy();
    if (result.ok) {
      expect(result.value).toBe("550e8400-e29b-41d4-a716-446655440000");
    }
  });

  it("should reject invalid UUID formats", () => {
    const invalidUuids = [
      "not-a-uuid",
      "550e8400-e29b-41d4-a716", // Too short
      "550e8400-e29b-41d4-a716-446655440000-extra", // Too long
      "550e8400-e29b-31d4-a716-446655440000", // Wrong version (3 instead of 4)
      "550e8400-e29b-51d4-a716-446655440000", // Wrong version (5 instead of 4)
      "550e8400e29b41d4a716446655440000", // Missing hyphens
      "550e8400-e29b-41d4-c716-446655440000", // Invalid variant
      "",
      "   ",
    ];

    for (const invalidUuid of invalidUuids) {
      const result = uuid(invalidUuid);
      expect(result.ok).toBeFalsy();
      if (!result.ok) {
        expect(result.error.code).toBe(ERROR_CODES.INVALID_INPUT);
        expect(result.error.message).toContain("UUID");
      }
    }
  });

  it("should reject non-strings", () => {
    // @ts-expect-error Testing runtime validation
    const result = uuid(42);

    expect(result.ok).toBeFalsy();
    if (!result.ok) {
      expect(result.error.code).toBe(ERROR_CODES.INVALID_INPUT);
      expect(result.error.message).toContain("string");
    }
  });

  it("should validate UUID v4 version field", () => {
    // Version field must be 4
    const result1 = uuid("550e8400-e29b-41d4-a716-446655440000");
    expect(result1.ok).toBeTruthy();

    // Wrong version
    const result2 = uuid("550e8400-e29b-21d4-a716-446655440000");
    expect(result2.ok).toBeFalsy();
  });

  it("should validate UUID v4 variant field", () => {
    // Variant field must be 8, 9, a, or b
    const validVariants = [
      "550e8400-e29b-41d4-8716-446655440000",
      "550e8400-e29b-41d4-9716-446655440000",
      "550e8400-e29b-41d4-a716-446655440000",
      "550e8400-e29b-41d4-b716-446655440000",
    ];

    for (const validVariant of validVariants) {
      const result = uuid(validVariant);
      expect(result.ok).toBeTruthy();
    }

    // Invalid variant
    const result = uuid("550e8400-e29b-41d4-c716-446655440000");
    expect(result.ok).toBeFalsy();
  });
});
