import { describe, expect, it } from "vitest";
import { z } from "zod";
import {
  createEnvValidator,
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

  it("loads .env files when present", () => {
    const env = loadDotEnv();
    expect(env).toBeTypeOf("object");
  });

  it("creates env validator compatible with validation package", () => {
    const validator = createEnvValidator(EnvSchema, {
      env: { DATABASE_URL: "https://db", NODE_ENV: "staging" },
    });
    expect(validator.ok).toBe(true);
  });

  it("resolves environment profiles", () => {
    const profile = resolveEnvProfile("staging");
    expect(profile.env).toBe("staging");
    expect(profile.defaults.NODE_ENV).toBe("staging");
  });

  it("loads Bun secrets when available", async () => {
    const secrets = await loadBunSecrets(["API_KEY"]);
    expect(secrets).toBeTypeOf("object");
  });
});
