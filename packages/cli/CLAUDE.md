# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with
code in this repository.

## Overview

This is the `outfitter` CLI package - a command-line tool for managing Outfitter
supplies (development standards, patterns, and guides) in projects. It's part of
the `@outfitter/monorepo` and provides commands to initialize projects,
add/update supplies, and manage supply configurations (packlists).

## Key Commands

### Development

```bash
# Install dependencies (use pnpm from monorepo root)
pnpm install

# Build the CLI
pnpm build

# Run in development mode
pnpm dev <command> <args>

# Run tests
pnpm test              # Watch mode
pnpm test --run        # Single run

# Type checking
pnpm type-check

# Full CI check before committing (run from monorepo root)
pnpm ci:local
```

### Testing Specific Commands

```bash
# Test a command in development
pnpm dev init --preset react
pnpm dev add typescript-standards
pnpm dev list
```

## Architecture

### Command Structure

The CLI uses Commander.js and follows this pattern:

- Entry point: `src/index.ts` - Sets up the main program and registers commands
- Commands: `src/commands/` - Each command is a separate module exporting a
  Command instance
  - `init.ts` - Initialize projects with supplies
  - `add.ts` - Add supplies to existing projects
  - `list.ts` - List available/installed supplies
  - `update.ts` - Update supplies to latest versions
  - `pack.ts` - Export/import supply configurations (packlists)

### Key Dependencies

- `commander` - CLI framework for parsing commands and options
- `inquirer` - Interactive prompts for user input
- `chalk` - Terminal styling
- `ora` - Spinner for long-running operations
- `fs-extra` - Enhanced file system operations
- `@outfitter/packlist` - Core library for managing supply configurations
- `@outfitter/fieldguides` - Documentation content for supplies

### Data Structure

Projects using the CLI have a `.outfitter/` directory:

```
.outfitter/
├── config.json      # Project configuration
├── supplies/        # Local copies of installed supplies
└── cache/          # Version and update information
```

### Integration Points

- The CLI consumes `@outfitter/packlist` as a library for core supply management
  logic
- It references `@outfitter/fieldguides` for supply content and documentation
- All packages use `@outfitter/contracts` for error handling with the Result
  pattern

## Development Patterns

### Error Handling

All commands should handle errors gracefully:

```typescript
try {
  // Command logic
} catch (error: any) {
  console.error(chalk.red('Error:'), error.message);
  process.exit(1);
}
```

### User Feedback

- Use `ora` for operations that might take time
- Use `chalk` for colored output (red for errors, green for success, yellow for
  warnings)
- Use `inquirer` for interactive prompts when user input is needed

### Command Options

- Short flags use single dash: `-p`
- Long flags use double dash: `--preset`
- Boolean flags don't take values: `--force`
- Value flags require values: `--preset nextjs`

## Build Configuration

The CLI uses TypeScript with ES modules:

- Target: ES2022
- Module: ES2022
- Output: `./dist`
- The CLI is published as an executable via the `bin` field in package.json

## Important Notes

- The CLI will be globally installable via `npm install -g outfitter`
- The `templates/` directory (currently empty) is intended for future file
  templates
- All file paths should use Node.js `path.join()` for cross-platform
  compatibility
- The CLI should work in any directory and manage its own `.outfitter/`
  structure
- Commands should provide clear error messages when prerequisites aren't met
  (e.g., not initialized)
