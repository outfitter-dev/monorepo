import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  ErrorCode,
  failure,
  makeError,
  type Result,
  success,
} from '@outfitter/contracts';
import {
  type BaselayerConfig,
  safeValidateBaselayerConfig,
} from '../schemas/baselayer-config.js';
import type { FlintError } from '../types.js';

/**
 * Default configuration for Baselayer
 * Based on bun-monorepo template - single opinionated preset
 */
const DEFAULT_CONFIG: BaselayerConfig = {
  features: {
    typescript: true,
    markdown: true,
    styles: false, // Opt-in for CSS projects
    json: true,
    commits: true,
    packages: false, // Opt-in for libraries
    testing: false, // Opt-in
    docs: false, // Opt-in
  },
  overrides: {},
};

/**
 * Format Zod validation errors into user-friendly error details
 */
function formatValidationErrors(zodError: import('zod').ZodError) {
  return zodError.issues.map((issue) => {
    const path = issue.path.length > 0 ? issue.path.join('.') : 'root';

    // Create user-friendly error messages based on error type
    let friendlyMessage = issue.message;

    if (issue.code === 'invalid_type') {
      const received = 'received' in issue ? issue.received : 'unknown';
      const expected = 'expected' in issue ? issue.expected : 'unknown';
      friendlyMessage = `Expected ${expected} but received ${received}`;
    } else if (issue.code === 'invalid_enum_value') {
      const received = 'received' in issue ? issue.received : 'unknown';
      const options = 'options' in issue ? issue.options : [];
      friendlyMessage = `Invalid value "${received}". Valid options are: ${options.join(', ')}`;
    }

    return {
      path,
      message: friendlyMessage,
      code: issue.code,
      received: 'received' in issue ? issue.received : undefined,
      expected: 'expected' in issue ? issue.expected : undefined,
    };
  });
}

export class ConfigLoader {
  /**
   * Load configuration from baselayer.jsonc or use defaults
   * Supports JSONC format with comments and trailing commas
   */
  async loadConfig(
    cwd: string = process.cwd()
  ): Promise<Result<BaselayerConfig, FlintError>> {
    const configPaths = [
      'baselayer.jsonc',
      'baselayer.json',
      '.baselayerrc.jsonc',
      '.baselayerrc.json',
      // Legacy support
      'outfitter.config.js',
      'outfitter.config.mjs',
    ];

    for (const configPath of configPaths) {
      const fullPath = join(cwd, configPath);

      try {
        const configContent = readFileSync(fullPath, 'utf-8');

        let userConfig: unknown;

        // Handle JSONC/JSON files
        if (configPath.endsWith('.json') || configPath.endsWith('.jsonc')) {
          userConfig = this.parseJsonc(configContent);
        } else {
          // Legacy JS module support
          try {
            const configModule = await import(fullPath);
            userConfig = configModule.default || configModule;
          } catch (importError) {
            return failure(
              makeError(
                ErrorCode.VALIDATION_ERROR,
                `Failed to import configuration module ${configPath}`,
                {
                  configPath: fullPath,
                  importError: (importError as Error).message,
                },
                importError as Error
              )
            );
          }
        }

        // Validate configuration with Zod schema
        const validationResult = safeValidateBaselayerConfig(userConfig);

        if (!validationResult.success) {
          const formattedErrors = formatValidationErrors(
            validationResult.error
          );

          return failure(
            makeError(
              ErrorCode.SCHEMA_VALIDATION_FAILED,
              `Invalid configuration in ${configPath}: ${formattedErrors.length} validation error(s) found`,
              {
                configPath: fullPath,
                validationErrors: formattedErrors,
                errorSummary: formattedErrors
                  .map((err) => `${err.path}: ${err.message}`)
                  .join('; '),
              }
            )
          );
        }

        // Configuration is valid, merge with defaults
        const mergedConfig = this.mergeWithDefaults(validationResult.data);
        return success(mergedConfig);
      } catch (error) {
        // File doesn't exist, continue to next path
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
          continue;
        }

        // Invalid config file
        return failure(
          makeError(
            'CONFIG_INVALID',
            `Failed to load config from ${configPath}: ${(error as Error).message}`
          )
        );
      }
    }

    // No config file found, use defaults
    return success(DEFAULT_CONFIG);
  }

  /**
   * Parse JSONC content (JSON with comments and trailing commas)
   */
  private parseJsonc(content: string): unknown {
    // Simple JSONC parser - removes single line comments and trailing commas
    const cleaned = content
      // Remove single line comments
      .replace(/\/\/.*$/gm, '')
      // Remove multi-line comments
      .replace(/\/\*[\s\S]*?\*\//g, '')
      // Remove trailing commas before closing brackets/braces
      .replace(/,(\s*[}\]])/g, '$1');

    return JSON.parse(cleaned);
  }

  /**
   * Merge user configuration with defaults
   * Deep merge with user overrides taking precedence
   */
  private mergeWithDefaults(
    userConfig: Partial<BaselayerConfig>
  ): BaselayerConfig {
    return {
      ...DEFAULT_CONFIG,
      ...userConfig,
      features: {
        typescript:
          validatedConfig.features?.typescript ??
          DEFAULT_CONFIG.features?.typescript,
        markdown:
          validatedConfig.features?.markdown ??
          DEFAULT_CONFIG.features?.markdown,
        styles:
          validatedConfig.features?.styles ?? DEFAULT_CONFIG.features?.styles,
        json: validatedConfig.features?.json ?? DEFAULT_CONFIG.features?.json,
        commits:
          validatedConfig.features?.commits ?? DEFAULT_CONFIG.features?.commits,
        packages:
          validatedConfig.features?.packages ??
          DEFAULT_CONFIG.features?.packages,
        testing:
          validatedConfig.features?.testing ?? DEFAULT_CONFIG.features?.testing,
        docs: validatedConfig.features?.docs ?? DEFAULT_CONFIG.features?.docs,
      },
      overrides: {
        ...DEFAULT_CONFIG.overrides,
        ...userConfig.overrides,
      },
    };
  }

  /**
   * Get default configuration
   * Useful for migration tools and init commands
   */
  getDefaultConfig(): BaselayerConfig {
    return structuredClone(DEFAULT_CONFIG);
  }

  /**
   * Get tool-specific overrides from configuration
   */
  getToolOverrides<T = Record<string, unknown>>(
    config: BaselayerConfig,
    toolName: keyof NonNullable<BaselayerConfig['overrides']>
  ): T | undefined {
    return config.overrides?.[toolName] as T | undefined;
  }

  /**
   * Check if a feature is enabled in the configuration
   */
  isFeatureEnabled(
    config: BaselayerConfig,
    feature: keyof NonNullable<BaselayerConfig['features']>
  ): boolean {
    return config.features?.[feature] ?? false;
  }

  /**
   * Validate arbitrary configuration object against schema
   * Useful for testing and configuration validation in external tools
   */
  validateConfigurationObject(
    config: unknown
  ): Result<BaselayerConfig, FlintError> {
    const validationResult = safeValidateBaselayerConfig(config);

    if (!validationResult.success) {
      const formattedErrors = formatValidationErrors(validationResult.error);

      return failure(
        makeError(
          ErrorCode.SCHEMA_VALIDATION_FAILED,
          `Configuration validation failed: ${formattedErrors.length} error(s) found`,
          {
            validationErrors: formattedErrors,
            errorSummary: formattedErrors
              .map((err) => `${err.path}: ${err.message}`)
              .join('; '),
          }
        )
      );
    }

    return success(validationResult.data);
  }
}
