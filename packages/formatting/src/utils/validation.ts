/**
 * Validation utilities using Zod schemas
 */

import { z } from 'zod';
import type { Result } from '@outfitter/contracts';
import { success, failure } from '@outfitter/contracts';
import {
  SetupOptionsSchema,
  CLISetupOptionsSchema,
  PresetNameSchema,
  FormatterTypeSchema,
  PackageJsonSchema,
  type SetupOptions,
} from '../schemas/index.js';

/**
 * Parse a value with a Zod schema and return a Result
 */
function parseResult<T>(schema: z.ZodSchema<T>, value: unknown): Result<T, z.ZodError> {
  const result = schema.safeParse(value);
  if (result.success) {
    return success(result.data);
  }
  return failure(result.error);
}

/**
 * Parse a value with a Zod schema asynchronously and return a Result
 */
async function parseAsync<T>(
  schema: z.ZodSchema<T>,
  value: unknown,
): Promise<Result<T, z.ZodError>> {
  try {
    const data = await schema.parseAsync(value);
    return success(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return failure(error);
    }
    throw error;
  }
}

/**
 * Validate setup options
 */
export function validateSetupOptions(options: unknown): Result<SetupOptions, z.ZodError> {
  return parseResult(SetupOptionsSchema, options);
}

/**
 * Validate CLI setup options and transform to setup options
 */
export function validateCLISetupOptions(options: unknown): Result<SetupOptions, z.ZodError> {
  // First validate CLI options
  const cliResult = parseResult(CLISetupOptionsSchema, options);
  if (!cliResult.success) {
    return cliResult;
  }

  const { data: cliOptions } = cliResult;

  // Transform CLI options to setup options
  const setupOptions: Partial<SetupOptions> = {
    ...(cliOptions.preset && { preset: validatePresetName(cliOptions.preset) }),
    ...(cliOptions.formatters && { formatters: validateFormatterTypes(cliOptions.formatters) }),
    ...(cliOptions.scripts !== undefined && { updateScripts: cliOptions.scripts }),
    installMissing: cliOptions.installMissing,
    dryRun: cliOptions.dryRun,
    verbose: cliOptions.verbose,
    targetDir: cliOptions.targetDir,
  };

  // Validate the transformed options
  return parseResult(SetupOptionsSchema, setupOptions);
}

/**
 * Validate preset name
 */
export function validatePresetName(name: string): SetupOptions['preset'] {
  const result = PresetNameSchema.safeParse(name);
  if (result.success) {
    return result.data;
  }
  // Log warning and default to standard if invalid
  console.warn(`Invalid preset name "${name}", falling back to "standard"`);
  return 'standard';
}

/**
 * Validate formatter types
 */
export function validateFormatterTypes(types: Array<string>): SetupOptions['formatters'] {
  const validTypes: SetupOptions['formatters'] = [];

  for (const type of types) {
    const result = FormatterTypeSchema.safeParse(type);
    if (result.success) {
      validTypes.push(result.data);
    }
  }

  return validTypes.length > 0 ? validTypes : undefined;
}

/**
 * Validate package.json content
 */
export async function validatePackageJson(
  content: string,
): Promise<Result<z.infer<typeof PackageJsonSchema>, z.ZodError>> {
  try {
    const parsed = JSON.parse(content);
    return await parseAsync(PackageJsonSchema, parsed);
  } catch (error) {
    // Create a ZodError for JSON parsing failure
    const zodError = new z.ZodError([
      {
        code: z.ZodIssueCode.custom,
        message: error instanceof Error ? error.message : 'Invalid JSON',
        path: [],
      },
    ]);
    return { success: false, error: zodError };
  }
}

/**
 * Create a safe version of a function that validates input
 */
export function createSafeFunction<TInput, TOutput>(
  schema: z.ZodSchema<TInput>,
  fn: (input: TInput) => TOutput | Promise<TOutput>,
): (input: unknown) => Promise<Result<TOutput, z.ZodError | Error>> {
  return async (input: unknown) => {
    const validationResult = parseResult(schema, input);
    if (!validationResult.success) {
      return validationResult;
    }

    try {
      const output = await fn(validationResult.data);
      return { success: true, data: output };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Unknown error'),
      };
    }
  };
}
