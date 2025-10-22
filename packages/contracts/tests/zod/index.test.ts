/**
 * Tests for Zod integration utilities
 */

import { describe, expect, it } from "vitest";
import { z } from "zod";
import { ERROR_CODES } from "../../src/error/codes.js";
import { isErr, isOk } from "../../src/result/index.js";
import {
  createAsyncValidator,
  createValidator,
  parseZod,
  parseZodAsync,
  parseZodDetailed,
} from "../../src/zod/index.js";

describe("parseZod", () => {
  const UserSchema = z.object({
    name: z.string(),
    email: z.string().email(),
    age: z.number().positive(),
  });

  describe("valid data", () => {
    it("should return ok result for valid data", () => {
      const data = {
        name: "Alice",
        email: "alice@example.com",
        age: 30,
      };

      const result = parseZod(UserSchema, data);

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.value).toEqual(data);
      }
    });

    it("should apply schema transformations", () => {
      const schema = z.object({
        count: z.string().transform((val) => Number.parseInt(val, 10)),
      });

      const result = parseZod(schema, { count: "42" });

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.value.count).toBe(42);
        expect(typeof result.value.count).toBe("number");
      }
    });

    it("should handle different schema types", () => {
      const stringSchema = z.string();
      const numberSchema = z.number();
      const arraySchema = z.array(z.number());
      const literalSchema = z.literal("test");

      expect(isOk(parseZod(stringSchema, "hello"))).toBe(true);
      expect(isOk(parseZod(numberSchema, 42))).toBe(true);
      expect(isOk(parseZod(arraySchema, [1, 2, 3]))).toBe(true);
      expect(isOk(parseZod(literalSchema, "test"))).toBe(true);
    });
  });

  describe("invalid data", () => {
    it("should return err result for invalid data", () => {
      const data = {
        name: "Alice",
        email: "not-an-email", // Invalid email
        age: 30,
      };

      const result = parseZod(UserSchema, data);

      expect(isErr(result)).toBe(true);
    });

    it("should use SCHEMA_VALIDATION_FAILED code", () => {
      const result = parseZod(UserSchema, { invalid: "data" });

      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(result.error.code).toBe(ERROR_CODES.SCHEMA_VALIDATION_FAILED);
      }
    });

    it("should use ValidationError name", () => {
      const result = parseZod(UserSchema, {});

      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(result.error.name).toBe("ValidationError");
      }
    });

    it("should format error messages for missing fields", () => {
      const result = parseZod(UserSchema, {});

      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(result.error.message).toContain("name");
        expect(result.error.message).toContain("Required");
      }
    });

    it("should format error messages for invalid types", () => {
      const data = {
        name: "Alice",
        email: "alice@example.com",
        age: "not-a-number", // Invalid type
      };

      const result = parseZod(UserSchema, data);

      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(result.error.message).toContain("age");
      }
    });

    it("should format error messages for nested fields", () => {
      const schema = z.object({
        user: z.object({
          profile: z.object({
            bio: z.string(),
          }),
        }),
      });

      const result = parseZod(schema, { user: { profile: {} } });

      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(result.error.message).toContain("user.profile.bio");
      }
    });

    it("should combine multiple error messages", () => {
      const data = {
        // Missing name
        email: "not-an-email", // Invalid email
        age: -5, // Invalid (must be positive)
      };

      const result = parseZod(UserSchema, data);

      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        // Should contain multiple errors separated by semicolons
        expect(result.error.message).toContain(";");
      }
    });
  });

  describe("edge cases", () => {
    it("should handle null input", () => {
      const result = parseZod(UserSchema, null);

      expect(isErr(result)).toBe(true);
    });

    it("should handle undefined input", () => {
      const result = parseZod(UserSchema, undefined);

      expect(isErr(result)).toBe(true);
    });

    it("should handle empty object", () => {
      const schema = z.object({});
      const result = parseZod(schema, {});

      expect(isOk(result)).toBe(true);
    });

    it("should handle optional fields", () => {
      const schema = z.object({
        required: z.string(),
        optional: z.string().optional(),
      });

      const result1 = parseZod(schema, { required: "test" });
      expect(isOk(result1)).toBe(true);

      const result2 = parseZod(schema, { required: "test", optional: "value" });
      expect(isOk(result2)).toBe(true);
    });

    it("should handle default values", () => {
      const schema = z.object({
        value: z.string().default("default"),
      });

      const result = parseZod(schema, {});

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.value.value).toBe("default");
      }
    });
  });
});

