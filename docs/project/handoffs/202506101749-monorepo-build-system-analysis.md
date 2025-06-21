# Monorepo Build System Analysis and Modernization Strategy

## Overview

During the process of preparing packages for npm publishing, we encountered critical build system issues that expose fundamental architectural problems with our TypeScript monorepo setup. While we successfully resolved immediate blockers (ESLint errors, package references), the underlying build infrastructure has deep structural issues that will impede future development and publishing workflows.

## Context

The immediate goal was to clear blockers for npm publishing. We successfully:

- Fixed 60+ ESLint errors (empty catch blocks, missing Node.js globals)
- Updated package references from `typescript-utils` to `contracts`
- Modernized require() imports to ES6 imports
- Resolved basic TypeScript configuration issues

However, the `@outfitter/contracts` package revealed a complex web of build system problems that suggest broader architectural issues with our monorepo TypeScript setup.

## Root Cause Analysis

### Primary Issue: TypeScript Project References Incompatibility

The core problem is a three-way incompatibility between:

1. **TypeScript Project References** (monorepo build orchestration)
2. **Multi-entry point packages** (complex export maps)
3. **Modern build tools** (tsup with declaration generation)

**Specific manifestation:**

```
error TS6307: File 'src/zod/env.ts' is not listed within the file list of project ''.
Projects must list all files or use an 'include' pattern.
```

### Contributing Factors

#### 1. **Inconsistent Build Tooling Strategy**

Our packages use different build approaches without a unified strategy:

- `typescript-config`: JSON-only (no build)
- `eslint-config`: Raw TypeScript compilation (`tsc`)
- `contracts`, `husky-config`, `changeset-config`: Modern bundling (`tsup`)
- `packlist`, `cli`: Mixed approaches
- `fieldguides`: Custom TypeScript compilation

**Problem**: Each tool has different expectations for TypeScript configuration, file discovery, and project references.

#### 2. **Complex Package Architecture**

The `@outfitter/contracts` package attempts advanced patterns:

- **Multiple entry points**: `@outfitter/contracts` (core) + `@outfitter/contracts/zod` (sub-path)
- **Zero-dependency core**: Sophisticated import isolation
- **TypeScript project references**: For monorepo build orchestration

**Problem**: This combination pushes TypeScript's project system beyond its reliable operation zone.

#### 3. **Monorepo Configuration Drift**

Our root `tsconfig.json` references packages inconsistently:

- Some packages have working TypeScript configs
- Others inherit improperly or have circular dependencies
- The build order assumes dependencies that aren't properly declared

#### 4. **Path Resolution Conflicts**

Multiple path resolution systems compete:

- TypeScript's `baseUrl` and `paths` mapping
- Node.js module resolution
- tsup's bundler resolution (`moduleResolution: "bundler"`)
- pnpm workspace resolution

## Deep Technical Analysis

### TypeScript Project References: Design vs Reality

**Intended workflow:**

1. Root tsconfig.json orchestrates build order via `references`
2. Each package builds independently with proper dependencies
3. Declaration files are generated and linked correctly
4. Consumers get proper type checking across package boundaries

**Actual state:**

1. ✅ Package discovery works via `references`
2. ❌ Individual package builds fail due to file listing issues
3. ❌ Declaration generation conflicts with multi-entry bundling
4. ❌ Cross-package type resolution is unreliable

### Multi-Entry Point Complexity

The `contracts` package attempts this structure:

```
@outfitter/contracts/          → src/index.ts
@outfitter/contracts/zod       → src/zod/index.ts
```

**TypeScript expectations:**

- Single entry point per project reference
- All source files discoverable via `include` patterns
- Declarations generated at predictable locations

**tsup expectations:**

- Multiple entry points specified explicitly
- Dynamic file discovery during bundling
- Declaration generation per entry point

**Conflict**: TypeScript project references don't understand tsup's multi-entry approach.

### Build Tool Evolution Mismatch

Our setup mixes build paradigms:

- **Legacy**: Direct TypeScript compilation (`tsc`)
- **Modern**: Zero-config bundling (`tsup`, `vite`)
- **Hybrid**: Project references (TypeScript 3.0 era) + modern tools

