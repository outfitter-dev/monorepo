---
slug: testing-philosophy
title: Follow TDD and FIRST principles for reliable tests
description: Core testing philosophy with TDD cycle and FIRST principles.
type: convention
---

# Testing Philosophy

Modern testing principles for JavaScript/TypeScript applications in 2025, emphasizing speed, isolation, and developer experience.

## Test-Driven Development (TDD) - Modern Workflow

Embrace the Red-Green-Refactor cycle with modern tooling:

1. **Red** - Write a failing test that captures the requirement
2. **Green** - Implement the minimum code to make the test pass
3. **Refactor** - Improve the design while keeping tests green

```typescript
// 1. Write the test first (RED) - using Vitest
import { describe, it, expect } from 'vitest';

describe('calculateDiscount', () => {
  it('should apply percentage discount to price', () => {
    expect(calculateDiscount(100, 10)).toBe(90);
  });

  it('should handle edge cases', () => {
    expect(calculateDiscount(100, 0)).toBe(100);
    expect(calculateDiscount(100, 100)).toBe(0);
    expect(() => calculateDiscount(100, -10)).toThrow();
  });
});

// 2. Run test with watch mode: vitest --watch
// 3. Implement with type safety (GREEN)
function calculateDiscount(price: number, percentage: number): number {
  if (percentage < 0 || percentage > 100) {
    throw new Error('Percentage must be between 0 and 100');
  }
  return price * (1 - percentage / 100);
}
// 4. Test passes ✅ - refactor for clarity
```

### Modern TDD with Commit Conventions

```bash
# Commit workflow
git commit -m "test(pricing): [RED] add discount calculation tests"
git commit -m "feat(pricing): [GREEN] implement calculateDiscount"
git commit -m "refactor(pricing): [REFACTOR] optimize discount calculation"
```

## FIRST Principles (Enhanced for 2025)

Tests must be:

- **Fast** - Sub-millisecond unit tests with hot module replacement
- **Isolated** - No shared state, parallel execution by default, proper cleanup
- **Repeatable** - Deterministic with seeded randomness and stable mocks
- **Self-validating** - Clear assertions with descriptive error messages
- **Timely** - Written before code, with instant feedback loops

### Fast Tests in Practice

```typescript
// Configure for maximum speed
export default defineConfig({
  test: {
    pool: 'threads', // Faster than forks
    isolate: true, // Each test file in isolation
    passWithNoTests: true,
    maxConcurrency: 5, // Optimize for your CPU
  },
});

// Use lightweight test doubles
const mockUser = { id: '1', name: 'Test' } as User; // Avoid factories in unit tests
```

### Isolated Tests

```typescript
// Each test manages its own state
describe('UserStore', () => {
  let store: UserStore;

  beforeEach(() => {
    store = new UserStore(); // Fresh instance
  });

  afterEach(() => {
    store.dispose(); // Explicit cleanup
  });

  it('operates independently', () => {
    // This test is completely isolated
    store.addUser({ id: '1', name: 'Test' });
    expect(store.users).toHaveLength(1);
  });
});
```

```typescript
// Fast & Isolated - runs in parallel
import { describe, it, expect, vi } from 'vitest';

describe('UserService', () => {
  it('creates user with unique ID', async () => {
    // Isolated - mocked dependencies
    const mockDb = { insert: vi.fn().mockResolvedValue({ id: '123' }) };
    const service = new UserService(mockDb);

    // Repeatable - controlled test data
    const user = await service.create({
      name: 'Test User',
      email: 'test@example.com',
    });

    // Self-validating with clear assertions
    expect(user).toMatchObject({
      id: expect.any(String),
      name: 'Test User',
      email: 'test@example.com',
      createdAt: expect.any(Date),
    });
  });
});
```

## Testing Diamond (2025 Model)

Modern applications benefit from a diamond-shaped distribution:

```text
       /\
      /E2E\        (10-15%) - Critical user journeys
     /------\
    /Component\    (30-40%) - UI behavior & integration
   /------------\
  / Unit Tests   \  (40-50%) - Business logic & utilities
  \--------------/
   \Performance/   (5-10%) - Benchmarks & load tests
    \--------/
```

### Why the Diamond?

- **More Component Tests**: Modern frameworks make them fast and reliable
- **Performance Tests**: Built into Vitest, essential for user experience
- **Balanced Coverage**: Better confidence with less brittleness

### Test Distribution Guidelines

