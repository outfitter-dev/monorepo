import { execSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { checkbox, confirm, input } from '@inquirer/prompts';
import {
  failure,
  isFailure,
  isSuccess,
  makeError,
  type Result,
  success,
} from '@outfitter/contracts';
import { createBackup } from '../core/backup.js';
import { removeOldConfigs } from '../core/cleanup.js';
import { cleanupDependencies } from '../core/dependency-cleanup.js';
import { type DetectedTools, detectExistingTools } from '../core/detector.js';
import { installDependencies } from '../core/installer.js';
import { generateBiomeConfig } from '../generators/biome.js';
import { generateCommitlintConfig } from '../generators/commitlint.js';
import { generateEditorconfigConfig } from '../generators/editorconfig.js';
import { updatePackageScripts } from '../generators/index.js';
import { generateLefthookConfig } from '../generators/lefthook.js';
import { generateMarkdownlintConfig } from '../generators/markdownlint.js';
import { generateOxlintConfig } from '../generators/oxlint.js';
import { generatePrettierConfig } from '../generators/prettier.js';
import { generateStylelintConfig } from '../generators/stylelint.js';
import { setupVSCode } from '../generators/vscode.js';
import type { InitOptions, OutfitterConfig } from '../types.js';
import { writeFile } from '../utils/file-system.js';

interface ProjectDetection {
  hasTypeScript: boolean;
  hasReact: boolean;
  hasNext: boolean;
  hasVue: boolean;
  hasMarkdownFiles: boolean;
  hasCSSFiles: boolean;
  hasPackageScripts: boolean;
  isMonorepo: boolean;
  framework?: 'react' | 'next' | 'vue' | 'svelte' | 'angular';
  packageManager: 'npm' | 'yarn' | 'pnpm' | 'bun';
}

interface FeatureChoice {
  name: string;
  value: string;
  description: string;
  checked?: boolean;
  disabled?: boolean | string;
}

interface InitContext {
  projectRoot: string;
  packageJson: Record<string, unknown>;
  detectedTools: DetectedTools;
  detection: ProjectDetection;
  selectedFeatures: Set<string>;
  config: OutfitterConfig;
}

/**
 * Initialize baselayer with interactive smart picker
 */
export async function init(options: InitOptions): Promise<Result<void, Error>> {
  try {
    const projectRoot = process.cwd();
    const packageJsonPath = join(projectRoot, 'package.json');

    if (!existsSync(packageJsonPath)) {
      return failure(
        makeError(
          'NOT_FOUND',
          'No package.json found. Please run this command in a project root.'
        )
      );
    }

    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));

    // 1. Detect existing tools and project characteristics
    const detectionResult = await detectExistingTools(projectRoot);
    if (isFailure(detectionResult)) {
      return failure(
        makeError(
          'INTERNAL_ERROR',
          `Detection failed: ${detectionResult.error.message}`
        )
      );
    }

    const detectedTools = detectionResult.data;
    const detection = await detectProjectCharacteristics(
      projectRoot,
      packageJson
    );

    // Show detection summary
    console.log('\n🔍 Project Analysis:');
    showDetectionSummary(detection, detectedTools);

    // 2. Interactive feature selection (skip if --yes flag)
    let selectedFeatures: Set<string>;
    let config: OutfitterConfig;

    if (options.yes) {
      // Auto-select sensible defaults based on detection
      selectedFeatures = getDefaultFeatures(detection);
      config = generateConfig(selectedFeatures, detection);
    } else {
      const interactiveResult = await runInteractiveSetup(
        detection,
        detectedTools,
        options
      );
      if (isFailure(interactiveResult)) {
        return interactiveResult;
      }
      selectedFeatures = interactiveResult.data.selectedFeatures;
      config = interactiveResult.data.config;
    }

    const context: InitContext = {
      projectRoot,
      packageJson,
      detectedTools,
      detection,
      selectedFeatures,
      config,
    };

    // 3. Show summary and confirm
    console.log('\n📋 Configuration Summary:');
    showConfigSummary(config, selectedFeatures);

    if (!(options.yes || options.dryRun)) {
      const proceed = await confirm({
        message: 'Proceed with this configuration?',
        default: true,
      });

      if (!proceed) {
        return success(undefined);
      }
    }

    // 4. Dry run - show what would be done
    if (options.dryRun) {
      console.log('\n🔍 Dry Run - Actions that would be performed:');
      await showDryRunActions(context, options);
      return success(undefined);
    }

    // 5. Execute configuration
    console.log('\n🚀 Setting up baselayer...');
    const setupResult = await executeSetup(context, options);
    if (isFailure(setupResult)) {
      return setupResult;
    }

    // 6. Generate baselayer.jsonc config file
    const configResult = await writeConfigFile(projectRoot, config);
    if (isFailure(configResult)) {
      return configResult;
    }

    // 7. Show completion summary
    console.log('\n✅ Baselayer setup complete!');
    showCompletionSummary(selectedFeatures, projectRoot);

    return success(undefined);
  } catch (error) {
    return failure(
      makeError(
        'INTERNAL_ERROR',
        `Initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    );
  }
}

// Helper functions for the interactive init process

async function detectProjectCharacteristics(
  projectRoot: string,
  packageJson: Record<string, unknown>
): Promise<ProjectDetection> {
  const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };

  const detectedFramework = detectFramework(deps);
  const result: ProjectDetection = {
    hasTypeScript:
      existsSync(join(projectRoot, 'tsconfig.json')) || !!deps.typescript,
    hasReact: !!deps.react,
    hasNext: !!deps.next,
    hasVue: !!deps.vue,
    hasMarkdownFiles: await detectMarkdownFiles(projectRoot),
    hasCSSFiles: await detectCSSFiles(projectRoot),
    hasPackageScripts: Object.keys(packageJson.scripts || {}).length > 0,
    isMonorepo: detectMonorepo(projectRoot, packageJson),
    packageManager: detectPackageManager(projectRoot),
  };

  // Only set framework if it's detected (exactOptionalPropertyTypes compliance)
  if (detectedFramework) {
    result.framework = detectedFramework;
  }

  return result;
}

async function detectCSSFiles(projectRoot: string): Promise<boolean> {
  try {
    const { findFiles } = await import('../utils/file-system.js');
    const patterns = ['**/*.css', '**/*.scss', '**/*.sass', '**/*.less'];

    for (const pattern of patterns) {
      const filesResult = await findFiles(pattern, { cwd: projectRoot });
      if (isSuccess(filesResult) && filesResult.data.length > 0) {
        return true;
      }
    }
    return false;
  } catch {
    return false;
  }
}

async function detectMarkdownFiles(projectRoot: string): Promise<boolean> {
  try {
    const { findFiles } = await import('../utils/file-system.js');
    const filesResult = await findFiles('**/*.md', { cwd: projectRoot });
    return isSuccess(filesResult) && filesResult.data.length > 0;
  } catch {
    return false;
  }
}

function detectMonorepo(
  projectRoot: string,
  packageJson: Record<string, unknown>
): boolean {
  return (
    existsSync(join(projectRoot, 'pnpm-workspace.yaml')) ||
    existsSync(join(projectRoot, 'lerna.json')) ||
    existsSync(join(projectRoot, 'nx.json')) ||
    (packageJson.workspaces && Array.isArray(packageJson.workspaces))
  );
}

function detectFramework(
  deps: Record<string, string>
): ProjectDetection['framework'] {
  if (deps.next) return 'next';
  if (deps.react) return 'react';
  if (deps.vue) return 'vue';
  if (deps.svelte) return 'svelte';
  if (deps.angular) return 'angular';
  return;
}

function detectPackageManager(
  projectRoot: string
): ProjectDetection['packageManager'] {
  if (existsSync(join(projectRoot, 'pnpm-lock.yaml'))) return 'pnpm';
  if (existsSync(join(projectRoot, 'yarn.lock'))) return 'yarn';
  if (existsSync(join(projectRoot, 'bun.lockb'))) return 'bun';
  return 'npm';
}

function showDetectionSummary(
  detection: ProjectDetection,
  detectedTools: DetectedTools
): void {
  const items = [];

  if (detection.framework) {
    items.push(`Framework: ${detection.framework}`);
  }
  if (detection.hasTypeScript) {
    items.push('TypeScript detected');
  }
  if (detection.isMonorepo) {
    items.push(`Monorepo (${detection.packageManager})`);
  } else {
    items.push(`Package manager: ${detection.packageManager}`);
  }
  if (detection.hasCSSFiles) {
    items.push('CSS/SCSS files found');
  }
  if (detection.hasMarkdownFiles) {
    items.push('Markdown files found');
  }
  if (detectedTools.hasConfigs) {
    items.push(
      `Existing configs: ${detectedTools.configs.map((c) => c.tool).join(', ')}`
    );
  }

  for (const item of items) {
    console.log(`  • ${item}`);
  }
}

async function runInteractiveSetup(
  detection: ProjectDetection,
  detectedTools: DetectedTools,
  _options: InitOptions
): Promise<
  Result<{ selectedFeatures: Set<string>; config: OutfitterConfig }, Error>
> {
  try {
    console.log('\n⚙️  Feature Selection:');

    const choices = buildFeatureChoices(detection, detectedTools);
    const defaultFeatures = getDefaultFeatures(detection);

    const selected = await checkbox({
      message: 'Select features to configure:',
      choices: choices.map((choice) => ({
        ...choice,
        checked: choice.checked ?? defaultFeatures.has(choice.value),
      })),
      required: true,
    });

    const selectedFeatures = new Set(selected);

    // Handle advanced options if needed
    let config = generateConfig(selectedFeatures, detection);

    // Ask for additional configuration if complex project
    if (detection.isMonorepo || detectedTools.hasConfigs) {
      const needsAdvanced = await confirm({
        message: 'Configure advanced options?',
        default: false,
      });

      if (needsAdvanced) {
        config = await configureAdvancedOptions(config, detection);
      }
    }

    return success({ selectedFeatures, config });
  } catch (error) {
    return failure(
      makeError(
        'INTERNAL_ERROR',
        `Interactive setup failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    );
  }
}

