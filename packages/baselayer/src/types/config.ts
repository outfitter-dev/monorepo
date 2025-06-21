import { z } from 'zod';

/**
 * Configuration schema for @outfitter/baselayer
 */

export type SupportedTool = 'biome' | 'eslint' | 'prettier' | 'rightdown';

export type FileType = 'typescript' | 'javascript' | 'json' | 'markdown' | 'css' | 'yaml';

export type StrictnessLevel = 'relaxed' | 'strict' | 'pedantic';

export type ProjectEnvironment =
  | 'typescript-library'
  | 'typescript-react'
  | 'typescript-node'
  | 'javascript-library'
  | 'javascript-react'
  | 'javascript-node'
  | 'monorepo';

export interface CodeStyle {
  /** Indentation width in spaces */
  indentWidth: number;
  /** Maximum line width */
  lineWidth: number;
  /** Quote style preference */
  quoteStyle: 'single' | 'double';
  /** Trailing commas preference */
  trailingCommas: 'none' | 'es5' | 'all';
  /** Semicolon preference */
  semicolons: 'always' | 'never';
}

export interface BaselayerConfig {
  /** Which tools handle which file types */
  tools: Partial<Record<FileType, SupportedTool>>;
  /** Feature toggles */
  features: {
    /** Include git hooks setup */
    gitHooks: boolean;
    /** Generate IDE configuration */
    vscode: boolean;
    /** Unified ignore patterns across tools */
    ignore: 'unified' | 'per-tool';
  };
}

export interface ToolOverrides {
  /** Biome-specific overrides using exact biome.json syntax */
  biome?: BiomeConfig;
  /** ESLint-specific overrides using exact ESLint config syntax */
  eslint?: ESLintConfig;
  /** Prettier-specific overrides using exact .prettierrc syntax */
  prettier?: PrettierConfig;
  /** rightdown-specific overrides */
  rightdown?: RightdownConfig;
}

// Tool-specific configuration types (simplified for now)
export interface BiomeConfig {
  formatter?: {
    enabled?: boolean;
    indentStyle?: 'tab' | 'space';
    indentWidth?: number;
    lineWidth?: number;
    [key: string]: unknown;
  };
  linter?: {
    enabled?: boolean;
    rules?: Record<string, unknown>;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface ESLintConfig {
  rules?: Record<string, unknown>;
  ignores?: Array<string>;
  [key: string]: unknown;
}

export interface PrettierConfig {
  printWidth?: number;
  tabWidth?: number;
  useTabs?: boolean;
  semi?: boolean;
  singleQuote?: boolean;
  trailingComma?: 'none' | 'es5' | 'all';
  overrides?: Array<{
    files: string | Array<string>;
    options: Partial<PrettierConfig>;
  }>;
  [key: string]: unknown;
}

export interface RightdownConfig {
  /** Base preset to extend from */
  preset?: 'standard' | 'strict' | 'relaxed';
  /** Custom terminology corrections */
  terminology?: Array<{
    incorrect: string;
    correct: string;
  }>;
  /** Additional custom rules to load */
  customRules?: Array<string>;
  /** Files and patterns to ignore */
  ignores?: Array<string>;
  /** Allow any other markdownlint rule configuration */
  [key: string]: unknown;
}

/**
 * Main configuration schema for .outfitter/config.jsonc
 */
export interface OutfitterConfig {
  /** Baselayer-specific configuration */
  baselayer: BaselayerConfig;
  /** High-level code style preferences */
  codeStyle: CodeStyle;
  /** Strictness level for linting rules */
  strictness: StrictnessLevel;
  /** Project environment for tool selection defaults */
  environment: ProjectEnvironment;
  /** Tool-specific overrides using exact tool syntax */
  overrides?: ToolOverrides;
}

export const OutfitterConfigSchema = z
  .object({
    baselayer: z
      .object({
        tools: z
          .object({
            typescript: z.enum(['biome', 'eslint']),
            javascript: z.enum(['biome', 'eslint']),
            json: z.enum(['biome', 'prettier']),
            markdown: z.enum(['rightdown', 'prettier']),
            css: z.literal('prettier'),
            yaml: z.literal('prettier'),
          })
          .partial(),
        features: z
          .object({
            gitHooks: z.boolean(),
            vscode: z.boolean(),
            ignore: z.enum(['unified', 'per-tool']),
          })
          .partial(),
      })
      .partial(),
    codeStyle: z
      .object({
        indentWidth: z.number().min(1).max(8),
        lineWidth: z.number().min(60).max(300),
        quoteStyle: z.enum(['single', 'double']),
        trailingCommas: z.enum(['none', 'es5', 'all']),
        semicolons: z.enum(['always', 'never']),
      })
      .partial(),
    strictness: z.enum(['relaxed', 'strict', 'pedantic']).optional(),
    environment: z
      .enum([
        'typescript-library',
        'typescript-react',
        'typescript-node',
        'javascript-library',
        'javascript-react',
        'javascript-node',
        'monorepo',
      ])
      .optional(),
    overrides: z
      .object({
        biome: z.record(z.unknown()),
        eslint: z.record(z.unknown()),
        prettier: z.record(z.unknown()),
        rightdown: z.record(z.unknown()),
      })
      .partial()
      .optional(),
  })
  .partial();

export type PartialOutfitterConfig = z.infer<typeof OutfitterConfigSchema>;

/**
 * Default configuration values
 */
export const DEFAULT_CONFIG: OutfitterConfig = {
  baselayer: {
    tools: {
      typescript: 'biome',
      javascript: 'biome',
      json: 'biome',
      markdown: 'rightdown',
      css: 'prettier',
      yaml: 'prettier',
    },
    features: {
      gitHooks: true,
      vscode: true,
      ignore: 'unified',
    },
  },
  codeStyle: {
    indentWidth: 2,
    lineWidth: 100,
    quoteStyle: 'single',
    trailingCommas: 'all',
    semicolons: 'always',
  },
  strictness: 'strict',
  environment: 'typescript-library',
};
