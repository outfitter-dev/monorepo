---
slug: testing-frameworks-reference
title: Choose and configure JavaScript testing frameworks
description: Guide for selecting and configuring testing frameworks.
type: reference
---

# Testing Frameworks Reference

Comprehensive guide for selecting and configuring JavaScript/TypeScript testing frameworks with detailed comparisons and migration strategies.

## Framework Comparison Matrix

| Feature                | Vitest                 | Jest              | Mocha             | Jasmine           |
| ---------------------- | ---------------------- | ----------------- | ----------------- | ----------------- |
| **TypeScript Support** | Native ✅              | Requires setup ⚡ | Requires setup ⚡ | Requires setup ⚡ |
| **Performance**        | Excellent ✅           | Good              | Good              | Fair              |
| **ESM Support**        | Native ✅              | Experimental ⚡   | Native ✅         | Limited ❌        |
| **Watch Mode**         | Smart & Fast ✅        | Good              | Plugin needed     | Limited           |
| **Snapshot Testing**   | Built-in ✅            | Built-in ✅       | Plugin needed     | Plugin needed     |
| **Coverage**           | Built-in (c8/v8) ✅    | Built-in ✅       | Plugin needed     | Plugin needed     |
| **Parallel Testing**   | Built-in ✅            | Built-in ✅       | Plugin needed     | Limited           |
| **Browser Testing**    | Happy-dom/jsdom ✅     | jsdom ✅          | Plugin needed     | Built-in ✅       |
| **React Testing**      | Excellent ✅           | Excellent ✅      | Good              | Fair              |
| **Vue Testing**        | Native ✅              | Good              | Good              | Fair              |
| **API Compatibility**  | Jest-compatible ✅     | -                 | Different         | Different         |
| **Community Size**     | Growing                | Massive ✅        | Large             | Medium            |
| **Learning Curve**     | Easy (if know Jest) ✅ | Moderate          | Moderate          | Easy              |
| **Configuration**      | Minimal ✅             | Moderate          | Complex           | Minimal           |

## Detailed Framework Analysis

### Vitest (Recommended for New Projects)

Fast, TypeScript-first testing framework built on Vite with excellent developer experience.

**Pros:**

- **Performance**: 10-100x faster than Jest for large codebases
- **Native TypeScript**: No compilation step, direct ts/tsx execution
- **Smart Watch**: Only re-runs affected tests
- **Vite Integration**: Shares config and plugins with Vite
- **Jest Compatible**: Most Jest APIs work unchanged
- **ESM First**: Native ES modules support
- **In-Source Testing**: Co-locate tests with code
- **Benchmarking**: Built-in performance testing

**Cons:**

- **Ecosystem**: Smaller but growing plugin ecosystem
- **Maturity**: Newer, may have edge cases
- **Jest Plugins**: Not all Jest plugins compatible

**Best For:**

- New TypeScript projects
- Vite-based applications
- Performance-critical test suites
- Modern ESM codebases

### Jest (Recommended for Existing Projects)

Mature, feature-rich testing framework with the largest ecosystem.

**Pros:**

- **Ecosystem**: Massive plugin and tool support
- **Battle-tested**: Used by millions of projects
- **Documentation**: Extensive guides and examples
- **Framework Support**: First-class support in most tools
- **Snapshot Testing**: Pioneered the feature
- **Mocking**: Powerful module mocking

**Cons:**

- **Performance**: Slower, especially with TypeScript
- **Configuration**: More setup required
- **ESM Support**: Still experimental
- **Bundle Size**: Larger installation

**Best For:**

- Existing Jest codebases
- Create React App projects
- Next.js applications
- Teams familiar with Jest

## Vitest Configuration

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node', // or 'happy-dom' for browser-like environment
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      exclude: [
        'node_modules/**',
        'src/test/**',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData/**',
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

## Jest Configuration

```typescript
// jest.config.ts
import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  coveragePathIgnorePatterns: ['/node_modules/', '/dist/', '\\.d\\.ts$'],
  testMatch: [
    '**/__tests__/**/*.+(ts|tsx|js)',
    '**/?(*.)+(spec|test).+(ts|tsx|js)',
  ],
};

export default config;
```

## Decision Matrix

### Choose Vitest When

- ✅ Starting a new TypeScript project
- ✅ Using Vite for building
- ✅ Need maximum test performance
- ✅ Want minimal configuration
- ✅ Working with ESM modules
- ✅ Want in-source testing
- ✅ Need benchmarking capabilities

### Choose Jest When

- ✅ Have existing Jest test suite
- ✅ Using Create React App
- ✅ Need specific Jest plugins
- ✅ Team already knows Jest
- ✅ Using Next.js (built-in support)
- ✅ Need maximum ecosystem compatibility
- ✅ Require specific Jest features

### Consider Other Frameworks When

- **Mocha**: Need maximum flexibility and customization
- **Jasmine**: Working with Angular or legacy codebases
- **Playwright Test**: Focus on e2e/component testing
- **Cypress Component Testing**: Already using Cypress

## Migration Strategies

### Jest to Vitest Migration

#### Step 1: Install Dependencies

```bash
# Remove Jest
pnpm remove jest @types/jest ts-jest jest-environment-jsdom

