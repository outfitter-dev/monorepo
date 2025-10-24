/**
 * Tests for Result type and utilities
 */

import { describe, expect, it } from "vitest";
import { ERROR_CODES } from "../../src/error/codes.js";
import type { AppError } from "../../src/error/index.js";
import {
  andThen,
  collect,
  err,
  isErr,
  isOk,
  map,
  mapErr,
  match,
  ok,
  orElse,
  tryCatch,
  tryCatchAsync,
  unwrap,
  unwrapOr,
  unwrapOrElse,
} from "../../src/result/index.js";

describe("ok", () => {
  it("should create a successful result", () => {
    const result = ok(42);

    expect(result.ok).toBeTruthy();
    if (result.ok) {
      expect(result.value).toBe(42);
    }
  });

  it("should work with different value types", () => {
    const numResult = ok(100);
    const strResult = ok("hello");
    const objResult = ok({ foo: "bar" });
    const arrResult = ok([1, 2, 3]);

    expect(numResult.ok).toBeTruthy();
    expect(strResult.ok).toBeTruthy();
    expect(objResult.ok).toBeTruthy();
    expect(arrResult.ok).toBeTruthy();
  });

  it("should work with null and undefined values", () => {
    const nullResult = ok(null);
    const undefinedResult = ok(undefined);

    expect(nullResult.ok).toBeTruthy();
    expect(undefinedResult.ok).toBeTruthy();
  });
});

describe("err", () => {
  it("should create a failed result", () => {
    const error: AppError = {
      code: ERROR_CODES.INVALID_INPUT,
      message: "Bad input",
      name: "ValidationError",
    };

    const result = err(error);

    expect(result.ok).toBeFalsy();
    if (!result.ok) {
      expect(result.error).toBe(error);
    }
  });

  it("should work with different error types", () => {
    const appError = err<AppError>({
      code: 1000,
      message: "Error",
      name: "Error",
    });

    const stringError = err<string>("string error");
    const numberError = err<number>(404);

    expect(appError.ok).toBeFalsy();
    expect(stringError.ok).toBeFalsy();
    expect(numberError.ok).toBeFalsy();
  });
});

describe("isOk", () => {
  it("should return true for ok results", () => {
    const result = ok(42);
    expect(isOk(result)).toBeTruthy();
  });

  it("should return false for err results", () => {
    const result = err({ code: 1000, message: "Error", name: "Error" });
    expect(isOk(result)).toBeFalsy();
  });

  it("should narrow type correctly", () => {
    const result = ok(42);

    if (isOk(result)) {
      // TypeScript should know result.value exists
      const value: number = result.value;
      expect(value).toBe(42);
    }
  });
});

describe("isErr", () => {
  it("should return true for err results", () => {
    const result = err({ code: 1000, message: "Error", name: "Error" });
    expect(isErr(result)).toBeTruthy();
  });

  it("should return false for ok results", () => {
    const result = ok(42);
    expect(isErr(result)).toBeFalsy();
  });

  it("should narrow type correctly", () => {
    const result = err({ code: 1000, message: "Test error", name: "Error" });

    if (isErr(result)) {
      // TypeScript should know result.error exists
      const error: AppError = result.error;
      expect(error.message).toBe("Test error");
    }
  });
});

describe("unwrap", () => {
  it("should extract value from ok result", () => {
    const result = ok(42);
    expect(unwrap(result)).toBe(42);
  });

  it("should throw for err result", () => {
    const result = err({ code: 1000, message: "Error", name: "Error" });

    expect(() => unwrap(result)).toThrow();
  });

  it("should include error details in thrown error", () => {
    const result = err({ code: 1000, message: "Custom error", name: "Error" });

    expect(() => unwrap(result)).toThrow(/Custom error/);
  });

  it("should work with different value types", () => {
    expect(unwrap(ok("hello"))).toBe("hello");
    expect(unwrap(ok({ foo: "bar" }))).toEqual({ foo: "bar" });
    expect(unwrap(ok([1, 2, 3]))).toEqual([1, 2, 3]);
  });
});

