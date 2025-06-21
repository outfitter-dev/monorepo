---
slug: vitest-guide
title: Fast unit testing with Vitest
description: Fast testing with native ESM, TypeScript, and React support.
type: guide
---

# Vitest Guide

Blazing fast unit testing framework powered by Vite with first-class TypeScript support.

## Overview

Vitest provides a modern testing experience with native ESM support, in-source testing, and seamless integration with Vite projects. It's Jest-compatible while being significantly faster.

## Installation

```bash
# Core dependencies
pnpm add -D vitest @vitest/ui @vitest/coverage-v8

# For React testing
pnpm add -D @testing-library/react @testing-library/user-event happy-dom

# For Vue testing
pnpm add -D @testing-library/vue happy-dom
```

## Configuration

### Basic Setup

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: './src/test/setup.ts',
    css: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

### Test Setup File

```typescript
// src/test/setup.ts
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

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
```

## Writing Tests

### Basic Test Structure

```typescript
// src/utils/math.test.ts
import { describe, it, expect } from 'vitest';
import { add, multiply } from './math';

describe('Math utilities', () => {
  describe('add', () => {
    it('should add two positive numbers', () => {
      expect(add(2, 3)).toBe(5);
    });

    it('should handle negative numbers', () => {
      expect(add(-2, 3)).toBe(1);
      expect(add(2, -3)).toBe(-1);
    });
  });

  describe('multiply', () => {
    it('should multiply two numbers', () => {
      expect(multiply(3, 4)).toBe(12);
    });
  });
});
```

### Testing Async Code

```typescript
// src/api/users.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchUser, createUser } from './users';

// Mock fetch
global.fetch = vi.fn();

describe('User API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch user by id', async () => {
    const mockUser = { id: '1', name: 'John Doe' };

    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockUser,
    });

    const user = await fetchUser('1');

    expect(fetch).toHaveBeenCalledWith('/api/users/1');
    expect(user).toEqual(mockUser);
  });

  it('should handle fetch errors', async () => {
    (fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 404,
    });

    await expect(fetchUser('999')).rejects.toThrow('User not found');
  });
});
```

## React Component Testing

### Component Test

```typescript
// src/components/Button.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('should render with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button')).toHaveTextContent('Click me');
  });

  it('should handle click events', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);

    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should be disabled when specified', () => {
    render(<Button disabled>Click me</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
```

### Hook Testing

```typescript
// src/hooks/useCounter.test.ts
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCounter } from './useCounter';

describe('useCounter', () => {
  it('should initialize with default value', () => {
    const { result } = renderHook(() => useCounter());
    expect(result.current.count).toBe(0);
  });

  it('should initialize with custom value', () => {
    const { result } = renderHook(() => useCounter(10));
    expect(result.current.count).toBe(10);
  });

  it('should increment count', () => {
    const { result } = renderHook(() => useCounter());

    act(() => {
      result.current.increment();
    });

    expect(result.current.count).toBe(1);
  });
});
```

## Migration from Jest

### Configuration Changes

```typescript
// jest.config.js → vitest.config.ts
// Before (Jest)
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
};

// After (Vitest)
export default defineConfig({
  test: {
    environment: 'happy-dom',
    setupFiles: './src/test/setup.ts',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

### API Differences

```typescript
// Jest
import { jest } from '@jest/globals';
jest.mock('./module');
jest.spyOn(object, 'method');
jest.useFakeTimers();

// Vitest
import { vi } from 'vitest';
vi.mock('./module');
vi.spyOn(object, 'method');
vi.useFakeTimers();
```

## Advanced Features

### In-Source Testing

```typescript
// src/utils/validators.ts
export function isEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// In-source tests (only included in dev/test builds)
if (import.meta.vitest) {
  const { it, expect } = import.meta.vitest;

  it('validates email addresses', () => {
    expect(isEmail('test@example.com')).toBe(true);
    expect(isEmail('invalid-email')).toBe(false);
  });
}
```

### Benchmarking

```typescript
// src/utils/sort.bench.ts
import { bench, describe } from 'vitest';
import { quickSort, mergeSort, bubbleSort } from './sort';

const data = Array.from({ length: 1000 }, () => Math.random());

describe('Sorting algorithms', () => {
  bench('quickSort', () => {
    quickSort([...data]);
  });

  bench('mergeSort', () => {
    mergeSort([...data]);
  });

  bench('bubbleSort', () => {
    bubbleSort([...data]);
  });
});
```

### Snapshot Testing

```typescript
// src/components/Card.test.tsx
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Card } from './Card';

describe('Card', () => {
  it('should match snapshot', () => {
    const { container } = render(
      <Card title="Test Card" description="Test description" />
    );

    expect(container.firstChild).toMatchSnapshot();
  });

  // Inline snapshots
  it('should render title correctly', () => {
    const { container } = render(<Card title="Hello" />);

    expect(container.innerHTML).toMatchInlineSnapshot(
      `"<div class="card"><h2>Hello</h2></div>"`
    );
  });
});
```

## Coverage Configuration

### Detailed Coverage Setup

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      excludeNodeModules: true,
      exclude: [
        'node_modules',
        'test',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData',
        'src/main.tsx',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
});
```

### Running Coverage

```bash
# Run tests with coverage
pnpm vitest run --coverage

# Watch mode with coverage
pnpm vitest --coverage

# UI mode with coverage
pnpm vitest --ui --coverage
```

## Package.json Scripts

```json
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest run --coverage",
    "test:watch": "vitest --watch",
    "test:bench": "vitest bench"
  }
}
```

## Best Practices

1. **Use happy-dom over jsdom**: Faster and lighter for most tests
2. **Leverage Vite's speed**: Tests run in milliseconds, not seconds
3. **Co-locate tests**: Keep test files next to source files
4. **Use in-source testing**: For pure functions and utilities
5. **Run tests in watch mode**: During development for instant feedback

## Common Testing Patterns

### Mocking Modules

```typescript
// Mock an entire module
vi.mock('@/services/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

// Partial mocking
vi.mock('@/utils/helpers', async importOriginal => {
  const actual = await importOriginal();
  return {
    ...actual,
    formatDate: vi.fn(() => '2023-01-01'),
  };
});
```

### Testing Error Boundaries

```typescript
import { ErrorBoundary } from './ErrorBoundary';

// Suppress console.error for this test
const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

it('should catch errors and display fallback', () => {
  const ThrowError = () => {
    throw new Error('Test error');
  };

  render(
    <ErrorBoundary fallback={<div>Error occurred</div>}>
      <ThrowError />
    </ErrorBoundary>
  );

  expect(screen.getByText('Error occurred')).toBeInTheDocument();
});

consoleSpy.mockRestore();
```
