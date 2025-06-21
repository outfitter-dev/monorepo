---
slug: testing-e2e
title: Test complete user workflows with Playwright
description: End-to-end testing patterns using Playwright effectively.
type: pattern
---

# End-to-End Testing Patterns

Modern end-to-end testing with Playwright for reliable, maintainable user workflow validation.

## Related Documentation

- [Playwright Guide](../guides/playwright-guide.md) - Comprehensive Playwright setup
- [Testing Standards](../standards/testing-standards.md) - Core testing principles
- [Testing Philosophy](../conventions/testing-philosophy.md) - Testing approach
- [CI/CD Patterns](./github-actions.md) - E2E tests in pipelines

## Modern Playwright Configuration

### Optimized Setup

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';
import path from 'path';

export default defineConfig({
  testDir: './e2e',
  outputDir: './test-results',
  timeout: 30_000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : '50%',
  reporter: [
    ['html', { open: 'never' }],
    ['json', { outputFile: 'test-results.json' }],
    ['github'],
    ['list'],
  ],

  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10_000,
    navigationTimeout: 30_000,

    // Modern viewport settings
    viewport: { width: 1280, height: 720 },

    // Browser context options
    contextOptions: {
      reducedMotion: 'reduce',
      strictSelectors: true,
    },
  },

  projects: [
    {
      name: 'Desktop Chrome',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
      },
    },
    {
      name: 'Mobile Safari',
      use: {
        ...devices['iPhone 13'],
        isMobile: true,
      },
    },
    {
      name: 'Tablet',
      use: {
        ...devices['iPad Pro'],
        viewport: { width: 1024, height: 1366 },
      },
    },
  ],

  webServer: {
    command: process.env.CI ? 'npm run build && npm run start' : 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
```

### Modern Page Object Pattern

```typescript
// e2e/pages/LoginPage.ts
import { Page, Locator, expect } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;
  readonly loadingSpinner: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByLabel('Email');
    this.passwordInput = page.getByLabel('Password');
    this.submitButton = page.getByRole('button', { name: /sign in/i });
    this.errorMessage = page.getByRole('alert');
    this.loadingSpinner = page.getByTestId('loading-spinner');
  }

  async goto() {
    await this.page.goto('/login');
    await expect(this.emailInput).toBeVisible();
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();

    // Wait for loading state to complete
    await expect(this.loadingSpinner).toBeVisible();
    await expect(this.loadingSpinner).toBeHidden({ timeout: 10_000 });
  }

  async expectError(message: string) {
    await expect(this.errorMessage).toBeVisible();
    await expect(this.errorMessage).toContainText(message);
  }

  async expectSuccessfulLogin() {
    await expect(this.page).toHaveURL('/dashboard', { timeout: 10_000 });
  }
}
```

## Component Object Pattern

### Reusable Component Objects

```typescript
// e2e/components/Header.ts
import { Page, Locator, expect } from '@playwright/test';

export class HeaderComponent {
  readonly container: Locator;
  readonly userMenu: Locator;
  readonly notificationBell: Locator;
  readonly searchBar: Locator;

  constructor(page: Page) {
    this.container = page.getByRole('banner');
    this.userMenu = this.container.getByTestId('user-menu');
    this.notificationBell = this.container.getByRole('button', {
      name: /notifications/i,
    });
    this.searchBar = this.container.getByRole('searchbox');
  }

  async search(query: string) {
    await this.searchBar.fill(query);
    await this.searchBar.press('Enter');
  }

  async openUserMenu() {
    await this.userMenu.click();
    await expect(this.userMenu.getByRole('menu')).toBeVisible();
  }

  async logout() {
    await this.openUserMenu();
    await this.userMenu.getByRole('menuitem', { name: /log out/i }).click();
  }
}
```

## User Flow Testing

### Modern Authentication Flow

```typescript
// e2e/auth.spec.ts
import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { HeaderComponent } from './components/Header';

