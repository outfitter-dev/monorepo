---
slug: framework-agnostic-testing
title: Write tests that work across Jest and Vitest
description: Patterns for portable tests across testing frameworks.
type: pattern
---

# Framework-Agnostic Testing

Patterns for writing tests that work seamlessly across Jest and Vitest, enabling easy migration and framework flexibility.

## Related Documentation

- [Testing Standards](../standards/testing-standards.md) - Core testing principles
- [Testing Unit](./testing-unit.md) - Unit testing patterns
- [Testing Integration](./testing-integration.md) - Integration patterns
- [Testing React Components](./testing-react-components.md) - Component testing

## Shared Test Utilities

### Framework Detection

```typescript
// test-utils/framework.ts
export const testFramework = {
  isJest: typeof jest !== 'undefined',
  isVitest: typeof vi !== 'undefined',
  name: typeof jest !== 'undefined' ? 'jest' : 'vitest',
};

// Export unified mock interface
export const mocks = testFramework.isJest ? jest : vi;
```

### Unified Test Helpers

```typescript
// test-utils/helpers.ts
import { mocks, testFramework } from './framework';

export function createMockFn<T extends (...args: any[]) => any>():
  | jest.Mock<T>
  | T {
  return mocks.fn() as any;
}

export function clearAllMocks() {
  mocks.clearAllMocks();
}

export function resetAllMocks() {
  mocks.resetAllMocks();
}

// Unified spy interface
export function spyOn(object: any, method: string) {
  return mocks.spyOn(object, method);
}
```

## Mock Abstraction Patterns

### Module Mocking

```typescript
// test-utils/mock-module.ts
export function mockModule(modulePath: string, factory?: () => any) {
  if (testFramework.isJest) {
    jest.mock(modulePath, factory);
  } else {
    vi.mock(modulePath, factory);
  }
}

export function unmockModule(modulePath: string) {
  if (testFramework.isJest) {
    jest.unmock(modulePath);
  } else {
    vi.unmock(modulePath);
  }
}

// Usage in tests
import { mockModule, createMockFn } from '@/test-utils';

mockModule('@/lib/api', () => ({
  fetchUser: createMockFn().mockResolvedValue({ id: 1, name: 'Test' }),
}));
```

### Mock Implementation Patterns

```typescript
// test-utils/mock-implementations.ts
export function mockImplementation<T extends (...args: any[]) => any>(
  fn: T,
  implementation: T
) {
  if ('mockImplementation' in fn) {
    (fn as any).mockImplementation(implementation);
  }
}

export function mockResolvedValue<T>(fn: any, value: T) {
  if ('mockResolvedValue' in fn) {
    fn.mockResolvedValue(value);
  }
}

export function mockRejectedValue(fn: any, error: any) {
  if ('mockRejectedValue' in fn) {
    fn.mockRejectedValue(error);
  }
}
```

## Timer Handling

### Unified Timer Control

```typescript
// test-utils/timers.ts
export const timers = {
  useFakeTimers() {
    if (testFramework.isJest) {
      jest.useFakeTimers();
    } else {
      vi.useFakeTimers();
    }
  },

  useRealTimers() {
    if (testFramework.isJest) {
      jest.useRealTimers();
    } else {
      vi.useRealTimers();
    }
  },

  runAllTimers() {
    if (testFramework.isJest) {
      jest.runAllTimers();
    } else {
      vi.runAllTimers();
    }
  },

  advanceTimersByTime(ms: number) {
    if (testFramework.isJest) {
      jest.advanceTimersByTime(ms);
    } else {
      vi.advanceTimersByTime(ms);
    }
  },
};

// Usage
import { timers } from '@/test-utils';

describe('Timer-based feature', () => {
  beforeEach(() => {
    timers.useFakeTimers();
  });

  afterEach(() => {
    timers.useRealTimers();
  });

  it('should handle delayed operations', () => {
    const callback = createMockFn();
    setTimeout(callback, 1000);

    timers.advanceTimersByTime(1000);
    expect(callback).toHaveBeenCalled();
  });
});
```

