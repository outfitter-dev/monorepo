/**
 * Standard remark preset for balanced markdown linting and formatting
 */

import type { RemarkConfig } from '../types.js';

export const standard: RemarkConfig = {
  plugins: [
    // Base preset with sensible defaults
    'remark-preset-lint-recommended',

    // List formatting
    ['remark-lint-unordered-list-marker-style', '-'],

    // Heading style - use ATX (# ## ###) not setext (=== ---)
    ['remark-lint-heading-style', 'atx'],

    // Line length - reasonable default
    ['remark-lint-maximum-line-length', 80],

    // Prevent duplicate headings
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
