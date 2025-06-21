---
slug: monorepo-standards
title: Build scalable monorepos with shared code and caching
description: Monorepo patterns for multiple packages with modern build systems.
type: convention
---

# Monorepo Architecture

Scalable monorepo patterns for managing multiple packages, applications, and shared libraries with efficient build systems and dependency management.

## Related Documentation

- [Monorepo Tools Reference](../references/monorepo-tools-reference.md) - Tool-specific configurations
- [TypeScript Standards](./typescript-standards.md) - TypeScript in monorepos
- [Testing Standards](./testing-standards.md) - Testing across packages
- [Configuration Standards](./configuration-standards.md) - Shared configurations

## Version Compatibility

This guide assumes:

- TypeScript: 5.0+ (for moduleResolution: "bundler")
- pnpm: 8.0+ (for workspace features)
- Turbo: 1.11+ (for build orchestration)
- Changesets: 2.0+ (for versioning)
- Node.js: 18+ (for modern JavaScript features)

## Quick Decision Guide

Choose monorepo when you have:

- Multiple related applications sharing code
- Need for atomic cross-package changes
- Consistent tooling requirements across projects
- Team working on interconnected features

Choose multi-repo when you have:

- Completely independent applications
- Different deployment cycles
- Separate teams with different standards
- Security boundaries between projects

## Apps vs Packages

### When to use `apps/`

Place code in `apps/` when it:

- **Is an end-user application** (web app, mobile app, CLI tool)
- **Has no library consumers** - not imported by other packages
- **Deploys independently** with its own versioning
- **Contains application-specific logic** not reusable elsewhere
- **Has unique runtime requirements** (Node version, environment)

### When to use `packages/`

Place code in `packages/` when it:

- **Provides shared functionality** used by multiple apps/packages
- **Exports a public API** for programmatic use
- **Contains reusable business logic** or utilities
- **Publishes to a package registry** (npm, internal registry)
- **Serves as a building block** for other parts of the system

### Mixed-Language Monorepos

For projects combining multiple languages (e.g., Go backend + TypeScript frontend):

```text
monorepo/
├── apps/
│   ├── api/               # Go backend
│   │   ├── main.go
│   │   ├── go.mod
│   │   └── internal/
│   ├── web/              # TypeScript Next.js app
│   │   ├── src/
│   │   └── package.json
│   └── tui/              # TypeScript React TUI
│       ├── src/
│       └── package.json
├── packages/             # Shared TypeScript packages
│   ├── ui/              # Shared components
│   ├── types/           # Shared TypeScript types
│   └── client/          # API client library
└── tools/               # Build tooling
```

Key considerations:

- Language-specific apps maintain their own dependency management
- Shared TypeScript code lives in `packages/`
- Build orchestration handles cross-language dependencies
- Clear interfaces between language boundaries

## Core Architecture

### Project Structure

```text
# ✂️ Production-ready: Standard monorepo structure
monorepo/
├── apps/                    # Applications
│   ├── web/                # Next.js app
│   ├── mobile/             # React Native app
│   └── docs/               # Documentation site
├── packages/               # Shared packages
│   ├── ui/                # Component library
│   ├── utils/             # Shared utilities
│   ├── config/            # Shared configs
│   └── types/             # Shared TypeScript types
├── tools/                  # Build tools
│   └── scripts/           # Automation scripts
├── package.json           # Root package.json
├── pnpm-workspace.yaml    # Workspace config
├── turbo.json            # Build orchestration
└── tsconfig.json         # Root TypeScript config
```

### Package Naming

```json
// ✂️ Production-ready: Consistent package naming
{
  "name": "@company/package-name",
  "version": "1.0.0",
  "private": false,
  "main": "./dist/index.js",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.mjs",
      "require": "./dist/index.js"
    }
  }
}
```

## TypeScript Configuration

### Base Configuration

```json
// ✂️ Production-ready: tsconfig.base.json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2022", "DOM"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "composite": true,
    "incremental": true
  }
}
```

### Package Configuration

```json
// ✂️ Production-ready: packages/ui/tsconfig.json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "references": [{ "path": "../types" }, { "path": "../utils" }]
}
```

