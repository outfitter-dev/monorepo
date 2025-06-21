---
slug: testing-react-components
title: Test React components from the user's perspective
description: Testing React components focusing on user behavior and accessibility.
type: pattern
---

# React Testing Library Patterns

Testing React components with @testing-library/react, focusing on user behavior and accessibility.

## Related Documentation

- [React Component Standards](../standards/react-component-standards.md) - Component architecture
- [Testing Standards](../standards/testing-standards.md) - Testing fundamentals
- [React Patterns](./react-patterns.md) - Component patterns
- [TypeScript Standards](../standards/typescript-standards.md) - Type-safe testing

## Overview

React Testing Library encourages testing components the way users interact with them, rather than testing implementation details. This approach leads to more maintainable tests that give confidence your components work correctly from a user's perspective.

## Framework Setup

### Vitest Setup

```bash
npm install --save-dev @testing-library/react @testing-library/user-event @testing-library/jest-dom vitest happy-dom
```

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'happy-dom',
    setupFiles: ['./test/setup.ts'],
    globals: true,
  },
});

// test/setup.ts
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
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
```

### Jest Setup

```bash
npm install --save-dev @testing-library/react @testing-library/user-event @testing-library/jest-dom jest @types/jest jest-environment-jsdom
```

```typescript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
};

// test/setup.ts
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});
```

## Basic Component Testing

```typescript
// Vitest
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { Button } from './Button';

