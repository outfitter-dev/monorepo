# Ultracite and Outfitter Harmonization Guide

This document outlines the minimal adjustments needed to adopt Ultracite's linting rules in Outfitter projects. Most patterns already align - only a few minor changes are required.

## Overview

Ultracite provides granular, enforceable linting rules through Biome, while Outfitter fieldguides offer architectural patterns and best practices. Most rules align naturally, but some require configuration or code adjustments.

## Configuration Adjustments

### 1. Array Type Syntax

**Conflict**: Ultracite requires consistency (either `T[]` or `Array<T>`), while Outfitter historically preferred `Array<T>`.

**Solution**: Adopt Ultracite's approach - use either syntax consistently within your codebase. No Biome configuration needed.

```typescript
// ✅ Good: Consistent usage (pick one style for your project)
// Option 1: Square bracket syntax
const numbers: number[] = [1, 2, 3];
const users: User[] = [];
const matrix: number[][] = [
  [1, 2],
  [3, 4],
];

// Option 2: Generic syntax
const numbers: Array<number> = [1, 2, 3];
const users: Array<User> = [];
const matrix: Array<Array<number>> = [
  [1, 2],
  [3, 4],
];

// ❌ Bad: Mixed styles in the same codebase
const numbers: number[] = [1, 2, 3];
const users: Array<User> = []; // Inconsistent!
```

**Recommendation**: Let Ultracite enforce consistency automatically. Pick a style at the project level and stick with it.

### 2. Console Usage

**Conflict**: Ultracite prohibits all console usage, while Outfitter examples use console for error logging.

**Why Ultracite discourages console**:

- **Production hygiene**: Console statements can expose sensitive data and clutter end-user browsers
- **Performance impact**: Logging large objects can affect performance
- **Better alternatives exist**: Production apps should use proper logging infrastructure with log levels, structured logging, and aggregation
- **Enforces debugging discipline**: Encourages use of debuggers, tests, and proper error handling over console.log debugging

**Solution**: Use a proper logging library that satisfies both Ultracite and Outfitter patterns:

```typescript
// ❌ Bad: Direct console usage
console.log('User data:', userData);

// ✅ Good: Use a logger with proper context
logger.debug('User data processed', { userId: userData.id });
```

