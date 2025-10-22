import {
  createError,
  ERROR_CODES,
  type ExtendedAppError,
  err,
  ok,
  type Result,
} from "@outfitter/contracts";
import { z } from "zod";
import {
  OUTFITTER_JSON_SCHEMA,
  type OutfitterConfigInput,
  OutfitterConfigSchema,
  type OutfitterFeaturesInput,
  OutfitterFeaturesSchema,
  type OutfitterOverridesInput,
  OutfitterOverridesSchema,
  type OutfitterProjectInput,
  OutfitterProjectSchema,
} from "./schema.js";

const FEATURE_DEFAULTS = Object.freeze({
  typescript: true,
  markdown: true,
  styles: false,
  json: true,
  commits: true,
  packages: false,
  testing: false,
  docs: false,
} as const);

const EMPTY_ARRAY: readonly string[] = Object.freeze([]);

export type OutfitterFeatures = Readonly<Record<keyof typeof FEATURE_DEFAULTS, boolean>>;

export type OutfitterOverrides = Readonly<{
  biome?: Record<string, unknown>;
  prettier?: Record<string, unknown>;
  stylelint?: Record<string, unknown>;
  markdownlint?: Record<string, unknown>;
  lefthook?: Record<string, unknown>;
}>;

export type OutfitterProject = Readonly<{
  type?: "monorepo" | "library" | "application";
  framework?: "react" | "vue" | "svelte" | "next" | "astro";
  packageManager?: "npm" | "yarn" | "pnpm" | "bun";
  rootDir?: string;
}>;

export type OutfitterConfig = Readonly<{
  $schema?: string;
  features: OutfitterFeatures;
  overrides: OutfitterOverrides;
  project?: OutfitterProject;
  ignore: readonly string[];
  extends?: string | readonly string[];
  presets: readonly string[];
}>;

export type OutfitterConfigParseResult = Result<OutfitterConfig, ExtendedAppError>;

export { OUTFITTER_JSON_SCHEMA };
export {
  OutfitterConfigSchema,
  OutfitterFeaturesSchema,
  OutfitterOverridesSchema,
  OutfitterProjectSchema,
};

export const DEFAULT_OUTFITTER_CONFIG: OutfitterConfig = Object.freeze({
  features: FEATURE_DEFAULTS,
  overrides: {},
  ignore: EMPTY_ARRAY,
  presets: EMPTY_ARRAY,
} as OutfitterConfig);

export function createDefaultOutfitterConfig(): OutfitterConfig {
  return {
    ...DEFAULT_OUTFITTER_CONFIG,
    features: { ...FEATURE_DEFAULTS },
    overrides: {},
    ignore: [],
    presets: [],
  };
}

export function mergeOutfitterConfig(config?: OutfitterConfigInput): OutfitterConfig {
  const normalized = config ?? {};

  const mergedFeatures: OutfitterFeatures = {
    ...FEATURE_DEFAULTS,
    ...(normalized.features ?? {}),
  } as OutfitterFeatures;

  return {
    $schema: normalized.$schema,
    features: mergedFeatures,
    overrides: { ...(normalized.overrides ?? {}) },
    project: normalized.project,
    ignore: normalized.ignore ?? [],
    extends: normalized.extends,
    presets: normalized.presets ?? [],
  };
}

export function parseOutfitterConfig(input: unknown): OutfitterConfig {
  const parsed = OutfitterConfigSchema.parse(input ?? {});
  return mergeOutfitterConfig(parsed);
}

export function safeParseOutfitterConfig(input: unknown): OutfitterConfigParseResult {
  try {
    const parsed = OutfitterConfigSchema.parse(input ?? {});
    return ok(mergeOutfitterConfig(parsed));
  } catch (error) {
    return err(createConfigError(error));
  }
}

function createConfigError(error: unknown): ExtendedAppError {
  if (error instanceof z.ZodError) {
    const messages = error.errors
      .map((issue) => {
        const path = issue.path.join(".");
        return path ? `${path}: ${issue.message}` : issue.message;
      })
      .join("; ");
    return createError(
      ERROR_CODES.CONFIG_VALIDATION_FAILED,
      messages || "Invalid Outfitter configuration",
      {
        name: "OutfitterConfigValidationError",
        cause: error,
      },
    );
  }

  return createError(
    ERROR_CODES.CONFIG_PARSE_ERROR,
    error instanceof Error ? error.message : "Unknown configuration error",
    {
      name: "OutfitterConfigParseError",
      cause: error instanceof Error ? error : undefined,
    },
  );
}

export type {
  OutfitterConfigInput,
  OutfitterFeaturesInput,
  OutfitterOverridesInput,
  OutfitterProjectInput,
};
