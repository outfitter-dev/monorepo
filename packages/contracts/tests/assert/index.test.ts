/**
 * Tests for assertion utilities
 */

import { describe, expect, it } from "vitest";
import { assert, assertDefined, assertMatches, assertNonEmpty } from "../../src/assert/index.js";
import { ERROR_CODES } from "../../src/error/codes.js";

describe("assert", () => {
  it("should succeed when condition is true", () => {
    const result = assert(true, "This should pass");

    expect(result.ok).toBeTruthy();
    if (result.ok) {
      expect(result.value).toBe(undefined);
    }
  });

  it("should fail when condition is false", () => {
    const result = assert(false, "This should fail");

    expect(result.ok).toBeFalsy();
    if (!result.ok) {
      expect(result.error.code).toBe(ERROR_CODES.ASSERTION_FAILED);
      expect(result.error.message).toBe("This should fail");
    }
  });

  it("should accept custom error code", () => {
    const result = assert(false, "Unauthorized", ERROR_CODES.UNAUTHORIZED_ACCESS);

    expect(result.ok).toBeFalsy();
    if (!result.ok) {
      expect(result.error.code).toBe(ERROR_CODES.UNAUTHORIZED_ACCESS);
      expect(result.error.message).toBe("Unauthorized");
    }
  });

  it("should work with expressions", () => {
    const x = 10;
    const result = assert(x > 5, "x must be greater than 5");

    expect(result.ok).toBeTruthy();
  });

  it("should work with complex conditions", () => {
    const user = { isAdmin: true, age: 25 };
    const result = assert(user.isAdmin && user.age >= 18, "User must be adult admin");

    expect(result.ok).toBeTruthy();
  });

  it("should fail with complex conditions", () => {
    const user = { isAdmin: false, age: 25 };
    const result = assert(user.isAdmin && user.age >= 18, "User must be adult admin");

    expect(result.ok).toBeFalsy();
    if (!result.ok) {
      expect(result.error.message).toBe("User must be adult admin");
    }
  });
});

describe("assertDefined", () => {
  it("should succeed for defined values", () => {
    const value = "hello";
    const result = assertDefined(value, "Value must be defined");

    expect(result.ok).toBeTruthy();
    if (result.ok) {
      expect(result.value).toBe("hello");
    }
  });

  it("should succeed for zero", () => {
    const value = 0;
    const result = assertDefined(value, "Value must be defined");

    expect(result.ok).toBeTruthy();
    if (result.ok) {
      expect(result.value).toBe(0);
    }
  });

  it("should succeed for false", () => {
    const value = false;
    const result = assertDefined(value, "Value must be defined");

    expect(result.ok).toBeTruthy();
    if (result.ok) {
      expect(result.value).toBeFalsy();
    }
  });

  it("should succeed for empty string", () => {
    const value = "";
    const result = assertDefined(value, "Value must be defined");

    expect(result.ok).toBeTruthy();
    if (result.ok) {
      expect(result.value).toBe("");
    }
  });

  it("should fail for null", () => {
    const value = null;
    const result = assertDefined(value, "Value must not be null");

    expect(result.ok).toBeFalsy();
    if (!result.ok) {
      expect(result.error.code).toBe(ERROR_CODES.ASSERTION_FAILED);
      expect(result.error.message).toBe("Value must not be null");
    }
  });

  it("should fail for undefined", () => {
    const value = undefined;
    const result = assertDefined(value, "Value must not be undefined");

    expect(result.ok).toBeFalsy();
    if (!result.ok) {
      expect(result.error.code).toBe(ERROR_CODES.ASSERTION_FAILED);
      expect(result.error.message).toBe("Value must not be undefined");
    }
  });

  it("should narrow type from nullable", () => {
    const value: string | null = "test";
    const result = assertDefined(value, "String required");

    expect(result.ok).toBeTruthy();
    if (result.ok) {
      // TypeScript should know result.value is string, not string | null
      const length: number = result.value.length;
      expect(length).toBe(4);
    }
  });

  it("should narrow type from optional", () => {
    const value: number | undefined = 42;
    const result = assertDefined(value, "Number required");

    expect(result.ok).toBeTruthy();
    if (result.ok) {
      // TypeScript should know result.value is number, not number | undefined
      const doubled: number = result.value * 2;
      expect(doubled).toBe(84);
    }
  });

  it("should work with complex types", () => {
    interface User {
      id: number;
      name: string;
    }

    const value: User | null = { id: 1, name: "John" };
    const result = assertDefined(value, "User required");

    expect(result.ok).toBeTruthy();
    if (result.ok) {
      expect(result.value.id).toBe(1);
      expect(result.value.name).toBe("John");
    }
  });
});