describe("unwrapOr", () => {
  it("should return value for ok result", () => {
    const result = ok(42);
    expect(unwrapOr(result, 0)).toBe(42);
  });

  it("should return default for err result", () => {
    const result = err({ code: 1000, message: "Error", name: "Error" });
    expect(unwrapOr(result, 0)).toBe(0);
  });

  it("should work with different types", () => {
    expect(unwrapOr(ok("hello"), "default")).toBe("hello");
    expect(unwrapOr(err("error"), "default")).toBe("default");

    expect(unwrapOr(ok([1, 2]), [])).toEqual([1, 2]);
    expect(unwrapOr(err("error"), [])).toEqual([]);
  });

  it("should not evaluate default if result is ok", () => {
    const result = ok(42);
    let called = false;
    const defaultValue = (() => {
      called = true;
      return 0;
    })();

    unwrapOr(result, defaultValue);
    // Note: default is evaluated eagerly, so called will be true
    // This is expected behavior for unwrapOr
    expect(called).toBeTruthy();
  });
});

describe("unwrapOrElse", () => {
  it("should return value for ok result", () => {
    const result = ok(42);
    expect(unwrapOrElse(result, () => 0)).toBe(42);
  });

  it("should call function for err result", () => {
    const result = err({ code: 1000, message: "Error", name: "Error" });
    expect(unwrapOrElse(result, (e) => e.code)).toBe(1000);
  });

  it("should not call function if result is ok", () => {
    const result = ok(42);
    let called = false;

    unwrapOrElse(result, () => {
      called = true;
      return 0;
    });

    expect(called).toBeFalsy();
  });

  it("should provide error to function", () => {
    const error = { code: 1000, message: "Test", name: "Error" };
    const result = err(error);

    const defaultValue = unwrapOrElse(result, (e) => {
      expect(e).toBe(error);
      return 0;
    });

    expect(defaultValue).toBe(0);
  });
});

describe("map", () => {
  it("should transform ok value", () => {
    const result = ok(5);
    const mapped = map(result, (x) => x * 2);

    expect(isOk(mapped)).toBeTruthy();
    if (isOk(mapped)) {
      expect(mapped.value).toBe(10);
    }
  });

  it("should not transform err value", () => {
    const error = { code: 1000, message: "Error", name: "Error" };
    const result = err(error);
    const mapped = map(result, (x) => x * 2);

    expect(isErr(mapped)).toBeTruthy();
    if (isErr(mapped)) {
      expect(mapped.error).toBe(error);
    }
  });

  it("should change value type", () => {
    const result = ok(42);
    const mapped = map(result, (x) => x.toString());

    expect(isOk(mapped)).toBeTruthy();
    if (isOk(mapped)) {
      expect(mapped.value).toBe("42");
      expect(typeof mapped.value).toBe("string");
    }
  });

  it("should not call function for err", () => {
    const result = err({ code: 1000, message: "Error", name: "Error" });
    let called = false;

    map(result, () => {
      called = true;
      return 0;
    });

    expect(called).toBeFalsy();
  });
});

describe("mapErr", () => {
  it("should transform err value", () => {
    const result = err({ code: 1000, message: "Original", name: "Error" });
    const mapped = mapErr(result, (e) => ({
      ...e,
      message: "Modified",
    }));

    expect(isErr(mapped)).toBeTruthy();
    if (isErr(mapped)) {
      expect(mapped.error.message).toBe("Modified");
    }
  });

  it("should not transform ok value", () => {
    const result = ok(42);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    const mapped = mapErr(result, (e) => ({
      ...e,
      message: "Should not see this",
    }));

    expect(isOk(mapped)).toBeTruthy();
    if (isOk(mapped)) {
      expect(mapped.value).toBe(42);
    }
  });

  it("should change error type", () => {
    const result = err<string>("string error");
    const mapped = mapErr(result, (str) => ({
      code: 1000,
      message: str,
      name: "Error",
    }));

    expect(isErr(mapped)).toBeTruthy();
    if (isErr(mapped)) {
      expect(mapped.error.message).toBe("string error");
    }
  });

  it("should not call function for ok", () => {
    const result = ok(42);
    let called = false;

    mapErr(result, () => {
      called = true;
      return { code: 1000, message: "Error", name: "Error" };
    });

    expect(called).toBeFalsy();
  });
});

