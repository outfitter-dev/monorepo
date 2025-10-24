# @outfitter/validation

Type-safe validation utilities with diagnostics, schema registry, and JSON Schema generation for the Outfitter ecosystem.

## Overview

`@outfitter/validation` wraps Zod with powerful registry patterns, diagnostic helpers, and JSON Schema generation to deliver consistent, actionable validation errors across your entire application. Built on top of `@outfitter/contracts`, it provides Result-based validation that integrates seamlessly with Outfitter's error handling patterns.

## Features

- **Schema Registry**: Centralized schema management with lazy lookup and type-safe validation
- **Diagnostic-Friendly**: Transform Zod issues into structured, actionable diagnostics
- **JSON Schema Generation**: Export Zod schemas to JSON Schema for documentation and tooling
- **Environment Validation**: Specialized helpers for validating environment variables
- **Result Pattern Integration**: First-class support for `Result<T, E>` error handling
- **AppError Conversion**: Convert diagnostics to Outfitter's `ExtendedAppError` format

## Installation

```bash
bun add @outfitter/validation
```

## Quick Start

```typescript
import {
  createSchemaRegistry,
  validateWithDiagnostics,
  generateJsonSchema,
  createEnvValidator,
} from "@outfitter/validation";
import { z } from "zod";

// Create a schema registry
const registry = createSchemaRegistry();

// Define and register schemas
const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  role: z.enum(["user", "admin"]).default("user"),
});

registry.register("user", UserSchema);

// Validate with detailed diagnostics
const result = registry.validate("user", {
  id: "invalid-uuid",
  email: "not-an-email",
});

if (!result.ok) {
  console.error(result.error.diagnostics);
  // [
  //   {
  //     path: ["id"],
  //     message: "Invalid uuid",
  //     code: "validation.zod.invalid_string",
  //     severity: "error"
  //   },
  //   {
  //     path: ["email"],
  //     message: "Invalid email",
  //     code: "validation.zod.invalid_string",
  //     severity: "error"
  //   }
  // ]
}

// Generate JSON Schema for documentation
const jsonSchema = generateJsonSchema(UserSchema, { name: "User" });

// Validate environment variables
const envResult = createEnvValidator(
  z.object({
    DATABASE_URL: z.string().url(),
    NODE_ENV: z.enum(["development", "production", "test"]),
  })
);
```

## Core Concepts

### Schema Registry

The schema registry provides centralized schema management with type-safe validation:

```typescript
import { createSchemaRegistry } from "@outfitter/validation";
import { z } from "zod";

// Create registry with initial schemas
const registry = createSchemaRegistry({
  user: z.object({
    id: z.string().uuid(),
    email: z.string().email(),
  }),
  post: z.object({
    id: z.string().uuid(),
    title: z.string().min(1),
    content: z.string(),
  }),
});

// Register additional schemas
const CommentSchema = z.object({
  id: z.string().uuid(),
  text: z.string().min(1),
  userId: z.string().uuid(),
});

registry.register("comment", CommentSchema);

// List all registered schemas
console.log(registry.list()); // ["user", "post", "comment"]

// Retrieve a schema
const userSchema = registry.get("user");
if (userSchema) {
  // Use the schema directly
  const parsed = userSchema.parse(data);
}

// Validate with Result pattern
const result = registry.validate("user", userData);
if (result.ok) {
  console.log("Valid user:", result.value);
} else {
  console.error("Validation failed:", result.error.summary);
  console.error("Diagnostics:", result.error.diagnostics);
}
```

#### Registry Benefits

1. **Centralized Management**: Register all schemas in one place
2. **Lazy Lookup**: Schemas are only retrieved when needed
3. **Type Safety**: Full TypeScript inference for validated data
4. **Result Pattern**: No exceptions, explicit error handling
5. **Detailed Errors**: Rich diagnostic information for failures

### Validation Diagnostics

Transform Zod validation errors into structured, actionable diagnostics:

