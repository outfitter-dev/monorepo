---
slug: typescript-error-handling-example
title: Complete Result type implementation example
description: Production-ready Result type implementation with utilities.
type: pattern
category: typescript
tags: [error-handling, typescript, example]
related: [typescript-error-handling]
---

# TypeScript Error Handling Example

Complete implementation of the Result pattern with utilities, Effect integration, and modern TypeScript features ready for production use.

## Full Implementation

```typescript
// result.ts - Core Result type and factory functions
export type Result<T, E = Error> =
  | { ok: true; data: T }
  | { ok: false; error: E };

export type AsyncResult<T, E = Error> = Promise<Result<T, E>>;

export const Result = {
  success<T>(data: T): Result<T, never> {
    return { ok: true, data };
  },

  failure<E>(error: E): Result<never, E> {
    return { ok: false, error };
  },

  isSuccess<T, E>(result: Result<T, E>): result is { ok: true; data: T } {
    return result.ok;
  },

  isFailure<T, E>(result: Result<T, E>): result is { ok: false; error: E } {
    return !result.ok;
  },

  map<T, U, E>(result: Result<T, E>, fn: (data: T) => U): Result<U, E> {
    return result.ok ? Result.success(fn(result.data)) : result;
  },

  flatMap<T, U, E>(
    result: Result<T, E>,
    fn: (data: T) => Result<U, E>
  ): Result<U, E> {
    return result.ok ? fn(result.data) : result;
  },

  mapError<T, E1, E2>(
    result: Result<T, E1>,
    fn: (error: E1) => E2
  ): Result<T, E2> {
    return result.ok ? result : Result.failure(fn(result.error));
  },

  match<T, E, U>(
    result: Result<T, E>,
    onSuccess: (data: T) => U,
    onError: (error: E) => U
  ): U {
    return result.ok ? onSuccess(result.data) : onError(result.error);
  },

  unwrapOr<T, E>(result: Result<T, E>, defaultValue: T): T {
    return result.ok ? result.data : defaultValue;
  },

  async tryCatch<T>(fn: () => Promise<T>): AsyncResult<T, Error> {
    try {
      const data = await fn();
      return Result.success(data);
    } catch (error) {
      return Result.failure(
        error instanceof Error ? error : new Error(String(error))
      );
    }
  },

  tryCatchSync<T>(fn: () => T): Result<T, Error> {
    try {
      return Result.success(fn());
    } catch (error) {
      return Result.failure(
        error instanceof Error ? error : new Error(String(error))
      );
    }
  },

  // Combines multiple Results into a single Result
  // The mapped tuple type ensures type safety for heterogeneous arrays
  // Example: combine([Result<string>, Result<number>]) => Result<[string, number]>
  combine<T extends readonly unknown[], E>(results: {
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

    return errors.length > 0
      ? Result.failure(errors)
      : Result.success(values as T);
  },
};

// errors.ts - Custom error types
export interface BaseError {
  message: string;
  timestamp: Date;
  context?: Record<string, unknown>;
}

export interface ApiError extends BaseError {
  status: number;
  code?: string;
  endpoint?: string;
}

export interface ValidationError extends BaseError {
  field: string;
  value?: unknown;
  constraints?: string[];
}

export const Errors = {
  api(status: number, message: string, options?: Partial<ApiError>): ApiError {
    return {
      status,
      message,
      timestamp: new Date(),
      ...options,
    };
  },

  validation(field: string, message: string, value?: unknown): ValidationError {
    return {
      field,
      message,
      value,
      timestamp: new Date(),
    };
  },
};
```

## Real-World Usage Example

