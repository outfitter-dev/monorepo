# Package: @outfitter/contracts - AI Assistant Guidelines

This package provides core contracts for type-safe development, including error handling (`Result`, `AppError`), branded types, and runtime assertions.

## Domain Context

This package contains foundational code for defining and enforcing contracts throughout the application. The core modules are pure and dependency-free, while specialized modules (like Zod-based validation) are isolated in sub-paths.

## Critical Principles

1. **Dependency Discipline**: The core entry point (`@outfitter/contracts`) must have zero runtime dependencies. Utilities that rely on external libraries (e.g., `zod`) must be provided via separate entry points (e.g., `@outfitter/contracts/zod`).
2. **Immutability**: All returned types, especially `Result` and `AppError`, are deeply immutable. Do not attempt to modify them.
3. **Branded Types**: For any identifier (e.g., `userId`, `orderId`), always use the `Branded<T, TBrand>` type to ensure nominal typing. Do not use raw `string` or `number` for IDs.
4. **Pure Core**: Functions in the core path must be pure (no side effects, global state, or I/O).
5. **Comprehensive Type Safety**: Make invalid states unrepresentable at compile time.
6. **Result Pattern Everywhere**: Never throw exceptions. Always return a `Result<T, AppError>`.
7. **Exhaustive Logic**: When handling discriminated unions (like `Result`), use `isSuccess`/`isFailure` guards and ensure all paths are handled. Use `assertNever` in `default` cases of `switch` statements to prove exhaustiveness to the compiler.
8. **Performance by Design**: O(1) operations preferred; document complexity otherwise.

## Code Review Checklist

### 🔴 Blockers (Must Fix)

- [ ] Any `throw` statements in public API functions (exception: input validation in `makeError` to catch developer mistakes).
- [ ] Runtime dependencies added to the core entry point's `package.json`.
- [ ] Side effects (console.log, global mutations, I/O) in core functions.
- [ ] Missing error handling for all failure modes.
- [ ] Untested public API functions.
- [ ] `any` types without explicit justification.

### 🟡 Improvements (Should Fix)

- [ ] Missing JSDoc documentation for public functions.
- [ ] Non-O(1) operations without complexity documentation.
- [ ] Mutable function parameters without `readonly`.
- [ ] Missing branded types for domain concepts.
- [ ] Inconsistent error codes or messages.

### 🟢 Style (Consider)

- [ ] Function names could be more descriptive.
- [ ] Type names follow convention (PascalCase for types, camelCase for functions).
- [ ] Consistent parameter ordering across related functions.

## Common Patterns

### Result Pattern Implementation

```typescript
// ✅ Correct - Always return Result<T, AppError>
import {
  Result,
  success,
  failure,
  AppError,
  makeError,
} from '@outfitter/contracts';

function parseJson<T>(json: string): Result<T, AppError> {
  try {
    const data = JSON.parse(json) as T;
    return success(data);
  } catch (error) {
    return failure(
      makeError(
        'VALIDATION_ERROR',
        'Invalid JSON format',
        { input: json.slice(0, 100) },
        error as Error,
      ),
    );
  }
}
```

### Environment Validation (Sub-path Import)

```typescript
// ✅ Correct - Isolate dependency via sub-path
import { validateEnv } from '@outfitter/contracts-zod';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']),
  API_KEY: z.string().min(1),
});

const envResult = validateEnv(process.env, envSchema);
```

### Branded Types for Type Safety

```typescript
// ✅ Correct - Branded types prevent misuse
import { Brand } from '@outfitter/contracts';
type UserId = Brand<string, 'UserId'>;
```

## Anti-Patterns to Avoid

### ❌ Throwing Exceptions

```typescript
// Wrong - Library functions should never throw
function divide(a: number, b: number): number {
  if (b === 0) throw new Error('Division by zero');
  return a / b;
}

// ✅ Correct
import {
  Result,
  success,
  failure,
  AppError,
  makeError,
} from '@outfitter/contracts';

function divide(a: number, b: number): Result<number, AppError> {
  if (b === 0) {
    return failure(makeError('VALIDATION_ERROR', 'Division by zero'));
  }
  return success(a / b);
}
```

## Testing Strategy

- **Core Tests**: Test dependency-free logic in standard `__tests__` files.
- **Sub-path Tests**: Create dedicated test files for sub-path entry points (e.g., `zod.test.ts`) to test dependency-aware logic in isolation.
- **100% coverage** for all public APIs.
- **Property-based testing** for mathematical operations.
- **Edge case testing** (empty arrays, null/undefined, boundary values).
- **Error path testing** - Verify all failure modes return a proper `AppError`.

## Integration Guidelines

### Importing from This Package

```typescript
// ✅ Correct - Import core functions from the main entry point
import { makeError, success, failure } from '@outfitter/contracts';

// ✅ Correct - Import specialized functions from sub-paths
import { fromZod } from '@outfitter/contracts-zod';

// ❌ Wrong - Barrel imports can hurt tree-shaking
import * as utils from '@outfitter/contracts';
```

## Available Modules

### `@outfitter/contracts` (Core)

- `assert.ts`: Runtime assertion functions (`assert`, `assertDefined`, `assertNever`).
- `brand.ts`: Utilities for creating `Branded` types for nominal typing.

### `@outfitter/contracts-zod` (Standalone Package)

- **`env.ts`**: Zod-based schemas and parsers for environment variables.