```typescript
import { validateWithDiagnostics } from "@outfitter/validation";
import { z } from "zod";

const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  age: z.number().int().positive(),
  role: z.enum(["user", "admin"]),
});

const result = validateWithDiagnostics(UserSchema, {
  id: "not-a-uuid",
  email: "invalid-email",
  age: -5,
  role: "superuser",
});

if (!result.ok) {
  result.error.forEach((diagnostic) => {
    console.log(`Path: ${diagnostic.path.join(".")}`);
    console.log(`Message: ${diagnostic.message}`);
    console.log(`Code: ${diagnostic.code}`);
    console.log(`Severity: ${diagnostic.severity}`);
  });
}

// Output:
// Path: id
// Message: Invalid uuid
// Code: validation.zod.invalid_string
// Severity: error
//
// Path: email
// Message: Invalid email
// Code: validation.zod.invalid_string
// Severity: error
//
// Path: age
// Message: Number must be greater than 0
// Code: validation.zod.too_small
// Severity: error
//
// Path: role
// Message: Invalid enum value. Expected 'user' | 'admin', received 'superuser'
// Code: validation.zod.invalid_enum_value
// Severity: error
```

#### Diagnostic Structure

Each diagnostic includes:

- **path**: Array of property keys showing where the error occurred
- **message**: Human-readable error message from Zod
- **code**: Machine-readable error code (e.g., `validation.zod.invalid_string`)
- **severity**: Either `"error"` or `"warning"` (custom Zod issues can specify warnings)

### Environment Validation

Specialized validation for environment variables with proper error handling:

```typescript
import { createEnvValidator } from "@outfitter/validation";
import { z } from "zod";

// Define environment schema
const EnvSchema = z.object({
  // Database
  DATABASE_URL: z.string().url(),
  DATABASE_POOL_SIZE: z.coerce.number().int().positive().default(10),

  // Server
  PORT: z.coerce.number().int().positive().default(3000),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),

  // API Keys
  API_KEY: z.string().min(1),
  API_SECRET: z.string().min(32),

  // Feature Flags
  ENABLE_ANALYTICS: z.coerce.boolean().default(false),
  ENABLE_CACHE: z.coerce.boolean().default(true),
});

// Validate against process.env
const result = createEnvValidator(EnvSchema);

if (!result.ok) {
  console.error("Environment validation failed:");
  console.error(result.error.summary);
  result.error.diagnostics.forEach((d) => {
    console.error(`  ${d.path.join(".")}: ${d.message}`);
  });
  process.exit(1);
}

// Use validated environment
const env = result.value;
console.log(`Starting server on port ${env.PORT}`);
console.log(`Database pool size: ${env.DATABASE_POOL_SIZE}`);
```

#### Custom Environment Source

You can validate against a custom environment object instead of `process.env`:

```typescript
import { createEnvValidator } from "@outfitter/validation";
import { z } from "zod";

const customEnv = {
  DATABASE_URL: "https://db.example.com",
  NODE_ENV: "development",
  API_KEY: "test-key",
};

const result = createEnvValidator(
  z.object({
    DATABASE_URL: z.string().url(),
    NODE_ENV: z.enum(["development", "production", "test"]),
    API_KEY: z.string().min(1),
  }),
  {
    env: customEnv,
    schemaName: "custom-env", // Shows in error messages
  }
);
```

#### Environment Validation Best Practices

1. **Fail Fast**: Validate environment at startup, exit if invalid
2. **Use Defaults**: Provide sensible defaults for optional variables
3. **Use Coercion**: Environment variables are strings, use `z.coerce` for numbers/booleans
4. **Document Required Variables**: Use descriptive schema definitions
5. **Type Safety**: Export the validated type for use throughout your app

```typescript
// env.ts
import { createEnvValidator } from "@outfitter/validation";
import { z } from "zod";

const EnvSchema = z.object({
  DATABASE_URL: z.string().url(),
  PORT: z.coerce.number().int().positive().default(3000),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

export type Env = z.infer<typeof EnvSchema>;

const result = createEnvValidator(EnvSchema, { schemaName: "application-env" });

if (!result.ok) {
  console.error("Environment validation failed:");
  result.error.diagnostics.forEach((d) => {
    console.error(`  ${d.path.join(".")}: ${d.message}`);
  });
  process.exit(1);
}

export const env = result.value;

// app.ts
import { env } from "./env.js";

console.log(`Server running on port ${env.PORT}`);
console.log(`Environment: ${env.NODE_ENV}`);
```