describe('Button', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
  });

  it('handles click events', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();

    render(<Button onClick={handleClick}>Click me</Button>);
    await user.click(screen.getByRole('button'));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('disables button when loading', () => {
    render(<Button loading>Submit</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('applies variant classes correctly', () => {
    const { rerender } = render(<Button variant="destructive">Delete</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-destructive');

    rerender(<Button variant="outline">Cancel</Button>);
    expect(screen.getByRole('button')).toHaveClass('border');
  });
});

// Jest (differences highlighted)
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './Button';

describe('Button', () => {
  it('handles click events', async () => {
    const handleClick = jest.fn(); // jest.fn() instead of vi.fn()
    const user = userEvent.setup();

    render(<Button onClick={handleClick}>Click me</Button>);
    await user.click(screen.getByRole('button'));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

## Testing Custom Hooks

```typescript
import { renderHook, act } from '@testing-library/react';
import { usePagination } from './usePagination';

describe('usePagination', () => {
  it('calculates pagination correctly', () => {
    const { result } = renderHook(() =>
      usePagination({ totalItems: 100, itemsPerPage: 10 })
    );

    expect(result.current.totalPages).toBe(10);
    expect(result.current.currentPage).toBe(1);
    expect(result.current.hasNext).toBe(true);
    expect(result.current.hasPrevious).toBe(false);
  });

  it('navigates between pages', () => {
    const { result } = renderHook(() =>
      usePagination({ totalItems: 100, itemsPerPage: 10 })
    );

    act(() => {
      result.current.nextPage();
    });

    expect(result.current.currentPage).toBe(2);
    expect(result.current.hasPrevious).toBe(true);

    act(() => {
      result.current.goToPage(5);
    });

    expect(result.current.currentPage).toBe(5);
    expect(result.current.startIndex).toBe(40);
    expect(result.current.endIndex).toBe(50);
  });

  it('handles edge cases', () => {
    const { result } = renderHook(() =>
      usePagination({ totalItems: 25, itemsPerPage: 10 })
    );

    // Try to go beyond last page
    act(() => {
      result.current.goToPage(10);
    });

    expect(result.current.currentPage).toBe(3); // Should cap at totalPages

    // Try to go before first page
    act(() => {
      result.current.goToPage(0);
    });

    expect(result.current.currentPage).toBe(1); // Should floor at 1
  });
});
```

## Testing Forms

```typescript
// Vitest example
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { LoginForm } from './LoginForm';
import { api } from '@/lib/api';

// Mock the API
vi.mock('@/lib/api', () => ({
  api: {
    login: vi.fn(),
  },
}));

describe('LoginForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('submits form with valid data', async () => {
    const user = userEvent.setup();
    vi.mocked(api.login).mockResolvedValue({ ok: true, data: { token: 'abc123' } });

    render(<LoginForm />);

    // Fill in form fields
    await user.type(screen.getByLabelText(/email/i), 'user@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByLabelText(/remember me/i));

    // Submit form
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    // Verify API was called with correct data
    await waitFor(() => {
      expect(api.login).toHaveBeenCalledWith({
        email: 'user@example.com',
        password: 'password123',
        rememberMe: true,
      });
    });
  });
});

// Jest example
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from './LoginForm';
import { api } from '@/lib/api';

// Mock the API
jest.mock('@/lib/api', () => ({
  api: {
    login: jest.fn(),
  },
}));

describe('LoginForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('submits form with valid data', async () => {
    const user = userEvent.setup();
    jest.mocked(api.login).mockResolvedValue({ ok: true, data: { token: 'abc123' } });

    render(<LoginForm />);

    // Fill in form fields
    await user.type(screen.getByLabelText(/email/i), 'user@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByLabelText(/remember me/i));

    // Submit form
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    // Verify API was called with correct data
    await waitFor(() => {
      expect(api.login).toHaveBeenCalledWith({
        email: 'user@example.com',
        password: 'password123',
        rememberMe: true,
      });
    });
  });
});
```

## Testing Async Components

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { UserProfile } from './UserProfile';
import { api } from '@/lib/api';

vi.mock('@/lib/api');

// Helper to wrap component with providers
function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  );
}

describe('UserProfile', () => {
  it('displays loading state initially', () => {
    api.getUser.mockImplementation(() => new Promise(() => {})); // Never resolves

    renderWithProviders(<UserProfile userId="123" />);

    expect(screen.getByTestId('skeleton')).toBeInTheDocument();
  });

  it('displays user data when loaded', async () => {
    api.getUser.mockResolvedValue({
      ok: true,
      data: { id: '123', name: 'John Doe', email: 'john@example.com' },
    });

    renderWithProviders(<UserProfile userId="123" />);

    expect(await screen.findByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
  });

  it('displays error state on failure', async () => {
    api.getUser.mockResolvedValue({
      ok: false,
      error: { code: 'notFound', message: 'User not found' },
    });

    renderWithProviders(<UserProfile userId="123" />);

    expect(await screen.findByText(/user not found/i)).toBeInTheDocument();
  });
});
```

## Accessibility Testing

```typescript
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Form } from './Form';

expect.extend(toHaveNoViolations);

describe('Form Accessibility', () => {
  it('has no accessibility violations', async () => {
    const { container } = render(<Form />);
    const results = await axe(container);

    expect(results).toHaveNoViolations();
  });

  it('has proper ARIA labels', () => {
    render(<Form />);

    const emailInput = screen.getByLabelText(/email address/i);
    expect(emailInput).toHaveAttribute('type', 'email');
    expect(emailInput).toHaveAttribute('required');

    const submitButton = screen.getByRole('button', { name: /submit/i });
    expect(submitButton).toHaveAttribute('type', 'submit');
  });

  it('announces errors to screen readers', async () => {
    const user = userEvent.setup();
    render(<Form />);

    const emailInput = screen.getByLabelText(/email/i);
    await user.type(emailInput, 'invalid-email');
    await user.tab(); // Trigger blur validation

    const errorMessage = await screen.findByRole('alert');
    expect(errorMessage).toHaveTextContent(/invalid email/i);
    expect(emailInput).toHaveAttribute('aria-invalid', 'true');
    expect(emailInput).toHaveAttribute('aria-describedby', expect.stringContaining('error'));
  });
});
```

## Testing Custom Queries

```typescript
// test-utils.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, RenderOptions } from '@testing-library/react';

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        cacheTime: 0,
        staleTime: 0,
      },
    },
  });
}

interface AllProvidersProps {
  children: React.ReactNode;
}

export function AllProviders({ children }: AllProvidersProps) {
  const queryClient = createTestQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

export function renderWithProviders(
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, { wrapper: AllProviders, ...options });
}

// Usage in tests
import { renderWithProviders } from '@/test/test-utils';

describe('UserList', () => {
  it('fetches and displays users', async () => {
    renderWithProviders(<UserList />);

    expect(await screen.findByText('John Doe')).toBeInTheDocument();
  });
});
```

## Interaction Testing

```typescript
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TodoList } from './TodoList';

