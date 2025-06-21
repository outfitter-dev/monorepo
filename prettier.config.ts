import type { Config } from 'prettier';

const config: Config = {
  semi: true,
  singleQuote: true,
  tabWidth: 2,
  trailingComma: 'es5',
  printWidth: 100,
  arrowParens: 'avoid',
  proseWrap: 'preserve', // Don't wrap prose in markdown
};

export default config;
