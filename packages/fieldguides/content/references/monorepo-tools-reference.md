---
slug: monorepo-tools-reference
title: Monorepo Tools Reference
description: Tool-specific configurations and commands for monorepo management.
type: reference
---

# Monorepo Tools Reference

Quick reference for tool-specific configurations and commands in monorepo setups.

## Related Documentation

- [Monorepo Standards](../standards/monorepo-standards.md) - Architecture and patterns
- [TypeScript Standards](../standards/typescript-standards.md) - TypeScript in monorepos
- [Testing Standards](../standards/testing-standards.md) - Testing across packages
- [Configuration Standards](../standards/configuration-standards.md) - Shared configurations
- [Deployment Standards](../standards/deployment-standards.md) - Deploying from monorepos

## Package Managers

### pnpm

```yaml
# ✂️ Production-ready: pnpm-workspace.yaml
packages:
  - 'apps/*'
  - 'packages/*'
  - 'tools/*'
```

**Commands:**

```bash
# ✂️ Production-ready: Common pnpm workspace commands
pnpm install                    # Install all dependencies
pnpm -r build                  # Build all packages
pnpm -r --parallel dev         # Run dev in all packages
pnpm -r --filter @org/pkg test # Test specific package
pnpm -r exec -- rm -rf dist    # Execute command in all packages
```

### npm Workspaces

```json
// ✂️ Production-ready: NPM workspace configuration
{
  "workspaces": ["apps/*", "packages/*"]
}
```

**Commands:**

```bash
# ✂️ Production-ready: Common npm workspace commands
npm install                         # Install all
npm run build --workspaces         # Build all
npm run test -w @org/package       # Test specific
npm exec -ws -- rm -rf dist        # Execute in all
```

### Yarn Workspaces

```json
// ✂️ Production-ready: Yarn workspace configuration
{
  "workspaces": {
    "packages": ["apps/*", "packages/*"]
  }
}
```

**Commands:**

```bash
# ✂️ Production-ready: Common Yarn workspace commands
yarn install                    # Install all
yarn workspaces run build      # Build all
yarn workspace @org/pkg test   # Test specific
```

### Bun Workspaces

```json
// ✂️ Production-ready: Bun workspace configuration
{
  "workspaces": ["apps/*", "packages/*"]
}
```

**Commands:**

```bash
# ✂️ Production-ready: Common Bun workspace commands
bun install                    # Install all
bun run --filter '*' build     # Build all
bun run --filter '@org/pkg' test # Test specific
```

## Build Orchestration

### Turbo

```json
// ✂️ Production-ready: turbo.json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**"]
    },
    "test": {
      "dependsOn": ["build"],
      "outputs": ["coverage/**"]
    },
    "lint": {
      "outputs": []
    },
    "dev": {
      "cache": false,
      "persistent": true
    }
  }
}
```

**Commands:**

```bash
# ✂️ Production-ready: Common Turbo commands
turbo build                    # Build with caching
turbo build --force           # Build without cache
turbo build --filter=@org/app # Build specific package
turbo build --dry-run         # Preview execution plan
```

### Nx

```json
// ✂️ Production-ready: nx.json
{
  "$schema": "./node_modules/nx/schemas/nx-schema.json",
  "tasksRunnerOptions": {
    "default": {
      "runner": "nx/tasks-runners/default",
      "options": {
        "cacheableOperations": ["build", "test", "lint"]
      }
    }
  },
  "targetDefaults": {
    "build": {
      "dependsOn": ["^build"]
    }
  }
}
```

### Lerna (Legacy)

```json
// 📚 Educational: Legacy Lerna configuration
{
  "version": "independent",
  "npmClient": "pnpm",
  "command": {
    "publish": {
      "conventionalCommits": true
    }
  }
}
```

## Version Management

### Changesets

