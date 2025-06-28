/**
 * Zod schemas for validation
 */

import { z } from 'zod';

/**
 * Formatter types enum
 */
export const FormatterTypeSchema = z.enum(['prettier', 'biome', 'remark', 'eslint']);
export type FormatterType = z.infer<typeof FormatterTypeSchema>;

/**
 * Formatter detection location
 */
export const FormatterLocationSchema = z.enum(['local', 'global', 'system']);
export type FormatterLocation = z.infer<typeof FormatterLocationSchema>;

/**
 * Detection result for a specific formatter
 */
export const FormatterDetectionSchema = z.object({
  type: FormatterTypeSchema,
  available: z.boolean(),
  version: z.string().optional(),
  location: FormatterLocationSchema.optional(),
  path: z.string().optional(),
  error: z.string().optional(),
});
export type FormatterDetection = z.infer<typeof FormatterDetectionSchema>;

/**
 * Result of detecting all formatters
 */
export const FormatterDetectionResultSchema = z.object({
  formatters: z.array(FormatterDetectionSchema),
  available: z.array(FormatterTypeSchema),
  missing: z.array(FormatterTypeSchema),
});
export type FormatterDetectionResult = z.infer<typeof FormatterDetectionResultSchema>;

/**
 * Preset names
 */
export const PresetNameSchema = z.enum(['standard', 'strict', 'relaxed']);
export type PresetName = z.infer<typeof PresetNameSchema>;

/**
 * Indentation style
 */
export const IndentationStyleSchema = z.enum(['space', 'tab']);
export type IndentationStyle = z.infer<typeof IndentationStyleSchema>;

/**
 * Quote style
 */
export const QuoteStyleSchema = z.enum(['single', 'double']);
export type QuoteStyle = z.infer<typeof QuoteStyleSchema>;

/**
 * Semicolon usage
 */
export const SemicolonStyleSchema = z.enum(['always', 'asNeeded']);
export type SemicolonStyle = z.infer<typeof SemicolonStyleSchema>;

/**
 * Trailing comma style
 */
export const TrailingCommaStyleSchema = z.enum(['all', 'es5', 'none']);
export type TrailingCommaStyle = z.infer<typeof TrailingCommaStyleSchema>;

/**
 * Arrow parentheses style
 */
export const ArrowParensStyleSchema = z.enum(['always', 'asNeeded']);
export type ArrowParensStyle = z.infer<typeof ArrowParensStyleSchema>;

/**
 * End of line style
 */
export const EndOfLineStyleSchema = z.enum(['lf', 'crlf', 'cr', 'auto']);
export type EndOfLineStyle = z.infer<typeof EndOfLineStyleSchema>;

/**
 * Configuration preset options
 */
export const PresetConfigSchema = z.object({
  name: PresetNameSchema,
  lineWidth: z.number().int().min(40).max(200),
  indentation: z.object({
    style: IndentationStyleSchema,
    width: z.number().int().min(1).max(8),
  }),
  quotes: z.object({
    style: QuoteStyleSchema,
    jsx: QuoteStyleSchema,
  }),
  semicolons: SemicolonStyleSchema,
  trailingComma: TrailingCommaStyleSchema,
  bracketSpacing: z.boolean(),
  arrowParens: ArrowParensStyleSchema,
  endOfLine: EndOfLineStyleSchema,
});
export type PresetConfig = z.infer<typeof PresetConfigSchema>;

/**
 * Setup options for the formatting tool
 */
export const SetupOptionsSchema = z.object({
  preset: z.union([PresetNameSchema, z.string()]).optional().default('standard'),
  presetConfig: PresetConfigSchema.partial().optional(),
  formatters: z.array(FormatterTypeSchema).optional(),
  installMissing: z.boolean().optional().default(false),
  updateScripts: z.boolean().optional().default(true),
  targetDir: z.string().optional().default(process.cwd()),
  dryRun: z.boolean().optional().default(false),
  verbose: z.boolean().optional().default(false),
  devcontainer: z.boolean().optional().default(false),
});
export type SetupOptions = z.infer<typeof SetupOptionsSchema>;

/**
 * Generated configuration file
 */
export const GeneratedConfigSchema = z.object({
  path: z.string(),
  content: z.string(),
  formatter: FormatterTypeSchema,
  generated: z.boolean(),
});
export type GeneratedConfig = z.infer<typeof GeneratedConfigSchema>;

/**
 * Setup operation result
 */
export const SetupResultSchema = z.object({
  success: z.boolean(),
  configs: z.array(GeneratedConfigSchema),
  scripts: z.record(z.string()),
  errors: z.array(z.string()),
  warnings: z.array(z.string()),
  info: z.array(z.string()),
});
export type SetupResult = z.infer<typeof SetupResultSchema>;

/**
 * CLI setup command options
 */
export const CLISetupOptionsSchema = z.object({
  preset: z.string().optional(),
  formatters: z.array(z.string()).optional(),
  scripts: z.boolean().optional(),
  installMissing: z.boolean().optional(),
  dryRun: z.boolean().optional(),
  verbose: z.boolean().optional(),
  targetDir: z.string().optional(),
});
export type CLISetupOptions = z.infer<typeof CLISetupOptionsSchema>;

/**
 * Package.json structure (partial)
 */
export const PackageJsonSchema = z
  .object({
    name: z.string().optional(),
    version: z.string().optional(),
    scripts: z.record(z.string()).optional(),
  })
  .passthrough();
export type PackageJson = z.infer<typeof PackageJsonSchema>;