**Recommended approach**: Use [tslog](https://github.com/fullstack-build/tslog) - a TypeScript-first logger with zero dependencies:

```typescript
// src/lib/logger.ts
import { Logger } from 'tslog';

export const logger = new Logger({
  name: 'MyApp',
  minLevel: process.env.NODE_ENV === 'production' ? 3 : 0, // 3=info, 0=silly
  type: process.env.NODE_ENV === 'production' ? 'json' : 'pretty',
});

// Usage with Outfitter's Result pattern
import { Result, success, failure } from '@outfitter/contracts';

export async function fetchUserData(
  id: string,
): Promise<Result<User, AppError>> {
  logger.debug('Fetching user', { userId: id });

  try {
    const data = await api.getUser(id);
    logger.info('User fetched successfully', { userId: id });
    return success(data);
  } catch (error) {
    logger.error('Failed to fetch user', { userId: id, error: error.message });
    return failure(createApiError(error));
  }
}
```

**Alternative logging libraries**:

- [pino](https://github.com/pinojs/pino) - Extremely fast JSON logger, ideal for high-performance production apps
- [winston](https://github.com/winstonjs/winston) - Most mature with extensive transport options (files, databases, cloud)
- [consola](https://github.com/unjs/consola) - Universal logger that works in Node.js, browsers, and Edge Workers
- [debug](https://github.com/debug-js/debug) - Lightweight namespace-based debugging utility for development

_Note: Consider creating a `standards/logging-standards.md` for comprehensive logging guidance._

## Code Pattern Adjustments

### 3. TypeScript Enums

**No conflict**: Both Ultracite and Outfitter avoid TypeScript enums. Continue using const objects or union types:

```typescript
// ❌ Avoid: TypeScript enum
enum Role {
  Admin = 'admin',
  User = 'user',
  Guest = 'guest',
}

// ✅ Preferred: Const object pattern
export const Role = {
  Admin: 'admin',
  User: 'user',
  Guest: 'guest',
} as const;

export type Role = (typeof Role)[keyof typeof Role];

// ✅ Alternative: Union type
export type Role = 'admin' | 'user' | 'guest';

import { z } from 'zod';
// With Zod (Outfitter's validation library)
const roleSchema = z.enum(['admin', 'user', 'guest']); // This is fine - it's not a TS enum
type Role = z.infer<typeof roleSchema>;
```

### 4. Non-null Assertions

**Conflict**: Ultracite prohibits `!` postfix operator. Found one instance in react-component-standards.md.

**Solution**: Always use type guards or optional chaining instead:

```typescript
// ❌ Avoid: Non-null assertion
const parent = element.parentElement!;
parent.classList.add('active');

// ✅ Preferred: Type guard
const parent = element.parentElement;
if (parent) {
  parent.classList.add('active');
}

// ✅ Alternative: Optional chaining for methods
element.parentElement?.classList.add('active');

// ✅ For the EventEmitter example in react-component-standards.md
// Instead of: this.handlers.get(event)!.add(handler)
const handlers = this.handlers.get(event);
if (handlers) {
  handlers.add(handler);
}

// ✅ For tests where value is guaranteed
describe('Component', () => {
  it('renders correctly', () => {
    render(<Component />);
    const element = screen.getByRole('button');

    // Instead of: element.parentElement!
    expect(element.parentElement).toBeDefined();
    const parent = element.parentElement as HTMLElement; // Type assertion in tests is acceptable
    expect(parent.className).toBe('container');
  });
});
```

### 5. Error Handling Patterns

**Synergy**: Ultracite requires try-catch blocks while Outfitter prefers Result types. These approaches complement each other perfectly!

**Solution**: Combine both for robust, type-safe error handling that's better than either approach alone:

```typescript
// ✨ This pattern combines the best of both worlds:
// - Ultracite: Comprehensive error catching and logging
// - Outfitter: Type-safe Result returns
// - Together: Robust error handling with full observability

import { Result, success, failure } from '@outfitter/contracts';
import { logger } from '@/lib/logger';

export async function fetchUserData(
  id: string,
): Promise<Result<User, AppError>> {
  try {
    const response = await fetch(`/api/users/${id}`);

    if (!response.ok) {
      const error = createApiError(response.status, 'User fetch failed');
      logger.error('API error:', error); // ← Ultracite: always log errors
      return failure(error); // ← Outfitter: typed Result
    }

    const data = await response.json();
    return success(data);
  } catch (error) {
    // This satisfies both systems:
    logger.error('Network error:', error); // ← Ultracite: error visibility

    return failure(
      // ← Outfitter: type safety
      createNetworkError(
        error instanceof Error ? error.message : 'Unknown error',
      ),
    );
  }
}
```

**Benefits of this combined approach**:

- **Full observability**: All errors are logged for debugging (Ultracite)
- **Type safety**: Callers get typed errors they can handle (Outfitter)
- **No silent failures**: Every error path is explicit
- **Better than try-catch alone**: Typed returns prevent uncaught errors
- **Better than Result alone**: Logging provides operational visibility

### 6. Early Returns with Else Blocks

**No conflict**: Both Ultracite and Outfitter avoid else blocks after early returns. Continue this pattern:

```typescript
// ❌ Avoid: Else after return
function processData(data: unknown) {
  if (!data) {
    return null;
  } else {
    return transformData(data);
  }
}

// ✅ Preferred: No else needed
function processData(data: unknown) {
  if (!data) {
    return null;
  }
  return transformData(data);
}

// ✅ For complex logic, use early returns consistently
function validateUser(user: User): Result<User, ValidationError> {
  if (!user.email) {
    return failure(createValidationError('Email required'));
  }

  if (!isValidEmail(user.email)) {
    return failure(createValidationError('Invalid email format'));
  }

  if (!user.name || user.name.length < 2) {
    return failure(createValidationError('Name must be at least 2 characters'));
  }

  return success(user);
}
```

## Testing Adjustments

### 7. Test File Exports

**No conflict**: Both Ultracite and Outfitter keep test utilities separate from test files. Continue this pattern:

```typescript
// ❌ Avoid: Exporting from test files
// Button.test.tsx
export const renderButton = (props = {}) => {
  return render(<Button {...props} />);
};

// ✅ Preferred: Separate test utilities
// test/utils/render.tsx
export const renderButton = (props = {}) => {
  return render(<Button {...props} />);
};

// Button.test.tsx
import { renderButton } from '@/test/utils/render';
```

## Project Setup Recommendations

### 1. Biome Configuration

Create a `biome.json` that aligns with Outfitter standards:

```json
{
  "$schema": "https://biomejs.dev/schemas/2.2.0/schema.json",
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true
    }
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "single",
      "trailingCommas": "es5"
    }
  },
  "files": {
    "ignoreUnknown": true,
    "includes": ["**/*", "!dist/**", "!coverage/**", "!node_modules/**"]
  },
  "vcs": {
    "useIgnoreFile": true
  }
}
```

### 2. Package.json Scripts

Add scripts that run both Ultracite and other tools:

```json
{
  "scripts": {
    "lint": "biome check --write=false . && tsc --noEmit",
    "lint:fix": "biome format .",
    "test": "vitest",
    "test:coverage": "vitest --coverage",
    "check:all": "pnpm lint && pnpm test:coverage"
  }
}
```

### 3. Pre-commit Hooks

Use Husky to run both Ultracite and tests:

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Run Ultracite format on staged files
npx ultracite format --staged

# Run type checking
npx tsc --noEmit

# Run tests for changed files
npx vitest related --run
```

## Migration Checklist

When adopting both Ultracite and Outfitter standards:

- [ ] Install and configure Ultracite with the recommended `biome.json`
- [ ] Replace TypeScript enums with const objects or union types
- [ ] Create a logger utility to replace direct console usage
- [ ] Refactor non-null assertions to use type guards
- [ ] Move test utilities out of test files
- [ ] Update error handling to use Result types with proper logging
- [ ] Remove unnecessary else blocks after early returns
- [ ] Ensure consistent array type syntax throughout the codebase (either `T[]` or `Array<T>`)
- [ ] Set up pre-commit hooks to run both tools
- [ ] Update CI/CD pipelines to include Ultracite checks

## Benefits of Harmonization

By making these adjustments, you get:

1. **Automated enforcement** of Outfitter's architectural patterns through Ultracite's rules
2. **Consistent code style** across the entire codebase
3. **Better type safety** by combining both approaches
4. **Improved accessibility** through Ultracite's comprehensive a11y rules
5. **Faster development** with automated formatting and fixing
6. **AI-friendly code** that follows consistent patterns

## Conclusion

The adjustments needed are minor and mostly involve:

- Configuration changes to align rule preferences
- Using alternative patterns that satisfy both systems
- Creating small utilities to bridge different approaches

Both Ultracite and Outfitter share the same goals of type safety, code quality, and developer productivity. With these adjustments, they work together to provide both automated enforcement and architectural guidance.