describe("assertNonEmpty", () => {
  it("should succeed for non-empty arrays", () => {
    const array = [1, 2, 3];
    const result = assertNonEmpty(array, "Array must not be empty");

    expect(result.ok).toBeTruthy();
    if (result.ok) {
      expect(result.value).toEqual([1, 2, 3]);
      // Should be able to destructure safely
      const [first] = result.value;
      expect(first).toBe(1);
    }
  });

  it("should succeed for single-element arrays", () => {
    const array = ["only"];
    const result = assertNonEmpty(array, "Array must not be empty");

    expect(result.ok).toBeTruthy();
    if (result.ok) {
      expect(result.value).toEqual(["only"]);
      const [first] = result.value;
      expect(first).toBe("only");
    }
  });

  it("should fail for empty arrays", () => {
    const array: number[] = [];
    const result = assertNonEmpty(array, "Array cannot be empty");

    expect(result.ok).toBeFalsy();
    if (!result.ok) {
      expect(result.error.code).toBe(ERROR_CODES.ASSERTION_FAILED);
      expect(result.error.message).toBe("Array cannot be empty");
    }
  });

  it("should work with readonly arrays", () => {
    const array: readonly string[] = ["a", "b", "c"];
    const result = assertNonEmpty(array, "Array must not be empty");

    expect(result.ok).toBeTruthy();
    if (result.ok) {
      expect(result.value).toEqual(["a", "b", "c"]);
    }
  });

  it("should preserve array type", () => {
    const array = [{ id: 1 }, { id: 2 }];
    const result = assertNonEmpty(array, "Objects required");

    expect(result.ok).toBeTruthy();
    if (result.ok) {
      const [first] = result.value;
      expect(first.id).toBe(1);
    }
  });

  it("should work with different types", () => {
    const numbers = [1, 2, 3];
    const strings = ["a", "b"];
    const objects = [{ x: 1 }, { x: 2 }];

    expect(assertNonEmpty(numbers, "Error").ok).toBeTruthy();
    expect(assertNonEmpty(strings, "Error").ok).toBeTruthy();
    expect(assertNonEmpty(objects, "Error").ok).toBeTruthy();
  });

  it("should enable safe destructuring", () => {
    const array = [1, 2, 3, 4, 5];
    const result = assertNonEmpty(array, "Array must not be empty");

    expect(result.ok).toBeTruthy();
    if (result.ok) {
      // Safe to destructure - first element guaranteed to exist
      const [first, second, ...rest] = result.value;
      expect(first).toBe(1);
      expect(second).toBe(2);
      expect(rest).toEqual([3, 4, 5]);
    }
  });

  it("should work with const arrays", () => {
    const array = [1, 2, 3] as const;
    const result = assertNonEmpty(array, "Array must not be empty");

    expect(result.ok).toBeTruthy();
    if (result.ok) {
      expect(result.value).toEqual([1, 2, 3]);
    }
  });
});