describe("parseZodDetailed", () => {
  const schema = z.object({
    name: z.string(),
    age: z.number(),
  });

  it("should return ok result for valid data", () => {
    const result = parseZodDetailed(schema, { name: "Alice", age: 30 });

    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value.name).toBe("Alice");
      expect(result.value.age).toBe(30);
    }
  });

  it("should return err with formatted message for invalid data", () => {
    const result = parseZodDetailed(schema, { name: "Alice" }); // Missing age

    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      expect(result.error.message).toContain("age");
    }
  });

  it("should include cause for detailed errors", () => {
    const result = parseZodDetailed(schema, { invalid: "data" });

    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      expect(result.error.cause).toBeDefined();
      expect(result.error.cause?.name).toBe("ZodError");
    }
  });

  it("should use SCHEMA_VALIDATION_FAILED code", () => {
    const result = parseZodDetailed(schema, {});

    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      expect(result.error.code).toBe(ERROR_CODES.SCHEMA_VALIDATION_FAILED);
      expect(result.error.name).toBe("ValidationError");
    }
  });
});

describe("parseZodAsync", () => {
  const syncSchema = z.object({
    email: z.string().email(),
  });

  describe("synchronous schemas", () => {
    it("should validate sync schemas", async () => {
      const result = await parseZodAsync(syncSchema, {
        email: "test@example.com",
      });

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.value.email).toBe("test@example.com");
      }
    });

    it("should return errors for invalid sync data", async () => {
      const result = await parseZodAsync(syncSchema, {
        email: "not-an-email",
      });

      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(result.error.message).toContain("email");
      }
    });
  });

  describe("async refinements", () => {
    it("should handle async refinements", async () => {
      const asyncSchema = z
        .object({
          username: z.string(),
        })
        .refine(
          async (data) => {
            // Simulate async check (e.g., database lookup)
            await new Promise((resolve) => setTimeout(resolve, 10));
            return data.username !== "taken";
          },
          { message: "Username is already taken" },
        );

      const validResult = await parseZodAsync(asyncSchema, {
        username: "available",
      });
      expect(isOk(validResult)).toBe(true);

      const invalidResult = await parseZodAsync(asyncSchema, {
        username: "taken",
      });
      expect(isErr(invalidResult)).toBe(true);
      if (isErr(invalidResult)) {
        expect(invalidResult.error.message).toContain("already taken");
      }
    });

    it("should handle async superRefine", async () => {
      const schema = z
        .object({
          email: z.string().email(),
        })
        .superRefine(async (data, ctx) => {
          await new Promise((resolve) => setTimeout(resolve, 10));

          if (data.email.endsWith("@blocked.com")) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "Domain is blocked",
              path: ["email"],
            });
          }
        });

      const validResult = await parseZodAsync(schema, {
        email: "test@allowed.com",
      });
      expect(isOk(validResult)).toBe(true);

      const invalidResult = await parseZodAsync(schema, {
        email: "test@blocked.com",
      });
      expect(isErr(invalidResult)).toBe(true);
      if (isErr(invalidResult)) {
        expect(invalidResult.error.message).toContain("blocked");
      }
    });
  });

  describe("error handling", () => {
    it("should use SCHEMA_VALIDATION_FAILED code", async () => {
      const result = await parseZodAsync(syncSchema, {
        email: "invalid",
      });

      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(result.error.code).toBe(ERROR_CODES.SCHEMA_VALIDATION_FAILED);
        expect(result.error.name).toBe("ValidationError");
      }
    });

    it("should format multiple errors", async () => {
      const schema = z.object({
        email: z.string().email(),
        age: z.number().positive(),
      });

      const result = await parseZodAsync(schema, {
        email: "invalid",
        age: -1,
      });

      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(result.error.message).toContain("email");
        expect(result.error.message).toContain("age");
      }
    });
  });
});

describe("createValidator", () => {
  const schema = z.object({
    name: z.string(),
    count: z.number(),
  });

  it("should create a reusable validator function", () => {
    const validate = createValidator(schema);

    const result1 = validate({ name: "test", count: 5 });
    expect(isOk(result1)).toBe(true);

    const result2 = validate({ name: "test" }); // Missing count
    expect(isErr(result2)).toBe(true);
  });

  it("should return the same validation logic as parseZod", () => {
    const validate = createValidator(schema);

    const data = { name: "test", count: 5 };
    const direct = parseZod(schema, data);
    const fromValidator = validate(data);

    // Both should succeed
    expect(isOk(direct)).toBe(true);
    expect(isOk(fromValidator)).toBe(true);

    if (isOk(direct) && isOk(fromValidator)) {
      expect(fromValidator.value).toEqual(direct.value);
    }
  });

  it("should work with different schemas", () => {
    const stringValidator = createValidator(z.string());
    const numberValidator = createValidator(z.number());
    const arrayValidator = createValidator(z.array(z.string()));

    expect(isOk(stringValidator("hello"))).toBe(true);
    expect(isErr(stringValidator(123))).toBe(true);

    expect(isOk(numberValidator(42))).toBe(true);
    expect(isErr(numberValidator("42"))).toBe(true);

    expect(isOk(arrayValidator(["a", "b"]))).toBe(true);
    expect(isErr(arrayValidator([1, 2]))).toBe(true);
  });

  it("should be type-safe", () => {
    const validate = createValidator(schema);

    const result = validate({ name: "test", count: 5 });

    if (isOk(result)) {
      // TypeScript should know the shape
      const name: string = result.value.name;
      const count: number = result.value.count;

      expect(name).toBe("test");
      expect(count).toBe(5);
    }
  });
});

