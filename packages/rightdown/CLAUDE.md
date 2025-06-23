# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

This is the `rightdown` package - a unified Markdown formatter that orchestrates code block formatting tools (Prettier, Biome) within markdown files. The CLI command is `rightdown`.

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
node dist/cli.js init                      # Create config (.rightdown.config.yaml)
node dist/cli.js                          # Format all markdown files (dry run)
node dist/cli.js --write                  # Format all markdown files in place
node dist/cli.js README.md --write        # Format specific file
node dist/cli.js --check                  # Check if files are formatted
```

## Architecture

### Package Structure

- `src/cli.ts` - CLI entry point with format and init commands
- `src/core/` - Core functionality
  - `config-reader.ts` - Reads and validates .rightdown.config.yaml
  - `config-compiler.ts` - Generates tool-specific configs
  - `orchestrator.ts` - Coordinates formatters
  - `types.ts` - TypeScript types and interfaces
- `src/formatters/` - Formatter integrations
  - `base.ts` - IFormatter interface
  - `prettier.ts` - Prettier integration
  - `biome.ts` - Biome integration
- `src/processors/` - Markdown processing
  - `ast.ts` - AST-based code block extraction/replacement
- `src/commands/` - CLI commands
  - `format.ts` - Format command implementation
  - `init.ts` - Init command implementation

### Key Design Decisions

1. **Unified formatter orchestrator** - Coordinates multiple code formatters
2. **AST-based processing** - Uses remark/unified for reliable code block handling
3. **Peer dependencies** - Prettier and Biome are optional peer deps
4. **Result pattern** - All functions use Result<T, AppError> for error handling
5. **Language routing** - Different formatters for different languages

### How It Works

1. CLI parses arguments (format command by default, or init)
2. Config reader loads and validates .rightdown.config.yaml
3. AST processor extracts code blocks from markdown
4. Orchestrator routes each block to appropriate formatter
5. Formatted code blocks are replaced back in the markdown
6. Result is written back to file (if --write) or stdout

### Configuration Format

```yaml
# .rightdown.config.yaml
version: 2
preset: standard  # or strict, relaxed

# Language routing
formatters:
  default: prettier
  languages:
    javascript: biome
    typescript: biome
    json: biome

# Formatter options
formatterOptions:
  prettier:
    printWidth: 80
  biome:
    indentWidth: 2
```

## Usage Patterns

### As a CLI Tool

The primary use case:

```bash
# Initialize config
rightdown init

# Format files (dry run)
rightdown

# Format in place
rightdown --write

# Check formatting
rightdown --check
```

### As a Library

For programmatic usage:

```typescript
import { Orchestrator, ConfigReader } from '@outfitter/rightdown';
import { PrettierFormatter, BiomeFormatter } from '@outfitter/rightdown';

// Read config
const configReader = new ConfigReader();
const configResult = await configReader.read('.rightdown.config.yaml');

// Set up formatters
const formatters = new Map([
  ['prettier', new PrettierFormatter()],
  ['biome', new BiomeFormatter()],
]);

// Create orchestrator
const orchestrator = new Orchestrator({
  config: configResult.data,
  formatters,
});

// Format markdown
const result = await orchestrator.format(markdownContent);
```

## Important Notes

- Version 2.0 is a unified formatter orchestrator for code blocks in markdown
- Prettier and Biome are peer dependencies - install only what you need
- All functions use the Result pattern for error handling
- Code blocks with unsupported languages fall back to default formatter
- Fence style (``` vs ~~~) and length are preserved during formatting

## Future Enhancements

- Additional formatter integrations (ESLint, dprint, etc.)
- Parallel processing for large files
- Watch mode for development
- VSCode extension integration
- GitHub Action wrapper
