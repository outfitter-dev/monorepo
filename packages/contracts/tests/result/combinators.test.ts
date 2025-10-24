/**
 * Tests for Result combinator functions
 */

import { describe, expect, it } from "vitest";
import { ERROR_CODES } from "../../src/error/codes.js";
import type { AppError } from "../../src/error/index.js";
import type { Result } from "../../src/result/index.js";
import {
  combine2,
  combine3,
  err,
  ok,
  parallel,
  partition,
  sequence,
} from "../../src/result/index.js";

describe("sequence", () => {
  it("should collect all success values", () => {
    const results = [ok(1), ok(2), ok(3)];
    const result = sequence(results);

    expect(result.ok).toBeTruthy();
    if (result.ok) {
      expect(result.value).toEqual([1, 2, 3]);
    }
  });

  it("should return first error encountered", () => {
    const error1: AppError = {
      code: ERROR_CODES.INVALID_INPUT,
      message: "Error 1",
      name: "Error1",
    };
    const error2: AppError = {
      code: ERROR_CODES.PARSE_ERROR,
      message: "Error 2",
      name: "Error2",
    };

    const results = [ok(1), err(error1), ok(3), err(error2)];
    const result = sequence(results);

    expect(result.ok).toBeFalsy();
    if (!result.ok) {
      expect(result.error).toBe(error1); // First error
    }
  });

  it("should handle empty array", () => {
    const results: Result<number>[] = [];
    const result = sequence(results);

    expect(result.ok).toBeTruthy();
    if (result.ok) {
      expect(result.value).toEqual([]);
    }
  });

  it("should handle single element", () => {
    const result = sequence([ok(42)]);

    expect(result.ok).toBeTruthy();
    if (result.ok) {
      expect(result.value).toEqual([42]);
    }
  });

  it("should preserve value types", () => {
    const results = [ok("hello"), ok("world")];
    const result = sequence(results);

    expect(result.ok).toBeTruthy();
    if (result.ok) {
      expect(result.value).toEqual(["hello", "world"]);
      expect(typeof result.value[0]).toBe("string");
    }
  });
});

describe("parallel", () => {
  it("should collect all success values", () => {
    const results = [ok(1), ok(2), ok(3)];
    const result = parallel(results);

    expect(result.ok).toBeTruthy();
    if (result.ok) {
      expect(result.value).toEqual([1, 2, 3]);
    }
  });

  it("should return first error encountered", () => {
    const error: AppError = {
      code: ERROR_CODES.INVALID_INPUT,
      message: "Error",
      name: "Error",
    };

    const results = [ok(1), err(error), ok(3)];
    const result = parallel(results);

    expect(result.ok).toBeFalsy();
    if (!result.ok) {
      expect(result.error).toBe(error);
    }
  });

  it("should have same semantics as sequence", () => {
    const results = [ok(1), ok(2), ok(3)];

    const seqResult = sequence(results);
    const parResult = parallel(results);

    expect(seqResult).toEqual(parResult);
  });

  it("should handle empty array", () => {
    const results: Result<number>[] = [];
    const result = parallel(results);

    expect(result.ok).toBeTruthy();
    if (result.ok) {
      expect(result.value).toEqual([]);
    }
  });
});

describe("partition", () => {
  it("should separate successes and failures", () => {
    const error1: AppError = {
      code: ERROR_CODES.INVALID_INPUT,
      message: "Error 1",
      name: "Error1",
    };
    const error2: AppError = {
      code: ERROR_CODES.PARSE_ERROR,
      message: "Error 2",
      name: "Error2",
    };

    const results = [ok(1), err(error1), ok(3), err(error2), ok(5)];
    const { successes, failures } = partition(results);

    expect(successes).toEqual([1, 3, 5]);
    expect(failures).toEqual([error1, error2]);
  });

  it("should handle all successes", () => {
    const results = [ok(1), ok(2), ok(3)];
    const { successes, failures } = partition(results);

    expect(successes).toEqual([1, 2, 3]);
    expect(failures).toEqual([]);
  });

  it("should handle all failures", () => {
    const error1: AppError = {
      code: ERROR_CODES.INVALID_INPUT,
      message: "Error 1",
      name: "Error1",
    };
    const error2: AppError = {
      code: ERROR_CODES.PARSE_ERROR,
      message: "Error 2",
      name: "Error2",
    };

    const results = [err(error1), err(error2)];
    const { successes, failures } = partition(results);

    expect(successes).toEqual([]);
    expect(failures).toEqual([error1, error2]);
  });

  it("should handle empty array", () => {
    const results: Result<number>[] = [];
    const { successes, failures } = partition(results);

    expect(successes).toEqual([]);
    expect(failures).toEqual([]);
  });

  it("should preserve value types", () => {
    const results = [ok("hello"), ok("world")];
    const { successes, failures } = partition(results);

    expect(successes).toEqual(["hello", "world"]);
    expect(failures).toEqual([]);
    expect(typeof successes[0]).toBe("string");
  });

  it("should handle mixed types", () => {
    const error: AppError = {
      code: ERROR_CODES.INVALID_INPUT,
      message: "Error",
      name: "Error",
    };

    const results = [ok({ id: 1, name: "John" }), err(error), ok({ id: 2, name: "Jane" })];
    const { successes, failures } = partition(results);

    expect(successes).toEqual([
      { id: 1, name: "John" },
      { id: 2, name: "Jane" },
    ]);
    expect(failures).toEqual([error]);
  });
});

