# Development Guide

This guide covers development workflows for the Outfitter monorepo and all its packages.

## Prerequisites

- Bun 1.2.19+ (package manager and runtime)
- Git

## Getting Started

```bash
# Clone the repository
git clone https://github.com/outfitter-dev/monorepo
cd monorepo

# Install dependencies
bun install

# Build all packages
bun run build
```

## Development Workflow

### 1. Building Packages

Due to TypeScript project references, packages must build in order:

```bash
# Build all packages
bun run build

# Build specific package
bun run build --filter @outfitter/contracts

# Build with dependencies
bun run build --filter @outfitter/cli...
```

**Build Order**:

1. `contracts` (no dependencies)
2. All other packages (may depend on contracts)

### 2. Testing

```bash
# Run all tests in watch mode
bun test

# Run tests once
bun test --run

# Test specific package
bun run test --filter @outfitter/packlist

# Run specific test file
bun test packages/contracts/ts/src/__tests__/result.test.ts
```

### 3. Linting and Formatting

```bash
# Biome lint
bun run lint

# Markdown lint
bun run lint:md

# Check formatting
bun run format

# Fix formatting
bun run format:fix

# Type checking
bun run type-check
```

### 4. Pre-commit Checks

Always run before committing:

```bash
bun run ci:local
```

This runs:

- `format:fix` - Auto-fix formatting
- `lint` - Biome checks
- `lint:md` - Markdown linting
- `type-check` - TypeScript validation
- `test --run` - All tests

## Package Management

### Adding Dependencies

```bash
# Add to root (dev dependencies only)
bun add -D <package>

# Add to specific package
bun add <package> --filter @outfitter/cli

# Add dev dependency to package
bun add -D <package> --filter @outfitter/typescript-config
```

### Updating Dependencies

```bash
# Update all dependencies
bun update

# Update specific package
bun update <package>
```

## Creating a New Package

1. Create package directory:

   ```bash
   mkdir -p packages/new-package/src
   cd packages/new-package
   ```

2. Initialize package:

   ```bash
   bun init
   ```

3. Set up package.json:

   ```json
   {
     "name": "@outfitter/new-package",
     "version": "0.0.0",
     "private": false,
     "main": "./dist/index.js",
     "module": "./dist/index.mjs",
     "types": "./dist/index.d.ts",
     "files": ["dist", "README.md"],
     "scripts": {
       "build": "tsup src/index.ts --format cjs,esm --dts --clean",
       "dev": "tsup src/index.ts --format cjs,esm --dts --watch",
       "type-check": "tsc --noEmit"
     }
   }
   ```

4. Add TypeScript config:

   ```json
   {
     "extends": "../../tsconfig.json",
     "compilerOptions": {
       "outDir": "./dist",
       "rootDir": "./src"
     },
     "include": ["src/**/*"]
   }
   ```

5. Update root tsconfig.json references:

   ```json
   {
     "references": [{ "path": "./packages/new-package" }]
   }
   ```

## Commit Conventions

Use conventional commits (enforced by commitlint):

```bash
# Format: type(scope): subject

# Examples:
git commit -m "feat(cli): add update command"
git commit -m "fix(typescript-utils): handle null values"
git commit -m "docs(packlist): update API examples"
```

**Types**:

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Test changes
- `chore`: Maintenance tasks
- `perf`: Performance improvements
- `ci`: CI/CD changes
- `build`: Build system changes

## Releasing Packages

### 1. Create a Changeset

```bash
# Interactive changeset creation
bun run changeset

# Select packages that changed
# Choose version bump type (patch/minor/major)
# Write changelog entry
```

### 2. Version Packages

```bash
# Apply changesets (usually done in CI)
bun run changeset:version

# This updates:
# - Package versions
# - CHANGELOG.md files
# - Internal dependency versions
```

### 3. Publish to npm

```bash
# Publish all changed packages
bun run changeset:publish
```

## Troubleshooting

### Build Failures

1. Clean and rebuild:

   ```bash
   bun run clean
   bun install
   bun run build
   ```

2. Check for circular dependencies:

   ```bash
   bun pm ls --depth=0
   ```

### Type Errors

1. Restart TypeScript server in VS Code:
   - Cmd+Shift+P → "TypeScript: Restart TS Server"

2. Clean TypeScript cache:

   ```bash
   bunx tsc --build --clean
   ```

### Test Failures

1. Update snapshots if needed:

   ```bash
   bun test -- -u
   ```

2. Run tests in isolation:

   ```bash
   bun run test --filter @outfitter/package-name -- --no-coverage
   ```

## Tips

1. **Use the workspace protocol**: Always use `workspace:*` for internal dependencies
2. **Run targeted commands**: Use `--filter` to run commands for specific packages
3. **Leverage Turbo cache**: Build outputs are cached automatically
4. **Check before pushing**: Always run `bun run ci:local` before pushing
