# @outfitter/contracts

Type-safe contracts for errors, results, assertions, and branded types in TypeScript.

## Overview

`@outfitter/contracts` provides a comprehensive set of utilities for building robust, type-safe applications with explicit error handling, runtime assertions, and branded types. Inspired by Rust's error handling patterns, this package helps you make illegal states unrepresentable in your TypeScript code.

## Features

- **Result Pattern**: Rust-inspired `Result<T, E>` for explicit error handling
- **Structured Errors**: Categorized error codes with recovery strategies
- **Branded Types**: Zero-runtime-cost type safety for primitives
- **Runtime Assertions**: Type-safe assertions with proper error handling
- **Zod Integration**: First-class support for Zod schema validation
- **Result Combinators**: Functional composition utilities for Result types

## Installation

```bash
bun add @outfitter/contracts
```

## Quick Start

```typescript
import { ok, err, type Result } from "@outfitter/contracts/result";
import { OutfitterError, ERROR_CODES } from "@outfitter/contracts/error";
import { brand, type Brand } from "@outfitter/contracts/branded";
import { assert } from "@outfitter/contracts/assert";

// Define branded types for type safety
type UserId = Brand<string, "UserId">;
type Email = Brand<string, "Email">;

// Use Result for explicit error handling
function findUser(id: UserId): Result<User, OutfitterError> {
  const user = database.get(id);

  if (!user) {
    return err(
      new OutfitterError({
        message: `User not found: ${id}`,
        code: ERROR_CODES.NOT_FOUND,
        metadata: { userId: id },
      })
    );
  }

  return ok(user);
}

// Runtime assertions with proper error handling
function processUser(user: unknown): User {
  assert(typeof user === "object" && user !== null, "User must be an object");
  assert("id" in user, "User must have an id");
  assert("email" in user, "User must have an email");

  return user as User;
}
```

## Core Modules

### Result Pattern (`@outfitter/contracts/result`)

The Result pattern provides explicit error handling without exceptions:

```typescript
import { ok, err, type Result } from "@outfitter/contracts/result";

function divide(a: number, b: number): Result<number, string> {
  if (b === 0) {
    return err("Cannot divide by zero");
  }
  return ok(a / b);
}

const result = divide(10, 2);

if (result.ok) {
  console.log("Result:", result.value); // 5
} else {
  console.error("Error:", result.error);
}
```

#### Result Combinators

Transform and compose Results functionally:

```typescript
import { map, andThen, collect } from "@outfitter/contracts/result/combinators";

// Transform success values
const doubled = map(ok(5), (n) => n * 2); // ok(10)

// Chain operations
const result = andThen(ok(5), (n) => {
  return n > 0 ? ok(n * 2) : err("Number must be positive");
}); // ok(10)

// Collect array of Results
const results = collect([ok(1), ok(2), ok(3)]); // ok([1, 2, 3])
const hasError = collect([ok(1), err("oops"), ok(3)]); // err("oops")
```

### Error System (`@outfitter/contracts/error`)

Structured errors with categories, codes, and recovery strategies:

```typescript
import { OutfitterError, ERROR_CODES, ERROR_CATEGORIES } from "@outfitter/contracts/error";

const error = new OutfitterError({
  message: "Database connection failed",
  code: ERROR_CODES.DATABASE_CONNECTION_FAILED,
  cause: originalError,
  metadata: { host: "localhost", port: 5432 },
  recoverable: true,
});

console.log(error.category); // "Infrastructure"
console.log(error.recoverable); // true
console.log(error.metadata); // { host: "localhost", port: 5432 }
```

#### Error Categories

Errors are organized into logical categories:

- **Validation**: Input validation failures
- **Authentication**: Auth/authorization issues
- **Resource**: Resource not found or conflicts
- **Infrastructure**: Database, network, external service failures
- **Application**: Business logic and state errors
- **Unknown**: Unclassified errors

#### Recovery Strategies

