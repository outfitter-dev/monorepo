/**
 * Advanced Remark configuration generator with code block routing
 */

import type { FormatterDetectionResult, PresetConfig } from '../types/index.js';
import type { Result } from '@outfitter/contracts';
import { success } from '@outfitter/contracts';

interface RemarkAdvancedConfig {
  plugins: Array<string | [string, unknown]>;
  formatCodeBlocks?: {
    typescript: 'biome' | 'prettier';
    javascript: 'biome' | 'prettier';
    json: 'prettier' | 'biome';
    yaml: 'prettier';
    css: 'prettier';
    html: 'prettier';
    python?: 'prettier' | 'black';
    [key: string]: string | undefined;
  };
}

/**
 * Detect optimal code block formatter routing based on available tools
 */
export function detectCodeBlockRouting(
  detection: FormatterDetectionResult,
): RemarkAdvancedConfig['formatCodeBlocks'] {
  const { available } = detection;
  const hasBiome = available.includes('biome');
  const hasPrettier = available.includes('prettier');

  // If only markdown + TypeScript project with Biome
  if (hasBiome && !hasPrettier) {
    return {
      typescript: 'biome',
      javascript: 'biome',
      json: 'biome',
      // Biome can handle JSON, but not YAML/CSS/HTML
      yaml: 'prettier', // Will be skipped if Prettier not available
      css: 'prettier',
      html: 'prettier',
    };
  }

  // If both available, use best tool for each job
  if (hasBiome && hasPrettier) {
    return {
      typescript: 'biome', // Biome for TS/JS (your preference)
      javascript: 'biome',
      json: 'prettier', // Prettier better for JSON
      yaml: 'prettier',
      css: 'prettier',
      html: 'prettier',
    };
  }

  // If only Prettier
  if (hasPrettier && !hasBiome) {
    return {
      typescript: 'prettier',
      javascript: 'prettier',
      json: 'prettier',
      yaml: 'prettier',
      css: 'prettier',
      html: 'prettier',
    };
  }

  // No code formatters available
  return undefined;
}

/**
 * Generate advanced Remark configuration with intelligent code block formatting
 */
export function generateAdvancedRemarkConfig(
  preset: PresetConfig,
  detection: FormatterDetectionResult,
): Result<RemarkAdvancedConfig, Error> {
  const basePlugins: Array<string | [string, unknown]> = [
    'remark-preset-lint-recommended',
    ['remark-lint-unordered-list-marker-style', '-'],
    ['remark-lint-heading-style', 'atx'],
  ];

  // Add preset-specific rules
  if (preset.name === 'strict') {
    basePlugins.push(
      ['remark-lint-maximum-line-length', 80],
      'remark-lint-no-duplicate-headings',
      'remark-lint-heading-increment',
    );
  } else if (preset.name === 'relaxed') {
    basePlugins.push(['remark-lint-maximum-line-length', 120]);
  }

  const routing = detectCodeBlockRouting(detection);

  // Only add code formatting plugin if we have formatters available
  if (routing && Object.keys(routing).length > 0) {
    // This would be our custom plugin or remark-code-blocks configuration
    basePlugins.push([
      '@outfitter/formatting/remark-plugins/format-code-blocks',
      { routing, preserveIndentation: true },
    ]);
  }

  return success({
    plugins: basePlugins,
    formatCodeBlocks: routing,
  });
}

/**
 * Get package.json scripts for advanced remark setup
 */
export function getAdvancedRemarkScripts(hasCodeFormatting: boolean): Record<string, string> {
  const base = {
    'format:markdown': 'remark . --output',
    'format:markdown:check': 'remark . --frail',
  };

  if (hasCodeFormatting) {
    // Add a script that formats code blocks first, then markdown structure
    base['format:markdown:full'] = 'remark . --use @outfitter/formatting/remark-plugins/format-code-blocks --output';
  }

  return base;
}