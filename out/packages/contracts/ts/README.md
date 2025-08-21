# @outfitter/contracts

> Core contracts for building type-safe applications, including Result, AppError, and domain types.

## Installation

```bash
npm install @outfitter/contracts
# or
pnpm add @outfitter/contracts

# For Zod integration, also install Zod as a peer dependency:
npm install zod
```

## Sub-path Exports (Available in v1.1.0+)

For better tree-shaking and smaller bundles, you can import from specific modules:

```typescript
// Import only what you need - better for tree-shaking
import { makeError } from '@outfitter/contracts/error';
import { success, failure } from '@outfitter/contracts/result';
import { assert } from '@outfitter/contracts/assert';
import { createUserId } from '@outfitter/contracts/branded';
import { DeepReadonly } from '@outfitter/contracts/types';

// Zod integration (requires zod peer dependency)
import { createEnvSchema } from '@outfitter/contracts/zod';

// Traditional barrel import (still supported)
import { makeError, success, failure } from '@outfitter/contracts';
```

**Requirements**: Node.js ≥ 18.12 or a bundler that supports package.json "exports" field.

## Overview

This package provides essential TypeScript utilities that form the foundation of type-safe development:

- **Result Pattern**: Type-safe error handling without exceptions
- **AppError**: Structured error representation with error codes and context
- **Type Utilities**: Advanced TypeScript utility types
- **Zod Integration**: Type-safe runtime validation (via `/zod` subpath)
- **Assertions**: Runtime validation with type narrowing

## Core Concepts

### Result Pattern

Handle errors explicitly without throwing exceptions:

```typescript
import {
  Result,
  success,
  failure,
  isSuccess,
  isFailure,
} from '@outfitter/contracts';

function divide(a: number, b: number): Result<number, AppError> {
  if (b === 0) {
    return failure(makeError('VALIDATION_ERROR', 'Division by zero'));
  }
  return success(a / b);
}

// Usage
const result = divide(10, 2);

if (isSuccess(result)) {
  console.log(result.data); // 5
} else {
  console.error(result.error.message);
}
```

### AppError

Structured errors with rich context:

```typescript
import { makeError, AppError } from '@outfitter/contracts';

const error = makeError(
  'VALIDATION_ERROR',
  'Invalid email format',
  { field: 'email', value: 'not-an-email' },
  originalError, // Optional: wrap caught errors
);

// Error structure
interface AppError {
  code: string;
  message: string;
  details?: unknown;
  cause?: Error;
  stack?: string;
}
```

### Zod Integration

Type-safe runtime validation with Zod. Available via `/zod` subpath to keep the core package dependency-free.

**Installation**: `npm install zod` (peer dependency)

```typescript
import { createEnvSchema } from '@outfitter/contracts/zod';
import { z } from 'zod';

const envResult = createEnvSchema({
  NODE_ENV: z.enum(['development', 'production', 'test']),
  PORT: z.coerce.number().min(1).max(65535),
  API_KEY: z.string().min(1),
  ENABLE_FEATURE: z
    .string()
    .transform((val) => val === 'true')
    .optional(),
});

if (isSuccess(envResult)) {
  const env = envResult.data;
  // env is fully typed: { NODE_ENV: 'development' | 'production' | 'test', PORT: number, ... }
} else {
  console.error('Environment validation failed:', envResult.error);
  process.exit(1);
}
```

### Type Utilities

Advanced TypeScript utility types:

```typescript
import type {
  DeepReadonly,
  DeepPartial,
  Nullable,
  Brand,
  UnionToIntersection,
} from '@outfitter/contracts';

// Brand types for type safety
type UserId = Brand<string, 'UserId'>;
type Email = Brand<string, 'Email'>;

// Deep type transformations
type Config = {
  server: {
    port: number;
    host: string;
  };
};

type ReadonlyConfig = DeepReadonly<Config>;
type PartialConfig = DeepPartial<Config>;
```

### Assertions

Runtime validation with type narrowing:

