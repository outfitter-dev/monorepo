/**
 * Migration utilities for converting between formatters
 */

import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import type { Result } from '@outfitter/contracts';
import { success, failure, makeError } from '@outfitter/contracts';
import type { PresetConfig } from '../types/index.js';

/**
 * ESLint configuration interface
 */
interface ESLintConfig {
  rules?: Record<string, unknown>;
  extends?: string | Array<string>;
  overrides?: Array<{
    files: string | Array<string>;
    rules?: Record<string, unknown>;
  }>;
}

/**
 * ESLint rule mapping to Biome rules
 */
const eslintToBiomeRules: Record<string, string | { rule: string; severity?: string }> = {
  // TypeScript rules
  '@typescript-eslint/no-unused-vars': 'correctness/noUnusedVariables',
  '@typescript-eslint/no-explicit-any': 'suspicious/noExplicitAny',
  '@typescript-eslint/no-non-null-assertion': 'style/noNonNullAssertion',

  // General rules
  'no-console': 'suspicious/noConsole',
  'no-debugger': 'suspicious/noDebugger',
  'prefer-const': 'style/useConst',
  'no-var': 'style/noVar',

  // React rules (Biome has limited React support)
  'react-hooks/rules-of-hooks': 'correctness/useHookAtTopLevel',
  'react-hooks/exhaustive-deps': 'correctness/useExhaustiveDependencies',
};

/**
 * Map ESLint severity to Biome severity
 */
function mapSeverity(eslintSeverity: string | number): 'error' | 'warn' | 'off' {
  if (eslintSeverity === 'error' || eslintSeverity === 2) return 'error';
  if (eslintSeverity === 'warn' || eslintSeverity === 1) return 'warn';
  return 'off';
}

/**
 * Extract preset-like config from ESLint config
 */
export function extractPresetFromEslint(eslintConfig: ESLintConfig): Partial<PresetConfig> {
  const preset: Partial<PresetConfig> = {};

  // Try to determine formatting preferences from rules
  if (eslintConfig.rules) {
    // Check for quotes preference
    const quotesRule = eslintConfig.rules['quotes'];
    if (Array.isArray(quotesRule) && quotesRule.length > 1 && quotesRule[1]) {
      const quoteStyle = quotesRule[1];
      if (quoteStyle === 'single' || quoteStyle === 'double') {
        preset.quotes = {
          style: quoteStyle,
          jsx: quoteStyle,
        };
      }
    }

    // Check for semicolons
    const semiRule = eslintConfig.rules['semi'];
    if (Array.isArray(semiRule) && semiRule.length > 1) {
      preset.semicolons = semiRule[1] === 'never' ? 'asNeeded' : 'always';
    }

    // Check for trailing commas
    const commaRule = eslintConfig.rules['comma-dangle'];
    if (Array.isArray(commaRule) && commaRule.length > 1 && typeof commaRule[1] === 'string') {
      if (commaRule[1] === 'never') preset.trailingComma = 'none';
      else if (commaRule[1].includes('always')) preset.trailingComma = 'all';
    }
  }

  return preset;
}

/**
 * Analyze ESLint config and suggest Biome migration
 */
export interface MigrationAnalysis {
  mappableRules: Array<{ eslint: string; biome: string; severity: string }>;
  unmappableRules: Array<string>;
  suggestedPreset: Partial<PresetConfig>;
  warnings: Array<string>;
}

/**
 * Analyze ESLint configuration for migration to Biome
 */
