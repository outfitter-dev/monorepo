import { success, failure, makeError, type Result, type AppError } from '@outfitter/contracts';
import { RIGHTDOWN_ERROR_CODES } from '../core/errors.js';
import type { IFormatter, FormatterResult } from './base.js';

/**
 * Prettier formatter integration
 */
interface PrettierModule {
  format: (source: string, options: Record<string, unknown>) => Promise<string>;
  version?: string;
  default?: {
    format: (source: string, options: Record<string, unknown>) => Promise<string>;
    version?: string;
  };
}

export class PrettierFormatter implements IFormatter {
  readonly name = 'prettier';
  private prettierInstance: PrettierModule | null = null;
  private version: string | null = null;

  /**
   * Check if Prettier is available
   */
  async isAvailable(): Promise<Result<boolean, AppError>> {
    try {
      // Try to dynamically import Prettier (v3 is ESM-only)
      const prettier = await this.loadPrettier();
      return success(prettier !== null);
    } catch {
      return success(false);
    }
  }

  /**
   * Get Prettier version
   */
  async getVersion(): Promise<Result<string, AppError>> {
    try {
      const prettier = await this.loadPrettier();
      if (!prettier) {
        return failure(
          makeError(RIGHTDOWN_ERROR_CODES.FORMATTER_NOT_FOUND, 'Prettier is not installed'),
        );
      }

      // Get version from prettier itself
      this.version = prettier.version || 
                     prettier.default?.version || 
                     'unknown';

      return success(this.version);
    } catch (error) {
      return failure(
        makeError(
          RIGHTDOWN_ERROR_CODES.FORMATTER_NOT_FOUND,
          'Failed to get Prettier version',
          undefined,
          error as Error,
        ),
      );
    }
  }

  /**
   * Format code using Prettier
   */
  async format(
    code: string,
    language: string,
    options?: Record<string, unknown>,
  ): Promise<Result<FormatterResult, AppError>> {
    try {
      const prettier = await this.loadPrettier();
      if (!prettier) {
        return failure(
          makeError(RIGHTDOWN_ERROR_CODES.FORMATTER_NOT_FOUND, 'Prettier is not installed'),
        );
      }

      // Map language to Prettier parser
      const parser = this.getParserForLanguage(language);
      if (!parser) {
        return failure(
          makeError(RIGHTDOWN_ERROR_CODES.FORMATTER_FAILED, `Unsupported language: ${language}`),
        );
      }

      // Merge options with defaults
      const formatOptions = {
        parser,
        ...options,
      };

      // Format the code
      const formatted = await prettier.format(code, formatOptions);
      const didChange = formatted !== code;
      return success({ formatted, didChange });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Check for specific error types
      if (
        errorMessage.includes('Unexpected end of input') ||
        errorMessage.includes('SyntaxError') ||
        errorMessage.includes('Unexpected token')
      ) {
        return failure(
          makeError(
            RIGHTDOWN_ERROR_CODES.FORMATTER_FAILED,
            `Prettier: ${errorMessage}`,
            { language, parser: this.getParserForLanguage(language) },
            error as Error,
          ),
        );
      }

      // Check for ESM/Node.js version issues
      if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        error.code === 'ERR_REQUIRE_ESM'
      ) {
        return failure(
          makeError(
            RIGHTDOWN_ERROR_CODES.FORMATTER_FAILED,
            'Prettier v3+ requires Node.js 18.12.0 or higher with ESM support',
            undefined,
            error as Error,
          ),
        );
      }

      return failure(
        makeError(
          RIGHTDOWN_ERROR_CODES.FORMATTER_FAILED,
          'Failed to format code with Prettier',
          { language },
          error as Error,
        ),
      );
    }
  }

  /**
   * Get supported languages
   */
  getSupportedLanguages(): Array<string> {
    return [
      'javascript',
      'typescript',
      'jsx',
      'tsx',
      'json',
      'jsonc',
      'css',
      'scss',
      'less',
      'html',
      'markdown',
      'yaml',
      'graphql',
    ];
  }

  /**
   * Load Prettier dynamically
   */
  private async loadPrettier(): Promise<PrettierModule | null> {
    if (this.prettierInstance) {
      return this.prettierInstance;
    }

    try {
      // Try dynamic import (for Prettier v3+)
      this.prettierInstance = await import('prettier');
      return this.prettierInstance;
    } catch (error) {
      // Check if it's a module not found error
      if (error && typeof error === 'object' && 'code' in error) {
        if (error.code === 'MODULE_NOT_FOUND' || error.code === 'ERR_MODULE_NOT_FOUND') {
          return null;
        }
      }
      throw error;
    }
  }

  /**
   * Map language to Prettier parser
   */
  private getParserForLanguage(language: string): string | null {
    const parserMap: Record<string, string> = {
      javascript: 'babel',
      typescript: 'typescript',
      jsx: 'babel',
      tsx: 'typescript',
      json: 'json',
      jsonc: 'json',
      css: 'css',
      scss: 'scss',
      less: 'less',
      html: 'html',
      markdown: 'markdown',
      yaml: 'yaml',
      graphql: 'graphql',
    };

    return parserMap[language.toLowerCase()] || null;
  }
}
