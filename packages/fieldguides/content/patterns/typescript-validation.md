---
slug: typescript-validation
title: TypeScript Validation Patterns
description: Runtime validation with Zod and modern schema patterns.
type: pattern
---

# TypeScript Validation Patterns

Runtime validation patterns using Zod, Valibot, and other modern libraries for type-safe data validation, schema composition, and error handling.

## Related Documentation

- [Error Handling Patterns](./typescript-error-handling.md) - Handling validation errors
- [Configuration Standards](../standards/configuration-standards.md) - Validating config
- [React Hook Form Guide](../guides/react-hook-form.md) - Form validation
- [TypeScript Standards](../standards/typescript-standards.md) - Type safety fundamentals

## Overview

Runtime validation ensures data integrity by validating inputs, configurations, and API responses against defined schemas. Modern validation libraries provide TypeScript-first approaches with automatic type inference.

### Library Comparison

| Library     | Bundle Size | Performance | Features                       |
| ----------- | ----------- | ----------- | ------------------------------ |
| **Zod**     | ~14KB       | Good        | Full-featured, wide ecosystem  |
| **Valibot** | ~3KB        | Excellent   | Modular, tree-shakeable        |
| **TypeBox** | ~10KB       | Excellent   | JSON Schema compatible         |
| **Yup**     | ~20KB       | Fair        | Legacy, good React integration |

## Basic Validation Patterns

### Schema Definition

```typescript
import { z } from 'zod';

// Basic types
const stringSchema = z.string();
const numberSchema = z.number();
const booleanSchema = z.boolean();
const dateSchema = z.date();

// Object schemas
const userSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(1).max(100),
  age: z.number().min(0).max(120),
  isActive: z.boolean().default(true),
  createdAt: z.date().default(() => new Date()),
});

// Union and enum types
const statusSchema = z.union([
  z.literal('pending'),
  z.literal('active'),
  z.literal('inactive'),
]);

const roleSchema = z.enum(['admin', 'user', 'guest']);
```

### Type Inference

```typescript
// Infer TypeScript types from schemas
type User = z.infer<typeof userSchema>;
type Status = z.infer<typeof statusSchema>;
type Role = z.infer<typeof roleSchema>;

// Create derived schemas
type CreateUserInput = z.infer<typeof userSchema.omit({ id: true, createdAt: true })>;
type UpdateUserInput = z.infer<typeof userSchema.partial().required({ id: true })>;
```

## Environment Variable Validation

### Configuration Schema

```typescript
const configSchema = z.object({
  server: z.object({
    port: z.coerce.number().min(1).max(65535).default(3000),
    host: z.string().default('localhost'),
    corsOrigins: z
      .string()
      .transform(str => str.split(','))
      .default('http://localhost:3000'),
  }),

  database: z.object({
    url: z.string().url(),
    maxConnections: z.coerce.number().min(1).max(100).default(10),
    ssl: z.coerce.boolean().default(false),
  }),

  auth: z.object({
    jwtSecret: z.string().min(32),
    jwtExpiresIn: z
      .string()
      .regex(/^\d+[hdwmy]$/)
      .default('7d'),
    bcryptRounds: z.coerce.number().min(10).max(15).default(12),
  }),

  app: z.object({
    environment: z.enum(['development', 'staging', 'production']),
    logLevel: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  }),
});

export type Config = z.infer<typeof configSchema>;
```

### Validation Function

```typescript
export function validateConfig(
  env: Record<string, string | undefined>
): Config {
  try {
    return configSchema.parse({
      server: {
        port: env.PORT,
        host: env.HOST,
        corsOrigins: env.CORS_ORIGINS,
      },
      database: {
        url: env.DATABASE_URL,
        maxConnections: env.DB_MAX_CONNECTIONS,
        ssl: env.DB_SSL,
      },
      auth: {
        jwtSecret: env.JWT_SECRET,
        jwtExpiresIn: env.JWT_EXPIRES_IN,
        bcryptRounds: env.BCRYPT_ROUNDS,
      },
      app: {
        environment: env.NODE_ENV,
        logLevel: env.LOG_LEVEL,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map(
        err => `${err.path.join('.')}: ${err.message}`
      );
      throw new Error(
        `Configuration validation failed:\n${errorMessages.join('\n')}`
      );
    }
    throw error;
  }
}
```

