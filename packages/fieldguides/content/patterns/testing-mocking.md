---
slug: testing-mocking
title: Mock APIs and modules effectively with MSW and Vitest
description: Strategies for mocking dependencies, APIs, and modules in tests.
type: pattern
---

# Testing Mocking Patterns

Effective strategies for mocking dependencies in JavaScript/TypeScript tests.

## Framework Choice

Both Jest and Vitest provide comprehensive mocking capabilities with similar APIs.

### Mock API Comparison

| Feature             | Jest                     | Vitest                  |
| ------------------- | ------------------------ | ----------------------- |
| Mock functions      | `jest.fn()`              | `vi.fn()`               |
| Module mocking      | `jest.mock()`            | `vi.mock()`             |
| Spy on method       | `jest.spyOn()`           | `vi.spyOn()`            |
| Mock timers         | `jest.useFakeTimers()`   | `vi.useFakeTimers()`    |
| Clear mocks         | `jest.clearAllMocks()`   | `vi.clearAllMocks()`    |
| Reset mocks         | `jest.resetAllMocks()`   | `vi.resetAllMocks()`    |
| Restore mocks       | `jest.restoreAllMocks()` | `vi.restoreAllMocks()`  |
| Mock implementation | `.mockImplementation()`  | `.mockImplementation()` |
| Mock return value   | `.mockReturnValue()`     | `.mockReturnValue()`    |
| Mock resolved value | `.mockResolvedValue()`   | `.mockResolvedValue()`  |

## API Mocking with MSW

Mock Service Worker provides network-level API mocking:

### Setup MSW Handlers

```typescript
// src/test/mocks/handlers.ts
import { http, HttpResponse } from 'msw';
import { userFactory } from '../factories';

export const handlers = [
  http.get('/api/users/:id', ({ params }) => {
    const { id } = params;
    const user = userFactory.build({ id: id as string });
    return HttpResponse.json(user);
  }),

  http.post('/api/users', async ({ request }) => {
    const body = await request.json();
    const user = userFactory.build(body);
    return HttpResponse.json(user, { status: 201 });
  }),

  http.delete('/api/users/:id', () => {
    return new HttpResponse(null, { status: 204 });
  }),
];
```

### Configure Test Server

```typescript
// src/test/mocks/server.ts
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);

// src/test/setup.ts (Vitest)
import { beforeAll, afterEach, afterAll } from 'vitest';
import { server } from './mocks/server';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// src/test/setup.ts (Jest)
import { server } from './mocks/server';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

### Override Handlers in Tests

```typescript
import { http, HttpResponse } from 'msw';
import { server } from '@/test/mocks/server';

it('handles server errors', async () => {
  // Override for this test only
  server.use(
    http.get('/api/users/:id', () => {
      return HttpResponse.json({ error: 'User not found' }, { status: 404 });
    })
  );

  // Test error handling...
});
```

## Module Mocking

### Basic Module Mocks

```typescript
// Vitest example
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock a module
vi.mock('@/services/email', () => ({
  sendEmail: vi.fn().mockResolvedValue({ success: true }),
}));

// Access mocked module
import { sendEmail } from '@/services/email';

it('sends welcome email', async () => {
  await registerUser({ email: 'test@example.com' });

  expect(sendEmail).toHaveBeenCalledWith({
    to: 'test@example.com',
    template: 'welcome',
  });
});

// Jest example
import { jest, describe, it, expect, beforeEach } from '@jest/globals';

// Mock a module
jest.mock('@/services/email', () => ({
  sendEmail: jest.fn().mockResolvedValue({ success: true }),
}));

// Access mocked module
import { sendEmail } from '@/services/email';

it('sends welcome email', async () => {
  await registerUser({ email: 'test@example.com' });

  expect(sendEmail).toHaveBeenCalledWith({
    to: 'test@example.com',
    template: 'welcome',
  });
});
```

### Factory Mocks

```typescript
// Vitest - Mock with factory function
import { vi } from 'vitest';
import { createUser } from '@/services/user';

