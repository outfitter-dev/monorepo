# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

This is the `rightdown` package - an opinionated wrapper around `markdownlint-cli2` that provides presets and custom rules for markdown linting and formatting. The CLI command is `rightdown`.

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

### Testing the CLI

```bash
# Build first
pnpm build

# Test commands (or use 'rightdown' after global install)
node dist/cli.js --init                    # Create config (.rightdown.config.yaml)
node dist/cli.js README.md                 # Check a file
node dist/cli.js --fix "**/*.md"          # Fix all markdown
node dist/cli.js --preset strict          # Use strict preset
```

## Architecture

### Package Structure

- `src/cli.ts` - CLI wrapper that configures and calls markdownlint-cli2
- `src/presets.ts` - Built-in presets (strict, standard, relaxed) as YAML strings
- `src/config-generator.ts` - Helper to generate configs with custom rules
- `src/rules/consistent-terminology.js` - Custom markdownlint rule (CommonJS)
- `src/index.ts` - Library exports

### Key Design Decisions

1. **Built on markdownlint-cli2** - We don't reinvent the wheel, just add value
2. **Presets as YAML** - Direct compatibility with markdownlint config format
3. **Custom rules as CommonJS** - Required by markdownlint's rule loader
4. **Thin wrapper** - Minimal code, maximum compatibility
5. **Zero config default** - Works immediately with sensible defaults

### How It Works

1. CLI parses arguments and determines if a preset should be used
2. If no config exists, creates a temporary one from the preset
3. Passes everything to markdownlint-cli2
4. Cleans up temporary files on exit

### Custom Rules

Custom rules follow markdownlint's format:

```javascript
module.exports = {
  names: ['MD100', 'rule-name'],
  description: 'Rule description',
  tags: ['category'],
  function: function rule(params, onError) {
    // Rule implementation
  },
};
```

## Usage Patterns

### As a CLI Tool

The primary use case - provides immediate value with zero config:

```bash
# Just works
npx @outfitter/rightdown

# With options
npx @outfitter/rightdown --fix --preset strict
```

### As a Library

For programmatic usage:

```typescript
import { markdownlintCli2 } from '@outfitter/rightdown';
import { generateConfig } from '@outfitter/rightdown';

// Generate a config
const config = generateConfig({
  preset: 'strict',
  terminology: [{ incorrect: 'NPM', correct: 'npm' }],
});

// Run markdownlint-cli2
await markdownlintCli2({ config, fix: true });
```

## Important Notes

- The package is a thin wrapper - most functionality comes from markdownlint-cli2
- Custom rules must be CommonJS modules for compatibility
- Presets are just YAML strings that get written to temp files if needed
- All markdownlint-cli2 options are supported
- Config files are compatible with VS Code's markdownlint extension

## Future Enhancements

- More custom rules (spell check, inclusive language, etc.)
- GitHub Action wrapper
- Integration with other Outfitter tools
- Config migration tool from other linters
