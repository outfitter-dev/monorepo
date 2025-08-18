import { z } from 'zod';

/**

- Schema for Flint initialization options
 */
export const InitOptionsSchema = z.object({
  yes: z.boolean().optional(),
  dryRun: z.boolean().optional(),
  keepExisting: z.boolean().optional(),
  noStylelint: z.boolean().optional(),
  noGitHooks: z.boolean().optional(),
  monorepo: z.boolean().optional(),
  keepPrettier: z.boolean().optional(),
});

/**

- Schema for package.json
 */
export const PackageJsonSchema = z
  .object({
    name: z.string().optional(),
    version: z.string().optional(),
    scripts: z.record(z.string()).optional(),
    dependencies: z.record(z.string()).optional(),
    devDependencies: z.record(z.string()).optional(),
    peerDependencies: z.record(z.string()).optional(),
  })
  .passthrough(); // Allow additional fields

/**

- Schema for Oxlint configuration
 */
export const OxlintConfigSchema = z
  .object({
    plugins: z.array(z.string()).optional(),
    env: z.record(z.boolean()).optional(),
    rules: z.record(z.unknown()).optional(),
    overrides: z
      .array(
        z.object({
          files: z.union([z.string(), z.array(z.string())]),
          rules: z.record(z.unknown()).optional(),
        })
      )
      .optional(),
  })
  .passthrough();

/**

- Schema for Prettier configuration
 */
export const PrettierConfigSchema = z
  .object({
    semi: z.boolean().optional(),
    singleQuote: z.boolean().optional(),
    tabWidth: z.number().optional(),
    trailingComma: z.enum(['none', 'es5', 'all']).optional(),
    printWidth: z.number().optional(),
    endOfLine: z.enum(['lf', 'crlf', 'cr', 'auto']).optional(),
    arrowParens: z.enum(['always', 'avoid']).optional(),
    proseWrap: z.enum(['always', 'never', 'preserve']).optional(),
    overrides: z
      .array(
        z.object({
          files: z.union([z.string(), z.array(z.string())]),
          options: z.record(z.unknown()).optional(),
        })
      )
      .optional(),
  })
  .passthrough();

/**

- Schema for VS Code settings.json
 */
export const VSCodeSettingsSchema = z.record(z.unknown());

/**

- Schema for VS Code extensions.json
 */
export const VSCodeExtensionsSchema = z
  .object({
    recommendations: z.array(z.string()).optional(),
    unwantedRecommendations: z.array(z.string()).optional(),
  })
  .passthrough();

/**

- Schema for commitlint configuration
 */
export const CommitlintConfigSchema = z
  .object({
    extends: z.array(z.string()).optional(),
    rules: z.record(z.unknown()).optional(),
    prompt: z.unknown().optional(),
  })
  .passthrough();

/**

- Schema for Stylelint configuration
 */
export const StylelintConfigSchema = z
  .object({
    extends: z.union([z.string(), z.array(z.string())]).optional(),
    plugins: z.array(z.string()).optional(),
    rules: z.record(z.unknown()).optional(),
    overrides: z
      .array(
        z.object({
          files: z.union([z.string(), z.array(z.string())]),
          customSyntax: z.string().optional(),
          rules: z.record(z.unknown()).optional(),
        })
      )
      .optional(),
  })
  .passthrough();

/**

- Schema for markdownlint-cli2 configuration
 */
export const MarkdownlintConfigSchema = z
  .object({
    config: z.record(z.unknown()).optional(),
    globs: z.array(z.string()).optional(),
    ignores: z.array(z.string()).optional(),
  })
  .passthrough();

/**

- Schema for Lefthook configuration
 */
export const LefthookConfigSchema = z.record(
  z.object({
    parallel: z.boolean().optional(),
    commands: z
      .record(
        z.object({
          glob: z.string().optional(),
          run: z.string(),
          skip: z
            .array(
              z.object({
                ref: z.string().optional(),
                branch: z.string().optional(),
              })
            )
            .optional(),
        })
      )
      .optional(),
  })
);

/**

- Validates configuration against schema with helpful error messages
 */
export function validateConfig<T>(
  config: unknown,
  schema: z.ZodSchema<T>,
  configName: string
): T {
  try {
    return schema.parse(config);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.issues
        .map((issue) => `- ${issue.path.join('.')}: ${issue.message}`)
        .join('\n');
      throw new Error(`Invalid ${configName} configuration:\n${issues}`);
    }
    throw error;
  }
}