**Problem**: TypeScript project references were designed before modern bundlers became standard. The integration is fragile.

## Solution Path Analysis

### Path A: Fix Project References (High Effort, High Reliability)

**Approach**: Properly implement TypeScript project references system-wide.

**Required changes:**

1. Audit and fix all package `tsconfig.json` files
2. Ensure proper build order and dependency declarations
3. Standardize on `tsc` for declaration generation
4. Use tsup only for JS bundling, not declarations

**Pros:**

- Proper monorepo TypeScript setup
- Excellent IDE support
- Type-safe cross-package imports
- Future-proof architecture

**Cons:**

- Significant rework required (~2-3 days)
- Need to understand TypeScript project references deeply
- May require changing package architectures
- Complex debugging if issues arise

**Risk assessment**: Medium-high. Project references are powerful but complex.

### Path B: Simplify to Single Entry Points (Medium Effort, High Success Rate)

**Approach**: Eliminate multi-entry point complexity.

**Required changes:**

1. Move `@outfitter/contracts/zod` to separate package `@outfitter/contracts-zod`
2. Use single entry point per package
3. Keep tsup but with simplified configuration

**Pros:**

- Simpler package architecture
- Better tool compatibility
- Easier to debug and maintain
- Clear dependency boundaries

**Cons:**

- More packages to manage
- Users need multiple imports for related functionality
- Package discovery complexity increases

**Risk assessment**: Low. This is a well-understood pattern.

### Path C: Modern Monorepo Tooling (High Effort, Unknown Compatibility)

**Approach**: Replace TypeScript project references with modern monorepo tools.

**Options:**

- **Turborepo**: Task orchestration with caching
- **Nx**: Full monorepo management system
- **Rush**: Microsoft's monorepo tooling

**Required changes:**

1. Remove TypeScript project references
2. Implement chosen tool's configuration
3. Migrate build scripts and dependencies
4. Update CI/CD pipelines

**Pros:**

- Modern tooling designed for current ecosystem
- Better caching and incremental builds
- Industry-standard patterns
- Excellent performance

**Cons:**

- Major architectural change
- New tooling to learn and maintain
- Migration complexity
- Potential vendor lock-in

**Risk assessment**: High. Major change with unknown edge cases.

### Path D: Hybrid Approach (Low Effort, Pragmatic)

**Approach**: Keep simple packages working, isolate complex ones.

**Required changes:**

1. Remove `@outfitter/contracts` from project references temporarily
2. Build it independently with custom configuration
3. Keep other packages in project references system
4. Publish working packages immediately

**Pros:**

- Unblock immediate publishing needs
- Minimal disruption to working packages
- Can address complex package separately
- Pragmatic short-term solution

**Cons:**

- Technical debt increases
- Inconsistent build system
- Complex package isolated from type checking
- Need to solve root cause eventually

**Risk assessment**: Low. Immediate progress with deferred complexity.

### Path E: Workspace Dependencies Redesign (High Effort, Fundamental)

**Approach**: Redesign how packages depend on each other.

**Required changes:**

1. Analyze actual dependency graph vs declared dependencies
2. Eliminate circular dependencies
3. Use published versions for internal dependencies during development
4. Implement proper versioning strategy

**Pros:**

- Clean dependency architecture
- Each package truly independent
- Publishing workflow simplified
- Better version management

**Cons:**

- Requires deep dependency analysis
- Development workflow changes significantly
- May need to restructure package APIs
- Complex versioning during development

**Risk assessment**: High. Fundamental architectural change.

## Chosen Path: Simplify to Single-Entry Packages (Path B)

After evaluating the alternatives we are standardising on **Path B**—every published entry point becomes its own package and each package exposes exactly one public entry file. This removes the fragile combination of multi-entry export maps, TypeScript project references, and `tsup` declaration generation.

### High-Level Goals

1. One entry point = one package (no `/sub-path` exports).
2. Keep the existing `tsup`-based build, but with a _single_ entry file per package.
3. Eliminate TypeScript project references entirely; rely on pnpm workspace links for local development and on published versions for CI/consumers.
4. Maintain a consistent `exports`/`types`/`main` structure across **all** packages.