## Advanced Validation Patterns

### Custom Validators

```typescript
// Email with domain restriction
const corporateEmail = z
  .string()
  .email()
  .refine(email => email.endsWith('@company.com'), {
    message: 'Must be a company email address',
  });

// Password with multiple rules
const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .refine(password => /[A-Z]/.test(password), {
    message: 'Password must contain at least one uppercase letter',
  })
  .refine(password => /[a-z]/.test(password), {
    message: 'Password must contain at least one lowercase letter',
  })
  .refine(password => /[0-9]/.test(password), {
    message: 'Password must contain at least one number',
  });

// Conditional validation
const userRegistrationSchema = z
  .object({
    accountType: z.enum(['personal', 'business']),
    taxId: z.string().optional(),
  })
  .refine(data => data.accountType !== 'business' || data.taxId?.length > 0, {
    message: 'Tax ID is required for business accounts',
    path: ['taxId'],
  });
```

### Transform and Preprocess

```typescript
// Transform strings to arrays
const tagsFromString = z
  .string()
  .transform(str => str.split(',').map(s => s.trim()))
  .pipe(z.array(z.string().min(1)));

// Date string parsing
const dateStringSchema = z
  .string()
  .transform(str => new Date(str))
  .pipe(z.date())
  .refine(date => !isNaN(date.getTime()), {
    message: 'Invalid date string',
  });

// Price validation with coercion
const priceSchema = z
  .union([
    z.number(),
    z
      .string()
      .regex(/^\d+(\.\d{1,2})?$/)
      .transform(Number),
  ])
  .refine(val => val >= 0, { message: 'Price must be non-negative' });
```

## Composing Schemas

### Schema Composition

```typescript
// Base schemas
const addressSchema = z.object({
  street: z.string(),
  city: z.string(),
  postalCode: z.string(),
  country: z.string(),
});

const personSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  dateOfBirth: z.date(),
});

// Composed schemas
const employeeSchema = personSchema.extend({
  employeeId: z.string(),
  department: z.string(),
  hireDate: z.date(),
  address: addressSchema,
});

// Partial schemas for updates
const employeeUpdateSchema = employeeSchema
  .partial()
  .required({ employeeId: true });
```

### Dynamic Schema Building

```typescript
function createPaginatedSchema<T extends z.ZodTypeAny>(itemSchema: T) {
  return z.object({
    items: z.array(itemSchema),
    total: z.number().int().nonnegative(),
    page: z.number().int().positive(),
    pageSize: z.number().int().positive(),
    hasNext: z.boolean(),
    hasPrevious: z.boolean(),
  });
}

// Usage
const paginatedUsersSchema = createPaginatedSchema(userSchema);
type PaginatedUsers = z.infer<typeof paginatedUsersSchema>;
```

## Error Handling

### Structured Error Handling

```typescript
interface ValidationError {
  field: string;
  message: string;
  code: string;
}

function formatZodError(error: z.ZodError): ValidationError[] {
  return error.errors.map(issue => ({
    field: issue.path.join('.'),
    message: issue.message,
    code: issue.code,
  }));
}

// Safe parsing with error handling
function safeValidate<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: ValidationError[] } {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  } else {
    return { success: false, errors: formatZodError(result.error) };
  }
}
```

### API Response Validation

```typescript
// Type-safe API client
class ApiClient {
  async get<T>(url: string, responseSchema: z.ZodSchema<T>): Promise<T> {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const json = await response.json();
    return responseSchema.parse(json);
  }
}

// Usage with validation
const client = new ApiClient();
const users = await client.get('/api/users', z.array(userSchema));
```

## Form Validation Integration

