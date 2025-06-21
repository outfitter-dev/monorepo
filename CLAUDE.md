# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

About you: @.agents/prompts/mode-max-eng.md

## Repository Overview

This is the `@outfitter/monorepo` - a collection of shared configurations and utilities for Outfitter projects. It uses pnpm workspaces and contains 8 packages that provide development tools, configurations, and coding standards.

## Key Commands

### Development

```bash
# Install dependencies (use pnpm, not npm)
pnpm install

# Build all packages (typescript-utils must build first)
pnpm build

# Run tests
pnpm test              # Watch mode
pnpm test --run        # Single run

# Linting and formatting
pnpm lint              # ESLint
pnpm lint:md           # Markdown lint
pnpm format            # Check formatting
pnpm format:fix        # Fix formatting

# Full CI check (run before committing)
pnpm ci:local          # Runs format:fix, lint, lint:md, type-check, and tests

# Type checking
pnpm type-check
```

### Package Management

```bash
# Add dependency to root
pnpm add -D <package>

# Add to specific package
pnpm add <package> --filter @outfitter/cli

# Update dependencies
pnpm update --interactive --latest
```

### Changesets & Publishing

```bash
# Create a changeset for version bump
pnpm changeset

# Version packages based on changesets
pnpm changeset:version

# Publish to npm
pnpm changeset:publish
```

### Testing Specific Packages

```bash
# Run tests for a specific package
pnpm test --filter @outfitter/contracts

# Run a single test file
pnpm test packages/contracts/typescript/src/__tests__/result.test.ts
```

## Architecture

### Package Structure

The monorepo follows a clear separation of concerns:

1. **Core Libraries** (must build first):

   - `contracts/typescript`: Zero-dependency utilities using Result pattern for error handling (renamed from typescript-utils)
   - `packlist`: Configuration manager that orchestrates development setup

2. **Configuration Packages** (shared configs):

   - `eslint-config`: Shared ESLint rules (currently relaxed for initial setup)
   - `typescript-config`: Base tsconfig.json files for different project types
   - `husky-config`: Git hooks configuration
   - `changeset-config`: Release management configuration

3. **Tools & Documentation**:
   - `cli`: Command-line tool (globally installable as `outfitter`) that consumes packlist as a library
   - `fieldguides`: Living documentation system with content in `content/` subdirectory

### Build Order

Due to TypeScript project references, packages must build in this order:

1. `contracts/typescript` (no dependencies)
2. All other packages (may depend on contracts)

### Key Design Patterns

#### Result Pattern

All packages use the Result pattern from `contracts` for error handling:

```typescript
import { Result, success, failure, makeError } from '@outfitter/contracts';

function doSomething(): Result<string, AppError> {
  if (condition) {
    return success('value');
  }
  return failure(makeError('ERROR_CODE', 'Error message'));
}
```

#### Workspace Dependencies

Internal packages use `workspace:*` protocol:

```json
{
  "dependencies": {
    "@outfitter/contracts": "workspace:*"
  }
}
```

#### TypeScript Project References

The root `tsconfig.json` uses project references for incremental builds:

```json
{
  "references": [
    { "path": "./packages/typescript-config" },
    { "path": "./packages/contracts/typescript" }
    // ... other packages
  ]
}
```

## Important Conventions

### Commit Messages

Use conventional commits (enforced by commitlint):

- Format: `type(scope): subject`
- Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `perf`, `ci`, `build`, `revert`
- Example: `feat(cli): add update command for supplies`

### Code Style

- TypeScript with strict mode enabled
- ESLint configured but currently relaxed (warnings instead of errors)
- Prettier for formatting with import sorting
- Prefer `Array<T>` over `T[]` (enforced by ESLint)
- No `I` prefix on interfaces

### Testing

- Vitest for unit testing
- Tests located in `src/__tests__/` directories
- 80% coverage target (90% for critical paths)
- All packages except documentation packages have tests

### Package Publishing

- All packages are published to npm under `@outfitter/` scope
- Packages use `tsup` for building (except `cli` and `fieldguides` which use `tsc`)
- Both CJS and ESM formats are built for maximum compatibility

## Known Issues & Workarounds

### ESLint Warnings

The project currently has ~200 ESLint warnings (mostly type safety warnings). These don't block functionality but should be addressed:

- Many `@typescript-eslint/no-unsafe-*` warnings due to `any` types
- Array type syntax needs updating in some files
- Empty catch blocks in some packages

### CJS/ESM Compatibility

Some packages show warnings about `import.meta` in CJS builds. This is expected and doesn't affect functionality.

## Package-Specific Notes

### @outfitter/cli

- Entry point is `src/index.ts`
- Commands are in `src/commands/` directory
- Uses `commander` for CLI parsing
- Will be globally installable via `npm install -g @outfitter/cli`

### @outfitter/fieldguides

- Documentation content is in `content/` subdirectory
- Has custom validation scripts for frontmatter and cross-references
- Uses adventure/exploration theme in internal docs only
- External-facing guidebooks use professional language

### @outfitter/contracts

- Zero runtime dependencies (critical requirement)
- All functions must use Result pattern
- 100% test coverage requirement
- Used by all other packages for error handling
- Renamed from typescript-utils with enhanced structure

## Development Workflow

1. Create a feature branch from `main`
2. Make changes and ensure `pnpm ci:local` passes
3. Create a changeset if changing package functionality: `pnpm changeset`
4. Commit with conventional commit message
5. Push and create PR

## Tips for AI Agents

- Always use `pnpm`, never `npm` or `yarn`
- Run `pnpm ci:local` before suggesting any commits
- When adding dependencies, consider which package needs them
- The Result pattern is mandatory for error handling
- Check existing patterns in similar files before implementing new features
- The fieldguides package structure is: package root → content/ → guidebooks
