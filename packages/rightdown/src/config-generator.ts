import type { PresetName, MdlintConfig, GeneratorOptions } from './types.js';
import { getPresetConfig } from './presets/index.js';

// Re-export types for convenience
export type { MdlintConfig, GeneratorOptions } from './types.js';

export function generateConfig(options: GeneratorOptions = {}): string {
  const { preset = 'standard', terminology = [], customRules = [], ignores = [] } = options;

  // Start with a copy of the preset object
  const config: MdlintConfig = getPresetConfig(preset);

  // Add terminology section if provided
  if (terminology.length > 0) {
    config.terminology = terminology;
  }

  // Add custom rules if provided
  if (customRules.length > 0) {
    config.customRules = [...(config.customRules || []), ...customRules];
  }

  // Add additional ignores if provided, ensuring no duplicates
  if (ignores.length > 0) {
    config.ignores = [...new Set([...(config.ignores || []), ...ignores])];
  }

  return generateYamlConfig(config, preset);
}

/**
 * Converts a markdownlint configuration object into a YAML-formatted string with descriptive comments.
 *
 * The output includes a header indicating the preset used, documentation links, and detailed comments for terminology corrections, custom rules, ignore patterns, and rule configurations.
 *
 * @param config - The markdownlint configuration object to convert
 * @param preset - The name of the preset used to generate the configuration
 * @returns The YAML-formatted configuration string with comments
 */
function generateYamlConfig(config: MdlintConfig, preset: PresetName): string {
  const lines: string[] = [];

  // Add header comments
  lines.push('# rightdown configuration');
  lines.push(`# Generated with preset: ${preset}`);
  lines.push('# Docs: https://github.com/DavidAnson/markdownlint-cli2');
  lines.push('');

  // Convert config to YAML format
  Object.entries(config).forEach(([key, value]) => {
    switch (key) {
      case 'terminology':
        lines.push('# Custom terminology corrections');
        lines.push('# Format: [{ incorrect: "bad", correct: "good" }]');
        lines.push(`${key}:`);
        (value as Array<{ incorrect: string; correct: string }>).forEach((term) => {
          lines.push(`  - incorrect: "${term.incorrect}"`);
          lines.push(`    correct: "${term.correct}"`);
        });
        break;

      case 'customRules':
        lines.push('# Additional custom rules to load');
        lines.push('# Paths to JavaScript files exporting markdownlint rules');
        lines.push(`${key}:`);
        (value as string[]).forEach((rule) => {
          lines.push(`  - "${rule}"`);
        });
        break;

      case 'ignores':
        lines.push('# Files and patterns to ignore');
        lines.push('# Supports glob patterns like "docs/legacy/**"');
        lines.push(`${key}:`);
        (value as string[]).forEach((pattern) => {
          lines.push(`  - "${pattern}"`);
        });
        break;

      default:
        if (typeof value === 'boolean') {
          lines.push(`# Rule: ${key} - ${value ? 'enabled' : 'disabled'}`);
          lines.push(`${key}: ${value}`);
        } else if (typeof value === 'object' && value !== null) {
          lines.push(`# Rule: ${key} - configured with options`);
          lines.push(`${key}:`);
          Object.entries(value).forEach(([optKey, optValue]) => {
            if (typeof optValue === 'string') {
              lines.push(`  ${optKey}: "${optValue}"`);
            } else {
              lines.push(`  ${optKey}: ${optValue}`);
            }
          });
        } else if (value === null) {
          lines.push(`${key}: null`);
        } else {
          lines.push(`# Rule: ${key}`);
          lines.push(`${key}: "${value}"`);
        }
        break;
    }
    lines.push('');
  });

  // Remove trailing empty line
  if (lines[lines.length - 1] === '') {
    lines.pop();
  }

  return lines.join('\n');
}

// Default terminology for technical documentation
export const defaultTerminology = [
  { incorrect: 'NPM', correct: 'npm' },
  { incorrect: 'Javascript', correct: 'JavaScript' },
  { incorrect: 'Typescript', correct: 'TypeScript' },
  { incorrect: 'VSCode', correct: 'VS Code' },
  { incorrect: 'MacOS', correct: 'macOS' },
  { incorrect: 'Github', correct: 'GitHub' },
  { incorrect: 'gitlab', correct: 'GitLab' },
  { incorrect: 'nodejs', correct: 'Node.js' },
  { incorrect: 'react native', correct: 'React Native' },
];
