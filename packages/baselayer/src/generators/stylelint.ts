import { failure, isFailure, type Result, success } from '@outfitter/contracts';
import { writeFile, writeJSON } from '../utils/file-system.js';

/**

- Generates Stylelint configuration
- Configured for modern CSS with Tailwind CSS support
 */
export async function generateStylelintConfig(): Promise<Result<void, Error>> {
  try {
    const config = {
      extends: ['stylelint-config-standard', 'stylelint-config-tailwindcss'],
      rules: {
        'at-rule-no-unknown': [
          true,
          {
            ignoreAtRules: [
              'tailwind',
              'apply',
              'screen',
              'layer',
              'variants',
              'responsive',
              'component',
            ],
          },
        ],
        'function-no-unknown': [
          true,
          {
            ignoreFunctions: ['theme', 'screen'],
          },
        ],
        'selector-class-pattern': null, // Allow Tailwind's class naming
        'custom-property-pattern': null, // Allow any CSS variable naming
        'no-descending-specificity': null, // Too restrictive with utility classes
        'declaration-block-no-redundant-longhand-properties': null, // Can conflict with Tailwind
      },
      overrides: [
        {
          files: ['**/*.scss'],
          customSyntax: 'postcss-scss',
        },
        {
          files: ['**/*.less'],
          customSyntax: 'postcss-less',
        },
      ],
    };

    const ignore = [
      '# Dependencies',
      'node_modules/',
      '',
      '# Build outputs',
      'dist/',
      'build/',
      '.next/',
      'out/',
      '',
      '# Generated files',
      '*.min.css',
      '**/*.min.css',
      '',
      '# Coverage',
      'coverage/',
    ];

    // Write .stylelintrc.json
    const configResult = await writeJSON('.stylelintrc.json', config);
    if (isFailure(configResult)) {
      return failure(new Error(configResult.error.message));
    }

    // Write .stylelintignore
    const ignoreResult = await writeFile('.stylelintignore', ignore.join('\n'));
    if (isFailure(ignoreResult)) {
      return failure(new Error(ignoreResult.error.message));
    }
    return success(undefined);
  } catch (error) {
    return failure(error as Error);
  }
}
