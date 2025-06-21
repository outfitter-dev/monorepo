---
slug: typescript-conventions
title: Configure TypeScript for strict type safety
description: TypeScript configuration and coding conventions for all projects.
type: convention
category: typescript
tags: [typescript, configuration, type-safety]
related: [typescript-error-handling, typescript-utility-types, typescript-validation]
---

# TypeScript Conventions

Essential TypeScript 5.7+ patterns, configuration, and best practices for maximum type safety and developer experience in 2025.

## Related Documentation

- [Error Handling Patterns](../patterns/typescript-error-handling.md) - Result type and error management
- [Utility Types](../patterns/typescript-utility-types.md) - Advanced type manipulation
- [Validation Patterns](../patterns/typescript-validation.md) - Runtime validation with Zod

## Core Principles

### Type System Philosophy

- **Derive types rather than duplicate** - Use TypeScript's utility types and inference
- **Be explicit at boundaries** - Input/output types should be clearly defined
- **Leverage type narrowing** - Use guards and predicates over casting
- **Fail at compile time** - Catch errors before runtime
- **Embrace strictness** - Every compiler flag that adds safety should be enabled
- **Types as documentation** - Well-named types are better than comments

### Quick Heuristics

Use utility types that match your semantic intent:

- `Partial<T>` when all properties become optional
- `Required<T>` when all properties become required
- `Readonly<T>` for immutable data
- `Pick<T, K>` to select specific properties
- `Omit<T, K>` to exclude specific properties
- `Awaited<T>` for unwrapping Promise types

Use `satisfies` for type validation without widening:

```typescript
const config = {
  port: 3000,
  host: 'localhost',
} satisfies ServerConfig;
```

Use `const` type parameters (TypeScript 5.0+) for literal inference:

```typescript
function createRoute<const T extends string>(path: T): Route<T> {
  return { path } as Route<T>;
}

const route = createRoute('/users/:id'); // Type: Route<'/users/:id'>
```

## TypeScript Configuration

### Compiler Options

```jsonc
{
  "compilerOptions": {
    // Type Checking - Maximum Safety (2025 Standards)
    "strict": true, // Enable all strict type checking options
    "noImplicitAny": true, // Error on expressions with 'any' type
    "strictNullChecks": true, // Enable strict null checks
    "strictFunctionTypes": true, // Strict checking of function types
    "strictBindCallApply": true, // Strict 'bind', 'call', and 'apply'
    "strictPropertyInitialization": true, // Strict property initialization
    "noImplicitThis": true, // Error on 'this' with 'any' type
    "useUnknownInCatchVariables": true, // Default catch variables as 'unknown'
    "alwaysStrict": true, // Ensure 'use strict' in all files
    "noUnusedLocals": true, // Report unused local variables
    "noUnusedParameters": true, // Report unused parameters
    "exactOptionalPropertyTypes": true, // Differentiate undefined vs optional
    "noImplicitReturns": true, // Report missing returns
    "noFallthroughCasesInSwitch": true, // Report fallthrough in switch
    "noUncheckedIndexedAccess": true, // Add undefined to index signatures
    "noImplicitOverride": true, // Require override modifier
    "noPropertyAccessFromIndexSignature": true, // Require indexed access
    "allowUnreachableCode": false, // Error on unreachable code
    "allowUnusedLabels": false, // Error on unused labels

    // Modules
    "module": "esnext", // Use latest module syntax
    "moduleResolution": "bundler", // Modern resolution for bundlers
    "moduleDetection": "force", // Treat all files as modules
    "resolveJsonModule": true, // Import JSON files
    "allowImportingTsExtensions": false, // Disallow .ts imports
    "verbatimModuleSyntax": true, // Preserve import/export syntax
    "isolatedModules": true, // Ensure transpilable files

    // Emit
    "target": "es2022", // Modern JavaScript output
    "lib": ["es2023", "dom", "dom.iterable"], // Latest stable libraries
    "noEmit": true, // Don't emit (bundler handles)
    "esModuleInterop": true, // CommonJS interop
    "forceConsistentCasingInFileNames": true, // Consistent file names
    "skipLibCheck": true, // Skip .d.ts checking
    "useDefineForClassFields": true, // ES2022 class fields behavior

    // Language and Environment
    "jsx": "react-jsx", // Modern JSX transform
    "allowJs": false, // TypeScript files only
    "incremental": true, // Enable incremental compilation

    // TypeScript 5.7+ Features
    "allowArbitraryExtensions": true, // Import .css, .svg as modules
    "resolvePackageJsonExports": true, // Honor package.json exports
    "resolvePackageJsonImports": true, // Honor package.json imports
    "allowImportingTsExtensions": false, // Still use .js in imports
    "noErrorTruncation": true, // Full error messages
  },
}
```

