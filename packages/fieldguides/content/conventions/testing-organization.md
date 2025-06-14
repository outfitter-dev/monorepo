---
slug: testing-organization
title: Organize tests alongside source with clear naming
description: Standard patterns for organizing test files, utilities, and test data.
type: convention
---

# Test Organization

Modern patterns for organizing test files in JavaScript/TypeScript projects,
supporting both Vitest (preferred) and Jest for legacy compatibility.

## File Structure (2025 Best Practices)

```text
src/
   components/
      Button/
         Button.tsx
         Button.test.tsx      # Colocated unit tests
         Button.bench.ts      # Performance benchmarks (Vitest)
         Button.stories.tsx   # Storybook stories (optional)
   services/
      auth/
         auth.service.ts
         auth.service.test.ts # Service tests
         auth.service.bench.ts # Performance tests
   lib/
      utils.ts               # Utility functions
      utils.test.ts          # Can use in-source testing (Vitest)
   test/                     # Shared test infrastructure
      setup.ts               # Global test setup
      setup.jest.ts          # Jest-specific setup (if needed)
      utils.tsx              # Test utilities & custom render
      factories/             # Test data factories
      mocks/                 # Shared mock implementations
      fixtures/              # Test fixtures and snapshots
   e2e/                      # Separate E2E tests (Playwright)
      auth.spec.ts
      checkout.spec.ts
      fixtures/              # E2E test data
```

## Naming Conventions

### Test Files

- **Unit tests**: `[name].test.ts(x)` - Colocated with source (both frameworks)
- **Integration tests**: `[name].integration.test.ts` - For multi-component
  tests
- **Benchmark tests**: `[name].bench.ts` - Performance testing (Vitest only)
- **E2E tests**: `[feature].spec.ts` - In separate e2e directory (Playwright)
- **In-source tests**: For pure functions, embed tests in source files (Vitest
  only)
- **Visual tests**: `[name].visual.test.ts` - Visual regression tests

### Test Suites

```typescript
// Group by component/module
describe('UserService', () => {
  // Group by method/functionality
  describe('createUser', () => {
    // Specific test cases
    it('should create a user with valid data', () => {});
    it('should throw error for duplicate email', () => {});
  });
});
```

## Test Utilities

### Shared Test Setup

#### Vitest Configuration (Preferred)

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'happy-dom', // Faster than jsdom
    setupFiles: './src/test/setup.ts',
    includeSource: ['src/**/*.{js,ts}'], // For in-source testing
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/*.stories.tsx',
      ],
    },
    pool: 'threads', // Use worker threads for better isolation
    poolOptions: {
      threads: {
        singleThread: true, // Run each test file in isolation
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@test': path.resolve(__dirname, './src/test'),
    },
  },
  define: {
    'import.meta.vitest': 'undefined', // Production safety
  },
});
```

#### Jest Configuration (Legacy Support)

```typescript
// jest.config.ts
import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.jest.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@test/(.*)$': '<rootDir>/src/test/$1',
    '\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.tsx',
    '!src/test/**',
  ],
  testMatch: [
    '**/__tests__/**/*.+(ts|tsx|js)',
    '**/?(*.)+(spec|test).+(ts|tsx|js)',
  ],
  transform: {
    '^.+\.(ts|tsx)$': [
      'ts-jest',
      {
        tsconfig: {
          jsx: 'react-jsx',
        },
      },
    ],
  },
};

export default config;

// src/test/setup.ts (Vitest)
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';
import { server } from './mocks/server';

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// MSW server setup
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  cleanup();
  server.resetHandlers();
  vi.clearAllMocks();
});
afterAll(() => server.close());

// src/test/setup.jest.ts (Jest)
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { server } from './mocks/server';

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  cleanup();
  server.resetHandlers();
  jest.clearAllMocks();
});
afterAll(() => server.close());
```

### Test Factories

```typescript
// src/test/factories/user.factory.ts
import { faker } from '@faker-js/faker';
import type { User } from '@/types';

export function createUser(overrides?: Partial<User>): User {
  return {
    id: faker.string.uuid(),
    email: faker.internet.email(),
    name: faker.person.fullName(),
    createdAt: faker.date.past(),
    ...overrides,
  };
}
```

### Custom Render Functions (Modern)

```typescript
// src/test/utils.tsx
import { render as rtlRender, type RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { type ReactElement, type ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';

interface TestProviderProps {
  children: ReactNode;
}

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0, // No garbage collection during tests
      },
      mutations: {
        retry: false,
      },
    },
    logger: {
      log: console.log,
      warn: console.warn,
      error: () => {}, // Suppress error logs in tests
    },
  });
}

