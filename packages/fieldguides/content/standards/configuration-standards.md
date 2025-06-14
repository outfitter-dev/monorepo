---
slug: configuration-standards
title: Manage configuration with Zod validation and env hierarchy
description: Environment configuration patterns for secure, validated app settings.
type: convention
---

# Configuration Standards

Environment configuration, validation, and management patterns for robust
applications.

## Related Documentation

- [Validation Patterns](../patterns/typescript-validation.md) - Schema
  validation with Zod
- [Security Scanning](../patterns/security-scanning.md) - Scanning for exposed
  secrets
- [Testing Standards](./testing-standards.md) - Testing configuration
- [Deployment Standards](./deployment-standards.md) - Environment management
- [TypeScript Standards](./typescript-standards.md) - Type-safe configuration
- [Monorepo Standards](./monorepo-standards.md) - Shared configurations
- [Documentation Standards](./documentation-standards.md) - Documenting
  configuration

## Version Compatibility

This guide assumes:

- TypeScript: 5.0+ (for const type parameters)
- Node.js: 18+ (for built-in crypto module with modern algorithms)
- Zod: 3.0+ (for schema validation)
- AWS SDK: 3.0+ (for Secrets Manager integration)

## Core Principles

### Configuration as Code

- Define configuration schemas explicitly
- Validate all configuration at startup
- Fail fast on invalid configuration
- Document all configuration options

### Environment Hierarchy

Configuration precedence (highest to lowest):

1. Runtime arguments
2. Environment variables
3. Environment-specific files (.env.production)
4. Default configuration file (.env)
5. Code defaults

## Zod Configuration Patterns

### Basic Configuration Schema

```typescript
// ✂️ Production-ready: Zod configuration schema
import { z } from 'zod';

// Define configuration schema
const configSchema = z.object({
  // Server configuration
  server: z.object({
    port: z.coerce.number().int().positive().default(3000),
    host: z.string().default('localhost'),
    corsOrigins: z
      .string()
      .transform(s => s.split(','))
      .default('http://localhost:3000'),
  }),

  // Database configuration
  database: z.object({
    url: z.string().url(),
    maxConnections: z.coerce.number().int().positive().default(10),
    ssl: z.coerce.boolean().default(true),
  }),

  // Redis configuration
  redis: z
    .object({
      url: z.string().url(),
      keyPrefix: z.string().default('app:'),
      ttl: z.coerce.number().int().positive().default(3600),
    })
    .optional(),

  // Authentication
  auth: z.object({
    jwtSecret: z.string().min(32),
    jwtExpiresIn: z
      .string()
      .regex(/^\d+[hdwmy]$/)
      .default('7d'),
    bcryptRounds: z.coerce.number().int().min(10).max(15).default(12),
  }),
});

export type Config = z.infer<typeof configSchema>;
```

### Environment Variable Parsing

```typescript
// ✂️ Production-ready: Environment parsing with validation
import { config as loadEnv } from 'dotenv';
import { z } from 'zod';

// Load environment files based on NODE_ENV
function loadEnvironment(): void {
  const env = process.env.NODE_ENV || 'development';

  // Load base .env file
  loadEnv({ path: '.env' });

  // Load environment-specific file
  loadEnv({ path: `.env.${env}`, override: true });

  // Load local overrides (not committed to git)
  loadEnv({ path: '.env.local', override: true });
}

// Parse and validate configuration
export function parseConfig(): Config {
  loadEnvironment();

  const configData = {
    server: {
      port: process.env.PORT,
      host: process.env.HOST,
      corsOrigins: process.env.CORS_ORIGINS,
    },
    database: {
      url: process.env.DATABASE_URL,
      maxConnections: process.env.DB_MAX_CONNECTIONS,
      ssl: process.env.DB_SSL,
    },
    redis: process.env.REDIS_URL
      ? {
          url: process.env.REDIS_URL,
          keyPrefix: process.env.REDIS_KEY_PREFIX,
          ttl: process.env.REDIS_TTL,
        }
      : undefined,
    auth: {
      jwtSecret: process.env.JWT_SECRET,
      jwtExpiresIn: process.env.JWT_EXPIRES_IN,
      bcryptRounds: process.env.BCRYPT_ROUNDS,
    },
  };

  const parsed = configSchema.safeParse(configData);

  if (!parsed.success) {
    console.error('Invalid configuration:', parsed.error.format());
    throw new Error('Configuration validation failed');
  }

  return parsed.data;
}
```

