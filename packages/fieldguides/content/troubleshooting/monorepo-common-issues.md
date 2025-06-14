---
slug: monorepo-common-issues
title: Common monorepo issues and solutions
description: Troubleshooting guide for frequent problems in pnpm workspace monorepos.
type: troubleshooting
---

# Monorepo Common Issues

Solutions for frequent problems encountered in pnpm workspace monorepos.

## Dependency Issues

### Phantom Dependencies

**Problem**: Code works locally but fails in CI or production

```typescript
// Works locally but fails elsewhere
import lodash from 'lodash'; // Not in package.json!
```

**Cause**: Package is available through hoisting but not declared

**Solution**:

```bash
# Find phantom dependencies
pnpm ls --depth=Infinity | grep "lodash"

# Add to correct package.json
pnpm add lodash --filter @company/my-package

# Prevent with strict hoisting
echo "hoist-pattern[]=''" >> .npmrc
```

### Peer Dependency Conflicts

**Problem**: Multiple versions of React or other peer dependencies

```
ERR_PNPM_PEER_DEP_ISSUES  Unmet peer dependencies
```

**Solution**:

```json
// pnpm-workspace.yaml
packages:
  - 'packages/*'
  - 'apps/*'

// .pnpmfile.cjs
module.exports = {
  hooks: {
    readPackage(pkg) {
      // Force consistent React version
      if (pkg.peerDependencies?.react) {
        pkg.peerDependencies.react = '^18.2.0';
      }
      return pkg;
    }
  }
};
```

### Workspace Protocol Not Resolving

**Problem**: `workspace:*` not resolving in builds

```
Cannot find module '@company/utils'
```

**Solution**:

```bash
# Ensure proper TypeScript configuration
# tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@company/*": ["./packages/*/src"]
    }
  }
}

# Build dependencies first
pnpm build --filter @company/utils
pnpm build --filter @company/app
```

## Build Issues

### Circular Dependencies

**Problem**: Packages depend on each other

```
Circular dependency detected:
@company/ui -> @company/utils -> @company/ui
```

**Solution**:

```bash
# Detect cycles
pnpm add -D madge
pnpm madge --circular packages/

# Fix by extracting shared code
packages/
  ui/          # Depends on types
  utils/       # Depends on types
  types/       # No dependencies
```

### TypeScript Project References Not Working

**Problem**: Changes not picked up, stale types

```typescript
// Types not updating when source changes
import { User } from '@company/types'; // Old types!
```

**Solution**:

```json
// Root tsconfig.json
{
  "references": [
    { "path": "./packages/types" },
    { "path": "./packages/utils" },
    { "path": "./packages/ui" }
  ]
}

// Package tsconfig.json
{
  "compilerOptions": {
    "composite": true,
    "declaration": true,
    "declarationMap": true
  },
  "references": [
    { "path": "../types" }
  ]
}
```

```bash
# Clean and rebuild
pnpm clean
pnpm tsc --build --clean
pnpm build
```

### Build Order Issues

**Problem**: Builds fail due to missing dependencies

```
Error: Cannot find module '@company/utils/dist/index.js'
```

**Solution**:

```json
// turbo.json
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"], // Build dependencies first
      "outputs": ["dist/**"]
    }
  }
}
```

## Development Workflow Issues

### Hot Module Replacement (HMR) Not Working

**Problem**: Changes in packages not reflected in apps

**Solution**:

```json
// Package package.json
{
  "scripts": {
    "dev": "tsup src/index.ts --watch --format esm,cjs --dts"
  }
}

// App configuration (Next.js example)
// next.config.js
module.exports = {
  transpilePackages: ['@company/ui', '@company/utils']
};
```

### Symlink Issues on Windows

**Problem**: Symlinks not working on Windows

```
EPERM: operation not permitted, symlink
```

**Solution**:

```bash
# Run as administrator or enable developer mode

# Alternative: use junctions
pnpm config set prefer-symlinks false

# Or use .npmrc
enable-pre-post-scripts=true
prefer-symlinks=false
```

### Package Not Found After Adding

**Problem**: Just added package not recognized

```
Cannot resolve '@company/new-package'
```

**Solution**:

```bash
# Reinstall to update symlinks
pnpm install

# If using TypeScript, restart TS server
# VS Code: Cmd+Shift+P -> "TypeScript: Restart TS Server"

# Clear all caches
pnpm store prune
rm -rf node_modules
pnpm install
```

## Performance Issues

### Slow Installation

**Problem**: `pnpm install` takes too long

**Solution**:

```bash
# Use frozen lockfile in CI
pnpm install --frozen-lockfile

# Optimize pnpm settings
echo "resolution-mode=lowest" >> .npmrc
echo "dedupe-peer-dependents=true" >> .npmrc

# Use pnpm's cache
pnpm store path  # Check cache location
pnpm store prune # Clean old versions
```

### Large Git Repository

**Problem**: Clone and operations slow

**Solution**:

```bash
# Use shallow clone
git clone --depth 1 <repo>

# Enable Git LFS for large files
git lfs track "*.png" "*.jpg" "*.pdf"

# Use sparse checkout
git sparse-checkout init
git sparse-checkout set packages/my-package
```

### Memory Issues During Build

**Problem**: JavaScript heap out of memory

**Solution**:

```bash
# Increase Node memory
export NODE_OPTIONS="--max-old-space-size=8192"

# Or in package.json
{
  "scripts": {
    "build": "NODE_OPTIONS='--max-old-space-size=8192' turbo build"
  }
}

# Build packages individually
pnpm build --filter @company/ui
pnpm build --filter @company/app
```

## CI/CD Issues

### Turbo Cache Not Working

**Problem**: CI rebuilds everything every time

**Solution**:

```yaml
# GitHub Actions example
- name: Setup Turbo Cache
  uses: actions/cache@v3
  with:
    path: .turbo
    key: turbo-${{ runner.os }}-${{ github.sha }}
    restore-keys: |
      turbo-${{ runner.os }}

# Use remote caching
- run: |
    echo "TURBO_TOKEN=${{ secrets.TURBO_TOKEN }}" >> $GITHUB_ENV
    echo "TURBO_TEAM=my-team" >> $GITHUB_ENV
    pnpm turbo build --cache-dir=.turbo
```

### Different Behavior in CI

**Problem**: Works locally, fails in CI

**Solution**:

```bash
# Match CI environment locally
pnpm install --frozen-lockfile
pnpm build --filter='[origin/main...HEAD]'

# Check Node versions
node --version  # Should match CI

# Clear all caches
pnpm store prune
rm -rf .turbo
rm -rf node_modules
pnpm install --frozen-lockfile
```

## Publishing Issues

### Workspace Protocol in Published Package

**Problem**: Published package contains `workspace:*`

```json
{
  "dependencies": {
    "@company/utils": "workspace:*" // Bad!
  }
}
```

**Solution**:

```bash
# Use changesets for publishing
pnpm changeset version  # Replaces workspace: protocol
pnpm changeset publish

# Or manually before publish
pnpm publish --filter @company/ui --dry-run
# Check the tarball contents
```

### Missing Files in Published Package

**Problem**: Built files not included in npm package

**Solution**:

```json
// package.json
{
  "files": ["dist", "src", "!src/**/*.test.ts"],
  "main": "./dist/index.js",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts"
}
```

```bash
# Test what will be published
pnpm pack --dry-run
tar -tf company-ui-1.0.0.tgz
```

## Quick Fixes Checklist

When things go wrong, try these in order:

1. **Restart TypeScript server** (VS Code: Cmd+Shift+P → "Restart TS Server")
2. **Clear and reinstall**:
   ```bash
   rm -rf node_modules .turbo
   pnpm install
   ```
3. **Clean build**:
   ```bash
   pnpm clean
   pnpm build
   ```
4. **Check for circular dependencies**:
   ```bash
   pnpm madge --circular packages/
   ```
5. **Verify workspace setup**:
   ```bash
   pnpm ls --depth=0
   ```
6. **Update pnpm**:
   ```bash
   npm install -g pnpm@latest
   ```

## Prevention Tips

1. **Use strict hoisting** to catch phantom dependencies early
2. **Set up pre-commit hooks** to catch issues before they're merged
3. **Document package dependencies** clearly
4. **Use TypeScript project references** for type safety
5. **Regular dependency updates** to avoid security issues
6. **Monitor build times** and optimize when they degrade