describe("assertMatches", () => {
  it("should succeed when predicate passes", () => {
    const value = 42;
    const result = assertMatches(value, (n) => n > 0, "Must be positive");

    expect(result.ok).toBeTruthy();
    if (result.ok) {
      expect(result.value).toBe(42);
    }
  });

  it("should fail when predicate fails", () => {
    const value = -5;
    const result = assertMatches(value, (n) => n > 0, "Must be positive");

    expect(result.ok).toBeFalsy();
    if (!result.ok) {
      expect(result.error.code).toBe(ERROR_CODES.ASSERTION_FAILED);
      expect(result.error.message).toBe("Must be positive");
    }
  });

  it("should work with string predicates", () => {
    const value = "hello@example.com";
    const result = assertMatches(value, (s) => s.includes("@"), "Must be an email");

    expect(result.ok).toBeTruthy();
    if (result.ok) {
      expect(result.value).toBe("hello@example.com");
    }
  });

  it("should work with regex predicates", () => {
    const value = "abc123";
    const result = assertMatches(value, (s) => /^[a-z]+[0-9]+$/.test(s), "Must match pattern");

    expect(result.ok).toBeTruthy();
  });

  it("should work with complex predicates", () => {
    interface User {
      age: number;
      isActive: boolean;
    }

    const user: User = { age: 25, isActive: true };
    const result = assertMatches(user, (u) => u.age >= 18 && u.isActive, "Must be active adult");

    expect(result.ok).toBeTruthy();
    if (result.ok) {
      expect(result.value.age).toBe(25);
      expect(result.value.isActive).toBeTruthy();
    }
  });

  it("should fail with complex predicates", () => {
    interface User {
      age: number;
      isActive: boolean;
    }

    const user: User = { age: 16, isActive: true };
    const result = assertMatches(user, (u) => u.age >= 18 && u.isActive, "Must be active adult");

    expect(result.ok).toBeFalsy();
    if (!result.ok) {
      expect(result.error.message).toBe("Must be active adult");
    }
  });

  it("should preserve value type", () => {
    const value = { id: 1, name: "Test" };
    const result = assertMatches(value, (v) => v.id > 0, "ID must be positive");

    expect(result.ok).toBeTruthy();
    if (result.ok) {
      expect(result.value.id).toBe(1);
      expect(result.value.name).toBe("Test");
    }
  });

  it("should work with array predicates", () => {
    const value = [1, 2, 3, 4, 5];
    const result = assertMatches(
      value,
      (arr) => arr.length >= 3,
      "Array must have at least 3 elements",
    );

    expect(result.ok).toBeTruthy();
  });

  it("should work with length checks", () => {
    const password = "secretpassword123";
    const result = assertMatches(
      password,
      (s) => s.length >= 8,
      "Password must be at least 8 characters",
    );

    expect(result.ok).toBeTruthy();

    const shortPassword = "short";
    const result2 = assertMatches(
      shortPassword,
      (s) => s.length >= 8,
      "Password must be at least 8 characters",
    );

    expect(result2.ok).toBeFalsy();
  });

  it("should work with range checks", () => {
    const value = 50;
    const result = assertMatches(
      value,
      (n) => n >= 0 && n <= 100,
      "Value must be between 0 and 100",
    );

    expect(result.ok).toBeTruthy();
  });

  it("should work with type guards", () => {
    const value: unknown = "test";
    const result = assertMatches(
      value,
      (v): v is string => typeof v === "string",
      "Must be a string",
    );

    expect(result.ok).toBeTruthy();
    if (result.ok) {
      // TypeScript should narrow to string
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- Testing type narrowing behavior
      const length: number = result.value.length;
      expect(length).toBe(4);
    }
  });

  it("should work with even/odd checks", () => {
    const even = 42;
    const resultEven = assertMatches(even, (n) => n % 2 === 0, "Must be even");
    expect(resultEven.ok).toBeTruthy();

    const odd = 43;
    const resultOdd = assertMatches(odd, (n) => n % 2 === 0, "Must be even");
    expect(resultOdd.ok).toBeFalsy();
  });
});
