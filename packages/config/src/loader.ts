/**
 * Universal configuration loader
 *
 * Provides a universal configuration loading system with:
 * - Multi-format support (TOML, JSONC, YAML)
 * - XDG Base Directory resolution
 * - Scope precedence (project → user → default)
 * - Schema validation with Zod
 *
 * @module loader
 */

import { createError, ERROR_CODES, err, type Result } from "@outfitter/contracts";
import type { z } from "zod";
import { loadJsonc } from "./loaders/jsonc.js";
import { loadToml } from "./loaders/toml.js";
import { loadYaml } from "./loaders/yaml.js";
import type { ConfigFormat, ConfigScope } from "./resolvers/index.js";
import { findConfigPath, resolvePaths } from "./resolvers/index.js";
import { type ValidationError, validateConfig } from "./schema-helpers.js";

/**
 * Options for loading configuration
 */
export interface LoadConfigOptions<T> {
  /** Zod schema to validate configuration against */
  readonly schema: z.ZodSchema<T>;
  /** Configuration scope (project, user, or default) */
  readonly scope?: ConfigScope;
  /** Formats to search for, in order of preference */
  readonly formats?: readonly ConfigFormat[];
  /** Configuration name (e.g., "outfitter") */
  readonly name?: string;
  /** Explicit search paths (overrides scope-based resolution) */
  readonly searchPaths?: readonly string[];
  /** Base directory for project scope (defaults to process.cwd()) */
  readonly cwd?: string;
  /** Whether to return error if no config file found (default: true) */
  readonly required?: boolean;
  /** Default values to merge with loaded config */
  readonly defaults?: Partial<T>;
}

/**
 * Load configuration file based on extension
 *
 * @param path - Absolute path to configuration file
 * @returns Result containing parsed data or error
 */
async function loadConfigFile(path: string): Promise<Result<unknown, Error>> {
  // Determine format from file extension
  const ext = path.split(".").pop()?.toLowerCase();

  switch (ext) {
    case "toml":
      return loadToml(path);
    case "yaml":
    case "yml":
      return loadYaml(path);
    case "jsonc":
    case "json":
      return loadJsonc(path);
    default:
      return err(new Error(`Unsupported config file format: ${ext}`));
  }
}

/**
 * Load and validate configuration
 *
 * Universal configuration loader that:
 * 1. Resolves config file paths based on scope and format preferences
 * 2. Loads the first existing config file
 * 3. Validates against provided Zod schema
 * 4. Merges with defaults if provided
 *
 * @param options - Configuration loading options
 * @returns Result containing validated configuration or error
 *
 * @example
 * ```typescript
 * import { z } from 'zod';
 * import { loadConfig } from '@outfitter/config';
 *
 * const schema = z.object({
 *   name: z.string(),
 *   port: z.number().default(3000),
 * });
 *
 * // Load from project scope with default formats
 * const result = await loadConfig({
 *   schema,
 *   name: 'myapp',
 *   scope: 'project',
 * });
 *
 * if (result.ok) {
 *   console.log('Config loaded:', result.value);
 * } else {
 *   console.error('Failed to load config:', result.error);
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Load with custom formats and defaults
 * const result = await loadConfig({
 *   schema,
 *   name: 'myapp',
 *   formats: ['toml', 'yaml'],
 *   defaults: { port: 8080, debug: false },
 *   required: false, // Don't error if no config file found
 * });
 * ```
 *
 * @example
 * ```typescript
 * // Load from explicit paths
 * const result = await loadConfig({
 *   schema,
 *   searchPaths: [
 *     '/custom/path/config.toml',
 *     '/another/path/config.yaml',
 *   ],
 * });
 * ```
 */
