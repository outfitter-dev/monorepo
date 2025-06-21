---
slug: typescript-error-handling
title: TypeScript Error Handling Patterns
description: Type-safe error handling with Result and Effect patterns.
type: pattern
---

# TypeScript Error Handling Patterns

Modern type-safe error handling patterns using Result types, Effect patterns, custom error types, and TypeScript 5.7+ features.

## Related Documentation

- [TypeScript Standards](../standards/typescript-standards.md) - Core TypeScript configuration
- [Validation Patterns](./typescript-validation.md) - Input validation with error handling
- [Unit Testing Patterns](./testing-unit.md) - Testing error scenarios
- [React Query Guide](../guides/react-query.md) - Error handling in data fetching

## Result Type Implementation

### Basic Result Type

```typescript
type Result<T, E = Error> = { ok: true; data: T } | { ok: false; error: E };

// Factory functions
export function success<T>(data: T): Result<T, never> {
  return { ok: true, data };
}

export function failure<E>(error: E): Result<never, E> {
  return { ok: false, error };
}
```

### Type Guards

```typescript
export function isSuccess<T, E>(
  result: Result<T, E>
): result is { ok: true; data: T } {
  return result.ok;
}

export function isFailure<T, E>(
  result: Result<T, E>
): result is { ok: false; error: E } {
  return !result.ok;
}

// Usage with type narrowing
function processResult<T, E>(result: Result<T, E>) {
  if (isSuccess(result)) {
    // TypeScript knows result.data is available
    console.log(result.data);
  } else {
    // TypeScript knows result.error is available
    console.error(result.error);
  }
}
```

## Error Type Definitions

### Structured Error Types

```typescript
interface BaseError {
  message: string;
  timestamp: Date;
  context?: Record<string, unknown>;
}

interface ApiError extends BaseError {
  status: number;
  code?: string;
  endpoint?: string;
}

interface ValidationError extends BaseError {
  field: string;
  value?: unknown;
  constraints?: string[];
}

interface FileError extends BaseError {
  type: 'NOT_FOUND' | 'PERMISSION_DENIED' | 'INVALID_PATH' | 'UNKNOWN';
  path?: string;
}

// Discriminated union for multiple error types
export type AppError =
  | { type: 'API'; error: ApiError }
  | { type: 'VALIDATION'; error: ValidationError }
  | { type: 'FILE'; error: FileError }
  | { type: 'UNKNOWN'; error: Error };
```

### Error Factory Functions

```typescript
export function createApiError(
  status: number,
  message: string,
  options?: Partial<ApiError>
): ApiError {
  return {
    status,
    message,
    timestamp: new Date(),
    ...options,
  };
}

export function createValidationError(
  field: string,
  message: string,
  value?: unknown
): ValidationError {
  return {
    field,
    message,
    value,
    timestamp: new Date(),
  };
}
```

## Composing Operations

### Map and FlatMap

```typescript
// Transform successful values
export function map<T, U, E>(
  result: Result<T, E>,
  fn: (data: T) => U
): Result<U, E> {
  return result.ok ? success(fn(result.data)) : result;
}

// Chain Result operations
export function flatMap<T, U, E>(
  result: Result<T, E>,
  fn: (data: T) => Result<U, E>
): Result<U, E> {
  return result.ok ? fn(result.data) : result;
}

// Map error values
export function mapError<T, E1, E2>(
  result: Result<T, E1>,
  fn: (error: E1) => E2
): Result<T, E2> {
  return result.ok ? result : failure(fn(result.error));
}
```

### Utility Functions

```typescript
// Pattern matching
export function match<T, E, U>(
  result: Result<T, E>,
  onSuccess: (data: T) => U,
  onError: (error: E) => U
): U {
  return result.ok ? onSuccess(result.data) : onError(result.error);
}

// Unwrap with default
export function unwrapOr<T, E>(result: Result<T, E>, defaultValue: T): T {
  return result.ok ? result.data : defaultValue;
}

// Convert to nullable
export function toNullable<T, E>(result: Result<T, E>): T | null {
  return result.ok ? result.data : null;
}
```

## Async Result Patterns

### AsyncResult Type

```typescript
export type AsyncResult<T, E = Error> = Promise<Result<T, E>>;

// Catch async operations
export async function tryCatch<T>(fn: () => Promise<T>): AsyncResult<T, Error> {
  try {
    const data = await fn();
    return success(data);
  } catch (error) {
    return failure(error instanceof Error ? error : new Error(String(error)));
  }
}

// Synchronous tryCatch
export function tryCatchSync<T>(fn: () => T): Result<T, Error> {
  try {
    return success(fn());
  } catch (error) {
    return failure(error instanceof Error ? error : new Error(String(error)));
  }
}
```

