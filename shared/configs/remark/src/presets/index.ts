/**
 * Remark preset exports
 */

export { relaxed } from './relaxed.js';
export { standard } from './standard.js';
export { strict } from './strict.js';

import type { RemarkConfig, RemarkConfigOptions } from '../types.js';
import { relaxed } from './relaxed.js';
import { standard } from './standard.js';
import { strict } from './strict.js';

/**
 * Generate a remark configuration based on preset and options
 */
export function generate(options: RemarkConfigOptions = {}): RemarkConfig {
  const {
    preset = 'standard',
    additionalPlugins = [],
    settings = {},
  } = options;

  let baseConfig: RemarkConfig;

  switch (preset) {
    case 'strict':
      baseConfig = strict;
      break;
    case 'relaxed':
      baseConfig = relaxed;
      break;
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
