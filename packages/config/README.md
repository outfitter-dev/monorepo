# @outfitter/config

Universal configuration loader with multi-format support and type-safe Outfitter schema.

## Overview

`@outfitter/config` provides two complementary systems:

1. **Universal Loader**: A flexible, format-agnostic configuration loader with XDG directory support, scope precedence, and Zod validation
2. **Outfitter Schema**: Type-safe configuration schema, defaults, and helpers specifically for Outfitter tooling

The universal loader can be used standalone for any configuration needs, while the Outfitter schema provides opinionated defaults and validation for Outfitter-specific configuration.

## Features

- **Multi-format Support**: TOML, YAML, JSONC/JSON with automatic format detection
- **XDG Base Directory**: Follows XDG Base Directory specification for portable config resolution
- **Scope Precedence**: Project → User → Default with configurable search paths
- **Schema Validation**: Zod-based validation with detailed error diagnostics
- **Type Safety**: Full TypeScript support with strict types
- **Bun Native**: Leverages Bun's native parsers for optimal performance
- **Result Pattern**: Explicit error handling with @outfitter/contracts Result type
- **Outfitter Schema**: Pre-built schema for Outfitter configuration with feature flags, overrides, and project metadata

## Installation

```bash
bun add @outfitter/config
```

## Quick Start

### Universal Loader

```typescript
import { z } from "zod";
import { loadConfig } from "@outfitter/config/loader";

// Define your schema
const schema = z.object({
  name: z.string(),
  port: z.number().default(3000),
  debug: z.boolean().default(false),
});

// Load configuration
const result = await loadConfig({
  schema,
  name: "myapp",
  scope: "project",
});

if (result.ok) {
  console.log("Config loaded:", result.value);
} else {
  console.error("Failed to load config:", result.error.message);
  console.error("Issues:", result.error.issues);
}
```

### Outfitter Schema

```typescript
import { loadOutfitterConfig } from "@outfitter/config";

const result = await loadOutfitterConfig();

if (result.ok) {
  const config = result.value;
  console.log("TypeScript enabled:", config.features.typescript);
  console.log("Biome overrides:", config.overrides.biome);
}
```

## Universal Loader Usage

### Basic Configuration Loading

The universal loader searches for configuration files based on scope and format preferences:

```typescript
import { loadConfig } from "@outfitter/config/loader";
import { z } from "zod";

const schema = z.object({
  database: z.object({
    host: z.string(),
    port: z.number(),
  }),
  cache: z.boolean().default(true),
});

const result = await loadConfig({
  schema,
  name: "myapp",
  // Defaults to all scopes: project → user → default
  // Defaults to all formats: toml → jsonc → yaml
});
```

### Multi-Format Support

The loader automatically detects and parses different configuration formats:

```typescript
import { loadConfig } from "@outfitter/config/loader";

// Search for TOML first, then YAML
const result = await loadConfig({
  schema,
  name: "myapp",
  formats: ["toml", "yaml"],
});

// Or use specific format loaders directly
import { loadToml, loadYaml, loadJsonc } from "@outfitter/config/loaders";

const tomlResult = await loadToml("/path/to/config.toml");
const yamlResult = await loadYaml("/path/to/config.yaml");
const jsoncResult = await loadJsonc("/path/to/config.jsonc");
```

### XDG Directory Resolution

Configuration files are resolved following the XDG Base Directory specification:

```typescript
import { loadConfig } from "@outfitter/config/loader";

// Searches in order:
// 1. ./myapp.config.toml
// 2. ./.config/myapp/config.toml
// 3. ~/.config/myapp/config.toml
// 4. $XDG_CONFIG_HOME/myapp/config.toml
// 5. $XDG_CONFIG_DIRS/myapp/config.toml
// 6. /etc/myapp/config.toml

const result = await loadConfig({
  schema,
  name: "myapp",
});
```

### Scope Precedence

Control which scopes are searched:

```typescript
// Project scope only (current directory)
const projectResult = await loadConfig({
  schema,
  name: "myapp",
  scope: "project",
});

// User scope only (XDG_CONFIG_HOME)
const userResult = await loadConfig({
  schema,
  name: "myapp",
  scope: "user",
});

// System scope only (/etc)
const systemResult = await loadConfig({
  schema,
  name: "myapp",
  scope: "default",
});
```

