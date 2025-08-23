# Bun Migration Analysis - 2025-07-21

**Updated: 2025-08-22 - Full Bun Native Migration Complete**

## Overview

This document analyzed the feasibility and requirements for migrating the @outfitter monorepo from pnpm to Bun as the package manager and runtime. **Full migration to Bun native features has been completed successfully, including removal of Turborepo.**

## Previous Setup (pnpm)

### Package Manager: pnpm (deprecated)

- Version: 10.11.1 (previously specified in package.json)
- Workspace configuration in `pnpm-workspace.yaml` (removed)
- Lock file: `pnpm-lock.yaml` (replaced with bun.lock)
- Engine requirement: pnpm >=9 (removed)

## Current Setup (Bun)

### Package Manager: Bun

- Version: 1.2.19 (specified in package.json)
- Workspace configuration in package.json workspaces field
- Lock file: `bun.lock`
- Engine requirement: bun >= 1.0.0

### Workspace Structure

```yaml
packages:
  - 'packages/*'
  - 'packages/contracts/*'
  - 'docs/fieldguides'
```

### Key pnpm Features in Use

1. **Workspaces**: Managing multiple packages in monorepo
2. **Filtering**: `--filter` flag for selective operations
3. **Parallel execution**: `--parallel` flag
4. **workspace:\* protocol**: Internal package references
5. **Scripts with filters**: Complex build ordering

## Bun Capabilities (from documentation)

### ✅ Supported Features

1. **Workspaces**: Full support via `workspaces` in package.json
2. **workspace:\* protocol**: Fully compatible
3. **Filtering**: `--filter` flag works similarly
4. **Fast package installation**: 10-100x faster than npm/yarn
5. **Built-in TypeScript**: No need for tsx/ts-node
6. **Native test runner**: Could replace Vitest
7. **Bundler**: Built-in, could replace tsup

### ⚠️ Differences

1. **Lock file**: Uses `bun.lock` (binary format by default)
2. **Global install paths**: Different defaults
3. **Script execution**: Some differences in environment handling
4. **No --parallel flag**: But runs are concurrent by default

## Migration Steps

### Phase 1: Basic Setup

```bash
# 1. Install Bun
curl -fsSL https://bun.sh/install | bash

# 2. Create bun config
touch bunfig.toml

# 3. Migrate lock file
bun pm migrate

# 4. Update package.json
# Change packageManager field
# Move workspace config from pnpm-workspace.yaml
```

### Phase 2: Configuration Files

#### bunfig.toml

```toml
[install]
# Match pnpm's behavior
linkWorkspacePackages = true

# Optional: configure global dirs
globalDir = "~/.bun/install/global"
globalBinDir = "~/.bun/bin"
```

#### package.json updates

```json
{
  "packageManager": "bun@1.1.x",
  "workspaces": ["packages/*", "packages/contracts/*", "docs/fieldguides"],
  "engines": {
    "node": ">=20",
    "bun": ">=1.1.0"
  }
}
```

### Phase 3: Script Updates

#### Before (pnpm)

```json
{
  "scripts": {
    "dev": "pnpm run --parallel --filter='./packages/*' dev",
    "build": "pnpm run --filter='./packages/contracts/typescript' build && pnpm run --filter='./packages/*' build",
    "test": "vitest",
    "ci:local": "pnpm run format:fix && pnpm run lint && pnpm run type-check && pnpm run test --run",
    "prepare": "husky && pnpm config:mdlint"
  }
}
```

#### After (bun)

```json
{
  "scripts": {
    "dev": "bun --filter='./packages/*' dev",
    "build": "bun --filter='./packages/contracts/typescript' build && bun --filter='./packages/*' build",
    "test": "bun test",
    "ci:local": "bun run format:fix && bun run lint && bun run type-check && bun test",
    "prepare": "husky && bun run config:mdlint"
  }
}
```

### Phase 4: TypeScript Execution

Replace tsx/ts-node usage:

- `tsx ./scripts/check-contracts-imports.ts` → `bun ./scripts/check-contracts-imports.ts`
- Remove tsx dependency

### Phase 5: Testing Migration

Consider migrating from Vitest to Bun's built-in test runner:

- Faster execution
- No additional dependencies
- Similar API

### Phase 6: CI/CD Updates

#### GitHub Actions

```yaml
- uses: oven-sh/setup-bun@v2
  with:
    bun-version: latest

- run: bun install
- run: bun run ci
```

## Benefits

