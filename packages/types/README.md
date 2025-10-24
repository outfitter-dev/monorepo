# @outfitter/types

Comprehensive TypeScript utility types combining type-fest with domain-specific type helpers.

## Overview

`@outfitter/types` provides a curated collection of TypeScript utility types, including all of type-fest's utilities plus additional domain-specific types for configuration management, optional value handling, and advanced type transformations.

## Features

- **Type-Fest Integration**: Re-exports all type-fest utilities for convenience
- **Config Types**: Type-safe configuration with layering and validation
- **Maybe Utilities**: Functional helpers for handling nullable and optional values
- **Advanced Types**: Deep object navigation, route params extraction, discriminated unions
- **Zero Runtime Cost**: All utilities are type-level only

## Installation

```bash
bun add @outfitter/types
```

## Quick Start

```typescript
import type { Maybe, ConfigWithMetadata, DeepKeys } from "@outfitter/types";
import { isDefined, mapMaybe } from "@outfitter/types";

// Handle optional values functionally
const name: Maybe<string> = getUserName();

if (isDefined(name)) {
  console.log(name.toUpperCase()); // TypeScript knows name is string
}

// Transform maybe values
const upperName = mapMaybe(name, (n) => n.toUpperCase());

// Type-safe configuration
const config: ConfigWithMetadata<AppConfig> = {
  value: { apiKey: "secret" },
  scope: "user",
  format: "json",
  path: "/config/app.json",
};

// Deep object navigation
type User = {
  profile: {
    settings: {
      theme: string;
    };
  };
};
type ThemeKey = DeepKeys<User>; // "profile" | "profile.settings" | "profile.settings.theme"
```

## Core Modules

### Type-Fest Re-exports

All type-fest utilities are available directly:

```typescript
import type {
  Simplify,
  PartialDeep,
  RequireAtLeastOne,
  LiteralUnion,
  Promisable
} from "@outfitter/types";

type User = {
  id: string;
  name: string;
  email: string;
  profile: {
    bio: string;
    avatar: string;
  };
};

// Simplify flattens complex intersection types
type SimplifiedUser = Simplify<User & { age: number }>;

// PartialDeep makes all nested properties optional
type PartialUser = PartialDeep<User>;

// RequireAtLeastOne requires at least one property
type UserUpdate = RequireAtLeastOne<User, "name" | "email">;
```

