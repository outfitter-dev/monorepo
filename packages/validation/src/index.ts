import {
  createError,
  ERROR_CODES,
  type ExtendedAppError,
  err,
  ok,
  type Result,
} from "@outfitter/contracts";
import { z } from "zod";
import {
  type JsonSchema7Type,
  type Options as ZodToJsonSchemaOptions,
  zodToJsonSchema,
} from "zod-to-json-schema";

export type ValidationSeverity = "error" | "warning";

export interface ValidationDiagnostic {
  readonly path: readonly string[];
  readonly message: string;
  readonly code: string;
  readonly severity: ValidationSeverity;
}

export interface ValidationError {
  readonly name: "ValidationError";
  readonly schema?: string;
  readonly diagnostics: readonly ValidationDiagnostic[];
  readonly summary: string;
}

export interface SchemaRegistry {
  register<T>(name: string, schema: z.ZodSchema<T>): void;
  get<T = unknown>(name: string): z.ZodSchema<T> | undefined;
  validate<T = unknown>(name: string, data: unknown): Result<T, ValidationError>;
  list(): readonly string[];
}

export type JsonSchema = JsonSchema7Type;
export type JsonSchemaOptions = ZodToJsonSchemaOptions;

export interface EnvValidationOptions {
  readonly env?: Record<string, unknown>;
  readonly schemaName?: string;
}

export function createSchemaRegistry(
  initial?: Record<string, z.ZodSchema<unknown>>,
): SchemaRegistry {
  const registry = new Map<string, z.ZodSchema<unknown>>(
    initial ? Object.entries(initial) : undefined,
  );

  return {
    register<T>(name: string, schema: z.ZodSchema<T>): void {
      registry.set(name, schema as z.ZodSchema<unknown>);
    },
    get<T = unknown>(name: string): z.ZodSchema<T> | undefined {
      return registry.get(name) as z.ZodSchema<T> | undefined;
    },
    validate<T = unknown>(name: string, data: unknown): Result<T, ValidationError> {
      const schema = registry.get(name);
      if (!schema) {
        return err(createMissingSchemaError(name));
      }

      const parsed = schema.safeParse(data);
      if (parsed.success) {
        return ok(parsed.data as T);
      }

      return err(toValidationError(name, parsed.error));
    },
    list(): readonly string[] {
      return Array.from(registry.keys());
    },
  };
}

export function validateWithDiagnostics<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
): Result<T, ValidationDiagnostic[]> {
  const parsed = schema.safeParse(data);
  if (parsed.success) {
    return ok(parsed.data);
  }

  const diagnostics = toDiagnostics(parsed.error.issues);
  return err(diagnostics);
}

export function generateJsonSchema<T>(
  schema: z.ZodSchema<T>,
  options?: JsonSchemaOptions,
): JsonSchema {
  return zodToJsonSchema(schema, options) as JsonSchema;
}

export function createEnvValidator<T>(
  schema: z.ZodSchema<T>,
  options: EnvValidationOptions = {},
): Result<T, ValidationError> {
  const source = options.env ?? process?.env ?? {};
  const parsed = schema.safeParse(source);
  if (parsed.success) {
    return ok(parsed.data);
  }

  const error = toValidationError(options.schemaName ?? "environment", parsed.error);
  return err(error);
}

export function diagnosticsToAppError(
  diagnostics: readonly ValidationDiagnostic[],
  schemaName?: string,
): ExtendedAppError {
  const summary = formatSummary(diagnostics, schemaName);
  const cause = new Error(summary);
  (cause as Error & { diagnostics?: readonly ValidationDiagnostic[] }).diagnostics = diagnostics;
  return createError(ERROR_CODES.CONFIG_VALIDATION_FAILED, summary, {
    name: "ValidationDiagnostics",
    cause,
  });
}

function toDiagnostics(issues: readonly z.ZodIssue[]): ValidationDiagnostic[] {
  return issues.map((issue) => ({
    path: issue.path.map((segment) => String(segment)),
    message: issue.message,
    code: `validation.zod.${issue.code}`,
    severity: inferSeverity(issue),
  }));
}

function toValidationError(schemaName: string, error: z.ZodError): ValidationError {
  const diagnostics = toDiagnostics(error.issues);
  return {
    name: "ValidationError",
    schema: schemaName,
    diagnostics,
    summary: formatSummary(diagnostics, schemaName),
  };
}

function formatSummary(diagnostics: readonly ValidationDiagnostic[], schemaName?: string): string {
  const header = schemaName ? `Validation failed for ${schemaName}` : "Validation failed";
  const details = diagnostics.map((diag) => `${formatPath(diag.path)}: ${diag.message}`).join("; ");
  return diagnostics.length > 0 ? `${header}: ${details}` : header;
}

function formatPath(path: readonly string[]): string {
  return path.length === 0 ? "<root>" : path.join(".");
}

function inferSeverity(issue: z.ZodIssue): ValidationSeverity {
  return issue.code === z.ZodIssueCode.custom &&
    issue.params &&
    "severity" in issue.params &&
    issue.params["severity"] === "warning"
    ? "warning"
    : "error";
}

function createMissingSchemaError(name: string): ValidationError {
  return {
    name: "ValidationError",
    schema: name,
    diagnostics: [
      {
        path: [],
        message: `Schema "${name}" is not registered`,
        code: "validation.schemaNotFound",
        severity: "error",
      },
    ],
    summary: `Schema "${name}" is not registered`,
  };
}