### Singleton Configuration

```typescript
// ✂️ Production-ready: Configuration singleton pattern
let config: Config | null = null;

export function getConfig(): Config {
  if (!config) {
    config = parseConfig();
  }
  return config;
}

// Reset for testing
export function resetConfig(): void {
  config = null;
}
```

## Advanced Patterns

### Feature Flags

```typescript
// ✂️ Production-ready: Feature flag configuration
const featureFlagsSchema = z.object({
  enableNewDashboard: z.coerce.boolean().default(false),
  enableBetaFeatures: z.coerce.boolean().default(false),
  maintenanceMode: z.coerce.boolean().default(false),
  rateLimitRequests: z.coerce.number().default(100),
});

// Extend main config
const configWithFeaturesSchema = configSchema.extend({
  features: featureFlagsSchema,
});
```

### Sensitive Data Handling

```typescript
// ✂️ Production-ready: Safe configuration logging
// Redact sensitive values for logging
export function getSafeConfig(config: Config): Record<string, any> {
  return {
    ...config,
    database: {
      ...config.database,
      url: config.database.url.replace(/:\/\/([^@]+)@/, '://*****@'),
    },
    auth: {
      ...config.auth,
      jwtSecret: '***REDACTED***',
    },
  };
}

// Log safe configuration at startup
console.log('Configuration loaded:', getSafeConfig(getConfig()));
```

### Dynamic Configuration

```typescript
// ✂️ Production-ready: Dynamic configuration manager
import { EventEmitter } from 'events';
import { watch } from 'fs';

class ConfigManager extends EventEmitter {
  private config: Config;
  private watchers: (() => void)[] = [];

  constructor() {
    super();
    this.config = parseConfig();
  }

  get(): Config {
    return this.config;
  }

  async reload(): Promise<void> {
    try {
      this.config = parseConfig();
      this.emit('configReloaded', this.config);
    } catch (error) {
      this.emit('configError', error);
    }
  }

  watchFiles(files: string[]): void {
    files.forEach(file => {
      const watcher = watch(file, () => {
        this.reload();
      });
      this.watchers.push(() => watcher.close());
    });
  }

  stopWatching(): void {
    this.watchers.forEach(stop => stop());
    this.watchers = [];
  }
}

export const configManager = new ConfigManager();
```

## Framework Integration

### Next.js Configuration

```typescript
// ✂️ Production-ready: Next.js configuration integration
// next.config.js
import { getConfig } from './src/config';

const config = getConfig();

/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_API_URL: config.server.apiUrl,
    NEXT_PUBLIC_APP_NAME: config.app.name,
  },
  serverRuntimeConfig: {
    database: config.database,
    auth: config.auth,
  },
  publicRuntimeConfig: {
    features: config.features,
  },
};

export default nextConfig;
```

### Express Middleware

```typescript
// ✂️ Production-ready: Express configuration middleware
import express from 'express';
import { getConfig } from './config';

export function configMiddleware(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
): void {
  // Attach config to request for easy access
  req.config = getConfig();

  // Set security headers based on config
  if (req.config.security.enableHSTS) {
    res.setHeader(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains'
    );
  }

  next();
}
```

## Testing Configuration

