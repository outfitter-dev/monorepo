# Ultracite-Outfitter Documentation Harmonization Notes

This document outlines the harmonization efforts between Ultracite standards and Outfitter project conventions.

## Overview

The Outfitter fieldguides documentation has been updated to reflect current tooling choices and best practices, moving from Ultracite-specific references to Biome-based linting and formatting.

## Key Changes

### 1. Linting Tool Migration

**From:** Ultracite references **To:** Biome references

The project now uses Biome for linting and formatting instead of Ultracite. All documentation has been updated to reflect this change.

### 2. Array Type Syntax Standardization

**Convention:** Prefer `Array<T>` syntax exclusively

All examples throughout the documentation now consistently use `Array<T>` instead of `T[]` for better readability and consistency with complex generic types.

Examples:

```typescript
// ✅ Preferred
const users: Array<User> = [];
const matrix: Array<Array<number>> = [
  [1, 2],
  [3, 4],
];

// ❌ Avoid
const users: User[] = [];
const matrix: number[][] = [
  [1, 2],
  [3, 4],
];
```

### 3. Logging Standards Enhancement

**Link:** [Logging Standards](../standards/logging-standards.md)

Enhanced logging guidance includes:

- **Biome CLI integration** in linting examples
- **Structured error logging** with `logger.error({ error })` pattern
- **Expanded sensitive data guidance** covering:
  - Authentication tokens and API keys
  - Session IDs and JWTs
  - Personally Identifiable Information (PII)
  - Financial and payment data
  - Business-sensitive information

Example of structured error logging:

```typescript
// ✅ Preferred: Structured logging
logger.error('Operation failed', {
  operation: 'fetchUser',
  userId: '123',
  error: error.message,
  timestamp: new Date().toISOString(),
});

// ❌ Avoid: Unstructured logging
console.error('Error:', error);
```

### 4. React Component Standards Updates

**SSR-Safe Patterns:**

- Updated `useEventListener` hook to avoid default window parameter
- Added SSR safety guards with `typeof window !== 'undefined'` checks
- Enhanced `createLazyComponent` to reset promise on loader rejection for retry capability

### 5. TypeScript Error Handling Improvements

**Logger Integration:**

- Added logger import notes in all code snippets
- Replaced non-null assertions with sensible default errors
- Clarified NoInfer utility type as built-in TypeScript 5.4+ feature

Example:

```typescript
import { logger } from '@/lib/logger'; // Import logger instance

// Avoid non-null assertions, use sensible defaults
let lastError: Error = new Error('No attempts made'); // Sensible default
// Instead of: return failure(lastError!);
return failure(lastError);
```

## Migration Checklist

When updating projects to follow these harmonized standards:

- [ ] Replace Ultracite references with Biome
- [ ] Update array type syntax to `Array<T>` consistently
- [ ] Implement structured logging with logger imports
- [ ] Add SSR safety guards to React hooks
- [ ] Remove non-null assertions in favor of sensible defaults
- [ ] Expand sensitive data protection in logging

## Tooling Integration

### Biome Configuration

Projects should use Biome for consistent formatting and linting:

```bash
# Format code
bunx @biomejs/biome format --write .

# Lint code
bunx @biomejs/biome lint .

# Check both formatting and linting
bunx @biomejs/biome check .
```

### Structured Logging Setup

All projects should implement structured logging:

```typescript
// src/lib/logger.ts
import { Logger } from 'tslog';

export const logger = new Logger({
  name: 'MyApp',
  minLevel: process.env.NODE_ENV === 'production' ? 3 : 0,
  type: process.env.NODE_ENV === 'production' ? 'json' : 'pretty',
});
```

## Benefits

1. **Consistency:** Unified approach across all Outfitter projects
2. **Type Safety:** Enhanced with `Array<T>` syntax and proper error handling
3. **Observability:** Structured logging improves debugging and monitoring
4. **Security:** Comprehensive sensitive data protection guidelines
5. **Maintainability:** SSR-safe patterns and retry mechanisms improve reliability

## Related Documentation

- [Logging Standards](../standards/logging-standards.md) - Complete logging implementation guide
- [TypeScript Standards](../standards/typescript-standards.md) - Type safety best practices
- [React Component Standards](../standards/react-component-standards.md) - Modern React patterns
- [TypeScript Error Handling](../patterns/typescript-error-handling.md) - Robust error management