test.describe('Authentication', () => {
  let loginPage: LoginPage;
  let dashboardPage: DashboardPage;
  let header: HeaderComponent;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    dashboardPage = new DashboardPage(page);
    header = new HeaderComponent(page);
  });

  test('should complete full authentication flow', async ({ page }) => {
    // Navigate to login
    await loginPage.goto();

    // Attempt login
    await test.step('Login with valid credentials', async () => {
      await loginPage.login('user@example.com', 'password123');
      await loginPage.expectSuccessfulLogin();
    });

    // Verify dashboard state
    await test.step('Verify logged in state', async () => {
      await expect(dashboardPage.welcomeMessage).toContainText('Welcome');
      await expect(header.userMenu).toBeVisible();
    });

    // Test logout
    await test.step('Logout successfully', async () => {
      await header.logout();
      await expect(page).toHaveURL('/login');
    });
  });

  test('should handle invalid credentials gracefully', async ({ page }) => {
    await loginPage.goto();
    await loginPage.login('invalid@example.com', 'wrongpassword');
    await loginPage.expectError('Invalid email or password');

    // Ensure form is still interactive
    await expect(loginPage.emailInput).toBeEnabled();
    await expect(loginPage.submitButton).toBeEnabled();
  });

  test('should persist session across page refreshes', async ({
    page,
    context,
  }) => {
    // Login
    await loginPage.goto();
    await loginPage.login('user@example.com', 'password123');
    await loginPage.expectSuccessfulLogin();

    // Save storage state
    const storageState = await context.storageState();

    // Refresh page
    await page.reload();

    // Should still be logged in
    await expect(page).toHaveURL('/dashboard');
    await expect(dashboardPage.welcomeMessage).toBeVisible();
  });
});
```

### Shopping Cart Flow

```typescript
// e2e/shopping-cart.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Shopping Cart', () => {
  test.beforeEach(async ({ page }) => {
    // Setup: Login and go to products
    await page.goto('/login');
    await page.fill('[name="email"]', 'user@example.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
    await page.goto('/products');
  });

  test('complete purchase flow', async ({ page }) => {
    // Add products to cart
    await page.click('[data-product-id="1"] button:has-text("Add to Cart")');
    await page.click('[data-product-id="2"] button:has-text("Add to Cart")');

    // Verify cart badge
    await expect(page.locator('[data-testid="cart-count"]')).toHaveText('2');

    // Go to cart
    await page.click('[data-testid="cart-icon"]');
    await page.waitForURL('/cart');

    // Verify items in cart
    await expect(page.locator('.cart-item')).toHaveCount(2);

    // Update quantity
    await page.fill('[data-product-id="1"] input[name="quantity"]', '3');
    await page.press('[data-product-id="1"] input[name="quantity"]', 'Enter');

    // Proceed to checkout
    await page.click('button:has-text("Proceed to Checkout")');
    await page.waitForURL('/checkout');

    // Fill shipping info
    await page.fill('[name="fullName"]', 'John Doe');
    await page.fill('[name="address"]', '123 Main St');
    await page.fill('[name="city"]', 'New York');
    await page.fill('[name="zipCode"]', '10001');

    // Fill payment info
    await page.fill('[name="cardNumber"]', '4242424242424242');
    await page.fill('[name="expiryDate"]', '12/25');
    await page.fill('[name="cvv"]', '123');

    // Complete order
    await page.click('button:has-text("Place Order")');

    // Wait for confirmation
    await page.waitForURL(/\/order\/[\w-]+/);
    await expect(page.locator('h1')).toContainText('Order Confirmed');
    await expect(page.locator('[data-testid="order-number"]')).toBeVisible();
  });
});
```

## Advanced Testing Patterns

### Network Stubbing and Mocking

```typescript
import { test, expect } from '@playwright/test';

test.describe('API Integration', () => {
  test('should handle API errors with retry mechanism', async ({ page }) => {
    let attemptCount = 0;

    // Mock API with intermittent failures
    await page.route('**/api/products', route => {
      attemptCount++;
      if (attemptCount < 3) {
        route.fulfill({
          status: 500,
          body: JSON.stringify({ error: 'Server Error' }),
        });
      } else {
        route.fulfill({
          status: 200,
          body: JSON.stringify({ products: [{ id: 1, name: 'Product' }] }),
        });
      }
    });

    await page.goto('/products');

    // Verify retry UI
    await expect(page.getByText('Failed to load products')).toBeVisible();
    await page.getByRole('button', { name: 'Retry' }).click();

    // Should eventually succeed
    await expect(page.getByText('Product')).toBeVisible({ timeout: 15_000 });
    expect(attemptCount).toBe(3);
  });

  test('should implement optimistic updates with rollback', async ({
    page,
  }) => {
    const originalName = 'John Doe';
    const newName = 'Jane Smith';

    // Setup initial state
    await page.route('**/api/users/profile', route => {
      if (route.request().method() === 'GET') {
        route.fulfill({
          status: 200,
          body: JSON.stringify({ name: originalName }),
        });
      } else if (route.request().method() === 'PUT') {
        // Simulate failure
        route.fulfill({
          status: 400,
          body: JSON.stringify({ error: 'Invalid name' }),
        });
      }
    });

    await page.goto('/profile');

    // Update profile
    await page.fill('[name="displayName"]', newName);
    await page.click('button:has-text("Save")');

    // Verify optimistic update
    await expect(page.locator('.profile-name')).toHaveText(newName);

    // Verify rollback after error
    await expect(page.getByRole('alert')).toContainText('Invalid name');
    await expect(page.locator('.profile-name')).toHaveText(originalName);
  });
});
```

## Visual Testing Strategies

### Responsive Visual Testing

```typescript
import { test, expect, devices } from '@playwright/test';

