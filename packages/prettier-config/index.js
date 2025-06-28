/** @type {import("prettier").Config} */
const config = {
  printWidth: 80, // Align with proposal standard
  semi: true,
  singleQuote: true,
  tabWidth: 2,
  trailingComma: 'all',
  useTabs: false,
};

/**
 * Generate a Prettier configuration based on preset config
 * @param {object} presetConfig - Configuration from @outfitter/formatting preset
 * @returns {import("prettier").Config} Prettier configuration
 */
function generate(presetConfig = {}) {
  const base = { ...config };

  if (presetConfig.indentation) {
    base.tabWidth = presetConfig.indentation.width || base.tabWidth;
    base.useTabs = presetConfig.indentation.style === 'tab';
  }

  if (presetConfig.lineWidth) {
    base.printWidth = presetConfig.lineWidth;
  }

  if (presetConfig.quotes) {
    base.singleQuote = presetConfig.quotes.style === 'single';
    base.jsxSingleQuote = presetConfig.quotes.jsx === 'single';
  }

  if (presetConfig.semicolons !== undefined) {
    base.semi = presetConfig.semicolons === 'always' || presetConfig.semicolons === true;
  }

  if (presetConfig.trailingComma) {
    base.trailingComma = presetConfig.trailingComma;
  }

  if (presetConfig.bracketSpacing !== undefined) {
    base.bracketSpacing = presetConfig.bracketSpacing;
  }

  if (presetConfig.arrowParens) {
    base.arrowParens = presetConfig.arrowParens === 'asNeeded' ? 'avoid' : presetConfig.arrowParens;
  }

  if (presetConfig.endOfLine) {
    base.endOfLine = presetConfig.endOfLine;
  }

  return base;
}

// Export both the static config and generator function
module.exports = config;
module.exports.generate = generate;
