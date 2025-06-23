import { readFileSync, existsSync } from 'node:fs';
import { success, failure, makeError, type Result, type AppError } from '@outfitter/contracts';
import { RIGHTDOWN_ERROR_CODES } from './errors.js';
import { type RightdownConfig } from './types.js';
import { type IFormatter } from '../formatters/base.js';
import { AstProcessor } from '../processors/ast.js';
import { normalizeLanguage } from '../utils/language.js';

export interface OrchestratorOptions {
  config: RightdownConfig;
  formatters: Map<string, IFormatter>;
}

export interface FormatResult {
  content: string;
  stats: {
    blocksProcessed: number;
    blocksFormatted: number;
    formattingDuration: number;
  };
}

/**
 * Orchestrates the formatting process across multiple tools
 */
export class Orchestrator {
  private astProcessor: AstProcessor;

  constructor(private options: OrchestratorOptions) {
    this.astProcessor = new AstProcessor();
  }

  /**
   * Format markdown content
   */
  async format(markdown: string): Promise<Result<FormatResult, AppError>> {
    const startTime = performance.now();

    try {
      // Extract code blocks
      const extractResult = await this.astProcessor.extractCodeBlocks(markdown);
      if (!extractResult.success) {
        return extractResult;
      }

      const { codeBlocks } = extractResult.data;
      const stats = {
        blocksProcessed: codeBlocks.length,
        blocksFormatted: 0,
        formattingDuration: 0,
      };

      // Format each code block
      const replacements = new Map<number, string>();

      for (let i = 0; i < codeBlocks.length; i++) {
        const block = codeBlocks[i];
        const formatter = this.getFormatter(block.lang || 'text');

        if (!formatter) {
          continue;
        }

        // Get formatter name for options lookup
        const formatterName = this.getFormatterName(block.lang || 'text');
        const formatterOptions = formatterName ? this.getFormatterOptions(formatterName) : undefined;

        // Format the code
        const formatResult = await formatter.format(
          block.value,
          block.lang || 'text',
          formatterOptions,
        );

        if (formatResult.success) {
          if (formatResult.data.didChange) {
            replacements.set(i, formatResult.data.formatted);
            stats.blocksFormatted++;
          }
        } else {
          // Keep original content on error
          console.warn(
            `Failed to format ${block.lang} block at line ${block.position.start.line}: ${formatResult.error.message}`,
          );
        }
      }

      // Replace code blocks with formatted versions
      const replaceResult = await this.astProcessor.replaceCodeBlocks(markdown, replacements);
      if (!replaceResult.success) {
        return replaceResult;
      }

      stats.formattingDuration = Math.round(performance.now() - startTime);

      return success({
        content: replaceResult.data,
        stats,
      });
    } catch (error) {
      return failure(
        makeError(
          RIGHTDOWN_ERROR_CODES.INTERNAL_ERROR,
          'Failed to format markdown',
          undefined,
          error as Error,
        ),
      );
    }
  }

  /**
   * Format a file from disk
   */
  async formatFile(path: string): Promise<Result<FormatResult, AppError>> {
    if (!existsSync(path)) {
      return failure(makeError(RIGHTDOWN_ERROR_CODES.FILE_NOT_FOUND, `File not found: ${path}`));
    }

    try {
      const content = readFileSync(path, 'utf-8');
      return this.format(content);
    } catch (error) {
      return failure(
        makeError(RIGHTDOWN_ERROR_CODES.IO_ERROR, 'Failed to read file', { path }, error as Error),
      );
    }
  }

  /**
   * Get formatter for a specific language
   */
  getFormatter(language: string): IFormatter | null {
    const { config, formatters } = this.options;

    // Normalize language
    const normalizedLang = this.normalizeLanguage(language);

    // Check language-specific formatter
    if (config.formatters?.languages?.[normalizedLang]) {
      const formatterName = config.formatters.languages[normalizedLang];

      if (formatterName === 'none') {
        return null;
      }

      const formatter = formatters.get(formatterName);
      if (formatter) {
        return formatter;
      }
    }

    // Use default formatter
    if (config.formatters?.default) {
      const defaultFormatter = formatters.get(config.formatters.default);
      if (defaultFormatter) {
        return defaultFormatter;
      }
    }

    // No formatter available
    return null;
  }

  /**
   * Get formatter name for a specific language
   */
  private getFormatterName(language: string): string | null {
    const { config } = this.options;
    const normalizedLang = this.normalizeLanguage(language);

    // Check language-specific formatter
    if (config.formatters?.languages?.[normalizedLang]) {
      return config.formatters.languages[normalizedLang];
    }

    // Return default formatter name
    return config.formatters?.default || null;
  }

  /**
   * Get formatter options from config
   */
  private getFormatterOptions(formatterName: string): Record<string, unknown> | undefined {
    return this.options.config.formatterOptions?.[formatterName] as Record<string, unknown>;
  }

  /**
   * Normalize language identifier
   */
  private normalizeLanguage(language: string): string {
    return normalizeLanguage(language);
  }
}