### JSON Schema Generation

Generate JSON Schema from Zod schemas for documentation, validation, and tooling:

```typescript
import { generateJsonSchema } from "@outfitter/validation";
import { z } from "zod";

const UserSchema = z.object({
  id: z.string().uuid().describe("Unique user identifier"),
  email: z.string().email().describe("User's email address"),
  name: z.string().min(1).describe("User's full name"),
  age: z.number().int().positive().optional().describe("User's age in years"),
  role: z.enum(["user", "admin"]).default("user").describe("User's role"),
});

// Generate JSON Schema
const jsonSchema = generateJsonSchema(UserSchema, {
  name: "User",
  nameStrategy: "title",
  $refStrategy: "none",
});

console.log(JSON.stringify(jsonSchema, null, 2));
```

Output:

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "User",
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid",
      "description": "Unique user identifier"
    },
    "email": {
      "type": "string",
      "format": "email",
      "description": "User's email address"
    },
    "name": {
      "type": "string",
      "minLength": 1,
      "description": "User's full name"
    },
    "age": {
      "type": "number",
      "minimum": 1,
      "description": "User's age in years"
    },
    "role": {
      "type": "string",
      "enum": ["user", "admin"],
      "default": "user",
      "description": "User's role"
    }
  },
  "required": ["id", "email", "name"],
  "additionalProperties": false
}
```

#### JSON Schema Use Cases

1. **API Documentation**: Generate OpenAPI/Swagger schemas
2. **Validation**: Use with JSON Schema validators in other languages
3. **IDE Support**: Provide IntelliSense in JSON/YAML files
4. **Code Generation**: Generate types in other languages
5. **Contract Testing**: Validate API responses against schemas

#### Complex Schema Example

```typescript
import { generateJsonSchema } from "@outfitter/validation";
import { z } from "zod";

const AddressSchema = z.object({
  street: z.string().min(1),
  city: z.string().min(1),
  state: z.string().length(2),
  zip: z.string().regex(/^\d{5}(-\d{4})?$/),
});

const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  addresses: z.array(AddressSchema).min(1),
  metadata: z.record(z.string(), z.unknown()).optional(),
  preferences: z
    .object({
      newsletter: z.boolean().default(false),
      notifications: z.boolean().default(true),
    })
    .optional(),
});

const jsonSchema = generateJsonSchema(UserSchema, {
  name: "User",
  definitions: {
    Address: AddressSchema,
  },
});

// Use the JSON Schema with your favorite tools
```

### AppError Conversion

Convert validation diagnostics to Outfitter's `ExtendedAppError` format:

```typescript
import { diagnosticsToAppError } from "@outfitter/validation";
import { validateWithDiagnostics } from "@outfitter/validation";
import { z } from "zod";

const UserSchema = z.object({
  email: z.string().email(),
  age: z.number().int().positive(),
});

const result = validateWithDiagnostics(UserSchema, {
  email: "invalid",
  age: -5,
});

if (!result.ok) {
  // Convert diagnostics to AppError
  const appError = diagnosticsToAppError(result.error, "User");

  console.log(appError.code); // "CONFIG_VALIDATION_FAILED"
  console.log(appError.message); // "Validation failed for User: email: Invalid email; age: Number must be greater than 0"
  console.log(appError.name); // "ValidationDiagnostics"

  // Original diagnostics are preserved in the cause
  const cause = appError.cause as Error & {
    diagnostics?: readonly ValidationDiagnostic[];
  };
  console.log(cause.diagnostics); // Original diagnostic array
}
```

#### Integration with Error Handling

```typescript
import { diagnosticsToAppError, validateWithDiagnostics } from "@outfitter/validation";
import { err, ok, type Result } from "@outfitter/contracts";
import type { ExtendedAppError } from "@outfitter/contracts";
import { z } from "zod";

