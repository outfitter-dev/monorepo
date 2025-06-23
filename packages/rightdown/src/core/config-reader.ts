import { readFileSync, existsSync } from 'node:fs';
import yaml from 'js-yaml';
import { success, failure, makeError, type Result, type AppError } from '@outfitter/contracts';
import { RIGHTDOWN_ERROR_CODES } from './errors.js';
import { type RightdownConfig } from './types.js';

export class ConfigReader {
  /**
   * Read and parse a Rightdown configuration file
   */
  async read(path: string): Promise<Result<RightdownConfig, AppError>> {
    try {
      // Check if file exists
      if (!existsSync(path)) {
        return failure(
          makeError(RIGHTDOWN_ERROR_CODES.FILE_NOT_FOUND, `Configuration file not found: ${path}`),
        );
      }

      // Read file contents
      const content = readFileSync(path, 'utf-8');

      // Parse YAML
      let config: unknown;
      try {
        config = yaml.load(content);
      } catch (error) {
        return failure(
          makeError(
            RIGHTDOWN_ERROR_CODES.INVALID_YAML,
            'Failed to parse YAML configuration',
            { path },
            error as Error,
          ),
        );
      }

      // Validate config
      return this.validateConfig(config);
    } catch (error) {
      return failure(
        makeError(
          RIGHTDOWN_ERROR_CODES.IO_ERROR,
          'Failed to read configuration file',
          { path },
          error as Error,
        ),
      );
    }
  }

  /**
   * Validate a configuration object
   */
  validateConfig(config: unknown): Result<RightdownConfig, AppError> {
    if (!config || typeof config !== 'object') {
      return failure(
        makeError(RIGHTDOWN_ERROR_CODES.INVALID_CONFIG, 'Configuration must be an object'),
      );
    }

    const configObj = config as Record<string, unknown>;

    // Check version
    if (configObj.version !== 2) {
      return failure(
        makeError(RIGHTDOWN_ERROR_CODES.UNSUPPORTED_VERSION, `Configuration must have version: 2`),
      );
    }

    // Validate preset if present
    if (configObj.preset !== undefined) {
      const validPresets = ['strict', 'standard', 'relaxed'];
      if (!validPresets.includes(configObj.preset as string)) {
        return failure(
          makeError(
            RIGHTDOWN_ERROR_CODES.INVALID_CONFIG,
            `Invalid preset: ${configObj.preset}. Must be one of: ${validPresets.join(', ')}`,
          ),
        );
      }
    }

    // Validate rules if present
    if (configObj.rules !== undefined && typeof configObj.rules !== 'object') {
      return failure(makeError(RIGHTDOWN_ERROR_CODES.INVALID_CONFIG, 'Rules must be an object'));
    }

    // Validate formatters if present
    if (configObj.formatters !== undefined) {
      const result = this.validateFormatters(configObj.formatters);
      if (!result.success) {
        return result;
      }
    }

    // Validate formatterOptions if present
    if (configObj.formatterOptions !== undefined) {
      if (typeof configObj.formatterOptions !== 'object' || configObj.formatterOptions === null) {
        return failure(
          makeError(RIGHTDOWN_ERROR_CODES.INVALID_CONFIG, 'formatterOptions must be an object'),
        );
      }
    }

    // Validate ignores if present
    if (configObj.ignores !== undefined) {
      if (!Array.isArray(configObj.ignores)) {
        return failure(makeError(RIGHTDOWN_ERROR_CODES.INVALID_CONFIG, 'Ignores must be an array'));
      }
      if (!configObj.ignores.every((item) => typeof item === 'string')) {
        return failure(
          makeError(RIGHTDOWN_ERROR_CODES.INVALID_CONFIG, 'All ignore patterns must be strings'),
        );
      }
    }

    // Validate terminology if present
    if (configObj.terminology !== undefined) {
      const result = this.validateTerminology(configObj.terminology);
      if (!result.success) {
        return result;
      }
    }

    // Validate output if present
    if (configObj.output !== undefined) {
      const result = this.validateOutput(configObj.output);
      if (!result.success) {
        return result;
      }
    }

    return success(configObj as RightdownConfig);
  }

  /**
   * Validate formatters configuration
   */
  private validateFormatters(formatters: unknown): Result<void, AppError> {
    if (typeof formatters !== 'object' || formatters === null) {
      return failure(
        makeError(RIGHTDOWN_ERROR_CODES.INVALID_CONFIG, 'formatters must be an object'),
      );
    }

    const formattersObj = formatters as Record<string, unknown>;

    // Validate default formatter if present
    if (formattersObj.default !== undefined && typeof formattersObj.default !== 'string') {
      return failure(
        makeError(RIGHTDOWN_ERROR_CODES.INVALID_CONFIG, 'formatters.default must be a string'),
      );
    }

    // Validate languages if present
    if (formattersObj.languages !== undefined) {
      if (typeof formattersObj.languages !== 'object' || formattersObj.languages === null) {
        return failure(
          makeError(RIGHTDOWN_ERROR_CODES.INVALID_CONFIG, 'formatters.languages must be an object'),
        );
      }

      const languages = formattersObj.languages as Record<string, unknown>;
      for (const [lang, formatter] of Object.entries(languages)) {
        if (typeof formatter !== 'string') {
          return failure(
            makeError(
              RIGHTDOWN_ERROR_CODES.INVALID_CONFIG,
              `formatters.languages.${lang} must be a string`,
            ),
          );
        }
      }
    }

    return success(undefined);
  }

  /**
   * Validate output configuration
   */
  private validateOutput(output: unknown): Result<void, AppError> {
    if (typeof output !== 'object' || output === null) {
      return failure(makeError(RIGHTDOWN_ERROR_CODES.INVALID_CONFIG, 'output must be an object'));
    }

    const outputObj = output as Record<string, unknown>;
    const booleanFields = ['diagnostics', 'progress', 'color'];

    for (const field of booleanFields) {
      if (outputObj[field] !== undefined && typeof outputObj[field] !== 'boolean') {
        return failure(
          makeError(RIGHTDOWN_ERROR_CODES.INVALID_CONFIG, `output.${field} must be a boolean`),
        );
      }
    }

    return success(undefined);
  }

  /**
   * Validate terminology configuration
   */
  private validateTerminology(terminology: unknown): Result<void, AppError> {
    if (!Array.isArray(terminology)) {
      return failure(
        makeError(RIGHTDOWN_ERROR_CODES.INVALID_CONFIG, 'terminology must be an array'),
      );
    }

    for (let i = 0; i < terminology.length; i++) {
      const term = terminology[i];
      if (typeof term !== 'object' || term === null) {
        return failure(
          makeError(RIGHTDOWN_ERROR_CODES.INVALID_CONFIG, `terminology[${i}] must be an object`),
        );
      }

      const termObj = term as Record<string, unknown>;

      if (typeof termObj.incorrect !== 'string') {
        return failure(
          makeError(
            RIGHTDOWN_ERROR_CODES.INVALID_CONFIG,
            `terminology[${i}].incorrect must be a string`,
          ),
        );
      }

      if (typeof termObj.correct !== 'string') {
        return failure(
          makeError(
            RIGHTDOWN_ERROR_CODES.INVALID_CONFIG,
            `terminology[${i}].correct must be a string`,
          ),
        );
      }

      if (termObj.caseSensitive !== undefined && typeof termObj.caseSensitive !== 'boolean') {
        return failure(
          makeError(
            RIGHTDOWN_ERROR_CODES.INVALID_CONFIG,
            `terminology[${i}].caseSensitive must be a boolean`,
          ),
        );
      }
    }

    return success(undefined);
  }
}