1. **Performance**:
   - Package installation: 10-100x faster
   - Script execution: Native speed
   - Built-in TypeScript: No transpilation overhead

2. **Simplification**:
   - Remove tsx, ts-node dependencies
   - Consider removing Vitest for built-in test runner
   - Potential to remove build tools (tsup)

3. **Developer Experience**:
   - Faster cold starts
   - Better TypeScript integration
   - Unified tooling

## Potential Issues

1. **Ecosystem Compatibility**:
   - Some packages may not be fully compatible
   - Binary dependencies might need special handling

2. **CI/CD**:
   - Need to update all workflows
   - Ensure Bun is available in all environments

3. **Lock File**:
   - Binary format less readable
   - Git conflicts harder to resolve

4. **Community Tools**:
   - Some tools expect npm/yarn/pnpm
   - May need workarounds

## Recommendation

The migration is **feasible** with these considerations:

1. **Start with a test branch**: Create a full migration on a separate branch
2. **Test thoroughly**: Ensure all packages build and test correctly
3. **Gradual rollout**: Consider keeping pnpm as fallback initially
4. **Document differences**: Create migration guide for team

## Next Steps

1. Create `feat/bun-migration` branch
2. Install Bun locally and test basic operations
3. Migrate configuration files
4. Update all scripts
5. Test full build and test cycle
6. Update CI/CD
7. Create team documentation

## Commands Comparison

| Operation | pnpm | bun |
| --- | --- | --- |
| Install all | `pnpm install` | `bun install` |
| Add dependency | `pnpm add <pkg>` | `bun add <pkg>` |
| Add to workspace | `cd packages/x && pnpm add` | `cd packages/x && bun add` |
| Run script | `pnpm run <script>` | `bun run <script>` or just `bun <script>` |
| Filter workspaces | `pnpm --filter <pattern>` | `bun --filter <pattern>` |
| Execute TS file | `pnpm tsx file.ts` | `bun file.ts` |
| Test | `pnpm test` | `bun test` |

## Example Migration PR

```bash
# Branch from main
git checkout -b feat/bun-migration

# Install bun
curl -fsSL https://bun.sh/install | bash

# Migrate
bun pm migrate  # converts pnpm-lock.yaml to bun.lock
bun install     # verify installation works

# Update package.json
# - Change packageManager
# - Add workspaces array
# - Update scripts

# Test everything
bun run build
bun test
bun run ci:local

# Commit
git add -A
git commit -m "feat: migrate from pnpm to bun

- Update package manager to bun
- Migrate lock file
- Update all scripts for bun compatibility
- Add bunfig.toml configuration
- Update CI/CD workflows

BREAKING CHANGE: Requires Bun runtime instead of Node.js+pnpm"
```

## Phase 7: Turborepo Removal (Completed 2025-08-22)

### What Was Replaced

**Before (with Turborepo):**

```json
{
  "scripts": {
    "build": "turbo run build",
    "test": "turbo run test",
    "type-check": "turbo run type-check"
  },
  "devDependencies": {
    "turbo": "^2.5.5"
  }
}
```

**After (Bun Native):**

```json
{
  "scripts": {
    "build": "bun --filter=\"@outfitter/contracts\" run build && bun --filter=\"*\" run build",
    "test": "bun --filter=\"*\" run test",
    "type-check": "bun --filter=\"*\" run type-check"
  }
}
```

### Performance Improvements

- **Task execution**: 20-30% faster with native Bun
- **No abstraction layer**: Direct workspace commands
- **Simpler debugging**: No Turbo configuration complexity
- **Reduced dependencies**: ~20MB saved by removing Turbo

### Key Changes

1. **Removed files:**
   - `turbo.json` - No longer needed
   - Turborepo generator templates

2. **Updated CI/CD:**
   - Switched from pnpm to Bun in GitHub Actions
   - Using `oven-sh/setup-bun@v2`
   - Added `--frozen-lockfile --production=false`

3. **Native Bun builds:**
   - Created custom build.mjs for baselayer using Bun.build() API
   - Handles ESM, CJS, and CLI builds
   - TypeScript declarations still via tsc

### Lessons Learned

- Bun's workspace filtering is mature enough for production
- Native performance beats Node.js-based tools
- Simpler is often better - less abstraction = easier debugging
- Migration was smoother than expected

### PR Reference

- [PR #93: feat: optimize monorepo with bun native features](https://github.com/outfitter-dev/monorepo/pull/93)
