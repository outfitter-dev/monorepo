import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  eslint.configs.recommended,

  // Use strict configs for full type safety
  ...tseslint.configs.strict,
  ...tseslint.configs.stylistic,

  {
    languageOptions: {
      globals: {
        // Node.js globals
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        global: 'readonly',
        require: 'readonly',
        module: 'readonly',
        exports: 'readonly',
      },
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },

  {
    rules: {
      // Type Safety Enforcement - STRICT
      '@typescript-eslint/no-unsafe-assignment': 'error',
      '@typescript-eslint/no-unsafe-member-access': 'error',
      '@typescript-eslint/no-unsafe-call': 'error',
      '@typescript-eslint/no-unsafe-return': 'error',
      '@typescript-eslint/no-unsafe-argument': 'error',

      // Modern Best Practices - STRICT
      '@typescript-eslint/explicit-module-boundary-types': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/prefer-nullish-coalescing': 'error',
      '@typescript-eslint/prefer-optional-chain': 'error',
      '@typescript-eslint/prefer-readonly': 'error',
      '@typescript-eslint/prefer-as-const': 'error',

      // Type Import Consistency
      '@typescript-eslint/consistent-type-imports': [
        'error',
        {
          prefer: 'type-imports',
          fixStyle: 'inline-type-imports',
        },
      ],
      '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
      '@typescript-eslint/array-type': ['error', { default: 'generic' }],

      // Disallow require() - use ES modules
      '@typescript-eslint/no-require-imports': 'error',

      // Allow empty catch blocks with comments (common for file existence checks)
      'no-empty': ['error', { allowEmptyCatch: true }],

      // Modern Naming Conventions (no I prefix)
      '@typescript-eslint/naming-convention': [
        'error',
        {
          selector: 'interface',
          format: ['PascalCase'],
          custom: {
            regex: '^[A-Z][A-Za-z]*(?<!Interface)$',
            match: true,
          },
        },
        {
          selector: 'typeAlias',
          format: ['PascalCase'],
        },
        {
          selector: 'enum',
          format: ['PascalCase'],
        },
        {
          selector: 'typeParameter',
          format: ['PascalCase'],
          prefix: ['T', 'K', 'V', 'E'], // Common generic prefixes
        },
      ],
    },
  },

  // Test file configuration
  {
    files: ['**/*.test.ts', '**/*.test.tsx', '**/*.test.js', '**/__tests__/**'],
    languageOptions: {
      globals: {
        // Jest/Vitest globals
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeAll: 'readonly',
        beforeEach: 'readonly',
        afterAll: 'readonly',
        afterEach: 'readonly',
        jest: 'readonly',
        vi: 'readonly',
        // Browser globals for testing
        document: 'readonly',
        window: 'readonly',
        HTMLElement: 'readonly',
      },
    },
  },

  // Disable type checking on JS files
  {
    files: ['**/*.js', '**/*.mjs', '**/*.cjs'],
    extends: [tseslint.configs.disableTypeChecked],
  },

  // Ignore patterns
  {
    ignores: [
      '**/dist/**',
      '**/node_modules/**',
      '**/coverage/**',
      '**/*.config.js',
      '**/*.config.ts',
      '**/outfitter/**',
      '**/*.test.ts',
      '**/*.test.tsx',
      '**/__tests__/**',
      '**/templates/**',
      '**/fieldguides/.markdownlint/**',
    ],
  }
);
