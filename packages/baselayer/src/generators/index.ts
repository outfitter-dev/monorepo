// Core configuration generators
export {
  generateBiomeConfig,
  generateBiomeConfigLegacy,
  installBiomeConfig,
} from './biome.js';
export { generateCommitlintConfig } from './commitlint.js';
export {
  generateEditorconfigConfig,
  generateEditorconfigContent,
} from './editorconfig.js';
export { generateLefthookConfig } from './lefthook.js';
export { generateMarkdownlintConfig } from './markdownlint.js';
export { generateOxlintConfig } from './oxlint.js';
export { updatePackageScripts } from './package-scripts.js';
export {
  generatePrettierConfig,
  generatePrettierConfigObject,
  generatePrettierIgnore,
} from './prettier.js';
export { generateStylelintConfig } from './stylelint.js';
export {
  generateProjectTurboConfig,
  generateTurboConfig,
  generateTurboConfigFile,
  type TurboConfig,
  type TurboPipeline,
} from './turborepo.js';
// Advanced generators
export {
  generateAllTypeScriptConfigs,
  generateProjectTypeScriptConfigs,
  generateTypeScriptConfig,
  generateTypeScriptConfigFile,
  type TypeScriptPreset,
} from './typescript.js';

export {
  generateTestSetup,
  generateVitestConfig,
  generateVitestConfigFiles,
} from './vitest.js';

// VSCode integration
export {
  enhanceVSCodeSettings,
  generateVSCodeExtensions,
  generateVSCodeSettings,
  hasVSCode,
  setupVSCode,
} from './vscode.js';
