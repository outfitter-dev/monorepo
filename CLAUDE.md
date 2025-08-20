# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

About you: @./.agent/prompts/mode-max-eng.md

## Repository Overview

This is the `@outfitter/monorepo` - a collection of shared configurations and utilities for Outfitter projects. It uses Bun workspaces and contains packages that provide development tools, configurations, and coding standards.

## Key Commands

### Development

```bash
# Install dependencies (use bun, not npm/pnpm)
bun install

# Build all packages (contracts must build first)
bun run build

# Run tests
bun run test              # Watch mode
bun run test --run        # Single run

# Linting and formatting
bun run lint:md           # Markdown lint
bun run format            # Check formatting
bun run format:fix        # Fix formatting

# Full CI check (run before committing)
bun run ci:local          # Runs format:fix, lint:md, type-check, and tests

# Type checking
bun run type-check
```

### Package Management

```bash
# Add dependency to root
bun add -D <package>

# Add to specific package
bun add <package> --filter @outfitter/cli

# Update dependencies
bun update
```

### Changesets & Publishing

```bash
# Create a changeset for version bump
bun run changeset

# Version packages based on changesets
bun run changeset:version

# Publish to npm
bun run changeset:publish
```

### Testing Specific Packages

```bash
# Run tests for a specific package
bun run test --filter @outfitter/contracts

# Run a single test file
bun run test packages/contracts/ts/src/__tests__/result.test.ts
```

## Architecture

### Package Structure

The monorepo follows a clear separation of concerns:

1. **Core Libraries** (must build first):
   - `contracts/ts`: Zero-dependency utilities using Result pattern for error handling (renamed from typescript-utils)
   - `packlist`: Configuration manager that orchestrates development setup

2. **Configuration Packages** (shared configs):
   - `typescript-config`: Base tsconfig.json files for different project types
   - `husky-config`: Git hooks configuration
   - `changeset-config`: Release management configuration

3. **Tools & Documentation**:
   - `cli`: Command-line tool (globally installable as `outfitter`) that consumes packlist as a library
   - `fieldguides`: Living documentation system with content in `content/` subdirectory

### Build Order

Due to TypeScript project references, packages must build in this order:

1. `contracts/ts` (no dependencies)
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
    { "path": "./packages/contracts/ts" }
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
- Biome for linting and formatting
- Prefer `Array<T>` over `T[]`
- No `I` prefix on interfaces

### Testing

- Vitest for unit testing
- Tests located in `src/__tests__/` directories
- 80% coverage target (90% for critical paths)
- All packages except documentation packages have tests

### Package Publishing

- All packages are published to npm under `@outfitter/` scope
- Packages use Bun native builds with custom build scripts (hybrid approach with tsc for declarations)
- Both CJS and ESM formats are built for maximum compatibility

## Known Issues & Workarounds

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
2. Make changes and ensure `bun run ci:local` passes
3. Create a changeset if changing package functionality: `bun run changeset`
4. Commit with conventional commit message
5. Push and create PR

## Tips for AI Agents

- Always use `bun`, never `npm`, `yarn`, or `pnpm`
- Run `bun run ci:local` before suggesting any commits
- When adding dependencies, consider which package needs them
- The Result pattern is mandatory for error handling
- Check existing patterns in similar files before implementing new features
- The fieldguides package structure is: package root → content/ → guidebooks
