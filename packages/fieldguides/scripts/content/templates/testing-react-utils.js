/*
---

slug: testing-react-utils
title: React Testing Library utilities with dual Jest/Vitest support
description: Custom render functions and utilities for testing React components with MSW 2.0.
type: template
---

*/
// Custom test utilities for React applications with dual Jest/Vitest support

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render as rtlRender, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';

// Detect test runner
const isVitest = typeof globalThis.vi !== 'undefined';
const isJest = typeof jest !== 'undefined';
// Export appropriate mocking utilities
export const vi = isVitest ? globalThis.vi : undefined;
export const mockFn = isVitest
  ? vi.fn
  : isJest
    ? jest.fn
    : () => {
        throw new Error('No test runner detected');
      };
export const spyOn = isVitest
  ? vi.spyOn
  : isJest
    ? jest.spyOn
    : () => {
        throw new Error('No test runner detected');
      };

import { delay, HttpResponse, http } from 'msw';
// MSW 2.0 Setup
import { setupServer } from 'msw/node';
// Example MSW handlers
export const handlers = [
  http.get('/api/user', async () => {
    await delay(100); // Simulate network delay
    return HttpResponse.json({
      id: '1',
      name: 'Test User',
      email: 'test@example.com',
    });
  }),
  http.post('/api/login', async ({ request }) => {
    const body = await request.json();
    if (body.email === 'test@example.com' && body.password === 'password') {
      return HttpResponse.json({
        token: 'fake-jwt-token',
        user: { id: '1', email: body.email },
      });
    }
    return HttpResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }),
];
// Create MSW server
export const server = setupServer(...handlers);
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: Number.POSITIVE_INFINITY, // Never garbage collect during tests
        staleTime: 0,
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
function_AllTheProviders({ children, initialEntries = ['/'] }) {
  const queryClient = createTestQueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{children}</BrowserRouter>
    </QueryClientProvider>
  );
}
function ExtendedProviders({
  children,
  initialEntries = ['/'],
  theme = 'light',
  user = null,
}) {
  const queryClient = createTestQueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {/* Add your app-specific providers here */}
        {/* <ThemeProvider theme={theme}> */}
        {/* <AuthContext.Provider value={{ user }}> */}
        {children}
        {/* </AuthContext.Provider> */}
        {/* </ThemeProvider> */}
      </BrowserRouter>
    </QueryClientProvider>
  );
}
export function render(
  ui,
  { initialEntries = ['/'], route = '/', providerProps = {}, ...options } = {}
) {
  // Set initial route
  window.history.pushState({}, 'Test page', route);
  const user = userEvent.setup();
  const Wrapper = ({ children }) => (
    <ExtendedProviders initialEntries={initialEntries} {...providerProps}>
      {children}
    </ExtendedProviders>
  );
  return {
    user,
    ...rtlRender(ui, { wrapper: Wrapper, ...options }),
  };
}
// Re-export everything from React Testing Library
export * from '@testing-library/react';
// Custom assertions (works with both Jest and Vitest)
export function expectToBeLoading(element) {
  expect(element).toHaveAttribute('aria-busy', 'true');
}
export function expectToHaveError(element, error) {
  expect(element).toHaveAttribute('aria-invalid', 'true');
  expect(element).toHaveAccessibleDescription(error);
}
// Enhanced wait helpers
export async function waitForLoadingToFinish(container = document) {
  await waitFor(
    () => {
      expect(
        container.querySelector('[aria-busy="true"]')
      ).not.toBeInTheDocument();
    },
    { timeout: 3000 }
  );
}
export async function waitForElementToBeRemoved(
  callback,
  options = { timeout: 3000 }
) {
  await waitFor(() => {
    expect(callback()).not.toBeInTheDocument();
  }, options);
}
export function createMockUser(overrides = {}) {
  const now = new Date().toISOString();
  return {
    id: '1',
    email: '<test@example.com>',
    name: 'Test User',
    avatar: '<https://example.com/avatar.jpg>',
    role: 'user',
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}
export function createMockPost(overrides = {}) {
  return {
    id: '1',
    title: 'Test Post',
    content: 'This is a test post content',
    authorId: '1',
    published: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}
// Test utilities for forms
export async function fillForm(user, fields) {
  for (const [name, value] of Object.entries(fields)) {
    const input = screen.getByLabelText(new RegExp(name, 'i'));
    await user.clear(input);
    await user.type(input, value);
  }
}
// Accessibility testing helpers
export function expectToBeAccessible(container) {
  // Check for common accessibility issues
  const images = container.querySelectorAll('img');
  images.forEach((img) => {
    expect(img).toHaveAttribute('alt');
  });
  const buttons = container.querySelectorAll('button');
  buttons.forEach((button) => {
    expect(button).toHaveAccessibleName();
  });
  const inputs = container.querySelectorAll('input, select, textarea');
  inputs.forEach((input) => {
    const label = container.querySelector(`label[for="${input.id}"]`);
    expect(label || input.getAttribute('aria-label')).toBeTruthy();
  });
}
// Setup and teardown utilities
export function setupMockServer() {
  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());
}
// Example test file using these utilities:
/*
import { render, screen, waitFor, server, http, HttpResponse } from '@/test-utils';
import { UserProfile } from '@/components/UserProfile';

describe('UserProfile', () => {
  it('should display user information', async () => {
    const { user } = render(<UserProfile userId="1" />);

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });
    
    // Interact with the component
    await user.click(screen.getByRole('button', { name: /edit/i }));
    
    // Assert on the result
    expect(screen.getByRole('form')).toBeInTheDocument();
  });
  
  it('should handle API errors', async () => {
    // Override the default handler for this test
    server.use(
      http.get('/api/user', () => {
        return HttpResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      })
    );

    render(<UserProfile userId="999" />);
    
    await waitFor(() => {
      expect(screen.getByText(/user not found/i)).toBeInTheDocument();
    });
  });
});
*/
//# sourceMappingURL=testing-react-utils.js.map
