# @outfitter/env

Shared utilities for loading and validating environment variables in Outfitter
projects. The package standardizes Bun Secrets integration, `.env` handling
for local development, and Zod-powered validation with comprehensive diagnostics.

## Features

- **Type-safe validation**: Validate environment variables against Zod schemas with full type inference
- **Bun Secrets integration**: Native support for Bun's secure secrets management in production
- **Flexible loading**: Support for `.env` files, Bun Secrets, and environment profiles
- **Profile management**: Built-in support for development, staging, and production environments
- **Prefix handling**: Automatic prefix stripping for multi-tenant or namespaced applications
- **Result-based errors**: Structured error handling via `@outfitter/contracts` and `@outfitter/validation`
- **Comprehensive diagnostics**: Detailed validation errors with field-level feedback

## Installation

```bash
bun add @outfitter/env
```

**Peer dependencies:**

```bash
bun add @outfitter/contracts @outfitter/validation zod
```

## Quick Start

```ts
import { validateEnv, loadDotEnv } from "@outfitter/env";
import { z } from "zod";

// Define your environment schema
const EnvSchema = z.object({
  DATABASE_URL: z.string().url(),
  NODE_ENV: z.enum(["development", "staging", "production"]),
  PORT: z.coerce.number().int().positive().default(3000),
});

// Load .env in non-production environments
if (process.env.NODE_ENV !== "production") {
  loadDotEnv();
}

// Validate and parse environment variables
const result = validateEnv(EnvSchema, {
  defaults: { NODE_ENV: "development" },
});

if (!result.ok) {
  console.error("Environment validation failed:", result.error.message);
  process.exit(1);
}

const env = result.value;
// env is now fully typed: { DATABASE_URL: string, NODE_ENV: "development" | "staging" | "production", PORT: number }
```

## Bun Secrets Setup

Bun Secrets provide a secure way to manage secrets in production without relying on environment variables or `.env` files.

### Configuration

Store secrets using the Bun CLI:

```bash
# Store a single secret
bun secret set API_KEY "your-secret-value"

# Store a secret in a custom namespace
bun secret set DATABASE_PASSWORD "db-pass" --namespace production

# View stored secrets (values are redacted)
bun secret list

# View secrets in a specific namespace
bun secret list --namespace production

# Remove a secret
bun secret delete API_KEY
```

### Namespace Organization Patterns

Organize secrets by environment or service:

```bash
# By environment
bun secret set DATABASE_URL "postgres://..." --namespace production
bun secret set DATABASE_URL "postgres://..." --namespace staging

# By service (multi-tenant apps)
bun secret set API_KEY "key1" --namespace tenant-alpha
bun secret set API_KEY "key2" --namespace tenant-beta

# By feature area
bun secret set STRIPE_KEY "sk_live_..." --namespace payments
bun secret set SENDGRID_KEY "SG..." --namespace email
```

### Secret Naming Best Practices

1. **Use SCREAMING_SNAKE_CASE**: Match standard environment variable conventions
2. **Be explicit**: Prefer `STRIPE_SECRET_KEY` over `SECRET` or `KEY`
3. **Include service names**: `STRIPE_API_KEY`, `SENDGRID_API_KEY`, not just `API_KEY`
4. **Avoid redundancy**: If using namespaces, don't repeat namespace in the key name
   - Good: `API_KEY` in namespace `stripe`
   - Avoid: `STRIPE_API_KEY` in namespace `stripe`
5. **Version secrets when rotating**: `DATABASE_PASSWORD_V2` or use timestamped namespaces

### Loading Secrets in Production

```ts
import { loadBunSecrets, validateEnv } from "@outfitter/env";
import { z } from "zod";

const SecretSchema = z.object({
  DATABASE_URL: z.string().url(),
  API_KEY: z.string().min(1),
  STRIPE_SECRET_KEY: z.string().startsWith("sk_"),
});

// Load secrets from Bun Secrets
const secrets = await loadBunSecrets(
  ["DATABASE_URL", "API_KEY", "STRIPE_SECRET_KEY"],
  {
    namespace: "production",
    prefix: "APP_", // Optional: strips "APP_" prefix from keys
  }
);

// Merge secrets with process.env
const env = { ...process.env, ...secrets };

// Validate combined environment
const result = validateEnv(SecretSchema, { env });

if (!result.ok) {
  console.error("Secret validation failed:", result.error.message);
  process.exit(1);
}
```

