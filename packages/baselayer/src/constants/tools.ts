/**
 * Shared tool constants and mappings for command operations
 * Centralizes tool configuration to eliminate duplication across command files
 */

import { installBiomeConfig } from '../generators/biome.js';
import { generateCommitlintConfig } from '../generators/commitlint.js';
import { generateEditorconfigConfig } from '../generators/editorconfig.js';
import { generateLefthookConfig } from '../generators/lefthook.js';
import { generateMarkdownlintConfig } from '../generators/markdownlint.js';
import { generateOxlintConfig } from '../generators/oxlint.js';
import { updatePackageScripts } from '../generators/package-scripts.js';
import { generatePrettierConfig } from '../generators/prettier.js';
import { generateStylelintConfig } from '../generators/stylelint.js';
import { setupVSCode } from '../generators/vscode.js';
import type { FeaturesConfig } from '../schemas/baselayer-config.js';

/**
 * Valid tool names that can be used in add/remove/update commands
 * Includes both tool names and feature aliases for better UX
 */
export const VALID_TOOLS = [
  // Primary tool names
  'biome',
  'prettier',
  'stylelint',
  'markdownlint',
  'lefthook',
  'commitlint',
  'editorconfig',
  'oxlint',
  'vscode',
  // Feature aliases for better UX
  'typescript',
  'markdown',
  'styles',
  'json',
  'commits',
  'packages',
  'testing',
  'docs',
] as const;

/**
 * Maps tool names and feature aliases to their corresponding feature configuration keys
 * Allows users to specify either tool names (biome) or feature names (typescript)
 */
export const TOOL_TO_FEATURE: Record<string, keyof FeaturesConfig> = {
  // Tool name -> feature mapping
  biome: 'typescript',
  prettier: 'json',
  stylelint: 'styles',
  markdownlint: 'markdown',
  lefthook: 'commits',
  commitlint: 'commits',
  editorconfig: 'typescript', // Part of base setup
  oxlint: 'typescript',
  vscode: 'typescript', // Part of base setup
  // Feature name -> feature mapping (direct)
  typescript: 'typescript',
  markdown: 'markdown',
  styles: 'styles',
  json: 'json',
  commits: 'commits',
  packages: 'packages',
  testing: 'testing',
  docs: 'docs',
} as const;

/**
 * Maps tools to their configuration generator functions
 * Used for creating configurations when tools are added
 */
export const TOOL_GENERATORS: Record<string, () => Promise<any>> = {
  biome: () => installBiomeConfig(),
  prettier: () => generatePrettierConfig(),
  stylelint: () => generateStylelintConfig(),
  markdownlint: () => generateMarkdownlintConfig(),
  lefthook: () => generateLefthookConfig(),
  commitlint: () => generateCommitlintConfig(),
  editorconfig: () => generateEditorconfigConfig(),
  oxlint: () => generateOxlintConfig(),
  vscode: () => setupVSCode(),
  // Feature aliases point to their tool generators
  typescript: () => installBiomeConfig(),
  markdown: () => generateMarkdownlintConfig(),
  styles: () => generateStylelintConfig(),
  json: () => generatePrettierConfig(),
  commits: () => generateLefthookConfig(),
  packages: () => updatePackageScripts(),
} as const;

/**
 * Maps tools to their typical configuration file patterns
 * Used for cleanup operations when tools are removed
 */
export const TOOL_CONFIG_FILES: Record<string, readonly string[]> = {
  biome: ['biome.json', 'biome.jsonc'] as const,
  prettier: [
    '.prettierrc',
    '.prettierrc.json',
    '.prettierrc.js',
    'prettier.config.js',
  ] as const,
  stylelint: [
    '.stylelintrc.json',
    '.stylelintrc.js',
    'stylelint.config.js',
  ] as const,
  markdownlint: [
    '.markdownlint.json',
    '.markdownlint.jsonc',
    '.markdownlint-cli2.jsonc',
  ] as const,
  lefthook: ['lefthook.yml', '.lefthook.yml'] as const,
  commitlint: ['commitlint.config.js', '.commitlintrc.json'] as const,
  editorconfig: ['.editorconfig'] as const,
  oxlint: ['oxlintrc.json', '.oxlintrc.json'] as const,
  vscode: ['.vscode/settings.json', '.vscode/extensions.json'] as const,
  // Feature aliases map to their tool's config files
  typescript: ['biome.json', 'biome.jsonc', 'tsconfig.json'] as const,
  markdown: [
    '.markdownlint.json',
    '.markdownlint.jsonc',
    '.markdownlint-cli2.jsonc',
  ] as const,
  styles: [
    '.stylelintrc.json',
    '.stylelintrc.js',
    'stylelint.config.js',
  ] as const,
  json: [
    '.prettierrc',
    '.prettierrc.json',
    '.prettierrc.js',
    'prettier.config.js',
  ] as const,
  commits: [
    'lefthook.yml',
    '.lefthook.yml',
    'commitlint.config.js',
    '.commitlintrc.json',
  ] as const,
} as const;

/**
 * Default feature configuration with sensible defaults
 * Used as the base configuration when creating new configs
 */
export const DEFAULT_FEATURES: FeaturesConfig = {
  typescript: true, // Core tool - TypeScript/JavaScript linting with Biome
  markdown: true, // Markdown linting with markdownlint
  styles: false, // CSS/SCSS linting with stylelint (opt-in)
  json: true, // JSON formatting with Prettier
  commits: true, // Commit linting with commitlint via lefthook
  packages: false, // Package.json validation with publint (opt-in for libraries)
  testing: false, // Test configuration setup (future feature)
  docs: false, // Documentation generation (future feature)
} as const;

/**
 * Tools that are considered core to the baselayer setup
 * Removing these tools will show warnings to users
 */
export const CORE_TOOLS = new Set([
  'biome',
  'typescript',
  'lefthook',
  'commits',
] as const);

/**
 * Tools that should be updated together as a group
 * Used for dependency management and coordination
 */
export const TOOL_GROUPS: Record<string, readonly string[]> = {
  typescript: ['biome', 'oxlint'] as const,
  formatting: ['biome', 'prettier'] as const,
  linting: ['biome', 'stylelint', 'markdownlint', 'oxlint'] as const,
  git: ['lefthook', 'commitlint'] as const,
  editor: ['vscode', 'editorconfig'] as const,
} as const;

/**
 * Validates if a tool name is recognized
 */
export function isValidTool(
  tool: string
): tool is (typeof VALID_TOOLS)[number] {
  return VALID_TOOLS.includes(tool as any);
}

/**
 * Gets all tools that correspond to a given feature
 */
export function getToolsForFeature(feature: keyof FeaturesConfig): string[] {
  return Object.entries(TOOL_TO_FEATURE)
    .filter(([, mappedFeature]) => mappedFeature === feature)
    .map(([tool]) => tool);
}

/**
 * Checks if a tool is considered a core baselayer tool
 */
export function isCoreTool(tool: string): boolean {
  return CORE_TOOLS.has(tool as any);
}

/**
 * Gets configuration files that should be cleaned up for a tool
 */
export function getConfigFilesForTool(tool: string): readonly string[] {
  return TOOL_CONFIG_FILES[tool] || [];
}
