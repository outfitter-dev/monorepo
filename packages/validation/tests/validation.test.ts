import { ERROR_CODES } from "@outfitter/contracts";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import {
  createEnvValidator,
  createSchemaRegistry,
  diagnosticsToAppError,
  generateJsonSchema,
  type ValidationDiagnostic,
  validateWithDiagnostics,
} from "../src/index.js";

const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  role: z.enum(["user", "admin"]).default("user"),
});

describe("@outfitter/validation", () => {
  describe("SchemaRegistry", () => {
    it("registers and validates schemas", () => {
      const registry = createSchemaRegistry({ user: UserSchema });
      const okResult = registry.validate("user", {
        id: crypto.randomUUID(),
        email: "hello@example.com",
      });
      expect(okResult.ok).toBe(true);

      const errResult = registry.validate("user", { id: "123", email: "bad" });
      expect(errResult.ok).toBe(false);
      if (!errResult.ok) {
        expect(errResult.error.schema).toBe("user");
        expect(errResult.error.diagnostics[0]?.path).toContain("id");
      }
    });

    it("allows duplicate registration and overwrites schemas", () => {
      const registry = createSchemaRegistry();
      const schema1 = z.object({ name: z.string() });
      const schema2 = z.object({ name: z.string(), age: z.number() });

      registry.register("user", schema1);
      registry.register("user", schema2);

      const result = registry.validate("user", { name: "Alice", age: 30 });
      expect(result.ok).toBe(true);
    });

    it("lists all registered schema names", () => {
      const registry = createSchemaRegistry({
        user: UserSchema,
        config: z.object({ theme: z.string() }),
      });

      const names = registry.list();
      expect(names).toContain("user");
      expect(names).toContain("config");
      expect(names).toHaveLength(2);
    });

    it("returns undefined for unregistered schemas", () => {
      const registry = createSchemaRegistry();
      const schema = registry.get("nonexistent");
      expect(schema).toBeUndefined();
    });

    it("reports missing schemas as validation errors", () => {
      const registry = createSchemaRegistry();
      const result = registry.validate("missing", {});
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.summary).toContain("not registered");
        expect(result.error.diagnostics[0]?.code).toBe("validation.schemaNotFound");
      }
    });
  });

  describe("Validation Diagnostics", () => {
    it("returns diagnostics when validation fails", () => {
      const result = validateWithDiagnostics(UserSchema, {
        id: "not-a-uuid",
        email: "invalid",
      });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        const codes = result.error.map((diag) => diag.code);
        expect(codes).toContain("validation.zod.invalid_string");
      }
    });

    it("handles complex nested object validation with paths", () => {
      const NestedSchema = z.object({
        user: z.object({
          profile: z.object({
            email: z.string().email(),
          }),
        }),
      });

      const result = validateWithDiagnostics(NestedSchema, {
        user: { profile: { email: "not-an-email" } },
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error[0]?.path).toEqual(["user", "profile", "email"]);
      }
    });

    it("successfully validates nested structures", () => {
      const NestedSchema = z.object({
        user: z.object({
          profile: z.object({
            email: z.string().email(),
          }),
        }),
      });

      const result = validateWithDiagnostics(NestedSchema, {
        user: { profile: { email: "valid@example.com" } },
      });

      expect(result.ok).toBe(true);
    });

    it("reports array element errors with index paths", () => {
      const ArraySchema = z.object({
        tags: z.array(z.string().min(3)),
      });

      const result = validateWithDiagnostics(ArraySchema, {
        tags: ["ok", "ab", "fine"],
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        const errorPath = result.error.find((d) => d.path[1] === "1");
        expect(errorPath?.path).toEqual(["tags", "1"]);
      }
    });

    it("validates array minimum length", () => {
      const ArraySchema = z.object({
        items: z.array(z.string()).min(2),
      });

      const result = validateWithDiagnostics(ArraySchema, { items: ["one"] });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error[0]?.code).toBe("validation.zod.too_small");
      }
    });

    it("handles primitive array validation with multiple constraints", () => {
      const schema = z.array(z.number().positive()).min(1).max(5);

      const result = validateWithDiagnostics(schema, [-1, 2, 3]);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.some((d) => d.code.includes("too_small"))).toBe(true);
      }
    });

    it("reports multiple validation errors with correct paths", () => {
      const result = validateWithDiagnostics(UserSchema, {
        id: "not-uuid",
        email: "not-email",
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toHaveLength(2);
        expect(result.error.some((d) => d.path.includes("id"))).toBe(true);
        expect(result.error.some((d) => d.path.includes("email"))).toBe(true);
      }
    });

    it("formats root-level error paths correctly", () => {
      const result = validateWithDiagnostics(z.string().email(), 123);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error[0]?.path).toEqual([]);
      }
    });
  });

  describe("Discriminated Unions", () => {
    const EventSchema = z.discriminatedUnion("type", [
      z.object({ type: z.literal("click"), x: z.number(), y: z.number() }),
      z.object({ type: z.literal("keypress"), key: z.string() }),
    ]);

    it("validates correct discriminator", () => {
      const result = validateWithDiagnostics(EventSchema, {
        type: "click",
        x: 10,
        y: 20,
      });

      expect(result.ok).toBe(true);
    });

    it("rejects invalid discriminator", () => {
      const result = validateWithDiagnostics(EventSchema, {
        type: "hover",
        x: 10,
      });

      expect(result.ok).toBe(false);
    });

    it("handles optional fields and defaults", () => {
      const schema = z.object({
        name: z.string(),
        age: z.number().optional(),
        role: z.string().default("user"),
      });

      const result = validateWithDiagnostics(schema, { name: "Alice" });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.role).toBe("user");
      }
    });
  });

  describe("JSON Schema Generation", () => {
    it("generates JSON schema from zod definitions", () => {
      const jsonSchema = generateJsonSchema(UserSchema, { name: "User" });
      expect(jsonSchema).toHaveProperty("$schema");
      const userDefinition = jsonSchema.definitions?.User;
      expect(userDefinition).toBeDefined();
      expect(userDefinition?.properties).toHaveProperty("email");
    });

    it("generates schema with custom name and target", () => {
      const schema = z.object({
        id: z.string(),
        metadata: z.record(z.string()),
      });

      const jsonSchema = generateJsonSchema(schema, {
        name: "Entity",
        target: "openApi3",
      });

      expect(jsonSchema.definitions?.Entity).toBeDefined();
    });

    it("generates schema without name option", () => {
      const schema = z.object({ value: z.number() });
      const jsonSchema = generateJsonSchema(schema);

      expect(jsonSchema).toHaveProperty("type");
      expect(jsonSchema.type).toBe("object");
    });

    it("handles nested schema generation", () => {
      const AddressSchema = z.object({
        street: z.string(),
        city: z.string(),
      });

      const PersonSchema = z.object({
        name: z.string(),
        address: AddressSchema,
      });

      const jsonSchema = generateJsonSchema(PersonSchema, { name: "Person" });
      const personDef = jsonSchema.definitions?.Person;

      expect(personDef?.properties?.address).toBeDefined();
    });

    it("generates array type schemas", () => {
      const schema = z.array(z.string());
      const jsonSchema = generateJsonSchema(schema);

      expect(jsonSchema.type).toBe("array");
      expect(jsonSchema.items).toBeDefined();
    });
  });

  describe("Environment Validation", () => {
    const envSchema = z.object({
      DATABASE_URL: z.string().url(),
      NODE_ENV: z.enum(["development", "production", "test"]),
    });

    it("validates environment input without mutating process.env", () => {
      const envResult = createEnvValidator(envSchema, {
        env: {
          DATABASE_URL: "https://db.example.com",
          NODE_ENV: "development",
        },
        schemaName: "env",
      });

      expect(envResult.ok).toBe(true);

      const badResult = createEnvValidator(envSchema, {
        env: { DATABASE_URL: "foo", NODE_ENV: "dev" },
        schemaName: "env",
      });

      expect(badResult.ok).toBe(false);
      if (!badResult.ok) {
        expect(badResult.error.schema).toBe("env");
      }
    });

    it("validates explicit env object with coercion and transforms", () => {
      const schema = z.object({
        PORT: z.coerce.number(),
        DEBUG: z.enum(["true", "false"]).transform((v) => v === "true"),
      });

      const result = createEnvValidator(schema, {
        env: { PORT: "3000", DEBUG: "true" },
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.PORT).toBe(3000);
        expect(result.value.DEBUG).toBe(true);
      }
    });

    it("reports multiple validation errors in env", () => {
      const result = createEnvValidator(envSchema, {
        env: { DATABASE_URL: "invalid", NODE_ENV: "staging" },
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.diagnostics.length).toBeGreaterThan(0);
      }
    });

    it("uses 'environment' as default schemaName", () => {
      const result = createEnvValidator(envSchema, {
        env: { DATABASE_URL: "invalid" },
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.schema).toBe("environment");
      }
    });

    it("detects missing required environment variables", () => {
      const schema = z.object({
        REQUIRED_VAR: z.string(),
      });

      const result = createEnvValidator(schema, { env: {} });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.diagnostics[0]?.code).toBe("validation.zod.invalid_type");
      }
    });
  });

  describe("Severity Inference", () => {
    it("defaults to error severity", () => {
      const result = validateWithDiagnostics(z.string(), 123);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error[0]?.severity).toBe("error");
      }
    });

    it("infers warning severity from custom issues", () => {
      const schema = z.string().superRefine((val, ctx) => {
        if (val.length < 10) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            params: { severity: "warning" },
            message: "Short value",
          });
        }
      });

      const result = validateWithDiagnostics(schema, "short");

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error[0]?.severity).toBe("warning");
      }
    });

    it("handles mixed warning and error diagnostics", () => {
      const schema = z.string().superRefine((val, ctx) => {
        if (val.length < 10) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            params: { severity: "warning" },
            message: "Short value",
          });
        }
        if (val.length < 3) {
          ctx.addIssue({
            code: z.ZodIssueCode.too_small,
            minimum: 3,
            type: "string",
            inclusive: true,
            message: "Too short",
          });
        }
      });

      const result = validateWithDiagnostics(schema, "ab");

      expect(result.ok).toBe(false);
      if (!result.ok) {
        const severities = result.error.map((d) => d.severity);
        expect(severities).toContain("warning");
        expect(severities).toContain("error");
      }
    });
  });

  describe("Custom Zod Issues", () => {
    it("maps zod issue codes to validation codes", () => {
      const result = validateWithDiagnostics(z.string().email(), "not-email");

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error[0]?.code).toBe("validation.zod.invalid_string");
      }
    });

    it("handles custom error codes", () => {
      const schema = z.string().refine(() => false, {
        message: "Custom validation failed",
      });

      const result = validateWithDiagnostics(schema, "test");

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error[0]?.code).toBe("validation.zod.custom");
        expect(result.error[0]?.message).toBe("Custom validation failed");
      }
    });

    it("preserves error messages from zod", () => {
      const result = validateWithDiagnostics(
        z.string().min(5, "Must be at least 5 characters"),
        "abc",
      );

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error[0]?.message).toBe("Must be at least 5 characters");
      }
    });
  });

  describe("Result Pattern Integration", () => {
    it("returns Result type from registry validate", () => {
      const registry = createSchemaRegistry({ user: UserSchema });
      const result = registry.validate("user", {
        id: crypto.randomUUID(),
        email: "test@example.com",
      });

      expect(result).toHaveProperty("ok");
      if (result.ok) {
        expect(result.value).toHaveProperty("id");
        expect(result.value).toHaveProperty("email");
      }
    });

    it("returns Result type from validateWithDiagnostics", () => {
      const result = validateWithDiagnostics(UserSchema, {
        id: crypto.randomUUID(),
        email: "test@example.com",
      });

      expect(result).toHaveProperty("ok");
      expect(result.ok).toBe(true);
    });

    it("returns Result type from createEnvValidator", () => {
      const schema = z.object({ KEY: z.string() });
      const result = createEnvValidator(schema, { env: { KEY: "value" } });

      expect(result).toHaveProperty("ok");
      expect(result.ok).toBe(true);
    });
  });

  describe("AppError Conversion", () => {
    it("maps diagnostics to ExtendedAppError", () => {
      const diagnostics: ValidationDiagnostic[] = [
        {
          path: ["email"],
          message: "Invalid email",
          code: "validation.zod.invalid_string",
          severity: "error",
        },
      ];
      const appError = diagnosticsToAppError(diagnostics, "user");
      expect(appError.message).toContain("user");
      expect(appError.code).toBe(ERROR_CODES.CONFIG_VALIDATION_FAILED);
    });

    it("formats summary with schema name", () => {
      const diagnostics: ValidationDiagnostic[] = [
        {
          path: ["field"],
          message: "Error message",
          code: "validation.test",
          severity: "error",
        },
      ];
      const appError = diagnosticsToAppError(diagnostics, "config");

      expect(appError.message).toContain("Validation failed for config");
    });

    it("formats summary without schema name", () => {
      const diagnostics: ValidationDiagnostic[] = [
        {
          path: ["field"],
          message: "Error message",
          code: "validation.test",
          severity: "error",
        },
      ];
      const appError = diagnosticsToAppError(diagnostics);

      expect(appError.message).toContain("Validation failed");
      expect(appError.message).not.toContain("for");
    });

    it("includes multiple diagnostics in summary", () => {
      const diagnostics: ValidationDiagnostic[] = [
        {
          path: ["email"],
          message: "Invalid email",
          code: "validation.test",
          severity: "error",
        },
        {
          path: ["age"],
          message: "Must be positive",
          code: "validation.test",
          severity: "error",
        },
      ];
      const appError = diagnosticsToAppError(diagnostics, "user");

      expect(appError.message).toContain("email");
      expect(appError.message).toContain("age");
    });

    it("attaches diagnostics to error cause", () => {
      const diagnostics: ValidationDiagnostic[] = [
        {
          path: ["test"],
          message: "Test error",
          code: "validation.test",
          severity: "error",
        },
      ];
      const appError = diagnosticsToAppError(diagnostics);

      expect(appError.cause).toBeDefined();
      expect(
        (appError.cause as Error & { diagnostics?: readonly ValidationDiagnostic[] }).diagnostics,
      ).toEqual(diagnostics);
    });
  });
});