```bash
# ✂️ Production-ready: Changesets workflow
# Initialize
pnpm changeset init

# Add changeset
pnpm changeset

# Version packages
pnpm changeset version

# Publish packages
pnpm changeset publish
```

**Configuration:**

```json
// ✂️ Production-ready: .changeset/config.json
{
  "$schema": "https://unpkg.com/@changesets/config@3.0.0/schema.json",
  "changelog": "@changesets/cli/changelog",
  "commit": false,
  "fixed": [],
  "linked": [],
  "access": "public",
  "baseBranch": "main",
  "updateInternalDependencies": "patch",
  "ignore": []
}
```

### Release-It

```json
// ✂️ Production-ready: .release-it.json
{
  "git": {
    "commitMessage": "chore: release v${version}"
  },
  "github": {
    "release": true
  },
  "npm": {
    "publish": true
  },
  "plugins": {
    "@release-it/conventional-changelog": {
      "preset": "angular"
    }
  }
}
```

## CI/CD Configurations

### GitHub Actions with pnpm

```yaml
# ✂️ Production-ready: .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm turbo build test lint
```

### Vercel Monorepo

```json
// ✂️ Production-ready: vercel.json for monorepo app
{
  "buildCommand": "cd ../.. && pnpm turbo build --filter=web-app",
  "installCommand": "pnpm install",
  "framework": "nextjs",
  "outputDirectory": "apps/web/.next"
}
```

## Common Scripts

### Workspace Management

```bash
#!/bin/bash
# ✂️ Production-ready: workspace-utils.sh

# Add dependency to specific workspace
add_dep() {
  local workspace=$1
  local package=$2
  pnpm add -D "$package" --filter "$workspace"
}

# Update dependency across all workspaces
update_all() {
  local package=$1
  pnpm up -r "$package"
}

# Check for version mismatches
check_versions() {
  pnpm ls -r --depth -1 | grep -E "^[^└├]" | sort | uniq -c | sort -nr
}

# Clean all build artifacts
clean_all() {
  pnpm -r exec -- rm -rf dist .turbo node_modules/.cache
}
```

### Publishing Workflow

```bash
#!/bin/bash
# ✂️ Production-ready: publish.sh

set -e

echo "==> Checking for changes..."
if pnpm changeset status --exit-code; then
  echo "No changes to publish"
  exit 0
fi

echo "==> Building packages..."
pnpm turbo build --filter="./packages/*"

echo "==> Running tests..."
pnpm turbo test --filter="./packages/*"

echo "==> Generating changelog..."
pnpm changeset version

echo "==> Publishing packages..."
pnpm changeset publish

echo "✅ Publishing complete!"
```

## Migration Commands

### To pnpm Workspaces

```bash
# ✂️ Production-ready: Migrate from npm/yarn to pnpm
# 1. Remove existing lock files
rm -f package-lock.json yarn.lock

# 2. Create pnpm-workspace.yaml
echo 'packages:
  - "apps/*"
  - "packages/*"' > pnpm-workspace.yaml

# 3. Install with pnpm
pnpm install

# 4. Update scripts
sed -i 's/npm run/pnpm/g' package.json
sed -i 's/yarn/pnpm/g' package.json
```

## Troubleshooting

### Common Issues

```bash
# ✂️ Production-ready: Fix common monorepo issues

# Clear all caches
pnpm store prune
rm -rf node_modules
pnpm install

# Fix phantom dependencies
pnpm dedupe

# Update pnpm
corepack prepare pnpm@latest --activate

# Fix turbo cache
rm -rf .turbo
turbo daemon stop
```

### Debugging Commands

```bash
# ✂️ Production-ready: Debugging workspace issues

# List all workspaces
pnpm ls -r --depth -1

# Check circular dependencies
pnpm ls -r --depth Infinity | grep -B 5 "circular"

# Verify package.json exports
pnpm -r exec -- node -e "console.log(require('./package.json').name)"

# Find duplicate dependencies
pnpm dedupe --check
```