### Explicit Paths

Bypass automatic resolution with explicit search paths:

```typescript
const result = await loadConfig({
  schema,
  searchPaths: [
    "/custom/path/config.toml",
    "/another/path/config.yaml",
  ],
});

// Or load from a single known path
import { loadConfigFrom } from "@outfitter/config/loader";

const result = await loadConfigFrom(
  "/path/to/config.toml",
  schema,
  { debug: false }, // Optional defaults
);
```

### Custom Working Directory

Specify a custom base directory for project scope:

```typescript
const result = await loadConfig({
  schema,
  name: "myapp",
  cwd: "/path/to/project",
});
```

### Schema Validation

The loader validates configuration against Zod schemas with detailed diagnostics:

```typescript
import { z } from "zod";
import { loadConfig } from "@outfitter/config/loader";

const schema = z.object({
  port: z.number().min(1).max(65535),
  host: z.string().min(1),
});

const result = await loadConfig({
  schema,
  name: "server",
});

if (!result.ok) {
  console.error("Validation failed:", result.error.message);

  // Detailed diagnostics
  for (const issue of result.error.issues ?? []) {
    console.error(`  ${issue.path}: ${issue.message}`);
  }
}
```

### Default Values

Merge user configuration with defaults:

```typescript
const result = await loadConfig({
  schema,
  name: "myapp",
  defaults: {
    port: 8080,
    debug: false,
    timeout: 30000,
  },
});
```

### Optional Configuration

Don't error if no configuration file is found:

```typescript
const result = await loadConfig({
  schema,
  name: "myapp",
  required: false, // Returns defaults or empty object
});
```

### Finding Configuration Files

Check for configuration files without loading them:

```typescript
import { findConfig, configExists } from "@outfitter/config/loader";

// Find first matching config file path
const path = await findConfig({
  name: "myapp",
  scope: "project",
});

if (path) {
  console.log("Config file found at:", path);
}

// Check if config exists
const exists = await configExists({
  name: "myapp",
  formats: ["toml"],
});

console.log("TOML config exists:", exists);
```

## Outfitter Schema Usage

### Loading Outfitter Configuration

Load Outfitter configuration with automatic defaults:

```typescript
import { loadOutfitterConfig } from "@outfitter/config";

// Searches for outfitter.config.{toml,jsonc,yaml}
const result = await loadOutfitterConfig();

if (result.ok) {
  const config = result.value;

  // All features have defaults
  console.log("TypeScript:", config.features.typescript); // true
  console.log("Markdown:", config.features.markdown); // true
  console.log("Styles:", config.features.styles); // false
}
```

### Loading from Specific Path

```typescript
import { loadOutfitterConfigFrom } from "@outfitter/config";

const result = await loadOutfitterConfigFrom(
  "/path/to/outfitter.config.toml",
);
```

### Feature Flags

Enable or disable specific Outfitter features:

```typescript
import type { OutfitterConfig } from "@outfitter/config";

const config: OutfitterConfig = {
  features: {
    typescript: true,   // Format TypeScript files
    markdown: true,     // Format Markdown files
    styles: false,      // Format CSS/SCSS files
    json: true,         // Format JSON files
    commits: true,      // Validate commit messages
    packages: false,    // Manage package.json
    testing: false,     // Configure test framework
    docs: false,        // Generate documentation
  },
  overrides: {},
  ignore: [],
  presets: [],
};
```

### Tool Overrides

Override specific tool configurations:

```typescript
const config = {
  features: {
    typescript: true,
  },
  overrides: {
    biome: {
      formatter: {
        indentStyle: "space",
        indentWidth: 2,
      },
      linter: {
        rules: {
          recommended: true,
        },
      },
    },
    prettier: {
      printWidth: 100,
      semi: true,
    },
    stylelint: {
      extends: ["stylelint-config-standard"],
    },
    markdownlint: {
      MD013: false,
    },
    lefthook: {
      "pre-commit": {
        commands: {
          lint: {
            run: "bun run lint",
          },
        },
      },
    },
  },
  ignore: [],
  presets: [],
};
```

### Project Metadata

Provide project context for tailored defaults:

