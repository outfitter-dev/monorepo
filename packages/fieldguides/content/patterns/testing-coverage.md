---
slug: testing-coverage
title: Configure test coverage thresholds and reporting
description: Modern coverage strategies for Vitest and Jest with actionable metrics.
type: pattern
---

# Test Coverage Patterns

Modern coverage strategies and configuration for maintaining quality metrics across Vitest and Jest projects.

## Related Documentation

- [Testing Standards](../standards/testing-standards.md) - Core testing principles
- [Testing Philosophy](../conventions/testing-philosophy.md) - Testing approach
- [Vitest Guide](../guides/vitest-guide.md) - Vitest configuration
- [CI/CD Patterns](./github-actions.md) - Coverage in pipelines

## Coverage Configuration

### Vitest Coverage Setup

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8', // Recommended for performance
      reporter: ['text', 'lcov', 'html', 'json', 'json-summary'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/**',
        'dist/**',
        '**/*.d.ts',
        '**/*.config.*',
        '**/__mocks__/**',
        '**/__fixtures__/**',
        '**/test/**',
        '**/tests/**',
        '**/*.test.{ts,tsx}',
        '**/*.spec.{ts,tsx}',
        '**/index.{ts,tsx}', // Barrel exports
        '**/types/**',
      ],
      include: ['src/**/*.{ts,tsx}'],
      thresholds: {
        statements: 80,
        branches: 80,
        functions: 80,
        lines: 80,
        // Per-file thresholds for critical paths
        perFile: true,
      },
      // Clean coverage between runs
      clean: true,
      // Include all files, even if not tested
      all: true,
    },
  },
});
```

### Jest Coverage Setup

```typescript
// jest.config.ts
import type { Config } from 'jest';

const config: Config = {
  collectCoverage: process.env.CI === 'true',
  coverageDirectory: 'coverage',
  coverageProvider: 'v8',
  coverageReporters: [
    'text',
    'lcov',
    'html',
    'json',
    'json-summary',
    'cobertura', // For CI tools
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
    '!src/**/__mocks__/**',
    '!src/**/types/**',
    '!src/**/index.{ts,tsx}',
  ],
  coverageThreshold: {
    global: {
      statements: 80,
      branches: 80,
      functions: 80,
      lines: 80,
    },
    // Critical paths with higher thresholds
    './src/utils/auth.ts': {
      statements: 95,
      branches: 90,
      functions: 100,
      lines: 95,
    },
  },
};

export default config;
```

### Unified Package Scripts

```jsonc
// package.json
{
  "scripts": {
    "test": "vitest",
    "test:jest": "jest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest run --coverage",
    "test:coverage:jest": "jest --coverage",
    "test:watch": "vitest --watch",
    "test:ci": "vitest run --coverage --reporter=junit --outputFile=test-results.xml",
    "coverage:view": "open coverage/index.html",
    "coverage:check": "vitest run --coverage.enabled --coverage.reporter=json-summary && node scripts/check-coverage.js",
  },
}
```

## Modern Coverage Strategies

### Progressive Threshold Management

```typescript
// scripts/coverage-config.ts
import { CoverageThresholds } from './types';

export function getCoverageThresholds(): CoverageThresholds {
  const projectAge = getProjectAgeInMonths();

  // Progressive thresholds based on project maturity
  if (projectAge < 1) {
    return {
      statements: 50,
      branches: 40,
      functions: 50,
      lines: 50,
    };
  } else if (projectAge < 3) {
    return {
      statements: 70,
      branches: 65,
      functions: 70,
      lines: 70,
    };
  } else if (projectAge < 6) {
    return {
      statements: 80,
      branches: 75,
      functions: 80,
      lines: 80,
    };
  }

  // Mature project
  return {
    statements: 85,
    branches: 80,
    functions: 85,
    lines: 85,
  };
}

// Apply to config
export default defineConfig({
  test: {
    coverage: {
      thresholds: getCoverageThresholds(),
    },
  },
});
```

### Smart Per-File Coverage

```typescript
// coverage.config.ts
export const criticalPathThresholds = {
  // Authentication - highest coverage
  'src/**/auth/**/*.ts': {
    statements: 95,
    branches: 90,
    functions: 100,
    lines: 95,
  },
  // Payment processing - maximum coverage
  'src/**/payment/**/*.ts': {
    statements: 100,
    branches: 95,
    functions: 100,
    lines: 100,
  },
  // API handlers - high coverage
  'src/**/api/**/*.ts': {
    statements: 90,
    branches: 85,
    functions: 90,
    lines: 90,
  },
  // UI components - moderate coverage
  'src/components/**/*.tsx': {
    statements: 75,
    branches: 70,
    functions: 75,
    lines: 75,
  },
  // Utilities - standard coverage
  'src/utils/**/*.ts': {
    statements: 85,
    branches: 80,
    functions: 85,
    lines: 85,
  },
};
```

## Advanced Coverage Reporting

### Interactive Analysis

```bash
# Generate detailed reports
npm run test:coverage