### Async Utilities

```typescript
export async function mapAsync<T, U, E>(
  result: AsyncResult<T, E>,
  fn: (data: T) => Promise<U>
): AsyncResult<U, E> {
  const resolved = await result;
  return resolved.ok ? success(await fn(resolved.data)) : resolved;
}

export async function flatMapAsync<T, U, E>(
  result: AsyncResult<T, E>,
  fn: (data: T) => AsyncResult<U, E>
): AsyncResult<U, E> {
  const resolved = await result;
  return resolved.ok ? fn(resolved.data) : resolved;
}
```

## Advanced Patterns

### Combining Multiple Results

```typescript
// Type-safe combination of multiple Results
export function combine<T extends readonly unknown[], E>(results: {
  [K in keyof T]: Result<T[K], E>;
}): Result<T, E[]> {
  const errors: E[] = [];
  const values: unknown[] = [];

  for (const result of results) {
    if (result.ok) {
      values.push(result.data);
    } else {
      errors.push(result.error);
    }
  }

  return errors.length > 0 ? failure(errors) : success(values as T);
}

// Usage with proper typing (see validation patterns for form validation)
const emailResult: Result<string, ValidationError> = validateEmail(email);
const passwordResult: Result<string, ValidationError> =
  validatePassword(password);

const combined = combine([emailResult, passwordResult]);
// Type: Result<[string, string], ValidationError[]>
```

### Result with Context

```typescript
interface ResultContext {
  timestamp: Date;
  operation: string;
  metadata?: Record<string, any>;
}

type ContextualResult<T, E> = Result<T, E> & {
  context: ResultContext;
};

export function withContext<T, E>(
  result: Result<T, E>,
  operation: string,
  metadata?: Record<string, any>
): ContextualResult<T, E> {
  return {
    ...result,
    context: {
      timestamp: new Date(),
      operation,
      metadata,
    },
  };
}
```

## Integration Examples

### API Client with Typed Errors

```typescript
export class TypedApiClient {
  private async request<T>(
    url: string,
    options?: RequestInit
  ): AsyncResult<T, ApiError> {
    return tryCatch(async () => {
      const response = await fetch(url, options);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw createApiError(
          response.status,
          errorData.message || response.statusText,
          { code: errorData.code, endpoint: url }
        );
      }

      return response.json() as T;
    }).then(result =>
      mapError(
        result,
        (error): ApiError =>
          error instanceof Error && 'status' in error
            ? (error as ApiError)
            : createApiError(0, error.message)
      )
    );
  }
}
```

### Form Validation with Typed Results

```typescript
type ValidationResult<T> = Result<T, ValidationError[]>;

function validateField<T>(
  value: T | null | undefined,
  field: string,
  validator: (value: T) => boolean,
  message: string
): Result<T, ValidationError> {
  if (value == null) {
    return failure(createValidationError(field, `${field} is required`));
  }

  if (!validator(value)) {
    return failure(createValidationError(field, message, value));
  }

  return success(value);
}

// Combine field validations
function validateForm<T extends Record<string, any>>(validators: {
  [K in keyof T]: (value: any) => Result<T[K], ValidationError>;
}): (data: Partial<T>) => ValidationResult<T> {
  return data => {
    const results = Object.entries(validators).map(([field, validate]) =>
      validate(data[field as keyof T])
    );

    const errors = results
      .filter((r): r is { ok: false; error: ValidationError } => !r.ok)
      .map(r => r.error);

    if (errors.length > 0) {
      return failure(errors);
    }

    const validData = Object.fromEntries(
      Object.keys(validators).map((field, i) => [
        field,
        (results[i] as { ok: true; data: any }).data,
      ])
    );

    return success(validData as T);
  };
}
```

## Best Practices

### Type Narrowing

```typescript
// Use type guards for clean code flow
async function fetchUserProfile(
  id: string
): AsyncResult<UserProfile, ApiError> {
  const userResult = await fetchUser(id);

  if (!isSuccess(userResult)) {
    return userResult; // Type automatically narrows
  }

  const profileResult = await fetchProfile(userResult.data.profileId);

  return map(profileResult, profile => ({
    ...userResult.data,
    profile,
  }));
}
```

### Error Recovery

