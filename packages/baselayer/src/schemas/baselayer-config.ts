/**
 * Schema definitions for baselayer.jsonc configuration file
 */

import { z } from 'zod';

// Core feature flags
export const FeaturesSchema = z
  .object({
    typescript: z.boolean().default(true).describe('Enable TypeScript support'),
    markdown: z.boolean().default(true).describe('Enable Markdown linting'),
    styles: z.boolean().default(false).describe('Enable CSS/SCSS linting'),
    json: z.boolean().default(true).describe('Enable JSON formatting'),
    commits: z
      .boolean()
      .default(true)
      .describe('Enable commit message linting'),
    packages: z
      .boolean()
      .default(false)
      .describe('Enable package.json validation'),
    testing: z.boolean().default(false).describe('Enable testing setup'),
    docs: z
      .boolean()
      .default(false)
      .describe('Enable documentation generation'),
  })
  .describe('Feature flags for Baselayer tools');

// Tool-specific overrides
export const BiomeOverrideSchema = z
  .object({
    formatter: z.record(z.unknown()).optional(),
    linter: z.record(z.unknown()).optional(),
    organizeImports: z.record(z.unknown()).optional(),
  })
  .describe('Biome configuration overrides');

export const PrettierOverrideSchema = z
  .record(z.unknown())
  .describe('Prettier configuration overrides');

export const StylelintOverrideSchema = z
  .record(z.unknown())
  .describe('Stylelint configuration overrides');

export const MarkdownlintOverrideSchema = z
  .record(z.unknown())
  .describe('Markdownlint configuration overrides');

export const OverridesSchema = z
  .object({
    biome: BiomeOverrideSchema.optional(),
    prettier: PrettierOverrideSchema.optional(),
    stylelint: StylelintOverrideSchema.optional(),
    markdownlint: MarkdownlintOverrideSchema.optional(),
  })
  .describe('Tool-specific configuration overrides');

// Project context
export const ProjectContextSchema = z
  .object({
    type: z
      .enum(['monorepo', 'library', 'application'])
      .optional()
      .describe('Project type for context-aware configuration'),
    framework: z
      .enum(['react', 'vue', 'svelte', 'next', 'astro'])
      .optional()
      .describe('Primary framework being used'),
    packageManager: z
      .enum(['npm', 'yarn', 'pnpm', 'bun'])
      .optional()
      .describe('Package manager in use'),
    rootDir: z
      .string()
      .optional()
      .describe('Root directory for configuration files'),
  })
  .describe('Project context information');

// Main configuration schema
export const BaselayerConfigSchema = z
  .object({
    $schema: z.string().optional().describe('JSON Schema reference'),

    features: FeaturesSchema.default({
      typescript: true,
      markdown: true,
      styles: false,
      json: true,
      commits: true,
      packages: false,
      testing: false,
      docs: false,
    }).describe('Enable or disable specific features'),

    overrides: OverridesSchema.default({}).describe(
      'Tool-specific configuration overrides'
    ),

    project: ProjectContextSchema.optional().describe(
      'Project context for smarter defaults'
    ),

    ignore: z
      .array(z.string())
      .optional()
      .describe('Files and patterns to ignore across all tools'),

    extends: z
      .union([z.string(), z.array(z.string())])
      .optional()
      .describe('Extend from other configuration files or presets'),

    presets: z
      .array(z.string())
      .optional()
      .describe('Apply predefined configuration presets'),
  })
  .describe('Baselayer unified configuration');

// TypeScript types
export type FeaturesConfig = z.infer<typeof FeaturesSchema>;
export type BiomeOverride = z.infer<typeof BiomeOverrideSchema>;
export type PrettierOverride = z.infer<typeof PrettierOverrideSchema>;
export type StylelintOverride = z.infer<typeof StylelintOverrideSchema>;
export type MarkdownlintOverride = z.infer<typeof MarkdownlintOverrideSchema>;
export type OverridesConfig = z.infer<typeof OverridesSchema>;
export type ProjectContext = z.infer<typeof ProjectContextSchema>;
export type BaselayerConfig = z.infer<typeof BaselayerConfigSchema>;

// Validation function
export function validateBaselayerConfig(config: unknown): BaselayerConfig {
  return BaselayerConfigSchema.parse(config);
}

/**
 * Safe validation function that returns a Result instead of throwing
 */
export function safeValidateBaselayerConfig(
  config: unknown
):
  | { success: true; data: BaselayerConfig }
  | { success: false; error: z.ZodError } {
  const result = BaselayerConfigSchema.safeParse(config);

  if (result.success) {
    return { success: true, data: result.data };
  }

  return { success: false, error: result.error };
}

// JSON Schema export for baselayer.jsonc intellisense
export const BASELAYER_JSON_SCHEMA = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Baselayer Configuration',
  description: 'Configuration file for Baselayer development tooling',
  type: 'object',
  properties: {
    $schema: {
      type: 'string',
      description: 'JSON Schema reference',
    },
    features: {
      type: 'object',
      description: 'Feature flags for Baselayer tools',
      properties: {
        typescript: { type: 'boolean', default: true },
        markdown: { type: 'boolean', default: true },
        styles: { type: 'boolean', default: false },
        json: { type: 'boolean', default: true },
        commits: { type: 'boolean', default: true },
        packages: { type: 'boolean', default: false },
        testing: { type: 'boolean', default: false },
        docs: { type: 'boolean', default: false },
      },
    },
    project: {
      type: 'object',
      description: 'Project context information',
      properties: {
        type: { enum: ['monorepo', 'library', 'application'] },
        framework: { enum: ['react', 'vue', 'svelte', 'next', 'astro'] },
        packageManager: { enum: ['npm', 'yarn', 'pnpm', 'bun'] },
        rootDir: { type: 'string' },
      },
    },
  },
};
