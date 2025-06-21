---
slug: playwright-guide
title: End-to-end testing with Playwright
description: E2E testing with auto-waiting and multi-browser support.
type: guide
---

# Playwright Guide

Reliable end-to-end testing for modern web applications with auto-waiting and cross-browser support.

## Overview

Playwright enables reliable end-to-end testing across all modern browsers with a single API. It provides auto-waiting, web-first assertions, and powerful debugging capabilities.

## Installation

```bash
# Install Playwright
pnpm add -D @playwright/test

# Install browsers (chromium, firefox, webkit)
pnpm exec playwright install

# Optional: Install only specific browsers
pnpm exec playwright install chromium
```

## Project Setup

### Configuration

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
  ],

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15000,
    navigationTimeout: 30000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    // Mobile testing
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
```

## Writing Tests

### Basic Test Structure

```typescript
// e2e/auth.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should login successfully', async ({ page }) => {
    await page.goto('/login');

    // Fill login form
    await page.getByLabel('Email').fill('user@example.com');
    await page.getByLabel('Password').fill('password123');

    // Submit form
    await page.getByRole('button', { name: 'Sign in' }).click();

    // Assert successful login
    await expect(page).toHaveURL('/dashboard');
    await expect(page.getByText('Welcome back!')).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login');

    await page.getByLabel('Email').fill('wrong@example.com');
    await page.getByLabel('Password').fill('wrongpassword');
    await page.getByRole('button', { name: 'Sign in' }).click();

    await expect(page.getByText('Invalid credentials')).toBeVisible();
    await expect(page).toHaveURL('/login');
  });
});
```

### Page Object Model

```typescript
// e2e/pages/LoginPage.ts
import { Page, Locator, expect } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByLabel('Email');
    this.passwordInput = page.getByLabel('Password');
    this.submitButton = page.getByRole('button', { name: 'Sign in' });
    this.errorMessage = page.getByRole('alert');
  }

  async goto() {
    await this.page.goto('/login');
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async expectError(message: string) {
    await expect(this.errorMessage).toContainText(message);
  }
}

// Using the page object
test('login with page object', async ({ page }) => {
  const loginPage = new LoginPage(page);

  await loginPage.goto();
  await loginPage.login('user@example.com', 'password123');

  await expect(page).toHaveURL('/dashboard');
});
```

## Advanced Patterns

### Test Fixtures

```typescript
// e2e/fixtures/auth.fixture.ts
import { test as base, Page } from '@playwright/test';

type AuthFixtures = {
  authenticatedPage: Page;
};

export const test = base.extend<AuthFixtures>({
  authenticatedPage: async ({ page, context }, use) => {
    // Set auth cookie or localStorage
    await context.addCookies([
      {
        name: 'auth-token',
        value: 'test-token',
        domain: 'localhost',
        path: '/',
      },
    ]);

    // Or use localStorage
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('auth-token', 'test-token');
    });

    await use(page);
  },
});

// Using the fixture
test('authenticated user flow', async ({ authenticatedPage }) => {
  await authenticatedPage.goto('/profile');
  await expect(authenticatedPage.getByText('My Profile')).toBeVisible();
});
```

### API Testing

```typescript
// e2e/api.spec.ts
import { test, expect, APIRequestContext } from '@playwright/test';

test.describe('API Tests', () => {
  let apiContext: APIRequestContext;

  test.beforeAll(async ({ playwright }) => {
    apiContext = await playwright.request.newContext({
      baseURL: 'http://localhost:3000/api',
      extraHTTPHeaders: {
        Accept: 'application/json',
        Authorization: 'Bearer test-token',
      },
    });
  });

  test.afterAll(async () => {
    await apiContext.dispose();
  });

  test('should create a new user', async () => {
    const response = await apiContext.post('/users', {
      data: {
        name: 'Test User',
        email: 'test@example.com',
      },
    });

    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(201);

    const user = await response.json();
    expect(user).toHaveProperty('id');
    expect(user.email).toBe('test@example.com');
  });

  test('should handle API errors', async () => {
    const response = await apiContext.get('/users/999');

    expect(response.status()).toBe(404);
    const error = await response.json();
    expect(error.message).toBe('User not found');
  });
});
```

### Network Interception

```typescript
// e2e/network.spec.ts
test('should mock API responses', async ({ page }) => {
  // Mock successful response
  await page.route('**/api/users', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        { id: 1, name: 'John Doe' },
        { id: 2, name: 'Jane Smith' },
      ]),
    });
  });

  await page.goto('/users');
  await expect(page.getByText('John Doe')).toBeVisible();
  await expect(page.getByText('Jane Smith')).toBeVisible();
});