### Multi-Tenant Secret Loading

```ts
const tenantId = process.env.TENANT_ID;

if (!tenantId) {
  throw new Error("TENANT_ID must be set");
}

// Load tenant-specific secrets
const secrets = await loadBunSecrets(
  ["API_KEY", "DATABASE_URL", "ENCRYPTION_KEY"],
  { namespace: `tenant-${tenantId}` }
);

const result = validateEnv(TenantSchema, { env: secrets });
```

## Local .env Conventions

### File Structure

The package follows standard `.env` conventions with automatic file discovery:

```
project-root/
├── .env              # Committed defaults and non-sensitive config
├── .env.local        # Local overrides (gitignored)
├── .env.development  # Development-specific (optional)
├── .env.staging      # Staging-specific (optional)
└── .env.production   # Production-specific (optional, use Bun Secrets instead)
```

### .env vs .env.local

**`.env` (committed to git):**
- Default values safe for all developers
- Non-sensitive configuration
- Example values and documentation
- Shared development settings

```env
# .env
NODE_ENV=development
PORT=3000
LOG_LEVEL=info
DATABASE_URL=postgres://localhost:5432/myapp_dev
API_TIMEOUT=5000
```

**`.env.local` (gitignored):**
- Personal overrides
- Local secrets (development API keys)
- Machine-specific configuration
- Never committed to version control

```env
# .env.local
DATABASE_URL=postgres://localhost:5432/my_custom_db
STRIPE_TEST_KEY=sk_test_...
DEBUG=true
```

### What Should/Shouldn't Go in .env Files

**DO include in committed `.env`:**
- Default port numbers
- Log levels
- Feature flags (defaults)
- Example connection strings
- Non-sensitive API endpoints
- Timeout values
- Development database names

**DO NOT include in committed `.env`:**
- API keys or secrets
- Production credentials
- Personal access tokens
- Private keys
- Database passwords
- OAuth client secrets

**Always use `.env.local` or Bun Secrets for sensitive data.**

### .gitignore Configuration

Ensure your `.gitignore` includes:

```gitignore
# Environment files
.env.local
.env.*.local
.env.production

# Keep committed defaults
!.env
!.env.development
!.env.staging
```

### Loading .env Files

```ts
import { loadDotEnv } from "@outfitter/env";

// Load default .env or .env.local (checks both in order)
const env = loadDotEnv();

// Load a specific file
const env = loadDotEnv(".env.staging");

// Load and merge with process.env
const env = loadDotEnv();
const mergedEnv = { ...process.env, ...env };
```

The `loadDotEnv` function:
1. Checks `.env.local` first (if no path specified)
2. Falls back to `.env` if `.env.local` doesn't exist
3. Returns empty object if neither file exists
4. Does NOT override existing `process.env` variables

## Usage Examples

### Basic Validation with Defaults

```ts
import { validateEnv } from "@outfitter/env";
import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.enum(["development", "staging", "production"]),
  PORT: z.coerce.number().int().positive(),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]),
});

const result = validateEnv(schema, {
  defaults: {
    NODE_ENV: "development",
    PORT: "3000",
    LOG_LEVEL: "info",
  },
});

if (!result.ok) {
  console.error("Invalid environment:", result.error.message);
  process.exit(1);
}

const { NODE_ENV, PORT, LOG_LEVEL } = result.value;
```

### Prefix Handling for Multi-Tenant Apps

```ts
const TenantSchema = z.object({
  DATABASE_URL: z.string().url(),
  API_KEY: z.string(),
  REGION: z.enum(["us-east-1", "eu-west-1"]),
});

// Environment has: TENANT_A_DATABASE_URL, TENANT_A_API_KEY, TENANT_A_REGION
const result = validateEnv(TenantSchema, {
  prefix: "TENANT_A_",
  env: process.env,
});

// Validates against unprefixed schema keys:
// DATABASE_URL, API_KEY, REGION
```

