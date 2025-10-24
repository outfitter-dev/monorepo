/**
 * Zod integration utilities
 *
 * Integrates Zod schema validation with Result types for
 * type-safe error handling.
 *
 * @module zod
 */

import type { z } from "zod";
import type { ExtendedAppError } from "../error/index.js";
import { createError, ERROR_CODES } from "../error/index.js";
import type { Result } from "../result/index.js";
import { err, ok } from "../result/index.js";

/**
 * Parse data with a Zod schema, returning a Result
 *
 * Validates data against a Zod schema and returns a Result type
 * instead of throwing. Converts Zod validation errors into
 * ExtendedAppError with SCHEMA_VALIDATION_FAILED code.
 *
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @returns Result containing parsed data or validation error
 *
 * @example
 * ```typescript
 * import { z } from 'zod';
 * import { parseZod } from '@outfitter/contracts';
 *
 * const UserSchema = z.object({
 *   name: z.string(),
 *   email: z.string().email(),
 *   age: z.number().positive(),
 * });
 *
 * const result = parseZod(UserSchema, {
 *   name: 'Alice',
 *   email: 'alice@example.com',
 *   age: 30,
 * });
 *
 * if (result.ok) {
 *   console.log('Valid user:', result.value);
 * } else {
 *   console.error('Validation failed:', result.error.message);
 * }
 * ```
 */
export const parseZod = <Output, Def extends z.ZodTypeDef = z.ZodTypeDef, Input = Output>(
  schema: z.ZodType<Output, Def, Input>,
  data: unknown,
): Result<Output, ExtendedAppError> => {
  const result = schema.safeParse(data);

  if (result.success) {
    return ok(result.data);
  }

  // Format Zod errors into a readable message
  const message = result.error.errors
    .map((err) => {
      const path = err.path.length > 0 ? `${err.path.join(".")}: ` : "";
      return `${path}${err.message}`;
    })
    .join("; ");

  return err(
    createError(ERROR_CODES.SCHEMA_VALIDATION_FAILED, message, {
      name: "ValidationError",
    }),
  );
};

/**
 * Parse data with detailed error information
 *
 * Like parseZod, but includes the full Zod error details in the
 * error object for debugging purposes.
 *
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @returns Result containing parsed data or detailed validation error
 *
 * @example
 * ```typescript
 * import { z } from 'zod';
 * import { parseZodDetailed } from '@outfitter/contracts';
 *
 * const schema = z.object({ age: z.number() });
 * const result = parseZodDetailed(schema, { age: 'not a number' });
 *
 * if (!result.ok) {
 *   console.log(result.error.message);
 *   // Zod errors available via cause if needed for debugging
 * }
 * ```
 */
export const parseZodDetailed = <Output, Def extends z.ZodTypeDef = z.ZodTypeDef, Input = Output>(
  schema: z.ZodType<Output, Def, Input>,
  data: unknown,
): Result<Output, ExtendedAppError> => {
  const result = schema.safeParse(data);

  if (result.success) {
    return ok(result.data);
  }

  const message = result.error.errors
    .map((err) => {
      const path = err.path.length > 0 ? `${err.path.join(".")}: ` : "";
      return `${path}${err.message}`;
    })
    .join("; ");

  // Create an Error to wrap the Zod error for the cause field
  const zodErrorWrapper = new Error(result.error.message);
  zodErrorWrapper.name = "ZodError";

  return err(
    createError(ERROR_CODES.SCHEMA_VALIDATION_FAILED, message, {
      name: "ValidationError",
      cause: zodErrorWrapper,
    }),
  );
};

/**
 * Async version of parseZod
 *
 * Validates data against a Zod schema asynchronously, useful for
 * schemas with async refinements.
 *
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @returns Promise resolving to Result
 *
 * @example
 * ```typescript
 * import { z } from 'zod';
 * import { parseZodAsync } from '@outfitter/contracts';
 *
 * const schema = z.object({
 *   email: z.string().email(),
 * }).refine(
 *   async (data) => {
 *     // Async validation (e.g., check if email is unique)
 *     return true;
 *   },
 *   { message: 'Email already exists' }
 * );
 *
 * const result = await parseZodAsync(schema, { email: 'test@example.com' });
 * ```
 */
export const parseZodAsync = async <
  Output,
  Def extends z.ZodTypeDef = z.ZodTypeDef,
  Input = Output,
>(
  schema: z.ZodType<Output, Def, Input>,
  data: unknown,
): Promise<Result<Output, ExtendedAppError>> => {
  const result = await schema.safeParseAsync(data);

  if (result.success) {
    return ok(result.data);
  }

  const message = result.error.errors
    .map((err) => {
      const path = err.path.length > 0 ? `${err.path.join(".")}: ` : "";
      return `${path}${err.message}`;
    })
    .join("; ");

  return err(
    createError(ERROR_CODES.SCHEMA_VALIDATION_FAILED, message, {
      name: "ValidationError",
    }),
  );
};

/**
 * Create a validation function from a Zod schema
 *
 * Returns a function that validates data and returns a Result.
 * Useful for creating reusable validators.
 *
 * @param schema - Zod schema to validate against
 * @returns Validation function
 *
 * @example
 * ```typescript
 * import { z } from 'zod';
 * import { createValidator } from '@outfitter/contracts';
 *
 * const validateUser = createValidator(
 *   z.object({
 *     name: z.string(),
 *     email: z.string().email(),
 *   })
 * );
 *
 * const result1 = validateUser({ name: 'Alice', email: 'alice@example.com' });
 * const result2 = validateUser({ name: 'Bob', email: 'invalid' });
 * ```
 */
export const createValidator = <Output, Def extends z.ZodTypeDef = z.ZodTypeDef, Input = Output>(
  schema: z.ZodType<Output, Def, Input>,
): ((data: unknown) => Result<Output, ExtendedAppError>) => {
  return (data: unknown) => parseZod(schema, data);
};

/**
 * Create an async validation function from a Zod schema
 *
 * Returns an async function that validates data and returns a Result.
 *
 * @param schema - Zod schema to validate against
 * @returns Async validation function
 *
 * @example
 * ```typescript
 * import { z } from 'zod';
 * import { createAsyncValidator } from '@outfitter/contracts';
 *
 * const validateUser = createAsyncValidator(
 *   z.object({
 *     email: z.string().email(),
 *   }).refine(
 *     async (data) => {
 *       // Async check
 *       return true;
 *     },
 *     { message: 'Validation failed' }
 *   )
 * );
 *
 * const result = await validateUser({ email: 'test@example.com' });
 * ```
 */
export const createAsyncValidator = <
  Output,
  Def extends z.ZodTypeDef = z.ZodTypeDef,
  Input = Output,
>(
  schema: z.ZodType<Output, Def, Input>,
): ((data: unknown) => Promise<Result<Output, ExtendedAppError>>) => {
  return async (data: unknown) => parseZodAsync(schema, data);
};
