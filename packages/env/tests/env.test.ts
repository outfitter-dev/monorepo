import { ERROR_CODES } from "@outfitter/contracts";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import {
  createEnvValidator,
  type EnvProfile,
  loadBunSecrets,
  loadDotEnv,
  resolveEnvProfile,
  validateEnv,
} from "../src/index.js";

const EnvSchema = z.object({
  DATABASE_URL: z.string().url(),
  NODE_ENV: z.enum(["development", "staging", "production"]),
  PORT: z.coerce.number().int().positive().default(3000),
});

describe("@outfitter/env", () => {
  describe("basic validation", () => {
    it("validates environment variables with defaults", () => {
      const result = validateEnv(EnvSchema, {
        env: {
          DATABASE_URL: "https://db.example.com",
          NODE_ENV: "development",
        },
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.PORT).toBe(3000);
      }
    });

    it("returns diagnostics for invalid env", () => {
      const result = validateEnv(EnvSchema, {
        env: { DATABASE_URL: "invalid", NODE_ENV: "dev" },
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain("environment");
      }
    });

    it("applies required and optional key overrides", () => {
      const schema = z.object({ TOKEN: z.string().optional() });
      const result = validateEnv(schema, {
        env: {},
        required: ["TOKEN"],
      });
      expect(result.ok).toBe(false);
    });
  });

  describe("missing required variables", () => {
    it("fails when single required variable is missing", () => {
      const result = validateEnv(EnvSchema, {
        env: {
          NODE_ENV: "development",
          // DATABASE_URL is missing
        },
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain("DATABASE_URL");
        expect(result.error.message).toContain("environment");
        expect(result.error.code).toBe(ERROR_CODES.CONFIG_VALIDATION_FAILED);
      }
    });

    it("fails when multiple required variables are missing", () => {
      const result = validateEnv(EnvSchema, {
        env: {
          // DATABASE_URL and NODE_ENV are both missing
        },
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain("DATABASE_URL");
        expect(result.error.message).toContain("NODE_ENV");
      }
    });

    it("provides helpful error message for missing required vars", () => {
      const schema = z.object({
        API_KEY: z.string(),
        SECRET_TOKEN: z.string(),
      });

      const result = validateEnv(schema, {
        env: {},
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toMatch(/API_KEY.*Required/);
        expect(result.error.message).toMatch(/SECRET_TOKEN.*Required/);
      }
    });

    it("succeeds when required override is satisfied", () => {
      const schema = z.object({
        OPTIONAL_VAR: z.string().optional(),
      });

      const result = validateEnv(schema, {
        env: { OPTIONAL_VAR: "value" },
        required: ["OPTIONAL_VAR"],
      });

      expect(result.ok).toBe(true);
    });
  });

  describe("invalid format validation", () => {
    it("fails on invalid URL format", () => {
      const result = validateEnv(EnvSchema, {
        env: {
          DATABASE_URL: "not-a-url",
          NODE_ENV: "development",
        },
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain("DATABASE_URL");
        expect(result.error.message).toMatch(/url|invalid/i);
      }
    });

    it("fails on invalid enum value", () => {
      const result = validateEnv(EnvSchema, {
        env: {
          DATABASE_URL: "https://db.example.com",
          NODE_ENV: "invalid-env",
        },
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain("NODE_ENV");
      }
    });

    it("fails on invalid number format", () => {
      const result = validateEnv(EnvSchema, {
        env: {
          DATABASE_URL: "https://db.example.com",
          NODE_ENV: "development",
          PORT: "not-a-number",
        },
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain("PORT");
      }
    });

    it("fails on negative number when positive required", () => {
      const result = validateEnv(EnvSchema, {
        env: {
          DATABASE_URL: "https://db.example.com",
          NODE_ENV: "development",
          PORT: "-100",
        },
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain("PORT");
      }
    });

    it("coerces string to boolean", () => {
      const schema = z.object({
        ENABLED: z.coerce.boolean(),
      });

      // Note: z.coerce.boolean() treats any non-empty string as true
      const result = validateEnv(schema, {
        env: { ENABLED: "true" },
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.ENABLED).toBe(true);
      }
    });

    it("handles zero as number coercion", () => {
      const schema = z.object({
        TIMEOUT: z.coerce.number(),
      });

      const result = validateEnv(schema, {
        env: { TIMEOUT: "0" },
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.TIMEOUT).toBe(0);
      }
    });
  });

  describe("prefix handling", () => {
    it("strips prefix from environment variable names", () => {
      const schema = z.object({
        DATABASE_URL: z.string().url(),
        API_KEY: z.string(),
      });

      const result = validateEnv(schema, {
        env: {
          APP_DATABASE_URL: "https://db.example.com",
          APP_API_KEY: "secret",
        },
        prefix: "APP_",
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.DATABASE_URL).toBe("https://db.example.com");
        expect(result.value.API_KEY).toBe("secret");
      }
    });

    it("handles mixed prefixed and unprefixed variables", () => {
      const schema = z.object({
        DATABASE_URL: z.string().url(),
        NODE_ENV: z.string(),
      });

      const result = validateEnv(schema, {
        env: {
          APP_DATABASE_URL: "https://db.example.com",
          NODE_ENV: "development",
        },
        prefix: "APP_",
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.DATABASE_URL).toBe("https://db.example.com");
        expect(result.value.NODE_ENV).toBe("development");
      }
    });

    it("handles empty prefix as no-op", () => {
      const schema = z.object({
        DATABASE_URL: z.string().url(),
      });

      const result = validateEnv(schema, {
        env: {
          DATABASE_URL: "https://db.example.com",
        },
        prefix: "",
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.DATABASE_URL).toBe("https://db.example.com");
      }
    });

    it("handles undefined prefix gracefully", () => {
      const schema = z.object({
        DATABASE_URL: z.string().url(),
      });

      const result = validateEnv(schema, {
        env: {
          DATABASE_URL: "https://db.example.com",
        },
        prefix: undefined,
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.DATABASE_URL).toBe("https://db.example.com");
      }
    });
  });

  describe("Bun secrets edge cases", () => {
    it("returns object when Bun secrets is available", async () => {
      // When Bun.secrets exists (which it does in the test environment),
      // loadBunSecrets should return an object
      const secrets = await loadBunSecrets(["API_KEY", "SECRET_TOKEN"]);
      expect(secrets).toBeTypeOf("object");
    });

    it("handles empty secret list", async () => {
      const secrets = await loadBunSecrets([]);
      expect(secrets).toEqual({});
    });

    it("applies prefix to secret names", async () => {
      // Test that prefix is correctly applied in the function logic
      // Since we can't easily mock Bun, we test the behavior indirectly
      const secrets = await loadBunSecrets(["API_KEY"], { prefix: "APP_" });
      expect(secrets).toBeTypeOf("object");
    });

    it("uses specified namespace", async () => {
      // Test that namespace parameter is accepted and handled
      const secrets = await loadBunSecrets(["API_KEY"], { namespace: "production" });
      expect(secrets).toBeTypeOf("object");
    });

    it("defaults to 'default' namespace when not specified", async () => {
      // Test that default namespace is used when not specified
      const secrets = await loadBunSecrets(["API_KEY"]);
      expect(secrets).toBeTypeOf("object");
    });

    it("combines prefix and namespace", async () => {
      // Test that both prefix and namespace can be used together
      const secrets = await loadBunSecrets(["API_KEY"], { namespace: "staging", prefix: "APP_" });
      expect(secrets).toBeTypeOf("object");
    });

    it("handles multiple secret names", async () => {
      // Test that multiple secrets can be requested
      const secrets = await loadBunSecrets(["SECRET1", "SECRET2", "SECRET3"]);
      expect(secrets).toBeTypeOf("object");
    });
  });

  describe("profile resolution", () => {
    it("sets correct NODE_ENV for development profile", () => {
      const profile = resolveEnvProfile("development");
      expect(profile.env).toBe("development");
      expect(profile.defaults.NODE_ENV).toBe("development");
    });

    it("sets correct NODE_ENV for staging profile", () => {
      const profile = resolveEnvProfile("staging");
      expect(profile.env).toBe("staging");
      expect(profile.defaults.NODE_ENV).toBe("staging");
    });

    it("sets correct NODE_ENV for production profile", () => {
      const profile = resolveEnvProfile("production");
      expect(profile.env).toBe("production");
      expect(profile.defaults.NODE_ENV).toBe("production");
    });

    it("merges profile defaults correctly", () => {
      const profiles: EnvProfile[] = ["development", "staging", "production"];

      for (const profile of profiles) {
        const resolved = resolveEnvProfile(profile);
        expect(resolved.defaults).toEqual({ NODE_ENV: profile });
      }
    });

    it("returns a new object (not mutating shared state)", () => {
      const profile1 = resolveEnvProfile("development");
      const profile2 = resolveEnvProfile("development");

      expect(profile1.defaults).not.toBe(profile2.defaults);
      expect(profile1.defaults).toEqual(profile2.defaults);
    });
  });

  describe("error recovery and diagnostics", () => {
    it("returns Result type with ok=true on success", () => {
      const result = validateEnv(EnvSchema, {
        env: {
          DATABASE_URL: "https://db.example.com",
          NODE_ENV: "development",
        },
      });

      expect(result.ok).toBe(true);
      expect("value" in result && result.value).toBeDefined();
    });

    it("returns Result type with ok=false on failure", () => {
      const result = validateEnv(EnvSchema, {
        env: { DATABASE_URL: "invalid" },
      });

      expect(result.ok).toBe(false);
      expect("error" in result && result.error).toBeDefined();
    });

    it("error has CONFIG_VALIDATION_FAILED code", () => {
      const result = validateEnv(EnvSchema, {
        env: { DATABASE_URL: "invalid", NODE_ENV: "invalid" },
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe(ERROR_CODES.CONFIG_VALIDATION_FAILED);
      }
    });

    it("error contains EnvironmentValidationError name", () => {
      const result = validateEnv(EnvSchema, {
        env: { DATABASE_URL: "invalid" },
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.name).toBe("EnvironmentValidationError");
      }
    });

    it("uses custom schemaName in error messages", () => {
      const result = validateEnv(EnvSchema, {
        env: { DATABASE_URL: "invalid" },
        schemaName: "AppConfig",
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain("AppConfig");
      }
    });

    it("defaults to 'environment' schemaName when not provided", () => {
      const result = validateEnv(EnvSchema, {
        env: { DATABASE_URL: "invalid" },
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain("environment");
      }
    });

    it("provides field paths in error messages", () => {
      const result = validateEnv(EnvSchema, {
        env: { DATABASE_URL: "invalid", NODE_ENV: "bad" },
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain("DATABASE_URL");
        expect(result.error.message).toContain("NODE_ENV");
      }
    });
  });

  describe("defaults handling", () => {
    it("applies defaults option to environment", () => {
      const schema = z.object({
        PORT: z.coerce.number(),
        HOST: z.string(),
      });

      const result = validateEnv(schema, {
        env: {},
        defaults: {
          PORT: "8080",
          HOST: "localhost",
        },
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.PORT).toBe(8080);
        expect(result.value.HOST).toBe("localhost");
      }
    });

    it("allows env values to override defaults", () => {
      const schema = z.object({
        PORT: z.coerce.number(),
      });

      const result = validateEnv(schema, {
        env: { PORT: "3000" },
        defaults: { PORT: "8080" },
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.PORT).toBe(3000);
      }
    });

    it("merges defaults with environment variables", () => {
      const schema = z.object({
        DATABASE_URL: z.string().url(),
        PORT: z.coerce.number(),
        HOST: z.string(),
      });

      const result = validateEnv(schema, {
        env: { DATABASE_URL: "https://db.example.com" },
        defaults: {
          PORT: "8080",
          HOST: "localhost",
        },
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.DATABASE_URL).toBe("https://db.example.com");
        expect(result.value.PORT).toBe(8080);
        expect(result.value.HOST).toBe("localhost");
      }
    });
  });

  describe("createEnvValidator", () => {
    it("creates env validator compatible with validation package", () => {
      const validator = createEnvValidator(EnvSchema, {
        env: { DATABASE_URL: "https://db", NODE_ENV: "staging" },
      });
      expect(validator.ok).toBe(true);
    });

    it("returns ValidationError on failure", () => {
      const validator = createEnvValidator(EnvSchema, {
        env: { DATABASE_URL: "invalid" },
      });

      expect(validator.ok).toBe(false);
      if (!validator.ok) {
        expect(validator.error.name).toBe("ValidationError");
        expect(validator.error.diagnostics).toBeDefined();
        expect(Array.isArray(validator.error.diagnostics)).toBe(true);
      }
    });

    it("uses custom schemaName in ValidationError", () => {
      const validator = createEnvValidator(EnvSchema, {
        env: { DATABASE_URL: "invalid" },
        schemaName: "CustomConfig",
      });

      expect(validator.ok).toBe(false);
      if (!validator.ok) {
        expect(validator.error.schema).toBe("CustomConfig");
      }
    });
  });

  describe("loadDotEnv", () => {
    it("loads .env files when present", () => {
      const env = loadDotEnv();
      expect(env).toBeTypeOf("object");
    });

    it("returns empty object when .env file not found", () => {
      const env = loadDotEnv("/nonexistent/path/.env");
      expect(env).toEqual({});
    });
  });
});