test('should wait for specific requests', async ({ page }) => {
  // Wait for specific request
  const responsePromise = page.waitForResponse('**/api/data');

  await page.goto('/dashboard');
  await page.getByRole('button', { name: 'Load Data' }).click();

  const response = await responsePromise;
  expect(response.status()).toBe(200);
});
```

## Visual Testing

### Screenshot Testing

```typescript
// e2e/visual.spec.ts
test('visual regression tests', async ({ page }) => {
  await page.goto('/');

  // Full page screenshot
  await expect(page).toHaveScreenshot('homepage.png', {
    fullPage: true,
    animations: 'disabled',
  });

  // Component screenshot
  const header = page.getByRole('banner');
  await expect(header).toHaveScreenshot('header.png');

  // Mask dynamic content
  await expect(page).toHaveScreenshot('masked-content.png', {
    mask: [page.locator('.timestamp'), page.locator('.user-avatar')],
  });
});

// Update snapshots: pnpm playwright test --update-snapshots
```

### Visual Comparison Configuration

```typescript
// playwright.config.ts
export default defineConfig({
  use: {
    // Visual regression settings
    ignoreHTTPSErrors: true,
    viewport: { width: 1280, height: 720 },
  },

  expect: {
    // Threshold for pixel differences
    toHaveScreenshot: { threshold: 0.2 },
  },
});
```

## CI/CD Integration

### GitHub Actions

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
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v2
        with:
          version: 8

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install

      - name: Install Playwright browsers
        run: pnpm exec playwright install --with-deps

      - name: Run E2E tests
        run: pnpm exec playwright test

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30
```

### Parallel Testing

```typescript
// playwright.config.ts
export default defineConfig({
  // Run tests in parallel
  fullyParallel: true,

  // Limit workers in CI
  workers: process.env.CI ? 2 : undefined,

  // Shard tests across multiple machines
  shard: process.env.CI
    ? {
        current: Number(process.env.SHARD_INDEX) || 1,
        total: Number(process.env.TOTAL_SHARDS) || 1,
      }
    : undefined,
});
```

## Debugging

### Debug Mode

```bash
# Run in debug mode
pnpm playwright test --debug

# Debug specific test
pnpm playwright test auth.spec.ts --debug

# Use Playwright Inspector
PWDEBUG=1 pnpm playwright test
```

### Trace Viewer

```typescript
// Enable tracing in config
export default defineConfig({
  use: {
    trace: 'on-first-retry',
  },
});

// View traces
// pnpm playwright show-trace trace.zip
```

### Test Helpers

```typescript
// e2e/helpers/debug.ts
import { Page } from '@playwright/test';

export async function pauseOnFailure(page: Page, error: Error) {
  if (process.env.PAUSE_ON_FAILURE) {
    console.error('Test failed:', error);
    console.log('Pausing for debugging...');
    await page.pause();
  }
}

// Usage in tests
test('complex flow', async ({ page }) => {
  try {
    await page.goto('/complex-page');
    // ... test steps
  } catch (error) {
    await pauseOnFailure(page, error);
    throw error;
  }
});
```

## Best Practices

1. **Use web-first assertions**: Let Playwright handle waiting
2. **Avoid hard waits**: Use auto-waiting instead of `page.waitForTimeout()`
3. **Keep tests independent**: Each test should run in isolation
4. **Use descriptive locators**: Prefer user-facing attributes
5. **Implement Page Objects**: For complex applications
6. **Run tests in CI**: Catch issues before deployment

## Common Patterns

### Authentication State

```typescript
// Save auth state
const authFile = 'playwright/.auth/user.json';

test('authenticate', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill('user@example.com');
  await page.getByLabel('Password').fill('password');
  await page.getByRole('button', { name: 'Sign in' }).click();

  await page.waitForURL('/dashboard');
  await page.context().storageState({ path: authFile });
});

// Reuse auth state
export default defineConfig({
  projects: [
    {
      name: 'authenticated',
      use: { storageState: authFile },
    },
  ],
});
```

### Mobile Testing

```typescript
test.describe('Mobile', () => {
  test.use({ ...devices['iPhone 12'] });

  test('responsive design', async ({ page }) => {
    await page.goto('/');

    // Check mobile menu
    await page.getByRole('button', { name: 'Menu' }).click();
    await expect(page.getByRole('navigation')).toBeVisible();

    // Test touch interactions
    await page.getByText('Swipe for more').swipe('left');
  });
});
```
