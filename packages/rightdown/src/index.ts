// Main exports for programmatic usage

// Re-export markdownlint-cli2 for advanced usage
export { default as markdownlintCli2 } from 'markdownlint-cli2';
export {
  defaultTerminology,
  generateConfig,
  type MdlintConfig,
  type GeneratorOptions,
} from './config-generator.js';
export type { PresetName } from './presets/index.js';
export { getPresetConfig, presets } from './presets/index.js';

// Re-export path utilities
export { customRulePaths } from './utils/paths.js';
