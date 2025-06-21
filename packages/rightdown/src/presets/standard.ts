import type { MdlintConfig } from '../types.js';

export const standardConfig: MdlintConfig = {
  extends: null,
  default: true,
  // heading-style - Heading style (atx)
  MD003: { style: 'atx' },
  // ul-style - Unordered list style (dash)
  MD004: { style: 'dash' },
  // ul-indent - Unordered list indentation (indent: 2)
  MD007: { indent: 2 },
  // line-length - Line length (disabled - handled by prettier)
  MD013: false,
  // no-duplicate-heading - Multiple headings with the same content (siblings_only: true)
  MD024: { siblings_only: true },
  // ol-prefix - Ordered list item prefix (style: ordered)
  MD029: { style: 'ordered' },
  // no-inline-html - Inline HTML (disabled - allow inline HTML)
  MD033: false,
  // first-line-heading - First line in a file should be a top-level heading (disabled)
  MD041: false,
  // required-headings - Required heading structure (disabled)
  MD043: false,
  // code-block-style - Code block style (style: fenced)
  MD046: { style: 'fenced' },
  ignores: [
    'node_modules/**',
    '.git/**',
    'dist/**',
    'build/**',
    'coverage/**',
    'CHANGELOG.md',
    '*.min.md',
  ],
};

export const standard = {
  name: 'standard' as const,
  description: 'Balanced rules for technical docs',
  config: standardConfig,
};
