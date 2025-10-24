# Outfitter Shared Infrastructure - Master Plan

**Status:** Planning
**Created:** 2025-10-17
**Owner:** Matt Galligan (@galligan)
**Purpose:** Consolidate shared infrastructure across all Outfitter TypeScript projects into the monorepo

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Current State Analysis](#current-state-analysis)
3. [Architecture Overview](#architecture-overview)
4. [Package Specifications](#package-specifications)
5. [Implementation Milestones](#implementation-milestones)
6. [Project Migration Strategy](#project-migration-strategy)
7. [Tooling & Standards](#tooling--standards)
8. [Success Metrics](#success-metrics)
9. [Dependencies & Sequencing](#dependencies--sequencing)
10. [Appendices](#appendices)

---

## Executive Summary

### Vision

Consolidate proven patterns from 6+ TypeScript projects (blz, carabiner, ruleset, climb, ranger, waymark) into a shared monorepo infrastructure that:
- Eliminates code duplication (30-40% reduction target)
- Accelerates new project development (2-6x faster)
- Ensures consistency across error handling, configuration, testing
- Provides cross-language tooling via shared Bun-first scripts (with shell fallbacks)
- Establishes Bun-first, type-safe foundations

### Key Insight

The legacy `/monorepo` directory already has **excellent foundations** (preserved at `/Users/mg/Developer/outfitter/monorepo` for reference), and active work now lives in `monorepo-next` (still published as `monorepo` on GitHub and npm):
- ✅ `@outfitter/contracts` - Production-ready Result/Error patterns (v1.1.0)
- ✅ `@outfitter/types` - Type utilities + branded types (v0.1.0)
- ✅ `@outfitter/baselayer` - Config orchestration (v0.0.0)
- ✅ Build system, testing, git hooks, changesets all configured

**Strategy:** Don't rebuild—extend, consolidate, and migrate.

### Scope

**6 TypeScript Projects:**
- **blz** (Rust with TS tooling) - Reference patterns
- **carabiner** - Extract error handling, hooks, testing
- **ruleset** - Extract validation, config patterns
- **climb** - New project, 100% adoption pilot
- **ranger** - Active development, aggressive adoption
- **waymark** - Stable, moderate adoption

**Plus:** Integrate `/actions` repository for shared CI/CD

### Goals

1. **Standardize on v1.0.0** - Aggressive commitment to stable APIs
2. **Bun-first philosophy** - Prefer Bun over external dependencies
3. **Shared execution strategy** - Cross-language tooling via Bun-first scripts (with shell fallbacks)
4. **Zero duplicate patterns** - One Result type, one config loader, one logger
5. **Fast project bootstrap** - New projects up in days, not weeks

---

## Current State Analysis

### Existing Monorepo Infrastructure

**Location:** `/Users/mg/Developer/outfitter/monorepo-next` (published as `monorepo`; legacy workspace remains at `/Users/mg/Developer/outfitter/monorepo` for reference)

**Published Packages:**
- `@outfitter/contracts` v1.1.0 - Zero-dependency error/result patterns
- `@outfitter/types` v0.1.0 - Type utilities + branded types
- `@outfitter/baselayer` v0.0.0 - Config orchestration + CLI
- `outfitter` CLI v1.1.0 - Development tool
- `@outfitter/fieldguides` v1.0.4 - Living documentation system

**Shared Infrastructure:**
- `@outfitter/shared` (private) - Shared configs (TS, Biome, Vitest, Remark)

**Current State:**
- ✅ Bun workspaces configured
- ✅ Turbo build orchestration
- ✅ Changesets for versioning
- ✅ Lefthook git hooks
- ✅ Biome (via Ultracite) formatting/linting
- ⚠️ 20+ stale feature/fix branches (needs cleanup)
- ⚠️ Dependency version drift across projects

### Toolchain Audit Snapshot (2025-10-18)

| Project | Biome Config | Lefthook | Bun Config | `packageManager` | Notes |
|---------|--------------|----------|------------|------------------|-------|
| blz | ❌ | ✅ | ❌ | n/a | Primarily Rust; shared TS tooling not yet in place. |
| carabiner | ✅ (`biome.json`) | ✅ | ❌ | `bun@1.2.21` | Needs Bun upgrade and shared config adoption. |
| ruleset | ✅ (`biome.jsonc`) | ✅ | ❌ | `bun@1.2.22` | Close to target but still below Bun 1.3.0+. |
| climb | ✅ (`biome.jsonc`) | ❌ | ✅ (`bunfig.toml`) | n/a | Greenfield; ensure package manager pin once bootstrap lands. |
| ranger | ✅ (`biome.json`) | ❌ | ❌ | `bun@1.2.20` | Missing bunfig and hooks; upgrade required. |
| waymark | ✅ (`biome.json`) | ✅ | ✅ (`bunfig.toml`) | `bun@1.2.22` | Closest to goal; still needs Bun 1.3.0+. |

_Audit source: directory inspection within `/Users/mg/Developer/outfitter` on 2025-10-18._

### Projects Analysis Summary

#### blz (Rust)
**Key Patterns:**
- HTTP client with retry/backoff/ETag support
- File locking utilities
- Configuration management (XDG paths, multi-format)
- CLI utilities (formatting, progress, args parsing)
- Error categorization with recovery heuristics
- Extensive testing patterns

**Shareable:** HTTP client patterns, CLI utilities, config patterns
**Keep Local:** Rust-specific implementation

#### carabiner
**Key Patterns:**
- **Production-grade error handling** (100+ error codes, categorization, recovery)
- Branded types system
- Pino-based structured logging with sanitization
- Hook testing framework
- Security validators (workspace-scoped, path validation)
- Plugin/provider registry pattern

**Shareable:** Error management, types, logging, testing, security
**Keep Local:** Claude Code hooks system

#### ruleset
**Key Patterns:**
- Zod schema-first type definitions
- JSON Schema generation from Zod
- Result pattern (similar to contracts)
- Configuration loading (TOML/JSONC/YAML)
- Capability registry pattern
- Provider SDK pattern

**Shareable:** Validation utilities, config loading, provider patterns
**Keep Local:** Compiler/pipeline packages

#### ranger
**Key Patterns:**
- Work item normalization across providers (Linear, GitHub)
- Provider abstraction interface
- Zod validation everywhere
- Cloudflare Workers patterns (Durable Objects, D1, R2)
- Survey system (code review aggregation)

**Shareable:** Provider patterns, work item abstraction, Workers utilities
**Keep Local:** Domain-specific packages (survey, ranger-core)

#### waymark
**Key Patterns:**
- XDG config resolution with multi-format support
- Tree-sitter markdown parsing
- SQLite-backed caching
- Excellent CLI display utilities (tree, flat, grouped rendering)
- ID management with fingerprinting
- Glob expansion with gitignore support

**Shareable:** Config loading, CLI display, caching, markdown utilities
**Keep Local:** Grammar, core domain logic

#### climb (New)
**Status:** Greenfield project
**Strategy:** 100% adoption pilot - use all shared packages from day 1

### Actions Repository

**Location:** `/Users/mg/Developer/outfitter/actions`

**Contents:**
- Belay workflow (zero-config CI)
- Detector composite action
- Setup scripts (setup-belay.sh)
- with-retry.sh helper
- Documentation

**Integration Plan:** Move into monorepo as `packages/actions`

---

## Architecture Overview

### Bun-First Philosophy

**Core Principle:** Wherever Bun can replace an external dependency, prefer Bun.

**Concrete Decisions:**
- `Bun.file` over `fs-extra`
- `bun test` over Jest (Vitest as fallback for advanced features)
- `Bun.SQL` over `better-sqlite3`
- `Bun.serve()` with WebSockets over Express
- Bun's built-in crypto, fetch, streams

**Rationale:** Bun is on a development tear; betting on their momentum pays long-term dividends.

### Package Organization Principles

#### Internal vs. External Naming
- **Internal:** `/packages/[name]` - Directory structure
- **NPM:** `@outfitter/[name]` - Published package name
- **Private:** Some packages remain workspace-only

#### Sub-path Exports Strategy

**Use sub-paths when:**
- ✅ Different use cases with minimal overlap
- ✅ Security/critical concerns need explicit imports
- ✅ Optional features (tree-shakeable)

**Keep flat when:**
- ✅ Small, cohesive scope
- ✅ Everything depends on everything (avoid circular deps)

**Examples:**
```typescript
// Sub-path (granular, tree-shakeable)
import { loadToml } from '@outfitter/config/loaders';
import { resolvePath } from '@outfitter/config/resolvers';

// Flat (cohesive, all used together)
import { Maybe, Optional, DeepPartial } from '@outfitter/types';
```

#### Dependency Strategy

**Standardize versions across all packages:**
- Use `syncpack` to enforce consistency
- Workspace protocol: `workspace:*` for internal deps
- External deps: Caret ranges for flexibility, exact for stability

**Target Versions:**
```json
{
  "bun": "1.3.0+",
  "typescript": "5.9.2",
  "zod": "3.25.1",
  "type-fest": "5.0.1",
  "@biomejs/biome": "2.2.4",
  "turbo": "2.5.8",
  "vitest": "1.6.1",
  "pino": "9.13.0",
  "commander": "14.0.1",
  "chalk": "5.6.2",
  "ora": "9.0.0",
  "inquirer": "12.9.6"
}
```

### Script Execution Strategy

**Purpose:** Ensure shared tooling runs consistently across TypeScript and non-TypeScript projects without relying on bespoke binaries.

**Approach:**
1. Guarantee Bun is available early via shared install scripts consumed by CI and local bootstrap flows.
2. Ship Bun-first automation through `@outfitter/scripts`, with lightweight POSIX wrappers for environments that cannot assume Bun yet (primarily BLZ).
3. Document fallback pathways so teams can bootstrap with shell scripts and switch to Bun as soon as the runtime is provisioned.

See Appendix E for the canonical `install-bun.sh` snippet used by these flows.

**Example Workflow:**
```bash
./scripts/setup/install-bun.sh && bunx @outfitter/scripts setup dev
```

**Future Option:** Revisit Bun-compiled binaries only if we encounter environments where installing Bun is impractical.

---

## Package Specifications

### [MONO-2](https://linear.app/outfitter/issue/MONO-2) — Foundation (P0 - Critical)

**No new packages - cleanup and standardization**

#### Monorepo Cleanup ([MONO-48](https://linear.app/outfitter/issue/MONO-48))
- Merge or close all feature branches
- Delete backup/* branches
- Clean up stale fix/* branches
- Reset to clean main branch

#### Dependency Standardization ([MONO-49](https://linear.app/outfitter/issue/MONO-49), [MONO-52](https://linear.app/outfitter/issue/MONO-52))
- Upgrade Bun to 1.3.0+
- Upgrade all packages to target versions
- Run full test suite
- Fix breaking changes
- Configure syncpack
- Update lockfiles

#### Tooling Standards ([MONO-50](https://linear.app/outfitter/issue/MONO-50), [MONO-51](https://linear.app/outfitter/issue/MONO-51), [MONO-30](https://linear.app/outfitter/issue/MONO-30))
- **Biome** for formatting (via Ultracite)
- **Oxlint** for linting (Ultracite-compatible rules)
- **Turbo** standardized configs
- **act** for local GitHub Actions testing
- **actionlint** for GitHub Actions YAML validation
- Confirm full suite passes ([MONO-53](https://linear.app/outfitter/issue/MONO-53))

---

### [MONO-3](https://linear.app/outfitter/issue/MONO-3) — Core Packages (P0-P1)

#### `@outfitter/contracts` v2.0.0 (P0) — [MONO-4](https://linear.app/outfitter/issue/MONO-4)

**Status:** ENHANCE EXISTING
**Current:** v1.1.0 with Result pattern, AppError, branded types, Zod integration

**Enhancements from carabiner:**

```typescript
// Enhanced error system
export interface ExtendedAppError extends AppError {
  readonly severity: 'CRITICAL' | 'ERROR' | 'WARNING' | 'INFO';
  readonly category: ErrorCategory;
  readonly correlationId: string;
  readonly timestamp: number;
  readonly isRecoverable: boolean;
  readonly isRetryable: boolean;
}

export type ErrorCategory =
  | 'VALIDATION' | 'RUNTIME' | 'NETWORK'
  | 'FILESYSTEM' | 'CONFIGURATION' | 'SECURITY'
  | 'TIMEOUT' | 'RESOURCE' | 'AUTH';

// Error code registry (100+ codes)
export const ERROR_CODES = {
  // Validation errors (1000-1999)
  INVALID_INPUT: 1000,
  SCHEMA_VALIDATION_FAILED: 1001,
  // Runtime errors (2000-2999)
  UNEXPECTED_STATE: 2000,
  // Network errors (3000-3999)
  REQUEST_FAILED: 3000,
  // ... 100+ total codes
} as const;

// Recovery heuristics
export function isRecoverable(error: AppError): boolean;
export function isRetryable(error: AppError): boolean;
export function shouldRetry(error: AppError, attemptCount: number): boolean;

// Result combinators
export function sequence<T, E>(
  results: Result<T, E>[]
): Result<T[], E>;

export function parallel<T, E>(
  promises: Promise<Result<T, E>>[]
): Promise<Result<T[], E>>;
```

**Sub-paths:**
- `/error` - Base error types
- `/error/categories` - Error categorization
- `/error/recovery` - Recovery heuristics
- `/error/codes` - Error code registry
- `/result` - Result pattern
- `/result/combinators` - Sequence, parallel, partition
- `/assert` - Runtime assertions
- `/branded` - Branded types
- `/zod` - Zod integration

**Dependencies:**
- `zod` (required)
- `type-fest` (peer)

**Source:** carabiner/error-management

---

#### `@outfitter/types` v1.0.0 (P0) — [MONO-5](https://linear.app/outfitter/issue/MONO-5)

**Status:** ENHANCE EXISTING
**Current:** v0.1.0 with type-fest re-exports + branded types

**Additions:**

```typescript
// Config-related types (cross-cutting)
export type ConfigScope = 'project' | 'user' | 'default';
export type ConfigFormat = 'toml' | 'jsonc' | 'yaml';

// Additional utility types
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type Maybe<T> = T | null | undefined;

// Already exists:
export type DeepPartial<T> = ...;
export type DeepReadonly<T> = ...;
```

**Structure:** Flat (cohesive, no sub-paths needed)

**Dependencies:**
- `type-fest@5.0.1` (upgrade from 4.41.0)
- `@outfitter/contracts` (peer)

**Source:** ranger/shared, waymark types

---

#### `@outfitter/config` v1.0.0 (P1) — [MONO-6](https://linear.app/outfitter/issue/MONO-6)

**Status:** NEW
**Purpose:** Universal configuration loading with multi-format support

```typescript
// Main export - batteries included
export async function loadConfig<T>(options: LoadOptions<T>): Promise<T>;

export interface LoadOptions<T> {
  schema: z.ZodSchema<T>;
  scope?: ConfigScope; // 'project' | 'user' | 'default'
  formats?: ConfigFormat[]; // ['toml', 'jsonc', 'yaml']
  name?: string; // Config file base name
}

// Granular sub-path exports
import { resolvePath } from '@outfitter/config/resolvers';
import { loadToml, loadYaml, loadJsonc } from '@outfitter/config/loaders';
import { validateConfig } from '@outfitter/config/schema';
```

**Features:**
- XDG directory support (`~/.config/[name]/`, `./.config/[name]/`)
- Multi-format loading (TOML → JSONC → YAML precedence)
- Scoped resolution (project → user → defaults)
- Zod schema validation at load time
- Backward compatibility fallbacks

**Sub-paths:**
- `/loaders` - Format-specific loaders (TOML, YAML, JSONC)
- `/resolvers` - XDG path resolution + precedence logic
- `/schema` - Zod schema integration

**Dependencies:**
- `zod` (required)
- `yaml`, `@iarna/toml`, `strip-json-comments`
- `@outfitter/contracts`, `@outfitter/types`

**Source:** waymark/core/config, blz-core/config patterns, ruleset

---

#### `@outfitter/validation` v1.0.0 (P1) — [MONO-7](https://linear.app/outfitter/issue/MONO-7)

**Status:** NEW
**Purpose:** Enhanced Zod utilities beyond basic validation

```typescript
// Schema registry pattern
export function createSchemaRegistry(): SchemaRegistry;
export interface SchemaRegistry {
  register<T>(name: string, schema: z.ZodSchema<T>): void;
  get<T>(name: string): z.ZodSchema<T> | undefined;
  validate<T>(name: string, data: unknown): Result<T, ValidationError>;
}

// JSON Schema generation
export function generateJsonSchema<T>(
  schema: z.ZodSchema<T>,
  options?: JsonSchemaOptions
): JSONSchema;

// Diagnostic formatting
export function validateWithDiagnostics<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): Result<T, Diagnostic[]>;

export interface Diagnostic {
  path: string[];
  message: string;
  code: string;
  severity: 'error' | 'warning';
}

// Environment validation
export function createEnvValidator<T>(
  schema: z.ZodSchema<T>
): T;
```

**Features:**
- Schema registry for reusable schemas
- JSON Schema generation (for OpenAPI, etc.)
- Structured diagnostic output
- Type-safe environment variable validation

**Structure:** Flat (Zod-centric, cohesive API)

**Dependencies:**
- `zod` (required)
- `zod-to-json-schema`
- `@outfitter/contracts`

**Source:** ruleset/types, ranger patterns

**Future Consideration:** OpenAPI, TypeBox, Protocol Buffers generation

---

#### `@outfitter/env` v1.0.0 (P1) — [MONO-8](https://linear.app/outfitter/issue/MONO-8)

**Status:** NEW (lower priority)
**Purpose:** Standardize environment configuration for Bun projects using `.env` conventions and Bun Secrets.

```typescript
// Environment validation
export function validateEnv<T>(
  schema: z.ZodSchema<T>,
  options?: EnvOptions
): T;

export interface EnvOptions {
  required?: string[];
  optional?: string[];
  defaults?: Record<string, string>;
  prefix?: string; // e.g., 'APP_'
}

// Bun secrets integration (primary path)
export async function loadBunSecrets(
  secretNames: string[]
): Promise<Record<string, string>>;

// .env helpers for local development
export function loadDotEnv(
  filePath?: string
): Record<string, string>;

// Environment profiles (development, staging, production)
export function resolveEnvProfile(
  env: 'development' | 'staging' | 'production'
): Record<string, string>;
```

**Features:**
- Zod schema validation for env vars
- Bun Secrets as the default secrets store for Bun workloads
- `.env` file loading for local development and legacy flows
- Simple environment profile resolution utilities
- Type-safe accessors (no broader secrets manager yet)

**Structure:** Flat

**Dependencies:**
- `zod` (required)
- `@outfitter/contracts`, `@outfitter/validation`

**Source:** Patterns from all projects, Bun Secrets API

**Note:** Treat this as a later-milestone add-on—the immediate win is aligning on Bun Secrets and consistent `.env` handling once the core toolchain is shared.

---

#### `@outfitter/baselayer` v1.0.0 (P3)

**Status:** EVOLVE LATER
**Current:** v0.0.0 with config presets + CLI

**Strategy:** Keep existing, enhance after other packages are stable

**Reason:** More focused on project setup; other packages provide runtime value first

---

### [MONO-10](https://linear.app/outfitter/issue/MONO-10) — Infrastructure Packages (P1)

#### `@outfitter/cli-kit` v1.0.0 (P1) — [MONO-11](https://linear.app/outfitter/issue/MONO-11)

**Status:** NEW
**Purpose:** Complete CLI building toolkit

```typescript
// Command building (commander patterns)
import { createCommand, CommandOptions } from '@outfitter/cli-kit/commands';

// Output formatting
import {
  jsonFormatter,
  tableFormatter,
  treeFormatter
} from '@outfitter/cli-kit/output';

// Interactive prompts
import {
  confirm,
  select,
  input,
  password
} from '@outfitter/cli-kit/prompts';

// Progress indicators
import {
  spinner,
  progressBar
} from '@outfitter/cli-kit/progress';

// Display utilities (from waymark)
import {
  displayTree,
  displayFlat,
  displayGrouped
} from '@outfitter/cli-kit/display';

// Process execution
import { exec, execSync } from '@outfitter/cli-kit/exec';
```

**Features:**
- Command builder utilities (commander)
- Formatters (JSON, JSONL, table, tree)
- Interactive prompts (inquirer)
- Spinners and progress bars (ora)
- Argument parsing helpers
- Rich terminal output (waymark's display patterns)
- Process execution wrappers (execa)
- Release utilities

**Color Library Strategy:**
- Support **both** `picocolors` (lightweight) AND `chalk` (feature-rich)
- Easy switching via adapters
- Future: TUI library adapters

**Sub-paths:**
- `/commands` - Command builder utilities
- `/output` - Formatters (JSON, JSONL, table, tree)
- `/prompts` - Interactive prompts
- `/progress` - Spinners, progress bars
- `/args` - Argument parsing
- `/display` - Rich terminal output
- `/exec` - Process execution

**Dependencies:**
- `commander`, `inquirer`, `ora`, `cli-table3`
- `picocolors` AND `chalk` (both supported)
- `execa` (process execution)
- `@outfitter/contracts`, `@outfitter/types`

**Source:** waymark/cli/utils, blz-cli/utils, ranger/survey

---

#### `@outfitter/logging` v1.0.0 (P1) — [MONO-12](https://linear.app/outfitter/issue/MONO-12)

**Status:** NEW
**Purpose:** Production structured logging with sanitization

```typescript
// Logger interface
export interface Logger {
  trace(message: string, context?: object): void;
  debug(message: string, context?: object): void;
  info(message: string, context?: object): void;
  warn(message: string, context?: object): void;
  error(message: string | Error, context?: object): void;
  fatal(message: string | Error, context?: object): void;
  child(bindings: object): Logger;
}

// Factory
export function createLogger(options: LoggerOptions): Logger;

export interface LoggerOptions {
  level?: 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';
  format?: 'json' | 'pretty';
  redact?: string[]; // Paths to redact (e.g., ['password', 'apiKey'])
  bindings?: object; // Default context
}

// Sanitization
export function sanitizeForLogging(
  data: unknown,
  options?: SanitizeOptions
): unknown;
```

**Features:**
- Pino-based structured logging
- Automatic sensitive data sanitization
- Environment-aware formatting (JSON for prod, pretty for dev)
- Level control via env vars
- Child logger support with context
- Redaction of secrets/PII

**Structure:** Flat

**Dependencies:**
- `pino` (required)
- `pino-pretty` (dev)
- `@outfitter/contracts`

**Source:** carabiner/hooks-core/logging, waymark/cli/logger

---

#### `@outfitter/hooks` v1.0.0 (P1) — [MONO-13](https://linear.app/outfitter/issue/MONO-13)

**Status:** NEW
**Purpose:** Git hook automation and patterns

```typescript
// Git hooks (lefthook patterns)
import {
  createPreCommit,
  createPrePush,
  createCommitMsg
} from '@outfitter/hooks/git';

export interface HookConfig {
  format?: boolean;
  lint?: boolean;
  typecheck?: boolean;
  test?: boolean;
  stagedFilesOnly?: boolean;
}

export function createPreCommit(config: HookConfig): string;
export function createPrePush(config: HookConfig): string;
```

**Features:**
- Lefthook configuration builder
- Hook script generators
- Common hook recipes (format, lint, test, typecheck)
- Pre-commit/pre-push templates

**Sub-paths:**
- `/git` - Git hook patterns (lefthook)
- (Future) `/other` - Other hook types

**Structure:** Supports both git and future hook types

**Dependencies:** None (generates YAML/scripts)

**Source:** Patterns from all projects' lefthook configs

---

#### `@outfitter/source-control` v1.0.0 (P1) — [MONO-14](https://linear.app/outfitter/issue/MONO-14)

**Status:** NEW
**Purpose:** Git, Graphite, and source control utilities

```typescript
// Git utilities
import {
  parseCommit,
  validateBranchName,
  getCommitHistory
} from '@outfitter/source-control/git';

// Graphite workflows
import {
  getStackInfo,
  getStackPosition,
  submitStack
} from '@outfitter/source-control/graphite';

// Worktree management
import {
  createWorktree,
  listWorktrees,
  removeWorktree
} from '@outfitter/source-control/worktrees';

// Conventional commits
export function parseConventionalCommit(message: string): CommitInfo;
export function validateConventionalCommit(message: string): boolean;
```

**Features:**
- Git integration utilities
- Graphite workflow patterns
- Worktree management
- GitButler integration (future)
- Conventional commits parsing
- Branch name validation
- Commit message templates

**Sub-paths:**
- `/git` - Core Git utilities
- `/graphite` - Graphite workflow patterns
- `/worktrees` - Worktree management
- (Future) `/gitbutler` - GitButler integration

**Dependencies:**
- None (wraps git CLI)
- `@outfitter/contracts`

**Source:** Patterns from all projects

---

#### `@outfitter/scripts` v1.0.0 (P1) — [MONO-15](https://linear.app/outfitter/issue/MONO-15)

**Status:** NEW
**Purpose:** Consolidated setup/bootstrap scripts for dev, CI, and agent environments without assuming a compiled binary.

**Structure:**
```
@outfitter/scripts/
├── setup/
│   ├── dev-environment.sh
│   ├── ci-environment.sh
│   ├── agent-environment.sh
│   └── install-bun.sh
├── bootstrap/
│   ├── bun-project.sh
│   ├── rust-project.sh
│   └── monorepo.sh
└── utils/
    ├── check-environment.sh
    └── bun-run.ts
```

**Features:**
- Dev environment setup with Bun-first scripts
- CI bootstrap that ensures Bun is installed before running shared tooling
- Agent environment setup with consistent prerequisites
- Tool installation (Bun, Rust, Node, etc.)
- Project bootstrapping helpers for TypeScript and Rust workspaces
- POSIX-friendly wrappers for projects that cannot assume Bun yet (e.g., BLZ until Bun is provisioned earlier in CI)
- Shared Bun install helper script (see Appendix E)

**Usage:**
```bash
# Guarantee Bun availability (CI/local)
./scripts/setup/install-bun.sh

# Run Bun-powered workflow once Bun is present
bunx @outfitter/scripts setup dev

# Fallback wrapper when only POSIX shell is available
./scripts/setup/dev-environment.sh
```

**Source Scripts Consolidated:**
- blz: setup.sh, install.sh, scripts/bootstrap-fast.sh, scripts/setup-*.sh
- carabiner: scripts/install.sh
- ruleset: scripts/install-binary.sh, scripts/setup-sandbox.sh
- actions: setup-belay.sh

**Dependencies:** Bun runtime (ensured by install step), POSIX shell for wrappers

---

#### `@outfitter/actions` v1.0.0 (P1) — [MONO-16](https://linear.app/outfitter/issue/MONO-16)

**Status:** INTEGRATE EXISTING
**Purpose:** Shared GitHub Actions and CI utilities

**Current Location:** `/Users/mg/Developer/outfitter/actions`

**Integration Plan:**
1. Move actions repo content into `monorepo/packages/actions`
2. Keep as published `@outfitter/actions` package
3. Cross-reference with `@outfitter/scripts`
4. Use `@outfitter/cli-kit` utilities where applicable

**Contents:**
- Belay workflow (zero-config CI)
- Detector composite action
- with-retry.sh helper
- Local testing with act
- Documentation

**Structure:**
```
packages/actions/
├── .github/
│   ├── workflows/belay.yml
│   └── actions/detector/
├── scripts/
│   └── with-retry.sh
└── docs/
```

**Dependencies:**
- `@outfitter/cli-kit` (for utilities)
- `@outfitter/scripts` (for setup)

---

#### `@outfitter/file-ops` v1.0.0 (P1) — [MONO-17](https://linear.app/outfitter/issue/MONO-17)

**Status:** NEW
**Purpose:** Secure file operations with validation

```typescript
// Security (path validation, traversal prevention)
import {
  resolveSecurePath,
  validatePath,
  isWithinWorkspace
} from '@outfitter/file-ops/security';

// Locking
import {
  withFileLock,
  acquireLock,
  releaseLock
} from '@outfitter/file-ops/locking';

// Glob expansion with ignore
import {
  expandGlob,
  matchPattern
} from '@outfitter/file-ops/glob';
```

**Features:**
- Workspace-scoped path validation
- Directory traversal prevention
- File locking utilities
- Glob expansion with gitignore support
- **Prefer Bun.file over fs-extra**

**Sub-paths:**
- `/security` - Path validation, traversal prevention
- `/locking` - File locking
- `/glob` - Glob expansion with ignore

**Dependencies:**
- `micromatch` (glob matching)
- `ignore` (gitignore parsing)
- Bun.file (native file operations)
- `@outfitter/contracts`

**Source:** carabiner/hooks-cli/security, waymark/cli/fs, ruleset/core/utils

---

### [MONO-18](https://linear.app/outfitter/issue/MONO-18) — Specialized Packages (P2)

#### `@outfitter/testing` v1.0.0 (P2) — [MONO-19](https://linear.app/outfitter/issue/MONO-19)

**Status:** NEW
**Purpose:** Testing utilities and patterns

```typescript
// Test builders
import {
  createTestSuite,
  createTest,
  testBuilders
} from '@outfitter/testing/builders';

// Fixtures
import {
  createFixture,
  loadFixture
} from '@outfitter/testing/fixtures';

// Mocks
import {
  mockFunction,
  mockModule
} from '@outfitter/testing/mocks';
```

**Features:**
- Test case builders for common scenarios
- Fixture helpers and management
- Mock utilities
- Bun test patterns (primary)
- Vitest patterns (fallback)

**Sub-paths:**
- `/builders` - Test case builders
- `/fixtures` - Fixture helpers
- `/mocks` - Mock utilities

**Dependencies:**
- `vitest` (peer, optional)
- Bun test (built-in)
- `@outfitter/contracts`

**Source:** carabiner/hooks-testing, waymark patterns

---

#### `@outfitter/development` v1.0.0 (P2) — [MONO-20](https://linear.app/outfitter/issue/MONO-20)

**Status:** NEW
**Purpose:** Development and debugging utilities

```typescript
// Debug helpers
import {
  prettyPrint,
  formatStack,
  inspectObject
} from '@outfitter/development/debug';

// Profiling
import {
  startProfile,
  endProfile,
  measurePerformance
} from '@outfitter/development/profiling';

// Utilities
import {
  colorize,
  formatDuration,
  formatBytes
} from '@outfitter/development/utils';
```

**Features:**
- Debug utilities (pretty-printing, stack traces)
- Performance profiling helpers
- Development-time logging
- Object inspection
- Memory profiling

**Sub-paths:**
- `/debug` - Debug helpers
- `/profiling` - Performance profiling
- `/utils` - General dev utilities

**Priority:** Higher (compounding effects on developer experience)

**Dependencies:**
- `@outfitter/contracts`, `@outfitter/logging`

---

#### `@outfitter/providers` v1.0.0 (P2) — [MONO-21](https://linear.app/outfitter/issue/MONO-21)

**Status:** NEW
**Purpose:** API client SDK patterns and provider abstraction

```typescript
// Provider interface
export interface Provider<T> {
  name: string;
  version: string;
  canHandle(context: unknown): Promise<boolean>;
  initialize(config: unknown): Promise<void>;
  execute(input: T): Promise<Result<unknown, Error>>;
}

// Per-provider sub-paths
import { LinearClient } from '@outfitter/providers/linear';
import { GitHubClient } from '@outfitter/providers/github';
import { OpenAIClient } from '@outfitter/providers/openai';

// Each provider exports
export const LinearProvider = {
  types: { /* TypeScript types */ },
  client: LinearClient,
  utils: { /* Helper functions */ }
};
```

**Features:**
- Generic provider abstraction pattern
- SDK wrapper patterns (singleton, token management, pagination)
- Per-provider sub-paths with types, client, utils
- Could consolidate carabiner hooks-registry, ruleset providers

**Sub-paths:**
- `/linear` - Linear SDK wrapper
- `/github` - GitHub (Octokit) wrapper
- `/openai` - OpenAI SDK wrapper
- (Future) Additional providers as needed

**Consider:** `@outfitter/adapters` as umbrella concept?

**Dependencies:**
- `@linear/sdk`, `@octokit/rest`, etc. (peer dependencies)
- `@outfitter/contracts`, `@outfitter/http-kit`

**Source:** ranger (Linear, GitHub), carabiner patterns, ruleset providers

---

#### `@outfitter/workers` v1.0.0 (P2) — [MONO-22](https://linear.app/outfitter/issue/MONO-22)

**Status:** NEW
**Purpose:** Cloudflare Workers templates and utilities

```typescript
// Cloudflare Workers helpers
import {
  createWorker,
  handleRequest
} from '@outfitter/workers/cloudflare';

// Durable Objects
import {
  createDurableObject,
  DurableObjectBase
} from '@outfitter/workers/durable-objects';

// D1 utilities
import {
  createD1Client,
  runMigration
} from '@outfitter/workers/d1';

// R2 utilities
import {
  uploadToR2,
  downloadFromR2
} from '@outfitter/workers/r2';

// Queues
import {
  enqueueJob,
  processQueue
} from '@outfitter/workers/queues';
```

**Features:**
- Cloudflare Workers templates
- Durable Objects patterns
- D1 (SQLite) utilities
- R2 (object storage) utilities
- Queue management
- Background job processing

**Sub-paths:**
- `/cloudflare` - Workers helpers
- `/durable-objects` - Durable Objects patterns
- `/d1` - D1 utilities
- `/r2` - R2 utilities
- `/queues` - Queue management

**Priority:** Medium (high value for serverless projects)

**Dependencies:**
- `@cloudflare/workers-types` (types only)
- `@outfitter/contracts`

**Source:** ranger (linear-agent, logbooks)

---

#### `@outfitter/caching` v1.0.0 (P2) — [MONO-23](https://linear.app/outfitter/issue/MONO-23)

**Status:** NEW
**Purpose:** Unified caching strategies with multiple backends

```typescript
// Cache interface
export interface Cache<T> {
  get(key: string): Promise<T | undefined>;
  set(key: string, value: T, ttl?: number): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
}

// Memory cache
import { createMemoryCache } from '@outfitter/caching/memory';

// SQLite cache
import { createSQLiteCache } from '@outfitter/caching/sqlite';

// File cache
import { createFileCache } from '@outfitter/caching/file';

// Adapters for different backends
import { createCacheAdapter } from '@outfitter/caching/adapters';
```

**Features:**
- Unified cache interface
- Memory caching (LRU)
- SQLite-backed caching
- File-based caching
- Adapter pattern for custom backends
- TTL support
- Cache invalidation strategies

**Sub-paths:**
- `/memory` - In-memory LRU cache
- `/sqlite` - SQLite-backed cache (Bun.SQL)
- `/file` - File-based cache
- `/adapters` - Adapter utilities

**Priority:** Medium-low (useful but not critical)

**Dependencies:**
- Bun.SQL (for SQLite)
- `@outfitter/contracts`

**Source:** waymark cache, blz LRU patterns

---

#### `@outfitter/http-kit` v1.0.0 (P2) — [MONO-24](https://linear.app/outfitter/issue/MONO-24)

**Status:** NEW
**Purpose:** HTTP client with advanced patterns

```typescript
// HTTP client with retry/backoff
export async function fetch(
  url: string,
  options?: FetchOptions
): Promise<Response>;

export interface FetchOptions extends RequestInit {
  retry?: RetryOptions;
  timeout?: number;
  etag?: string;
  rateLimit?: RateLimitOptions;
}

// Retry configuration
export interface RetryOptions {
  maxAttempts: number;
  backoff: 'exponential' | 'linear';
  baseDelay: number;
  maxDelay: number;
}

// Rate limiting
export interface RateLimitOptions {
  requestsPerSecond: number;
  burst?: number;
}
```

**Features:**
- Retry with exponential backoff
- ETag-based conditional requests
- Rate limiting
- Timeout handling
- Platform-specific TLS
- Built on native fetch (Bun)

**Structure:** Flat (cohesive HTTP utilities)

**Priority:** Lower (useful but projects can use fetch directly)

**Dependencies:**
- Native fetch (Bun)
- `@outfitter/contracts`, `@outfitter/resilience`

**Source:** blz-core/fetcher patterns

---

#### `@outfitter/resilience` v1.0.0 (P2) — [MONO-25](https://linear.app/outfitter/issue/MONO-25)

**Status:** NEW
**Purpose:** Retry, circuit breaker, and timeout patterns

```typescript
// Retry with backoff
export async function retry<T>(
  fn: () => Promise<T>,
  options: RetryOptions
): Promise<T>;

// Circuit breaker
export class CircuitBreaker<T> {
  async execute(fn: () => Promise<T>): Promise<T>;
  getState(): 'CLOSED' | 'OPEN' | 'HALF_OPEN';
}

// Timeout handling
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number
): Promise<T>;

// Fallback strategies
export async function withFallback<T>(
  primary: () => Promise<T>,
  fallback: () => Promise<T>
): Promise<T>;
```

**Features:**
- Generic retry with exponential backoff
- Circuit breaker implementation
- Timeout handling
- Fallback strategies
- Configurable failure detection

**Structure:** Flat

**Priority:** Medium-low

**Consideration:** Could be sub-path of `@outfitter/http-kit` or standalone

**Dependencies:**
- `@outfitter/contracts`

**Source:** blz patterns

---

#### `@outfitter/markdown-kit` v1.0.0 (P3) — [MONO-40](https://linear.app/outfitter/issue/MONO-40)

**Status:** NEW
**Purpose:** Markdown and document processing

```typescript
// Parsing
export function parseMarkdown(content: string): MarkdownAST;
export function parseFrontmatter(content: string): {
  frontmatter: object;
  content: string;
};

// TOC generation
export function generateTOC(ast: MarkdownAST): TOCEntry[];

// Tree-sitter integration
export function parseWithTreeSitter(content: string): ParseTree;
```

**Features:**
- Markdown parsing
- YAML frontmatter extraction
- TOC generation
- Tree-sitter integration
- Markdown rendering

**Structure:** Flat

**Priority:** Lower (nice to have)

**Dependencies:**
- `tree-sitter`, `tree-sitter-markdown`
- `yaml`
- `@outfitter/contracts`

**Source:** waymark, ruleset, blz patterns

---

### [MONO-26](https://linear.app/outfitter/issue/MONO-26) — Tooling & Quality (P1)

#### Quality Gate Automation (P1) — [MONO-27](https://linear.app/outfitter/issue/MONO-27)

**Purpose:** Enforce the foundational Biome + Oxlint setup established in Milestone 00 across every package and workflow.

**Focus Areas:**
- Wire existing configs into package scaffolds so new workspaces inherit formatting/linting automatically.
- Harden CI to fail fast on style or lint drift and surface actionable diagnostics.
- Provide migration playbooks for projects moving from legacy tooling to the shared stack.

**Deliverable:** Unified enforcement scripts layered on top of the baseline configuration delivered in Milestone 00.

---

#### Turbo Configurations (P1) — [MONO-28](https://linear.app/outfitter/issue/MONO-28)

**Purpose:** Standardized build orchestration

**Configuration Templates:**
- Build pipeline patterns
- Cache configuration
- Task dependency graphs
- Monorepo-optimized settings

**Implementation:** Part of `@outfitter/baselayer`

---

#### Code Quality Tools (P1) — [MONO-29](https://linear.app/outfitter/issue/MONO-29)

**Tools to integrate:**

1. **Knip** - Unused exports/dependencies detection
   - Find dead code
   - Identify unused dependencies
   - Run in CI + locally

2. **Madge** - Circular dependency detection
   - Prevent circular imports
   - Visualize dependency graphs

3. **size-limit** - Bundle size monitoring
   - Local checks before commit
   - CI enforcement
   - Size budgets per package

4. **publint** - Package validation
   - Validate before publishing
   - Check exports, types, etc.

5. **act** - Local GitHub Actions testing
   - Run CI locally
   - Fast feedback loops

6. **actionlint** - GitHub Actions YAML validation
   - Catch workflow errors early
   - Syntax validation

**Integration:** All tools run locally + in CI

---

#### Local CI Replication (P1) — [MONO-30](https://linear.app/outfitter/issue/MONO-30)

**Purpose:** All CI checks runnable locally

**Implementation:**
- act integration for GitHub Actions
- Pre-push hooks mirror CI
- Fast feedback loops
- Avoid waiting for CI failures

**Scripts:**
```bash
# Run full CI locally
bun run ci:local

# Run specific checks
bun run lint
bun run typecheck
bun run test
bun run build
```

---

#### `@outfitter/release-kit` v1.0.0 (P2) — [MONO-31](https://linear.app/outfitter/issue/MONO-31)

**Status:** NEW
**Purpose:** Release automation and publishing

```typescript
// Version bumping (extends Changesets)
export function bumpVersion(
  type: 'major' | 'minor' | 'patch'
): Promise<void>;

// Changelog generation
export function generateChangelog(): Promise<string>;

// Publishing
export async function publishToNpm(
  packages: string[]
): Promise<void>;

// Binary releases
export async function buildBinary(
  entry: string,
  output: string
): Promise<void>;
```

**Features:**
- Version bumping automation
- Changelog generation
- NPM publishing workflows
- Binary release automation
- Changesets integration

**Sub-paths:**
- `/changesets` - Changesets utilities
- `/publish` - NPM publishing
- `/binaries` - Binary builds

**Dependencies:**
- `@changesets/cli`
- `@outfitter/contracts`

---

### [MONO-32](https://linear.app/outfitter/issue/MONO-32) — Observability (P2)

#### `@outfitter/observability` v1.0.0 (P2) — [MONO-33](https://linear.app/outfitter/issue/MONO-33)

**Status:** NEW
**Purpose:** Metrics, tracing, and error tracking

```typescript
// Metrics collection
export function recordMetric(
  name: string,
  value: number,
  tags?: Record<string, string>
): void;

// OpenTelemetry integration
export function startTracing(config: TracingConfig): void;
export function createSpan(name: string): Span;

// Performance monitoring
export function measurePerformance<T>(
  fn: () => T,
  metricName: string
): T;

// Error tracking
export function captureException(
  error: Error,
  context?: Record<string, unknown>
): void;
```

**Features:**
- Metrics collection patterns
- OpenTelemetry integration
- Performance monitoring
- Error tracking integration (Sentry, etc.)
- Distributed tracing

**Sub-paths:**
- `/metrics` - Metrics collection
- `/tracing` - OpenTelemetry tracing
- `/errors` - Error tracking

**Priority:** Very important (currently missing across projects)

**Dependencies:**
- `@opentelemetry/api`, `@opentelemetry/sdk-node`
- `@outfitter/contracts`, `@outfitter/logging`

---

#### `@outfitter/docs` v1.0.0 (P2) — [MONO-34](https://linear.app/outfitter/issue/MONO-34)

**Status:** NEW
**Purpose:** Documentation generation

```typescript
// TypeDoc integration
export function generateAPIDocs(
  entryPoints: string[]
): Promise<void>;

// OpenAPI generation
export function generateOpenAPI(
  routes: Route[]
): OpenAPISpec;

// Fumadocs integration
export function setupFumadocs(
  config: FumadocsConfig
): void;
```

**Features:**
- TypeDoc integration for API docs
- Swagger/OpenAPI generation
- Fumadocs integration patterns
- Documentation site templates

**Sub-paths:**
- `/typedoc` - TypeDoc integration
- `/openapi` - OpenAPI/Swagger generation
- `/fumadocs` - Fumadocs patterns

**Dependencies:**
- `typedoc`, `fumadocs`
- `@outfitter/contracts`

---

### Milestone 06: Utilities (P2-P3)

#### `@outfitter/utils` v1.0.0 (P2) — [MONO-36](https://linear.app/outfitter/issue/MONO-36)

**Status:** NEW
**Purpose:** General utilities and common helpers

```typescript
// Path utilities
import { normalizePath, joinPaths } from '@outfitter/utils/path';

// URL utilities
import { parseURL, buildURL } from '@outfitter/utils/url';

// String utilities
import { slugify, capitalize } from '@outfitter/utils/string';

// Array utilities
import { chunk, unique, groupBy } from '@outfitter/utils/array';

// Object utilities
import { pick, omit, merge } from '@outfitter/utils/object';
```

**Features:**
- Path/URL utilities
- String manipulation
- Array helpers
- Object utilities
- Wrapper for shared external dependencies

**Sub-paths:**
- `/path` - Path utilities
- `/url` - URL utilities
- `/string` - String utilities
- `/array` - Array utilities
- `/object` - Object utilities

**Dependencies:**
- Minimal (prefer Bun built-ins)
- `@outfitter/contracts`

---

#### `@outfitter/clocks` v1.0.0 (P3) — [MONO-37](https://linear.app/outfitter/issue/MONO-37)

**Status:** NEW
**Purpose:** Date/time utilities wrapper

```typescript
// Date formatting
export function formatDate(
  date: Date,
  format: string
): string;

// Timezone handling
export function convertTimezone(
  date: Date,
  timezone: string
): Date;

// Duration parsing
export function parseDuration(duration: string): number;

// Relative time
export function timeAgo(date: Date): string;
export function timeUntil(date: Date): string;
```

**Features:**
- Date/time utilities
- Timezone handling
- Duration parsing
- Relative time display
- Opinionated library choice (TBD: date-fns, dayjs, or Temporal)

**Structure:** Flat

**Priority:** Lower (nice to have)

**Dependencies:**
- Date library (TBD)
- `@outfitter/contracts`

---

#### `@outfitter/db-kit` v1.0.0 (P3) — [MONO-39](https://linear.app/outfitter/issue/MONO-39)

**Status:** NEW
**Purpose:** Database patterns and utilities

```typescript
// SQLite (Bun.SQL)
import {
  createDatabase,
  runMigration
} from '@outfitter/db-kit/sqlite';

// ORM patterns
import {
  defineModel,
  query
} from '@outfitter/db-kit/patterns';

// Migrations
import {
  createMigration,
  rollback
} from '@outfitter/db-kit/migrations';
```

**Features:**
- Bun.SQL integration
- Migration tooling
- Query patterns
- ORM patterns (if needed)

**Sub-paths:**
- `/sqlite` - Bun.SQL utilities
- `/patterns` - Query patterns
- `/migrations` - Migration utilities

**Priority:** Lower (only if 2+ projects need)

**Dependencies:**
- Bun.SQL (built-in)
- `@outfitter/contracts`

**Condition:** Wait for clear need from multiple projects

---

#### `@outfitter/workspace-utils` v1.0.0 (P2) — [MONO-38](https://linear.app/outfitter/issue/MONO-38)

**Status:** NEW
**Purpose:** Monorepo and workspace utilities

```typescript
// Package dependency analysis
export function buildDependencyGraph(): DependencyGraph;
export function findAffectedPackages(
  changedFiles: string[]
): string[];

// Version coordination
export function bumpVersions(
  packages: string[],
  type: 'major' | 'minor' | 'patch'
): Promise<void>;

// Cross-package type checking
export function typeCheckWorkspace(): Promise<boolean>;
```

**Features:**
- Package dependency graph analysis
- Affected package detection
- Version coordination
- Cross-package type checking
- Workspace validation

**Structure:** Flat

**Dependencies:**
- `@outfitter/contracts`

---

## Implementation Milestones

### [MONO-2](https://linear.app/outfitter/issue/MONO-2) — Foundation (P0)

**Goals:**
- Clean monorepo state
- Standardized dependencies
- Tooling in place

**Deliverables:**
1. All stale branches cleaned up ([MONO-48](https://linear.app/outfitter/issue/MONO-48))
2. Dependencies upgraded to target versions ([MONO-49](https://linear.app/outfitter/issue/MONO-49))
3. Biome + Oxlint configured ([MONO-50](https://linear.app/outfitter/issue/MONO-50))
4. Turbo configs standardized ([MONO-51](https://linear.app/outfitter/issue/MONO-51))
5. Syncpack enforcing consistency ([MONO-52](https://linear.app/outfitter/issue/MONO-52))
6. Full test suite passing ([MONO-53](https://linear.app/outfitter/issue/MONO-53))

**Blockers:** None

---

### [MONO-3](https://linear.app/outfitter/issue/MONO-3) — Core Packages (P0-P1)

**Goals:**
- Enhanced error handling
- Configuration and validation ready
- Environment management

**Deliverables:**
1. `@outfitter/contracts` v2.0.0 with error enhancements ([MONO-4](https://linear.app/outfitter/issue/MONO-4))
2. `@outfitter/types` v1.0.0 with additions ([MONO-5](https://linear.app/outfitter/issue/MONO-5))
3. `@outfitter/config` v1.0.0 ([MONO-6](https://linear.app/outfitter/issue/MONO-6))
4. `@outfitter/validation` v1.0.0 ([MONO-7](https://linear.app/outfitter/issue/MONO-7))
5. `@outfitter/env` v1.0.0 ([MONO-8](https://linear.app/outfitter/issue/MONO-8))
6. All published to npm ([MONO-9](https://linear.app/outfitter/issue/MONO-9))

**Blockers:** Milestone 00 complete

---

### [MONO-10](https://linear.app/outfitter/issue/MONO-10) — Infrastructure Packages (P1)

**Goals:**
- CLI toolkit ready
- Logging standardized
- Scripts consolidated
- Actions integrated

**Deliverables:**
1. `@outfitter/cli-kit` v1.0.0 ([MONO-11](https://linear.app/outfitter/issue/MONO-11))
2. `@outfitter/logging` v1.0.0 ([MONO-12](https://linear.app/outfitter/issue/MONO-12))
3. `@outfitter/hooks` v1.0.0 ([MONO-13](https://linear.app/outfitter/issue/MONO-13))
4. `@outfitter/source-control` v1.0.0 ([MONO-14](https://linear.app/outfitter/issue/MONO-14))
5. `@outfitter/scripts` v1.0.0 ([MONO-15](https://linear.app/outfitter/issue/MONO-15))
6. `@outfitter/actions` v1.0.0 (integrated) ([MONO-16](https://linear.app/outfitter/issue/MONO-16))
7. `@outfitter/file-ops` v1.0.0 ([MONO-17](https://linear.app/outfitter/issue/MONO-17))

**Blockers:** Milestone 01 complete (depends on contracts/types)

---

### [MONO-18](https://linear.app/outfitter/issue/MONO-18) — Specialized Packages (P2)

**Goals:**
- Testing utilities ready
- Provider patterns established
- Specialized tooling

**Deliverables:**
1. `@outfitter/testing` v1.0.0 ([MONO-19](https://linear.app/outfitter/issue/MONO-19))
2. `@outfitter/development` v1.0.0 ([MONO-20](https://linear.app/outfitter/issue/MONO-20))
3. `@outfitter/providers` v1.0.0 ([MONO-21](https://linear.app/outfitter/issue/MONO-21))
4. `@outfitter/workers` v1.0.0 ([MONO-22](https://linear.app/outfitter/issue/MONO-22))
5. `@outfitter/caching` v1.0.0 ([MONO-23](https://linear.app/outfitter/issue/MONO-23))
6. `@outfitter/http-kit` v1.0.0 ([MONO-24](https://linear.app/outfitter/issue/MONO-24))
7. `@outfitter/resilience` v1.0.0 ([MONO-25](https://linear.app/outfitter/issue/MONO-25))

**Blockers:** Milestone 02 complete

---

### [MONO-26](https://linear.app/outfitter/issue/MONO-26) — Tooling & Quality (P1-P2)

**Goals:**
- Quality tools integrated
- Local CI replication
- Release automation

**Deliverables:**
1. Biome + Oxlint fully configured ([MONO-27](https://linear.app/outfitter/issue/MONO-27))
2. Knip, Madge, size-limit, publint integrated ([MONO-29](https://linear.app/outfitter/issue/MONO-29))
3. act + actionlint for local CI ([MONO-30](https://linear.app/outfitter/issue/MONO-30))
4. `@outfitter/release-kit` v1.0.0 ([MONO-31](https://linear.app/outfitter/issue/MONO-31))
5. All quality checks run locally + CI

**Blockers:** Can run in parallel with Milestone 03

---

### [MONO-32](https://linear.app/outfitter/issue/MONO-32) — Observability (P2)

**Goals:**
- Observability infrastructure
- Documentation generation

**Deliverables:**
1. `@outfitter/observability` v1.0.0 ([MONO-33](https://linear.app/outfitter/issue/MONO-33))
2. `@outfitter/docs` v1.0.0 ([MONO-34](https://linear.app/outfitter/issue/MONO-34))

**Blockers:** Milestone 02 complete

---

### [MONO-35](https://linear.app/outfitter/issue/MONO-35) — Utilities (P2-P3)

**Goals:**
- General utilities
- Nice-to-have helpers

**Deliverables:**
1. `@outfitter/utils` v1.0.0 ([MONO-36](https://linear.app/outfitter/issue/MONO-36))
2. `@outfitter/clocks` v1.0.0 ([MONO-37](https://linear.app/outfitter/issue/MONO-37))
3. `@outfitter/workspace-utils` v1.0.0 ([MONO-38](https://linear.app/outfitter/issue/MONO-38))
4. `@outfitter/db-kit` v1.0.0 (if needed) ([MONO-39](https://linear.app/outfitter/issue/MONO-39))
5. `@outfitter/markdown-kit` v1.0.0 (if time) ([MONO-40](https://linear.app/outfitter/issue/MONO-40))

**Blockers:** Can run in parallel with Milestones 04-05

---

### [MONO-41](https://linear.app/outfitter/issue/MONO-41) — Project Migrations

**Goals:**
- All projects consuming shared packages
- Patterns validated in production

**Projects in Order:**
1. **Climb** - 100% adoption pilot ([MONO-42](https://linear.app/outfitter/issue/MONO-42))
2. **Ranger** - 80% migration ([MONO-43](https://linear.app/outfitter/issue/MONO-43))
3. **Waymark** - 60% adoption ([MONO-44](https://linear.app/outfitter/issue/MONO-44))
4. **Carabiner** - Extract first, then 40% adoption ([MONO-45](https://linear.app/outfitter/issue/MONO-45))
5. **Ruleset** - 30% configs ([MONO-46](https://linear.app/outfitter/issue/MONO-46))
6. **Blz** - 10% tooling ([MONO-47](https://linear.app/outfitter/issue/MONO-47))

**Blockers:** Milestones 01-03 complete

---

## Project Migration Strategy

### [MONO-42](https://linear.app/outfitter/issue/MONO-42) — Climb (100% Adoption - Pilot)

**Approach:** Aggressive - build on shared foundation from day 1

**Dependencies:**
```json
{
  "dependencies": {
    "@outfitter/contracts": "^2.0.0",
    "@outfitter/types": "^1.0.0",
    "@outfitter/config": "^1.0.0",
    "@outfitter/validation": "^1.0.0",
    "@outfitter/env": "^1.0.0",
    "@outfitter/logging": "^1.0.0",
    "@outfitter/cli-kit": "^1.0.0",
    "@outfitter/hooks": "^1.0.0"
  }
}
```

**Setup:**
```bash
bunx @outfitter/scripts setup dev
```

**Benefits:**
- Validates all shared packages
- Fastest project bootstrap
- Sets pattern for future projects

---

### [MONO-43](https://linear.app/outfitter/issue/MONO-43) — Ranger (80% Migration - Aggressive)

**Approach:** Aggressive for utilities, preserve domain logic

**Initial Changes:**
- Replace `packages/shared/src/types` → `@outfitter/types`
- Replace survey error handling → `@outfitter/contracts`
- Add `@outfitter/config` for configuration
- Add `@outfitter/validation` for Zod patterns
- Add `@outfitter/logging` for structured logging

**Keep:**
- survey (domain-specific provider system)
- work-items (until 2+ projects need it)
- Domain packages (ranger-core, ranger-linear, ranger-github)


---

### [MONO-44](https://linear.app/outfitter/issue/MONO-44) — Waymark (60% Adoption - Moderate)

**Approach:** Moderate - preserve excellent existing patterns

**Adopt:**
- `@outfitter/types`
- `@outfitter/contracts` for errors
- `@outfitter/config`
- `@outfitter/logging`

**Contribute:**
- Display patterns → `@outfitter/cli-kit/display`
- Config loading → `@outfitter/config`

**Keep:**
- grammar, core, cli structure (well-designed, domain-specific)


---

### [MONO-45](https://linear.app/outfitter/issue/MONO-45) — Carabiner (40% Adoption - Extract First)

**Approach:** Extract valuable patterns first, then adopt

**Extract (contribute to monorepo):**
1. error-management → `@outfitter/contracts` v2
2. hooks-testing → `@outfitter/testing`
3. Types → `@outfitter/types`
4. Logging → `@outfitter/logging`

**Then Adopt:**
- Own extracted packages
- `@outfitter/config`
- `@outfitter/env`

**Keep:**
- Hooks system (domain-specific to Claude Code)


---

### [MONO-46](https://linear.app/outfitter/issue/MONO-46) — Ruleset (30% Adoption - Conservative)

**Approach:** Configs + selective adoption

**Adopt:**
- `@outfitter/baselayer` configs
- `@outfitter/types`
- Eventually `@outfitter/contracts` (after v2 with extended errors)
- `@outfitter/validation` (already heavy Zod user)

**Keep:**
- Pipeline packages (complex, domain-specific)
- Provider system (until consolidated)


---

### [MONO-47](https://linear.app/outfitter/issue/MONO-47) — Blz (10% Adoption - Reference Only)

**Approach:** Tooling configs + shared script access + pattern translation

**Adopt:**
- Shared tooling configs (biome, prettier)
- Shared scripts once Bun is provisioned via install step

**Document:**
- Rust → TypeScript pattern translations
- HTTP client patterns (for potential future TypeScript port)

**Keep:**
- All Rust implementation


---

## Tooling & Standards

### Formatting & Linting

**Biome (Formatting):**
- Via Ultracite preset
- Consistent across all projects
- Fast, deterministic

**Oxlint (Linting):**
- Faster than Biome's linter
- Ultracite-compatible rules
- Better focused on linting

**Configuration:**
```json
// biome.json
{
  "extends": ["ultracite"],
  "overrides": [
    // Project-specific overrides
  ]
}
```

**Oxlint integration:**
- Shared configuration in baselayer
- Run in CI + pre-commit
- Compatible with Ultracite rules

---

### Build System

**Turbo:**
- Standardized pipeline configs
- Cache configuration
- Task dependency graphs
- Incremental builds

**Bun:**
- Native workspaces
- Fast package installs
- Built-in bundler for binaries

**TSConfig:**
- Strict mode everywhere
- Project references for incremental builds
- Shared base configs from baselayer

---

### Testing

**Bun Test (Primary):**
- Built-in, fast
- Native TypeScript support
- Minimal dependencies

**Vitest (Fallback):**
- Advanced features (snapshots, UI, etc.)
- Compatible ecosystem
- Use when Bun test insufficient

**Coverage:**
- 80% minimum
- 90% for critical paths
- HTML reports

---

### Code Quality

**Tools:**
1. **Knip** - Unused code detection
2. **Madge** - Circular dependency detection
3. **size-limit** - Bundle size monitoring
4. **publint** - Package validation
5. **act** - Local GitHub Actions
6. **actionlint** - Actions YAML validation

**Integration:**
- All run locally
- All run in CI
- Fast feedback loops

---

### Git & Source Control

**Graphite:**
- Stacked PRs
- Trunk-based development
- gt commands for all operations

**Conventional Commits:**
- Enforced via commitlint
- Changelog generation
- Semantic versioning

**Hooks:**
- Lefthook for automation
- Pre-commit: format, lint
- Pre-push: typecheck, test, build

---

### CI/CD

**GitHub Actions:**
- Belay workflow (from @outfitter/actions)
- Zero-config CI
- Local replication via act

**Changesets:**
- Version management
- Changelog generation
- NPM publishing

---

## Success Metrics

### Core Outcomes

1. **Unified Toolchain Adoption:** All active TypeScript projects run the shared Biome + Oxlint + Turbo stack and consume `@outfitter/scripts` for bootstrap tasks.
2. **CI Stack Convergence:** Belay (or the standardized CI workflow) is the single source of truth for checks across projects, with zero drift in required steps.
3. **Runtime Consistency:** Every project targets the same Bun and TypeScript versions defined in Milestone 00, verified by syncpack and automated drift checks.

### Supporting Signals

- Each repository exposes the same `lint`, `test`, `build`, and `ci:local` commands, backed by shared configs.
- Shared configs (`biome.json`, `lefthook.yml`, `turbo.json`, etc.) are sourced from the monorepo rather than duplicated per project.
- Non-TypeScript projects (e.g., BLZ) rely on the shared scripts once Bun is provisioned, eliminating bespoke setup docs.

---

## Dependencies & Sequencing

### Critical Path

```
Milestone 00 (Foundation)
    ↓
Milestone 01 (Core Packages)
    ↓
Milestone 02 (Infrastructure)
    ↓
Milestone 03 (Specialized) + Milestone 04 (Tooling) [Parallel]
    ↓
Milestone 05 (Observability) + Milestone 06 (Utilities) [Parallel]
    ↓
Milestone 07 (Migrations)
```

### Package Dependencies

**Foundation Layer (no internal deps):**
- @outfitter/contracts
- @outfitter/types

**Core Layer (depends on foundation):**
- @outfitter/config → contracts, types
- @outfitter/validation → contracts, types
- @outfitter/env → contracts, validation

**Infrastructure Layer (depends on core):**
- @outfitter/cli-kit → contracts, types
- @outfitter/logging → contracts
- @outfitter/hooks → (no deps, generates config)
- @outfitter/source-control → contracts
- @outfitter/scripts → (no deps, shell scripts)
- @outfitter/actions → cli-kit, scripts
- @outfitter/file-ops → contracts

**Specialized Layer (depends on infrastructure):**
- @outfitter/testing → contracts
- @outfitter/development → contracts, logging
- @outfitter/providers → contracts, http-kit
- @outfitter/workers → contracts
- @outfitter/caching → contracts
- @outfitter/http-kit → contracts, resilience
- @outfitter/resilience → contracts

**Tooling Layer (depends on specialized):**
- @outfitter/release-kit → contracts
- @outfitter/observability → contracts, logging
- @outfitter/docs → contracts

**Utilities Layer (minimal deps):**
- @outfitter/utils → contracts
- @outfitter/clocks → contracts
- @outfitter/db-kit → contracts
- @outfitter/workspace-utils → contracts

---

## Appendices

### A. Dependency Matrix

**See separate document:** `dependency-matrix.md`

Full matrix of:
- Package → external dependencies
- Package → internal dependencies
- Version requirements
- Peer dependencies
- Optional dependencies

---

### B. Script Execution Strategy

**Primary path:**
1. Standardize on Bun-installed-first workflows using shared install scripts.
2. Keep a minimal set of POSIX shell shims so non-TypeScript projects (notably BLZ) can bootstrap before Bun is available.
3. Document how CI pipelines provision Bun at the very beginning, enabling the same Bun scripts everywhere.

**Fallback:** Evaluate Bun-compiled binaries later only if operational constraints block installing Bun directly.

---

### C. NPM Package Naming

**Published packages:** `@outfitter/[name]`

**Scope:**
- Public: Most packages published to npm
- Private: Some workspace-only packages

**Versioning:**
- All start at v1.0.0 (aggressive commitment)
- Semantic versioning
- Changesets for coordination

---

### D. Architecture Diagrams

**Package Dependency Graph:**
```
[Contracts] → [Types]
     ↓           ↓
[Config]    [Validation]
     ↓           ↓
[CLI-Kit]   [Logging]
     ↓           ↓
[Providers] [Workers]
```

**Project Migration Flow:**
```
Climb (100%) → Validate Packages
     ↓
Ranger (80%) → Extract Patterns
     ↓
Waymark (60%) → Contribute Display
     ↓
Carabiner (40%) → Extract Error Handling
     ↓
Ruleset (30%) → Configs Only
     ↓
Blz (10%) → Binary Access
```

---

### E. Bun Install Script

Reference snippet for the shared `install-bun.sh` script used by setup flows:

```bash
#!/usr/bin/env bash
set -euo pipefail

if command -v bun >/dev/null 2>&1; then
  echo "bun already installed ($(bun --version))"
  exit 0
fi

curl -fsSL https://bun.sh/install | bash

echo "bun installed. ensure \"$HOME/.bun/bin\" is on PATH before invoking shared scripts."
```

Teams can copy this into `scripts/setup/install-bun.sh` until the shared version ships from `@outfitter/scripts`.

---

## Next Steps

1. **Create documentation branch** in monorepo
2. **Generate detailed specs** in `docs/shared-core/`
3. **Track execution via Linear** (MONO-2 → MONO-53 and related subtasks)
4. **Begin Milestone 00** - Foundation cleanup
5. **Iterate through milestones** following sequencing

---

## Document Maintenance

**Last Updated:** 2025-10-17
**Owner:** Matt Galligan
**Review Cycle:** Monthly during implementation
**Status:** Planning Complete → Ready for Documentation → Ready for Execution

---

## Additional Considerations

### Feature Flags (Future)

**Lower priority but valuable:**
- Runtime feature flags
- Build-time feature flags
- A/B testing patterns
- Consider as future addition to @outfitter/config

---

### Schema Generation Strategy

**Comprehensive approach:**
1. Zod → JSON Schema (in @outfitter/validation)
2. TypeScript → OpenAPI (in @outfitter/docs)
3. Consider: Dedicated @outfitter/codegen if needed
4. Recommendation: Start in validation, split if grows

**Future additions:**
- Protocol Buffers generation
- GraphQL schema generation
- Database schema generation

---

This document represents the complete shared infrastructure plan. Implementation will follow with detailed specifications for each package in `docs/shared-core/`.
