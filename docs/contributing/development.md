# Development Guide

This guide covers development workflows for the Outfitter monorepo and all its packages.

## Prerequisites

- Node.js 18+
- pnpm 8+ (required for workspace management)
- Git

## Getting Started

```bash
# Clone the repository
git clone https://github.com/outfitter-dev/monorepo
cd monorepo

# Install dependencies
pnpm install

# Build all packages
pnpm build
```

## Development Workflow

### 1. Building Packages

Due to TypeScript project references, packages must build in order:

```bash
# Build all packages
pnpm build

# Build specific package
pnpm build --filter @outfitter/contracts

# Build with dependencies
pnpm build --filter @outfitter/cli...
```

**Build Order**:

1. `contracts` (no dependencies)
2. All other packages (may depend on contracts)

### 2. Testing

```bash
# Run all tests in watch mode
pnpm test

# Run tests once
pnpm test --run

# Test specific package
pnpm test --filter @outfitter/packlist

# Run specific test file
pnpm test packages/contracts/typescript/src/__tests__/result.test.ts
```

### 3. Linting and Formatting

```bash
# ESLint
pnpm lint

# Markdown lint
pnpm lint:md

# Check formatting
pnpm format

# Fix formatting
pnpm format:fix

# Type checking
pnpm type-check
```

### 4. Pre-commit Checks

Always run before committing:

```bash
pnpm ci:local
```

This runs:

- `format:fix` - Auto-fix formatting
- `lint` - ESLint checks
- `lint:md` - Markdown linting
- `type-check` - TypeScript validation
- `test --run` - All tests

## Package Management

### Adding Dependencies

```bash
# Add to root (dev dependencies only)
pnpm add -D <package>

# Add to specific package
pnpm add <package> --filter @outfitter/cli

# Add dev dependency to package
pnpm add -D <package> --filter @outfitter/eslint-config
```

### Updating Dependencies

```bash
# Interactive update
pnpm update --interactive --latest

# Update specific package
pnpm update <package> --latest
```

## Creating a New Package

1. Create package directory:

   ```bash
   mkdir -p packages/new-package/src
   cd packages/new-package
   ```

2. Initialize package:

   ```bash
   pnpm init
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
pnpm changeset

# Select packages that changed
# Choose version bump type (patch/minor/major)
# Write changelog entry
```

### 2. Version Packages

```bash
# Apply changesets (usually done in CI)
pnpm changeset:version

# This updates:
# - Package versions
# - CHANGELOG.md files
# - Internal dependency versions
```

### 3. Publish to npm

```bash
# Publish all changed packages
pnpm changeset:publish
```

## Troubleshooting

### Build Failures

1. Clean and rebuild:

   ```bash
   pnpm clean
   pnpm install
   pnpm build
   ```

2. Check for circular dependencies:
   ```bash
   pnpm ls --depth=0
   ```

### Type Errors

1. Restart TypeScript server in VS Code:

   - Cmd+Shift+P → "TypeScript: Restart TS Server"

2. Clean TypeScript cache:
   ```bash
   pnpm tsc --build --clean
   ```

### Test Failures

1. Update snapshots if needed:

   ```bash
   pnpm test -- -u
   ```

2. Run tests in isolation:
   ```bash
   pnpm test --filter @outfitter/package-name -- --no-coverage
   ```

## Tips

1. **Use the workspace protocol**: Always use `workspace:*` for internal dependencies
2. **Run targeted commands**: Use `--filter` to run commands for specific packages
3. **Leverage Turbo cache**: Build outputs are cached automatically
4. **Check before pushing**: Always run `pnpm ci:local` before pushing
