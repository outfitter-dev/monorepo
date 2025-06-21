# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

This is the `@outfitter/eslint-config` package - a shared ESLint configuration for Outfitter projects. It provides a comprehensive set of linting rules for TypeScript and React projects, including accessibility and import organization rules.

## Key Commands

### Development

```bash
# Build the package
pnpm build

# Watch mode for development
pnpm dev

# Type checking
pnpm type-check
```

## Architecture

### Configuration Structure

The package exports a legacy ESLint configuration (for ESLint 8.x compatibility) that includes:

- TypeScript parsing and rules via `@typescript-eslint`
- React and React Hooks linting
- JSX accessibility rules via `jsx-a11y`
- Import organization and resolution rules

### Key Features

- **TypeScript Support**: Full TypeScript parsing with strict rules
- **React Optimization**: Configured for React 17+ (no need for React imports)
- **Accessibility**: Enforces WCAG compliance through jsx-a11y rules
- **Import Organization**: Automatic grouping and alphabetization of imports
- **Test File Overrides**: Relaxed rules for test files

### Rule Categories

1. **TypeScript Rules**:

   - No unused variables (except those prefixed with `_`)
   - No explicit `any` types
   - No non-null assertions

2. **React Rules**:

   - React Hooks rules enforced
   - PropTypes disabled (using TypeScript instead)

3. **Import Rules**:

   - Ordered imports with newlines between groups
   - Alphabetical ordering within groups

4. **Accessibility Rules**:
   - Alt text required for images
   - ARIA props validation

## Usage Pattern

Projects consume this config in their `.eslintrc.js`:

```javascript
module.exports = {
  extends: ['@outfitter/eslint-config'],
  // Additional project-specific rules
};
```

Or in modern flat config (`eslint.config.mjs`):

```javascript
import outfitterConfig from '@outfitter/eslint-config';

export default [
  outfitterConfig,
  // Additional configurations
];
```

## Important Notes

- This config is marked as deprecated in favor of ESLint flat config
- Currently configured for ESLint 8.x (legacy config format)
- The monorepo is in transition - many warnings exist that are being addressed
- Test files have relaxed rules (allows `any` and `console`)
- Config files are exempt from the no-default-export rule