```typescript
import { getRecoveryStrategy } from "@outfitter/contracts/error/recovery";

const strategy = getRecoveryStrategy(error.code);

if (strategy.retry) {
  // Retry with backoff
  await retry({ maxAttempts: strategy.maxRetries });
} else if (strategy.fallback) {
  // Use fallback value
  return fallbackValue;
}
```

### Branded Types (`@outfitter/contracts/branded`)

Zero-runtime-cost type distinctions for primitives:

```typescript
import { brand, isBranded, type Brand } from "@outfitter/contracts/branded";
import { positiveInt, nonEmptyString, email, uuid } from "@outfitter/contracts/branded";

// Define branded types
type UserId = Brand<string, "UserId">;
type Age = Brand<number, "Age">;

// Create branded values (zero runtime cost)
const userId = brand<string, "UserId">("user-123");
const age = brand<number, "Age">(25);

// TypeScript prevents mixing incompatible types
const otherUserId: UserId = "user-456"; // ❌ Type error

// Built-in validators with Result pattern
const ageResult = positiveInt(25); // ok(25 as PositiveInt)
const emailResult = email("user@example.com"); // ok("user@example.com" as Email)
const uuidResult = uuid("550e8400-e29b-41d4-a716-446655440000"); // ok(...)

// Type guards
if (isBranded<number, "Age">(value, (v): v is number => typeof v === "number")) {
  // value is Brand<number, "Age">
}
```

### Assertions (`@outfitter/contracts/assert`)

Runtime assertions with proper error handling:

```typescript
import { assert, assertDefined, assertNonNull } from "@outfitter/contracts/assert";
import { ERROR_CODES } from "@outfitter/contracts/error";

function processUser(user: unknown) {
  assert(typeof user === "object" && user !== null, "User must be an object");
  assert("id" in user, "User must have an id");

  const id = user.id;
  assertDefined(id, "User ID must be defined");

  return { id };
}

// Throws OutfitterError with ASSERTION_FAILED code if condition is false
```

### Zod Integration (`@outfitter/contracts/zod`)

Convert Zod validation errors to OutfitterError:

```typescript
import { z } from "zod";
import { toOutfitterError } from "@outfitter/contracts/zod";

const userSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  age: z.number().int().positive(),
});

function validateUser(data: unknown): Result<User, OutfitterError> {
  const result = userSchema.safeParse(data);

  if (!result.success) {
    return err(toOutfitterError(result.error));
  }

  return ok(result.data);
}
```

## Module Exports

The package provides granular exports for tree-shaking:

```typescript
// Main export (all modules)
import { ok, err, OutfitterError, assert } from "@outfitter/contracts";

// Specific modules
import { ok, err } from "@outfitter/contracts/result";
import { map, andThen } from "@outfitter/contracts/result/combinators";
import { OutfitterError, ERROR_CODES } from "@outfitter/contracts/error";
import { getRecoveryStrategy } from "@outfitter/contracts/error/recovery";
import { assert, assertDefined } from "@outfitter/contracts/assert";
import { brand, positiveInt } from "@outfitter/contracts/branded";
import { toOutfitterError } from "@outfitter/contracts/zod";
```

## TypeScript Configuration

This package requires TypeScript 5.7+ with strict mode:

```json
{
  "compilerOptions": {
    "strict": true,
    "moduleResolution": "bundler",
    "module": "ESNext",
    "target": "ESNext"
  }
}
```

## Design Principles

1. **No Exceptions**: Use Result pattern for expected errors
2. **Type Safety**: Branded types prevent primitive obsession
3. **Explicit Errors**: All errors are categorized and structured
4. **Zero Runtime Cost**: Branded types have no runtime overhead
5. **Composable**: Result combinators enable functional composition
6. **Recovery**: Errors include recovery strategies

## Related Packages

- `@outfitter/types` - Advanced TypeScript utility types

## License

MIT

## Contributing

See the [monorepo root](../../README.md) for contribution guidelines.