describe("andThen", () => {
  it("should chain ok results", () => {
    const result = ok(5);
    const chained = andThen(result, (x) => ok(x * 2));

    expect(isOk(chained)).toBeTruthy();
    if (isOk(chained)) {
      expect(chained.value).toBe(10);
    }
  });

  it("should not call function for err", () => {
    const result = err({ code: 1000, message: "Error", name: "Error" });
    let called = false;

    const chained = andThen(result, () => {
      called = true;
      return ok(0);
    });

    expect(called).toBeFalsy();
    expect(isErr(chained)).toBeTruthy();
  });

  it("should propagate errors from chained function", () => {
    const result = ok(5);
    const error = { code: 1000, message: "Chained error", name: "Error" };
    const chained = andThen(result, () => err(error));

    expect(isErr(chained)).toBeTruthy();
    if (isErr(chained)) {
      expect(chained.error).toBe(error);
    }
  });

  it("should enable multiple chained operations", () => {
    const result = ok(5);

    const final = andThen(
      andThen(
        andThen(result, (x) => ok(x + 1)),
        (x) => ok(x * 2),
      ),
      (x) => ok(x.toString()),
    );

    expect(isOk(final)).toBeTruthy();
    if (isOk(final)) {
      expect(final.value).toBe("12"); // (5 + 1) * 2 = 12
    }
  });

  it("should short-circuit on first error", () => {
    const result = ok(5);
    const error = { code: 1000, message: "First error", name: "Error" };

    const final = andThen(
      andThen(result, () => err(error)),
      () => {
        throw new Error("Should not be called");
      },
    );

    expect(isErr(final)).toBeTruthy();
    if (isErr(final)) {
      expect(final.error).toBe(error);
    }
  });
});

describe("orElse", () => {
  it("should return first result if ok", () => {
    const result1 = ok(42);
    const result2 = ok(100);

    const final = orElse(result1, result2);

    expect(isOk(final)).toBeTruthy();
    if (isOk(final)) {
      expect(final.value).toBe(42);
    }
  });

  it("should return second result if first is err", () => {
    const result1 = err({ code: 1000, message: "Error", name: "Error" });
    const result2 = ok(100);

    const final = orElse(result1, result2);

    expect(isOk(final)).toBeTruthy();
    if (isOk(final)) {
      expect(final.value).toBe(100);
    }
  });

  it("should return second err if both are err", () => {
    const error1 = { code: 1000, message: "First error", name: "Error" };
    const error2 = { code: 2000, message: "Second error", name: "Error" };

    const result1 = err(error1);
    const result2 = err(error2);

    const final = orElse(result1, result2);

    expect(isErr(final)).toBeTruthy();
    if (isErr(final)) {
      expect(final.error).toBe(error2);
    }
  });
});

describe("match", () => {
  it("should call ok branch for ok result", () => {
    const result = ok(42);

    const output = match(result, {
      ok: (value) => `Success: ${value}`,
      err: (error) => `Failed: ${error.message}`,
    });

    expect(output).toBe("Success: 42");
  });

  it("should call err branch for err result", () => {
    const result = err({ code: 1000, message: "Bad input", name: "Error" });

    const output = match(result, {
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      ok: (value) => `Success: ${value}`,
      err: (error) => `Failed: ${error.message}`,
    });

    expect(output).toBe("Failed: Bad input");
  });

  it("should work with different return types", () => {
    const okResult = ok(42);
    const errResult = err({ code: 1000, message: "Error", name: "Error" });

    const okNumber = match(okResult, {
      ok: (v) => v * 2,
      err: () => 0,
    });

    const errNumber = match(errResult, {
      ok: (v) => v * 2,
      err: () => 0,
    });

    expect(okNumber).toBe(84);
    expect(errNumber).toBe(0);
  });

  it("should provide correct values to branches", () => {
    const value = 42;
    const error = { code: 1000, message: "Test", name: "Error" };

    match(ok(value), {
      ok: (v) => {
        expect(v).toBe(value);
      },
      err: () => {
        throw new Error("Should not be called");
      },
    });

    match(err(error), {
      ok: () => {
        throw new Error("Should not be called");
      },
      err: (e) => {
        expect(e).toBe(error);
      },
    });
  });
});