## Module Mocking Strategies

### Dynamic Imports

```typescript
// test-utils/dynamic-mocks.ts
export async function mockDynamicImport(path: string, mockImplementation: any) {
  if (testFramework.isJest) {
    jest.doMock(path, () => mockImplementation);
  } else {
    vi.doMock(path, () => mockImplementation);
  }
}

// Test example
import { mockDynamicImport } from '@/test-utils';

it('should handle dynamic imports', async () => {
  await mockDynamicImport('./heavy-module', {
    default: { processData: () => 'mocked result' },
  });

  const module = await import('./heavy-module');
  expect(module.default.processData()).toBe('mocked result');
});
```

### Partial Mocks

```typescript
// test-utils/partial-mocks.ts
export function createPartialMock<T>(original: T, overrides: Partial<T>): T {
  if (testFramework.isJest) {
    return { ...jest.requireActual(original as any), ...overrides };
  } else {
    return { ...vi.importActual(original as any), ...overrides };
  }
}

// Usage
mockModule('@/lib/utils', () =>
  createPartialMock('@/lib/utils', {
    calculateTotal: createMockFn().mockReturnValue(100),
  })
);
```

## Configuration Sharing

### Shared Setup Files

```typescript
// test-setup.ts
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeAll } from '@/test-utils';

// Clean up after each test
afterEach(() => {
  cleanup();
  clearAllMocks();
});

// Global test setup
beforeAll(() => {
  // Mock window.matchMedia
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: createMockFn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: createMockFn(),
      removeListener: createMockFn(),
      addEventListener: createMockFn(),
      removeEventListener: createMockFn(),
      dispatchEvent: createMockFn(),
    })),
  });
});
```

### Shared Configuration

```typescript
// test-config.ts
export const testConfig = {
  // Timeouts
  timeout: testFramework.isJest ? 5000 : 5000,

  // Retry configuration
  retries: process.env.CI ? 2 : 0,

  // Coverage thresholds
  coverage: {
    branches: 80,
    functions: 80,
    lines: 80,
    statements: 80,
  },
};

// Apply configuration
if (testFramework.isJest) {
  jest.setTimeout(testConfig.timeout);
} else {
  // Vitest config is set in vitest.config.ts
}
```

## Migration Patterns

### Jest to Vitest Migration

```typescript
// Step 1: Update imports
// Before (Jest)
import { jest } from '@jest/globals';

// After (Framework-agnostic)
import { mocks, createMockFn } from '@/test-utils';

// Step 2: Update mock usage
// Before (Jest)
const mockFn = jest.fn();
jest.spyOn(console, 'log');

// After (Framework-agnostic)
const mockFn = createMockFn();
spyOn(console, 'log');

// Step 3: Update configuration
// Create both jest.config.js and vitest.config.ts
// Use shared test-setup.ts for both
```

### Gradual Migration Strategy

```json
// package.json
{
  "scripts": {
    "test:jest": "jest",
    "test:vitest": "vitest",
    "test:migrate": "npm run test:jest -- --listTests | xargs -I {} npm run test:vitest -- {}",
    "test": "npm run test:jest && npm run test:vitest"
  }
}
```

## Best Practices

1. **Always use abstraction layer**: Never use `jest` or `vi` directly
2. **Centralize test utilities**: Keep all abstractions in `test-utils`
3. **Document framework differences**: Note any behavior differences
4. **Test in both frameworks**: Run CI in both during migration
5. **Use compatible assertions**: Stick to common matchers

## Common Pitfalls

1. **Direct framework usage**: Avoid `jest.fn()` or `vi.fn()`
2. **Framework-specific features**: Avoid features unique to one framework
3. **Global pollution**: Clean up properly between tests
4. **Timer inconsistencies**: Always use the abstraction layer
5. **Module resolution**: Ensure paths work in both frameworks