function buildFeatureChoices(
  detection: ProjectDetection,
  _detectedTools: DetectedTools
): FeatureChoice[] {
  const choices: FeatureChoice[] = [
    {
      name: 'TypeScript/JavaScript',
      value: 'typescript',
      description: 'Format and lint TS/JS files with Biome (fast, zero-config)',
      checked: true, // Always recommended
    },
    {
      name: 'JSON/YAML',
      value: 'json',
      description:
        'Format JSON, YAML, and other structured files with Prettier',
      checked: true,
    },
    {
      name: 'Markdown',
      value: 'markdown',
      description: 'Lint markdown files with markdownlint-cli2',
      checked: detection.hasMarkdownFiles,
      disabled: detection.hasMarkdownFiles
        ? false
        : 'No markdown files detected',
    },
    {
      name: 'CSS/SCSS',
      value: 'styles',
      description: 'Lint CSS/SCSS files with Stylelint',
      checked: detection.hasCSSFiles,
      disabled: detection.hasCSSFiles ? false : 'No CSS files detected',
    },
    {
      name: 'Git Hooks',
      value: 'commits',
      description: 'Pre-commit hooks and conventional commits with Lefthook',
      checked: true,
    },
    {
      name: 'Package Scripts',
      value: 'scripts',
      description: 'Add npm scripts for formatting and linting',
      checked: true,
    },
    {
      name: 'VS Code Settings',
      value: 'vscode',
      description: 'Configure VS Code for optimal formatting experience',
      checked:
        existsSync(join(process.cwd(), '.vscode')) ||
        existsSync(join(process.cwd(), '*.code-workspace')),
    },
  ];

  // Add package validation for libraries
  const isLibrary =
    detection.packageManager !== 'npm' ||
    process.cwd().includes('packages/') ||
    process.cwd().includes('libs/');

  if (isLibrary) {
    choices.push({
      name: 'Package Validation',
      value: 'packages',
      description:
        'Validate package.json and exports with publint (for libraries)',
      checked: false,
    });
  }

  return choices;
}