```typescript
const config = {
  features: {
    typescript: true,
  },
  overrides: {},
  project: {
    type: "monorepo",              // "monorepo" | "library" | "application"
    framework: "react",            // "react" | "vue" | "svelte" | "next" | "astro"
    packageManager: "bun",         // "npm" | "yarn" | "pnpm" | "bun"
    rootDir: "/path/to/project",
  },
  ignore: [],
  presets: [],
};
```

### Configuration Extends

Extend from other configuration files or presets:

```typescript
const config = {
  extends: "@outfitter/preset-react",
  // Or multiple extends
  extends: [
    "@outfitter/preset-base",
    "@outfitter/preset-react",
  ],
  features: {
    typescript: true,
  },
  overrides: {},
  ignore: [],
  presets: [],
};
```

### Ignore Patterns

Define global ignore patterns:

```typescript
const config = {
  features: {
    typescript: true,
  },
  overrides: {},
  ignore: [
    "node_modules/**",
    "dist/**",
    "coverage/**",
    "*.generated.ts",
  ],
  presets: [],
};
```

### Synchronous API

For cases where async is not suitable, use the synchronous parsing API:

```typescript
import {
  parseOutfitterConfig,
  safeParseOutfitterConfig,
  mergeOutfitterConfig,
  DEFAULT_OUTFITTER_CONFIG,
} from "@outfitter/config";

// Parse with validation (throws on error)
const config = parseOutfitterConfig({
  features: {
    typescript: true,
  },
});

// Safe parse (returns Result)
const result = safeParseOutfitterConfig({
  features: {
    markdown: true,
  },
});

if (result.ok) {
  console.log("Config:", result.value);
} else {
  console.error("Validation failed:", result.error.message);
}

// Merge with defaults
const merged = mergeOutfitterConfig({
  features: {
    typescript: true,
  },
});

// Access defaults
console.log("Default config:", DEFAULT_OUTFITTER_CONFIG);
```

## API Reference

### Main Loader Functions

#### `loadConfig<T>(options: LoadConfigOptions<T>): Promise<Result<T, ValidationError>>`

Load and validate configuration from filesystem.

**Options:**
- `schema: z.ZodSchema<T>` - Zod schema to validate against
- `name?: string` - Configuration name (default: "config")
- `scope?: ConfigScope` - Scope to search ("project" | "user" | "default")
- `formats?: ConfigFormat[]` - Formats to search (default: ["toml", "jsonc", "yaml"])
- `searchPaths?: string[]` - Explicit paths to search
- `cwd?: string` - Base directory for project scope
- `required?: boolean` - Error if not found (default: true)
- `defaults?: Partial<T>` - Default values to merge

**Returns:** Result containing validated config or ValidationError

#### `loadConfigFrom<T>(path: string, schema: z.ZodSchema<T>, defaults?: Partial<T>): Promise<Result<T, ValidationError>>`

Load configuration from a specific file path.

**Parameters:**
- `path: string` - Absolute path to config file
- `schema: z.ZodSchema<T>` - Zod schema to validate against
- `defaults?: Partial<T>` - Optional default values

**Returns:** Result containing validated config or ValidationError

#### `findConfig(options): Promise<string | undefined>`

Find configuration file path without loading it.

**Options:**
- `name: string` - Configuration name
- `scope?: ConfigScope` - Scope to search
- `formats?: ConfigFormat[]` - Formats to search
- `searchPaths?: string[]` - Explicit paths
- `cwd?: string` - Base directory

**Returns:** Promise resolving to config path or undefined

#### `configExists(options): Promise<boolean>`

Check if configuration file exists.

**Options:** Same as `findConfig`

**Returns:** Promise resolving to true if config exists

### Format Loaders

Available from `@outfitter/config/loaders`:

#### `loadToml(path: string): Promise<Result<unknown, Error>>`

Load and parse TOML file using Bun's native parser.

#### `loadYaml(path: string): Promise<Result<unknown, Error>>`

Load and parse YAML file using Bun.YAML.

#### `loadJsonc(path: string): Promise<Result<unknown, Error>>`

Load and parse JSONC/JSON file with comment support.

### Path Resolvers

Available from `@outfitter/config/resolvers`:

#### `resolvePaths(options: ResolvePathsOptions): string[]`

Resolve configuration file paths based on scope and format preferences.

**Options:**
- `name: string` - Configuration name
- `formats?: ConfigFormat[]` - Formats to search
- `scope?: ConfigScope` - Scope to search
- `searchPaths?: string[]` - Explicit paths
- `cwd?: string` - Base directory

**Returns:** Array of absolute paths in precedence order

#### `findConfigPath(options: ResolvePathsOptions): Promise<string | undefined>`

Find first existing configuration file.

#### `getXdgConfigHome(): string`

Get XDG config home directory ($XDG_CONFIG_HOME or ~/.config).

#### `getXdgConfigDirs(): string[]`

Get all XDG config directories in precedence order.

#### `resolveXdgConfigPath(name: string, extension: string): string`

Resolve XDG config path for a named configuration.

### Schema Helpers

Available from `@outfitter/config/schema-helpers`:

#### `validateConfig<T>(schema: z.ZodSchema<T>, data: unknown, context?: string): Result<T, ValidationError>`

Validate data against a Zod schema with detailed diagnostics.

#### `safeParseConfig<T>(schema: z.ZodSchema<T>, data: unknown): Result<T, ValidationError>`

Alias for `validateConfig`.

#### `validatePartialConfig<T>(schema: z.ZodSchema<T>, data: unknown): Result<Partial<T>, ValidationError>`

Validate partial configuration, making all fields optional.

#### `mergeAndValidate<T>(schema: z.ZodSchema<T>, userConfig: unknown, defaults: Partial<T>): Result<T, ValidationError>`

Merge user config with defaults, then validate.

### Outfitter-Specific Functions

#### `loadOutfitterConfig(options?: { cwd?: string; required?: boolean }): Promise<OutfitterConfigParseResult>`

Load Outfitter configuration from filesystem with XDG resolution.

**Options:**
- `cwd?: string` - Base directory for project scope
- `required?: boolean` - Error if not found (default: false)

**Returns:** Result containing OutfitterConfig or ExtendedAppError

#### `loadOutfitterConfigFrom(path: string): Promise<OutfitterConfigParseResult>`

Load Outfitter configuration from specific path.

#### `parseOutfitterConfig(input: unknown): OutfitterConfig`

Parse and validate Outfitter configuration (throws on error).

#### `safeParseOutfitterConfig(input: unknown): OutfitterConfigParseResult`

Parse Outfitter configuration with Result pattern.

#### `mergeOutfitterConfig(input?: OutfitterConfigInput): OutfitterConfig`

Merge user input with default Outfitter configuration.

#### `createDefaultOutfitterConfig(): OutfitterConfig`

Create a mutable copy of the default Outfitter configuration.

### Constants

#### `DEFAULT_OUTFITTER_CONFIG: OutfitterConfig`

Frozen default Outfitter configuration with all feature flags set to their default values.

#### `OUTFITTER_JSON_SCHEMA`

JSON Schema representation for IDE IntelliSense support.

### Types

```typescript
// Universal loader types
type ConfigScope = "project" | "user" | "default";
type ConfigFormat = "toml" | "jsonc" | "yaml" | "yml" | "json";

interface LoadConfigOptions<T> {
  readonly schema: z.ZodSchema<T>;
  readonly scope?: ConfigScope;
  readonly formats?: readonly ConfigFormat[];
  readonly name?: string;
  readonly searchPaths?: readonly string[];
  readonly cwd?: string;
  readonly required?: boolean;
  readonly defaults?: Partial<T>;
}

interface ValidationError extends ExtendedAppError {
  readonly path?: string;
  readonly issues?: readonly ValidationIssue[];
}

interface ValidationIssue {
  readonly path: string;
  readonly message: string;
  readonly code: string;
}

// Outfitter types
type OutfitterFeatures = Readonly<{
  typescript: boolean;
  markdown: boolean;
  styles: boolean;
  json: boolean;
  commits: boolean;
  packages: boolean;
  testing: boolean;
  docs: boolean;
}>;

type OutfitterOverrides = Readonly<{
  biome?: Record<string, unknown>;
  prettier?: Record<string, unknown>;
  stylelint?: Record<string, unknown>;
  markdownlint?: Record<string, unknown>;
  lefthook?: Record<string, unknown>;
}>;

type OutfitterProject = Readonly<{
  type?: "monorepo" | "library" | "application";
  framework?: "react" | "vue" | "svelte" | "next" | "astro";
  packageManager?: "npm" | "yarn" | "pnpm" | "bun";
  rootDir?: string;
}>;

type OutfitterConfig = Readonly<{
  $schema?: string;
  features: OutfitterFeatures;
  overrides: OutfitterOverrides;
  project?: OutfitterProject;
  ignore: readonly string[];
  extends?: string | readonly string[];
  presets: readonly string[];
}>;

type OutfitterConfigParseResult = Result<OutfitterConfig, ExtendedAppError>;
```

