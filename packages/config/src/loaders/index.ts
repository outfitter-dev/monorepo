/**
 * Configuration format loaders
 *
 * Provides loaders for different configuration file formats:
 * - TOML (using Bun's native parser)
 * - YAML (using Bun.YAML)
 * - JSONC (using strip-json-comments)
 *
 * @module loaders
 */

export type { Result } from "@outfitter/contracts";
export { loadJsonc } from "./jsonc.js";
export { loadToml } from "./toml.js";
export { loadYaml } from "./yaml.js";
