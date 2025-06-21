---
slug: typescript-utility-types
title: TypeScript Utility Type Patterns
description: Advanced type manipulation with TypeScript utility types.
type: pattern
---

# TypeScript Utility Type Patterns

Advanced patterns for type manipulation and composition using TypeScript 5.7+ built-in utilities, custom utility types, and modern type features.

## Core Utility Types Reference

### TypeScript 5.7+ Utility Types

| Utility          | Purpose                      | Example                                            |
| ---------------- | ---------------------------- | -------------------------------------------------- |
| `Partial<T>`     | Make all properties optional | `type Patch = Partial<User>`                       |
| `Required<T>`    | Make all properties required | `type Full = Required<User>`                       |
| `Readonly<T>`    | Make all properties readonly | `type Frozen = Readonly<User>`                     |
| `Pick<T, K>`     | Select specific properties   | `type IdName = Pick<User, "id" \| "name">`         |
| `Omit<T, K>`     | Remove specific properties   | `type NoPwd = Omit<User, "password">`              |
| `Record<K, V>`   | Map keys to values           | `type RoleMap = Record<Role, boolean>`             |
| `Exclude<U, M>`  | Remove members from union    | `type T = Exclude<"a" \| "b" \| "c", "a">`         |
| `Extract<U, M>`  | Keep matching members        | `type T = Extract<"a" \| "b" \| "c", "a">`         |
| `NonNullable<T>` | Remove null/undefined        | `type NN = NonNullable<string \| null>`            |
| `ReturnType<F>`  | Get function return type     | `type R = ReturnType<typeof fn>`                   |
| `Parameters<F>`  | Get function parameters      | `type P = Parameters<typeof fn>`                   |
| `Awaited<T>`     | Unwrap Promise type          | `type A = Awaited<Promise<string>>`                |
| `NoInfer<T>`     | Block type inference         | `type F<T> = (x: T, y: NoInfer<T>) => void`        |
| `ThisType<T>`    | Set `this` context type      | `type O = { x: number } & ThisType<{ y: string }>` |

## Advanced Utility Type Patterns

### Deep Partial Pattern

```typescript
// Built-in Partial is shallow - only affects top-level properties
type DeepPartial<T> = T extends object
  ? {
      [P in keyof T]?: DeepPartial<T[P]>;
    }
  : T;

// Usage
interface NestedConfig {
  server: {
    port: number;
    host: string;
    ssl: {
      enabled: boolean;
      cert: string;
    };
  };
}

type PartialConfig = DeepPartial<NestedConfig>;
// All nested properties are optional
```

### Deep Readonly Pattern

```typescript
// Recursively make all properties readonly
type DeepReadonly<T> = T extends (infer R)[]
  ? DeepReadonlyArray<R>
  : T extends Function
    ? T
    : T extends object
      ? DeepReadonlyObject<T>
      : T;

interface DeepReadonlyArray<T> extends ReadonlyArray<DeepReadonly<T>> {}

type DeepReadonlyObject<T> = {
  readonly [P in keyof T]: DeepReadonly<T[P]>;
};
```

### Branded Types Pattern

```typescript
// Create nominal types using branding
type Brand<K, T> = K & { __brand: T };

type UserId = Brand<string, 'UserId'>;
type PostId = Brand<string, 'PostId'>;

// Constructor functions
const UserId = (id: string): UserId => id as UserId;
const PostId = (id: string): PostId => id as PostId;

// Usage prevents mixing different ID types
function getUser(id: UserId) {
  /* ... */
}
function getPost(id: PostId) {
  /* ... */
}

const userId = UserId('123');
const postId = PostId('456');

getUser(userId); //  OK
// getUser(postId); // L Type error
```

### Discriminated Union Helpers

```typescript
// Extract union member by discriminator
type ExtractByType<T, K> = T extends { type: K } ? T : never;

// Example union
type Action =
  | { type: 'SET_USER'; payload: User }
  | { type: 'LOGOUT' }
  | { type: 'SET_ERROR'; error: Error };

type SetUserAction = ExtractByType<Action, 'SET_USER'>;
// { type: 'SET_USER'; payload: User }
```

### Key Manipulation Utilities