```typescript
// Form validation helper
function createFormValidator<T extends z.ZodSchema>(schema: T) {
  return {
    validate: (data: unknown) => {
      const result = schema.safeParse(data);
      if (result.success) {
        return { isValid: true, data: result.data, errors: {} };
      }

      const errors: Record<string, string> = {};
      result.error.errors.forEach(error => {
        const field = error.path.join('.');
        errors[field] = error.message;
      });

      return { isValid: false, data: null, errors };
    },

    validateField: (field: keyof z.infer<T>, value: unknown) => {
      const fieldSchema = schema.shape[field as string];
      if (!fieldSchema) return { isValid: true, error: null };

      const result = fieldSchema.safeParse(value);
      return result.success
        ? { isValid: true, error: null }
        : { isValid: false, error: result.error.errors[0].message };
    },
  };
}
```

## Valibot Integration

### Basic Valibot Patterns

```typescript
import * as v from 'valibot';

// Basic schema definition
const UserSchema = v.object({
  id: v.pipe(v.string(), v.uuid()),
  email: v.pipe(v.string(), v.email()),
  name: v.pipe(v.string(), v.minLength(1), v.maxLength(100)),
  age: v.pipe(v.number(), v.minValue(0), v.maxValue(120)),
  isActive: v.optional(v.boolean(), true),
  createdAt: v.optional(v.date(), () => new Date()),
});

// Type inference
type User = v.InferOutput<typeof UserSchema>;

// Parsing with error handling
const parseUser = (data: unknown) => {
  const result = v.safeParse(UserSchema, data);
  if (result.success) {
    return { ok: true, data: result.output };
  }
  return { ok: false, errors: result.issues };
};
```

### Advanced Valibot Features

```typescript
// Custom validations
const PasswordSchema = v.pipe(
  v.string(),
  v.minLength(8),
  v.check(password => /[A-Z]/.test(password), 'Must contain uppercase letter'),
  v.check(password => /[a-z]/.test(password), 'Must contain lowercase letter'),
  v.check(password => /[0-9]/.test(password), 'Must contain number')
);

// Transformations
const ConfigSchema = v.object({
  port: v.pipe(
    v.union([v.string(), v.number()]),
    v.transform(val => Number(val)),
    v.minValue(1),
    v.maxValue(65535)
  ),
  tags: v.pipe(
    v.string(),
    v.transform(str => str.split(',').map(s => s.trim())),
    v.array(v.string())
  ),
});

// Conditional schemas
const AccountSchema = v.variant('type', [
  v.object({
    type: v.literal('personal'),
    firstName: v.string(),
    lastName: v.string(),
  }),
  v.object({
    type: v.literal('business'),
    companyName: v.string(),
    taxId: v.string(),
  }),
]);
```

## TypeBox for JSON Schema

```typescript
import { Type, Static } from '@sinclair/typebox';
import { Value } from '@sinclair/typebox/value';

// Define schema with JSON Schema compatibility
const UserSchema = Type.Object({
  id: Type.String({ format: 'uuid' }),
  email: Type.String({ format: 'email' }),
  name: Type.String({ minLength: 1, maxLength: 100 }),
  role: Type.Union([
    Type.Literal('admin'),
    Type.Literal('user'),
    Type.Literal('guest'),
  ]),
  metadata: Type.Optional(Type.Record(Type.String(), Type.Unknown())),
});

// Type inference
type User = Static<typeof UserSchema>;

// Validation
const validateUser = (data: unknown): User => {
  if (Value.Check(UserSchema, data)) {
    return data;
  }
  const errors = [...Value.Errors(UserSchema, data)];
  throw new Error(`Validation failed: ${JSON.stringify(errors)}`);
};

// Generate JSON Schema
const jsonSchema = JSON.stringify(UserSchema, null, 2);
```

## Modern Zod Patterns

### Discriminated Unions with Exhaustive Checking

```typescript
const EventSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('user.created'),
    userId: z.string(),
    timestamp: z.date(),
  }),
  z.object({
    type: z.literal('user.updated'),
    userId: z.string(),
    changes: z.record(z.unknown()),
    timestamp: z.date(),
  }),
  z.object({
    type: z.literal('user.deleted'),
    userId: z.string(),
    timestamp: z.date(),
  }),
]);

type Event = z.infer<typeof EventSchema>;

// Exhaustive event handler
function handleEvent(event: Event): void {
  switch (event.type) {
    case 'user.created':
      console.log(`User created: ${event.userId}`);
      break;
    case 'user.updated':
      console.log(`User updated: ${event.userId}`, event.changes);
      break;
    case 'user.deleted':
      console.log(`User deleted: ${event.userId}`);
      break;
    default:
      // TypeScript ensures this is never reached
      const _exhaustive: never = event;
      throw new Error(`Unhandled event type`);
  }
}
```