describe('TodoList', () => {
  it('adds new todo items', async () => {
    const user = userEvent.setup();
    render(<TodoList />);

    const input = screen.getByPlaceholderText(/add a new todo/i);
    const addButton = screen.getByRole('button', { name: /add/i });

    // Add first todo
    await user.type(input, 'Buy groceries');
    await user.click(addButton);

    expect(screen.getByText('Buy groceries')).toBeInTheDocument();
    expect(input).toHaveValue(''); // Input should be cleared

    // Add second todo
    await user.type(input, 'Walk the dog');
    await user.keyboard('{Enter}'); // Test keyboard submission

    expect(screen.getByText('Walk the dog')).toBeInTheDocument();
  });

  it('marks todos as complete', async () => {
    const user = userEvent.setup();
    render(<TodoList initialTodos={[
      { id: '1', text: 'Test todo', completed: false }
    ]} />);

    const todoItem = screen.getByText('Test todo');
    const checkbox = within(todoItem.parentElement!).getByRole('checkbox');

    expect(checkbox).not.toBeChecked();

    await user.click(checkbox);

    expect(checkbox).toBeChecked();
    expect(todoItem).toHaveClass('line-through');
  });

  it('filters todos by status', async () => {
    const user = userEvent.setup();
    render(<TodoList initialTodos={[
      { id: '1', text: 'Active todo', completed: false },
      { id: '2', text: 'Completed todo', completed: true }
    ]} />);

    // All todos visible by default
    expect(screen.getByText('Active todo')).toBeInTheDocument();
    expect(screen.getByText('Completed todo')).toBeInTheDocument();

    // Filter to active only
    await user.click(screen.getByRole('button', { name: /active/i }));
    expect(screen.getByText('Active todo')).toBeInTheDocument();
    expect(screen.queryByText('Completed todo')).not.toBeInTheDocument();

    // Filter to completed only
    await user.click(screen.getByRole('button', { name: /completed/i }));
    expect(screen.queryByText('Active todo')).not.toBeInTheDocument();
    expect(screen.getByText('Completed todo')).toBeInTheDocument();
  });
});
```

## Testing Error Boundaries

```typescript
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from './ErrorBoundary';

// Component that throws an error
function ThrowError() {
  throw new Error('Test error');
}

// Mock console.error to avoid noise in test output
const originalError = console.error;
beforeAll(() => {
  console.error = vi.fn();
});

afterAll(() => {
  console.error = originalError;
});