function validateUser(data: unknown): Result<User, ExtendedAppError> {
  const UserSchema = z.object({
    id: z.string().uuid(),
    email: z.string().email(),
    age: z.number().int().positive(),
  });

  const result = validateWithDiagnostics(UserSchema, data);

  if (!result.ok) {
    return err(diagnosticsToAppError(result.error, "User"));
  }

  return ok(result.value);
}

// Usage
const userResult = validateUser(userData);

if (!userResult.ok) {
  // Handle as ExtendedAppError
  console.error(`Error: ${userResult.error.message}`);
  console.error(`Code: ${userResult.error.code}`);

  // Access original diagnostics if needed
  const cause = userResult.error.cause as Error & {
    diagnostics?: readonly ValidationDiagnostic[];
  };
  if (cause.diagnostics) {
    cause.diagnostics.forEach((d) => {
      console.error(`  ${d.path.join(".")}: ${d.message}`);
    });
  }
}
```

## API Reference

### createSchemaRegistry

Creates a new schema registry for centralized schema management.

```typescript
function createSchemaRegistry(
  initial?: Record<string, z.ZodSchema<unknown>>
): SchemaRegistry;
```

**Parameters:**

- `initial` (optional): Object mapping schema names to Zod schemas

**Returns:** `SchemaRegistry` object with the following methods:

- `register<T>(name: string, schema: z.ZodSchema<T>): void` - Register a schema
- `get<T>(name: string): z.ZodSchema<T> | undefined` - Retrieve a schema
- `validate<T>(name: string, data: unknown): Result<T, ValidationError>` - Validate data
- `list(): readonly string[]` - List all registered schema names

**Example:**

```typescript
const registry = createSchemaRegistry({
  user: z.object({ id: z.string().uuid() }),
});

registry.register("post", z.object({ title: z.string() }));

const schemas = registry.list(); // ["user", "post"]
```

### validateWithDiagnostics

Validates data against a Zod schema and returns detailed diagnostics on failure.

```typescript
function validateWithDiagnostics<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): Result<T, ValidationDiagnostic[]>;
```

**Parameters:**

- `schema`: Zod schema to validate against
- `data`: Data to validate

**Returns:** `Result<T, ValidationDiagnostic[]>` - Success with parsed data or error with diagnostics

**Example:**

```typescript
const schema = z.object({ email: z.string().email() });
const result = validateWithDiagnostics(schema, { email: "invalid" });

if (!result.ok) {
  result.error.forEach((diagnostic) => {
    console.log(diagnostic.path, diagnostic.message);
  });
}
```

### generateJsonSchema

Generates JSON Schema (Draft 7) from a Zod schema.

```typescript
function generateJsonSchema<T>(
  schema: z.ZodSchema<T>,
  options?: JsonSchemaOptions
): JsonSchema<T>;
```

**Parameters:**

- `schema`: Zod schema to convert
- `options` (optional): Configuration options for JSON Schema generation
  - `name`: Name for the root schema
  - `nameStrategy`: How to represent names (`"title"` or `"ref"`)
  - `$refStrategy`: How to handle references (`"none"`, `"root"`, or `"relative"`)
  - `definitions`: Additional schema definitions
  - `target`: Target JSON Schema version (`"jsonSchema7"` or `"openApi3"`)

**Returns:** JSON Schema object conforming to JSON Schema Draft 7

**Example:**

```typescript
const schema = z.object({
  name: z.string().describe("User's name"),
  age: z.number().int().positive(),
});

const jsonSchema = generateJsonSchema(schema, {
  name: "User",
  nameStrategy: "title",
});
```

### createEnvValidator

Validates environment variables against a Zod schema.

```typescript
function createEnvValidator<T>(
  schema: z.ZodSchema<T>,
  options?: EnvValidationOptions
): Result<T, ValidationError>;
```

**Parameters:**

- `schema`: Zod schema defining expected environment variables
- `options` (optional): Validation options
  - `env`: Custom environment object (defaults to `process.env`)
  - `schemaName`: Name to use in error messages (defaults to `"environment"`)

**Returns:** `Result<T, ValidationError>` - Success with validated environment or error

**Example:**

```typescript
const result = createEnvValidator(
  z.object({
    DATABASE_URL: z.string().url(),
    PORT: z.coerce.number().int().default(3000),
  }),
  { schemaName: "app-env" }
);

