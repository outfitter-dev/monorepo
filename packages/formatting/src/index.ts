/**
 * @outfitter/formatting
 *
 * Lightweight formatting setup tool that orchestrates Prettier, Biome, and Remark configurations.
 * Detects available formatters and generates appropriate configuration files.
 */

// Export types
export type * from './types/index.js';

// Export core functionality
export { detectAvailableFormatters, detectFormatter } from './utils/detection.js';
export { getPreset, getAllPresets, standard, strict, relaxed } from './core/presets.js';
export {
  generateConfigs,
  generateFormatterConfig,
  generatePackageJsonScripts,
} from './core/generator.js';

// Export main setup function
export { setup } from './core/setup.js';