```typescript
// ✂️ Production-ready: Configuration testing
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { parseConfig, resetConfig } from './config';

describe('Configuration', () => {
  beforeEach(() => {
    resetConfig();
    vi.resetModules();
  });

  it('should parse valid configuration', () => {
    process.env.DATABASE_URL = 'postgres://localhost:5432/test';
    process.env.JWT_SECRET = 'test-secret-key-that-is-long-enough';

    const config = parseConfig();

    expect(config.database.url).toBe('postgres://localhost:5432/test');
    expect(config.server.port).toBe(3000); // default
  });

  it('should fail on invalid configuration', () => {
    process.env.DATABASE_URL = 'not-a-url';

    expect(() => parseConfig()).toThrow('Configuration validation failed');
  });
});
```

## Environment Files

### Development (.env.development)

```bash
# 🚧 Pseudo-code: Development environment template
# Server
PORT=3000
HOST=localhost
CORS_ORIGINS=http://localhost:3000,http://localhost:3001

# Database
DATABASE_URL=postgres://dev:devpass@localhost:5432/myapp_dev
DB_MAX_CONNECTIONS=5
DB_SSL=false

# Redis
REDIS_URL=redis://localhost:6379/0
REDIS_KEY_PREFIX=dev:myapp:
REDIS_TTL=3600

# Auth
JWT_SECRET=dev-secret-key-for-local-development-only
JWT_EXPIRES_IN=7d
BCRYPT_ROUNDS=10

# Features
ENABLE_NEW_DASHBOARD=true
ENABLE_BETA_FEATURES=true
```

### Production (.env.production)

```bash
# 🚧 Pseudo-code: Production environment template
# Server
PORT=80
HOST=0.0.0.0
CORS_ORIGINS=https://app.example.com,https://www.example.com

# Database
DATABASE_URL=postgres://prod_user:${DB_PASSWORD}@db.example.com:5432/myapp_prod?ssl=true
DB_MAX_CONNECTIONS=20
DB_SSL=true

# Redis
REDIS_URL=redis://:${REDIS_PASSWORD}@redis.example.com:6379/0
REDIS_KEY_PREFIX=prod:myapp:
REDIS_TTL=86400

# Auth
JWT_SECRET=${JWT_SECRET_FROM_VAULT}
JWT_EXPIRES_IN=24h
BCRYPT_ROUNDS=12

# Features
ENABLE_NEW_DASHBOARD=false
ENABLE_BETA_FEATURES=false
```

## Advanced Configuration Patterns

### Runtime Configuration

Dynamic configuration loading from multiple sources:

```typescript
// ✂️ Production-ready: Multi-source configuration
interface ConfigSource {
  name: string;
  priority: number;
  load(): Promise<Record<string, unknown>>;
}

class FileSource implements ConfigSource {
  constructor(
    private filepath: string,
    public priority = 10,
    public name = 'file'
  ) {}

  async load() {
    const content = await fs.readFile(this.filepath, 'utf-8');
    return JSON.parse(content);
  }
}

class RemoteConfigSource implements ConfigSource {
  constructor(
    private url: string,
    public priority = 20,
    public name = 'remote'
  ) {}

  async load() {
    const response = await fetch(this.url);
    return response.json();
  }
}

class ConfigManager {
  private sources: ConfigSource[] = [];
  private cache = new Map<string, unknown>();

  addSource(source: ConfigSource) {
    this.sources.push(source);
    this.sources.sort((a, b) => b.priority - a.priority);
  }

  async load() {
    const configs = await Promise.all(
      this.sources.map(source => source.load())
    );

    // Merge in priority order
    const merged = configs.reduce(
      (acc, config) => ({
        ...acc,
        ...config,
      }),
      {}
    );

    return ConfigSchema.parse(merged);
  }
}
```

### Hot Reloading Configuration

Watch for configuration changes without restart:

