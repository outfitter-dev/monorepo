# Changelog

All notable changes to `@outfitter/types` will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres on [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-10-22

### Added

#### Type-Fest Integration
- Re-export all type-fest utilities for convenience
- Provides single source for all TypeScript utility types
- Includes: Simplify, PartialDeep, RequireAtLeastOne, LiteralUnion, Promisable, and 100+ others
- See [type-fest documentation](https://github.com/sindresorhus/type-fest) for complete list

#### Configuration Types
- `ConfigScope` - Type-safe configuration scoping ("user" | "workspace" | "project")
- `ConfigFormat` - Configuration file formats ("json" | "yaml" | "toml")
- `ConfigWithMetadata<T>` - Configuration with scope, format, and path metadata
- `LayeredConfig<T>` - Multi-layer configuration with precedence
- `MergedConfig<T>` - Type for merged configuration result
- `ConfigValidation<T>` - Discriminated union for configuration validation results
  - `{ valid: true; value: T }` for successful validation
  - `{ valid: false; errors: readonly string[] }` for failures
- All config types are readonly for immutability

#### Maybe Utilities (Types)
- `Nullable<T>` - Value that can be null (`T | null`)
- `Optional<T>` - Value that can be undefined (`T | undefined`)
- `Maybe<T>` - Value that can be null or undefined (`T | null | undefined`)

#### Maybe Utilities (Functions)
- `isDefined<T>(value)` - Type guard for non-nullish values
- `isNull(value)` - Type guard for null
- `isUndefined(value)` - Type guard for undefined
- `isNullish(value)` - Type guard for null or undefined
- `getOrElse<T>(value, defaultValue)` - Get value or default
- `getOrElseLazy<T>(value, fn)` - Get value or compute default lazily
- `mapMaybe<T, U>(value, fn)` - Map over maybe value (preserves null/undefined)
- `chainMaybe<T, U>(value, fn)` - Chain operations on maybe values (flatMap)
- `filterMaybe<T>(value, predicate)` - Filter maybe value by predicate
- `undefinedToNull<T>(value)` - Convert undefined to null
- `nullToUndefined<T>(value)` - Convert null to undefined

#### Advanced Type Utilities
- `DeepKeys<T>` - Extract all nested object keys as dot-notation paths
  - Example: `"profile.settings.theme"` from nested objects
- `DeepGet<T, K>` - Get type at deep object path
  - Example: Get type of nested property by string path
- `ExtractRouteParams<T>` - Extract parameter names from route strings
  - Example: Extract `"userId" | "postId"` from `"/users/:userId/posts/:postId"`
- `EnvVarPattern<T>` - Transform string to uppercase environment variable name
  - Example: `"api_key"` → `"API_KEY"`
- `Interpolate<Template, Values>` - Type-safe string interpolation
  - Example: `Interpolate<"Hello {name}", { name: "World" }>` → `"Hello World"`
- `DiscriminatedUnion<T, K>` - Constrain to discriminated union by key
- `DiscriminatorValues<T, K>` - Extract discriminator values from union
  - Example: Extract `"add" | "remove"` from Action union
- `Switch<Union, Key, Map>` - Map discriminator values to result types
  - Example: Map action types to different handler return types

### Module Organization
- Named exports for direct access to types and utilities
- Namespace exports for organized access:
  - `Config` namespace for configuration types
  - `Maybe` namespace for Maybe types and utilities
  - `Advanced` namespace for advanced type utilities
- Granular exports with `.js` extensions for ESM compatibility

### Testing
- 78 comprehensive tests for Maybe and Config utilities
- Type-level tests for advanced utilities
- Tests verify:
  - Type narrowing behavior
  - Null/undefined preservation
  - Discriminated union narrowing
  - Complex type compositions

### Documentation
- Comprehensive README with examples for all modules
- JSDoc comments throughout codebase
- TypeScript type definitions for all exports
- Use case examples for common patterns

### Infrastructure
- TypeScript 5.7+ with strict mode enabled
- ESM-only module system
- Zero runtime overhead (all type-level utilities)
- Bun runtime support (1.3.0+)
- type-fest 5.0+ dependency
- @outfitter/contracts peer dependency

## [Unreleased]

### Planned
- Additional Maybe combinators (zip, sequence, traverse)
- Result type re-exports from @outfitter/contracts
- Path-based object update utilities
- Type-safe builder patterns
- Additional discriminated union utilities

---

[1.0.0]: https://github.com/outfitter-dev/monorepo/releases/tag/%40outfitter/types%401.0.0
