/**
 * Schema validation helpers
 *
 * Provides utilities for validating configuration data against Zod schemas.
 * Uses @outfitter/contracts for Result pattern and error handling.
 */

import {
  createError,
  ERROR_CODES,
  type ExtendedAppError,
  err,
  ok,
  type Result,
} from "@outfitter/contracts";
import { z } from "zod";

/**
 * Validation error with detailed diagnostics
 */
export interface ValidationError extends ExtendedAppError {
  /** Path to the invalid field */
  readonly path?: string;
  /** Array of validation issues */
  readonly issues?: readonly ValidationIssue[];
}

/**
 * Individual validation issue
 */
export interface ValidationIssue {
  /** Path to the field */
  readonly path: string;
  /** Error message */
  readonly message: string;
  /** Validation code (from Zod) */
  readonly code: string;
}

/**
 * Convert Zod error to ValidationError
 *
 * @param error - Zod validation error
 * @param context - Optional context message
 * @returns ValidationError with structured diagnostics
 */
function zodErrorToValidationError(error: z.ZodError, context?: string): ValidationError {
  const issues: ValidationIssue[] = error.errors.map((issue) => ({
    path: issue.path.join("."),
    message: issue.message,
    code: issue.code,
  }));

  const messages = issues
    .map((issue) => {
      const path = issue.path || "root";
      return `${path}: ${issue.message}`;
    })
    .join("; ");

  const fullMessage = context ? `${context}: ${messages}` : messages;

  const validationError = createError(
    ERROR_CODES.CONFIG_VALIDATION_FAILED,
    fullMessage || "Configuration validation failed",
    {
      name: "ValidationError",
      cause: error,
    },
  );

  return {
    ...validationError,
    issues,
  };
}

/**
 * Validate configuration data against a schema
 *
 * Uses Zod schema validation and returns a Result type for explicit error handling.
 *
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @param context - Optional context for error messages
 * @returns Result containing validated data or validation error
 *
 * @example
 * ```typescript
 * import { z } from 'zod';
 * import { validateConfig } from './schema-helpers';
 *
 * const schema = z.object({
 *   name: z.string(),
 *   port: z.number().min(1).max(65535),
 * });
 *
 * const result = validateConfig(schema, { name: 'app', port: 3000 });
 * if (result.ok) {
 *   console.log('Valid config:', result.value);
 * } else {
 *   console.error('Validation failed:', result.error.message);
 *   console.error('Issues:', result.error.issues);
 * }
 * ```
 */
export function validateConfig<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  context?: string,
): Result<T, ValidationError> {
  try {
    const validated = schema.parse(data);
    return ok(validated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return err(zodErrorToValidationError(error, context));
    }

    // Unexpected error during validation
    const errorOptions: {
      name: string;
      cause?: Error;
    } = { name: "ValidationError" };

    if (error instanceof Error) {
      errorOptions.cause = error;
    }

    const validationError = createError(
      ERROR_CODES.CONFIG_PARSE_ERROR,
      error instanceof Error ? error.message : "Unknown validation error",
      errorOptions,
    );

    return err({
      ...validationError,
      issues: [],
    });
  }
}

/**
 * Safe parse with detailed diagnostics
 *
 * Similar to validateConfig but provides more structured error information.
 *
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @returns Result with validated data or detailed error diagnostics
 */
export function safeParseConfig<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
): Result<T, ValidationError> {
  return validateConfig(schema, data);
}

/**
 * Validate partial configuration
 *
 * Validates a partial configuration object, making all fields optional.
 * Useful for merging user config with defaults.
 *
 * @param schema - Zod schema to validate against
 * @param data - Partial data to validate
 * @returns Result with validated partial data or validation error
 *
 * @example
 * ```typescript
 * import { z } from 'zod';
 * import { validatePartialConfig } from './schema-helpers';
 *
 * const schema = z.object({
 *   name: z.string(),
 *   port: z.number(),
 * });
 *
 * // Only validate the fields present
 * const result = validatePartialConfig(schema, { port: 3000 });
 * if (result.ok) {
 *   console.log('Valid partial:', result.value); // { port: 3000 }
 * }
 * ```
 */
export function validatePartialConfig<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
): Result<Partial<T>, ValidationError> {
  // Create a partial version of the schema
  if (schema instanceof z.ZodObject) {
    // Double cast through unknown is necessary for strict TypeScript
    const partialSchema = schema.partial() as unknown as z.ZodSchema<Partial<T>>;
    return validateConfig(partialSchema, data, "Partial config validation");
  }

  // For non-object schemas, we can't make them partial, so just validate as-is
  // and cast the result to Partial<T>
  const result = validateConfig(schema, data, "Partial config validation");
  if (result.ok) {
    return ok(result.value as Partial<T>);
  }
  return result as Result<Partial<T>, ValidationError>;
}

/**
 * Merge and validate configuration with defaults
 *
 * Merges user configuration with defaults, then validates the result.
 *
 * @param schema - Zod schema to validate against
 * @param userConfig - User-provided configuration (partial)
 * @param defaults - Default configuration values
 * @returns Result with merged and validated config
 *
 * @example
 * ```typescript
 * import { z } from 'zod';
 * import { mergeAndValidate } from './schema-helpers';
 *
 * const schema = z.object({
 *   name: z.string(),
 *   port: z.number(),
 *   debug: z.boolean(),
 * });
 *
 * const defaults = { port: 3000, debug: false };
 * const userConfig = { name: 'myapp' };
 *
 * const result = mergeAndValidate(schema, userConfig, defaults);
 * // result.value = { name: 'myapp', port: 3000, debug: false }
 * ```
 */
export function mergeAndValidate<T>(
  schema: z.ZodSchema<T>,
  userConfig: unknown,
  defaults: Partial<T>,
): Result<T, ValidationError> {
  try {
    // Merge with defaults (user config takes precedence)
    const merged =
      typeof userConfig === "object" && userConfig !== null
        ? { ...defaults, ...userConfig }
        : defaults;

    return validateConfig(schema, merged, "Merged config validation");
  } catch (error) {
    const errorOptions: {
      name: string;
      cause?: Error;
    } = { name: "ConfigMergeError" };

    if (error instanceof Error) {
      errorOptions.cause = error;
    }

    const baseError = createError(
      ERROR_CODES.CONFIG_PARSE_ERROR,
      error instanceof Error ? error.message : "Failed to merge configuration",
      errorOptions,
    );

    return err({
      ...baseError,
      issues: [],
    });
  }
}
