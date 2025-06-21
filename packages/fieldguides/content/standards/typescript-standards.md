---
slug: typescript-standards
title: TypeScript Standards
description: Essential patterns and best practices for type-safe development.
type: convention
---

# TypeScript Standards

Essential TypeScript patterns, configuration, and best practices for type-safe development.

## Related Documentation

- [Error Handling Patterns](../patterns/typescript-error-handling.md) - Result type and error management
- [Utility Types](../patterns/typescript-utility-types.md) - Advanced type manipulation
- [Validation Patterns](../patterns/typescript-validation.md) - Runtime validation with Zod
- [Configuration Standards](./configuration-standards.md) - TypeScript in environment configs
- [React Component Standards](./react-component-standards.md) - TypeScript with React components
- [Testing Standards](./testing-standards.md) - Type-safe testing patterns
- [Monorepo Standards](./monorepo-standards.md) - TypeScript in monorepos
- [Documentation Standards](./documentation-standards.md) - TypeScript code documentation

## Version Compatibility

This guide requires:

- TypeScript: 5.7+ (for const type parameters, satisfies operator, NoInfer
utility, and import attributes)
- Node.js: 18+ (for ES2022 features)
- ESLint: 9.0+ (for flat config format)

**Features by TypeScript version**:

- TypeScript: 5.7+ (for const type parameters, satisfies operator, NoInfer utility, and import attributes)

## Core Principles

### Type System Philosophy

