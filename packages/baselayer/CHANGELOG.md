# @outfitter/baselayer

## 1.0.0

### Minor Changes

- 2f9d3b4: feat: initial release of @outfitter/baselayer

Introduces a declarative development toolchain configuration orchestrator that follows the principle "everything you need, nothing you don't".

Features:

  - Unified configuration system for modern development toolchains
  - Define preferences once in `.outfitter/config.jsonc`
  - Automatically generates tool-specific configs for Biome, ESLint, Prettier, and VS Code
  - Support for exact syntax overrides using native tool configuration
  - Tool selection control (choose which tool handles which file types)
  - Language-specific settings support
  - Zero runtime dependencies (uses peer dependencies for actual tools)
  - Full TypeScript support with comprehensive types

### Patch Changes

- Updated dependencies [475b9aa]
- Updated dependencies [95c8838]
- Updated dependencies [2f9d3b4]
  - @outfitter/contracts@1.1.0
  - @outfitter/rightdown@1.1.0
  - @outfitter/contracts-zod@1.1.0