```typescript
import { watch } from 'fs';
import { EventEmitter } from 'events';

class WatchableConfig extends EventEmitter {
  private config: Config;
  private watcher?: FSWatcher;

  constructor(private configPath: string) {
    super();
    this.config = this.loadSync();
  }

  start() {
    this.watcher = watch(this.configPath, async () => {
      try {
        const newConfig = await this.load();
        const changes = this.diffConfig(this.config, newConfig);

        if (changes.length > 0) {
          this.config = newConfig;
          this.emit('change', changes);
        }
      } catch (error) {
        this.emit('error', error);
      }
    });
  }

  private diffConfig(old: Config, new: Config): string[] {
    // Return list of changed keys
    const changes: string[] = [];
    for (const key in new) {
      if (old[key] !== new[key]) {
        changes.push(key);
      }
    }
    return changes;
  }
}

// Usage
const config = new WatchableConfig('./config.json');
config.on('change', (changes) => {
  console.log('Config changed:', changes);
  // Reload affected services
});
config.start();
```

### Secret Management

Secure handling of sensitive configuration:

```typescript
class SecretManager {
  private secrets = new Map<string, string>();

  async loadFromVault(vaultUrl: string, token: string) {
    const response = await fetch(vaultUrl, {
      headers: { 'X-Vault-Token': token },
    });

    const data = await response.json();

    // Store secrets securely
    for (const [key, value] of Object.entries(data)) {
      this.secrets.set(key, this.encrypt(value as string));
    }
  }

  get(key: string): string | undefined {
    const encrypted = this.secrets.get(key);
    return encrypted ? this.decrypt(encrypted) : undefined;
  }

  private encrypt(value: string): string {
    // ✂️ Production-ready: Modern crypto with proper IV handling
    const algorithm = 'aes-256-gcm';
    const key = Buffer.from(process.env.MASTER_KEY!, 'hex');
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, key, iv);

    let encrypted = cipher.update(value, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();
    // Return IV:authTag:encrypted for proper decryption
    return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
  }

  private decrypt(encrypted: string): string {
    const algorithm = 'aes-256-gcm';
    const key = Buffer.from(process.env.MASTER_KEY!, 'hex');

    // Parse IV:authTag:encrypted format
    const parts = encrypted.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encryptedData = parts[2];

    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }
}

// AWS Secrets Manager Integration
import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from '@aws-sdk/client-secrets-manager';

async function loadFromAWS(secretName: string) {
  const client = new SecretsManagerClient({ region: 'us-east-1' });

  try {
    const response = await client.send(
      new GetSecretValueCommand({ SecretId: secretName })
    );

    return JSON.parse(response.SecretString || '{}');
  } catch (error) {
    console.error('Failed to load secret:', error);
    throw error;
  }
}
```

### Testing Configuration

Mock configuration for tests:

```typescript
class MockConfigManager {
  private overrides: Partial<Config> = {};

  set(key: keyof Config, value: any) {
    this.overrides[key] = value;
  }

  reset() {
    this.overrides = {};
  }

  get(): Config {
    return {
      ...defaultTestConfig,
      ...this.overrides,
    };
  }
}

// Test helper
export function withConfig(overrides: Partial<Config>, fn: () => void) {
  const original = process.env;

  try {
    // Apply overrides to process.env
    for (const [key, value] of Object.entries(overrides)) {
      process.env[key] = String(value);
    }

    // Clear config cache
    clearConfigCache();

    // Run test
    fn();
  } finally {
    // Restore original env
    process.env = original;
    clearConfigCache();
  }
}

// Usage in tests
describe('Feature Flag', () => {
  it('should enable feature when flag is true', () => {
    withConfig({ ENABLE_NEW_FEATURE: 'true' }, () => {
      const feature = new Feature();
      expect(feature.isEnabled()).toBe(true);
    });
  });
});
```

## Best Practices

1. **Validate Early**: Parse configuration at application startup
2. **Fail Fast**: Crash on invalid configuration rather than using defaults
3. **Type Safety**: Use Zod schemas for runtime validation and TypeScript types
4. **Security**: Never log sensitive values, use secrets management
5. **Documentation**: Document all configuration options with examples
6. **Testing**: Test configuration parsing and validation
7. **Flexibility**: Support multiple configuration sources
8. **Monitoring**: Log configuration changes in production