export async function analyzeEslintConfig(
  eslintConfigPath: string,
): Promise<Result<MigrationAnalysis, Error>> {
  try {
    // Get absolute path for dynamic import
    const absolutePath = resolve(eslintConfigPath);

    // Parse config based on file extension
    let eslintConfig: ESLintConfig;

    if (eslintConfigPath.endsWith('.json')) {
      // JSON configs can be safely parsed
      const configContent = await readFile(eslintConfigPath, 'utf-8');
      eslintConfig = JSON.parse(configContent);
    } else if (eslintConfigPath.endsWith('.js') || eslintConfigPath.endsWith('.cjs')) {
      // For JavaScript configs, use dynamic import with file URL
      try {
        // Convert to file URL for proper module loading
        const fileUrl = pathToFileURL(absolutePath).href;
        const module = await import(fileUrl);
        eslintConfig = module.default || module;
      } catch {
        // Fallback: try require for CommonJS modules
        try {
          // Clear require cache first
          delete require.cache[require.resolve(absolutePath)];
          eslintConfig = require(absolutePath);
        } catch (requireError) {
          return failure(
            makeError(
              'VALIDATION_ERROR',
              'Failed to load ESLint config - ensure it exports a valid configuration',
              { cause: requireError },
            ),
          );
        }
      }
    } else {
      return failure(
        makeError('NOT_SUPPORTED', `ESLint config format not supported: ${eslintConfigPath}`),
      );
    }

    const analysis: MigrationAnalysis = {
      mappableRules: [],
      unmappableRules: [],
      suggestedPreset: extractPresetFromEslint(eslintConfig),
      warnings: [],
    };

    // Analyze rules
    if (eslintConfig.rules) {
      for (const [rule, config] of Object.entries(eslintConfig.rules)) {
        const biomeMapping = eslintToBiomeRules[rule];

        if (biomeMapping) {
          const severity = Array.isArray(config) ? mapSeverity(config[0]) : mapSeverity(config);
          const biomeRule = typeof biomeMapping === 'string' ? biomeMapping : biomeMapping.rule;

          analysis.mappableRules.push({
            eslint: rule,
            biome: biomeRule,
            severity,
          });
        } else {
          analysis.unmappableRules.push(rule);
        }
      }
    }

    // Add warnings
    if (eslintConfig.extends?.includes('plugin:react')) {
      analysis.warnings.push(
        'Biome has limited React support. Some React-specific rules may not have equivalents.',
      );
    }

    if (eslintConfig.extends?.includes('plugin:@typescript-eslint')) {
      analysis.warnings.push(
        'Biome TypeScript support differs from @typescript-eslint. Review type checking carefully.',
      );
    }

    if (eslintConfig.overrides?.length > 0) {
      analysis.warnings.push(
        'ESLint overrides detected. Biome uses different configuration for file-specific rules.',
      );
    }

    return success(analysis);
  } catch (error) {
    return failure(
      makeError('INTERNAL_ERROR', 'Failed to analyze ESLint config', { cause: error }),
    );
  }
}

/**
 * Generate migration report
 */
export function generateMigrationReport(analysis: MigrationAnalysis): string {
  const lines: Array<string> = [
    '# ESLint to Biome Migration Report',
    '',
    '## Summary',
    `- Mappable rules: ${analysis.mappableRules.length}`,
    `- Unmappable rules: ${analysis.unmappableRules.length}`,
    '',
  ];

  if (analysis.warnings.length > 0) {
    lines.push('## ⚠️ Warnings', '');
    analysis.warnings.forEach((warning) => {
      lines.push(`- ${warning}`);
    });
    lines.push('');
  }

  if (analysis.mappableRules.length > 0) {
    lines.push('## ✅ Mappable Rules', '');
    lines.push('| ESLint Rule | Biome Rule | Severity |');
    lines.push('|-------------|------------|----------|');
    analysis.mappableRules.forEach(({ eslint, biome, severity }) => {
      lines.push(`| ${eslint} | ${biome} | ${severity} |`);
    });
    lines.push('');
  }

  if (analysis.unmappableRules.length > 0) {
    lines.push('## ❌ Unmappable Rules', '');
    lines.push('These ESLint rules do not have direct Biome equivalents:');
    lines.push('');
    analysis.unmappableRules.forEach((rule) => {
      lines.push(`- ${rule}`);
    });
    lines.push('');
  }

  if (Object.keys(analysis.suggestedPreset).length > 0) {
    lines.push('## 📋 Suggested Formatting Preset', '');
    lines.push('Based on your ESLint config, we suggest these formatting options:');
    lines.push('');
    lines.push('```json');
    lines.push(JSON.stringify(analysis.suggestedPreset, null, 2));
    lines.push('```');
    lines.push('');
  }

  lines.push('## 🚀 Next Steps', '');
  lines.push('1. Run `outfitter-formatting setup --formatters biome` to generate Biome config');
  lines.push('2. Review the generated `biome.jsonc` file');
  lines.push('3. Test your code with `biome lint` and `biome format`');
  lines.push('4. Adjust rules as needed based on your project requirements');
  lines.push('');
  lines.push('Note: This is an automated analysis. Manual review is recommended.');

  return lines.join('\n');
}
