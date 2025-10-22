import { describe, expect, it } from "vitest";
import {
  chainMaybe,
  filterMaybe,
  getOrElse,
  getOrElseLazy,
  isDefined,
  isNull,
  isNullish,
  isUndefined,
  type Maybe,
  mapMaybe,
  type Nullable,
  nullToUndefined,
  type Optional,
  undefinedToNull,
} from "../src/maybe.js";

describe("Maybe types", () => {
  describe("Type definitions", () => {
    it("should define Nullable type correctly", () => {
      const nullableString: Nullable<string> = null;
      const nullableNumber: Nullable<number> = 42;

      expect(nullableString).toBeNull();
      expect(nullableNumber).toBe(42);
    });

    it("should define Optional type correctly", () => {
      const optionalString: Optional<string> = undefined;
      const optionalNumber: Optional<number> = 42;

      expect(optionalString).toBeUndefined();
      expect(optionalNumber).toBe(42);
    });

    it("should define Maybe type correctly", () => {
      const maybeNull: Maybe<string> = null;
      const maybeUndefined: Maybe<string> = undefined;
      const maybeValue: Maybe<string> = "value";

      expect(maybeNull).toBeNull();
      expect(maybeUndefined).toBeUndefined();
      expect(maybeValue).toBe("value");
    });
  });

  describe("isDefined", () => {
    it("should return true for defined values", () => {
      expect(isDefined(0)).toBeTruthy();
      expect(isDefined("")).toBeTruthy();
      expect(isDefined(false)).toBeTruthy();
      expect(isDefined([])).toBeTruthy();
      expect(isDefined({})).toBeTruthy();
    });

    it("should return false for null and undefined", () => {
      expect(isDefined(null)).toBeFalsy();
      expect(isDefined(undefined)).toBeFalsy();
    });

    it("should narrow types correctly", () => {
      const value: Maybe<string> = "test";

      if (isDefined(value)) {
        // TypeScript knows value is string here
        expect(value.toUpperCase()).toBe("TEST");
      }
    });
  });

  describe("isNull", () => {
    it("should return true only for null", () => {
      expect(isNull(null)).toBeTruthy();
    });

    it("should return false for other values", () => {
      expect(isNull(undefined)).toBeFalsy();
      expect(isNull(0)).toBeFalsy();
      expect(isNull("")).toBeFalsy();
      expect(isNull(false)).toBeFalsy();
    });

    it("should narrow types correctly", () => {
      const value: Maybe<string> = null;

      if (isNull(value)) {
        // TypeScript knows value is null here
        expect(value).toBeNull();
      }
    });
  });

  describe("isUndefined", () => {
    it("should return true only for undefined", () => {
      expect(isUndefined(undefined)).toBeTruthy();
    });

    it("should return false for other values", () => {
      expect(isUndefined(null)).toBeFalsy();
      expect(isUndefined(0)).toBeFalsy();
      expect(isUndefined("")).toBeFalsy();
      expect(isUndefined(false)).toBeFalsy();
    });

    it("should narrow types correctly", () => {
      const value: Maybe<string> = undefined;

      if (isUndefined(value)) {
        // TypeScript knows value is undefined here
        expect(value).toBeUndefined();
      }
    });
  });

  describe("isNullish", () => {
    it("should return true for null and undefined", () => {
      expect(isNullish(null)).toBeTruthy();
      expect(isNullish(undefined)).toBeTruthy();
    });

    it("should return false for defined values", () => {
      expect(isNullish(0)).toBeFalsy();
      expect(isNullish("")).toBeFalsy();
      expect(isNullish(false)).toBeFalsy();
      expect(isNullish([])).toBeFalsy();
    });

    it("should narrow types correctly", () => {
      const value: Maybe<string> = null;

      if (isNullish(value)) {
        // TypeScript knows value is null | undefined here
        expect(value).toBeNull();
      }
    });
  });

  describe("getOrElse", () => {
    it("should return value when defined", () => {
      expect(getOrElse(42, 0)).toBe(42);
      expect(getOrElse("hello", "default")).toBe("hello");
      expect(getOrElse(false, true)).toBeFalsy();
    });

    it("should return default when null or undefined", () => {
      expect(getOrElse(null, 42)).toBe(42);
      expect(getOrElse(undefined, "default")).toBe("default");
    });

    it("should handle falsy values correctly", () => {
      expect(getOrElse(0, 42)).toBe(0);
      expect(getOrElse("", "default")).toBe("");
      expect(getOrElse(false, true)).toBeFalsy();
    });
  });

  describe("getOrElseLazy", () => {
    it("should return value when defined", () => {
      expect(getOrElseLazy(42, () => 0)).toBe(42);
      expect(getOrElseLazy("hello", () => "default")).toBe("hello");
    });

    it("should compute default when null or undefined", () => {
      expect(getOrElseLazy(null, () => 42)).toBe(42);
      expect(getOrElseLazy(undefined, () => "default")).toBe("default");
    });

    it("should not call default function when value is defined", () => {
      let called = false;
      const defaultFn = () => {
        called = true;
        return 42;
      };

      getOrElseLazy(10, defaultFn);
      expect(called).toBeFalsy();
    });

    it("should call default function when value is nullish", () => {
      let called = false;
      const defaultFn = () => {
        called = true;
        return 42;
      };

      getOrElseLazy(null, defaultFn);
      expect(called).toBeTruthy();
    });
  });

  describe("mapMaybe", () => {
    it("should map over defined values", () => {
      expect(mapMaybe(5, (x) => x * 2)).toBe(10);
      expect(mapMaybe("hello", (s) => s.toUpperCase())).toBe("HELLO");
    });

    it("should preserve null and undefined", () => {
      expect(mapMaybe(null, (x: number) => x * 2)).toBeNull();
      expect(mapMaybe(undefined, (x: number) => x * 2)).toBeUndefined();
    });

    it("should allow type transformation", () => {
      const result = mapMaybe(42, (n) => `Number: ${n}`);
      expect(result).toBe("Number: 42");
    });
  });

  describe("chainMaybe", () => {
    it("should chain operations on defined values", () => {
      const result = chainMaybe(5, (x) => (x > 0 ? x * 2 : null));
      expect(result).toBe(10);
    });

    it("should preserve null and undefined", () => {
      expect(chainMaybe(null, (x: number) => x * 2)).toBeNull();
      expect(chainMaybe(undefined, (x: number) => x * 2)).toBeUndefined();
    });

    it("should handle functions that return nullish", () => {
      const result = chainMaybe(5, (x) => (x < 10 ? null : x * 2));
      expect(result).toBeNull();
    });

    it("should allow multiple chaining operations", () => {
      const result = chainMaybe(
        chainMaybe(5, (x) => x * 2),
        (x) => x + 1,
      );
      expect(result).toBe(11);
    });
  });

  describe("filterMaybe", () => {
    it("should keep values that pass predicate", () => {
      expect(filterMaybe(5, (x) => x > 0)).toBe(5);
      expect(filterMaybe("hello", (s) => s.length > 0)).toBe("hello");
    });

    it("should return undefined for values that fail predicate", () => {
      expect(filterMaybe(5, (x) => x < 0)).toBeUndefined();
      expect(filterMaybe("", (s) => s.length > 0)).toBeUndefined();
    });

    it("should preserve null and undefined", () => {
      expect(filterMaybe(null, (x: number) => x > 0)).toBeNull();
      expect(filterMaybe(undefined, (x: number) => x > 0)).toBeUndefined();
    });
  });

  describe("undefinedToNull", () => {
    it("should convert undefined to null", () => {
      expect(undefinedToNull(undefined)).toBeNull();
    });

    it("should preserve null", () => {
      expect(undefinedToNull(null)).toBeNull();
    });

    it("should preserve defined values", () => {
      expect(undefinedToNull(42)).toBe(42);
      expect(undefinedToNull("hello")).toBe("hello");
      expect(undefinedToNull(false)).toBeFalsy();
    });
  });

  describe("nullToUndefined", () => {
    it("should convert null to undefined", () => {
      expect(nullToUndefined(null)).toBeUndefined();
    });

    it("should preserve undefined", () => {
      // eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- Testing undefined return value
      const result = nullToUndefined(undefined);
      expect(result).toBeUndefined();
    });

    it("should preserve defined values", () => {
      expect(nullToUndefined(42)).toBe(42);
      expect(nullToUndefined("hello")).toBe("hello");
      expect(nullToUndefined(false)).toBeFalsy();
    });
  });

  describe("Complex usage patterns", () => {
    it("should compose multiple operations", () => {
      const value: Maybe<number> = 5;

      const result = getOrElse(
        filterMaybe(
          mapMaybe(value, (x) => x * 2),
          (x) => x > 5,
        ),
        0,
      );

      expect(result).toBe(10);
    });

    it("should handle null propagation", () => {
      const value: Maybe<number> = null;

      const result = getOrElse(
        mapMaybe(
          chainMaybe(value, (x) => x * 2),
          (x) => x + 1,
        ),
        0,
      );

      expect(result).toBe(0);
    });

    it("should support custom validation chains", () => {
      const validatePositive = (n: number): Maybe<number> => (n > 0 ? n : undefined);
      const validateEven = (n: number): Maybe<number> => (n % 2 === 0 ? n : undefined);

      const result = chainMaybe(chainMaybe(4, validatePositive), validateEven);

      expect(result).toBe(4);

      const invalidResult = chainMaybe(chainMaybe(3, validatePositive), validateEven);

      expect(invalidResult).toBeUndefined();
    });
  });
});