### Environment Profiles

```ts
import { resolveEnvProfile, validateEnv } from "@outfitter/env";

const AppSchema = z.object({
  NODE_ENV: z.enum(["development", "staging", "production"]),
  DATABASE_URL: z.string().url(),
  FEATURE_NEW_UI: z.coerce.boolean(),
});

// Get profile-specific defaults
const profile = resolveEnvProfile("staging");

const result = validateEnv(AppSchema, {
  defaults: {
    ...profile.defaults, // { NODE_ENV: "staging" }
    FEATURE_NEW_UI: "false",
  },
});
```

### Async Bun Secrets Loading

```ts
async function loadEnvironment() {
  const secretNames = ["DATABASE_URL", "STRIPE_SECRET_KEY", "JWT_SECRET"];

  // Load from Bun Secrets in production
  const secrets = await loadBunSecrets(secretNames, {
    namespace: process.env.DEPLOY_ENV || "production",
  });

  // Load .env files in development
  const dotEnv = process.env.NODE_ENV !== "production" ? loadDotEnv() : {};

  // Merge: process.env < dotEnv < secrets
  const env = {
    ...process.env,
    ...dotEnv,
    ...secrets,
  };

  return validateEnv(AppSchema, { env });
}

const result = await loadEnvironment();
if (!result.ok) {
  throw result.error;
}

const config = result.value;
```

### Error Handling Patterns

```ts
import { validateEnv } from "@outfitter/env";
import { ERROR_CODES } from "@outfitter/contracts";

const result = validateEnv(schema, { env: process.env });

// Pattern 1: Exit on validation failure (CLI apps)
if (!result.ok) {
  console.error("Environment validation failed:", result.error.message);
  process.exit(1);
}

// Pattern 2: Throw error (server startup)
if (!result.ok) {
  throw result.error;
}

// Pattern 3: Return default configuration
const config = result.ok
  ? result.value
  : getDefaultConfig();

// Pattern 4: Check error code for specific handling
if (!result.ok) {
  if (result.error.code === ERROR_CODES.CONFIG_VALIDATION_FAILED) {
    // Detailed validation diagnostics available in error.message
    logger.error("Environment validation failed", {
      error: result.error.message,
      code: result.error.code,
    });
  }
  throw result.error;
}
```

### Required vs Optional Overrides

```ts
const FlexibleSchema = z.object({
  API_KEY: z.string().optional(), // Optional by default
  DEBUG: z.boolean().default(false),
});

// Force API_KEY to be required in production
const result = validateEnv(FlexibleSchema, {
  required: ["API_KEY"], // Override: make API_KEY required
  env: process.env,
});

// Make DEBUG optional even if it wasn't in schema
const result2 = validateEnv(
  z.object({ DEBUG: z.boolean() }), // Required in schema
  {
    optional: ["DEBUG"], // Override: make it optional
    defaults: { DEBUG: "false" },
  }
);
```

### Complex Schema with Validation

```ts
const ProductionSchema = z.object({
  // Database
  DATABASE_URL: z.string().url(),
  DATABASE_POOL_SIZE: z.coerce.number().int().min(1).max(100).default(10),

  // Redis
  REDIS_URL: z.string().url(),
  REDIS_TTL: z.coerce.number().int().positive().default(3600),

  // API Keys
  STRIPE_SECRET_KEY: z.string().startsWith("sk_"),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith("whsec_"),

  // Feature Flags
  FEATURE_BETA: z.coerce.boolean().default(false),
  RATE_LIMIT_ENABLED: z.coerce.boolean().default(true),

  // Application
  NODE_ENV: z.literal("production"),
  PORT: z.coerce.number().int().min(1024).max(65535).default(8080),
  LOG_LEVEL: z.enum(["info", "warn", "error"]).default("info"),
});

const result = validateEnv(ProductionSchema, {
  schemaName: "ProductionEnvironment", // Custom error message prefix
});

if (!result.ok) {
  // Error message includes field paths and validation details
  // Example: "ProductionEnvironment: STRIPE_SECRET_KEY: String must start with 'sk_'; DATABASE_POOL_SIZE: Number must be less than or equal to 100"
  console.error(result.error.message);
  process.exit(1);
}
```

