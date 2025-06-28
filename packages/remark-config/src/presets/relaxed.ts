/**
 * Relaxed remark preset for lenient markdown linting and formatting
 */

import type { RemarkConfig } from '../types.js';

export const relaxed: RemarkConfig = {
  plugins: [
    // Minimal preset - only essential rules
    ['remark-lint-unordered-list-marker-style', '-'],
    ['remark-lint-heading-style', 'atx'],

    // Longer line length for relaxed mode
    ['remark-lint-maximum-line-length', 120],

    // Still prevent duplicate headings
    'remark-lint-no-duplicate-headings',
  ],

  settings: {
    bullet: '-',
    emphasis: '*',
    strong: '*',
    listItemIndent: 'one',
    fence: '`',
    rule: '-',
    setext: false,
  },
};