vi.mock('@/services/database', () => {
  return {
    db: {
      user: {
        findMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
    },
  };
});

// Jest - Mock with factory function
import { jest } from '@jest/globals';
import { createUser } from '@/services/user';

jest.mock('@/services/database', () => {
  return {
    db: {
      user: {
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    },
  };
});

// Use in tests (Vitest)
import { vi, beforeEach, it, expect } from 'vitest';
import { db } from '@/services/database';

beforeEach(() => {
  vi.clearAllMocks();
});

it('creates user in database', async () => {
  const mockUser = { id: '1', name: 'Test' };
  vi.mocked(db.user.create).mockResolvedValue(mockUser);

  const result = await createUser({ name: 'Test' });

  expect(db.user.create).toHaveBeenCalledWith({
    data: { name: 'Test' },
  });
  expect(result).toEqual(mockUser);
});

// Use in tests (Jest)
import { jest, beforeEach, it, expect } from '@jest/globals';
import { db } from '@/services/database';

beforeEach(() => {
  jest.clearAllMocks();
});

it('creates user in database', async () => {
  const mockUser = { id: '1', name: 'Test' };
  jest.mocked(db.user.create).mockResolvedValue(mockUser);

  const result = await createUser({ name: 'Test' });

  expect(db.user.create).toHaveBeenCalledWith({
    data: { name: 'Test' },
  });
  expect(result).toEqual(mockUser);
});
```

## Mocking Best Practices

### 1. Mock at the Right Level

```typescript
// ❌ Don't mock implementation details
vi.mock('axios');

// ✅ Mock at service boundary
vi.mock('@/services/api');
```

### 2. Use Test Doubles Appropriately

- **Stub**: Provides canned responses
- **Mock**: Verifies interactions
- **Spy**: Wraps real implementation
- **Fake**: Working implementation for tests

```typescript
import { vi } from 'vitest';

// Vitest examples
// Stub
const getUser = vi.fn().mockReturnValue({ id: 1, name: 'Test' });

// Spy
const consoleSpy = vi.spyOn(console, 'log');

// Fake
class FakeCache {
  private store = new Map();
  get(key: string) {
    return this.store.get(key);
  }
  set(key: string, value: any) {
    this.store.set(key, value);
  }
}

import { jest } from '@jest/globals';

// Jest examples
// Stub
const getUserJest = jest.fn().mockReturnValue({ id: 1, name: 'Test' });

// Spy
const consoleSpyJest = jest.spyOn(console, 'log');

// Fake (same for both)
class FakeCacheJest {
  private store = new Map();
  get(key: string) {
    return this.store.get(key);
  }
  set(key: string, value: any) {
    this.store.set(key, value);
  }
}
```

### 3. Reset Mocks Between Tests

```typescript
import { vi, beforeEach } from 'vitest';

// Vitest
beforeEach(() => {
  vi.clearAllMocks(); // Clear call history
  vi.resetAllMocks(); // Clear call history + implementation
  vi.restoreAllMocks(); // Restore original implementation
});

import { jest, beforeEach } from '@jest/globals';

// Jest
beforeEach(() => {
  jest.clearAllMocks(); // Clear call history
  jest.resetAllMocks(); // Clear call history + implementation
  jest.restoreAllMocks(); // Restore original implementation
});
```

## Advanced Mocking Examples

### Timer Mocking

```typescript
// Vitest
import { vi, beforeEach, afterEach } from 'vitest';

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

it('debounces function calls', () => {
  const callback = vi.fn();
  const debounced = debounce(callback, 1000);

  debounced();
  debounced();
  debounced();

  expect(callback).not.toHaveBeenCalled();

  vi.advanceTimersByTime(1000);
  expect(callback).toHaveBeenCalledTimes(1);
});

// Jest
import { jest, beforeEach, afterEach } from '@jest/globals';

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

it('debounces function calls', () => {
  const callback = jest.fn();
  const debounced = debounce(callback, 1000);

  debounced();
  debounced();
  debounced();

  expect(callback).not.toHaveBeenCalled();

  jest.advanceTimersByTime(1000);
  expect(callback).toHaveBeenCalledTimes(1);
});
```

### Partial Mocking

```typescript
import { vi } from 'vitest';

// Vitest - Mock only specific exports
vi.mock('@/utils', async importOriginal => {
  const actual = await importOriginal();
  return {
    ...actual,
    calculateTax: vi.fn().mockReturnValue(100),
  };
});

import { jest } from '@jest/globals';

// Jest - Mock only specific exports
jest.mock('@/utils', () => {
  const actual = jest.requireActual('@/utils');
  return {
    ...actual,
    calculateTax: jest.fn().mockReturnValue(100),
  };
});
```

### Dynamic Mock Values

```typescript
import { vi } from 'vitest';

// Vitest
const mockFetch = vi.fn();
global.fetch = mockFetch;

mockFetch
  .mockResolvedValueOnce({ ok: true, json: () => ({ id: 1 }) })
  .mockResolvedValueOnce({ ok: false, status: 404 })
  .mockRejectedValueOnce(new Error('Network error'));

import { jest } from '@jest/globals';

// Jest
const mockFetch = jest.fn();
global.fetch = mockFetch;

mockFetch
  .mockResolvedValueOnce({ ok: true, json: () => ({ id: 1 }) })
  .mockResolvedValueOnce({ ok: false, status: 404 })
  .mockRejectedValueOnce(new Error('Network error'));
```

### Mock Implementations

```typescript
import { vi } from 'vitest';

// Vitest
const mockLogger = {
  info: vi.fn().mockImplementation(message => {
    console.log(`[TEST INFO] ${message}`);
  }),
  error: vi.fn().mockImplementation((message, error) => {
    console.error(`[TEST ERROR] ${message}`, error);
  }),
};

import { jest } from '@jest/globals';

// Jest
const mockLogger = {
  info: jest.fn().mockImplementation(message => {
    console.log(`[TEST INFO] ${message}`);
  }),
  error: jest.fn().mockImplementation((message, error) => {
    console.error(`[TEST ERROR] ${message}`, error);
  }),
};
```

## Related Documentation

- [Unit Testing Patterns](./testing-unit.md) - Writing isolated tests
- [Integration Testing](./testing-integration.md) - Testing with real dependencies
- [Test Organization](../conventions/testing-organization.md) - Organizing mocks