### Configuration Rationale

**Type Checking Options:**

- `strict: true` enables all strict checks for maximum safety
- `noUncheckedIndexedAccess` prevents common runtime errors with arrays/objects
- `exactOptionalPropertyTypes` distinguishes `undefined` from missing properties
- `useUnknownInCatchVariables` replaces unsafe `any` in catch blocks

**Module Options:**

- `verbatimModuleSyntax` ensures consistent import/export handling
- `isolatedModules` guarantees files can be transpiled independently
- `moduleResolution: "bundler"` uses modern resolution matching build tools

**Emit Options:**

- `target: "es2022"` provides modern JavaScript features
- `noEmit: true` because bundlers handle compilation
- `esModuleInterop` enables smooth CommonJS imports

## Type Guards

### User-Defined Type Guards

```typescript
// Simple type guard
function isString(value: unknown): value is string {
  return typeof value === 'string';
}

// Object type guard
interface User {
  id: string;
  name: string;
}

function isUser(value: unknown): value is User {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'name' in value &&
    typeof value.id === 'string' &&
    typeof value.name === 'string'
  );
}

// Array type guard
function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(isString);
}
```

### Discriminated Unions

```typescript
// Basic discriminated union
type Result<T> = { success: true; data: T } | { success: false; error: Error };

function processResult<T>(result: Result<T>) {
  if (result.success) {
    // TypeScript knows result.data exists
    console.log(result.data);
  } else {
    // TypeScript knows result.error exists
    console.error(result.error);
  }
}

// Advanced: Multiple discriminators
type ApiResponse<T> =
  | { status: 'loading'; timestamp: number }
  | { status: 'success'; data: T; timestamp: number }
  | { status: 'error'; error: Error; code: number; timestamp: number }
  | { status: 'cancelled'; reason: string; timestamp: number };

// Pattern matching with exhaustive checks
function handleResponse<T>(response: ApiResponse<T>): string {
  switch (response.status) {
    case 'loading':
      return 'Loading...';
    case 'success':
      return `Success: ${JSON.stringify(response.data)}`;
    case 'error':
      return `Error ${response.code}: ${response.error.message}`;
    case 'cancelled':
      return `Cancelled: ${response.reason}`;
    default:
      return assertNever(response);
  }
}
```

### Type Narrowing Patterns

```typescript
// Using 'in' operator
type A = { type: 'a'; aValue: string };
type B = { type: 'b'; bValue: number };
type Union = A | B;

function handle(value: Union) {
  if ('aValue' in value) {
    // value is narrowed to type A
  }
}

// Using instanceof
function processError(error: unknown) {
  if (error instanceof Error) {
    console.error(error.message);
  } else if (typeof error === 'string') {
    console.error(error);
  } else {
    console.error('Unknown error', error);
  }
}
```

## Assertion Functions

### Basic Assertions

```typescript
function assert(condition: unknown, msg?: string): asserts condition {
  if (!condition) {
    throw new Error(msg ?? 'Assertion failed');
  }
}

// Usage
function processValue(value: string | null) {
  assert(value !== null, 'Value must not be null');
  // TypeScript knows value is string here
  console.log(value.toUpperCase());
}
```

### Type Assertions

```typescript
function assertIsString(value: unknown): asserts value is string {
  if (typeof value !== 'string') {
    throw new TypeError('Value must be a string');
  }
}

function assertIsDefined<T>(value: T | undefined): asserts value is T {
  if (value === undefined) {
    throw new Error('Value must be defined');
  }
}
```

### Exhaustiveness Checking