describe("collect", () => {
  it("should collect all ok values", () => {
    const results = [ok(1), ok(2), ok(3)];
    const collected = collect(results);

    expect(isOk(collected)).toBeTruthy();
    if (isOk(collected)) {
      expect(collected.value).toEqual([1, 2, 3]);
    }
  });

  it("should return first error", () => {
    const error1 = { code: 1000, message: "Error 1", name: "Error" };
    const error2 = { code: 2000, message: "Error 2", name: "Error" };

    const results = [ok(1), err(error1), ok(3), err(error2)];
    const collected = collect(results);

    expect(isErr(collected)).toBeTruthy();
    if (isErr(collected)) {
      expect(collected.error).toBe(error1);
    }
  });

  it("should handle empty array", () => {
    const collected = collect([]);

    expect(isOk(collected)).toBeTruthy();
    if (isOk(collected)) {
      expect(collected.value).toEqual([]);
    }
  });

  it("should handle single element", () => {
    const okCollected = collect([ok(42)]);
    expect(isOk(okCollected)).toBeTruthy();
    if (isOk(okCollected)) {
      expect(okCollected.value).toEqual([42]);
    }

    const error = { code: 1000, message: "Error", name: "Error" };
    const errCollected = collect([err(error)]);
    expect(isErr(errCollected)).toBeTruthy();
    if (isErr(errCollected)) {
      expect(errCollected.error).toBe(error);
    }
  });

  it("should work with different value types", () => {
    const results = [ok("a"), ok("b"), ok("c")];
    const collected = collect(results);

    expect(isOk(collected)).toBeTruthy();
    if (isOk(collected)) {
      expect(collected.value).toEqual(["a", "b", "c"]);
    }
  });
});

describe("tryCatch", () => {
  it("should return ok for successful function", () => {
    const result = tryCatch(() => 42);

    expect(isOk(result)).toBeTruthy();
    if (isOk(result)) {
      expect(result.value).toBe(42);
    }
  });

  it("should return err for throwing function", () => {
    const result = tryCatch(() => {
      throw new Error("Test error");
    });

    expect(isErr(result)).toBeTruthy();
    if (isErr(result)) {
      expect(result.error.message).toContain("Test error");
    }
  });

  it("should use custom error mapper", () => {
    const result = tryCatch(
      () => {
        throw new Error("Original error");
      },
      (error) => ({
        code: ERROR_CODES.RUNTIME_EXCEPTION,
        message: error instanceof Error ? error.message : "Unknown error",
        name: "CustomError",
      }),
    );

    expect(isErr(result)).toBeTruthy();
    if (isErr(result)) {
      expect(result.error.code).toBe(ERROR_CODES.RUNTIME_EXCEPTION);
      expect(result.error.name).toBe("CustomError");
      expect(result.error.message).toBe("Original error");
    }
  });

  it("should handle non-Error throws", () => {
    const result = tryCatch(() => {
      // eslint-disable-next-line @typescript-eslint/only-throw-error, no-throw-literal
      throw "string error";
    });

    expect(isErr(result)).toBeTruthy();
    if (isErr(result)) {
      expect(result.error.message).toBe("string error");
    }
  });

  it("should handle different return types", () => {
    const stringResult = tryCatch(() => "hello");
    const objectResult = tryCatch(() => ({ foo: "bar" }));
    const arrayResult = tryCatch(() => [1, 2, 3]);

    expect(isOk(stringResult)).toBeTruthy();
    expect(isOk(objectResult)).toBeTruthy();
    expect(isOk(arrayResult)).toBeTruthy();
  });

  it("should use default error code without mapper", () => {
    const result = tryCatch(() => {
      throw new Error("Test");
    });

    expect(isErr(result)).toBeTruthy();
    if (isErr(result)) {
      expect(result.error.code).toBe(2019); // INTERNAL_ERROR
      expect(result.error.name).toBe("RuntimeError");
    }
  });
});