function getDefaultFeatures(detection: ProjectDetection): Set<string> {
  const defaults = new Set([
    'typescript',
    'json',
    'commits',
    'scripts',
    'vscode',
  ]);

  if (detection.hasMarkdownFiles) {
    defaults.add('markdown');
  }
  if (detection.hasCSSFiles) {
    defaults.add('styles');
  }

  return defaults;
}

function generateConfig(
  selectedFeatures: Set<string>,
  _detection: ProjectDetection
): OutfitterConfig {
  return {
    features: {
      typescript: selectedFeatures.has('typescript'),
      markdown: selectedFeatures.has('markdown'),
      styles: selectedFeatures.has('styles'),
      json: selectedFeatures.has('json'),
      commits: selectedFeatures.has('commits'),
      packages: selectedFeatures.has('packages'),
    },
    overrides: {},
  };
}

async function configureAdvancedOptions(
  config: OutfitterConfig,
  _detection: ProjectDetection
): Promise<OutfitterConfig> {
  console.log('\n🔧 Advanced Configuration:');

  // Allow custom Biome config
  if (config.features?.typescript) {
    const customBiome = await confirm({
      message: 'Customize Biome (TypeScript/JavaScript) rules?',
      default: false,
    });

    if (customBiome) {
      const rules = await input({
        message: 'Biome rules to override (JSON format):',
        default: '{}',
        validate: (input) => {
          try {
            JSON.parse(input);
            return true;
          } catch {
            return 'Please enter valid JSON';
          }
        },
      });

      config.overrides = config.overrides || {};
      config.overrides.biome = JSON.parse(rules);
    }
  }

  return config;
}