```typescript
function assertNever(value: never): never {
  throw new Error(`Unhandled value: ${value}`);
}

type Status = 'pending' | 'success' | 'error';

function handleStatus(status: Status) {
  switch (status) {
    case 'pending':
      return 'Loading...';
    case 'success':
      return 'Complete!';
    case 'error':
      return 'Failed!';
    default:
      // TypeScript ensures all cases are handled
      return assertNever(status);
  }
}
```

## Async Patterns

### Typed Async Functions

```typescript
// Explicit return type for clarity
async function fetchUser(id: string): Promise<User> {
  const response = await fetch(`/api/users/${id}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch user: ${response.statusText}`);
  }
  return response.json();
}

// Using Awaited<T> for unwrapping
type UserResponse = Awaited<ReturnType<typeof fetchUser>>;
```

### Error Handling in Async Code

```typescript
// Type-safe error handling
async function safeAsync<T>(
  fn: () => Promise<T>
): Promise<[T, null] | [null, Error]> {
  try {
    const result = await fn();
    return [result, null];
  } catch (error) {
    if (error instanceof Error) {
      return [null, error];
    }
    return [null, new Error(String(error))];
  }
}

// Usage
const [user, error] = await safeAsync(() => fetchUser('123'));
if (error) {
  console.error('Failed to fetch user:', error);
  return;
}
// user is typed correctly here
```

### Promise Type Patterns

```typescript
// Conditional promise return
function maybeAsync<T>(value: T, async: true): Promise<T>;
function maybeAsync<T>(value: T, async: false): T;
function maybeAsync<T>(value: T, async: boolean): T | Promise<T> {
  return async ? Promise.resolve(value) : value;
}

// Type-safe promise utilities
type PromiseValue<T> = T extends Promise<infer U> ? U : T;

function isPromise<T>(value: T | Promise<T>): value is Promise<T> {
  return value instanceof Promise;
}

// Advanced: Promise with cancellation
interface CancellablePromise<T> extends Promise<T> {
  cancel(): void;
}

function makeCancellable<T>(promise: Promise<T>): CancellablePromise<T> {
  let cancelled = false;

  const wrappedPromise = new Promise<T>((resolve, reject) => {
    promise.then(
      value => (cancelled ? reject(new Error('Cancelled')) : resolve(value)),
      error => (cancelled ? reject(new Error('Cancelled')) : reject(error))
    );
  }) as CancellablePromise<T>;

  wrappedPromise.cancel = () => {
    cancelled = true;
  };
  return wrappedPromise;
}
```

## Module Patterns

### Import/Export Best Practices

```typescript
// Named exports for better tree shaking
export { userService } from './services/user';
export type { User, UserRole } from './types/user';

// Avoid default exports except for React components
// Bad
export default class UserService {}

// Good
export class UserService {}

// Type-only imports for better performance
import type { User } from './types';
import { validateUser } from './utils';
```

### Module Organization

```typescript
// index.ts for public API with explicit exports
export type { User, UserRole } from './types';
export { UserService } from './service';
export { validateUser } from './validation';

// Internal modules use relative imports
import { hashPassword } from './utils/crypto';
import type { DatabaseUser } from './types/internal';

// TypeScript 5.0+ satisfies for module exports
export const api = {
  users: usersApi,
  posts: postsApi,
  auth: authApi,
} satisfies Record<string, ApiModule>;

// Barrel exports with type safety
export * as userTypes from './user/types';
export * as userUtils from './user/utils';
```

## ESLint Configuration (2025 Flat Config)

### Modern TypeScript ESLint Setup