if (!result.ok) {
  console.error(result.error.summary);
  process.exit(1);
}

const env = result.value;
```

### diagnosticsToAppError

Converts validation diagnostics to an `ExtendedAppError`.

```typescript
function diagnosticsToAppError(
  diagnostics: readonly ValidationDiagnostic[],
  schemaName?: string
): ExtendedAppError;
```

**Parameters:**

- `diagnostics`: Array of validation diagnostics
- `schemaName` (optional): Name of the schema for error messages

**Returns:** `ExtendedAppError` with code `CONFIG_VALIDATION_FAILED`

**Example:**

```typescript
const diagnostics = [
  {
    path: ["email"],
    message: "Invalid email",
    code: "validation.zod.invalid_string",
    severity: "error",
  },
];

const error = diagnosticsToAppError(diagnostics, "User");
console.log(error.code); // "CONFIG_VALIDATION_FAILED"
```

## Type Exports

### ValidationDiagnostic

Structured diagnostic information for validation errors.

```typescript
interface ValidationDiagnostic {
  readonly path: readonly string[];
  readonly message: string;
  readonly code: string;
  readonly severity: "error" | "warning";
}
```

### ValidationError

Complete validation error with schema name and diagnostics.

```typescript
interface ValidationError {
  readonly name: "ValidationError";
  readonly schema?: string;
  readonly diagnostics: readonly ValidationDiagnostic[];
  readonly summary: string;
}
```

### SchemaRegistry

Interface for the schema registry object.

```typescript
interface SchemaRegistry {
  register<T>(name: string, schema: z.ZodSchema<T>): void;
  get<T>(name: string): z.ZodSchema<T> | undefined;
  validate<T>(name: string, data: unknown): Result<T, ValidationError>;
  list(): readonly string[];
}
```

### JsonSchema

Type alias for JSON Schema Draft 7.

```typescript
type JsonSchema<T = unknown> = JsonSchema7<T>;
```

### JsonSchemaOptions

Options for JSON Schema generation (re-exported from `zod-to-json-schema`).

```typescript
type JsonSchemaOptions = ZodToJsonSchemaOptions;
```

### EnvValidationOptions

Options for environment validation.

```typescript
interface EnvValidationOptions {
  readonly env?: Record<string, unknown>;
  readonly schemaName?: string;
}
```

## Best Practices

### 1. Use Schema Registry for Centralized Management

Instead of defining schemas throughout your codebase, centralize them in a registry:

```typescript
// schemas/registry.ts
import { createSchemaRegistry } from "@outfitter/validation";
import { UserSchema, PostSchema, CommentSchema } from "./definitions.js";

export const schemas = createSchemaRegistry({
  user: UserSchema,
  post: PostSchema,
  comment: CommentSchema,
});

// services/user.ts
import { schemas } from "../schemas/registry.js";

export function validateUser(data: unknown) {
  return schemas.validate("user", data);
}
```

### 2. Fail Fast on Environment Validation

Validate environment variables at application startup and exit immediately on failure:

```typescript
// env.ts
import { createEnvValidator } from "@outfitter/validation";
import { z } from "zod";

const EnvSchema = z.object({
  DATABASE_URL: z.string().url(),
  API_KEY: z.string().min(1),
});

const result = createEnvValidator(EnvSchema, { schemaName: "app-config" });

if (!result.ok) {
  console.error("Environment validation failed:");
  result.error.diagnostics.forEach((d) => {
    console.error(`  ${d.path.join(".")}: ${d.message}`);
  });
  process.exit(1);
}

export const env = result.value;
```

### 3. Use Diagnostics for User-Facing Errors

Transform diagnostics into user-friendly error messages:

```typescript
import { validateWithDiagnostics } from "@outfitter/validation";
import { z } from "zod";

function validateUserInput(data: unknown) {
  const result = validateWithDiagnostics(UserSchema, data);

  if (!result.ok) {
    const errors = result.error.map((d) => ({
      field: d.path.join("."),
      message: d.message,
    }));

    return {
      success: false,
      errors,
    };
  }

  return {
    success: true,
    data: result.value,
  };
}
```

### 4. Generate JSON Schema for API Documentation

Export schemas for use in API documentation tools:

```typescript
import { generateJsonSchema } from "@outfitter/validation";
import { writeFileSync } from "node:fs";

