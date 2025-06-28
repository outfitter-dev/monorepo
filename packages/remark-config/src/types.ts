/**
 * Type definitions for remark configuration
 */

/**
 * Remark plugin configuration - can be a string or tuple with options
 */
export type RemarkPlugin = string | [string, ...any[]];

/**
 * Remark configuration object
 */
export interface RemarkConfig {
  /** List of remark plugins to use */
  plugins?: RemarkPlugin[];
  /** Settings for the unified processor */
  settings?: {
    /** Bullet character for lists */
    bullet?: '-' | '*' | '+';
    /** Emphasis marker */
    emphasis?: '*' | '_';
    /** Strong emphasis marker */
    strong?: '*' | '_';
    /** List item indentation */
    listItemIndent?: 'one' | 'tab' | 'mixed';
    /** Fenced code marker */
    fence?: '`' | '~';
    /** Rule marker */
    rule?: '-' | '*' | '_';
    /** Whether to use setext headings for h1 and h2 */
    setext?: boolean;
  };
}

/**
 * Configuration options for generating remark config
 */
export interface RemarkConfigOptions {
  /** Base preset to extend */
  preset?: 'standard' | 'strict' | 'relaxed';
  /** Additional plugins to include */
  additionalPlugins?: RemarkPlugin[];
  /** Override settings */
  settings?: RemarkConfig['settings'];
  /** Maximum line length for linting */
  maxLineLength?: number;
  /** Whether to enforce consistent terminology */
  enforceTerminology?: boolean;
}

/**
 * Function type for generating remark configurations
 */
export type RemarkConfigGenerator = (options?: RemarkConfigOptions) => RemarkConfig;