```typescript
// user-service.ts - Example service using Result pattern
import { Result, AsyncResult, Errors, ApiError } from './result';
import { z } from 'zod';

// Define schemas
const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string().min(1),
  role: z.enum(['admin', 'user', 'guest']),
});

type User = z.infer<typeof UserSchema>;

// Service implementation
export class UserService {
  async getUser(id: string): AsyncResult<User, ApiError> {
    return Result.tryCatch(async () => {
      const response = await fetch(`/api/users/${id}`);

      if (!response.ok) {
        throw Errors.api(
          response.status,
          `Failed to fetch user: ${response.statusText}`,
          { endpoint: `/api/users/${id}` }
        );
      }

      const data = await response.json();
      return UserSchema.parse(data);
    }).then(result =>
      Result.mapError(result, error =>
        error instanceof Error && 'status' in error
          ? (error as ApiError)
          : Errors.api(500, error.message)
      )
    );
  }

  async updateUser(
    id: string,
    updates: Partial<User>
  ): AsyncResult<User, ApiError> {
    // Validate updates
    const validationResult = this.validateUserUpdates(updates);
    if (!Result.isSuccess(validationResult)) {
      return Result.failure(
        Errors.api(400, 'Validation failed', {
          context: { errors: validationResult.error },
        })
      );
    }

    return Result.tryCatch(async () => {
      const response = await fetch(`/api/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw Errors.api(
          response.status,
          `Failed to update user: ${response.statusText}`
        );
      }

      const data = await response.json();
      return UserSchema.parse(data);
    }).then(result =>
      Result.mapError(result, error =>
        error instanceof Error && 'status' in error
          ? (error as ApiError)
          : Errors.api(500, error.message)
      )
    );
  }

  private validateUserUpdates(
    updates: Partial<User>
  ): Result<Partial<User>, ValidationError[]> {
    const errors: ValidationError[] = [];

    if (updates.email && !z.string().email().safeParse(updates.email).success) {
      errors.push(
        Errors.validation('email', 'Invalid email format', updates.email)
      );
    }

    if (updates.name && updates.name.trim().length === 0) {
      errors.push(
        Errors.validation('name', 'Name cannot be empty', updates.name)
      );
    }

    return errors.length > 0 ? Result.failure(errors) : Result.success(updates);
  }
}

// Usage in React component
import React, { useState, useEffect } from 'react';

function UserProfile({ userId }: { userId: string }) {
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const userService = new UserService();

  useEffect(() => {
    userService.getUser(userId).then(result => {
      Result.match(
        result,
        user => {
          setUser(user);
          setError(null);
        },
        error => {
          setError(error.message);
          setUser(null);
        }
      );
      setLoading(false);
    });
  }, [userId]);

  const handleUpdate = async (updates: Partial<User>) => {
    const result = await userService.updateUser(userId, updates);

    return Result.match(
      result,
      updatedUser => {
        setUser(updatedUser);
        return { success: true };
      },
      error => {
        return { success: false, error: error.message };
      }
    );
  };

  // Component rendering logic...
}
```

## Testing Example

```typescript
// user-service.test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { UserService } from './user-service';
import { Result } from './result';

describe('UserService', () => {
  let service: UserService;

  beforeEach(() => {
    service = new UserService();
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getUser', () => {
    it('returns success result for valid user', async () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'user' as const,
      };

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockUser,
      } as Response);

      const result = await service.getUser('123');

      expect(Result.isSuccess(result)).toBe(true);
      if (Result.isSuccess(result)) {
        expect(result.data).toEqual(mockUser);
      }
    });

    it('returns failure result for 404', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      } as Response);

      const result = await service.getUser('999');

      expect(Result.isFailure(result)).toBe(true);
      if (Result.isFailure(result)) {
        expect(result.error.status).toBe(404);
        expect(result.error.message).toContain('Not Found');
      }
    });
  });
});
```

## Integration with Other Patterns

```typescript
// Combine with React Query
import { useQuery, useMutation } from '@tanstack/react-query';

export function useUser(id: string) {
  const userService = new UserService();

  return useQuery({
    queryKey: ['user', id],
    queryFn: async () => {
      const result = await userService.getUser(id);
      return Result.match(
        result,
        data => data,
        error => {
          throw error;
        }
      );
    },
  });
}

export function useUpdateUser() {
  const userService = new UserService();

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<User>;
    }) => {
      const result = await userService.updateUser(id, updates);
      return Result.match(
        result,
        data => data,
        error => {
          throw error;
        }
      );
    },
  });
}
```

## Modern Patterns Example

### Using Branded Types for IDs

```typescript
// branded-types.ts
type Brand<K, T> = K & { __brand: T };

export type UserId = Brand<string, 'UserId'>;
export type SessionId = Brand<string, 'SessionId'>;
export type ApiKey = Brand<string, 'ApiKey'>;

// Constructor functions with validation
export const UserId = {
  parse(id: string): Result<UserId, ValidationError> {
    if (!id || !id.match(/^user_[a-zA-Z0-9]{16}$/)) {
      return Result.failure(Errors.validation('id', 'Invalid user ID format'));
    }
    return Result.success(id as UserId);
  },

  unsafe(id: string): UserId {
    return id as UserId;
  },
};

// Usage in services
export class SecureUserService {
  async getUser(id: UserId): AsyncResult<User, ApiError> {
    // id is guaranteed to be a valid UserId
    return this.fetchUser(id);
  }