# Install Vitest
pnpm add -D vitest @vitest/ui happy-dom @testing-library/jest-dom
```

#### Step 2: Update Configuration

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import { loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    test: {
      globals: true,
      environment: 'happy-dom',
      setupFiles: ['./src/test/setup.ts'],
      css: true,
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json', 'html'],
        exclude: [
          'node_modules/',
          'src/test/',
          '**/*.d.ts',
          '**/*.config.*',
          '**/mockData/**',
        ],
      },
    },
    define: {
      'process.env': env,
    },
  };
});
```

#### Step 3: Update Test Files

```typescript
// Simple find/replace in most cases
// jest.fn() → vi.fn()
// jest.mock() → vi.mock()
// jest.spyOn() → vi.spyOn()

// Update imports
// Before
import { jest } from '@jest/globals';

// After
import { vi } from 'vitest';
```

#### Step 4: Update Package Scripts

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage"
  }
}
```

### Common Migration Issues

#### Module Mocking Differences

```typescript
// Jest
jest.mock('./module', () => ({
  default: jest.fn(),
  namedExport: jest.fn(),
}));

// Vitest
vi.mock('./module', () => ({
  default: vi.fn(),
  namedExport: vi.fn(),
}));
```

#### Timer Mocking

```typescript
// Both support the same API
vi.useFakeTimers();
vi.advanceTimersByTime(1000);
vi.useRealTimers();
```

#### Snapshot Testing

```typescript
// Works the same in both
expect(component).toMatchSnapshot();

// Inline snapshots
expect(data).toMatchInlineSnapshot(`"expected"`);
```

## Performance Comparison

### Benchmark Results (1000 test files)

| Operation         | Vitest | Jest  | Improvement |
| ----------------- | ------ | ----- | ----------- |
| Cold Start        | 2.1s   | 8.3s  | 4x faster   |
| Hot Reload        | 142ms  | 2.8s  | 20x faster  |
| Watch Mode Update | 89ms   | 1.2s  | 13x faster  |
| TypeScript Tests  | 2.8s   | 12.4s | 4.4x faster |
| Coverage Report   | 3.2s   | 9.7s  | 3x faster   |

\*Results vary based on hardware and project structure

## Framework-Specific Features

### Vitest Exclusive Features

```typescript
// In-source testing
function add(a: number, b: number) {
  return a + b;
}

if (import.meta.vitest) {
  const { it, expect } = import.meta.vitest;
  it('adds numbers', () => {
    expect(add(1, 2)).toBe(3);
  });
}

// Benchmarking
import { bench, describe } from 'vitest';

describe('sort performance', () => {
  bench('native sort', () => {
    [3, 1, 2].sort();
  });
});
```

### Jest Exclusive Features

```typescript
// Jest Each (Vitest has it.each)
test.each`
  a    | b    | expected
  ${1} | ${1} | ${2}
  ${1} | ${2} | ${3}
`('returns $expected when $a + $b', ({ a, b, expected }) => {
  expect(a + b).toBe(expected);
});

// Jest Circus (default test runner)
// More predictable test execution order
```

## Configuration Examples

### Monorepo Configuration

#### Vitest Workspace

```typescript
// vitest.workspace.ts
export default [
  'packages/*/vitest.config.ts',
  'apps/*/vitest.config.ts',
  {
    test: {
      include: ['tests/**/*.test.ts'],
      name: 'integration',
      environment: 'node',
    },
  },
];
```

#### Jest Projects

```typescript
// jest.config.ts
export default {
  projects: [
    '<rootDir>/packages/*/jest.config.ts',
    '<rootDir>/apps/*/jest.config.ts',
  ],
};
```

### CI/CD Configuration

#### GitHub Actions with Vitest

```yaml
- name: Run tests
  run: pnpm test:ci

- name: Upload coverage
  uses: codecov/codecov-action@v3
  with:
    files: ./coverage/coverage-final.json
```

#### Vitest UI in Development

```json
{
  "scripts": {
    "test:ui": "vitest --ui --coverage"
  }
}
```

## Related Documentation

- [Testing Philosophy](../conventions/testing-philosophy.md) - Core testing principles
- [Test Organization](../conventions/testing-organization.md) - Structuring test files
- [Unit Testing Patterns](../patterns/testing-unit.md) - Writing unit tests
- [Framework Agnostic Testing](../patterns/framework-agnostic-testing.md) - Cross-framework patterns
- [Vitest Guide](../guides/vitest-guide.md) - Complete Vitest setup
- [Testing Standards](../standards/testing-standards.md) - Testing best practices