test.describe('Visual Regression', () => {
  // Test across different viewports
  for (const [name, viewport] of Object.entries({
    desktop: { width: 1920, height: 1080 },
    tablet: { width: 768, height: 1024 },
    mobile: { width: 375, height: 667 },
  })) {
    test(`dashboard layout on ${name}`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto('/dashboard');

      // Wait for dynamic content
      await page.waitForLoadState('networkidle');

      await expect(page).toHaveScreenshot(`dashboard-${name}.png`, {
        fullPage: true,
        animations: 'disabled',
        mask: [page.locator('[data-testid="timestamp"]')],
      });
    });
  }

  test('component visual states', async ({ page }) => {
    await page.goto('/components');

    const button = page.locator('[data-testid="primary-button"]');

    // Normal state
    await expect(button).toHaveScreenshot('button-normal.png');

    // Hover state
    await button.hover();
    await expect(button).toHaveScreenshot('button-hover.png');

    // Focus state
    await button.focus();
    await expect(button).toHaveScreenshot('button-focus.png');

    // Active state
    await button.click({ delay: 100 });
    await expect(button).toHaveScreenshot('button-active.png');
  });
});
```

## Performance and Metrics Testing

```typescript
import { test, expect } from '@playwright/test';

test.describe('Performance Metrics', () => {
  test('should meet Core Web Vitals thresholds', async ({ page }) => {
    // Start CDP session for detailed metrics
    const client = await page.context().newCDPSession(page);
    await client.send('Performance.enable');

    await page.goto('/');

    // Collect Web Vitals
    const vitals = await page.evaluate(() => {
      return new Promise(resolve => {
        let cls = 0;
        let fid = 0;
        let lcp = 0;

        // Observe CLS
        new PerformanceObserver(list => {
          for (const entry of list.getEntries()) {
            if ((entry as any).hadRecentInput) continue;
            cls += (entry as any).value;
          }
        }).observe({ type: 'layout-shift', buffered: true });

        // Observe LCP
        new PerformanceObserver(list => {
          const entries = list.getEntries();
          lcp = entries[entries.length - 1].startTime;
        }).observe({ type: 'largest-contentful-paint', buffered: true });

        // Resolve after paint
        setTimeout(() => {
          resolve({ cls, lcp, fid });
        }, 3000);
      });
    });

    // Assert thresholds
    expect(vitals.lcp).toBeLessThan(2500); // Good LCP
    expect(vitals.cls).toBeLessThan(0.1); // Good CLS
  });

  test('should handle slow network gracefully', async ({ page, context }) => {
    // Simulate slow 3G
    const client = await context.newCDPSession(page);
    await client.send('Network.enable');
    await client.send('Network.emulateNetworkConditions', {
      offline: false,
      downloadThroughput: (50 * 1024) / 8, // 50kb/s
      uploadThroughput: (50 * 1024) / 8,
      latency: 400,
    });

    await page.goto('/');

    // Should show loading states
    await expect(page.getByTestId('skeleton-loader')).toBeVisible();

    // Content should eventually load
    await expect(page.getByRole('main')).toBeVisible({ timeout: 30_000 });
  });
});
```

## Accessibility and Usability Testing

```typescript
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility Compliance', () => {
  test('should meet WCAG 2.1 AA standards', async ({ page }, testInfo) => {
    await page.goto('/');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    // Attach results to test report
    await testInfo.attach('accessibility-scan-results', {
      body: JSON.stringify(accessibilityScanResults, null, 2),
      contentType: 'application/json',
    });

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should support keyboard navigation patterns', async ({ page }) => {
    await page.goto('/');

    // Test skip links
    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toHaveText('Skip to main content');

    // Test focus trap in modal
    await page.getByRole('button', { name: 'Open Modal' }).click();
    const modal = page.getByRole('dialog');
    await expect(modal).toBeFocused();

    // Tab should cycle within modal
    const focusableElements = await modal
      .locator('button, input, [tabindex="0"]')
      .all();
    for (let i = 0; i < focusableElements.length + 1; i++) {
      await page.keyboard.press('Tab');
    }

    // Focus should wrap back to first element
    await expect(focusableElements[0]).toBeFocused();

    // Escape should close modal
    await page.keyboard.press('Escape');
    await expect(modal).toBeHidden();
  });

  test('should announce dynamic content to screen readers', async ({
    page,
  }) => {
    await page.goto('/');

    // Monitor ARIA live regions
    const liveRegion = page.getByRole('status');

    // Trigger an action that updates live region
    await page.getByRole('button', { name: 'Add to Cart' }).click();

    // Verify announcement
    await expect(liveRegion).toHaveText('Item added to cart');
    await expect(liveRegion).toHaveAttribute('aria-live', 'polite');
  });
});
```

## Advanced Test Fixtures and Data Management

```typescript
// e2e/fixtures/index.ts
import { test as base, expect } from '@playwright/test';
import { TestUser, TestOrganization, TestDatabase } from './types';