## API Reference

### `validateEnv<T>(schema, options?)`

Validates environment variables against a Zod schema and returns a Result type.

**Type Signature:**
```ts
function validateEnv<T>(
  schema: z.ZodSchema<T>,
  options?: EnvOptions
): Result<T, ExtendedAppError>
```

**Parameters:**
- `schema`: A Zod schema defining the expected environment structure
- `options`: Configuration options (optional)
  - `required?: readonly string[]` - Keys to force as required (overrides schema)
  - `optional?: readonly string[]` - Keys to force as optional (overrides schema)
  - `defaults?: Record<string, string>` - Default values for missing variables
  - `prefix?: string` - Prefix to strip from environment variable names
  - `env?: Record<string, unknown>` - Custom environment object (defaults to `process.env`)
  - `schemaName?: string` - Name for error messages (defaults to "environment")

**Returns:**
- `Result<T, ExtendedAppError>`: Success with typed value or error with diagnostics

**Example:**
```ts
const result = validateEnv(
  z.object({ PORT: z.coerce.number() }),
  {
    defaults: { PORT: "3000" },
    schemaName: "ServerConfig",
  }
);
```

---

### `createEnvValidator<T>(schema, options?)`

Creates a validator compatible with the `@outfitter/validation` package. Similar to `validateEnv` but returns a validation-specific Result type.

**Type Signature:**
```ts
function createEnvValidator<T>(
  schema: z.ZodSchema<T>,
  options?: EnvOptions
): Result<T, ValidationError>
```

**Parameters:**
Same as `validateEnv`.

**Returns:**
- `Result<T, ValidationError>`: Success with typed value or validation-specific error

**Use Case:**
Use when integrating with the broader `@outfitter/validation` ecosystem for consistent error handling across validation boundaries.

**Example:**
```ts
const validator = createEnvValidator(AppSchema, {
  env: process.env,
  schemaName: "AppEnvironment",
});

if (!validator.ok) {
  // ValidationError has different structure than ExtendedAppError
  handleValidationError(validator.error);
}
```

---

### `loadBunSecrets(secretNames, options?)`

Asynchronously loads secrets from Bun's secure secrets storage.

**Type Signature:**
```ts
async function loadBunSecrets(
  secretNames: readonly string[],
  options?: LoadSecretsOptions
): Promise<Record<string, string>>
```

**Parameters:**
- `secretNames`: Array of secret names to load
- `options`: Configuration options (optional)
  - `namespace?: string` - Bun Secrets namespace (defaults to "default")
  - `prefix?: string` - Prefix to add when looking up secrets

**Returns:**
- `Promise<Record<string, string>>`: Object with loaded secrets (missing secrets are omitted)

**Behavior:**
- Only available when running in Bun runtime
- Returns empty object if Bun Secrets API is unavailable
- Silently skips secrets that don't exist
- Does NOT throw errors on missing secrets

**Example:**
```ts
const secrets = await loadBunSecrets(
  ["API_KEY", "DATABASE_PASSWORD"],
  { namespace: "production", prefix: "APP_" }
);
// Looks up: APP_API_KEY, APP_DATABASE_PASSWORD in namespace "production"
// Returns: { API_KEY: "...", DATABASE_PASSWORD: "..." }
```

---

### `loadDotEnv(filePath?)`

Synchronously loads environment variables from a `.env` file.

**Type Signature:**
```ts
function loadDotEnv(filePath?: string): Record<string, string>
```

**Parameters:**
- `filePath`: Optional path to `.env` file (relative to `process.cwd()`)

**Returns:**
- `Record<string, string>`: Parsed environment variables

**Behavior:**
- If `filePath` is provided: loads that specific file
- If `filePath` is omitted: checks `.env.local` first, then `.env`
- Returns empty object if no file exists
- Does NOT modify `process.env`
- Does NOT override existing keys in the file (first value wins)

