/**
 * Configuration path resolvers
 *
 * Provides path resolution for configuration files:
 * - XDG Base Directory support
 * - Project, user, and system scopes
 * - Multi-format support
 *
 * @module resolvers
 */

export type { ConfigFormat, ConfigScope, ResolvePathsOptions } from "./paths.js";
export { findConfigPath, resolvePaths } from "./paths.js";
export {
  getXdgConfigDirs,
  getXdgConfigHome,
  resolveAllXdgConfigPaths,
  resolveXdgConfigPath,
} from "./xdg.js";