export async function loadConfig<T>(
  options: LoadConfigOptions<T>,
): Promise<Result<T, ValidationError>> {
  const {
    schema,
    scope,
    formats,
    name = "config",
    searchPaths,
    cwd,
    required = true,
    defaults,
  } = options;

  try {
    // Resolve possible config file paths
    const resolveOptions: {
      name: string;
      formats?: readonly ConfigFormat[];
      scope?: ConfigScope;
      searchPaths?: readonly string[];
      cwd?: string;
    } = { name };

    if (formats !== undefined) resolveOptions.formats = formats;
    if (scope !== undefined) resolveOptions.scope = scope;
    if (searchPaths !== undefined) resolveOptions.searchPaths = searchPaths;
    if (cwd !== undefined) resolveOptions.cwd = cwd;

    const paths = resolvePaths(resolveOptions);

    // Find first existing config file
    let configPath: string | undefined;
    for (const path of paths) {
      const file = Bun.file(path);
      const exists = await file.exists();
      if (exists) {
        configPath = path;
        break;
      }
    }

    // Handle case where no config file found
    if (!configPath) {
      if (required) {
        return err({
          ...createError(
            ERROR_CODES.CONFIG_NOT_FOUND,
            `No configuration file found. Searched paths: ${paths.join(", ")}`,
            {
              name: "ConfigNotFoundError",
            },
          ),
          issues: [],
        });
      }

      // If not required and we have defaults, use those
      if (defaults) {
        return validateConfig(schema, defaults, "Default config validation");
      }

      // Otherwise, validate empty object (schema should handle defaults)
      return validateConfig(schema, {}, "Empty config validation");
    }

    // Load config file
    const loadResult = await loadConfigFile(configPath);
    if (!loadResult.ok) {
      const baseError = createError(
        ERROR_CODES.CONFIG_PARSE_ERROR,
        `Failed to load config from ${configPath}: ${loadResult.error.message}`,
        {
          name: "ConfigLoadError",
          cause: loadResult.error,
        },
      );
      return err({
        ...baseError,
        issues: [],
      });
    }

    // Merge with defaults if provided
    const configData =
      defaults && typeof loadResult.value === "object" && loadResult.value !== null
        ? { ...defaults, ...loadResult.value }
        : loadResult.value;

    // Validate against schema
    const validationResult = validateConfig(
      schema,
      configData,
      `Config validation for ${configPath}`,
    );

    return validationResult;
  } catch (error) {
    const errorOptions: {
      name: string;
      cause?: Error;
    } = { name: "ConfigLoadError" };

    if (error instanceof Error) {
      errorOptions.cause = error;
    }

    const baseError = createError(
      ERROR_CODES.CONFIG_PARSE_ERROR,
      error instanceof Error ? error.message : "Unknown error loading configuration",
      errorOptions,
    );

    return err({
      ...baseError,
      issues: [],
    });
  }
}

/**
 * Load configuration file from specific path
 *
 * Simplified loader for loading config from a known path.
 *
 * @param path - Absolute path to configuration file
 * @param schema - Zod schema to validate against
 * @param defaults - Optional default values
 * @returns Result containing validated configuration or error
 *
 * @example
 * ```typescript
 * import { z } from 'zod';
 * import { loadConfigFrom } from '@outfitter/config';
 *
 * const schema = z.object({ name: z.string() });
 *
 * const result = await loadConfigFrom(
 *   '/path/to/config.toml',
 *   schema,
 * );
 * ```
 */
export async function loadConfigFrom<T>(
  path: string,
  schema: z.ZodSchema<T>,
  defaults?: Partial<T>,
): Promise<Result<T, ValidationError>> {
  if (defaults !== undefined) {
    return loadConfig({
      schema,
      searchPaths: [path],
      defaults,
    });
  }

  return loadConfig({
    schema,
    searchPaths: [path],
  });
}

/**
 * Find configuration file path
 *
 * Searches for config file without loading/validating it.
 * Useful for determining which config file would be used.
 *
 * @param options - Path resolution options
 * @returns Promise resolving to config path or undefined
 *
 * @example
 * ```typescript
 * import { findConfig } from '@outfitter/config';
 *
 * const path = await findConfig({
 *   name: 'outfitter',
 *   scope: 'project',
 * });
 *
 * if (path) {
 *   console.log('Config file found at:', path);
 * }
 * ```
 */
export async function findConfig(options: {
  readonly name: string;
  readonly scope?: ConfigScope;
  readonly formats?: readonly ConfigFormat[];
  readonly searchPaths?: readonly string[];
  readonly cwd?: string;
}): Promise<string | undefined> {
  return findConfigPath(options);
}

/**
 * Check if configuration file exists
 *
 * @param options - Path resolution options
 * @returns Promise resolving to true if config exists
 *
 * @example
 * ```typescript
 * import { configExists } from '@outfitter/config';
 *
 * const exists = await configExists({
 *   name: 'outfitter',
 *   scope: 'project',
 * });
 *
 * console.log('Config exists:', exists);
 * ```
 */
export async function configExists(options: {
  readonly name: string;
  readonly scope?: ConfigScope;
  readonly formats?: readonly ConfigFormat[];
  readonly searchPaths?: readonly string[];
  readonly cwd?: string;
}): Promise<boolean> {
  const path = await findConfigPath(options);
  return path !== undefined;
}

// Re-export types for convenience
export type { ConfigFormat, ConfigScope, ValidationError };
export type { Result } from "@outfitter/contracts";