type TestFixtures = {
  testUser: TestUser;
  authenticatedPage: Page;
  testOrg: TestOrganization;
  testDb: TestDatabase;
};

type WorkerFixtures = {
  sharedAuth: string;
};

export const test = base.extend<TestFixtures, WorkerFixtures>({
  // Worker-scoped fixture for shared auth
  sharedAuth: [
    async ({}, use) => {
      const token = await getSharedAuthToken();
      await use(token);
    },
    { scope: 'worker' },
  ],

  // Test-scoped fixtures
  testUser: async ({ testDb }, use) => {
    const user = await testDb.createUser({
      email: `test-${Date.now()}@example.com`,
      role: 'user',
    });

    await use(user);

    // Cleanup
    await testDb.deleteUser(user.id);
  },

  authenticatedPage: async ({ page, testUser }, use) => {
    // Inject auth state
    await page.addInitScript(user => {
      window.localStorage.setItem('auth_token', user.token);
    }, testUser);

    await use(page);
  },

  testOrg: async ({ testDb, testUser }, use) => {
    const org = await testDb.createOrganization({
      name: `Test Org ${Date.now()}`,
      ownerId: testUser.id,
    });

    await use(org);

    await testDb.deleteOrganization(org.id);
  },

  testDb: async ({}, use) => {
    const db = new TestDatabase();
    await db.connect();

    await use(db);

    await db.disconnect();
  },
});

// Usage with multiple fixtures
test('should manage organization settings', async ({
  authenticatedPage,
  testOrg,
  testUser,
}) => {
  await authenticatedPage.goto(`/orgs/${testOrg.id}/settings`);

  // User should have admin access
  await expect(authenticatedPage.getByRole('heading')).toContainText(
    'Organization Settings'
  );
  await expect(authenticatedPage.getByText(testUser.email)).toBeVisible();
});
```

## CI/CD Integration and Parallelization

```yaml
# .github/workflows/e2e.yml
name: E2E Tests

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    name: E2E Tests - Shard ${{ matrix.shardIndex }}/${{ matrix.shardTotal }}
    runs-on: ubuntu-latest
    strategy:
      fail-fast: false
      matrix:
        shardIndex: [1, 2, 3, 4]
        shardTotal: [4]

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright
        run: npx playwright install --with-deps chromium

      - name: Run E2E tests
        run: |
          npx playwright test \
            --shard=${{ matrix.shardIndex }}/${{ matrix.shardTotal }} \
            --reporter=blob
        env:
          BASE_URL: ${{ secrets.STAGING_URL }}
          TEST_PARALLEL: true

      - name: Upload blob report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: blob-report-${{ matrix.shardIndex }}
          path: blob-report
          retention-days: 1

  merge-reports:
    if: always()
    needs: [test]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Install dependencies
        run: npm ci

      - name: Download blob reports
        uses: actions/download-artifact@v4
        with:
          path: all-blob-reports
          pattern: blob-report-*

      - name: Merge reports
        run: npx playwright merge-reports --reporter html ./all-blob-reports

      - name: Upload HTML report
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: playwright-report
          retention-days: 14
```

## Best Practices Summary

1. **Use Page Objects** - Encapsulate page interactions
2. **Leverage Fixtures** - Share setup/teardown logic
3. **Test User Journeys** - Focus on real workflows
4. **Handle Async Properly** - Use Playwright's auto-waiting
5. **Mock External Services** - Keep tests deterministic
6. **Parallelize Tests** - Use sharding for speed
7. **Monitor Flakiness** - Track and fix flaky tests
8. **Accessibility First** - Include a11y in E2E tests
