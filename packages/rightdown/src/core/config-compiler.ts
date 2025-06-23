import { success, failure, makeError, type Result, type AppError } from '@outfitter/contracts';
import { RIGHTDOWN_ERROR_CODES } from './errors.js';
import { type RightdownConfig } from './types.js';
import { PRESETS } from './presets.js';

export interface MarkdownlintConfig {
  extends?: string;
  rules: Record<string, unknown>;
  customRules?: Array<string>;
  ignores?: Array<string>;
}

export interface PrettierConfig {
  printWidth?: number;
  tabWidth?: number;
  useTabs?: boolean;
  semi?: boolean;
  singleQuote?: boolean;
  quoteProps?: string;
  jsxSingleQuote?: boolean;
  trailingComma?: string;
  bracketSpacing?: boolean;
  arrowParens?: string;
  proseWrap?: string;
  endOfLine?: string;
  [key: string]: unknown;
}

export interface BiomeConfig {
  $schema?: string;
  formatter?: {
    enabled?: boolean;
    indentStyle?: 'tab' | 'space';
    indentWidth?: number;
    lineWidth?: number;
    formatWithErrors?: boolean;
  };
  javascript?: {
    formatter?: {
      quoteStyle?: 'single' | 'double';
      jsxQuoteStyle?: 'single' | 'double';
      semicolons?: 'always' | 'asNeeded';
      trailingComma?: 'all' | 'es5' | 'none';
      arrowParentheses?: 'always' | 'asNeeded';
    };
  };
}

export interface GeneratedConfigs {
  markdownlint: MarkdownlintConfig;
  prettier?: PrettierConfig;
  biome?: BiomeConfig;
}

/**
 * Compiles Rightdown config into tool-specific configurations
 */
export class ConfigCompiler {
  /**
   * Compile Rightdown config into tool-specific configs
   */
  compile(config: RightdownConfig): Result<GeneratedConfigs, AppError> {
    try {
      const configs: GeneratedConfigs = {
        markdownlint: this.generateMarkdownlintConfig(config),
      };

      // Generate formatter configs based on usage
      const usedFormatters = this.getUsedFormatters(config);

      if (usedFormatters.has('prettier')) {
        configs.prettier = this.generatePrettierConfig(config);
      }

      if (usedFormatters.has('biome')) {
        configs.biome = this.generateBiomeConfig(config);
      }

      return success(configs);
    } catch (error) {
      return failure(
        makeError(
          RIGHTDOWN_ERROR_CODES.INTERNAL_ERROR,
          'Failed to compile configuration',
          undefined,
          error as Error,
        ),
      );
    }
  }

  /**
   * Generate markdownlint configuration
   */
  generateMarkdownlintConfig(config: RightdownConfig): MarkdownlintConfig {
    const mdConfig: MarkdownlintConfig = {
      rules: {},
    };

    // Apply preset rules
    if (config.preset) {
      const preset = PRESETS[config.preset];
      if (preset && preset.rules) {
        mdConfig.rules = { ...preset.rules };
      }
    }

    // Apply custom rule overrides
    if (config.rules) {
      mdConfig.rules = { ...mdConfig.rules, ...config.rules };
    }

    // Add custom rules if terminology is defined
    if (config.terminology && config.terminology.length > 0) {
      mdConfig.customRules = ['consistent-terminology'];
      // Add terminology rule configuration
      mdConfig.rules['consistent-terminology'] = {
        terminology: config.terminology,
      };
    }

    // Add ignores
    if (config.ignores) {
      mdConfig.ignores = config.ignores;
    }

    return mdConfig;
  }

  /**
   * Generate Prettier configuration
   */
  generatePrettierConfig(config: RightdownConfig): PrettierConfig | undefined {
    const usedFormatters = this.getUsedFormatters(config);
    if (!usedFormatters.has('prettier')) {
      return undefined;
    }

    // Default Prettier configuration
    const prettierConfig: PrettierConfig = {
      printWidth: 80,
      tabWidth: 2,
      useTabs: false,
      semi: true,
      singleQuote: false,
      quoteProps: 'as-needed',
      jsxSingleQuote: false,
      trailingComma: 'all',
      bracketSpacing: true,
      arrowParens: 'always',
      proseWrap: 'preserve',
      endOfLine: 'lf',
    };

    // Apply custom options
    if (config.formatterOptions?.prettier) {
      Object.assign(prettierConfig, config.formatterOptions.prettier);
    }

    return prettierConfig;
  }

  /**
   * Generate Biome configuration
   */
  generateBiomeConfig(config: RightdownConfig): BiomeConfig | undefined {
    const usedFormatters = this.getUsedFormatters(config);
    if (!usedFormatters.has('biome')) {
      return undefined;
    }

    // Default Biome configuration
    const biomeConfig: BiomeConfig = {
      $schema: 'https://biomejs.dev/schemas/1.9.4/schema.json',
      formatter: {
        enabled: true,
        indentStyle: 'tab',
        indentWidth: 2,
        lineWidth: 80,
        formatWithErrors: false,
      },
      javascript: {
        formatter: {
          quoteStyle: 'double',
          jsxQuoteStyle: 'double',
          semicolons: 'always',
          trailingComma: 'all',
          arrowParentheses: 'always',
        },
      },
    };

    // Apply custom options
    if (config.formatterOptions?.biome) {
      const biomeOptions = config.formatterOptions.biome as Record<string, unknown>;

      // Handle top-level formatter options
      if (biomeOptions.indentStyle) {
        biomeConfig.formatter!.indentStyle = biomeOptions.indentStyle;
      }
      if (biomeOptions.indentWidth) {
        biomeConfig.formatter!.indentWidth = biomeOptions.indentWidth;
      }
      if (biomeOptions.lineWidth) {
        biomeConfig.formatter!.lineWidth = biomeOptions.lineWidth;
      }

      // Handle JavaScript formatter options
      if (biomeOptions.formatter) {
        const jsFormatter = biomeOptions.formatter as Record<string, unknown>;
        if (jsFormatter.quoteStyle) {
          biomeConfig.javascript!.formatter!.quoteStyle = jsFormatter.quoteStyle;
        }
        if (jsFormatter.semicolons) {
          biomeConfig.javascript!.formatter!.semicolons = jsFormatter.semicolons;
        }
        if (jsFormatter.trailingComma) {
          biomeConfig.javascript!.formatter!.trailingComma = jsFormatter.trailingComma;
        }
      }
    }

    return biomeConfig;
  }

  /**
   * Get set of formatters that are actually used
   */
  private getUsedFormatters(config: RightdownConfig): Set<string> {
    const formatters = new Set<string>();

    if (config.formatters) {
      // Add default formatter
      if (config.formatters.default) {
        formatters.add(config.formatters.default);
      }

      // Add language-specific formatters
      if (config.formatters.languages) {
        for (const formatter of Object.values(config.formatters.languages)) {
          if (formatter) {
            formatters.add(formatter);
          }
        }
      }
    }

    // Filter out unknown formatters
    const knownFormatters = new Set(['prettier', 'biome']);
    return new Set([...formatters].filter((f) => knownFormatters.has(f)));
  }
}