### Schema Versioning

```typescript
// Version schemas for API evolution
const UserV1Schema = z.object({
  id: z.string(),
  name: z.string(),
});

const UserV2Schema = UserV1Schema.extend({
  email: z.string().email(),
  createdAt: z.date(),
});

// Migration function
function migrateUserV1ToV2(v1User: z.infer<typeof UserV1Schema>) {
  return UserV2Schema.parse({
    ...v1User,
    email: `${v1User.id}@legacy.com`,
    createdAt: new Date(),
  });
}
```

## Performance Optimization

### Lazy Schema Evaluation

```typescript
// Define recursive schemas efficiently
const CategorySchema: z.ZodType<Category> = z.lazy(() =>
  z.object({
    id: z.string(),
    name: z.string(),
    children: z.array(CategorySchema).optional(),
  })
);

interface Category {
  id: string;
  name: string;
  children?: Category[];
}
```

### Precompiled Validators

```typescript
// Compile validators for repeated use
const compiledUserValidator = {
  schema: userSchema,
  parse: userSchema.parse.bind(userSchema),
  safeParse: userSchema.safeParse.bind(userSchema),

  // Cache parsed results for identical inputs
  cachedParse: (() => {
    const cache = new WeakMap<object, z.infer<typeof userSchema>>();
    return (data: unknown) => {
      if (typeof data === 'object' && data !== null) {
        const cached = cache.get(data);
        if (cached) return cached;

        const result = userSchema.parse(data);
        cache.set(data, result);
        return result;
      }
      return userSchema.parse(data);
    };
  })(),
};
```

## Best Practices

### Schema Organization

```typescript
// schemas/user.ts
export const userSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  profile: z.object({
    firstName: z.string(),
    lastName: z.string(),
    avatar: z.string().url().optional(),
  }),
});

export type User = z.infer<typeof userSchema>;
export type CreateUserDto = z.infer<typeof userSchema.omit({ id: true })>;
export type UpdateUserDto = z.infer<typeof userSchema.partial().required({ id: true })>;

// Validation functions
export const validateUser = (data: unknown): User => userSchema.parse(data);
export const validateCreateUser = (data: unknown): CreateUserDto =>
  userSchema.omit({ id: true }).parse(data);
```

### Choose the Right Library

1. **Use Zod** when:

   - You need a mature ecosystem
   - Working with complex schemas
   - Integration with form libraries

2. **Use Valibot** when:

   - Bundle size is critical
   - Performance is paramount
   - You need tree-shaking

3. **Use TypeBox** when:
   - JSON Schema compatibility needed
   - OpenAPI integration required
   - Working with standards-based tools

### Testing Validation

```typescript
describe('User Validation', () => {
  it('should validate correct user data', () => {
    const validUser = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      email: 'user@example.com',
      name: 'John Doe',
      age: 30,
    };

    expect(() => userSchema.parse(validUser)).not.toThrow();
  });

  it('should reject invalid email', () => {
    const invalidUser = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      email: 'invalid-email',
      name: 'John Doe',
      age: 30,
    };

    const result = userSchema.safeParse(invalidUser);
    expect(result.success).toBe(false);
  });
});
```

## Summary

Modern validation principles:

1. **Choose the right tool** - Balance features, performance, and bundle size
2. **Define schemas at boundaries** - Validate at API endpoints and service interfaces
3. **Use type inference** - Let validation libraries generate TypeScript types
4. **Compose schemas** - Build complex schemas from simpler ones
5. **Optimize performance** - Use lazy evaluation and caching for complex schemas
6. **Version schemas** - Plan for API evolution with schema versioning
7. **Test thoroughly** - Ensure validation handles all edge cases