describe("combine2", () => {
  it("should combine two successful results", () => {
    const r1 = ok(42);
    const r2 = ok("hello");
    const result = combine2(r1, r2);

    expect(result.ok).toBeTruthy();
    if (result.ok) {
      expect(result.value).toEqual([42, "hello"]);
      expect(result.value[0]).toBe(42);
      expect(result.value[1]).toBe("hello");
    }
  });

  it("should return first error if first result fails", () => {
    const error: AppError = {
      code: ERROR_CODES.INVALID_INPUT,
      message: "Error 1",
      name: "Error1",
    };

    const r1 = err(error);
    const r2 = ok("hello");
    const result = combine2(r1, r2);

    expect(result.ok).toBeFalsy();
    if (!result.ok) {
      expect(result.error).toBe(error);
    }
  });

  it("should return second error if second result fails", () => {
    const error: AppError = {
      code: ERROR_CODES.PARSE_ERROR,
      message: "Error 2",
      name: "Error2",
    };

    const r1 = ok(42);
    const r2 = err(error);
    const result = combine2(r1, r2);

    expect(result.ok).toBeFalsy();
    if (!result.ok) {
      expect(result.error).toBe(error);
    }
  });

  it("should return first error if both fail", () => {
    const error1: AppError = {
      code: ERROR_CODES.INVALID_INPUT,
      message: "Error 1",
      name: "Error1",
    };
    const error2: AppError = {
      code: ERROR_CODES.PARSE_ERROR,
      message: "Error 2",
      name: "Error2",
    };

    const r1 = err(error1);
    const r2 = err(error2);
    const result = combine2(r1, r2);

    expect(result.ok).toBeFalsy();
    if (!result.ok) {
      expect(result.error).toBe(error1); // First error
    }
  });

  it("should preserve different value types", () => {
    const r1 = ok(100);
    const r2 = ok(true);
    const result = combine2(r1, r2);

    expect(result.ok).toBeTruthy();
    if (result.ok) {
      expect(result.value).toEqual([100, true]);
      expect(typeof result.value[0]).toBe("number");
      expect(typeof result.value[1]).toBe("boolean");
    }
  });

  it("should handle complex types", () => {
    const r1 = ok({ id: 1, name: "John" });
    const r2 = ok([1, 2, 3]);
    const result = combine2(r1, r2);

    expect(result.ok).toBeTruthy();
    if (result.ok) {
      expect(result.value).toEqual([{ id: 1, name: "John" }, [1, 2, 3]]);
    }
  });
});

describe("combine3", () => {
  it("should combine three successful results", () => {
    const r1 = ok(42);
    const r2 = ok("hello");
    const r3 = ok(true);
    const result = combine3(r1, r2, r3);

    expect(result.ok).toBeTruthy();
    if (result.ok) {
      expect(result.value).toEqual([42, "hello", true]);
      expect(result.value[0]).toBe(42);
      expect(result.value[1]).toBe("hello");
      expect(result.value[2]).toBeTruthy();
    }
  });

  it("should return first error if first result fails", () => {
    const error: AppError = {
      code: ERROR_CODES.INVALID_INPUT,
      message: "Error 1",
      name: "Error1",
    };

    const r1 = err(error);
    const r2 = ok("hello");
    const r3 = ok(true);
    const result = combine3(r1, r2, r3);

    expect(result.ok).toBeFalsy();
    if (!result.ok) {
      expect(result.error).toBe(error);
    }
  });

  it("should return second error if second result fails", () => {
    const error: AppError = {
      code: ERROR_CODES.PARSE_ERROR,
      message: "Error 2",
      name: "Error2",
    };

    const r1 = ok(42);
    const r2 = err(error);
    const r3 = ok(true);
    const result = combine3(r1, r2, r3);

    expect(result.ok).toBeFalsy();
    if (!result.ok) {
      expect(result.error).toBe(error);
    }
  });

  it("should return third error if third result fails", () => {
    const error: AppError = {
      code: ERROR_CODES.UNKNOWN_ERROR,
      message: "Error 3",
      name: "Error3",
    };

    const r1 = ok(42);
    const r2 = ok("hello");
    const r3 = err(error);
    const result = combine3(r1, r2, r3);

    expect(result.ok).toBeFalsy();
    if (!result.ok) {
      expect(result.error).toBe(error);
    }
  });

  it("should return first error if multiple fail", () => {
    const error1: AppError = {
      code: ERROR_CODES.INVALID_INPUT,
      message: "Error 1",
      name: "Error1",
    };
    const error2: AppError = {
      code: ERROR_CODES.PARSE_ERROR,
      message: "Error 2",
      name: "Error2",
    };
    const error3: AppError = {
      code: ERROR_CODES.UNKNOWN_ERROR,
      message: "Error 3",
      name: "Error3",
    };

    const r1 = err(error1);
    const r2 = err(error2);
    const r3 = err(error3);
    const result = combine3(r1, r2, r3);

    expect(result.ok).toBeFalsy();
    if (!result.ok) {
      expect(result.error).toBe(error1); // First error
    }
  });

  it("should preserve different value types", () => {
    const r1 = ok(100);
    const r2 = ok("test");
    const r3 = ok([1, 2]);
    const result = combine3(r1, r2, r3);

    expect(result.ok).toBeTruthy();
    if (result.ok) {
      expect(result.value).toEqual([100, "test", [1, 2]]);
      expect(typeof result.value[0]).toBe("number");
      expect(typeof result.value[1]).toBe("string");
      expect(Array.isArray(result.value[2])).toBeTruthy();
    }
  });

  it("should handle complex types", () => {
    const r1 = ok({ id: 1 });
    const r2 = ok([1, 2, 3]);
    const r3 = ok(null);
    const result = combine3(r1, r2, r3);

    expect(result.ok).toBeTruthy();
    if (result.ok) {
      expect(result.value).toEqual([{ id: 1 }, [1, 2, 3], null]);
    }
  });
});
