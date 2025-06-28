/**
 * Package.json scripts generator
 */

import type { FormatterType } from '../types/index.js';
import { getPrettierScripts } from './prettier.js';
import { getBiomeScripts } from './biome.js';
import { getRemarkScripts } from './remark.js';
import { getEslintScripts } from './eslint.js';

/**
 * Generate package.json scripts for formatters
 */
export function generatePackageJsonScripts(
  formatters: Array<FormatterType>,
): Record<string, string> {
  const scripts: Record<string, string> = {};

  // Generate individual formatter scripts
  for (const formatter of formatters) {
    switch (formatter) {
      case 'prettier':
        Object.assign(scripts, getPrettierScripts());
        break;
      case 'biome':
        Object.assign(scripts, getBiomeScripts());
        break;
      case 'remark':
        Object.assign(scripts, getRemarkScripts());
        break;
      case 'eslint':
        Object.assign(scripts, getEslintScripts());
        break;
    }
  }

  // Generate combined scripts if multiple formatters
  if (formatters.length > 1) {
    const formatCommands = [];
    const checkCommands = [];

    if (formatters.includes('prettier')) {
      formatCommands.push('pnpm format:prettier');
      checkCommands.push('pnpm format:prettier:check');
    }

    if (formatters.includes('biome')) {
      formatCommands.push('pnpm format:biome');
      checkCommands.push('pnpm format:biome:check');
    }

    if (formatters.includes('remark')) {
      formatCommands.push('pnpm format:markdown');
      checkCommands.push('pnpm format:markdown:check');
    }

    if (formatCommands.length > 0) {
      scripts.format = formatCommands.join(' && ');
      scripts['format:check'] = checkCommands.join(' && ');
    }
  } else if (formatters.length === 1) {
    // Single formatter - create simple aliases
    const formatter = formatters[0];
    switch (formatter) {
      case 'prettier':
        scripts.format = 'prettier --write .';
        scripts['format:check'] = 'prettier --check .';
        break;
      case 'biome':
        scripts.format = 'biome format --write .';
        scripts['format:check'] = 'biome format .';
        scripts.lint = 'biome lint .';
        scripts['lint:fix'] = 'biome lint --write .';
        break;
      case 'remark':
        scripts.format = 'remark . --output';
        scripts['format:check'] = 'remark . --frail';
        break;
      case 'eslint':
        // ESLint doesn't have format aliases when used alone
        break;
    }
  }

  return scripts;
}