function showConfigSummary(
  config: OutfitterConfig,
  _selectedFeatures: Set<string>
): void {
  const features = Object.entries(config.features || {})
    .filter(([, enabled]) => enabled)
    .map(([feature]) => feature);

  console.log(`  Enabled features: ${features.join(', ')}`);

  if (Object.keys(config.overrides || {}).length > 0) {
    console.log(
      `  Custom overrides: ${Object.keys(config.overrides || {}).join(', ')}`
    );
  }
}

async function showDryRunActions(
  context: InitContext,
  options: InitOptions
): Promise<void> {
  const actions = [];

  // Cleanup actions
  if (context.detectedTools.hasConfigs && !options.keepExisting) {
    actions.push(
      `• Remove existing configs: ${context.detectedTools.configs.map((c) => c.path).join(', ')}`
    );
  }

  // Installation actions
  const deps = await gatherDependencies(context, options);
  actions.push(`• Install dependencies: ${deps.join(', ')}`);

  // Config generation actions
  const configs = await gatherConfigs(context, options);
  actions.push(`• Create config files: ${configs.join(', ')}`);

  // Package script updates
  if (context.selectedFeatures.has('scripts')) {
    actions.push('• Update package.json scripts');
  }

  for (const action of actions) {
    console.log(action);
  }
}

