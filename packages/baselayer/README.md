# @outfitter/baselayer

> Declarative development toolchain configuration orchestrator - everything you need, nothing you don't.

## Overview

`@outfitter/baselayer` provides a unified configuration system for modern development toolchains. Instead of managing separate configs for Biome, ESLint, Prettier, and VS Code, define your preferences once and let baselayer generate all the tool-specific configurations.

## Features

- **Declarative Configuration**: Define your code style preferences once
- **Tool Orchestration**: Automatically configures Biome, ESLint, Prettier, and VS Code
- **Zero Dependencies**: Uses peer dependencies for actual tools
- **Exact Syntax Overrides**: Tool-specific tweaks using exact tool syntax
- **Type Safe**: Full TypeScript support with comprehensive types

## Installation

```bash
pnpm add -D @outfitter/baselayer
```

Peer dependencies (install the tools you want to use):
```bash
pnpm add -D @biomejs/biome eslint prettier
```

## Quick Start

1. **Create configuration file** at `.outfitter/config.jsonc`:

```jsonc
{
  // High-level preferences
  "codeStyle": {
    "indentWidth": 2,
    "lineWidth": 100,
    "quoteStyle": "single",
    "trailingCommas": "all",
    "semicolons": "always"
  },
  "strictness": "strict",
  "environment": "typescript-react",
  
  // Tool selection
  "baselayer": {
    "tools": {
      "typescript": "biome",
      "javascript": "biome", 
      "json": "biome",
      "markdown": "rightdown",
      "css": "prettier",
      "yaml": "prettier"
    },
    "features": {
      "gitHooks": true,
      "vscode": true,
      "ignore": "unified"
    }
  }
}
```

2. **Run setup**:

```typescript
import { setup } from '@outfitter/baselayer';

const result = await setup();
if (result.success) {
  console.log('Generated:', result.data.generatedFiles);
} else {
  console.error('Setup failed:', result.error.message);
}
```

## Configuration

### Code Style

Define your preferences once, applied to all tools:

```jsonc
{
  "codeStyle": {
    "indentWidth": 2,        // Spaces for indentation
    "lineWidth": 100,        // Maximum line length
    "quoteStyle": "single",  // 'single' | 'double'
    "trailingCommas": "all", // 'none' | 'es5' | 'all'
    "semicolons": "always"   // 'always' | 'never'
  }
}
```

### Tool Selection

Choose which tool handles which file types:

```jsonc
{
  "baselayer": {
    "tools": {
      "typescript": "biome",   // or "eslint"
      "javascript": "biome",   // or "eslint" 
      "json": "biome",         // or "prettier"
      "markdown": "rightdown",  // or "prettier"
      "css": "prettier",       // only prettier supported
      "yaml": "prettier"       // only prettier supported
    }
  }
}
```

### Strictness Levels

Control how strict your linting rules are:

- **`"relaxed"`**: Warnings instead of errors, allows more flexibility
- **`"strict"`**: Standard enforcement (default)
- **`"pedantic"`**: Maximum strictness, no `any` types allowed

### Tool-Specific Overrides

Use exact tool syntax for specific needs:

```jsonc
{
  "overrides": {
    "biome": {
      // Exact biome.json syntax
      "linter": {
        "rules": {
          "suspicious": {
            "noConsole": "off" // CLI tools need console.log
          }
        }
      }
    },
    "prettier": {
      // Exact .prettierrc syntax
      "overrides": [
        {
          "files": "*.md",
          "options": {
            "printWidth": 80,
            "proseWrap": "always"
          }
        }
      ]
    }
  }
}
```

## Generated Files

Based on your configuration, baselayer generates:

- `biome.json` - Biome configuration
- `eslint.config.js` - ESLint bridge for gap coverage
- `.prettierrc` - Prettier configuration (when needed)
- `.rightdown.config.jsonc` - rightdown configuration (when needed)
- `.vscode/settings.json` - VS Code/Cursor settings
- Updates `package.json` scripts

## API

### `setup(options)`

Main setup function that reads config and generates all tool configurations.

```typescript
interface SetupOptions {
  cwd?: string;           // Working directory
  configPath?: string;    // Custom config file path
  dryRun?: boolean;       // Don't write files, just validate
}

interface SetupResult {
  config: OutfitterConfig;     // Final resolved configuration
  generatedFiles: string[];    // List of files that were generated
}
```

### `DEFAULT_CONFIG`

The default configuration object, useful for extending:

```typescript
import { DEFAULT_CONFIG } from '@outfitter/baselayer';

const myConfig = {
  ...DEFAULT_CONFIG,
  codeStyle: {
    ...DEFAULT_CONFIG.codeStyle,
    lineWidth: 120
  }
};
```

## Integration

### With @outfitter/cli

The `@outfitter/cli` package can use baselayer for the `equip` command:

```bash
outfitter equip --baselayer
```

### With Package Scripts

After setup, use the generated scripts:

```bash
pnpm lint      # Biome + ESLint bridge + rightdown (as configured)
pnpm format    # Biome + Prettier (as needed)
pnpm lint:fix  # Auto-fix all issues (including markdown)
```

## Philosophy

Baselayer follows the principle "everything you need, nothing you don't":

- **Declarative over imperative**: Describe what you want, not how to configure each tool
- **Tool coordination**: Ensures tools work together without conflicts  
- **Escape hatches**: Use exact tool syntax when you need specific behavior
- **Type safety**: Comprehensive TypeScript types prevent configuration errors

## License

MIT