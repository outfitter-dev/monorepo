import type { MdlintConfig } from '../types.js';

export const relaxedConfig: MdlintConfig = {
  extends: null,
  default: false,
  // heading-increment - Heading levels should only increment by one level at a time
  MD001: true,
  // heading-style - Heading style (atx)
  MD003: { style: 'atx' },
  // no-trailing-spaces - Trailing spaces
  MD009: true,
  // no-hard-tabs - Hard tabs
  MD010: true,
  // no-reversed-links - Reversed link syntax
  MD011: true,
  // no-missing-space-atx - No space after hash on atx style heading
  MD018: true,
  // no-missing-space-closed-atx - No space inside hashes on closed atx style heading
  MD022: true,
  // heading-start-left - Headings must start at the beginning of the line
  MD023: true,
  // heading-single-h1 - Multiple top-level headings in the same document
  MD025: true,
  // no-trailing-punctuation - Trailing punctuation in heading
  MD031: true,
  // blanks-around-lists - Lists should be surrounded by blank lines
  MD032: true,
  // fenced-code-language - Fenced code blocks should have a language specified
  MD040: true,
  // no-empty-links - No empty links
  MD042: true,
  // no-alt-text - Images should have alternate text (alt text)
  MD045: true,
  ignores: [
    'node_modules/**',
    '.git/**',
    'dist/**',
    'build/**',
    'coverage/**',
    'vendor/**',
    'third_party/**',
    '*.generated.md',
  ],
};

export const relaxed = {
  name: 'relaxed' as const,
  description: 'Minimal rules focusing on consistency',
  config: relaxedConfig,
};