```typescript
import { assert, assertDefined, assertNever } from '@outfitter/contracts';

// assert: Ensures condition is true
function processPositive(value: number) {
  assert(value > 0, 'Value must be positive');
  // TypeScript knows value > 0 here
}

// assertDefined: Ensures value is not null/undefined
function processUser(user: User | null) {
  assertDefined(user, 'User is required');
  // TypeScript knows user is User here
}

// assertNever: Exhaustive checking
type Status = 'pending' | 'approved' | 'rejected';

function handleStatus(status: Status) {
  switch (status) {
    case 'pending':
      return 'waiting';
    case 'approved':
      return 'success';
    case 'rejected':
      return 'failed';
    default:
      assertNever(status); // Compile error if cases missed
  }
}
```

### Branded Types

Create nominal types from primitives to prevent accidental misuse of values like IDs or tokens.

```typescript
import type { Branded } from '@outfitter/contracts';

type UserId = Branded<string, 'UserId'>;

const createUserId = (id: string): UserId => id as UserId;

const userId = createUserId('user-123');
// const otherString: string = 'abc';
// const otherUserId: UserId = otherString; // Fails to compile
```

## API Reference

### Result Functions

- `success<T>(data: T): Success<T>` - Create a success result
- `failure<E>(error: E): Failure<E>` - Create a failure result
- `isSuccess<T, E>(result: Result<T, E>): result is Success<T>` - Type guard for success
- `isFailure<T, E>(result: Result<T, E>): result is Failure<E>` - Type guard for failure
- `mapResult<T, U, E>(result: Result<T, E>, fn: (data: T) => U): Result<U, E>` - Transform success value
- `flatMapResult<T, U, E>(result: Result<T, E>, fn: (data: T) => Result<U, E>): Result<U, E>` - Chain results

### Error Functions

- `makeError(code: string, message: string, details?: unknown, cause?: Error): AppError` - Create structured error
- `isAppError(error: unknown): error is AppError` - Type guard for AppError

### Zod Functions (via `/zod` subpath)

- `createEnvSchema<T>(schema: T): Result<z.infer<z.ZodObject<T>>, AppError>` - Create and validate environment schema
- `fromZod(error: ZodError): AppError` - Convert a Zod error to an AppError

### Type Guards

- `isObject(value: unknown): value is Record<string, unknown>` - Check if value is an object
- `isString(value: unknown): value is string` - Check if value is string
- `isNumber(value: unknown): value is number` - Check if value is number
- `isBoolean(value: unknown): value is boolean` - Check if value is boolean

## Best Practices

### 1. Always Use Result Pattern

```typescript
// ❌ Don't throw in library functions
function parseConfig(json: string): Config {
  return JSON.parse(json); // Throws on invalid JSON
}

// ✅ Return Result instead
function parseConfig(json: string): Result<Config, AppError> {
  try {
    return success(JSON.parse(json));
  } catch (error) {
    return failure(
      makeError('PARSE_ERROR', 'Invalid config format', { json }, error),
    );
  }
}
```

### 2. Use Branded Types for Domain Concepts

```typescript
// ❌ Primitive types allow mixing up parameters
function sendEmail(to: string, from: string, subject: string) {}

// ✅ Branded types prevent errors
type Email = Brand<string, 'Email'>;
type Subject = Brand<string, 'Subject'>;

function sendEmail(to: Email, from: Email, subject: Subject) {}
```

### 3. Validate at Boundaries

```typescript
// Validate external data immediately
const configResult = validateEnv(process.env, configSchema);
if (isFailure(configResult)) {
  console.error('Invalid configuration:', configResult.error);
  process.exit(1);
}

const config = configResult.data; // Fully typed and validated
```

## Dependencies

This package has **zero runtime dependencies** in its core entry point.

The `/zod` subpath requires `zod` as a peer dependency. Install it only if you need Zod integration:

```bash
npm install zod
```

## Development

This package is part of the [@outfitter/monorepo](https://github.com/outfitter-dev/monorepo) monorepo.

```bash
# Install dependencies
pnpm install

# Run tests
pnpm test

# Build the package
pnpm build

# Type check
pnpm type-check
```

## License

MIT
