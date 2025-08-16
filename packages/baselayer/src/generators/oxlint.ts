import { execSync } from 'node:child_process';
import {
  failure,
  isFailure,
  isSuccess,
  type Result,
  success,
} from '@outfitter/contracts';
import { fileExists, readJSON, writeJSON } from '../utils/file-system.js';

/**
 * Detects if ESLint configuration exists in the project
 */
async function detectEslintConfig(): Promise<boolean> {
  const eslintPatterns = [
    '.eslintrc',
    '.eslintrc.js',
    '.eslintrc.cjs',
    '.eslintrc.json',
    '.eslintrc.yaml',
    '.eslintrc.yml',
    'eslint.config.js',
    'eslint.config.mjs',
    'eslint.config.cjs',
  ];

  for (const pattern of eslintPatterns) {
    const exists = await fileExists(pattern);
    if (isSuccess(exists) && exists.data) {
      return true;
    }
  }

  return false;
}

/**
 * Generates Oxlint configuration with smart ESLint migration
 */
export async function generateOxlintConfig(): Promise<Result<void, Error>> {
  try {
    // Check if ESLint config exists for migration
    const hasEslintConfig = await detectEslintConfig();

    if (hasEslintConfig) {
      try {
        execSync('npx @oxlint/migrate', {
          stdio: 'inherit',
          env: { ...process.env, FORCE_COLOR: '1' },
        });
      } catch (_migrateError) {
        // Continue to create new config
      }
    }

    // Create new config if it doesn't exist or enhance existing one
    const configPath = '.oxlintrc.json';
    let existingConfig: Record<string, unknown> = {};

    const configExists = await fileExists(configPath);
    if (isSuccess(configExists) && configExists.data) {
      const readResult = await readJSON(configPath);
      if (isSuccess(readResult)) {
        existingConfig = readResult.data;
      }
    } else {
      // If config doesn't exist, run oxlint --init
      try {
        execSync('bunx oxlint --init', {
          stdio: 'inherit',
          env: { ...process.env, FORCE_COLOR: '1' },
        });

        // Read the generated config
        const readResult = await readJSON(configPath);
        if (isSuccess(readResult)) {
          existingConfig = readResult.data;
        }
      } catch {
        // If init fails, we'll create our own config
      }
    }

    // Enhance the config with our recommended settings
    const enhancedConfig = {
      ...existingConfig,
      plugins: [
        ...new Set([
          ...(existingConfig.plugins || []),
          'import',
          'jest',
          'vitest',
          'typescript',
          'react',
        ]),
      ],
      env: {
        browser: true,
        es2024: true,
        node: true,
        ...(existingConfig.env || {}),
      },
      rules: {
        ...(existingConfig.rules || {}),
        // Correctness
        'constructor-super': 'error',
        'for-direction': 'error',
        'getter-return': 'error',
        'no-async-promise-executor': 'error',
        'no-class-assign': 'error',
        'no-compare-neg-zero': 'error',
        'no-cond-assign': 'error',
        'no-const-assign': 'error',
        'no-constant-binary-expression': 'error',
        'no-constant-condition': 'error',
        'no-constructor-return': 'error',
        'no-control-regex': 'error',
        'no-debugger': 'error',
        'no-dupe-args': 'error',
        'no-dupe-class-members': 'error',
        'no-dupe-else-if': 'error',
        'no-dupe-keys': 'error',
        'no-duplicate-case': 'error',
        'no-duplicate-imports': 'error',
        'no-empty-character-class': 'error',
        'no-empty-pattern': 'error',
        'no-ex-assign': 'error',
        'no-fallthrough': 'error',
        'no-func-assign': 'error',
        'no-import-assign': 'error',
        'no-inner-declarations': 'error',
        'no-invalid-regexp': 'error',
        'no-irregular-whitespace': 'error',
        'no-loss-of-precision': 'error',
        'no-misleading-character-class': 'error',
        'no-new-native-nonconstructor': 'error',
        'no-obj-calls': 'error',
        'no-promise-executor-return': 'error',
        'no-prototype-builtins': 'error',
        'no-self-assign': 'error',
        'no-self-compare': 'error',
        'no-setter-return': 'error',
        'no-sparse-arrays': 'error',
        'no-this-before-super': 'error',
        'no-undef': 'error',
        'no-unexpected-multiline': 'error',
        'no-unmodified-loop-condition': 'error',
        'no-unreachable': 'error',
        'no-unreachable-loop': 'error',
        'no-unsafe-finally': 'error',
        'no-unsafe-negation': 'error',
        'no-unsafe-optional-chaining': 'error',
        'no-unused-private-class-members': 'error',
        'no-unused-vars': [
          'error',
          {
            varsIgnorePattern: '^_',
            argsIgnorePattern: '^_',
            caughtErrors: 'none',
          },
        ],
        'no-use-before-define': 'error',
        'no-useless-assignment': 'error',
        'no-useless-backreference': 'error',
        'require-yield': 'error',
        'use-isnan': 'error',
        'valid-typeof': 'error',

        // TypeScript
        '@typescript-eslint/no-explicit-any': 'warn',
        '@typescript-eslint/no-unused-vars': [
          'error',
          {
            varsIgnorePattern: '^_',
            argsIgnorePattern: '^_',
          },
        ],

        // React
        'react/jsx-no-duplicate-props': 'error',
        'react/jsx-no-undef': 'error',
        'react/jsx-uses-react': 'error',
        'react/jsx-uses-vars': 'error',
        'react/no-children-prop': 'error',
        'react/no-danger-with-children': 'error',
        'react/no-deprecated': 'warn',
        'react/no-direct-mutation-state': 'error',
        'react/no-find-dom-node': 'error',
        'react/no-is-mounted': 'error',
        'react/no-render-return-value': 'error',
        'react/no-string-refs': 'error',
        'react/no-unescaped-entities': 'error',
        'react/no-unknown-property': 'error',
        'react/require-render-return': 'error',

        // React Hooks
        'react-hooks/rules-of-hooks': 'error',
        'react-hooks/exhaustive-deps': 'warn',
      },
      overrides: [
        {
          files: ['*.test.ts', '*.test.tsx', '*.spec.ts', '*.spec.tsx'],
          rules: {
            'no-console': 'off',
          },
        },
      ],
    };

    // Write the enhanced config
    const writeResult = await writeJSON(configPath, enhancedConfig);
    if (isFailure(writeResult)) {
      return failure(new Error(writeResult.error.message));
    }
    return success(undefined);
  } catch (error) {
    const err = error as Error;
    return failure(err);
  }
}
