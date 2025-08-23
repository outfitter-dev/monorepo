// Core configuration generators
export { 
  generateBiomeConfig, 
  installBiomeConfig,
  generateBiomeConfigLegacy 
} from './biome.js';
export { generateCommitlintConfig } from './commitlint.js';
export { 
  generateEditorconfigConfig,
  generateEditorconfigContent 
} from './editorconfig.js';
export { generateLefthookConfig } from './lefthook.js';
export { generateMarkdownlintConfig } from './markdownlint.js';
export { generateOxlintConfig } from './oxlint.js';
export { updatePackageScripts } from './package-scripts.js';
export { 
  generatePrettierConfig,
  generatePrettierConfigObject,
  generatePrettierIgnore 
} from './prettier.js';
export { generateStylelintConfig } from './stylelint.js';

// Advanced generators
export {
  generateTypeScriptConfig,
  generateProjectTypeScriptConfigs,
  generateAllTypeScriptConfigs,
  generateTypeScriptConfigFile,
  type TypeScriptPreset
} from './typescript.js';


export {
  generateVitestConfig,
  generateTestSetup,
  generateVitestConfigFiles
} from './vitest.js';

// VSCode integration
export { 
  enhanceVSCodeSettings, 
  generateVSCodeSettings,
  generateVSCodeExtensions,
  hasVSCode, 
  setupVSCode 
} from './vscode.js';
