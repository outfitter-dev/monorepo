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

  it("generates JSON schema from zod definitions", () => {
    const jsonSchema = generateJsonSchema(UserSchema, { name: "User" });
    expect(jsonSchema).toHaveProperty("$schema");
    const userDefinition = jsonSchema.definitions?.User;
    expect(userDefinition).toBeDefined();
    expect(userDefinition?.properties).toHaveProperty("email");
  });

  it("validates environment input without mutating process.env", () => {
    const envSchema = z.object({
      DATABASE_URL: z.string().url(),
      NODE_ENV: z.enum(["development", "production", "test"]),
    });

    const envResult = createEnvValidator(envSchema, {
      env: {
        DATABASE_URL: "https://db.example.com",
        NODE_ENV: "development",
      },
      schemaName: "env", // ensure name surfaces in errors
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

  it("reports missing schemas as validation errors", () => {
    const registry = createSchemaRegistry();
    const result = registry.validate("missing", {});
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.summary).toContain("not registered");
    }
  });
});
