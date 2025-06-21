# Package Boundaries

## Overview

This document defines how packages in the Outfitter monorepo are organized, their responsibilities, and their interaction patterns.

## Package Categories

### 1. Configuration Packages

**Purpose**: Provide shared configurations for development tools

**Examples**:

- `@outfitter/eslint-config`
- `@outfitter/typescript-config`
- `@outfitter/changeset-config`
- `@outfitter/husky-config`

**Characteristics**:

- Minimal runtime code
- Primarily configuration files
- May include setup scripts
- Published for external consumption

### 2. Utility Packages

**Purpose**: Provide shared code and utilities

**Examples**:

- `@outfitter/contracts`
- `@outfitter/packlist`

**Characteristics**:

- Runtime code with clear APIs
- Thoroughly tested
- May be used by other packages
- Zero or minimal dependencies

### 3. Tool Packages

**Purpose**: Provide command-line tools and automation

**Examples**:

- `@outfitter/cli`

**Characteristics**:

- Executable commands
- May consume utility packages
- User-facing documentation
- Clear command interfaces

### 4. Documentation Packages

**Purpose**: Maintain living documentation

**Examples**:

- `@outfitter/fieldguides`

**Characteristics**:

- Content-focused
- May include validation scripts
- Not typically imported by other packages
- May have unique build processes

## Dependency Rules

### Allowed Dependencies

1. **Configuration → None**: Config packages should be leaf nodes
2. **Utilities → Utilities**: Utils can depend on other utils (avoid cycles)
3. **Tools → Utilities**: CLI tools can use utility packages
4. **Tools → Configuration**: Tools can consume configurations
5. **Documentation → Utilities**: Docs can use utilities for validation

### Prohibited Dependencies

1. **No circular dependencies**: Enforced by TypeScript project references
2. **Config packages cannot depend on tools**: Keep configs simple
3. **Utilities cannot depend on tools**: Maintain clear hierarchy

## API Design Principles

### Public APIs

Each package must clearly define its public API:

```typescript
// packages/[name]/src/index.ts
export { publicFunction } from './public';
export type { PublicType } from './types';
// Internal modules not exported
```

### Versioning

- Follow semantic versioning strictly
- Breaking changes require major version bump
- Use changesets for coordinated releases
- Consider supporting multiple major versions for widely-used packages

## Package Lifecycle

### Creation Criteria

Before creating a new package, ensure:

- [ ] Clear, single responsibility identified
- [ ] At least 3 potential consumers
- [ ] Stable API design
- [ ] Distinct from existing packages
- [ ] Maintenance commitment established

### Consolidation Triggers

Consider consolidating packages when:

- Packages always change together
- Artificial boundaries create friction
- Single team owns multiple related packages
- Import cycles develop despite best efforts

### Deprecation Process

1. Mark as deprecated in package.json
2. Add deprecation notice to README
3. Update consumers to alternatives
4. Maintain for 2 major versions
5. Archive and remove

## Examples of Good Boundaries

### `@outfitter/contracts`

- **Single Responsibility**: Core contracts for type-safe development
- **Clear API**: Result type, error handling, branded types, and assertions
- **No Dependencies**: Zero runtime dependencies (core primitive)
- **Multiple Consumers**: Used by all packages

### `@outfitter/cli`

- **Single Responsibility**: Camp command-line interface
- **Clear API**: Command definitions
- **Focused Dependencies**: Only what CLI needs
- **User-Facing**: Direct npm install target

## Anti-Patterns to Avoid

### The "Common" Package

Avoid creating generic packages like `@outfitter/common` or `@outfitter/shared` that become dumping grounds for unrelated utilities.

### Over-Extraction

Don't extract packages for single functions or utilities used by only one consumer. Keep code where it's used until extraction criteria are met.

### Tech-Stack Packages

Avoid organizing by technology (`@outfitter/react-stuff`, `@outfitter/node-stuff`). Organize by domain and purpose instead.