// Generate schemas for all API models
const schemas = {
  User: generateJsonSchema(UserSchema, { name: "User" }),
  Post: generateJsonSchema(PostSchema, { name: "Post" }),
  Comment: generateJsonSchema(CommentSchema, { name: "Comment" }),
};

// Write to file for OpenAPI/Swagger
writeFileSync("./api-schemas.json", JSON.stringify(schemas, null, 2));
```

### 5. Add Descriptions for Better Schemas

Use Zod's `.describe()` method to add descriptions that appear in JSON Schema:

```typescript
import { z } from "zod";

const UserSchema = z.object({
  id: z.string().uuid().describe("Unique user identifier"),
  email: z.string().email().describe("User's primary email address"),
  name: z.string().min(1).max(100).describe("User's full name (1-100 characters)"),
  age: z.number().int().positive().optional().describe("User's age in years"),
});
```

### 6. Leverage Type Inference

Let TypeScript infer types from your schemas:

```typescript
import { z } from "zod";

const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  role: z.enum(["user", "admin"]).default("user"),
});

// Infer the type
export type User = z.infer<typeof UserSchema>;

// Use the inferred type
function processUser(user: User) {
  console.log(user.email); // TypeScript knows this exists
  console.log(user.role); // TypeScript knows this is "user" | "admin"
}
```

## Testing Examples

### Testing Schema Registry

```typescript
import { describe, expect, it } from "vitest";
import { createSchemaRegistry } from "@outfitter/validation";
import { z } from "zod";

describe("Schema Registry", () => {
  it("validates registered schemas", () => {
    const registry = createSchemaRegistry();
    const schema = z.object({ id: z.string().uuid() });

    registry.register("test", schema);

    const result = registry.validate("test", {
      id: crypto.randomUUID(),
    });

    expect(result.ok).toBe(true);
  });

  it("returns error for unregistered schemas", () => {
    const registry = createSchemaRegistry();

    const result = registry.validate("missing", {});

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.summary).toContain("not registered");
    }
  });

  it("provides diagnostics on validation failure", () => {
    const registry = createSchemaRegistry({
      user: z.object({
        email: z.string().email(),
      }),
    });

    const result = registry.validate("user", { email: "invalid" });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.diagnostics).toHaveLength(1);
      expect(result.error.diagnostics[0]?.path).toEqual(["email"]);
    }
  });
});
```

### Testing Environment Validation

```typescript
import { describe, expect, it } from "vitest";
import { createEnvValidator } from "@outfitter/validation";
import { z } from "zod";

describe("Environment Validation", () => {
  it("validates correct environment", () => {
    const result = createEnvValidator(
      z.object({
        DATABASE_URL: z.string().url(),
        PORT: z.coerce.number().int(),
      }),
      {
        env: {
          DATABASE_URL: "https://db.example.com",
          PORT: "3000",
        },
      }
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.PORT).toBe(3000); // Coerced to number
    }
  });

  it("returns errors for invalid environment", () => {
    const result = createEnvValidator(
      z.object({
        DATABASE_URL: z.string().url(),
      }),
      {
        env: { DATABASE_URL: "not-a-url" },
        schemaName: "test-env",
      }
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.schema).toBe("test-env");
      expect(result.error.diagnostics[0]?.path).toEqual(["DATABASE_URL"]);
    }
  });
});
```

### Testing Diagnostic Conversion

```typescript
import { describe, expect, it } from "vitest";
import { diagnosticsToAppError, validateWithDiagnostics } from "@outfitter/validation";
import { ERROR_CODES } from "@outfitter/contracts";
import { z } from "zod";

