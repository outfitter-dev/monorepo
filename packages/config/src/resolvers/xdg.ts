/**
 * XDG Base Directory resolver
 *
 * Implements XDG Base Directory Specification for config file resolution.
 * See: https://specifications.freedesktop.org/basedir-spec/latest/
 */

import { homedir } from "node:os";
import { join } from "node:path";

/**
 * Get XDG config home directory
 *
 * Returns the base directory for user-specific configuration files.
 * Defaults to ~/.config if XDG_CONFIG_HOME is not set.
 *
 * @returns Absolute path to XDG config home
 *
 * @example
 * ```typescript
 * const configHome = getXdgConfigHome();
 * console.log(configHome); // "/Users/username/.config" or "$XDG_CONFIG_HOME"
 * ```
 */
export function getXdgConfigHome(): string {
  return process.env["XDG_CONFIG_HOME"] ?? join(homedir(), ".config");
}

/**
 * Resolve XDG config path for a named config
 *
 * Creates path to config file following XDG Base Directory spec.
 * Format: $XDG_CONFIG_HOME/{name}/config.{ext}
 *
 * @param name - Configuration name (e.g., "outfitter")
 * @param extension - File extension (e.g., "toml", "yaml")
 * @returns Absolute path to XDG config file
 *
 * @example
 * ```typescript
 * const path = resolveXdgConfigPath('outfitter', 'toml');
 * console.log(path); // "/Users/username/.config/outfitter/config.toml"
 * ```
 */
export function resolveXdgConfigPath(name: string, extension: string): string {
  const configHome = getXdgConfigHome();
  return join(configHome, name, `config.${extension}`);
}

/**
 * Get all XDG config directories
 *
 * Returns array of directories to search for config files, in order of precedence.
 * Includes XDG_CONFIG_HOME and XDG_CONFIG_DIRS.
 *
 * @returns Array of absolute paths to config directories
 *
 * @example
 * ```typescript
 * const dirs = getXdgConfigDirs();
 * console.log(dirs); // ["/Users/username/.config", "/etc/xdg"]
 * ```
 */
export function getXdgConfigDirs(): string[] {
  const configHome = getXdgConfigHome();
  const configDirs = process.env["XDG_CONFIG_DIRS"]?.split(":").filter(Boolean) ?? ["/etc/xdg"];

  return [configHome, ...configDirs];
}

/**
 * Resolve all possible XDG config paths for a named config
 *
 * Returns all possible paths following XDG spec, in order of precedence.
 *
 * @param name - Configuration name
 * @param extension - File extension
 * @returns Array of absolute paths to check
 *
 * @example
 * ```typescript
 * const paths = resolveAllXdgConfigPaths('outfitter', 'toml');
 * console.log(paths);
 * // [
 * //   "/Users/username/.config/outfitter/config.toml",
 * //   "/etc/xdg/outfitter/config.toml"
 * // ]
 * ```
 */
export function resolveAllXdgConfigPaths(name: string, extension: string): string[] {
  const dirs = getXdgConfigDirs();
  return dirs.map((dir) => join(dir, name, `config.${extension}`));
}
