# @outfitter/baselayer

Foundation layer for development tooling - code quality, configs, and build orchestration.

## Overview

Baselayer brings together best-in-class tools for code quality:

- **Biome** (via Ultracite) - Fast JS/TS formatting
- **Oxlint** - Lightning-fast JS/TS linting
- **Prettier** - Formatting for non-JS/TS files
- **markdownlint-cli2** - Markdown linting
- **Stylelint** - CSS/SCSS/Less linting
- **Lefthook** - Git hooks management

### TypeScript configs

Use as `extends` in `tsconfig.json`:

```json
{
  "extends": "@outfitter/baselayer/typescript/base"
}
```

Available variants:

- `@outfitter/baselayer/typescript/base`
- `@outfitter/baselayer/typescript/next`
- `@outfitter/baselayer/typescript/vite`

## Installation

```bash
# Using bun (recommended)
bun add -D @outfitter/baselayer

# Using npm
npm install -D @outfitter/baselayer
```

## Quick Start

```bash
# Initialize Baselayer in your project
bunx @outfitter/baselayer init
# Or using the baselayer command directly
baselayer init

# Or with npm
npx @outfitter/baselayer init
```

## Commands

### `baselayer init`

Initialize formatting and linting tools in your project.

Options:

- `-y, --yes` - Skip prompts and use defaults
- `--dry-run` - Show what would happen without making changes
- `--keep-existing` - Keep existing configurations
- `--no-stylelint` - Skip Stylelint setup
- `--no-git-hooks` - Skip git hooks setup
- `--monorepo` - Configure for monorepo structure
- `--keep-prettier` - Keep Prettier for all files

### `baselayer clean`

Remove old configuration files (creates backup first).

Options:

- `--force` - Skip confirmation prompt

### `baselayer doctor`

Diagnose configuration issues and suggest fixes.

## What It Does

1. **Detects** existing ESLint, Prettier, and other tool configurations
2. **Backs up** your current setup to a markdown file
3. **Installs** and configures modern, fast tools
4. **Removes** old, slow tools (with your permission)
5. **Updates** package.json scripts for the new workflow
6. **Configures** VS Code for optimal developer experience

## Licence

MIT