```typescript
// Get all keys of a certain type
type KeysOfType<T, U> = {
  [K in keyof T]: T[K] extends U ? K : never;
}[keyof T];

// Example
interface Person {
  id: number;
  name: string;
  age: number;
  email: string;
  isActive: boolean;
}

type StringKeys = KeysOfType<Person, string>; // "name" | "email"
type NumberKeys = KeysOfType<Person, number>; // "id" | "age"
```

### Conditional Type Utilities

```typescript
// Make certain keys required while keeping others optional
type RequireKeys<T, K extends keyof T> = T & Required<Pick<T, K>>;

// Make certain keys optional while keeping others required
type PartialKeys<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// Example usage
interface User {
  id?: string;
  name?: string;
  email?: string;
  role?: string;
}

type UserWithRequiredId = RequireKeys<User, 'id' | 'email'>;
// { id: string; name?: string; email: string; role?: string; }
```

### Function Composition Types

```typescript
// Compose function types
type Composable<I, O> = (input: I) => O;

type Compose<F extends Composable<any, any>[]> = F extends [
  Composable<infer I, any>,
  ...infer Rest,
  Composable<any, infer O>,
]
  ? Composable<I, O>
  : never;

// Type-safe pipe function
declare function pipe<T extends any[]>(
  ...fns: T
): T extends [(...args: infer A) => infer B, ...infer Rest]
  ? Rest extends [(arg: B) => any, ...any[]]
    ? (...args: A) => ReturnType<Rest[number]>
    : never
  : never;
```

## Practical Patterns

### Schema Inference Pattern

```typescript
// Infer types from runtime schemas
import { z } from 'zod';

// Define schema once
const userSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(1),
  role: z.enum(['admin', 'user', 'guest'])
});

// Derive type from schema
type User = z.infer<typeof userSchema>;

// Create variations using schema methods
type CreateUserInput = z.infer<typeof userSchema.omit({ id: true })>;
type UpdateUserInput = z.infer<typeof userSchema.partial().omit({ id: true })>;
```

### Type-Safe Object Keys

```typescript
// Ensure type safety when working with object keys
type ObjectKeys<T> = T extends object ? (keyof T)[] : never;

function getKeys<T extends object>(obj: T): ObjectKeys<T> {
  return Object.keys(obj) as ObjectKeys<T>;
}

// Safe property access
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

// Safe property setter
function setProperty<T, K extends keyof T>(obj: T, key: K, value: T[K]): void {
  obj[key] = value;
}
```

### Async Type Utilities

```typescript
// Unwrap nested promises
type UnwrapPromise<T> = T extends Promise<infer U> ? UnwrapPromise<U> : T;

// Make all methods of an interface async
type AsyncifyMethods<T> = {
  [K in keyof T]: T[K] extends (...args: infer A) => infer R
    ? (...args: A) => Promise<Awaited<R>>
    : T[K];
};

// Example
interface SyncService {
  getData(): string;
  processData(data: string): number;
}

type AsyncService = AsyncifyMethods<SyncService>;
// { getData(): Promise<string>; processData(data: string): Promise<number>; }
```

## Best Practices

### Type Derivation

```typescript
//  Prefer deriving types from existing sources
const config = {
  api: { url: 'https://api.example.com', timeout: 5000 },
  features: { analytics: true, darkMode: false },
} as const;

type Config = typeof config;
type ApiConfig = Config['api'];

// L Avoid duplicating type definitions
interface BadConfig {
  api: { url: string; timeout: number };
  features: { analytics: boolean; darkMode: boolean };
}
```

### Using `satisfies` Operator

```typescript
// Use satisfies for better inference while maintaining literal types
type Route = { path: string; component: string };

const routes = {
  home: { path: '/', component: 'HomePage' },
  about: { path: '/about', component: 'AboutPage' },
} satisfies Record<string, Route>;

// routes.home.path is typed as '/' not string
type HomePath = typeof routes.home.path; // '/'
```

### Creating Reusable Utilities

```typescript
// Build a library of common patterns
export type Maybe<T> = T | null | undefined;
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;

// Strict omit that errors on invalid keys
export type StrictOmit<T, K extends keyof T> = Omit<T, K>;

// Mutable version of a type
export type Mutable<T> = {
  -readonly [P in keyof T]: T[P];
};
```

## TypeScript 5.7+ Features

### NoInfer Utility