async function executeSetup(
  context: InitContext,
  options: InitOptions
): Promise<Result<void, Error>> {
  try {
    // 1. Backup existing configs
    if (context.detectedTools.hasConfigs && !options.keepExisting) {
      console.log('  📦 Creating backup...');
      const backupResult = await createBackup(context.detectedTools.configs);
      if (isFailure(backupResult)) {
        return failure(
          makeError(
            'INTERNAL_ERROR',
            `Backup failed: ${backupResult.error.message}`
          )
        );
      }
    }

    // 2. Clean up old configs
    if (context.detectedTools.hasConfigs && !options.keepExisting) {
      console.log('  🧹 Cleaning up old configs...');
      const cleanupResult = await removeOldConfigs(
        context.detectedTools.configs.map((c) => c.path)
      );
      if (isFailure(cleanupResult)) {
        console.warn('  ⚠️  Some files could not be cleaned up');
      }

      const depCleanupResult = await cleanupDependencies();
      if (isFailure(depCleanupResult)) {
        console.warn('  ⚠️  Some dependencies could not be cleaned up');
      }
    }

    // 3. Install dependencies
    const dependencies = await gatherDependencies(context, options);
    if (dependencies.length > 0) {
      console.log(`  📥 Installing ${dependencies.length} dependencies...`);
      const installResult = await installDependencies(dependencies, {
        dev: true,
      });
      if (isFailure(installResult)) {
        return failure(
          makeError(
            'EXTERNAL_SERVICE_ERROR',
            `Installation failed: ${installResult.error.message}`
          )
        );
      }
    }

    // 4. Generate configurations based on selected features
    await generateSelectedConfigs(context, options);

    // 5. Update package scripts
    if (context.selectedFeatures.has('scripts')) {
      console.log('  📝 Updating package.json scripts...');
      const scriptsResult = await updatePackageScripts();
      if (isFailure(scriptsResult)) {
        return failure(
          makeError(
            'INTERNAL_ERROR',
            `Scripts update failed: ${scriptsResult.error.message}`
          )
        );
      }
    }

    return success(undefined);
  } catch (error) {
    return failure(
      makeError(
        'INTERNAL_ERROR',
        `Setup execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    );
  }
}

async function generateSelectedConfigs(
  context: InitContext,
  _options: InitOptions
): Promise<void> {
  const { selectedFeatures, projectRoot } = context;

  // TypeScript/JavaScript (Biome)
  if (selectedFeatures.has('typescript')) {
    console.log('  ⚙️  Configuring Biome...');
    const biomeConfigContent = generateBiomeConfig();
    const writeResult = await writeFile('biome.json', biomeConfigContent);
    if (isFailure(writeResult)) {
      console.warn('  ⚠️  Biome config generation failed');
    }

    // Initialize Ultracite
    try {
      execSync('npx ultracite format', {
        cwd: projectRoot,
        stdio: 'pipe',
        encoding: 'utf-8',
      });
    } catch {
      // Silent fail - Ultracite might not be available yet
    }

    // Oxlint for additional linting
    const oxlintResult = await generateOxlintConfig();
    if (isFailure(oxlintResult)) {
      console.warn('  ⚠️  Oxlint config generation failed');
    }
  }

  // JSON/YAML (Prettier)
  if (selectedFeatures.has('json')) {
    console.log('  ⚙️  Configuring Prettier...');
    const prettierResult = await generatePrettierConfig();
    if (isFailure(prettierResult)) {
      console.warn('  ⚠️  Prettier config generation failed');
    }
  }

  // Markdown
  if (selectedFeatures.has('markdown')) {
    console.log('  ⚙️  Configuring Markdownlint...');
    const markdownResult = await generateMarkdownlintConfig();
    if (isFailure(markdownResult)) {
      console.warn('  ⚠️  Markdownlint config generation failed');
    }
  }

  // Styles
  if (selectedFeatures.has('styles')) {
    console.log('  ⚙️  Configuring Stylelint...');
    const stylelintResult = await generateStylelintConfig();
    if (isFailure(stylelintResult)) {
      console.warn('  ⚠️  Stylelint config generation failed');
    }
  }

  // Git hooks and commits
  if (selectedFeatures.has('commits')) {
    console.log('  ⚙️  Configuring git hooks...');
    const lefthookResult = await generateLefthookConfig();
    if (isFailure(lefthookResult)) {
      console.warn('  ⚠️  Lefthook config generation failed');
    }

    const commitlintResult = await generateCommitlintConfig();
    if (isFailure(commitlintResult)) {
      console.warn('  ⚠️  Commitlint config generation failed');
    }

    // Install hooks
    try {
      execSync('npx lefthook install', { cwd: projectRoot, stdio: 'pipe' });
    } catch {
      console.warn('  ⚠️  Could not install git hooks');
    }
  }

  // EditorConfig
  console.log('  ⚙️  Configuring EditorConfig...');
  const editorconfigResult = await generateEditorconfigConfig();
  if (isFailure(editorconfigResult)) {
    console.warn('  ⚠️  EditorConfig generation failed');
  }

  // VS Code
  if (selectedFeatures.has('vscode')) {
    console.log('  ⚙️  Configuring VS Code...');
    const vscodeResult = await setupVSCode();
    if (isFailure(vscodeResult)) {
      console.warn('  ⚠️  VS Code setup failed');
    }
  }
}

async function writeConfigFile(
  projectRoot: string,
  config: OutfitterConfig
): Promise<Result<void, Error>> {
  try {
    const configPath = join(projectRoot, 'baselayer.jsonc');
    const configContent = JSON.stringify(config, null, 2);

    writeFileSync(
      configPath,
      `// Baselayer configuration\n// https://github.com/outfitter-dev/baselayer\n${configContent}\n`
    );

    console.log('  📄 Created baselayer.jsonc');
    return success(undefined);
  } catch (error) {
    return failure(
      makeError(
        'FILE_OPERATION_FAILED',
        `Could not write config file: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    );
  }
}

function showCompletionSummary(
  selectedFeatures: Set<string>,
  projectRoot: string
): void {
  console.log('\n📁 Files created:');
  console.log('  • baselayer.jsonc - Main configuration');

  if (selectedFeatures.has('typescript')) {
    console.log('  • biome.json - TypeScript/JavaScript formatting');
    console.log('  • oxlint.json - Additional JavaScript linting');
  }
  if (selectedFeatures.has('json')) {
    console.log('  • .prettierrc.json - JSON/YAML formatting');
    console.log('  • .prettierignore - Prettier ignore patterns');
  }
  if (selectedFeatures.has('markdown')) {
    console.log('  • .markdownlint.json - Markdown linting rules');
  }
  if (selectedFeatures.has('styles')) {
    console.log('  • .stylelintrc.json - CSS/SCSS linting rules');
  }
  if (selectedFeatures.has('commits')) {
    console.log('  • lefthook.yml - Git hooks configuration');
    console.log('  • commitlint.config.js - Commit message linting');
  }
  console.log('  • .editorconfig - Editor configuration');
  if (selectedFeatures.has('vscode')) {
    console.log('  • .vscode/settings.json - VS Code workspace settings');
  }

  console.log('\n🚀 Next steps:');
  console.log('  • Run "npm run format" to format all files');
  console.log('  • Run "npm run lint" to check for issues');
  console.log('  • Customize rules in baselayer.jsonc if needed');
  console.log(`  • View the generated configs in ${projectRoot}`);
}

// Legacy helper functions (updated to work with new context structure)
async function gatherDependencies(
  context: InitContext,
  _options: InitOptions
): Promise<string[]> {
  const deps: string[] = [];

  if (context.selectedFeatures.has('typescript')) {
    deps.push('ultracite', 'oxlint');
  }

  if (context.selectedFeatures.has('json')) {
    deps.push('prettier');
  }

  if (context.selectedFeatures.has('markdown')) {
    deps.push('markdownlint-cli2');
  }

  if (context.selectedFeatures.has('styles')) {
    deps.push('stylelint', 'stylelint-config-standard');
    if (
      context.detection.framework === 'next' ||
      context.detection.framework === 'react'
    ) {
      deps.push('stylelint-config-standard-scss');
    }
  }

  if (context.selectedFeatures.has('commits')) {
    deps.push('lefthook', '@commitlint/cli', '@commitlint/config-conventional');
  }

  if (context.selectedFeatures.has('packages')) {
    deps.push('publint');
  }

  return deps;
}

async function gatherConfigs(
  context: InitContext,
  _options: InitOptions
): Promise<string[]> {
  const configs = ['baselayer.jsonc', '.editorconfig'];

  if (context.selectedFeatures.has('typescript')) {
    configs.push('biome.json', 'oxlint.json');
  }

  if (context.selectedFeatures.has('json')) {
    configs.push('.prettierrc.json', '.prettierignore');
  }

  if (context.selectedFeatures.has('markdown')) {
    configs.push('.markdownlint.json');
  }

  if (context.selectedFeatures.has('styles')) {
    configs.push('.stylelintrc.json');
  }

  if (context.selectedFeatures.has('commits')) {
    configs.push('lefthook.yml', 'commitlint.config.js');
  }

  if (context.selectedFeatures.has('vscode')) {
    configs.push('.vscode/settings.json');
  }

  return configs;
}