```typescript
// Provide fallback strategies
function withFallback<T, E>(
  primary: () => Result<T, E>,
  fallback: () => Result<T, E>
): Result<T, E> {
  const primaryResult = primary();
  return isSuccess(primaryResult) ? primaryResult : fallback();
}

// Retry with exponential backoff
async function retryWithBackoff<T>(
  fn: () => AsyncResult<T, Error>,
  maxAttempts = 3,
  initialDelay = 1000
): AsyncResult<T, Error> {
  let lastError: Error;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const result = await fn();

    if (isSuccess(result)) {
      return result;
    }

    lastError = result.error;

    if (attempt < maxAttempts - 1) {
      await new Promise(resolve =>
        setTimeout(resolve, initialDelay * Math.pow(2, attempt))
      );
    }
  }

  return failure(lastError!);
}
```

## Effect Pattern Integration

### Basic Effect Usage

```typescript
import { Effect, pipe } from 'effect';
import * as E from 'effect/Either';
import * as O from 'effect/Option';

// Define error types using Effect
class NetworkError {
  readonly _tag = 'NetworkError';
  constructor(
    readonly message: string,
    readonly status?: number
  ) {}
}

class ValidationError {
  readonly _tag = 'ValidationError';
  constructor(
    readonly field: string,
    readonly message: string
  ) {}
}

class ParseError {
  readonly _tag = 'ParseError';
  constructor(readonly message: string) {}
}

type AppError = NetworkError | ValidationError | ParseError;

// Effect-based service
class UserService {
  fetchUser(id: string): Effect.Effect<User, NetworkError | ParseError> {
    return pipe(
      Effect.tryPromise({
        try: () => fetch(`/api/users/${id}`),
        catch: error => new NetworkError(String(error)),
      }),
      Effect.flatMap(response =>
        response.ok
          ? Effect.succeed(response)
          : Effect.fail(new NetworkError('Failed to fetch', response.status))
      ),
      Effect.flatMap(response =>
        Effect.tryPromise({
          try: () => response.json(),
          catch: () => new ParseError('Invalid JSON response'),
        })
      ),
      Effect.flatMap(data =>
        pipe(userSchema.safeParse(data), result =>
          result.success
            ? Effect.succeed(result.data)
            : Effect.fail(new ParseError('Invalid user data'))
        )
      )
    );
  }
}
```

### Effect Composition

```typescript
// Composing Effects
const program = pipe(
  Effect.Do,
  Effect.bind('user', () => userService.fetchUser('123')),
  Effect.bind('profile', ({ user }) => profileService.fetchProfile(user.id)),
  Effect.map(({ user, profile }) => ({ ...user, profile }))
);

// Running Effects
Effect.runPromise(program)
  .then(console.log)
  .catch(error => {
    switch (error._tag) {
      case 'NetworkError':
        console.error(`Network error: ${error.message}`);
        break;
      case 'ValidationError':
        console.error(`Validation error in ${error.field}: ${error.message}`);
        break;
      case 'ParseError':
        console.error(`Parse error: ${error.message}`);
        break;
    }
  });
```

## Modern TypeScript Features

### Using NoInfer for Better Type Safety

```typescript
// Prevent TypeScript from inferring overly broad types
function createResult<T, E = Error>(
  value: T,
  error?: NoInfer<E>
): Result<T, E> {
  return error ? failure(error) : success(value);
}

// Forces explicit type annotation for errors
const result = createResult('success'); // Result<string, Error>
const typedResult = createResult<string, ValidationError>('success');
```

### Template Literal Types for Error Codes

```typescript
type ErrorCode =
  | `AUTH_${string}`
  | `VALIDATION_${string}`
  | `API_${string}`
  | `DB_${string}`;

interface TypedError {
  code: ErrorCode;
  message: string;
  details?: unknown;
}

// Type-safe error creation
function createError<T extends ErrorCode>(
  code: T,
  message: string,
  details?: unknown
): TypedError {
  return { code, message, details };
}

// Usage
const authError = createError('AUTH_INVALID_TOKEN', 'Token expired');
const validationError = createError('VALIDATION_EMAIL', 'Invalid email format');
```

## Summary

Modern TypeScript error handling combines multiple approaches:

1. **Result Types**: Explicit error handling without exceptions
2. **Effect Pattern**: Composable, type-safe error handling with dependency injection
3. **Type Safety**: Leverage TypeScript 5.7+ features for better inference
4. **Error Modeling**: Rich error types with discriminated unions
5. **Composition**: Functional utilities for combining error-prone operations
6. **Template Literals**: Type-safe error codes and messages

Choose the approach that best fits your application's complexity:

- Simple apps: Result types with custom errors
- Complex apps: Effect pattern for full composability
- Mixed approach: Result types at boundaries, Effect for core logic
