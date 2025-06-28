/**
 * Remark preset exports
 */

export { standard } from './standard.js';
export { strict } from './strict.js';
export { relaxed } from './relaxed.js';

import type { RemarkConfigOptions, RemarkConfig } from '../types.js';
import { standard } from './standard.js';
import { strict } from './strict.js';
import { relaxed } from './relaxed.js';

/**
 * Generate a remark configuration based on preset and options
 */
export function generate(options: RemarkConfigOptions = {}): RemarkConfig {
  const { preset = 'standard', additionalPlugins = [], settings = {} } = options;

  let baseConfig: RemarkConfig;

  switch (preset) {
    case 'strict':
      baseConfig = strict;
      break;
    case 'relaxed':
      baseConfig = relaxed;
      break;
    case 'standard':
    default:
      baseConfig = standard;
      break;
  }

  return {
    plugins: [...(baseConfig.plugins || []), ...additionalPlugins],
    settings: {
      ...baseConfig.settings,
      ...settings,
    },
  };
}