```typescript
// Unit Test (40-50%) - Pure logic
export function calculateDiscount(price: number, percentage: number): number {
  if (percentage < 0 || percentage > 100) {
    throw new Error('Invalid percentage');
  }
  return price * (1 - percentage / 100);
}

// Component Test (30-40%) - UI behavior
it('applies discount when coupon is entered', async () => {
  const { user } = render(<PriceCalculator />);
  await user.type(screen.getByLabelText('Coupon'), 'SAVE20');
  await user.click(screen.getByText('Apply'));
  expect(screen.getByText('$80.00')).toBeInTheDocument();
});

// E2E Test (10-15%) - Critical path
test('checkout flow with discount', async ({ page }) => {
  await page.goto('/cart');
  await page.fill('[data-testid="coupon-input"]', 'SAVE20');
  await page.click('button:has-text("Checkout")');
  await expect(page.locator('.order-total')).toContainText('$80.00');
});

// Performance Test (5-10%) - Key metrics
bench('discount calculation', () => {
  calculateDiscount(100, 20);
});
```

## Modern Test Quality Indicators

### Excellent Tests (2025 Standards)

```typescript
// ✅ Behavior-focused with clear intent
it('prevents checkout when cart is empty', async () => {
  // Arrange - Clear setup
  const { user } = await renderCheckout({ items: [] });

  // Act - User-centric action
  await user.click(screen.getByRole('button', { name: /checkout/i }));

  // Assert - Verify behavior, not implementation
  expect(screen.getByRole('alert')).toHaveTextContent('Your cart is empty');
  expect(mockRouter.push).not.toHaveBeenCalled();
});

// ✅ Resilient to refactoring
it('calculates order total with tax', () => {
  const order = new Order([
    { price: 100, quantity: 2 },
    { price: 50, quantity: 1 },
  ]);

  expect(order.totalWithTax(0.1)).toBe(275); // Don't test internals
});
```

### Test Smells to Avoid

```typescript
// ❌ Implementation coupling
it('sets internal state correctly', () => {
  component.setState({ loading: true }); // Never do this
  expect(component.state.loading).toBe(true);
});

// ❌ Brittle selector testing
expect(wrapper.find('.btn-primary').at(2)).toExist(); // Fragile

// ❌ Time-dependent
expect(timestamp).toBe(Date.now()); // Will flake
```

## Testing Tools Comparison (2025)

### Vitest (Recommended Default)

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    globals: true,
    environment: 'happy-dom',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['**/*.test.ts', '**/*.spec.ts'],
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

**Choose Vitest when:**

- Starting new projects
- Using Vite for building
- Need fast HMR in tests
- Want native ESM support
- Require performance benchmarking
- Need in-source testing
- Want better TypeScript integration

### Jest (Legacy Projects)

**Keep Jest when:**

- Large existing test suite (>1000 tests)
- Using React Native
- Need specific Jest plugins
- Team has deep Jest expertise
- Cost of migration exceeds benefits

### Feature Comparison

| Feature            | Vitest        | Jest                   |
| ------------------ | ------------- | ---------------------- |
| ESM Support        | Native        | Requires configuration |
| TypeScript         | Native        | Requires ts-jest       |
| HMR                | Yes           | No                     |
| Benchmarking       | Built-in      | Requires plugins       |
| In-source tests    | Yes           | No                     |
| Snapshot testing   | Yes           | Yes                    |
| Coverage           | c8/v8         | Built-in               |
| Watch mode         | Intelligent   | Standard               |
| Parallel execution | Threads/Forks | Workers                |
| Configuration      | Minimal       | Extensive              |

## Test Execution Strategies

### Parallel vs Sequential

```typescript
// vitest.config.ts - Optimal parallel configuration
export default defineConfig({
  test: {
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: true, // Each file in its own thread
        isolate: true, // Full isolation
      },
    },
    sequence: {
      shuffle: true, // Randomize execution order
    },
  },
});

// Force sequential for integration tests
describe.sequential('Database Integration', () => {
  it('creates user', async () => {
    /* ... */
  });
  it('updates user', async () => {
    /* ... */
  });
  it('deletes user', async () => {
    /* ... */
  });
});
```

### Flaky Test Prevention

```typescript
// Retry flaky tests (use sparingly)
it(
  'external API call',
  async () => {
    // Test implementation
  },
  {
    retry: 3,
    timeout: 10000,
  }
);

// Better: Mock external dependencies
it('handles API response', async () => {
  server.use(
    http.get('/api/data', () => {
      return HttpResponse.json({ data: 'stable' });
    })
  );
  // Test is now deterministic
});
```

## Related Documentation

- [Test Organization](./testing-organization.md) - Modern file structure
- [Testing Standards](../standards/testing-standards.md) - Comprehensive methodology
- [Testing React Components](../patterns/testing-react-components.md) - Component testing
- [Testing Unit](../patterns/testing-unit.md) - Unit testing patterns
- [Framework-Agnostic Testing](../patterns/framework-agnostic-testing.md) - Portable patterns
