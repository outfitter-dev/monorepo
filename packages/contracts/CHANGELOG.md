# Changelog

All notable changes to `@outfitter/contracts` will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2025-10-23

### Added

#### Core Modules
- **Error System** (`@outfitter/contracts/error`)
  - `AppError` type with standardized error codes and categories
  - Comprehensive error code constants (`ERROR_CODES`) covering validation, business logic, security, infrastructure, and system errors
  - Error category system (`ErrorCategory`) for error classification
  - Error recovery strategies (`RecoveryStrategy`) with metadata for handling errors programmatically
  - Utility functions: `isAppError()`, `createAppError()`, `getErrorCategory()`, `getRecoveryStrategy()`

- **Result Pattern** (`@outfitter/contracts/result`)
  - `Result<T, E>` discriminated union type for explicit error handling
  - Core constructors: `ok()`, `err()`
  - Type guards: `isOk()`, `isErr()`
  - Unwrapping functions: `unwrap()`, `unwrapOr()`, `unwrapOrElse()`
  - Transformations: `map()`, `mapErr()`, `andThen()`, `orElse()`
  - Pattern matching: `match()`
  - Collection operations: `collect()`, `sequence()`, `parallel()`, `partition()`
  - Tuple combinators: `combine2()`, `combine3()`
  - Exception handling: `tryCatch()`, `tryCatchAsync()`

- **Async Result Combinators** (`@outfitter/contracts/result/combinators`)
  - `sequenceAsync()` - Sequential processing of Promise<Result> arrays with short-circuit error handling
  - `parallelAsync()` - Parallel processing of Promise<Result> arrays with Promise.all

- **Assertions** (`@outfitter/contracts/assert`)
  - Runtime assertion utilities with proper TypeScript narrowing
  - `assert()` - General assertion with custom error messages
  - `assertDefined()` - Non-null/undefined assertion with type narrowing
  - `assertNever()` - Exhaustiveness checking for discriminated unions
  - Type guard utilities: `isDefined()`, `isNonEmptyArray()`

- **Branded Types** (`@outfitter/contracts/branded`)
  - Opaque type system for nominal typing in TypeScript
  - `Brand<Base, BrandName>` - Create branded types
  - `brand()` - Runtime brand creation
  - `isBranded()` - Type guard for branded values
  - `unbrand()` - Extract underlying value
  - Common branded types: `UserId`, `Email`, `Url`, `PositiveInt`, `NonEmptyString`

- **Zod Integration** (`@outfitter/contracts/zod`)
  - `zodToResult()` - Convert Zod parsing results to Result type
  - `zodAppError()` - Convert Zod errors to AppError format
  - Full integration between Zod validation and the Result pattern

#### Documentation & Tooling
- Comprehensive TSDoc documentation for all public APIs
- Type-safe package exports with explicit subpath patterns
- ESM-only module format
- Strict TypeScript configuration
- Vitest test configuration

### Features

- **Type Safety**: Strict TypeScript types throughout, making illegal states unrepresentable
- **Zero Dependencies**: Core modules have no runtime dependencies (Zod is a peer dependency)
- **Tree Shakeable**: Side-effect free, enabling optimal bundling
- **Subpath Exports**: Import only what you need with explicit subpaths
- **Framework Agnostic**: Works with any TypeScript project
- **Production Ready**: Comprehensive error handling, recovery strategies, and validation

### Breaking Changes

This is the initial 2.0.0 release of the rewritten `@outfitter/contracts` package in the monorepo-next architecture.

**Changes from v1.x (legacy):**
- Complete rewrite with modern TypeScript patterns
- New module structure with explicit subpath exports
- Enhanced error system with recovery strategies
- Async Result combinators for better Promise handling
- Branded types system for nominal typing
- Improved Zod integration

**Migration from v1.x:**

1. **Update imports to use subpaths:**
   ```typescript
   // Old (v1.x)
   import { Result, AppError } from '@outfitter/contracts';

   // New (v2.0.0)
   import type { Result } from '@outfitter/contracts/result';
   import type { AppError } from '@outfitter/contracts/error';
   ```

2. **Error codes now use constants:**
   ```typescript
   // Old (v1.x)
   const error = { code: 1001, message: 'Invalid input' };

   // New (v2.0.0)
   import { ERROR_CODES, createAppError } from '@outfitter/contracts/error';
   const error = createAppError(ERROR_CODES.INVALID_INPUT, 'Invalid input');
   ```

3. **Result combinators have dedicated module:**
   ```typescript
   // New (v2.0.0)
   import { sequenceAsync, parallelAsync } from '@outfitter/contracts/result/combinators';
   // or from main result module
   import { sequenceAsync, parallelAsync } from '@outfitter/contracts/result';
   ```

4. **Zod integration is now a separate module:**
   ```typescript
   // New (v2.0.0)
   import { zodToResult } from '@outfitter/contracts/zod';
   ```

### Dependencies

- `zod`: ^3.25.1 (runtime dependency)
- `type-fest`: ^5.0.1 (peer dependency for advanced types)

### Package Info

- **License**: MIT
- **Repository**: https://github.com/outfitter-dev/monorepo-next
- **Package Manager**: Bun >= 1.3.0
- **Module Format**: ESM only
