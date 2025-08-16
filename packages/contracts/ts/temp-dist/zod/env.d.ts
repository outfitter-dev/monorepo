import { z } from 'zod';
import type { AppError, Result } from '../index.js';
/**
 * Validates and parses environment variables against a provided Zod schema.
 *
 * Returns a success result containing the parsed environment object if validation passes, or a failure result with detailed validation errors if validation fails.
 *
 * @returns A {@link Result} containing the parsed environment object or an {@link AppError} with validation details.
 */
export declare function createEnvSchema<T extends z.ZodRawShape>(
  schema: T,
  env?: NodeJS.ProcessEnv
): Result<z.infer<z.ZodObject<T>>, AppError>;
/**
 * Common environment variable schemas for reuse
 */
export declare const CommonEnvSchemas: {
  readonly NODE_ENV: z.ZodDefault<
    z.ZodEnum<['development', 'production', 'test']>
  >;
  readonly PORT: z.ZodDefault<z.ZodNumber>;
  readonly DATABASE_URL: z.ZodString;
  readonly API_KEY: z.ZodString;
  readonly JWT_SECRET: z.ZodString;
  readonly REDIS_URL: z.ZodOptional<z.ZodString>;
  readonly LOG_LEVEL: z.ZodDefault<
    z.ZodEnum<['debug', 'info', 'warn', 'error']>
  >;
  readonly CORS_ORIGIN: z.ZodOptional<z.ZodString>;
  readonly SESSION_SECRET: z.ZodOptional<z.ZodString>;
};
/**
 * Creates a type-safe environment schema for Next.js applications by combining common variables and Next.js-specific variables with any additional schema provided.
 *
 * @param additionalSchema - Additional Zod schema shape to extend the default environment schema.
 * @returns A {@link Result} containing the parsed environment object on success, or an {@link AppError} with validation details on failure.
 */
export declare function createNextEnvSchema<T extends z.ZodRawShape>(
  additionalSchema?: T
): Result<
  z.objectUtil.addQuestionMarks<
    z.baseObjectOutputType<
      {
        NODE_ENV: z.ZodDefault<
          z.ZodEnum<['development', 'production', 'test']>
        >;
        PORT: z.ZodDefault<z.ZodNumber>;
        NEXTAUTH_SECRET: z.ZodOptional<z.ZodString>;
        NEXTAUTH_URL: z.ZodOptional<z.ZodString>;
      } & T
    >,
    any
  > extends infer T_1
    ? { [k in keyof T_1]: T_1[k] }
    : never,
  AppError
>;
/**
 * Creates a type-safe environment schema for Node.js applications by combining common environment variable schemas with any additional schema provided.
 *
 * @param additionalSchema - Additional Zod schema shape to extend the default Node.js environment schema.
 * @returns A {@link Result} containing the parsed environment object on success, or an {@link AppError} with validation details on failure.
 */
export declare function createNodeEnvSchema<T extends z.ZodRawShape>(
  additionalSchema?: T
): Result<
  z.objectUtil.addQuestionMarks<
    z.baseObjectOutputType<
      {
        NODE_ENV: z.ZodDefault<
          z.ZodEnum<['development', 'production', 'test']>
        >;
        PORT: z.ZodDefault<z.ZodNumber>;
        LOG_LEVEL: z.ZodDefault<z.ZodEnum<['debug', 'info', 'warn', 'error']>>;
      } & T
    >,
    any
  > extends infer T_1
    ? { [k in keyof T_1]: T_1[k] }
    : never,
  AppError
>;
/**
 * Validates and parses a single environment variable using a Zod schema.
 *
 * If the variable is undefined and a {@link defaultValue} is provided, returns the default value as success. Otherwise, attempts to parse the variable using the provided schema.
 *
 * @param name - The name of the environment variable to retrieve and validate.
 * @param schema - The Zod schema to validate the variable against.
 * @param defaultValue - An optional default value to use if the variable is undefined.
 * @returns A {@link Result} containing the parsed value on success, or an {@link AppError} with validation or internal error details on failure.
 */
export declare function parseEnvVar<T>(
  name: string,
  schema: z.ZodSchema<T>,
  defaultValue?: T
): Result<T, AppError>;
/**
 * Validates that all specified environment variables are set and non-empty.
 *
 * @param variables - Names of environment variables to check.
 * @returns A success result containing a record of variable names to their values if all are present, or a failure result with a validation error listing missing variables.
 */
export declare function validateRequiredEnvVars(
  ...variables: Array<string>
): Result<Record<string, string>, AppError>;
//# sourceMappingURL=env.d.ts.map
