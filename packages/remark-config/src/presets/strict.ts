/**
 * Strict remark preset for rigorous markdown linting and formatting
 */

import type { RemarkConfig } from '../types.js';

export const strict: RemarkConfig = {
  plugins: [
    // Base preset
    'remark-preset-lint-recommended',

    // List formatting - strict consistency
    ['remark-lint-unordered-list-marker-style', '-'],

    // Heading style - ATX only
    ['remark-lint-heading-style', 'atx'],

    // Shorter line length for strict formatting
    ['remark-lint-maximum-line-length', 80],

    // Prevent duplicate headings
    'remark-lint-no-duplicate-headings',

    // Additional strict rules would go here
    // Note: These would need to be added as dependencies when available
    // 'remark-lint-no-trailing-spaces',
    // 'remark-lint-final-newline',
    // 'remark-lint-no-multiple-toplevel-headings',
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
