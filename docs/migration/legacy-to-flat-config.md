# ESLint: Legacy to Flat Config Migration

This guide helps you migrate from ESLint's legacy configuration format to the new flat config format.

## Overview

ESLint 9.0 introduced a new "flat config" format that replaces the traditional `.eslintrc.*` files with `eslint.config.js` (or `.mjs`). This new format is more explicit, powerful, and easier to understand.

## Key Differences

### File Names

**Legacy**:

- `.eslintrc.js`
- `.eslintrc.json`
- `.eslintrc.yml`
- `.eslintrc`

**Flat Config**:

- `eslint.config.js`
- `eslint.config.mjs` (recommended)
- `eslint.config.cjs`

### Configuration Structure

**Legacy** uses an object with specific properties:

```javascript
module.exports = {
  env: { browser: true },
  extends: ['eslint:recommended'],
  parserOptions: { ecmaVersion: 2022 },
  rules: { 'no-console': 'warn' },
};
```

**Flat Config** uses an array of configuration objects:

```javascript
export default [
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: { window: 'readonly' },
    },
    rules: { 'no-console': 'warn' },
  },
];
```

## Migration Steps

### 1. Rename Configuration File

```bash
# Rename your config file
mv .eslintrc.js eslint.config.mjs
```

### 2. Convert Basic Configuration

**Legacy `.eslintrc.js`:**

```javascript
module.exports = {
  env: {
    browser: true,
    es2022: true,
    node: true,
  },
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
  rules: {
    'no-console': 'warn',
    'no-unused-vars': 'error',
  },
};
```

**Flat Config `eslint.config.mjs`:**

```javascript
import globals from 'globals';

export default [
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.es2021,
        ...globals.node,
      },
    },
    rules: {
      'no-console': 'warn',
      'no-unused-vars': 'error',
    },
  },
];
```

### 3. Convert Extended Configurations

**Legacy with `extends`:**

```javascript
module.exports = {
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    '@outfitter/eslint-config/legacy',
  ],
  rules: {
    'no-console': 'warn',
  },
};
```

**Flat Config with imports:**

```javascript
import js from '@eslint/js';
import typescript from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import outfitterConfig from '@outfitter/eslint-config';

export default [
  js.configs.recommended,
  ...outfitterConfig,
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsParser,
    },
    plugins: {
      '@typescript-eslint': typescript,
    },
    rules: {
      ...typescript.configs.recommended.rules,
      'no-console': 'warn',
    },
  },
];
```

### 4. Convert Plugin Usage

**Legacy:**

```javascript
module.exports = {
  plugins: ['react', 'jsx-a11y'],
  extends: ['plugin:react/recommended', 'plugin:jsx-a11y/recommended'],
  settings: {
    react: {
      version: 'detect',
    },
  },
};
```

**Flat Config:**

```javascript
import react from 'eslint-plugin-react';
import jsxA11y from 'eslint-plugin-jsx-a11y';

export default [
  {
    files: ['**/*.jsx', '**/*.tsx'],
    plugins: {
      react,
      'jsx-a11y': jsxA11y,
    },
    rules: {
      ...react.configs.recommended.rules,
      ...jsxA11y.configs.recommended.rules,
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
];
```

### 5. Convert Overrides

**Legacy with overrides:**

```javascript
module.exports = {
  rules: {
    'no-console': 'error',
  },
  overrides: [
    {
      files: ['**/*.test.js'],
      env: {
        jest: true,
      },
      rules: {
        'no-console': 'off',
      },
    },
  ],
};
```

**Flat Config (naturally handles overrides):**

```javascript
import globals from 'globals';

export default [
  // Base config
  {
    rules: {
      'no-console': 'error',
    },
  },
  // Test files override
  {
    files: ['**/*.test.js'],
    languageOptions: {
      globals: {
        ...globals.jest,
      },
    },
    rules: {
      'no-console': 'off',
    },
  },
];
```

### 6. Convert Ignore Patterns

**Legacy `.eslintignore`:**

```
node_modules/
dist/
build/
*.min.js
```

**Flat Config (in `eslint.config.mjs`):**

```javascript
export default [
  {
    ignores: ['node_modules/**', 'dist/**', 'build/**', '**/*.min.js'],
  },
  // ... other configs
];
```

## Using @outfitter/eslint-config

### Legacy Usage

```javascript
// .eslintrc.js
module.exports = {
  extends: ['@outfitter/eslint-config/legacy'],
  rules: {
    // Custom overrides
  },
};
```

### Flat Config Usage

```javascript
// eslint.config.mjs
import outfitterConfig from '@outfitter/eslint-config';

export default [
  ...outfitterConfig,
  {
    rules: {
      // Custom overrides
    },
  },
];
```

## Common Gotchas

### 1. Global Ignores Must Come First

```javascript
export default [
  // ✅ Correct: ignores first
  { ignores: ['dist/**'] },
  { rules: { 'no-console': 'warn' } }
];

// ❌ Wrong: ignores after rules
export default [
  { rules: { 'no-console': 'warn' } },
  { ignores: ['dist/**'] }
];
```

### 2. Files Pattern Defaults

In flat config, if you don't specify `files`, the config applies to all files:

```javascript
export default [
  // Applies to ALL files
  { rules: { 'no-console': 'warn' } },

  // Only applies to TypeScript files
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: { '@typescript-eslint/no-explicit-any': 'error' },
  },
];
```

### 3. Plugin Names Must Match

```javascript
// ✅ Correct
import react from 'eslint-plugin-react';

export default [{
  plugins: {
    react // Key matches the prefix in rules
  },
  rules: {
    'react/jsx-uses-react': 'error'
  }
}];

// ❌ Wrong
export default [{
  plugins: {
    'my-react': react // Key doesn't match rule prefix
  },
  rules: {
    'react/jsx-uses-react': 'error' // This won't work!
  }
}];
```

## Testing Your Migration

1. **Dry run** to see what would be linted:

   ```bash
   npx eslint . --debug
   ```

2. **Check specific files**:

   ```bash
   npx eslint src/index.js --format=verbose
   ```

3. **Compare with legacy** (if both configs exist):

   ```bash
   # Using legacy
   npx eslint . --config .eslintrc.old.js

   # Using flat config
   npx eslint .
   ```

## Resources

- [ESLint Flat Config Documentation](https://eslint.org/docs/latest/use/configure/configuration-files-new)
- [ESLint Migration Guide](https://eslint.org/docs/latest/use/configure/migration-guide)
- [@outfitter/eslint-config Documentation](/packages/eslint-config/README.md)
