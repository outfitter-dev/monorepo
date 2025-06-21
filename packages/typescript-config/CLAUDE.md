# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

This is the `@outfitter/typescript-config` package - shared TypeScript configurations for Outfitter projects. It provides strict, opinionated TypeScript configs optimized for different project types (base, Next.js, Vite).

## Key Commands

### Development

```bash
# No build needed (JSON-only package)
pnpm build

# Type checking (validates the configs)
pnpm type-check
```

## Architecture

### Configuration Files

- `base.json` - Strict base configuration for all TypeScript projects
- `next.json` - Extends base with Next.js-specific settings
- `vite.json` - Extends base with Vite-specific settings

### Base Configuration Features

- **Target**: ES2022 with ES2023 lib features
- **Strict Mode**: All strict flags enabled
  - `strict: true` (enables all strict type checking)
  - `noUncheckedIndexedAccess: true` (safer array/object access)
  - `exactOptionalPropertyTypes: true` (stricter optional properties)
- **Module System**: ESNext modules with bundler resolution
- **Path Mapping**: `@/*` mapped to `./src/*`
- **Compilation**:
  - `noEmit: true` by default (for type checking only)
  - `composite: true` (for project references)
  - `incremental: true` (faster rebuilds)

### Framework-Specific Configs

1. **Next.js** (`next.json`):

   - `jsx: "preserve"` (Next.js handles JSX transformation)
   - Includes Next.js TypeScript plugin
   - Includes Next.js type definitions

2. **Vite** (`vite.json`):
   - `jsx: "react-jsx"` (modern JSX transform)
   - Includes Vite client types

## Usage Patterns

Projects extend these configs in their `tsconfig.json`:

### Base TypeScript Project

```json
{
  "extends": "@outfitter/typescript-config/base",
  "compilerOptions": {
    "outDir": "./dist"
  },
  "include": ["src"]
}
```

### Next.js Project

```json
{
  "extends": "@outfitter/typescript-config/next"
}
```

### Vite React Project

```json
{
  "extends": "@outfitter/typescript-config/vite",
  "include": ["src"]
}
```

## Important Configuration Choices

- **Strictest Settings**: This config enables the strictest TypeScript settings for maximum type safety
- **No Emit by Default**: Projects must override `noEmit` if they need to emit JavaScript
- **Bundler Module Resolution**: Optimized for modern bundlers (Vite, webpack, etc.)
- **Composite Projects**: Enables TypeScript project references for monorepo setups
- **Verbatim Module Syntax**: Ensures imports/exports are preserved as written

## Notes

- This is a JSON-only package (no TypeScript code)
- Projects can override any setting by specifying it in their own `tsconfig.json`
- The configs are designed to catch as many potential errors as possible at compile time
- All configs exclude common build directories (`node_modules`, `dist`, `build`, `.next`)