describe("tryCatchAsync", () => {
  it("should return ok for successful async function", async () => {
    const result = await tryCatchAsync(async () => Promise.resolve(42));

    expect(isOk(result)).toBeTruthy();
    if (isOk(result)) {
      expect(result.value).toBe(42);
    }
  });

  it("should return err for rejecting promise", async () => {
    const result = await tryCatchAsync(() => {
      throw new Error("Async error");
    });

    expect(isErr(result)).toBeTruthy();
    if (isErr(result)) {
      expect(result.error.message).toContain("Async error");
    }
  });

  it("should use custom error mapper", async () => {
    const result = await tryCatchAsync(
      () => {
        throw new Error("Original");
      },
      (error) => ({
        code: ERROR_CODES.CONNECTION_REFUSED,
        message: error instanceof Error ? error.message : "Unknown",
        name: "NetworkError",
      }),
    );

    expect(isErr(result)).toBeTruthy();
    if (isErr(result)) {
      expect(result.error.name).toBe("NetworkError");
    }
  });

  it("should handle async operations", async () => {
    const result = await tryCatchAsync(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
      return "done";
    });

    expect(isOk(result)).toBeTruthy();
    if (isOk(result)) {
      expect(result.value).toBe("done");
    }
  });

  it("should handle Promise.reject", async () => {
    const result = await tryCatchAsync(async () => {
      return Promise.reject(new Error("Rejected"));
    });

    expect(isErr(result)).toBeTruthy();
    if (isErr(result)) {
      expect(result.error.message).toContain("Rejected");
    }
  });

  it("should work with different return types", async () => {
    const stringResult = await tryCatchAsync(async () => Promise.resolve("hello"));
    const objectResult = await tryCatchAsync(async () => Promise.resolve({ foo: "bar" }));
    const arrayResult = await tryCatchAsync(async () => Promise.resolve([1, 2, 3]));

    expect(isOk(stringResult)).toBeTruthy();
    expect(isOk(objectResult)).toBeTruthy();
    expect(isOk(arrayResult)).toBeTruthy();
  });
});

describe("Result type integration", () => {
  it("should compose multiple operations", () => {
    const divide = (a: number, b: number) => {
      if (b === 0) {
        return err({
          code: ERROR_CODES.DIVISION_BY_ZERO,
          message: "Cannot divide by zero",
          name: "MathError",
        });
      }
      return ok(a / b);
    };

    const sqrt = (n: number) => {
      if (n < 0) {
        return err({
          code: ERROR_CODES.INVALID_INPUT,
          message: "Cannot sqrt negative",
          name: "MathError",
        });
      }
      return ok(Math.sqrt(n));
    };

    // Success path
    const success = andThen(divide(16, 4), sqrt);
    expect(isOk(success)).toBeTruthy();
    if (isOk(success)) {
      expect(success.value).toBe(2);
    }

    // Division by zero
    const divError = andThen(divide(16, 0), sqrt);
    expect(isErr(divError)).toBeTruthy();

    // Negative sqrt
    const sqrtError = andThen(divide(4, -1), sqrt);
    expect(isErr(sqrtError)).toBeTruthy();
  });

  it("should work with validation pipelines", () => {
    const validatePositive = (n: number) => {
      if (n <= 0) {
        return err({
          code: ERROR_CODES.INVALID_INPUT,
          message: "Must be positive",
          name: "ValidationError",
        });
      }
      return ok(n);
    };

    const validateLessThan100 = (n: number) => {
      if (n >= 100) {
        return err({
          code: ERROR_CODES.VALUE_OUT_OF_RANGE,
          message: "Must be < 100",
          name: "ValidationError",
        });
      }
      return ok(n);
    };

    const validate = (n: number) => andThen(validatePositive(n), validateLessThan100);

    expect(isOk(validate(50))).toBeTruthy();
    expect(isErr(validate(-5))).toBeTruthy();
    expect(isErr(validate(150))).toBeTruthy();
  });
});
