/**
 * Configuration path resolution
 *
 * Resolves configuration file paths with scope precedence and format support.
 */

import { join } from "node:path";
import { resolveAllXdgConfigPaths, resolveXdgConfigPath } from "./xdg.js";

/**
 * Configuration scope defines where to look for config files
 */
export type ConfigScope = "project" | "user" | "default";

/**
 * Supported configuration file formats
 */
export type ConfigFormat = "toml" | "jsonc" | "yaml" | "yml" | "json";

/**
 * Options for resolving config paths
 */
export interface ResolvePathsOptions {
  /** Configuration name (e.g., "outfitter") */
  readonly name: string;
  /** Formats to search for, in order of preference */
  readonly formats?: readonly ConfigFormat[];
  /** Scope to search (project, user, or default) */
  readonly scope?: ConfigScope;
  /** Explicit search paths (overrides scope-based resolution) */
  readonly searchPaths?: readonly string[];
  /** Base directory for project scope (defaults to process.cwd()) */
  readonly cwd?: string;
}

/**
 * Default format precedence: TOML → JSONC → YAML
 */
const DEFAULT_FORMATS: readonly ConfigFormat[] = ["toml", "jsonc", "yaml"];

/**
 * Normalize YAML extensions (yml → yaml)
 */
function normalizeFormat(format: ConfigFormat): ConfigFormat {
  return format === "yml" ? "yaml" : format;
}

/**
 * Resolve project-level config paths
 *
 * Searches in current working directory and .config subdirectory.
 * Patterns:
 * - ./{name}.config.{ext}
 * - ./.config/{name}/config.{ext}
 *
 * @param name - Configuration name
 * @param formats - Formats to search for
 * @param cwd - Base directory (defaults to process.cwd())
 * @returns Array of paths to check
 */
function resolveProjectPaths(
  name: string,
  formats: readonly ConfigFormat[],
  cwd: string,
): string[] {
  const paths: string[] = [];

  for (const format of formats) {
    const normalized = normalizeFormat(format);

    // Pattern: ./{name}.config.{ext}
    paths.push(join(cwd, `${name}.config.${normalized}`));

    // Pattern: ./.config/{name}/config.{ext}
    paths.push(join(cwd, ".config", name, `config.${normalized}`));
  }

  return paths;
}

/**
 * Resolve user-level config paths
 *
 * Uses XDG Base Directory specification.
 * Pattern: ~/.config/{name}/config.{ext}
 *
 * @param name - Configuration name
 * @param formats - Formats to search for
 * @returns Array of paths to check
 */
function resolveUserPaths(name: string, formats: readonly ConfigFormat[]): string[] {
  const paths: string[] = [];

  for (const format of formats) {
    const normalized = normalizeFormat(format);
    paths.push(resolveXdgConfigPath(name, normalized));

    // Also check all XDG config directories
    paths.push(...resolveAllXdgConfigPaths(name, normalized));
  }

  return paths;
}

/**
 * Resolve default config paths
 *
 * System-wide defaults in /etc.
 * Pattern: /etc/{name}/config.{ext}
 *
 * @param name - Configuration name
 * @param formats - Formats to search for
 * @returns Array of paths to check
 */
function resolveDefaultPaths(name: string, formats: readonly ConfigFormat[]): string[] {
  const paths: string[] = [];

  for (const format of formats) {
    const normalized = normalizeFormat(format);
    paths.push(join("/etc", name, `config.${normalized}`));
  }

  return paths;
}

/**
 * Resolve configuration file paths
 *
 * Returns array of paths to search for config files, in order of precedence.
 * Precedence: project → user → default (unless scope is specified)
 *
 * @param options - Resolution options
 * @returns Array of absolute paths to check
 *
 * @example
 * ```typescript
 * // Search all scopes with default formats
 * const paths = resolvePaths({ name: 'outfitter' });
 *
 * // Search only project scope
 * const projectPaths = resolvePaths({
 *   name: 'outfitter',
 *   scope: 'project',
 * });
 *
 * // Custom formats and explicit paths
 * const customPaths = resolvePaths({
 *   name: 'myapp',
 *   formats: ['yaml', 'json'],
 *   searchPaths: ['/custom/path/config.yaml'],
 * });
 * ```
 */
export function resolvePaths(options: ResolvePathsOptions): string[] {
  const { name, formats = DEFAULT_FORMATS, scope, searchPaths, cwd = process.cwd() } = options;

  // If explicit search paths provided, use those
  if (searchPaths && searchPaths.length > 0) {
    return [...searchPaths];
  }

  const paths: string[] = [];

  // Resolve based on scope
  if (!scope || scope === "project") {
    paths.push(...resolveProjectPaths(name, formats, cwd));
  }

  if (!scope || scope === "user") {
    paths.push(...resolveUserPaths(name, formats));
  }

  if (!scope || scope === "default") {
    paths.push(...resolveDefaultPaths(name, formats));
  }

  return paths;
}

/**
 * Find first existing config file
 *
 * Searches for config files in resolved paths and returns the first one that exists.
 *
 * @param options - Resolution options
 * @returns Promise resolving to first existing path, or undefined
 *
 * @example
 * ```typescript
 * const configPath = await findConfigPath({ name: 'outfitter' });
 * if (configPath) {
 *   console.log('Found config at:', configPath);
 * } else {
 *   console.log('No config file found');
 * }
 * ```
 */
export async function findConfigPath(options: ResolvePathsOptions): Promise<string | undefined> {
  const paths = resolvePaths(options);

  for (const path of paths) {
    const file = Bun.file(path);
    const exists = await file.exists();

    if (exists) {
      return path;
    }
  }

  return undefined;
}