# View in browser with hot reload
npm run coverage:view

# Generate summary for CI
npm run coverage:check
```

### Custom Coverage Script

```javascript
// scripts/check-coverage.js
import { readFileSync } from 'fs';
import chalk from 'chalk';

const coverage = JSON.parse(
  readFileSync('./coverage/coverage-summary.json', 'utf8')
);

const thresholds = {
  statements: 80,
  branches: 80,
  functions: 80,
  lines: 80,
};

let failed = false;

Object.entries(thresholds).forEach(([metric, threshold]) => {
  const value = coverage.total[metric].pct;
  const passed = value >= threshold;

  console.log(
    `${passed ? chalk.green('✓') : chalk.red('✗')} ${metric}: ${value}% (threshold: ${threshold}%)`
  );

  if (!passed) failed = true;
});

// Show uncovered files
const uncovered = Object.entries(coverage)
  .filter(([path, data]) => path !== 'total' && data.lines.pct < 50)
  .map(([path]) => path);

if (uncovered.length > 0) {
  console.log(chalk.yellow('\nFiles with low coverage:'));
  uncovered.forEach(file => console.log(chalk.yellow(`  - ${file}`)));
}

if (failed) process.exit(1);
```

### Enhanced CI Integration

```yaml
# .github/workflows/test.yml
name: Tests with Coverage

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests with coverage
        run: npm run test:ci

      - name: Check coverage thresholds
        run: npm run coverage:check

      - name: Upload coverage reports
        uses: actions/upload-artifact@v4
        with:
          name: coverage-report
          path: coverage/

      - name: Coverage to Codecov
        uses: codecov/codecov-action@v4
        with:
          token: ${{ secrets.CODECOV_TOKEN }}
          files: ./coverage/lcov.info
          fail_ci_if_error: true
          verbose: true

      - name: Comment PR with coverage
        uses: 5monkeys/cobertura-action@master
        if: github.event_name == 'pull_request'
        with:
          path: coverage/cobertura-coverage.xml
          minimum_coverage: 80
          fail_below_threshold: true
```

## Coverage Best Practices

### Strategic Exclusions

```typescript
// coverage-exclusions.ts
export const coverageExclusions = [
  // Build & output
  'dist/**',
  'build/**',
  '.next/**',
  'out/**',

  // Type definitions
  '**/*.d.ts',
  '**/types/**',
  '**/@types/**',

  // Configuration
  '**/*.config.*',
  '**/config/**',
  'scripts/**',

  // Test infrastructure
  '**/*.test.*',
  '**/*.spec.*',
  '**/*.e2e.*',
  '**/test/**',
  '**/tests/**',
  '**/__tests__/**',
  '**/__mocks__/**',
  '**/__fixtures__/**',
  '**/test-utils/**',

  // Generated code
  '**/generated/**',
  '**/*.generated.*',
  '**/graphql/**',

  // Storybook
  '**/*.stories.*',
  '.storybook/**',

  // Development files
  '**/playground/**',
  '**/examples/**',
  '**/demos/**',
];
```

### Priority Coverage Matrix

```typescript
// Priority 1: Critical Path (95%+ coverage)
- Authentication & authorization
- Payment processing
- Data encryption/decryption
- User permissions
- Security utilities

// Priority 2: Business Logic (85%+ coverage)
- Core algorithms
- Data transformations
- Validation logic
- State management
- API integrations

// Priority 3: Error Handling (80%+ coverage)
- Error boundaries
- Exception handlers
- Fallback behaviors
- Retry mechanisms
- Circuit breakers

// Priority 4: UI Components (70%+ coverage)
- Interactive components
- Form controls
- Data displays
- Navigation elements

// Priority 5: Utilities (75%+ coverage)
- Helper functions
- Formatters
- Parsers
- Constants
```

### Meaningful Coverage Patterns

```typescript
// ❌ Bad: Coverage without value
describe('UserService', () => {
  it('creates instance', () => {
    const service = new UserService();
    expect(service).toBeDefined(); // Meaningless
  });

  it('has methods', () => {
    const service = new UserService();
    expect(service.getUser).toBeDefined(); // Not testing behavior
  });
});

