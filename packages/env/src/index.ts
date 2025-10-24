import { existsSync } from "node:fs";
import { resolve } from "node:path";
import {
  createError,
  ERROR_CODES,
  type ExtendedAppError,
  err,
  ok,
  type Result,
} from "@outfitter/contracts";
import { config as loadDotEnvConfig } from "dotenv";
import type { z } from "zod";
import {
  type ValidationDiagnostic,
  type ValidationError,
  validateWithDiagnostics,
  createEnvValidator as validationCreateEnvValidator,
} from "../../validation/src/index.js";

export interface EnvOptions {
  readonly required?: readonly string[];
  readonly optional?: readonly string[];
  readonly defaults?: Readonly<Record<string, string>>;
  readonly prefix?: string;
  readonly env?: Record<string, unknown>;
  readonly schemaName?: string;
}

export type EnvProfile = "development" | "staging" | "production";

export interface EnvProfileConfig {
  readonly env: EnvProfile;
  readonly defaults: Readonly<Record<string, string>>;
}

export interface LoadSecretsOptions {
  readonly namespace?: string;
  readonly prefix?: string;
}

export type ValidateEnvResult<T> = Result<T, ExtendedAppError>;

const PROFILE_DEFAULTS: Record<EnvProfile, Record<string, string>> = {
  development: { NODE_ENV: "development" },
  staging: { NODE_ENV: "staging" },
  production: { NODE_ENV: "production" },
};

export function validateEnv<T>(
  schema: z.ZodSchema<T>,
  options: EnvOptions = {},
): ValidateEnvResult<T> {
  const envRecord = collectEnvironment(options);
  const enrichedSchema = applyKeyOptions(schema, options);
  const diagnosticsResult = validateWithDiagnostics(enrichedSchema, envRecord);

  if (diagnosticsResult.ok) {
    return ok(diagnosticsResult.value);
  }

  const error = toEnvError(diagnosticsResult.error, options.schemaName ?? "environment");
  return err(error);
}

export function createEnvValidator<T>(
  schema: z.ZodSchema<T>,
  options: EnvOptions = {},
): Result<T, ValidationError> {
  const envRecord = collectEnvironment(options);
  const enrichedSchema = applyKeyOptions(schema, options);
  return validationCreateEnvValidator(enrichedSchema, {
    env: envRecord,
    schemaName: options.schemaName ?? "environment",
  });
}

export async function loadBunSecrets(
  secretNames: readonly string[],
  options: LoadSecretsOptions = {},
): Promise<Record<string, string>> {
  const secrets: Record<string, string> = {};

  if (typeof Bun !== "undefined" && typeof Bun.secrets !== "undefined") {
    for (const name of secretNames) {
      const key = options.prefix ? `${options.prefix}${name}` : name;
      const secret = await Bun.secrets.get({
        service: options.namespace ?? "default",
        name: key,
      });
      if (secret !== null && secret !== undefined) {
        secrets[name] = secret;
      }
    }
    return secrets;
  }

  return secrets;
}

export function loadDotEnv(filePath?: string): Record<string, string> {
  const resolvedPath = resolveDotEnvPath(filePath);
  if (!resolvedPath) {
    return {};
  }

  const parsed = loadDotEnvConfig({ path: resolvedPath, override: false }).parsed ?? {};
  return parsed as Record<string, string>;
}

export function resolveEnvProfile(profile: EnvProfile): EnvProfileConfig {
  const defaults = PROFILE_DEFAULTS[profile];
  return {
    env: profile,
    defaults: { ...defaults },
  };
}

function collectEnvironment(options: EnvOptions): Record<string, unknown> {
  const source = options.env ?? process?.env ?? {};
  const defaults = options.defaults ?? {};

  const entries: Array<[string, unknown]> = Object.entries(defaults).map(([key, value]) => [
    key,
    value,
  ]);
  for (const [key, value] of Object.entries(source)) {
    entries.push([key, value]);
  }

  return entries.reduce<Record<string, unknown>>((acc, entry) => {
    const [key, value] = entry;
    if (key === undefined) {
      return acc;
    }
    const normalizedKey = options.prefix ? key.replace(new RegExp(`^${options.prefix}`), "") : key;
    acc[normalizedKey] = value;
    return acc;
  }, {});
}

function applyKeyOptions<T>(schema: z.ZodSchema<T>, options: EnvOptions): z.ZodSchema<T> {
  const required = new Set(options.required ?? []);
  const optional = new Set(options.optional ?? []);

  const shape = extractSchemaShape(schema);
  const updatedShape: Record<string, z.ZodTypeAny> = {};

  for (const [key, type] of Object.entries(shape)) {
    if (required.has(key)) {
      updatedShape[key] = "unwrap" in type ? (type as z.ZodOptional<z.ZodTypeAny>).unwrap() : type;
    } else if (optional.has(key)) {
      updatedShape[key] = "unwrap" in type ? type : type.optional();
    } else {
      updatedShape[key] = type;
    }
  }

  // Use type assertion since we know the shape is compatible
  const zodObject = schema as unknown as z.ZodObject<z.ZodRawShape>;
  return zodObject.extend(updatedShape) as unknown as z.ZodSchema<T>;
}

function extractSchemaShape(schema: z.ZodSchema<unknown>): Record<string, z.ZodTypeAny> {
  const def = schema._def as { shape?: () => Record<string, z.ZodTypeAny> };
  if (typeof def.shape === "function") {
    return def.shape();
  }
  throw new Error("validateEnv currently supports Zod object schemas only");
}

function toEnvError(
  diagnostics: readonly ValidationDiagnostic[],
  schemaName: string,
): ExtendedAppError {
  const message = diagnostics
    .map((diag) => `${diag.path.join(".") || "<root>"}: ${diag.message}`)
    .join("; ");
  return createError(ERROR_CODES.CONFIG_VALIDATION_FAILED, `${schemaName}: ${message}`, {
    name: "EnvironmentValidationError",
  });
}

function resolveDotEnvPath(filePath?: string): string | undefined {
  if (filePath) {
    const resolved = resolve(process.cwd(), filePath);
    return existsSync(resolved) ? resolved : undefined;
  }

  const defaultPaths = [".env", ".env.local"];
  for (const path of defaultPaths) {
    const resolved = resolve(process.cwd(), path);
    if (existsSync(resolved)) {
      return resolved;
    }
  }
  return undefined;
}
