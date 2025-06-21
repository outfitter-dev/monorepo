# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

This is the `@outfitter/changeset-config` package - a configuration and initialization utility for Changesets in Outfitter projects. It provides a default Changesets configuration and helper functions to set up Changesets in monorepos or single-package repos.

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
- `config/config.json` - Default Changesets configuration
- Uses `tsup` for building both CJS and ESM formats

### Exported Functions

- `initChangesets(options)` - Initialize Changesets in a project
  - Creates `.changeset` directory
  - Copies and customizes config based on options
  - Creates README for the changeset directory
- `addChangesetScripts(packageJsonPath)` - Adds changeset-related scripts to package.json
  - Adds `changeset`, `changeset:version`, and `changeset:publish` scripts

### Configuration Options

The default config includes:

- `changelog`: Uses default changelog generator
- `commit`: false (no automatic commits)
- `access`: "public" (npm package visibility)
- `baseBranch`: "main" (base branch for versioning)
- `updateInternalDependencies`: "patch" (how to version internal deps)

## Usage Pattern

This package is typically used during project initialization:

```typescript
import {
  initChangesets,
  addChangesetScripts,
} from '@outfitter/changeset-config';

// Initialize changesets with custom options
initChangesets({
  cwd: '/path/to/project',
  access: 'public',
  baseBranch: 'main',
});

// Add scripts to package.json
addChangesetScripts();
```

## Build Configuration

Uses `tsup` to build:

- Both CJS and ESM formats
- TypeScript declarations included
- Source maps for debugging

## Important Notes

- This package helps standardize Changesets configuration across Outfitter projects
- The config is designed for monorepo workflows but works with single packages too
- It's a development dependency that sets up release management infrastructure.