## Sub-path Modules

The package exports functionality through sub-path modules for tree-shaking and modular imports:

### `@outfitter/config` (default)

Main entry point with Outfitter-specific configuration and re-exported universal loader APIs.

```typescript
import {
  // Outfitter configuration
  loadOutfitterConfig,
  loadOutfitterConfigFrom,
  parseOutfitterConfig,
  safeParseOutfitterConfig,
  mergeOutfitterConfig,
  DEFAULT_OUTFITTER_CONFIG,

  // Universal loader (re-exported)
  loadConfig,
  loadConfigFrom,
  findConfig,
  configExists,

  // Types
  type OutfitterConfig,
  type OutfitterFeatures,
  type OutfitterOverrides,
  type OutfitterProject,
} from "@outfitter/config";
```

### `@outfitter/config/loader`

Universal configuration loader.

```typescript
import {
  loadConfig,
  loadConfigFrom,
  findConfig,
  configExists,
  type LoadConfigOptions,
  type ConfigScope,
  type ConfigFormat,
} from "@outfitter/config/loader";
```

### `@outfitter/config/loaders`

Format-specific loaders.

```typescript
import {
  loadToml,
  loadYaml,
  loadJsonc,
} from "@outfitter/config/loaders";
```

### `@outfitter/config/resolvers`

Path resolution utilities.

```typescript
import {
  resolvePaths,
  findConfigPath,
  getXdgConfigHome,
  getXdgConfigDirs,
  resolveXdgConfigPath,
  type ResolvePathsOptions,
} from "@outfitter/config/resolvers";
```

### `@outfitter/config/schema-helpers`

Schema validation helpers.

```typescript
import {
  validateConfig,
  safeParseConfig,
  validatePartialConfig,
  mergeAndValidate,
  type ValidationError,
  type ValidationIssue,
} from "@outfitter/config/schema-helpers";
```

### `@outfitter/config/schema`

Outfitter Zod schemas.

```typescript
import {
  OutfitterConfigSchema,
  OutfitterFeaturesSchema,
  OutfitterOverridesSchema,
  OutfitterProjectSchema,
  OUTFITTER_JSON_SCHEMA,
} from "@outfitter/config/schema";
```

## File Resolution

### XDG Base Directory Specification