## Implementation Plan

The tasks are grouped by concern rather than by calendar time; execute them in the order that makes the dependency graph happy.

### 1. Package Graph Restructure

• Create a new zero-dependency core package: `packages/contracts-core` – Move **all** files currently referenced by `@outfitter/contracts`’ primary entry (`src/index.ts`) into `packages/contracts-core/src`.

• Create a dedicated extension package: `packages/contracts-zod` – Move `src/zod/**` (and any shared helpers that are _only_ used by the zod layer) into `packages/contracts-zod/src`.

• Deprecate the old multi-entry package `packages/contracts`. – Keep its directory around temporarily with a `package.json` that has `private: true` and clearly states _“do not publish”_.

• Update `pnpm-workspace.yaml` to include the two new packages and to exclude the deprecated one from publish.

### 2. Build Tooling

Each new package gets its own very small build surface:

```ts
// packages/<pkg>/tsup.config.ts
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
});
```

• Remove `declaration`-related overrides from any global `tsconfig` files; let `tsup` generate `.d.ts` in the dist for each package.
• Delete `moduleResolution: 'bundler'` unless the package _really_ needs it; default Node/TypeScript resolution now suffices.

### 3. TypeScript Configuration

• Delete the `references` array from the repo-root `tsconfig.json`—we will no longer rely on project references for build ordering.
• Add a minimalist `tsconfig.json` to each new package that _extends_ the shared base config and sets its own `include` to `src/**/*`.

```jsonc
// packages/contracts-core/tsconfig.json
{
  "extends": "@outfitter/typescript-config/next.json",
  "compilerOptions": {
    "composite": false,
  },
  "include": ["src/**/*"],
}
```

### 4. Internal Imports & Public API

• Replace all occurrences of `@outfitter/contracts/zod` with `@outfitter/contracts-zod`.
• Replace `@outfitter/contracts` (core) with `@outfitter/contracts-core` in downstream packages (`cli`, `packlist`, etc.).
• Add those new workspace packages as `dependencies` or `peerDependencies` where appropriate.

### 5. Continuous Integration & Publishing

• Update the root `package.json` release scripts (Changesets or any custom scripts) so that the new packages are picked up during versioning/publishing.
• Ensure the deprecated `contracts` package is marked `private: true` so it can never accidentally ship.
• Verify that `changeset config` is aware of the new packages for changelog generation.

### 6. Verification Checklist

- [ ] `pnpm install && pnpm -r build` completes with no errors.
- [ ] `pnpm -r test` (or `vitest`) passes for every package.
- [ ] `ts-node`/IDE IntelliSense resolves cross-package types without project references.
- [ ] Publishing dry-run (`changeset publish --dry`) shows **only** the intended packages (`contracts-core`, `contracts-zod`) and omits the deprecated one.

## Key Decision Record

1. **Path B accepted** — eliminate multi-entry packages in favour of single-entry, single-responsibility packages.
2. **Project references removed** — they provided negative ROI compared to normal workspace linking and tsup-generated declarations.
3. **Deprecated package isolated** — keeping it in-repo but private avoids breaking existing checkouts while preventing future publication mistakes.

---

_This update supersedes the earlier “hybrid” plan. The repository will converge on a simpler, package-per-entry-point architecture that aligns with ecosystem norms and removes the largest friction point in our build pipeline._

## References

- [TypeScript Project References Documentation](https://www.typescriptlang.org/docs/handbook/project-references.html)
- [tsup Multi-Entry Point Configuration](https://tsup.egoist.dev/#multiple-entry-points)
- [pnpm Workspace Documentation](https://pnpm.io/workspaces)
- [Monorepo Build System Comparison](https://nx.dev/concepts/more-concepts/monorepo-vs-polyrepo)

---

_This handoff represents 4+ hours of investigation into monorepo build system issues. The root cause is architectural complexity that has outgrown our tooling setup. The recommended hybrid approach balances immediate needs with long-term sustainability._