function AllTheProviders({ children }: TestProviderProps) {
  const queryClient = createTestQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        {children}
      </MemoryRouter>
    </QueryClientProvider>
  );
}

export function render(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return rtlRender(ui, { wrapper: AllTheProviders, ...options });
}

// Re-export everything
export * from '@testing-library/react';
export { userEvent } from '@testing-library/user-event';
```

## Mock Organization

### Mock Service Worker Setup (MSW 2.0)

```typescript
// src/test/mocks/handlers.ts
import { http, HttpResponse, delay } from 'msw';
import { createUser } from '../factories/user';

export const handlers = [
  http.get('/api/users/:id', async ({ params }) => {
    await delay(100); // Simulate network delay
    return HttpResponse.json(createUser({ id: params.id as string }));
  }),

  http.post('/api/users', async ({ request }) => {
    const data = await request.json();
    return HttpResponse.json(createUser(data), { status: 201 });
  }),

  // Error simulation
  http.get('/api/users/error', () => {
    return HttpResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }),
];

// src/test/mocks/server.ts
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);
```

### In-Source Testing (Vitest Feature)

```typescript
// src/lib/utils.ts
export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

// In-source tests - stripped from production builds
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe('formatCurrency', () => {
    it('formats USD correctly', () => {
      expect(formatCurrency(1234.56)).toBe('$1,234.56');
    });

    it('formats EUR correctly', () => {
      expect(formatCurrency(1234.56, 'EUR')).toMatch(/€/);
    });
  });
}
```

## Performance Testing with Vitest

### Basic Benchmarks

```typescript
// src/lib/algorithm.bench.ts
import { bench, describe } from 'vitest';
import { sortAlgorithm, optimizedSort } from './sorting';

describe('Sorting Performance', () => {
  // Define test data outside benchmarks
  const testData = generateArray(1000);

  bench('Original algorithm', () => {
    sortAlgorithm([...testData]); // Clone to avoid mutation
  });

  bench('Optimized algorithm', () => {
    optimizedSort([...testData]);
  });

  // Compare different input sizes
  for (const size of [100, 1000, 10000]) {
    bench(`Optimized with ${size} items`, () => {
      optimizedSort(generateArray(size));
    });
  }
});
```

### Component Performance Testing

```typescript
// src/components/DataTable/DataTable.bench.tsx
import { bench, describe } from 'vitest';
import { render } from '@testing-library/react';
import { DataTable } from './DataTable';
import { generateRows } from '@test/factories';

describe('DataTable Performance', () => {
  bench('Initial render with 100 rows', () => {
    const { unmount } = render(
      <DataTable data={generateRows(100)} />
    );
    unmount();
  });

  bench('Initial render with 1000 rows', () => {
    const { unmount } = render(
      <DataTable data={generateRows(1000)} />
    );
    unmount();
  });

  bench('Re-render with data change', async () => {
    const { rerender, unmount } = render(
      <DataTable data={generateRows(100)} />
    );

    rerender(<DataTable data={generateRows(100)} />);
    unmount();
  });
});
```

### Running Benchmarks

```bash
# Run all benchmarks
pnpm vitest bench

# Run specific benchmark file
pnpm vitest bench DataTable

# Generate benchmark report
pnpm vitest bench --reporter=json --outputFile=bench-results.json
```

## Framework Migration Guide

### Migrating from Jest to Vitest

```typescript
// Jest syntax
import { jest } from '@jest/globals';
jest.mock('./module');
const mockFn = jest.fn();
jest.spyOn(object, 'method');
jest.useFakeTimers();

// Vitest syntax
import { vi } from 'vitest';
vi.mock('./module');
const mockFn = vi.fn();
vi.spyOn(object, 'method');
vi.useFakeTimers();
```

### Running Both Frameworks

```json
// package.json
{
  "scripts": {
    "test": "vitest",
    "test:jest": "jest",
    "test:all": "concurrently \"pnpm test\" \"pnpm test:jest\"",
    "test:migrate": "vitest --config vitest.migration.config.ts"
  }
}
```

## Related Documentation

- [Testing Philosophy](./testing-philosophy.md) - Core testing principles
- [Testing Standards](../standards/testing-standards.md) - Comprehensive testing
  methodology
- [Testing Unit](../patterns/testing-unit.md) - Unit testing patterns
- [Testing React Components](../patterns/testing-react-components.md) -
  Component testing
- [Framework-Agnostic Testing](../patterns/framework-agnostic-testing.md) -
  Portable test patterns