See [type-fest documentation](https://github.com/sindresorhus/type-fest) for all available utilities.

### Configuration Types

Type-safe configuration management with scoping and validation:

```typescript
import type {
  ConfigScope,
  ConfigFormat,
  ConfigWithMetadata,
  LayeredConfig,
  ConfigValidation
} from "@outfitter/types";

// Configuration scopes
type Scope = ConfigScope; // "user" | "workspace" | "project"

// Configuration with metadata
const userConfig: ConfigWithMetadata<{ theme: string }> = {
  value: { theme: "dark" },
  scope: "user",
  format: "json",
  path: "/Users/me/.config/app.json",
};

// Layered configuration (user < workspace < project)
const layered: LayeredConfig<AppConfig> = {
  user: { theme: "dark" },
  workspace: { theme: "light" },
  project: { theme: "auto" },
};

// Configuration validation result
type Validation = ConfigValidation<AppConfig>;
// { valid: true; value: AppConfig } | { valid: false; errors: readonly string[] }
```

### Maybe Utilities

Functional helpers for handling nullable and optional values:

```typescript
import type { Nullable, Optional, Maybe } from "@outfitter/types";
import {
  isDefined,
  isNull,
  isUndefined,
  isNullish,
  getOrElse,
  getOrElseLazy,
  mapMaybe,
  chainMaybe,
  filterMaybe,
  undefinedToNull,
  nullToUndefined
} from "@outfitter/types";

// Type definitions
type Name = Nullable<string>; // string | null
type Age = Optional<number>;  // number | undefined
type Email = Maybe<string>;   // string | null | undefined

// Type guards with narrowing
const name: Maybe<string> = getName();
if (isDefined(name)) {
  // TypeScript knows name is string here
  console.log(name.toUpperCase());
}

// Get value or default
const displayName = getOrElse(name, "Anonymous");
const lazyName = getOrElseLazy(name, () => computeDefault());

// Map over maybe values (preserves null/undefined)
const upper = mapMaybe(name, (n) => n.toUpperCase());

// Chain operations
const validated = chainMaybe(name, (n) =>
  n.length > 0 ? n : undefined
);

// Filter with predicate
const nonEmpty = filterMaybe(name, (n) => n.length > 0);

// Convert between null and undefined
const asNull = undefinedToNull(value);     // undefined -> null
const asUndefined = nullToUndefined(value); // null -> undefined
```

### Advanced Type Utilities

Deep object navigation, route params, discriminated unions:

```typescript
import type {
  DeepKeys,
  DeepGet,
  ExtractRouteParams,
  EnvVarPattern,
  Interpolate,
  DiscriminatedUnion,
  DiscriminatorValues,
  Switch
} from "@outfitter/types";

// Deep object key paths
type User = {
  profile: {
    settings: {
      theme: string;
    };
  };
};
type Keys = DeepKeys<User>;
// "profile" | "profile.settings" | "profile.settings.theme"

// Get type at deep path
type Theme = DeepGet<User, "profile.settings.theme">; // string

// Extract route parameters
type Params = ExtractRouteParams<"/users/:userId/posts/:postId">;
// "userId" | "postId"

// Environment variable naming
type EnvVar = EnvVarPattern<"api_key">; // "API_KEY"

// String interpolation
type Message = Interpolate<"Hello {name}", { name: "World" }>;
// "Hello World"

// Discriminated union utilities
type Action =
  | { type: "add"; value: number }
  | { type: "remove"; id: string };

type ActionType = DiscriminatorValues<Action, "type">;
// "add" | "remove"

type ActionUnion = DiscriminatedUnion<Action, "type">;
// Same as Action but with explicit discriminator constraint

type Result = Switch<Action, "type", { add: string; remove: number }>;
// string | number
```

## Module Organization

The package exports types and utilities through both named and namespace exports:

```typescript
// Named exports
import type { Maybe, ConfigScope } from "@outfitter/types";
import { isDefined, mapMaybe } from "@outfitter/types";

// Namespace exports for organization
import { Maybe, Config, Advanced } from "@outfitter/types";

type Value = Maybe.Maybe<string>;
const defined = Maybe.isDefined(value);

type Scope = Config.ConfigScope;
type Keys = Advanced.DeepKeys<User>;
```

## TypeScript Configuration

This package requires TypeScript 5.7+ with strict mode:

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

## Design Principles

1. **Type-Level Only**: Zero runtime overhead for all utilities
2. **Functional Composition**: Maybe helpers enable functional patterns
3. **Type Safety**: Proper type narrowing with type guards
4. **Discoverability**: Namespace exports for organized access
5. **Compatibility**: Works seamlessly with type-fest

## Use Cases

### Configuration Management

```typescript
import type { LayeredConfig, ConfigValidation } from "@outfitter/types";

function mergeConfig<T>(layers: LayeredConfig<T>): T {
  return {
    ...layers.user,
    ...layers.workspace,
    ...layers.project,
  };
}

function validateConfig<T>(
  schema: (value: unknown) => value is T,
  value: unknown
): ConfigValidation<T> {
  if (schema(value)) {
    return { valid: true, value };
  }
  return { valid: false, errors: ["Invalid configuration"] };
}
```

### Optional Value Handling

```typescript
import { isDefined, mapMaybe, chainMaybe } from "@outfitter/types";

function getUserEmail(userId: string): Maybe<string> {
  const user = findUser(userId);

  return chainMaybe(
    mapMaybe(user, (u) => u.email),
    (email) => email.includes("@") ? email : undefined
  );
}
```

### Deep Object Access

```typescript
import type { DeepKeys, DeepGet } from "@outfitter/types";

function getDeepValue<T extends object, K extends DeepKeys<T>>(
  obj: T,
  path: K
): DeepGet<T, K> | undefined {
  const keys = path.split(".");
  let current: any = obj;

  for (const key of keys) {
    if (current === null || current === undefined) {
      return undefined;
    }
    current = current[key];
  }

  return current;
}
```

## Related Packages

- `@outfitter/contracts` - Type-safe error handling and assertions
- `type-fest` - Base utility type collection

## License

MIT

## Contributing

See the [monorepo root](../../README.md) for contribution guidelines.