describe('ErrorBoundary', () => {
  it('displays fallback UI on error', () => {
    render(
      <ErrorBoundary fallback={<div>Something went wrong</div>}>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('resets error state', async () => {
    const user = userEvent.setup();
    let throwError = true;

    function ConditionalError() {
      if (throwError) throw new Error('Test error');
      return <div>No error</div>;
    }

    const { rerender } = render(
      <ErrorBoundary
        fallback={({ reset }) => (
          <div>
            <p>Error occurred</p>
            <button onClick={reset}>Reset</button>
          </div>
        )}
      >
        <ConditionalError />
      </ErrorBoundary>
    );

    expect(screen.getByText('Error occurred')).toBeInTheDocument();

    throwError = false;
    await user.click(screen.getByRole('button', { name: /reset/i }));

    rerender(
      <ErrorBoundary>
        <ConditionalError />
      </ErrorBoundary>
    );

    expect(screen.getByText('No error')).toBeInTheDocument();
  });
});
```

## React 19 Patterns

### Testing Server Components

```typescript
// Vitest example
import { render, screen } from '@testing-library/react';
import { Suspense } from 'react';
import { vi } from 'vitest';

// Mock React cache for server components
vi.mock('react', async () => {
  const actual = await vi.importActual('react');
  return {
    ...actual,
    cache: (fn: Function) => fn,
  };
});

// Server Component
async function UserProfile({ userId }: { userId: string }) {
  const user = await fetchUser(userId);

  return (
    <div>
      <h1>{user.name}</h1>
      <p>{user.email}</p>
    </div>
  );
}

// Test
describe('UserProfile Server Component', () => {
  it('renders user data', async () => {
    vi.mocked(fetchUser).mockResolvedValue({
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
    });

    const { container } = render(
      <Suspense fallback={<div>Loading...</div>}>
        <UserProfile userId="1" />
      </Suspense>
    );

    expect(await screen.findByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
  });
});
```

### Testing use() Hook

```typescript
// React 19's use() hook
import { use, Suspense } from 'react';

function UserDetails({ userPromise }: { userPromise: Promise<User> }) {
  const user = use(userPromise);

  return (
    <div>
      <h2>{user.name}</h2>
      <span>{user.role}</span>
    </div>
  );
}

// Test
describe('use() hook', () => {
  it('resolves promise and renders data', async () => {
    const userPromise = Promise.resolve({
      id: '1',
      name: 'Jane Smith',
      role: 'Admin',
    });

    render(
      <Suspense fallback={<div>Loading...</div>}>
        <UserDetails userPromise={userPromise} />
      </Suspense>
    );

    expect(await screen.findByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('Admin')).toBeInTheDocument();
  });

  it('shows loading state while pending', () => {
    // Never-resolving promise
    const userPromise = new Promise(() => {});

    render(
      <Suspense fallback={<div>Loading...</div>}>
        <UserDetails userPromise={userPromise} />
      </Suspense>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });
});
```

### Testing Form Actions

```typescript
// React 19 form actions
import { useFormStatus, useFormState } from 'react-dom';

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button type="submit" disabled={pending}>
      {pending ? 'Submitting...' : 'Submit'}
    </button>
  );
}

async function createUser(prevState: any, formData: FormData) {
  const name = formData.get('name');
  const email = formData.get('email');

  try {
    await api.createUser({ name, email });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

function CreateUserForm() {
  const [state, formAction] = useFormState(createUser, null);

  return (
    <form action={formAction}>
      <input name="name" required />
      <input name="email" type="email" required />
      {state?.error && <div role="alert">{state.error}</div>}
      <SubmitButton />
    </form>
  );
}

// Test
describe('Form Actions', () => {
  it('handles form submission', async () => {
    const user = userEvent.setup();
    vi.mocked(api.createUser).mockResolvedValue({ id: '1' });

    render(<CreateUserForm />);

    await user.type(screen.getByRole('textbox', { name: /name/i }), 'John');
    await user.type(screen.getByRole('textbox', { name: /email/i }), 'john@example.com');
    await user.click(screen.getByRole('button', { name: /submit/i }));

    await waitFor(() => {
      expect(api.createUser).toHaveBeenCalledWith({
        name: 'John',
        email: 'john@example.com',
      });
    });
  });

  it('shows loading state during submission', async () => {
    const user = userEvent.setup();
    let resolveCreate: Function;

    vi.mocked(api.createUser).mockImplementation(
      () => new Promise(resolve => { resolveCreate = resolve; })
    );

    render(<CreateUserForm />);

    await user.type(screen.getByRole('textbox', { name: /name/i }), 'John');
    await user.type(screen.getByRole('textbox', { name: /email/i }), 'john@example.com');
    await user.click(screen.getByRole('button', { name: /submit/i }));

    // Button should show loading state
    expect(screen.getByRole('button')).toHaveTextContent('Submitting...');
    expect(screen.getByRole('button')).toBeDisabled();

    // Resolve the promise
    resolveCreate!({ id: '1' });

    await waitFor(() => {
      expect(screen.getByRole('button')).toHaveTextContent('Submit');
      expect(screen.getByRole('button')).not.toBeDisabled();
    });
  });
});
```

### Testing Optimistic Updates

```typescript
// React 19 optimistic updates
import { useOptimistic } from 'react';

function TodoList({ todos: serverTodos }) {
  const [todos, addOptimisticTodo] = useOptimistic(
    serverTodos,
    (state, newTodo) => [...state, { ...newTodo, pending: true }]
  );

  async function addTodo(formData: FormData) {
    const title = formData.get('title') as string;

    addOptimisticTodo({
      id: crypto.randomUUID(),
      title,
      completed: false,
    });

    await api.createTodo({ title });
  }

  return (
    <>
      <form action={addTodo}>
        <input name="title" required />
        <button type="submit">Add</button>
      </form>
      <ul>
        {todos.map(todo => (
          <li key={todo.id} style={{ opacity: todo.pending ? 0.5 : 1 }}>
            {todo.title}
          </li>
        ))}
      </ul>
    </>
  );
}

// Test
describe('Optimistic Updates', () => {
  it('shows optimistic state immediately', async () => {
    const user = userEvent.setup();
    const serverTodos = [
      { id: '1', title: 'Existing todo', completed: false },
    ];

    let resolveCreate: Function;
    vi.mocked(api.createTodo).mockImplementation(
      () => new Promise(resolve => { resolveCreate = resolve; })
    );

    render(<TodoList todos={serverTodos} />);

    // Add new todo
    await user.type(screen.getByRole('textbox'), 'New todo');
    await user.click(screen.getByRole('button', { name: /add/i }));

    // Should show optimistic state immediately
    const newTodo = screen.getByText('New todo');
    expect(newTodo).toBeInTheDocument();
    expect(newTodo.parentElement).toHaveStyle({ opacity: '0.5' });

    // Resolve the API call
    resolveCreate!({ id: '2', title: 'New todo', completed: false });

    await waitFor(() => {
      expect(newTodo.parentElement).toHaveStyle({ opacity: '1' });
    });
  });
});
```

## Best Practices

1. **Query by Accessibility**: Use roles, labels, and text that users see
2. **Avoid Implementation Details**: Don't test state, test behavior
3. **Use userEvent**: Simulates real user interactions more accurately than
fireEvent
4. **Wait for Async**: Use waitFor and find\* queries for async operations
5. **Test User Flows**: Write tests that mirror how users actually use the component
6. **Mock at Boundaries**: Mock API calls and external dependencies, not internal functions
7. **Maintain Test Utilities**: Create helpers for common test scenarios
