import type { Linter } from 'eslint';

/**
 * Legacy ESLint configuration for projects not yet using flat config
 * @deprecated Use the modern flat config with eslint.config.mjs instead
 */
export const legacyConfig: Linter.Config = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  settings: {
    react: {
      version: 'detect',
    },
    'import/resolver': {
      typescript: {
        alwaysTryTypes: true,
        project: ['./tsconfig.json', './packages/*/tsconfig.json', './apps/*/tsconfig.json'],
      },
    },
  },
  env: {
    browser: true,
    es6: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:jsx-a11y/recommended',
    'plugin:import/recommended',
    'plugin:import/typescript',
  ],
  plugins: ['@typescript-eslint', 'react', 'react-hooks', 'jsx-a11y', 'import'],
  rules: {
    // TypeScript specific rules
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-non-null-assertion': 'error',

    // React specific rules
    'react/react-in-jsx-scope': 'off', // Not needed in React 17+
    'react/prop-types': 'off', // Using TypeScript instead
    'react/jsx-uses-react': 'off', // Not needed in React 17+
    'react/jsx-uses-vars': 'error',
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',

    // General rules
    'no-console': 'warn',
    'no-debugger': 'error',
    'no-throw-literal': 'error',
    'prefer-const': 'error',
    'no-var': 'error',

    // Import rules
    'import/no-unresolved': 'error',
    'import/order': [
      'warn',
      {
        groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
        'newlines-between': 'always',
        alphabetize: {
          order: 'asc',
          caseInsensitive: true,
        },
      },
    ],

    // Accessibility rules
    'jsx-a11y/alt-text': 'error',
    'jsx-a11y/aria-props': 'error',
    'jsx-a11y/aria-proptypes': 'error',
    'jsx-a11y/aria-unsupported-elements': 'error',
    'jsx-a11y/role-has-required-aria-props': 'error',
    'jsx-a11y/role-supports-aria-props': 'error',
  },
  overrides: [
    {
      files: ['*.test.ts', '*.test.tsx', '*.spec.ts', '*.spec.tsx'],
      env: {
        jest: true,
      },
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        'no-console': 'off',
      },
    },
    {
      files: ['*.config.js', '*.config.ts'],
      rules: {
        'import/no-default-export': 'off',
      },
    },
  ],
};

/**
 * Generate ESLint configuration based on preset options
 */
export function generate(
  presetConfig: {
    typescript?: boolean;
    react?: boolean;
    node?: boolean;
    strictness?: 'relaxed' | 'standard' | 'strict';
    imports?: boolean;
    accessibility?: boolean;
  } = {},
) {
  const {
    typescript = true,
    react = true,
    node = true,
    strictness = 'standard',
    imports = true,
    accessibility = true,
  } = presetConfig;

  const config: Linter.Config = {
    env: {
      browser: react,
      es6: true,
      node,
    },
    extends: ['eslint:recommended'],
    plugins: [],
    rules: {
      // General rules
      'no-debugger': 'error',
      'no-throw-literal': 'error',
      'prefer-const': 'error',
      'no-var': 'error',
    },
  };

  // TypeScript configuration
  if (typescript) {
    config.parser = '@typescript-eslint/parser';
    config.parserOptions = {
      ecmaVersion: 2022,
      sourceType: 'module',
      ecmaFeatures: react ? { jsx: true } : {},
    };
    if (Array.isArray(config.extends)) {
      config.extends.push('plugin:@typescript-eslint/recommended');
    }
    config.plugins = ['@typescript-eslint'];

    // TypeScript rules based on strictness
    const tsRules: Record<string, unknown> = {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    };

    if (strictness === 'strict') {
      tsRules['@typescript-eslint/no-explicit-any'] = 'error';
      tsRules['@typescript-eslint/no-non-null-assertion'] = 'error';
      if (config.rules) {
        config.rules['no-console'] = 'error';
      }
    } else if (strictness === 'relaxed') {
      tsRules['@typescript-eslint/no-explicit-any'] = 'warn';
      tsRules['@typescript-eslint/no-non-null-assertion'] = 'warn';
      if (config.rules) {
        config.rules['no-console'] = 'off';
      }
    } else {
      // standard
      tsRules['@typescript-eslint/no-explicit-any'] = 'error';
      tsRules['@typescript-eslint/no-non-null-assertion'] = 'error';
      if (config.rules) {
        config.rules['no-console'] = 'warn';
      }
    }

    if (config.rules) {
      Object.assign(config.rules, tsRules);
    }
  }

  // React configuration
  if (react) {
    config.settings = {
      react: { version: 'detect' },
    };
    if (Array.isArray(config.extends)) {
      config.extends.push('plugin:react/recommended', 'plugin:react-hooks/recommended');
    }
    config.plugins = [...(config.plugins || []), 'react', 'react-hooks'];

    const reactRules = {
      'react/react-in-jsx-scope': 'off', // Not needed in React 17+
      'react/prop-types': 'off', // Using TypeScript instead
      'react/jsx-uses-react': 'off', // Not needed in React 17+
      'react/jsx-uses-vars': 'error',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    };

    if (config.rules) {
      Object.assign(config.rules, reactRules);
    }
  }

  // Import organization
  if (imports && typescript) {
    if (Array.isArray(config.extends)) {
      config.extends.push('plugin:import/recommended', 'plugin:import/typescript');
    }
    config.plugins = [...(config.plugins || []), 'import'];
    config.settings = {
      ...config.settings,
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
          project: ['./tsconfig.json', './packages/*/tsconfig.json', './apps/*/tsconfig.json'],
        },
      },
    };

    if (config.rules) {
      config.rules['import/no-unresolved'] = 'error';
      config.rules['import/order'] = [
        'warn',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
          'newlines-between': 'always',
          alphabetize: {
            order: 'asc',
            caseInsensitive: true,
          },
        },
      ];
    }
  }

  // Accessibility
  if (accessibility && react) {
    if (Array.isArray(config.extends)) {
      config.extends.push('plugin:jsx-a11y/recommended');
    }
    config.plugins = [...(config.plugins || []), 'jsx-a11y'];

    const a11yRules = {
      'jsx-a11y/alt-text': 'error',
      'jsx-a11y/aria-props': 'error',
      'jsx-a11y/aria-proptypes': 'error',
      'jsx-a11y/aria-unsupported-elements': 'error',
      'jsx-a11y/role-has-required-aria-props': 'error',
      'jsx-a11y/role-supports-aria-props': 'error',
    };

    if (config.rules) {
      Object.assign(config.rules, a11yRules);
    }
  }

  // Test file overrides
  config.overrides = [
    {
      files: ['*.test.ts', '*.test.tsx', '*.spec.ts', '*.spec.tsx'],
      env: { jest: true },
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        'no-console': 'off',
      },
    },
    {
      files: ['*.config.js', '*.config.ts'],
      rules: {
        'import/no-default-export': 'off',
      },
    },
  ];

  return config;
}

// Default export for the legacy config
export default legacyConfig;
