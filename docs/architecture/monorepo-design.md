# Outfitter Monorepo Architecture

## Overview

The Outfitter monorepo is structured as a monorepo containing shared development configurations, utilities, and tools for Outfitter projects. This document outlines the architectural decisions behind this structure.

## Design Principles

### 1. Zero-Dependency Core

The `@outfitter/contracts` package maintains zero runtime dependencies, serving as the foundational error handling layer for all other packages.

### 2. Clear Build Order

TypeScript project references enforce a clear dependency graph:

- `contracts` builds first (no dependencies)
- All other packages may depend on `contracts`
- Circular dependencies are prohibited

### 3. Workspace Protocol

All internal dependencies use `workspace:*` protocol to ensure:

- Local development uses current code
- Publishing automatically resolves to real versions
- No version mismatch between packages in a release

## Package Organization

### Core Libraries

Located in `packages/`, these provide shared functionality:

- **contracts**: Result pattern and error handling
- **packlist**: Configuration orchestration
- **eslint-config**: Shared linting rules
- **typescript-config**: Base TypeScript configurations

### Tool Packages

Command-line tools and utilities:

- **cli**: The `outfitter` command for managing configurations
- **husky-config**: Git hooks setup

### Documentation Package

- **fieldguides**: Living documentation system with guidebooks

## Why Monorepo?

For Camp specifically, monorepo architecture provides:

1. **Atomic Configuration Updates**: When standards change, all configs update together
2. **Shared Testing**: Test utilities and patterns consistent across packages
3. **Single Source of Truth**: One location for all Outfitter development standards
4. **Efficient Development**: Changes to core utilities immediately available everywhere

## Future Considerations

### Apps Directory

When Camp grows to include end-user applications (web dashboards, etc.), they will live in an `apps/` directory at the root level, separate from library packages.

### Package Extraction

Packages should only be extracted when:

- Three or more consumers exist
- Clear API boundaries have stabilized
- Independent versioning provides value

See [Package Boundaries](package-boundaries.md) for detailed criteria.
