# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

This is the `@outfitter/husky-config` package - a configuration and initialization utility for Husky Git hooks in Outfitter projects. It provides standard Git hooks for code quality enforcement, including commit message linting and pre-commit checks.

## Key Commands

### Development

```bash
# Build the package
pnpm build

# Watch mode for development
pnpm dev

# Type checking
pnpm typecheck
```

## Architecture

### Package Structure

- `src/index.ts` - Main entry point with initialization functions
- `hooks/` - Pre-configured Git hook scripts
  - `pre-commit` - Runs lint-staged for code formatting and linting
  - `commit-msg` - Runs commitlint for conventional commit enforcement

### Exported Functions

- `initHusky(options)` - Initialize Husky in a project
  - Runs `npx husky init`
  - Copies selected hooks to `.husky` directory
  - Sets proper permissions on hook scripts
- `addPrepareScript(packageJsonPath)` - Adds the `prepare` script to package.json
  - Ensures Husky is installed on `npm install`

### Hook Scripts

1. **pre-commit**: Executes `lint-staged` to run formatters and linters on staged files
2. **commit-msg**: Executes `commitlint` to ensure commit messages follow conventional format

## Usage Pattern

This package is typically used during project initialization:

```typescript
import { initHusky, addPrepareScript } from '@outfitter/husky-config';

// Initialize husky with both hooks
initHusky({
  cwd: '/path/to/project',
  hooks: ['pre-commit', 'commit-msg'],
});

// Add prepare script
addPrepareScript();
```

## Build Configuration

Uses `tsup` to build:

- Both CJS and ESM formats
- TypeScript declarations included
- Hook scripts are included as static files

## Important Notes

- This package standardizes Git hooks across Outfitter projects
- Requires `lint-staged` and `commitlint` to be configured separately in the target project
- The `prepare` script ensures Husky is installed when developers clone the repo
- Hook scripts must be executable (chmod +x is handled by the init function)