  async authenticate(apiKey: ApiKey): AsyncResult<SessionId, ApiError> {
    // Type-safe authentication
    return this.createSession(apiKey);
  }
}
```

### Effect Pattern Example

```typescript
// effect-example.ts
import { Effect, pipe } from 'effect';
import * as Schema from '@effect/schema/Schema';

// Define schemas with Effect
const UserSchema = Schema.struct({
  id: Schema.string,
  email: Schema.string.pipe(Schema.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)),
  name: Schema.string.pipe(Schema.minLength(1)),
  role: Schema.literal('admin', 'user', 'guest'),
});

type User = Schema.Schema.To<typeof UserSchema>;

// Error classes
class FetchError {
  readonly _tag = 'FetchError';
  constructor(
    readonly status: number,
    readonly message: string
  ) {}
}

class ParseError {
  readonly _tag = 'ParseError';
  constructor(readonly errors: readonly Schema.ParseError[]) {}
}

// Effect-based service
export class EffectUserService {
  getUser(id: string): Effect.Effect<User, FetchError | ParseError> {
    return pipe(
      Effect.tryPromise({
        try: () => fetch(`/api/users/${id}`),
        catch: () => new FetchError(0, 'Network error'),
      }),
      Effect.flatMap(response =>
        response.ok
          ? Effect.succeed(response)
          : Effect.fail(new FetchError(response.status, response.statusText))
      ),
      Effect.flatMap(response =>
        Effect.tryPromise({
          try: () => response.json(),
          catch: () => new FetchError(0, 'Invalid JSON'),
        })
      ),
      Effect.flatMap(data =>
        pipe(
          Schema.parse(UserSchema)(data),
          Effect.mapError(errors => new ParseError(errors))
        )
      )
    );
  }

  // Composing multiple operations
  getUserWithProfile(id: string) {
    return pipe(
      Effect.Do,
      Effect.bind('user', () => this.getUser(id)),
      Effect.bind('profile', ({ user }) => this.getProfile(user.id)),
      Effect.map(({ user, profile }) => ({
        ...user,
        profile,
      }))
    );
  }
}

// Running Effect programs
const program = pipe(
  new EffectUserService().getUserWithProfile('123'),
  Effect.catchTag('FetchError', error =>
    Effect.succeed({
      fallback: true,
      error: `Fetch failed: ${error.message}`,
    })
  )
);

Effect.runPromise(program).then(console.log).catch(console.error);
```

### Advanced Result Utilities

```typescript
// result-advanced.ts
export const ResultUtils = {
  // Traverse array with Result
  traverse<T, E, U>(items: T[], fn: (item: T) => Result<U, E>): Result<U[], E> {
    const results: U[] = [];

    for (const item of items) {
      const result = fn(item);
      if (!result.ok) {
        return result;
      }
      results.push(result.data);
    }

    return Result.success(results);
  },

  // Sequence Results - collects all values or all errors
  // Unlike combine, this works with homogeneous arrays
  // Returns success only if all Results are successful
  sequence<T, E>(results: Result<T, E>[]): Result<T[], E[]> {
    const values: T[] = [];
    const errors: E[] = [];

    for (const result of results) {
      if (result.ok) {
        values.push(result.data);
      } else {
        errors.push(result.error);
      }
    }

    return errors.length > 0 ? Result.failure(errors) : Result.success(values);
  },

  // Retry with exponential backoff
  async retry<T, E>(
    fn: () => AsyncResult<T, E>,
    options: {
      maxAttempts?: number;
      initialDelay?: number;
      maxDelay?: number;
      factor?: number;
      shouldRetry?: (error: E) => boolean;
    } = {}
  ): AsyncResult<T, E> {
    const {
      maxAttempts = 3,
      initialDelay = 1000,
      maxDelay = 30000,
      factor = 2,
      shouldRetry = () => true,
    } = options;

    let lastError: E;
    let delay = initialDelay;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const result = await fn();

      if (result.ok) {
        return result;
      }

      lastError = result.error;

      if (!shouldRetry(lastError) || attempt === maxAttempts - 1) {
        return result;
      }

      await new Promise(resolve => setTimeout(resolve, delay));
      delay = Math.min(delay * factor, maxDelay);
    }

    return Result.failure(lastError!);
  },
};
```

This complete example demonstrates production-ready implementations of:

- Result pattern with comprehensive utilities
- Modern TypeScript features (branded types, const assertions)
- Effect pattern for complex error handling
- Testing with Vitest
- Advanced composition patterns
- Retry logic with exponential backoff