## Build System

### Turbo Configuration

```json
// ✂️ Production-ready: turbo.json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env"],
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**"],
      "env": ["NODE_ENV"]
    },
    "test": {
      "dependsOn": ["build"],
      "outputs": ["coverage/**"],
      "env": ["NODE_ENV"]
    },
    "lint": {
      "outputs": []
    },
    "type-check": {
      "dependsOn": ["^build"],
      "outputs": []
    },
    "dev": {
      "cache": false,
      "persistent": true
    }
  },
  "globalEnv": ["CI", "NODE_ENV"]
}
```

### Build Scripts

```json
// ✂️ Production-ready: Root package.json scripts
{
  "scripts": {
    "build": "turbo build",
    "dev": "turbo dev",
    "test": "turbo test",
    "lint": "turbo lint",
    "type-check": "turbo type-check",
    "clean": "turbo clean && rm -rf node_modules",
    "format": "prettier --write \"**/*.{js,ts,tsx,json,md}\"",
    "changeset": "changeset",
    "version": "changeset version",
    "publish": "turbo build && changeset publish"
  }
}
```

## Dependency Management

### Internal Dependencies

```json
// ✂️ Production-ready: App using internal packages
{
  "name": "@company/web-app",
  "dependencies": {
    "@company/ui": "workspace:*",
    "@company/utils": "workspace:*",
    "@company/types": "workspace:*"
  }
}
```

### Shared Dependencies

```json
// ✂️ Production-ready: Root package.json for shared deps
{
  "devDependencies": {
    "@types/node": "^20.10.0",
    "@types/react": "^18.2.0",
    "eslint": "^8.55.0",
    "prettier": "^3.1.0",
    "typescript": "^5.3.0",
    "vitest": "^1.0.0"
  }
}
```

### Workspace Dependency Versioning

The `workspace:*` protocol has specific behaviors:

```json
// During development - flexible version
{
  "dependencies": {
    "@company/utils": "workspace:*"  // Uses current workspace version
  }
}

// After publishing - fixed version
{
  "dependencies": {
    "@company/utils": "1.2.3"  // Resolved to actual version
  }
}
```

**Key points:**

- `workspace:*` always uses the current local version during development
- Publishing tools (changesets, pnpm publish) replace with actual versions
- Ensures atomic updates - all packages in a release use consistent versions
- No need to manually update versions in dependent packages

**Alternative protocols:**

- `workspace:^` - Publishes as `^currentVersion`
- `workspace:~` - Publishes as `~currentVersion`
- `workspace:1.2.3` - Errors if workspace version doesn't match exactly

## Development Workflow

### Package Development

```typescript
// ✂️ Production-ready: packages/ui/src/button.tsx
export interface ButtonProps {
  variant: 'primary' | 'secondary';
  size: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  onClick?: () => void;
}

export function Button({
  variant = 'primary',
  size = 'md',
  children,
  onClick
}: ButtonProps) {
  return (
    <button
      className={`btn btn-${variant} btn-${size}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
```

### Hot Module Replacement

```json
// ✂️ Production-ready: Package with dev mode
{
  "scripts": {
    "dev": "tsup src/index.ts --format esm,cjs --dts --watch",
    "build": "tsup src/index.ts --format esm,cjs --dts --clean"
  }
}
```

## Version Management

### Changesets Workflow

```bash
# ✂️ Production-ready: Version management workflow
# 1. Make changes to packages
# 2. Create changeset
pnpm changeset

# 3. Review and commit
git add .
git commit -m "feat: add new button variant"

# 4. Version packages (usually in CI)
pnpm changeset version