**Example:**
```ts
// Auto-detect .env.local or .env
const env = loadDotEnv();

// Load specific file
const stagingEnv = loadDotEnv(".env.staging");

// Merge with process.env
const mergedEnv = { ...process.env, ...loadDotEnv() };
```

---

### `resolveEnvProfile(profile)`

Returns configuration defaults for a specific environment profile.

**Type Signature:**
```ts
function resolveEnvProfile(profile: EnvProfile): EnvProfileConfig

type EnvProfile = "development" | "staging" | "production"

interface EnvProfileConfig {
  readonly env: EnvProfile
  readonly defaults: Record<string, string>
}
```

**Parameters:**
- `profile`: Environment profile name

**Returns:**
- `EnvProfileConfig`: Configuration with profile name and default values

**Defaults:**
- `development`: `{ NODE_ENV: "development" }`
- `staging`: `{ NODE_ENV: "staging" }`
- `production`: `{ NODE_ENV: "production" }`

**Example:**
```ts
const { env, defaults } = resolveEnvProfile("staging");
// env: "staging"
// defaults: { NODE_ENV: "staging" }

const result = validateEnv(schema, { defaults });
```

---

### Type Exports

```ts
// Options types
export interface EnvOptions {
  readonly required?: readonly string[]
  readonly optional?: readonly string[]
  readonly defaults?: Readonly<Record<string, string>>
  readonly prefix?: string
  readonly env?: Record<string, unknown>
  readonly schemaName?: string
}

export interface LoadSecretsOptions {
  readonly namespace?: string
  readonly prefix?: string
}

// Profile types
export type EnvProfile = "development" | "staging" | "production"

export interface EnvProfileConfig {
  readonly env: EnvProfile
  readonly defaults: Readonly<Record<string, string>>
}

// Result type
export type ValidateEnvResult<T> = Result<T, ExtendedAppError>
```

## Best Practices

1. **Always validate on startup**: Fail fast if environment is misconfigured
2. **Use TypeScript**: Let the schema provide type safety throughout your app
3. **Separate concerns**: Use `.env` for development, Bun Secrets for production
4. **Version your schemas**: As your environment grows, consider versioning or modular schemas
5. **Document required variables**: Keep your `.env` file as documentation
6. **Avoid inline defaults**: Define defaults in `validateEnv` options, not in code
7. **Use profile helpers**: Leverage `resolveEnvProfile` for environment-specific defaults
8. **Handle errors gracefully**: Always check `result.ok` before accessing `result.value`
9. **Namespace secrets logically**: Group related secrets by environment or service
10. **Rotate secrets regularly**: Use versioned names or timestamped namespaces

## Migration Guide

### From dotenv

```ts
// Before
import dotenv from "dotenv";
dotenv.config();
const port = process.env.PORT || 3000;

// After
import { validateEnv, loadDotEnv } from "@outfitter/env";
import { z } from "zod";

loadDotEnv(); // Optional: doesn't modify process.env
const result = validateEnv(
  z.object({ PORT: z.coerce.number().default(3000) })
);
const port = result.ok ? result.value.PORT : 3000;
```

### From environment variables

```ts
// Before
const config = {
  database: process.env.DATABASE_URL,
  port: Number(process.env.PORT) || 3000,
};

// After
const schema = z.object({
  DATABASE_URL: z.string().url(),
  PORT: z.coerce.number().default(3000),
});

const result = validateEnv(schema);
if (!result.ok) throw result.error;
const config = result.value;
```

## Testing

When testing code that uses `@outfitter/env`:

```ts
import { validateEnv } from "@outfitter/env";
import { describe, it, expect } from "vitest";

describe("app initialization", () => {
  it("validates environment successfully", () => {
    const result = validateEnv(AppSchema, {
      env: {
        DATABASE_URL: "postgres://test",
        NODE_ENV: "development",
      },
    });

    expect(result.ok).toBe(true);
  });

  it("fails with invalid environment", () => {
    const result = validateEnv(AppSchema, {
      env: { DATABASE_URL: "invalid" },
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toContain("DATABASE_URL");
    }
  });
});
```

## License

MIT © Outfitter