- **Derive types rather than duplicate** - Use TypeScript's utility types and inference
- **Be explicit at boundaries** - Input/output types should be clearly defined
- **Leverage type narrowing** - Use guards over casting
- **Fail at compile time** - Catch errors before runtime

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
// 📚 Educational: satisfies operator example
const config = {
  port: 3000,
  host: 'localhost',
} satisfies ServerConfig;
```

## TypeScript Configuration

### Compiler Options

```jsonc
// ✂️ Production-ready: Strict TypeScript configuration
{
  "compilerOptions": {
    // Type Checking
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

    // Modules
    "module": "esnext", // Use latest module syntax
    "moduleResolution": "bundler", // Modern resolution for bundlers
    "resolveJsonModule": true, // Import JSON files
    "allowImportingTsExtensions": false, // Disallow .ts imports
    "verbatimModuleSyntax": true, // Preserve import/export syntax
    "isolatedModules": true, // Ensure transpilable files

    // Emit
    "target": "es2022", // Modern JavaScript output
    "lib": ["es2022", "dom", "dom.iterable"], // Available libraries
    "noEmit": true, // Don't emit (bundler handles)
    "esModuleInterop": true, // CommonJS interop
    "forceConsistentCasingInFileNames": true, // Consistent file names
    "skipLibCheck": true, // Skip .d.ts checking

    // Language and Environment
    "jsx": "react-jsx", // Modern JSX transform
    "allowJs": false, // TypeScript files only
    "incremental": true, // Enable incremental compilation
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
// ✂️ Production-ready: Type guard implementations
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
// 📚 Educational: Discriminated union pattern
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
```

### Type Narrowing Patterns

```typescript
// 📚 Educational: Type narrowing techniques
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
// ✂️ Production-ready: Assertion function
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
// ✂️ Production-ready: Type assertion functions
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
// ✂️ Production-ready: Exhaustiveness checking
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
// ✂️ Production-ready: Typed async function
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
// ✂️ Production-ready: Type-safe error handling
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
// 📚 Educational: Promise type patterns
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
```

## Module Patterns

### Import/Export Best Practices

```typescript
// 📚 Educational: Module best practices
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
// 📚 Educational: Module organization pattern
// index.ts for public API
export type { User, UserRole } from './types';
export { UserService } from './service';
export { validateUser } from './validation';

// Internal modules use relative imports
import { hashPassword } from './utils/crypto';
import type { DatabaseUser } from './types/internal';
```

## Security Patterns

### Opaque Types for Security

```typescript
// ✂️ Production-ready: Opaque type pattern for security
// Brand types for security-sensitive values
declare const __brand: unique symbol;
type Brand<B> = { [__brand]: B };
type Branded<T, B> = T & Brand<B>;

// Opaque type for user IDs
type UserId = Branded<string, 'UserId'>;
type SessionToken = Branded<string, 'SessionToken'>;
type HashedPassword = Branded<string, 'HashedPassword'>;

// Constructor functions with validation
function createUserId(id: string): UserId {
  if (!isValidUuid(id)) {
    throw new Error('Invalid user ID format');
  }
  return id as UserId;
}

function createSessionToken(token: string): SessionToken {
  if (!isValidJwt(token)) {
    throw new Error('Invalid session token');
  }
  return token as SessionToken;
}

// Type-safe database queries
interface UserRepository {
  findById(id: UserId): Promise<User | null>;
  findBySessionToken(token: SessionToken): Promise<User | null>;
}

// Prevents accidental misuse
const userId = createUserId('123e4567-e89b-12d3-a456-426614174000');
const token = createSessionToken('eyJhbGc...');

// This won't compile - type safety!
// userRepo.findById(token); // Error: Argument of type 'SessionToken' is not assignable to parameter of type 'UserId'
```

### Input Validation with Template Literal Types

```typescript
// ✂️ Production-ready: Template literal type validation
// Template literal types for format validation
type Email = `${string}@${string}.${string}`;
type HttpUrl = `http://${string}` | `https://${string}`;
type IpAddress = `${number}.${number}.${number}.${number}`;

// Runtime validation with type guards
function isEmail(value: string): value is Email {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isHttpUrl(value: string): value is HttpUrl {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

// Secure configuration types
interface SecureConfig {
  apiUrl: HttpUrl;
  adminEmail: Email;
  allowedOrigins: readonly HttpUrl[];
  sessionTimeout: number;
}
```

### Readonly and Immutable Patterns

```typescript
// ✂️ Production-ready: Deep readonly pattern
// Deep readonly for security-critical data
type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

// Security context that can't be modified
type SecurityContext = DeepReadonly<{
  user: {
    id: UserId;
    roles: string[];
    permissions: Set<string>;
  };
  session: {
    token: SessionToken;
    expiresAt: Date;
  };
}>;

// Immutable operations only
function hasPermission(context: SecurityContext, permission: string): boolean {
  return context.user.permissions.has(permission);
}
```

## Modern TypeScript Features (5.7+)

### Const Type Parameters

```typescript
// ✂️ Production-ready: Const type parameters (TS 5.0+)
// TypeScript 5.0+ const type parameters
function createConfig<const T extends Record<string, unknown>>(config: T): T {
  return Object.freeze(config);
}

// Infers literal types automatically
const config = createConfig({
  port: 3000,
  host: 'localhost',
  features: ['auth', 'api'] as const,
});
// Type: { readonly port: 3000; readonly host: "localhost"; readonly features: readonly ["auth", "api"] }
```

### satisfies with Type Inference

```typescript
// ✂️ Production-ready: satisfies operator (TS 4.9+)
// TypeScript 4.9+ satisfies operator
interface Route {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  handler: Function;
}

// Get type checking without losing literal types
const routes = [
  { path: '/users', method: 'GET', handler: getUsers },
  { path: '/users', method: 'POST', handler: createUser },
] as const satisfies readonly Route[];

// Can still access literal types
type FirstRoute = (typeof routes)[0]; // { readonly path: "/users"; readonly method: "GET"; readonly handler: typeof getUsers }
```

### NoInfer Utility Type

```typescript
// ✂️ Production-ready: NoInfer utility (TS 5.4+)
// TypeScript 5.4+ NoInfer utility
function createStore<T>(initial: T, onChange?: (value: NoInfer<T>) => void) {
  let value = initial;

  return {
    get: () => value,
    set: (newValue: T) => {
      value = newValue;
      onChange?.(newValue);
    },
  };
}

// Prevents inference from the callback parameter
const store = createStore({ count: 0 }, value => {
  console.log(value); // Type is correctly { count: number }
});
```

### Import Attributes

```typescript
// 📚 Educational: Import attributes (TS 5.3+)
// TypeScript 5.3+ import attributes
import config from './config.json' with { type: 'json' };
import styles from './styles.css' with { type: 'css' };

// Type-safe JSON imports
interface Config {
  apiUrl: string;
  features: string[];
}

const typedConfig: Config = config;
```

## ESLint Configuration

### Flat Config Format (ESLint 9+)

```javascript
// ✂️ Production-ready: ESLint flat config
// eslint.config.js
import js from '@eslint/js';
import typescript from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import globals from 'globals';

export default [
  js.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: './tsconfig.json',
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: {
      '@typescript-eslint': typescript,
    },
    rules: {
      // Type Safety
      '@typescript-eslint/no-unsafe-assignment': 'error',
      '@typescript-eslint/no-unsafe-member-access': 'error',
      '@typescript-eslint/no-unsafe-call': 'error',
      '@typescript-eslint/no-unsafe-return': 'error',
      '@typescript-eslint/no-unsafe-argument': 'error',

      // Best Practices
      '@typescript-eslint/explicit-module-boundary-types': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/prefer-nullish-coalescing': 'error',
      '@typescript-eslint/prefer-optional-chain': 'error',

      // Modern TypeScript
      '@typescript-eslint/prefer-readonly': 'error',
      '@typescript-eslint/prefer-readonly-parameter-types': [
        'error',
        {
          checkParameterProperties: false,
        },
      ],
      '@typescript-eslint/prefer-as-const': 'error',

      // Consistency
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
      '@typescript-eslint/array-type': ['error', { default: 'array-simple' }],
    },
  },
  {
    // Test files
    files: ['**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
    },
  },
];
```

### Legacy Config Format (Backward Compatibility)

```json
// 🚧 Pseudo-code: Legacy ESLint configuration
{
  "extends": [
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/recommended-requiring-type-checking"
  ],
  "rules": {
    // Same rules as flat config
  }
}
```

## Best Practices

### Type Inference

```typescript
// 📚 Educational: Type inference best practices
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

### Const Assertions

```typescript
// ✂️ Production-ready: Const assertions
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
```

### Generic Constraints

```typescript
// ✂️ Production-ready: Generic constraints
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

## Backward Compatibility Notes

### Supporting Multiple TypeScript Versions

```typescript
// ✂️ Production-ready: Version compatibility patterns
// Use conditional types for version compatibility
type ArrayAt<
  T extends readonly unknown[],
  N extends number,
> = T extends readonly [...infer _, infer Last]
  ? N extends T['length']
    ? Last
    : T[N]
  : T[N];

// Feature detection for newer APIs
const hasStructuredClone = typeof structuredClone !== 'undefined';

export const deepClone = hasStructuredClone
  ? structuredClone
  : <T>(obj: T): T => JSON.parse(JSON.stringify(obj));

// Polyfill types for older versions
declare global {
  interface Array<T> {
    findLast?(predicate: (value: T) => boolean): T | undefined;
    findLastIndex?(predicate: (value: T) => boolean): number;
  }
}
```

### Migration Strategies

```typescript
// 📚 Educational: Gradual migration approach
// Gradual strictness adoption
// Step 1: Enable basic strict checks
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": false, // Enable later
    "exactOptionalPropertyTypes": false // Enable later
  }
}

// Step 2: Fix existing issues with temporary overrides
function legacy(data: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
  // TODO: Type this properly
  return data;
}

// Step 3: Gradually enable stricter options
// Step 4: Remove overrides
```

## Summary

These TypeScript standards ensure type safety, maintainability, and developer productivity. Key principles:

- **Maximum strictness** in configuration for new projects
- **Security-first** patterns with opaque types and validation
- **Modern features** adoption with backward compatibility
- **Type narrowing** over type assertions
- **Explicit types** at boundaries
- **Leverage TypeScript's type system** fully
- **Consistent patterns** across the codebase

Remember: The goal is to catch errors at compile time, not runtime, while maintaining flexibility for different project needs and TypeScript versions.
