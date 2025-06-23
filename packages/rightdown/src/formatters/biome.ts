import { success, failure, makeError, type Result, type AppError } from '@outfitter/contracts';
import { RIGHTDOWN_ERROR_CODES } from '../core/errors.js';
import type { IFormatter, FormatterResult } from './base.js';

/**
 * Type definitions for Biome
 */
interface BiomeDiagnostic {
  category?: string;
  severity?: string;
  message?: string;
}

interface BiomeFormatResult {
  content: string;
  diagnostics?: Array<BiomeDiagnostic>;
}

interface BiomeInstance {
  formatContent(code: string, options: { filePath: string }): Promise<BiomeFormatResult>;
  applyConfiguration(config: BiomeConfig): Promise<void>;
  shutdown(): Promise<void>;
}

interface BiomeConfig {
  formatter: {
    enabled: boolean;
    indentStyle?: string;
    indentWidth?: number;
    lineWidth?: number;
  };
  javascript?: {
    formatter?: {
      semicolons?: string;
      quoteStyle?: string;
    };
  };
}

interface BiomeModule {
  Biome: {
    create(options: { distribution?: unknown }): Promise<BiomeInstance>;
  };
  Distribution?: {
    NODE: unknown;
  };
}

/**
 * Biome formatter integration
 */
export class BiomeFormatter implements IFormatter {
  readonly name = 'biome';
  private biomeInstance: BiomeInstance | null = null;
  private version: string | null = null;

  /**
   * Check if Biome is available
   */
  async isAvailable(): Promise<Result<boolean, AppError>> {
    try {
      const biome = await this.loadBiome();
      return success(biome !== null);
    } catch {
      return success(false);
    }
  }

  /**
   * Get Biome version
   */
  async getVersion(): Promise<Result<string, AppError>> {
    try {
      const biome = await this.loadBiome();
      if (!biome) {
        return failure(
          makeError(RIGHTDOWN_ERROR_CODES.FORMATTER_NOT_FOUND, 'Biome is not installed'),
        );
      }

      // Try to get version from the Biome package
      try {
        const pkg = await import('@biomejs/biome/package.json', { assert: { type: 'json' } });
        this.version = pkg.default.version || 'unknown';
      } catch {
        // If we can't read package.json, return unknown
        this.version = 'unknown';
      }

      return success(this.version);
    } catch (error) {
      return failure(
        makeError(
          RIGHTDOWN_ERROR_CODES.FORMATTER_NOT_FOUND,
          'Failed to get Biome version',
          undefined,
          error as Error,
        ),
      );
    }
  }

  /**
   * Format code using Biome
   */
  async format(
    code: string,
    language: string,
    options?: Record<string, unknown>,
  ): Promise<Result<FormatterResult, AppError>> {
    try {
      // Check if language is supported
      if (!this.getSupportedLanguages().includes(language)) {
        return failure(
          makeError(RIGHTDOWN_ERROR_CODES.FORMATTER_FAILED, `Unsupported language: ${language}`),
        );
      }

      // Get or create Biome instance
      const biome = await this.getBiomeInstance();
      if (!biome) {
        return failure(
          makeError(RIGHTDOWN_ERROR_CODES.FORMATTER_NOT_FOUND, 'Biome is not installed'),
        );
      }

      // Map language to Biome file type
      const filePath = this.getFilePathForLanguage(language);

      // Apply configuration if provided
      if (options) {
        const config = this.buildBiomeConfig(options);
        await biome.applyConfiguration(config);
      }

      // Format the code
      const result = await biome.formatContent(code, {
        filePath,
      });

      if (result.diagnostics && result.diagnostics.length > 0) {
        // Check for syntax errors
        const syntaxError = result.diagnostics.find(
          (d: BiomeDiagnostic) => d.category === 'parse' || d.severity === 'error',
        );

        if (syntaxError) {
          return failure(
            makeError(
              RIGHTDOWN_ERROR_CODES.FORMATTER_FAILED,
              `Biome: Syntax error - ${syntaxError.message || 'Invalid syntax'}`,
              { language, filePath },
            ),
          );
        }
      }

      return success({
        formatted: result.content,
        didChange: code !== result.content,
      });
    } catch (error) {
      return failure(
        makeError(
          RIGHTDOWN_ERROR_CODES.FORMATTER_FAILED,
          'Failed to format code with Biome',
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
    return ['javascript', 'typescript', 'jsx', 'tsx', 'json', 'jsonc'];
  }

  /**
   * Clean up Biome instance
   */
  async shutdown(): Promise<void> {
    if (this.biomeInstance) {
      try {
        await this.biomeInstance.shutdown();
      } catch {
        // Ignore shutdown errors
      }
      this.biomeInstance = null;
    }
  }

  /**
   * Load Biome dynamically
   */
  private async loadBiome(): Promise<BiomeModule | null> {
    try {
      const biomeModule = await import('@biomejs/biome') as BiomeModule;
      return biomeModule;
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
   * Get or create Biome instance
   */
  private async getBiomeInstance(): Promise<BiomeInstance | null> {
    if (this.biomeInstance) {
      return this.biomeInstance;
    }

    const Biome = await this.loadBiome();
    if (!Biome) {
      return null;
    }

    try {
      this.biomeInstance = await Biome.Biome.create({
        // Use distribution from node_modules
        distribution: await this.findBiomeDistribution(),
      });
      return this.biomeInstance;
    } catch (error) {
      throw new Error(`Failed to create Biome instance: ${error}`);
    }
  }

  /**
   * Find Biome distribution path
   */
  private async findBiomeDistribution(): Promise<unknown> {
    try {
      const { Distribution } = await import('@biomejs/biome');
      return Distribution.NODE;
    } catch {
      // Return default if we can't import Distribution
      return undefined;
    }
  }

  /**
   * Map language to file path for Biome
   */
  private getFilePathForLanguage(language: string): string {
    const extensionMap: Record<string, string> = {
      javascript: 'file.js',
      typescript: 'file.ts',
      jsx: 'file.jsx',
      tsx: 'file.tsx',
      json: 'file.json',
      jsonc: 'file.jsonc',
    };

    return extensionMap[language.toLowerCase()] || 'file.js';
  }

  /**
   * Build Biome configuration from options
   */
  private buildBiomeConfig(options: Record<string, unknown>): BiomeConfig {
    const config: BiomeConfig = {
      formatter: {
        enabled: true,
      },
    };

    // Map common options to Biome config
    if (options.indentStyle) {
      config.formatter.indentStyle = options.indentStyle;
    }

    if (options.indentWidth) {
      config.formatter.indentWidth = options.indentWidth;
    }

    if (options.lineWidth) {
      config.formatter.lineWidth = options.lineWidth;
    }

    // JavaScript/TypeScript specific options
    if (options.semicolons) {
      config.javascript = config.javascript || {};
      config.javascript.formatter = config.javascript.formatter || {};
      config.javascript.formatter.semicolons = options.semicolons;
    }

    if (options.quoteStyle) {
      config.javascript = config.javascript || {};
      config.javascript.formatter = config.javascript.formatter || {};
      config.javascript.formatter.quoteStyle = options.quoteStyle;
    }

    return config;
  }
}
