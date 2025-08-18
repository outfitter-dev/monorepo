/**

- @type {import('eslint').Linter.FlatConfig[]}
 */
import biome from 'eslint-config-biome';

export default [
  // Ignore files handled by Biome and templates
  {
    ignores: [
      // Files handled by Biome
      '**/*.js',
      '**/*.jsx',
      '**/*.ts',
      '**/*.tsx',
      '**/*.json',
      '**/*.jsonc',
      // Generated files
      '**/dist/**',
      '**/build/**',
      // Template files that contain intentional duplicates/examples
      'packages/fieldguides/content/templates/**',
      'packages/fieldguides/scripts/**',
    ],
  },

  // Use Biome's config to disable all rules already covered by Biome
  biome,

  // Only enable critical rules that Biome doesn't have
  {
    rules: {
      // Currently no additional rules needed
      // This space is reserved for rules that Biome doesn't support
      // Example: Import restrictions (until Biome v2 glob patterns)
      // 'import/no-restricted-imports': ['error', {
      //   patterns: ['**/internal/**', '!**/*.types']
      // }],
    },
  },
];
