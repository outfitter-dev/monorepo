import {
  createError,
  ERROR_CODES,
  type ExtendedAppError,
  err,
  ok,
  type Result,
} from "@outfitter/contracts";
import { z } from "zod";
import { loadConfig } from "./loader.js";
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

export function mergeOutfitterConfig(input?: OutfitterConfigInput): OutfitterConfig {
  const normalized = input ?? {};

  const mergedFeatures: OutfitterFeatures = {
    ...FEATURE_DEFAULTS,
    ...(normalized.features ?? {}),
  } as OutfitterFeatures;

  // Build overrides object, excluding undefined fields
  const overridesInput = normalized.overrides ?? {};
  const overridesParts: Record<string, Record<string, unknown>> = {};
  if (overridesInput.biome !== undefined) {
    overridesParts["biome"] = overridesInput.biome;
  }
  if (overridesInput.prettier !== undefined) {
    overridesParts["prettier"] = overridesInput.prettier;
  }
  if (overridesInput.stylelint !== undefined) {
    overridesParts["stylelint"] = overridesInput.stylelint;
  }
  if (overridesInput.markdownlint !== undefined) {
    overridesParts["markdownlint"] = overridesInput.markdownlint;
  }
  if (overridesInput.lefthook !== undefined) {
    overridesParts["lefthook"] = overridesInput.lefthook;
  }

  // Build project object, excluding undefined fields
  const projectInput = normalized.project;
  const projectParts: Record<string, string> = {};
  if (projectInput !== undefined) {
    if (projectInput.type !== undefined) {
      projectParts["type"] = projectInput.type;
    }
    if (projectInput.framework !== undefined) {
      projectParts["framework"] = projectInput.framework;
    }
    if (projectInput.packageManager !== undefined) {
      projectParts["packageManager"] = projectInput.packageManager;
    }
    if (projectInput.rootDir !== undefined) {
      projectParts["rootDir"] = projectInput.rootDir;
    }
  }

  // Build the final config object with all required fields
  const result: {
    features: OutfitterFeatures;
    overrides: OutfitterOverrides;
    ignore: readonly string[];
    presets: readonly string[];
    $schema?: string;
    extends?: string | readonly string[];
    project?: OutfitterProject;
  } = {
    features: mergedFeatures,
    overrides: overridesParts as OutfitterOverrides,
    ignore: normalized.ignore ?? [],
    presets: normalized.presets ?? [],
  };

  // Add optional fields only if they exist
  if (normalized.$schema !== undefined) {
    result.$schema = normalized.$schema;
  }
  if (normalized.extends !== undefined) {
    result.extends = normalized.extends;
  }
  if (Object.keys(projectParts).length > 0) {
    result.project = projectParts as OutfitterProject;
  }

  return result as OutfitterConfig;
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

  if (error instanceof Error) {
    return createError(ERROR_CODES.CONFIG_PARSE_ERROR, error.message, {
      name: "OutfitterConfigParseError",
      cause: error,
    });
  }

  return createError(ERROR_CODES.CONFIG_PARSE_ERROR, "Unknown configuration error", {
    name: "OutfitterConfigParseError",
  });
}

export type {
  OutfitterConfigInput,
  OutfitterFeaturesInput,
  OutfitterOverridesInput,
  OutfitterProjectInput,
};

// Re-export universal loader APIs
export {
  configExists,
  findConfig,
  type LoadConfigOptions,
  loadConfig,
  loadConfigFrom,
} from "./loader.js";
export { loadJsonc, loadToml, loadYaml } from "./loaders/index.js";
export {
  type ConfigFormat,
  type ConfigScope,
  findConfigPath,
  getXdgConfigDirs,
  getXdgConfigHome,
  type ResolvePathsOptions,
  resolvePaths,
  resolveXdgConfigPath,
} from "./resolvers/index.js";
export {
  mergeAndValidate,
  safeParseConfig,
  type ValidationError,
  type ValidationIssue,
  validateConfig,
  validatePartialConfig,
} from "./schema-helpers.js";

/**
 * Load Outfitter configuration from filesystem with XDG resolution
 *
 * Searches for outfitter.config.{toml,jsonc,yaml} in:
 * 1. Project: ./outfitter.config.{ext}, ./.config/outfitter/config.{ext}
 * 2. User: ~/.config/outfitter/config.{ext}
 * 3. Falls back to defaults if not found
 *
 * @param options - Load options
 * @returns Result containing OutfitterConfig or error
 */
export async function loadOutfitterConfig(options?: {
  readonly cwd?: string;
  readonly required?: boolean;
}): Promise<OutfitterConfigParseResult> {
  const loadOptions: {
    schema: typeof OutfitterConfigSchema;
    name: string;
    scope: "project";
    formats: readonly ["toml", "jsonc", "yaml"];
    defaults: Partial<OutfitterConfigInput>;
    required: boolean;
    cwd?: string;
  } = {
    schema: OutfitterConfigSchema,
    name: "outfitter",
    scope: "project",
    formats: ["toml", "jsonc", "yaml"],
    defaults: DEFAULT_OUTFITTER_CONFIG as Partial<OutfitterConfigInput>,
    required: options?.required ?? false,
  };

  if (options?.cwd !== undefined) {
    loadOptions.cwd = options.cwd;
  }

  const result = await loadConfig(loadOptions);

  if (!result.ok) {
    // Convert ValidationError to ExtendedAppError
    const validationError = result.error;
    const messages = (validationError.issues ?? [])
      .map((issue) => {
        const path = Array.isArray(issue.path) ? issue.path.join(".") : String(issue.path);
        return path ? `${path}: ${issue.message}` : issue.message;
      })
      .join("; ");

    return err(
      createError(
        ERROR_CODES.CONFIG_VALIDATION_FAILED,
        messages || "Invalid Outfitter configuration",
        {
          name: "OutfitterConfigValidationError",
          cause: validationError,
        },
      ),
    );
  }

  return ok(mergeOutfitterConfig(result.value));
}

/**
 * Load Outfitter configuration from a specific path
 *
 * @param path - Path to configuration file
 * @returns Result containing OutfitterConfig or error
 */
export async function loadOutfitterConfigFrom(path: string): Promise<OutfitterConfigParseResult> {
  const result = await loadConfig({
    schema: OutfitterConfigSchema,
    searchPaths: [path],
    defaults: DEFAULT_OUTFITTER_CONFIG as Partial<OutfitterConfigInput>,
  });

  if (!result.ok) {
    const validationError = result.error;
    const messages = (validationError.issues ?? [])
      .map((issue) => {
        const path = Array.isArray(issue.path) ? issue.path.join(".") : String(issue.path);
        return path ? `${path}: ${issue.message}` : issue.message;
      })
      .join("; ");

    return err(
      createError(
        ERROR_CODES.CONFIG_VALIDATION_FAILED,
        messages || "Invalid Outfitter configuration",
        {
          name: "OutfitterConfigValidationError",
          cause: validationError,
        },
      ),
    );
  }

  return ok(mergeOutfitterConfig(result.value));
}