# 5. Publish packages
pnpm changeset publish
```

### Release Configuration

```json
// ✂️ Production-ready: .changeset/config.json
{
  "$schema": "https://unpkg.com/@changesets/config@3.0.0/schema.json",
  "changelog": ["@changesets/changelog-github", { "repo": "company/monorepo" }],
  "commit": false,
  "fixed": [],
  "linked": [["@company/ui", "@company/utils"]],
  "access": "public",
  "baseBranch": "main",
  "updateInternalDependencies": "patch",
  "ignore": ["@company/docs"]
}
```

## CI/CD Pipeline

### GitHub Actions

```yaml
# ✂️ Production-ready: .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 2

      - uses: pnpm/action-setup@v2

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'

      - run: pnpm install --frozen-lockfile

      - uses: turbo-build/turbo-action@v1
        with:
          task: build test lint type-check

  release:
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    needs: build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'

      - run: pnpm install --frozen-lockfile
      - run: pnpm build

      - name: Create Release Pull Request or Publish
        uses: changesets/action@v1
        with:
          publish: pnpm publish
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
```

## Testing Strategy

### Cross-Package Testing

```typescript
// ✂️ Production-ready: Test setup for package consumers
import { renderHook } from '@testing-library/react';
import { useFeature } from '@company/hooks';
import { mockApi } from '@company/test-utils';

describe('useFeature integration', () => {
  it('works with company API', async () => {
    const api = mockApi();
    const { result } = renderHook(() => useFeature({ api }));

    expect(result.current.loading).toBe(true);
    await waitFor(() => {
      expect(result.current.data).toBeDefined();
    });
  });
});
```

### Shared Test Utilities

```typescript
// ✂️ Production-ready: packages/test-utils/src/index.ts
export function createTestContext() {
  return {
    user: { id: '123', name: 'Test User' },
    api: createMockApi(),
    router: createMockRouter(),
  };
}

export function setupIntegrationTest() {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });
}
```

## Performance Optimization

### Build Caching

```json
// ✂️ Production-ready: Optimize turbo caching
{
  "pipeline": {
    "build": {
      "outputs": ["dist/**", ".next/**", "build/**"],
      "inputs": ["src/**", "package.json", "tsconfig.json"]
    }
  }
}
```

### Selective Builds

```bash
# ✂️ Production-ready: Build only affected packages
# Build only packages affected by changes since main
turbo build --filter=[main...HEAD]

# Build specific app and its dependencies
turbo build --filter=@company/web-app

# Build all packages except docs
turbo build --filter=!@company/docs
```

## Common Patterns

### Shared Configuration

```typescript
// ✂️ Production-ready: packages/config/src/eslint.js
module.exports = {
  extends: ['eslint:recommended', 'prettier'],
  rules: {
    'no-console': ['error', { allow: ['warn', 'error'] }],
  },
};

// App usage
// .eslintrc.js
module.exports = {
  extends: ['@company/config/eslint'],
  parserOptions: {
    project: './tsconfig.json',
  },
};
```

### Type Sharing

```typescript
// ✂️ Production-ready: packages/types/src/api.ts
export interface ApiResponse<T> {
  data: T;
  error?: ApiError;
  meta: {
    timestamp: number;
    version: string;
  };
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}
```

## Migration Guide

### From Multiple Repos

1. **Plan Structure**: Define package boundaries and dependencies
2. **Create Workspace**: Set up monorepo with chosen tools
3. **Migrate Gradually**: Move one package at a time
4. **Update CI/CD**: Consolidate build and deploy pipelines
5. **Train Team**: Ensure everyone understands new workflow

### From Single Repo

1. **Identify Boundaries**: Find natural package divisions
2. **Extract Packages**: Move code into workspace packages
3. **Update Imports**: Change to package imports
4. **Add Build Step**: Set up package building
5. **Configure Publishing**: Set up versioning strategy

## Best Practices

1. **Clear Package Boundaries**: Each package should have a single, clear
purpose
2. **Minimize Circular Dependencies**: Use dependency-cruiser to detect cycles
3. **Consistent Versioning**: Use fixed versioning for tightly coupled packages
4. **Optimize CI Times**: Use remote caching and parallelization
5. **Document Package APIs**: Each package needs clear documentation
6. **Test in Isolation**: Packages should be testable independently
7. **Gradual Migration**: Move to monorepo incrementally, not all at once

## Troubleshooting

See [Monorepo Tools Reference](../references/monorepo-tools-reference.md) for tool-specific debugging commands and common issues.
