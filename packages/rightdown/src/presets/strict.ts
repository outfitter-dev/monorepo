import type { MdlintConfig } from '../types.js';

export const strictConfig: MdlintConfig = {
  extends: null,
  default: true,
  // heading-style - Heading style (atx)
  MD003: { style: 'atx' },
  // ul-style - Unordered list style (dash)
  MD004: { style: 'dash' },
  // ul-indent - Unordered list indentation (indent: 2)
  MD007: { indent: 2 },
  // line-length - Line length (disabled - prose should not be hard-wrapped)
  MD013: false,
  // no-duplicate-heading - Multiple headings with the same content (siblings_only: true)
  MD024: { siblings_only: true },
  // ol-prefix - Ordered list item prefix (style: ordered)
  MD029: { style: 'ordered' },
  // hr-style - Horizontal rule style (style: ---)
  MD035: { style: '---' },
  // code-block-style - Code block style (style: fenced)
  MD046: { style: 'fenced' },
  // code-fence-style - Code fence style (style: backtick)
  MD048: { style: 'backtick' },
  // emphasis-style - Emphasis style (style: underscore)
  MD049: { style: 'underscore' },
  // strong-style - Strong style (style: asterisk)
  MD050: { style: 'asterisk' },
  ignores: ['node_modules/**', '.git/**', 'dist/**', 'build/**', 'coverage/**', '*.min.md'],
};

export const strict = {
  name: 'strict' as const,
  description: 'Strictest markdown standards',
  config: strictConfig,
};
