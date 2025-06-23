import type { Result, AppError } from '@outfitter/contracts';

/**
 * Result of a formatting operation
 */
export interface FormatterResult {
  /** The formatted code */
  formatted: string;
  /** Whether the code changed during formatting */
  didChange: boolean;
}

/**
 * Base formatter interface for code formatting integrations
 */
export interface IFormatter {
  /**
   * Name of the formatter (e.g., 'prettier', 'biome')
   */
  readonly name: string;

  /**
   * Check if the formatter is available (installed)
   */
  isAvailable(): Promise<Result<boolean, AppError>>;

  /**
   * Get version information
   */
  getVersion(): Promise<Result<string, AppError>>;

  /**
   * Format code with the given language
   */
  format(
    code: string,
    language: string,
    options?: Record<string, unknown>,
  ): Promise<Result<FormatterResult, AppError>>;

  /**
   * Get supported languages
   */
  getSupportedLanguages(): Array<string>;
}
