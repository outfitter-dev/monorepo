import { z } from "zod";

/**
 * Feature toggles for Outfitter tooling.
 * Individual fields are optional when authoring configuration files, but
 * always filled with defaults once parsed.
 */
export const OutfitterFeaturesSchema = z
  .object({
    typescript: z.boolean().optional(),
    markdown: z.boolean().optional(),
    styles: z.boolean().optional(),
    json: z.boolean().optional(),
    commits: z.boolean().optional(),
    packages: z.boolean().optional(),
    testing: z.boolean().optional(),
    docs: z.boolean().optional(),
  })
  .strict();

/**
 * Overrides for specific tooling.
 */
export const OutfitterOverridesSchema = z
  .object({
    biome: z.record(z.unknown()).optional(),
    prettier: z.record(z.unknown()).optional(),
    stylelint: z.record(z.unknown()).optional(),
    markdownlint: z.record(z.unknown()).optional(),
    lefthook: z.record(z.unknown()).optional(),
  })
  .strict();

/**
 * Project context allows Outfitter to tailor defaults.
 */
export const OutfitterProjectSchema = z
  .object({
    type: z.enum(["monorepo", "library", "application"]).optional(),
    framework: z.enum(["react", "vue", "svelte", "next", "astro"]).optional(),
    packageManager: z.enum(["npm", "yarn", "pnpm", "bun"]).optional(),
    rootDir: z.string().optional(),
  })
  .strict();

/**
 * Outfitter configuration schema.
 * This schema is intentionally permissive so users can provide partial
 * configuration objects that will later be merged with defaults.
 */
export const OutfitterConfigSchema = z
  .object({
    $schema: z.string().optional(),
    features: OutfitterFeaturesSchema.optional(),
    overrides: OutfitterOverridesSchema.optional(),
    project: OutfitterProjectSchema.optional(),
    ignore: z.array(z.string()).optional(),
    extends: z.union([z.string(), z.array(z.string())]).optional(),
    presets: z.array(z.string()).optional(),
  })
  .strict();

export type OutfitterFeaturesInput = z.infer<typeof OutfitterFeaturesSchema>;
export type OutfitterOverridesInput = z.infer<typeof OutfitterOverridesSchema>;
export type OutfitterProjectInput = z.infer<typeof OutfitterProjectSchema>;
export type OutfitterConfigInput = z.infer<typeof OutfitterConfigSchema>;

/**
 * JSON Schema representation for IDE IntelliSense.
 */
export const OUTFITTER_JSON_SCHEMA = {
  $schema: "http://json-schema.org/draft-07/schema#",
  title: "Outfitter Configuration",
  description: "Configuration file for Outfitter tooling",
  type: "object",
  properties: {
    $schema: {
      type: "string",
      description: "JSON Schema reference",
    },
    features: {
      type: "object",
      description: "Feature flags for Outfitter tooling",
      properties: {
        typescript: { type: "boolean", default: true },
        markdown: { type: "boolean", default: true },
        styles: { type: "boolean", default: false },
        json: { type: "boolean", default: true },
        commits: { type: "boolean", default: true },
        packages: { type: "boolean", default: false },
        testing: { type: "boolean", default: false },
        docs: { type: "boolean", default: false },
      },
    },
    overrides: {
      type: "object",
      description: "Tool-specific configuration overrides",
      properties: {
        biome: { type: "object" },
        prettier: { type: "object" },
        stylelint: { type: "object" },
        markdownlint: { type: "object" },
        lefthook: { type: "object" },
      },
    },
    project: {
      type: "object",
      description: "Project context information",
      properties: {
        type: { enum: ["monorepo", "library", "application"] },
        framework: { enum: ["react", "vue", "svelte", "next", "astro"] },
        packageManager: { enum: ["npm", "yarn", "pnpm", "bun"] },
        rootDir: { type: "string" },
      },
    },
    ignore: {
      type: "array",
      description: "Global ignore patterns",
      items: { type: "string" },
    },
    extends: {
      description: "Extend from other configuration files or presets",
      anyOf: [{ type: "string" }, { type: "array", items: { type: "string" } }],
    },
    presets: {
      type: "array",
      description: "Apply predefined configuration presets",
      items: { type: "string" },
    },
  },
} as const;