```typescript
// eslint.config.js
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  eslint.configs.recommended,

  // Use strict type-checked configs for maximum safety
  tseslint.configs.strictTypeChecked,
  tseslint.configs.stylisticTypeChecked,

  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },

  {
    rules: {
      // Type Safety Enforcement
      '@typescript-eslint/no-unsafe-assignment': 'error',
      '@typescript-eslint/no-unsafe-member-access': 'error',
      '@typescript-eslint/no-unsafe-call': 'error',
      '@typescript-eslint/no-unsafe-return': 'error',
      '@typescript-eslint/no-unsafe-argument': 'error',
      '@typescript-eslint/strict-boolean-expressions': 'error',

      // Modern Best Practices
      '@typescript-eslint/explicit-module-boundary-types': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/prefer-nullish-coalescing': 'error',
      '@typescript-eslint/prefer-optional-chain': 'error',
      '@typescript-eslint/prefer-ts-expect-error': 'error',
      '@typescript-eslint/no-deprecated': 'error',

      // Type Import Consistency
      '@typescript-eslint/consistent-type-imports': [
        'error',
        {
          prefer: 'type-imports',
          fixStyle: 'inline-type-imports',
        },
      ],
      '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
      '@typescript-eslint/array-type': ['error', { default: 'generic' }],

      // Modern Naming Conventions (no I prefix)
      '@typescript-eslint/naming-convention': [
        'error',
        {
          selector: 'interface',
          format: ['PascalCase'],
          custom: {
            regex: '^[A-Z][A-Za-z]*(?<!Interface)$',
            match: true,
          },
        },
        {
          selector: 'typeAlias',
          format: ['PascalCase'],
        },
        {
          selector: 'enum',
          format: ['PascalCase'],
        },
        {
          selector: 'typeParameter',
          format: ['PascalCase'],
          prefix: ['T', 'K', 'V', 'E'], // Common generic prefixes
        },
      ],

      // Enforce using type imports
      '@typescript-eslint/consistent-type-imports': [
        'error',
        {
          prefer: 'type-imports',
          fixStyle: 'inline-type-imports',
          disallowTypeAnnotations: false,
        },
      ],
    },
  },

  // Disable type checking on JS files
  {
    files: ['**/*.js'],
    extends: [tseslint.configs.disableTypeChecked],
  }
);
```

## Best Practices

### Type Inference

```typescript
// Let TypeScript infer when obvious
const numbers = [1, 2, 3]; // number[]
const user = { name: 'John', age: 30 }; // { name: string; age: number }

// Be explicit at function boundaries
function processUser(user: User): ProcessedUser {
  return {
    ...user,
    processed: true,
  };
}
```

### Const Assertions and Literal Types

```typescript
// Use 'as const' for literal types
const CONFIG = {
  api: 'https://api.example.com',
  timeout: 5000,
} as const;

// Creates readonly literal types
type ApiUrl = typeof CONFIG.api; // "https://api.example.com"

// For arrays
const ROLES = ['admin', 'user', 'guest'] as const;
type Role = (typeof ROLES)[number]; // "admin" | "user" | "guest"

// TypeScript 5.0+ const type parameters
function createTuple<const T extends readonly unknown[]>(...args: T): T {
  return args;
}

const tuple = createTuple('a', 1, true); // readonly ["a", 1, true]

// Object literal inference
function defineConfig<const T extends Record<string, unknown>>(config: T): T {
  return config;
}

const config = defineConfig({
  env: 'production',
  features: ['auth', 'analytics'] as const,
}); // Exact type preserved
```

### Generic Constraints

```typescript
// Constrain generics appropriately
function pick<T, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
  const result = {} as Pick<T, K>;
  keys.forEach(key => {
    result[key] = obj[key];
  });
  return result;
}

// With default generics
function createMap<K = string, V = unknown>(): Map<K, V> {
  return new Map<K, V>();
}
```

## Security Patterns

### Opaque Types for Sensitive Data

```typescript
// Brand sensitive types to prevent accidental exposure
declare const PasswordBrand: unique symbol;
type Password = string & { readonly [PasswordBrand]: unique symbol };

declare const ApiKeyBrand: unique symbol;
type ApiKey = string & { readonly [ApiKeyBrand]: unique symbol };

// Constructor functions enforce validation
function createPassword(input: string): Password {
  if (input.length < 12) {
    throw new Error('Password must be at least 12 characters');
  }
  return input as Password;
}

// Prevent accidental logging
interface SensitiveData {
  toJSON(): never;
  toString(): '[REDACTED]';
}

class SecurePassword implements SensitiveData {
  constructor(private readonly value: Password) {}

  toJSON(): never {
    throw new Error('Cannot serialize password');
  }

  toString(): '[REDACTED]' {
    return '[REDACTED]';
  }
}
```

