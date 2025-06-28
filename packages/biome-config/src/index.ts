/**
 * @outfitter/biome-config
 *
 * Shared Biome configuration for the Outfitter monorepo.
 * Provides both static config and programmatic generation.
 */

// Base Biome configuration
const baseConfig = {
  $schema: '../../node_modules/@biomejs/biome/configuration_schema.json',
  formatter: {
    enabled: true,
    formatWithErrors: false,
    indentStyle: 'space',
    indentWidth: 2,
    lineEnding: 'lf',
    lineWidth: 100,
  },
  linter: {
    enabled: true,
    rules: {
      recommended: true,
      suspicious: {
        noExplicitAny: 'error',
        noConsole: 'warn',
        noArrayIndexKey: 'error',
      },
      style: {
        noParameterAssign: 'error',
        useConst: 'error',
      },
      complexity: {
        noBannedTypes: 'error',
        noUselessConstructor: 'error',
      },
      correctness: {
        noUnusedVariables: 'error',
      },
      performance: {
        noAccumulatingSpread: 'error',
        noDelete: 'error',
      },
      security: {
        noDangerouslySetInnerHtml: 'error',
      },
      nursery: {},
    },
  },
  javascript: {
    formatter: {
      jsxQuoteStyle: 'double',
      quoteProperties: 'asNeeded',
      quoteStyle: 'single',
      semicolons: 'always',
      trailingCommas: 'all',
      arrowParentheses: 'always',
    },
    parser: {
      unsafeParameterDecoratorsEnabled: true,
    },
  },
  json: {
    parser: {
      allowComments: true,
      allowTrailingCommas: true,
    },
  },
} as const;

export const config = baseConfig;

/**
 * Configuration options for generating Biome config
 */
export interface BiomeConfigOptions {
  /** Indentation settings */
  indentation?: {
    style: 'space' | 'tab';
    width: number;
  };
  /** Line width for formatting */
  lineWidth?: number;
  /** Quote style settings */
  quotes?: {
    style: 'single' | 'double';
    jsx: 'single' | 'double';
  };
  /** Semicolon usage */
  semicolons?: 'always' | 'asNeeded' | boolean;
  /** Trailing comma settings */
  trailingComma?: 'all' | 'es5' | 'none';
  /** Arrow parentheses */
  arrowParens?: 'always' | 'asNeeded';
}

/**
 * Generate a Biome configuration based on preset config
 */
export function generate(presetConfig: BiomeConfigOptions = {}) {
  const result = JSON.parse(JSON.stringify(baseConfig)); // Deep clone

  // Apply formatting settings
  if (presetConfig.indentation) {
    result.formatter.indentStyle = presetConfig.indentation.style;
    result.formatter.indentWidth = presetConfig.indentation.width;
  }

  if (presetConfig.lineWidth) {
    result.formatter.lineWidth = presetConfig.lineWidth;
  }

  // Apply JavaScript-specific settings
  if (presetConfig.quotes) {
    result.javascript.formatter.quoteStyle = presetConfig.quotes.style;
    result.javascript.formatter.jsxQuoteStyle = presetConfig.quotes.jsx;
  }

  if (presetConfig.semicolons !== undefined) {
    result.javascript.formatter.semicolons =
      presetConfig.semicolons === 'always' || presetConfig.semicolons === true
        ? 'always'
        : 'asNeeded';
  }

  if (presetConfig.trailingComma) {
    result.javascript.formatter.trailingCommas = presetConfig.trailingComma;
  }

  if (presetConfig.arrowParens) {
    result.javascript.formatter.arrowParentheses = presetConfig.arrowParens;
  }

  return result;
}

// Default export is the base config
export default config;