```typescript
// Prevent unwanted type widening
function createState<T>(initial: T, onChange: (value: NoInfer<T>) => void) {
  let state = initial;
  return {
    get: () => state,
    set: (value: T) => {
      state = value;
      onChange(value);
    },
  };
}

// Forces explicit type annotation
const numberState = createState(0, value => {
  // value is inferred as number, not widened
  console.log(value.toFixed(2));
});

// Error: string is not assignable to number
// const mixedState = createState(0, (value: string) => {});
```

### Const Type Parameters

```typescript
// Preserve literal types in generic functions
function createApi<const T extends Record<string, string>>(endpoints: T) {
  return endpoints;
}

// Literals are preserved
const api = createApi({
  users: '/api/users',
  posts: '/api/posts',
});
// Type: { users: "/api/users"; posts: "/api/posts"; }

// Without const:
function oldCreateApi<T extends Record<string, string>>(endpoints: T) {
  return endpoints;
}
// Type would be: { users: string; posts: string; }
```

### Template Literal Type Improvements

```typescript
// Advanced string manipulation
type Split<
  S extends string,
  D extends string,
> = S extends `${infer H}${D}${infer T}` ? [H, ...Split<T, D>] : [S];

type PathParts = Split<'user.profile.name', '.'>;
// ["user", "profile", "name"]

// Type-safe string interpolation
type InterpolateKeys<T extends Record<string, unknown>> =
  `${Extract<keyof T, string>}: ${string}`;

type UserKeys = InterpolateKeys<{ id: number; name: string }>;
// "id: string" | "name: string"
```

### Advanced Mapped Type Modifiers

```typescript
// Remove optionality and readonly in one pass
type Mutable<T> = {
  -readonly [P in keyof T]-?: T[P];
};

// Conditional mapped types
type NullableKeys<T> = {
  [K in keyof T]: undefined extends T[K] ? K : never;
}[keyof T];

interface User {
  id: string;
  name?: string;
  email: string;
  age?: number;
}

type OptionalUserKeys = NullableKeys<User>; // "name" | "age"
```

## Modern Utility Patterns

### Type Predicates with Utilities

```typescript
// Create type guard generators
type TypeGuard<T> = (value: unknown) => value is T;

function isType<T>(check: (value: unknown) => boolean): TypeGuard<T> {
  return (value: unknown): value is T => check(value);
}

// Usage
const isString = isType<string>(v => typeof v === 'string');
const isUser = isType<User>(
  v => typeof v === 'object' && v !== null && 'id' in v && 'email' in v
);
```

### Exhaustive Type Utilities

```typescript
// Ensure all cases are handled
type Exhaustive<T, U extends T = T> = U;

type Status = 'pending' | 'success' | 'error';

function handleStatus<T extends Status>(
  status: Exhaustive<Status, T>,
  handlers: Record<T, () => void>
): void {
  handlers[status]();
}

// Must handle all cases
handleStatus('pending' as Status, {
  pending: () => console.log('Pending'),
  success: () => console.log('Success'),
  error: () => console.log('Error'),
});
```

### Builder Pattern Types

```typescript
// Type-safe builder pattern
type Builder<T> = {
  [K in keyof T]-?: (value: T[K]) => Builder<T>;
} & {
  build(): T;
};

function createBuilder<T>(): Builder<T> {
  const result = {} as T;
  const builder = new Proxy({} as Builder<T>, {
    get(target, prop) {
      if (prop === 'build') {
        return () => result;
      }
      return (value: any) => {
        (result as any)[prop] = value;
        return builder;
      };
    },
  });
  return builder;
}

// Usage
interface Config {
  host: string;
  port: number;
  secure: boolean;
}

const config = createBuilder<Config>()
  .host('localhost')
  .port(3000)
  .secure(true)
  .build();
```

## Common Pitfalls

1. **Shallow vs Deep**: Built-in utilities like `Partial` and `Readonly` are shallow
2. **Union Distribution**: Conditional types distribute over unions
3. **Type Inference Limits**: Complex recursive types may hit depth limits
4. **Performance**: Overly complex utility types can slow down compilation
5. **any Propagation**: Avoid `any` in utility types as it defeats type safety
6. **NoInfer Overuse**: Use `NoInfer` sparingly, only when inference causes issues
7. **Const Assertions**: Remember `as const` for literal preservation

Always prefer built-in utility types when available, leverage TypeScript 5.7+ features for better type safety, and create custom utilities only when necessary for your specific use case.