The loader follows the [XDG Base Directory Specification](https://specifications.freedesktop.org/basedir-spec/latest/) for portable configuration file resolution.

**Environment Variables:**
- `XDG_CONFIG_HOME`: Base directory for user config (default: `~/.config`)
- `XDG_CONFIG_DIRS`: Colon-separated list of system config directories (default: `/etc/xdg`)

### Search Paths and Precedence

When loading a configuration named "myapp", the loader searches in this order:

1. **Project Scope** (highest precedence)
   - `./myapp.config.toml`
   - `./myapp.config.jsonc`
   - `./myapp.config.yaml`
   - `./.config/myapp/config.toml`
   - `./.config/myapp/config.jsonc`
   - `./.config/myapp/config.yaml`

2. **User Scope**
   - `$XDG_CONFIG_HOME/myapp/config.toml` (usually `~/.config/myapp/config.toml`)
   - `$XDG_CONFIG_HOME/myapp/config.jsonc`
   - `$XDG_CONFIG_HOME/myapp/config.yaml`

3. **System Scope** (lowest precedence)
   - `/etc/myapp/config.toml`
   - `/etc/myapp/config.jsonc`
   - `/etc/myapp/config.yaml`

### Format Precedence

Within each scope, formats are checked in this order:

1. **TOML** (`.toml`) - Recommended for configuration
2. **JSONC** (`.jsonc`, `.json`) - JSON with comments
3. **YAML** (`.yaml`, `.yml`) - Alternative format

You can customize format precedence:

```typescript
const result = await loadConfig({
  schema,
  name: "myapp",
  formats: ["yaml", "toml"], // Check YAML first
});
```

## Best Practices

### When to Use Universal Loader vs Outfitter Schema

**Use the Universal Loader when:**
- Building tools that need flexible configuration
- Supporting multiple configuration formats
- Need custom validation logic
- Want fine-grained control over file resolution

**Use the Outfitter Schema when:**
- Configuring Outfitter tooling specifically
- Want opinionated defaults for common tools
- Need standard feature flags and overrides
- Building Outfitter plugins or extensions

### Schema Validation Patterns

**Define strict schemas:**

```typescript
const schema = z.object({
  name: z.string().min(1),
  port: z.number().int().min(1).max(65535),
  env: z.enum(["development", "production", "test"]),
}).strict(); // Reject unknown properties
```

**Provide sensible defaults:**

```typescript
const schema = z.object({
  port: z.number().default(3000),
  debug: z.boolean().default(false),
  timeout: z.number().default(30000),
});
```

**Use transformations:**

```typescript
const schema = z.object({
  port: z.string().transform(Number),
  enabled: z.union([z.boolean(), z.string()])
    .transform(v => v === true || v === "true"),
});
```

### Error Handling

**Always check Result types:**

```typescript
const result = await loadConfig({ schema, name: "myapp" });

if (!result.ok) {
  console.error("Failed to load config:", result.error.message);

  // Log detailed validation issues
  if (result.error.issues) {
    for (const issue of result.error.issues) {
      console.error(`  ${issue.path}: ${issue.message}`);
    }
  }

  process.exit(1);
}

// Safe to use result.value here
const config = result.value;
```

**Provide helpful error messages:**

```typescript
const result = await loadConfig({
  schema,
  name: "myapp",
  required: true,
});

if (!result.ok) {
  console.error("Configuration error:", result.error.message);
  console.error("\nSearched paths:");

  const paths = resolvePaths({ name: "myapp" });
  for (const path of paths) {
    console.error(`  - ${path}`);
  }

  console.error("\nCreate a config file in one of these locations.");
  process.exit(1);
}
```

**Handle optional configuration gracefully:**

```typescript
const result = await loadConfig({
  schema,
  name: "myapp",
  required: false,
  defaults: DEFAULT_CONFIG,
});

// result.ok will be true even if no file found
const config = result.ok ? result.value : DEFAULT_CONFIG;
```

## Examples

### TOML Configuration File

**outfitter.config.toml:**

```toml
# Outfitter configuration

[features]
typescript = true
markdown = true
styles = false
json = true
commits = true
packages = false
testing = false
docs = false

[overrides.biome.formatter]
indentStyle = "space"
indentWidth = 2
lineWidth = 100

[overrides.biome.linter]
enabled = true

[overrides.biome.linter.rules]
recommended = true

[project]
type = "monorepo"
framework = "react"
packageManager = "bun"
rootDir = "/path/to/project"

ignore = [
  "node_modules/**",
  "dist/**",
  "coverage/**",
]

presets = ["@outfitter/preset-base"]
```

### YAML Configuration File

**myapp.config.yaml:**

```yaml
# Application configuration

database:
  host: localhost
  port: 5432
  name: myapp_db
  pool:
    min: 2
    max: 10

server:
  port: 3000
  host: 0.0.0.0
  cors:
    enabled: true
    origins:
      - http://localhost:3000
      - https://app.example.com

cache:
  enabled: true
  ttl: 3600
  driver: redis
  redis:
    host: localhost
    port: 6379

logging:
  level: info
  format: json
  outputs:
    - console
    - file

features:
  auth: true
  payments: false
  analytics: true
```

### JSONC Configuration File

**.config/outfitter/config.jsonc:**

```jsonc
{
  // Outfitter configuration with comments
  "$schema": "https://outfitter.dev/schema.json",

  // Enable core features
  "features": {
    "typescript": true,
    "markdown": true,
    "styles": false,
    "json": true,
    "commits": true
  },

  // Tool-specific overrides
  "overrides": {
    "biome": {
      "formatter": {
        "indentStyle": "space",
        "indentWidth": 2
      }
    },
    "prettier": {
      "printWidth": 100,
      "semi": true,
      "singleQuote": false
    }
  },

  // Project metadata
  "project": {
    "type": "library",
    "packageManager": "bun"
  },

  // Ignore patterns
  "ignore": [
    "node_modules/**",
    "dist/**",
    "*.generated.ts"
  ]
}
```

### Custom Application Schema

**Building your own configuration system:**

```typescript
import { z } from "zod";
import { loadConfig } from "@outfitter/config/loader";

// Define your application's schema
const AppConfigSchema = z.object({
  app: z.object({
    name: z.string(),
    version: z.string(),
    env: z.enum(["development", "staging", "production"]),
  }),

  server: z.object({
    port: z.number().int().min(1).max(65535).default(3000),
    host: z.string().default("localhost"),
    cors: z.boolean().default(false),
  }),

  database: z.object({
    url: z.string().url(),
    pool: z.object({
      min: z.number().int().min(0).default(2),
      max: z.number().int().min(1).default(10),
    }).optional(),
  }),

  logging: z.object({
    level: z.enum(["debug", "info", "warn", "error"]).default("info"),
    format: z.enum(["json", "text"]).default("json"),
  }),

  features: z.record(z.boolean()).default({}),
});

type AppConfig = z.infer<typeof AppConfigSchema>;

// Load configuration with defaults
const defaults: Partial<AppConfig> = {
  server: {
    port: 3000,
    host: "0.0.0.0",
    cors: true,
  },
  logging: {
    level: "info",
    format: "json",
  },
};

const result = await loadConfig({
  schema: AppConfigSchema,
  name: "myapp",
  defaults,
});

if (!result.ok) {
  console.error("Configuration error:", result.error.message);
  process.exit(1);
}

const config = result.value;

// Type-safe configuration access
console.log(`Starting ${config.app.name} v${config.app.version}`);
console.log(`Server: ${config.server.host}:${config.server.port}`);
console.log(`Database: ${config.database.url}`);
```

## TypeScript Support

The package is written in TypeScript with strict type checking and provides full type safety:

**Type Inference:**

```typescript
import { z } from "zod";
import { loadConfig } from "@outfitter/config/loader";

const schema = z.object({
  name: z.string(),
  port: z.number(),
});

const result = await loadConfig({ schema, name: "app" });

if (result.ok) {
  // TypeScript knows the shape of result.value
  const name: string = result.value.name;
  const port: number = result.value.port;
}
```

**Strict Types:**

```typescript
import type {
  OutfitterConfig,
  OutfitterFeatures,
  LoadConfigOptions,
  ValidationError,
} from "@outfitter/config";

// All types are readonly by default for immutability
const features: OutfitterFeatures = {
  typescript: true,
  markdown: true,
  styles: false,
  json: true,
  commits: true,
  packages: false,
  testing: false,
  docs: false,
};

// features.typescript = false; // Error: Cannot assign to readonly property
```

**Generic Type Support:**

```typescript
import { loadConfig } from "@outfitter/config/loader";
import { z } from "zod";

function createConfigLoader<T extends z.ZodSchema>(schema: T) {
  return async (name: string) => {
    return loadConfig({
      schema,
      name,
      required: false,
    });
  };
}

const schema = z.object({ port: z.number() });
const loader = createConfigLoader(schema);

const result = await loader("myapp");
// result has type: Result<{ port: number }, ValidationError>
```

## Dependencies

This package leverages Bun's native APIs for optimal performance:

- **Bun.file**: File system operations
- **Bun.YAML**: Native YAML parsing
- **Dynamic import for TOML**: Bun's native TOML support
- **strip-json-comments**: JSON with comments support
- **zod**: Schema validation
- **@outfitter/contracts**: Result pattern and error handling

**Peer Dependencies:**
- `@outfitter/contracts@1.0.0`: Error handling and Result type

**Runtime:**
- Requires Bun 1.3.0 or higher

## License

MIT © Outfitter