// ✅ Good: Behavior-driven coverage
describe('UserService', () => {
  let service: UserService;
  let mockDb: MockDatabase;

  beforeEach(() => {
    mockDb = createMockDatabase();
    service = new UserService(mockDb);
  });

  describe('getUser', () => {
    it('returns user data for valid ID', async () => {
      const userId = '123';
      const expectedUser = { id: userId, name: 'John Doe' };
      mockDb.users.findById.mockResolvedValue(expectedUser);

      const user = await service.getUser(userId);

      expect(user).toEqual(expectedUser);
      expect(mockDb.users.findById).toHaveBeenCalledWith(userId);
    });

    it('throws NotFoundError for invalid ID', async () => {
      mockDb.users.findById.mockResolvedValue(null);

      await expect(service.getUser('invalid')).rejects.toThrow(NotFoundError);
    });

    it('handles database errors gracefully', async () => {
      mockDb.users.findById.mockRejectedValue(new Error('DB Error'));

      await expect(service.getUser('123')).rejects.toThrow(
        'Failed to fetch user'
      );
    });
  });
});
```

## Improving Coverage Systematically

### Coverage Gap Analysis

```typescript
// scripts/analyze-coverage.ts
import { analyzeCoverage } from './coverage-utils';

async function findCoverageGaps() {
  const report = await analyzeCoverage('./coverage/lcov.info');

  // Find completely untested files
  const untestedFiles = report.files
    .filter(file => file.lines.pct === 0)
    .map(file => file.path);

  // Find files with low branch coverage
  const lowBranchCoverage = report.files
    .filter(file => file.branches.pct < 50)
    .sort((a, b) => a.branches.pct - b.branches.pct);

  // Find specific uncovered lines
  const uncoveredLines = report.getUncoveredLines();

  return {
    untestedFiles,
    lowBranchCoverage,
    uncoveredLines,
  };
}
```

### Branch Coverage Strategies

```typescript
// Example: Complex branching logic
export function calculateDiscount(
  user: User,
  order: Order,
  promoCode?: string
): number {
  let discount = 0;

  // VIP user discount
  if (user.tier === 'vip') {
    discount += 0.1;
  }

  // Bulk order discount
  if (order.items.length > 10) {
    discount += 0.05;
  } else if (order.items.length > 5) {
    discount += 0.02;
  }

  // Promo code
  if (promoCode) {
    const promo = validatePromoCode(promoCode);
    if (promo?.active) {
      discount += promo.discount;
    }
  }

  // Cap discount
  return Math.min(discount, 0.5);
}

// Comprehensive branch testing
describe('calculateDiscount', () => {
  // Test matrix for all combinations
  const testCases = [
    { user: { tier: 'vip' }, items: 1, promo: null, expected: 0.1 },
    { user: { tier: 'regular' }, items: 1, promo: null, expected: 0 },
    { user: { tier: 'vip' }, items: 6, promo: null, expected: 0.12 },
    { user: { tier: 'vip' }, items: 11, promo: null, expected: 0.15 },
    { user: { tier: 'vip' }, items: 11, promo: 'SAVE20', expected: 0.35 },
    { user: { tier: 'vip' }, items: 11, promo: 'SAVE50', expected: 0.5 }, // Cap test
  ];

  test.each(testCases)(
    'calculates discount for $user.tier user with $items items and promo $promo',
    ({ user, items, promo, expected }) => {
      const order = { items: Array(items).fill({}) };
      const discount = calculateDiscount(user, order, promo);
      expect(discount).toBe(expected);
    }
  );

  // Edge cases
  it('handles invalid promo codes', () => {
    const discount = calculateDiscount(
      { tier: 'regular' },
      { items: [{}] },
      'INVALID'
    );
    expect(discount).toBe(0);
  });
});
```

### Coverage Improvement Workflow

```bash
# 1. Generate coverage report with details
npm run test:coverage

# 2. Analyze gaps
npm run coverage:analyze

# 3. Generate missing test stubs
npm run coverage:generate-stubs

# 4. Run focused tests on changed files
npm run test:coverage -- --changed

# 5. Validate improvement
npm run coverage:check
```

## Coverage Monitoring

### Automated Coverage Tracking

```yaml
# .github/workflows/coverage-monitor.yml
name: Coverage Monitor

on:
  pull_request:
  push:
    branches: [main]

jobs:
  coverage-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run coverage
        run: |
          npm ci
          npm run test:coverage

      - name: Coverage trend analysis
        run: |
          node scripts/coverage-trend.js

      - name: Post coverage comment
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v7
        with:
          script: |
            const coverage = require('./coverage/coverage-summary.json');
            const comment = `
            ## Coverage Report
            | Metric | Coverage | Threshold |
            |--------|----------|----------|
            | Statements | ${coverage.total.statements.pct}% | 80% |
            | Branches | ${coverage.total.branches.pct}% | 80% |
            | Functions | ${coverage.total.functions.pct}% | 80% |
            | Lines | ${coverage.total.lines.pct}% | 80% |
            `;
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: comment
            });
```

## Summary

- Use **progressive thresholds** that grow with project maturity
- Focus on **meaningful coverage** over percentage metrics
- Prioritize **critical paths** with higher thresholds
- Automate **coverage monitoring** in CI/CD
- Regularly **analyze and improve** coverage gaps