describe("Diagnostic Conversion", () => {
  it("converts diagnostics to AppError", () => {
    const schema = z.object({ email: z.string().email() });
    const result = validateWithDiagnostics(schema, { email: "invalid" });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      const error = diagnosticsToAppError(result.error, "User");

      expect(error.code).toBe(ERROR_CODES.CONFIG_VALIDATION_FAILED);
      expect(error.message).toContain("User");
      expect(error.message).toContain("Invalid email");
    }
  });
});
```

## Integration Patterns

### With API Routes

```typescript
import { validateWithDiagnostics } from "@outfitter/validation";
import { z } from "zod";
import type { Context } from "hono";

const CreateUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
  age: z.number().int().positive().optional(),
});

export async function createUser(c: Context) {
  const body = await c.req.json();
  const result = validateWithDiagnostics(CreateUserSchema, body);

  if (!result.ok) {
    return c.json(
      {
        error: "Validation failed",
        details: result.error.map((d) => ({
          field: d.path.join("."),
          message: d.message,
        })),
      },
      400
    );
  }

  const user = await db.createUser(result.value);
  return c.json(user, 201);
}
```

### With Database Models

```typescript
import { createSchemaRegistry } from "@outfitter/validation";
import { z } from "zod";

// Define schemas
const schemas = createSchemaRegistry({
  user: z.object({
    id: z.string().uuid(),
    email: z.string().email(),
    createdAt: z.coerce.date(),
  }),
  post: z.object({
    id: z.string().uuid(),
    userId: z.string().uuid(),
    title: z.string().min(1),
    content: z.string(),
  }),
});

// Validate database results
export async function getUser(id: string) {
  const row = await db.query("SELECT * FROM users WHERE id = ?", [id]);
  return schemas.validate("user", row);
}
```

### With Configuration Files

```typescript
import { validateWithDiagnostics, diagnosticsToAppError } from "@outfitter/validation";
import { z } from "zod";
import { readFileSync } from "node:fs";

const ConfigSchema = z.object({
  server: z.object({
    port: z.number().int().positive(),
    host: z.string(),
  }),
  database: z.object({
    url: z.string().url(),
    poolSize: z.number().int().positive().default(10),
  }),
});

export function loadConfig(path: string) {
  const raw = JSON.parse(readFileSync(path, "utf-8"));
  const result = validateWithDiagnostics(ConfigSchema, raw);

  if (!result.ok) {
    throw diagnosticsToAppError(result.error, "application-config");
  }

  return result.value;
}
```

## Migration Guide

### From Direct Zod Usage

Before:

```typescript
import { z } from "zod";

const UserSchema = z.object({
  email: z.string().email(),
});

try {
  const user = UserSchema.parse(data);
  console.log(user);
} catch (error) {
  if (error instanceof z.ZodError) {
    console.error(error.issues);
  }
}
```

After:

```typescript
import { validateWithDiagnostics } from "@outfitter/validation";
import { z } from "zod";

const UserSchema = z.object({
  email: z.string().email(),
});

const result = validateWithDiagnostics(UserSchema, data);

if (result.ok) {
  console.log(result.value);
} else {
  console.error(result.error); // Structured diagnostics
}
```

### From Custom Validation Functions

Before:

```typescript
function validateEnv() {
  const required = ["DATABASE_URL", "API_KEY"];
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing environment variables: ${missing.join(", ")}`);
  }

  return {
    DATABASE_URL: process.env.DATABASE_URL!,
    API_KEY: process.env.API_KEY!,
  };
}
```

After:

```typescript
import { createEnvValidator } from "@outfitter/validation";
import { z } from "zod";

const result = createEnvValidator(
  z.object({
    DATABASE_URL: z.string().url(),
    API_KEY: z.string().min(1),
  })
);

if (!result.ok) {
  console.error("Environment validation failed:");
  result.error.diagnostics.forEach((d) => {
    console.error(`  ${d.path.join(".")}: ${d.message}`);
  });
  process.exit(1);
}

const env = result.value;
```

## Related Packages

- **[@outfitter/contracts](../contracts)** - Result pattern, error handling, and branded types
- **[@outfitter/config](../config)** - Configuration schema and validation
- **[@outfitter/types](../types)** - Advanced TypeScript utility types

## TypeScript Configuration

This package requires TypeScript 5.7+ with strict mode enabled:

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

## License

MIT © Outfitter

## Contributing

See the [monorepo root](../../README.md) for contribution guidelines.