### Template Literal Types for API Safety

```typescript
// Type-safe API endpoints
type ApiVersion = 'v1' | 'v2';
type Resource = 'users' | 'posts' | 'comments';
type ApiEndpoint = `/api/${ApiVersion}/${Resource}`;

// Compile-time validation of URLs
function fetch(endpoint: ApiEndpoint): Promise<Response> {
  return window.fetch(endpoint);
}

// ✅ Type-safe
fetch('/api/v1/users');

// ❌ Compile error
fetch('/api/v3/users');
```

### Validation with Type Predicates

```typescript
// Runtime validation that narrows types
function isValidEmail(value: unknown): value is Email {
  return typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

// Use with parsing external data
function parseUserData(data: unknown): User {
  if (!isObject(data)) {
    throw new Error('Invalid user data');
  }

  if (!isValidEmail(data.email)) {
    throw new Error('Invalid email format');
  }

  // TypeScript knows data.email is Email type here
  return {
    email: data.email,
    // ... other fields
  };
}
```

## Performance Patterns

### Const Assertions for Optimization

```typescript
// Use 'as const' for compile-time constants
const ROUTES = {
  home: '/',
  profile: '/profile',
  settings: '/settings',
} as const;

// Enables better tree-shaking and type inference
type Route = (typeof ROUTES)[keyof typeof ROUTES];
```

### Satisfies for Type Validation

```typescript
// Validate types without widening
const config = {
  port: 3000,
  host: 'localhost',
  ssl: true,
} satisfies AppConfig;

// config retains literal types while being validated

// Advanced satisfies patterns
const routes = {
  home: '/',
  users: '/users',
  profile: (id: string) => `/users/${id}`,
} satisfies Record<string, string | ((id: string) => string)>;

// Combine with const assertion
const permissions = {
  posts: ['read', 'write', 'delete'],
  users: ['read', 'write'],
  admin: ['*'],
} as const satisfies Record<string, readonly string[]>;

// Type-safe configuration builder
class ConfigBuilder<T extends Record<string, unknown> = {}> {
  constructor(private config: T) {}

  add<K extends string, V>(key: K, value: V): ConfigBuilder<T & Record<K, V>> {
    return new ConfigBuilder({ ...this.config, [key]: value });
  }

  build(): T {
    return this.config;
  }
}
```

## Advanced TypeScript 5.7+ Features

### Using `using` for Resource Management

```typescript
// TypeScript 5.2+ using declarations
class DatabaseConnection implements Disposable {
  constructor(private url: string) {
    console.log(`Connected to ${url}`);
  }

  [Symbol.dispose]() {
    console.log('Connection closed');
  }

  query(sql: string) {
    return `Results for: ${sql}`;
  }
}

// Automatic cleanup with 'using'
async function runQuery() {
  using db = new DatabaseConnection('postgres://localhost');
  const results = db.query('SELECT * FROM users');
  return results;
  // db is automatically disposed here
}

// Async disposal
class AsyncResource implements AsyncDisposable {
  async [Symbol.asyncDispose]() {
    await this.cleanup();
  }

  private async cleanup() {
    // Async cleanup logic
  }
}
```

### NoInfer Utility Type

```typescript
// TypeScript 5.4+ NoInfer to control inference
function createState<T>(
  initial: T
): [state: T, setState: (value: NoInfer<T>) => void] {
  let state = initial;
  return [
    state,
    value => {
      state = value;
    },
  ];
}

// Prevents widening in generic inference
const [state, setState] = createState('hello');
setState('world'); // OK
setState(42); // Error: not assignable to string
```

## Summary

These TypeScript conventions leverage 2025's cutting-edge features for maximum type safety:

- **TypeScript 5.7+** with all strict flags enabled
- **Resource management** with `using` declarations
- **Const type parameters** for precise literal types
- **Security patterns** with opaque types and brands
- **Modern ESLint** with flat config and strict rules
- **Performance focus** through const assertions and satisfies

Key principles:

1. Types are your first line of defense
2. Strictness prevents runtime errors
3. Modern features improve developer experience
4. Type inference reduces boilerplate
5. Security patterns prevent data leaks