describe("createAsyncValidator", () => {
  const syncSchema = z.object({
    email: z.string().email(),
  });

  it("should create a reusable async validator function", async () => {
    const validate = createAsyncValidator(syncSchema);

    const result1 = await validate({ email: "test@example.com" });
    expect(isOk(result1)).toBe(true);

    const result2 = await validate({ email: "invalid" });
    expect(isErr(result2)).toBe(true);
  });

  it("should work with async refinements", async () => {
    const asyncSchema = z
      .object({
        code: z.string(),
      })
      .refine(
        async (data) => {
          await new Promise((resolve) => setTimeout(resolve, 10));
          return data.code === "valid";
        },
        { message: "Invalid code" },
      );

    const validate = createAsyncValidator(asyncSchema);

    const validResult = await validate({ code: "valid" });
    expect(isOk(validResult)).toBe(true);

    const invalidResult = await validate({ code: "invalid" });
    expect(isErr(invalidResult)).toBe(true);
    if (isErr(invalidResult)) {
      expect(invalidResult.error.message).toContain("Invalid code");
    }
  });

  it("should return the same validation logic as parseZodAsync", async () => {
    const validate = createAsyncValidator(syncSchema);

    const data = { email: "test@example.com" };
    const direct = await parseZodAsync(syncSchema, data);
    const fromValidator = await validate(data);

    expect(isOk(direct)).toBe(true);
    expect(isOk(fromValidator)).toBe(true);

    if (isOk(direct) && isOk(fromValidator)) {
      expect(fromValidator.value).toEqual(direct.value);
    }
  });
});

describe("Zod integration patterns", () => {
  it("should work with union types", () => {
    const schema = z.union([
      z.object({ type: z.literal("string"), value: z.string() }),
      z.object({ type: z.literal("number"), value: z.number() }),
    ]);

    const result1 = parseZod(schema, { type: "string", value: "hello" });
    expect(isOk(result1)).toBe(true);

    const result2 = parseZod(schema, { type: "number", value: 42 });
    expect(isOk(result2)).toBe(true);

    const result3 = parseZod(schema, { type: "string", value: 123 });
    expect(isErr(result3)).toBe(true);
  });

  it("should work with discriminated unions", () => {
    const schema = z.discriminatedUnion("kind", [
      z.object({ kind: z.literal("circle"), radius: z.number() }),
      z.object({ kind: z.literal("square"), size: z.number() }),
    ]);

    const circle = parseZod(schema, { kind: "circle", radius: 5 });
    expect(isOk(circle)).toBe(true);

    const square = parseZod(schema, { kind: "square", size: 10 });
    expect(isOk(square)).toBe(true);

    const invalid = parseZod(schema, { kind: "triangle", sides: 3 });
    expect(isErr(invalid)).toBe(true);
  });

  it("should work with recursive schemas", () => {
    type Category = {
      name: string;
      subcategories: Category[];
    };

    const CategorySchema: z.ZodType<Category> = z.lazy(() =>
      z.object({
        name: z.string(),
        subcategories: z.array(CategorySchema),
      }),
    );

    const data = {
      name: "Root",
      subcategories: [
        {
          name: "Child 1",
          subcategories: [],
        },
        {
          name: "Child 2",
          subcategories: [
            {
              name: "Grandchild",
              subcategories: [],
            },
          ],
        },
      ],
    };

    const result = parseZod(CategorySchema, data);
    expect(isOk(result)).toBe(true);
  });

  it("should work with preprocessors", () => {
    const schema = z.preprocess(
      (val) => (typeof val === "string" ? val.toUpperCase() : val),
      z.string(),
    );

    const result = parseZod(schema, "hello");

    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value).toBe("HELLO");
    }
  });

  it("should work with custom error messages", () => {
    const schema = z.object({
      email: z.string().email("Please provide a valid email address"),
      password: z.string().min(8, "Password must be at least 8 characters"),
    });

    const result = parseZod(schema, {
      email: "invalid",
      password: "short",
    });

    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      expect(result.error.message).toContain("valid email address");
      expect(result.error.message).toContain("at least 8 characters");
    }
  });
});
