/**
 * Built-in presets for Rightdown
 */

export interface PresetConfig {
  rules: Record<string, unknown>;
  description?: string;
}

export const PRESETS: Record<string, PresetConfig> = {
  strict: {
    description: 'Strict preset with all rules enabled',
    rules: {
      // Document structure
      'first-line-heading': true,
      'heading-increment': true,
      'heading-style': { style: 'atx' },
      'no-missing-space-atx': true,
      'blanks-around-headings': true,

      // Lists
      'blanks-around-lists': true,
      'list-indent': true,
      'list-marker-space': true,
      'no-blanks-blockquote': true,
      'ul-style': { style: 'dash' },
      'ol-prefix': { style: 'ordered' },

      // Code blocks
      'blanks-around-fences': true,
      'fenced-code-language': true,
      'code-fence-style': { style: 'backtick' },

      // Links and references
      'no-bare-urls': true,
      'link-fragments': true,
      'reference-links-images': true,

      // Line length
      'line-length': { line_length: 100, code_blocks: false, tables: false },

      // Whitespace
      'no-trailing-spaces': true,
      'no-hard-tabs': true,
      'no-multiple-blanks': { maximum: 1 },
      'single-trailing-newline': true,

      // Content
      'no-duplicate-heading': true,
      'proper-names': {
        names: ['JavaScript', 'TypeScript', 'GitHub', 'npm', 'Node.js'],
        code_blocks: false,
      },
    },
  },

  standard: {
    description: 'Standard preset with sensible defaults',
    rules: {
      // Document structure
      'heading-increment': true,
      'heading-style': { style: 'atx' },
      'no-missing-space-atx': true,

      // Lists
      'list-indent': true,
      'list-marker-space': true,
      'ul-style': { style: 'dash' },

      // Code blocks
      'fenced-code-language': false,
      'code-fence-style': { style: 'consistent' },

      // Links
      'no-bare-urls': true,

      // Line length - disabled for flexibility
      'line-length': false,

      // Whitespace
      'no-trailing-spaces': true,
      'no-hard-tabs': false, // Allow tabs in code blocks
      'no-multiple-blanks': { maximum: 2 },
      'single-trailing-newline': true,

      // Content - more flexible
      'no-duplicate-heading': false,
    },
  },

  relaxed: {
    description: 'Relaxed preset with minimal rules',
    rules: {
      // Only essential rules
      'heading-increment': true,
      'no-missing-space-atx': true,
      'list-marker-space': true,
      'no-trailing-spaces': true,
      'single-trailing-newline': true,

      // Everything else disabled
      'line-length': false,
      'no-hard-tabs': false,
      'no-duplicate-heading': false,
      'fenced-code-language': false,
      'no-bare-urls': false,
    },
  },
};
