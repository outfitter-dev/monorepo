/**
 * Preset configurations for different formatting styles
 */

import type { PresetConfig } from '../types/index.js';

/**
 * Standard preset - balanced formatting for most projects
 */
export const standard: PresetConfig = {
  name: 'standard',
  lineWidth: 80,
  indentation: {
    style: 'space',
    width: 2,
  },
  quotes: {
    style: 'single',
    jsx: 'double',
  },
  semicolons: 'always',
  trailingComma: 'all',
  bracketSpacing: true,
  arrowParens: 'always',
  endOfLine: 'lf',
};

/**
 * Strict preset - rigorous formatting for documentation-heavy projects
 */
export const strict: PresetConfig = {
  name: 'strict',
  lineWidth: 80,
  indentation: {
    style: 'space',
    width: 2,
  },
  quotes: {
    style: 'single',
    jsx: 'single',
  },
  semicolons: 'always',
  trailingComma: 'all',
  bracketSpacing: true,
  arrowParens: 'always',
  endOfLine: 'lf',
};

/**
 * Relaxed preset - flexible formatting for rapid development
 */
export const relaxed: PresetConfig = {
  name: 'relaxed',
  lineWidth: 120,
  indentation: {
    style: 'space',
    width: 2,
  },
  quotes: {
    style: 'single',
    jsx: 'double',
  },
  semicolons: 'asNeeded',
  trailingComma: 'es5',
  bracketSpacing: true,
  arrowParens: 'asNeeded',
  endOfLine: 'auto',
};

/**
 * Get preset configuration by name
 */
export function getPreset(name: PresetConfig['name']): PresetConfig {
  switch (name) {
    case 'standard':
      return standard;
    case 'strict':
      return strict;
    case 'relaxed':
      return relaxed;
    default:
      throw new Error(`Unknown preset: ${name}`);
  }
}

/**
 * Get all available presets
 */
export function getAllPresets(): Record<PresetConfig['name'], PresetConfig> {
  return {
    standard,
    strict,
    relaxed,
  };
}
