---
slug: react-patterns
title: Build React apps with compound components and custom hooks
description: Component patterns, hooks, and best practices for React applications.
type: guide
---

# React Patterns

Component patterns, hooks, and best practices for building React applications
with React 19 and modern tooling.

## Related Documentation

- [React State Derivation](./react-state-derivation.md) - Derive state instead
  of syncing it
- [Testing React Components](./testing-react-components.md) - Testing React
  components
- [React Query](../guides/react-query.md) - Data fetching patterns
- [React Hook Form](../guides/react-hook-form.md) - Form handling
- [Component Architecture](../standards/react-component-standards.md) -
  Component design patterns
- [TypeScript Standards](../standards/typescript-standards.md) - Type-safe React
- [Performance Optimization](./performance-optimization.md) - React performance
  patterns

## Modern React Features (React 19+)

### Server Components with Use Hook

```typescript
import { use } from 'react';

// Server Component with async data fetching
export async function UserProfile({ userId }: { userId: string }) {
  // Direct async/await in server components
  const user = await fetchUser(userId);

  return (
    <div>
      <h1>{user.name}</h1>
      <ClientInteractions userId={userId} />
    </div>
  );
}

// Client component using the use hook
'use client';

function ClientComponent({ promise }: { promise: Promise<User> }) {
  // use() hook for Suspense integration
  const user = use(promise);

  return <div>{user.name}</div>;
}
```

### Actions and Form State

```typescript
'use client';

import { useActionState } from 'react';

type State = {
  message: string;
  errors?: Record<string, string[]>;
};

function ContactForm() {
  const [state, formAction, isPending] = useActionState(
    async (prevState: State, formData: FormData) => {
      const result = await submitContact(formData);

      if (!result.ok) {
        return {
          message: 'Failed to submit',
          errors: result.errors
        };
      }

      return { message: 'Message sent successfully!' };
    },
    { message: '' }
  );

  return (
    <form action={formAction}>
      <input name="email" type="email" required />
      {state.errors?.email && (
        <span className="error">{state.errors.email[0]}</span>
      )}

      <button disabled={isPending}>
        {isPending ? 'Sending...' : 'Send'}
      </button>

      {state.message && <p>{state.message}</p>}
    </form>
  );
}
```

### Optimistic Updates with useOptimistic

```typescript
import { useOptimistic } from 'react';

function TodoList({ todos }: { todos: Todo[] }) {
  const [optimisticTodos, addOptimisticTodo] = useOptimistic(
    todos,
    (state, newTodo: Todo) => [...state, { ...newTodo, pending: true }]
  );

  async function addTodo(formData: FormData) {
    const title = formData.get('title') as string;
    const newTodo = { id: crypto.randomUUID(), title, completed: false };

    // Optimistically add the todo
    addOptimisticTodo(newTodo);

    // Actually create it
    await createTodo(newTodo);
  }

  return (
    <>
      <form action={addTodo}>
        <input name="title" required />
        <button>Add Todo</button>
      </form>

      <ul>
        {optimisticTodos.map(todo => (
          <li key={todo.id} className={todo.pending ? 'opacity-50' : ''}>
            {todo.title}
          </li>
        ))}
      </ul>
    </>
  );
}
```

## Component Patterns

### Compound Components

Components that work together while maintaining separate concerns:

```typescript
import React, { createContext, useContext, useState } from 'react';

interface TabsContextValue {
  activeTab: string;
  setActiveTab: (id: string) => void;
}

const TabsContext = createContext<TabsContextValue | null>(null);

export function Tabs({ children, defaultTab }: { children: React.ReactNode; defaultTab: string }) {
  const [activeTab, setActiveTab] = useState(defaultTab);

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className="tabs">{children}</div>
    </TabsContext.Provider>
  );
}

Tabs.Tab = function TabsTab({ id, children }: { id: string; children: React.ReactNode }) {
  const context = useContext(TabsContext);
  if (!context) throw new Error('Tabs.Tab must be used within Tabs');

  return (
    <button
      role="tab"
      aria-selected={context.activeTab === id}
      onClick={() => context.setActiveTab(id)}
    >
      {children}
    </button>
  );
};

Tabs.Panel = function TabsPanel({ id, children }: { id: string; children: React.ReactNode }) {
  const context = useContext(TabsContext);
  if (!context) throw new Error('Tabs.Panel must be used within Tabs');

  if (context.activeTab !== id) return null;

  return <div role="tabpanel">{children}</div>;
};
```

### Render Props Pattern

Share code between components using a function prop:

```typescript
import React, { useState, useEffect } from 'react';

interface MousePosition {
  x: number;
  y: number;
}

interface MouseTrackerProps {
  render: (position: MousePosition) => React.ReactNode;
}

function MouseTracker({ render }: MouseTrackerProps) {
  const [position, setPosition] = useState<MousePosition>({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: globalThis.MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return <>{render(position)}</>;
}

// Usage
<MouseTracker
  render={({ x, y }) => (
    <div>Mouse position: {x}, {y}</div>
  )}
/>
```

## Modern Hook Patterns

### Async State Hook

```typescript
import { use, useCallback, useState, useTransition } from 'react';

function useAsyncState<T>(asyncFn: () => Promise<T>) {
  const [promise, setPromise] = useState(() => asyncFn());
  const [isPending, startTransition] = useTransition();

  const refetch = useCallback(() => {
    startTransition(() => {
      setPromise(asyncFn());
    });
  }, [asyncFn]);

  return {
    data: use(promise),
    isPending,
    refetch,
  };
}
```

### Document Metadata Hook

```typescript
import { use } from 'react';

function useDocumentTitle(title: string) {
  // React 19 automatically handles cleanup
  if (typeof window !== 'undefined') {
    document.title = title;
  }
}

// Usage in component
function ProductPage({ product }: { product: Product }) {
  useDocumentTitle(`${product.name} | My Store`);

  return <div>{/* ... */}</div>;
}
```

## Custom Hooks

### State Management Hooks

```typescript
import React, { useState, useCallback } from 'react';

function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = useCallback(
    (value: T) => {
      setStoredValue(value);
      window.localStorage.setItem(key, JSON.stringify(value));
    },
    [key]
  );

  return [storedValue, setValue];
}
```

### Effect Hooks

```typescript
import React, { useState, useEffect, useCallback, RefObject } from 'react';

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

function useOnClickOutside(ref: RefObject<HTMLElement>, handler: () => void) {
  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      if (!ref.current || ref.current.contains(event.target as Node)) {
        return;
      }
      handler();
    };

    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);

    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, handler]);
}
```

## Performance Optimization

### React Compiler (React 19+)

```typescript
// With React Compiler, manual memoization is often unnecessary
// The compiler automatically optimizes re-renders

function ExpensiveComponent({ data, onUpdate }: Props) {
  // No need for useMemo - compiler handles it
  const processedData = expensiveProcessing(data);

  // No need for useCallback - compiler handles it
  const handleClick = (id: string) => {
    onUpdate(id);
  };

  return <div>{/* Render processed data */}</div>;
}

// Opt out of compiler optimization when needed
function ManuallyOptimized({ data }: Props) {
  'use no memo'; // Directive to disable auto-memoization

  // Manual optimization for specific cases
  const processed = useMemo(() =>
    veryExpensiveProcessing(data),
    [data]
  );

  return <div>{processed}</div>;
}
```

### Activity Component Pattern

```typescript
import { Activity } from 'react';

function BackgroundTasks() {
  return (
    <Activity mode="hidden">
      {/* These components continue to run when hidden */}
      <DataSyncer />
      <NotificationListener />
      <WebSocketConnection />
    </Activity>
  );
}
```

### Memoization Patterns (Pre-Compiler)

```typescript
import React, { memo, useMemo, useCallback } from 'react';

const ExpensiveComponent = React.memo(({ data, onUpdate }: Props) => {
  const processedData = useMemo(() =>
    expensiveProcessing(data),
    [data]
  );

  const handleClick = useCallback((id: string) => {
    onUpdate(id);
  }, [onUpdate]);

  return <div>{/* Render processed data */}</div>;
}, (prevProps, nextProps) => {
  // Custom comparison
  return prevProps.data.id === nextProps.data.id;
});
```

### Code Splitting with Preloading

```typescript
import React, { lazy, Suspense, useState, useTransition } from 'react';

// Lazy load with preload capability
const LazyComponent = lazy(() => import('./HeavyComponent'));

// Preload on hover/focus
function preloadComponent() {
  import('./HeavyComponent');
}

function App() {
  const [showComponent, setShowComponent] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleShow = () => {
    startTransition(() => {
      setShowComponent(true);
    });
  };

  return (
    <>
      <button
        onMouseEnter={preloadComponent}
        onFocus={preloadComponent}
        onClick={handleShow}
        disabled={isPending}
      >
        {isPending ? 'Loading...' : 'Show Component'}
      </button>

      {showComponent && (
        <Suspense fallback={<LoadingSpinner />}>
          <LazyComponent />
        </Suspense>
      )}
    </>
  );
}
```

### Offscreen Rendering

```typescript
import { Offscreen } from 'react';

function SearchInterface() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <>
      <button onClick={() => setIsSearchOpen(!isSearchOpen)}>
        Toggle Search
      </button>

      <Offscreen mode={isSearchOpen ? 'visible' : 'hidden'}>
        {/* Keeps component mounted but hidden */}
        <SearchPanel />
      </Offscreen>
    </>
  );
}
```

## State Management

For comprehensive guidance on React state patterns, see
[React State Derivation](./react-state-derivation.md).

### Context with Reducer

```typescript
import React, { createContext, useContext, useReducer, ReactNode, Dispatch } from 'react';

interface State {
  user: User | null;
  isLoading: boolean;
  error: string | null;
}

type Action =
  | { type: 'FETCH_START' }
  | { type: 'FETCH_SUCCESS'; payload: User }
  | { type: 'FETCH_ERROR'; payload: string };

const UserContext = createContext<{
  state: State;
  dispatch: Dispatch<Action>;
} | null>(null);

function userReducer(state: State, action: Action): State {
  switch (action.type) {
    case 'FETCH_START':
      return { ...state, isLoading: true, error: null };
    case 'FETCH_SUCCESS':
      return { ...state, isLoading: false, user: action.payload };
    case 'FETCH_ERROR':
      return { ...state, isLoading: false, error: action.payload };
    default:
      return state;
  }
}

export function UserProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(userReducer, {
    user: null,
    isLoading: false,
    error: null,
  });

  return (
    <UserContext.Provider value={{ state, dispatch }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) throw new Error('useUser must be used within UserProvider');
  return context;
}
```

## Testing Patterns

### Component Testing

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { Button } from './Button';

describe('Button', () => {
  it('handles click events', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();

    render(<Button onClick={handleClick}>Click me</Button>);
    await user.click(screen.getByRole('button'));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### Hook Testing

```typescript
import { renderHook, act } from '@testing-library/react';
import { useCounter } from './useCounter';

describe('useCounter', () => {
  it('increments counter', () => {
    const { result } = renderHook(() => useCounter(0));

    act(() => {
      result.current.increment();
    });

    expect(result.current.count).toBe(1);
  });
});
```

## Modern Styling Patterns

### CSS Hooks for Dynamic Styles

```typescript
import { css } from 'react';

function ThemedButton({ variant, size }: ButtonProps) {
  const styles = css({
    '--button-bg': variant === 'primary' ? 'var(--primary)' : 'var(--secondary)',
    '--button-size': size === 'large' ? '1rem' : '0.875rem',
  });

  return (
    <button
      style={styles}
      className="themed-button"
    >
      Click me
    </button>
  );
}

// CSS
.themed-button {
  background: var(--button-bg);
  font-size: var(--button-size);
  transition: all 0.2s;
}
```

## Utility Patterns

### Class Name Merging (cn)

Utility for merging Tailwind classes with proper precedence:

```typescript
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Usage
<div className={cn(
  'px-4 py-2',
  'bg-blue-500', // This wins over bg-red-500 below
  condition && 'bg-red-500',
  className // Props always win
)} />
```

### Component Variants (cva)

Type-safe component variants using class-variance-authority:

```typescript
import { cva, type VariantProps } from 'class-variance-authority';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input bg-background hover:bg-accent',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}
```

## Data Fetching Patterns

### Resource Pattern

```typescript
import { use, Suspense } from 'react';

// Create a resource
function createResource<T>(promise: Promise<T>) {
  let status = 'pending';
  let result: T;
  let error: Error;

  const suspender = promise.then(
    (data) => {
      status = 'success';
      result = data;
    },
    (err) => {
      status = 'error';
      error = err;
    }
  );

  return {
    read() {
      if (status === 'pending') throw suspender;
      if (status === 'error') throw error;
      return result;
    }
  };
}

// Use with Suspense
function UserProfile({ userResource }: { userResource: Resource<User> }) {
  const user = userResource.read();

  return <div>{user.name}</div>;
}

function App() {
  const userResource = createResource(fetchUser());

  return (
    <Suspense fallback={<Skeleton />}>
      <UserProfile userResource={userResource} />
    </Suspense>
  );
}
```

### Streaming SSR Pattern

```typescript
// Server component with streaming
export default async function ProductList() {
  return (
    <div>
      <h1>Products</h1>
      <Suspense fallback={<ProductsSkeleton />}>
        <Products />
      </Suspense>
      <Suspense fallback={<RecommendationsSkeleton />}>
        <Recommendations />
      </Suspense>
    </div>
  );
}

async function Products() {
  // This can start streaming before Recommendations loads
  const products = await fetchProducts();
  return <ProductGrid products={products} />;
}

async function Recommendations() {
  // This loads independently
  const recommendations = await fetchRecommendations();
  return <RecommendationList items={recommendations} />;
}
```

## Best Practices

### Component Organization

```typescript
import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { buttonVariants } from './buttonVariants';
import { Spinner } from './Spinner';

// ✅ Good: Clear separation of concerns

interface ButtonProps {
  variant?: 'primary' | 'secondary';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  children: ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  onClick,
  children
}: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size }))}
      disabled={disabled || loading}
      onClick={onClick}
    >
      {loading && <Spinner />}
      {children}
    </button>
  );
}
```

### Modern Error Boundaries

```typescript
import React, { Component, ReactNode, ErrorInfo } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

// Using react-error-boundary for better DX
function ErrorFallback({ error, resetErrorBoundary }: {
  error: Error;
  resetErrorBoundary: () => void;
}) {
  return (
    <div role="alert" className="error-fallback">
      <h2>Something went wrong:</h2>
      <pre>{error.message}</pre>
      <button onClick={resetErrorBoundary}>Try again</button>
    </div>
  );
}

function MyApp() {
  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onReset={() => window.location.reload()}
      onError={(error, errorInfo) => {
        // Log to error reporting service
        console.error('Error caught by boundary:', error, errorInfo);
      }}
    >
      <App />
    </ErrorBoundary>
  );
}

// Async error boundaries (React 19+)
function AsyncBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      fallback={<div>Something went wrong</div>}
      onCatch={(error, errorInfo) => {
        // Handles both sync and async errors
        console.error('Async error:', error);
      }}
    >
      <Suspense fallback={<Loading />}>
        {children}
      </Suspense>
    </ErrorBoundary>
  );
}
```

## Accessibility Patterns

### Focus Management

```typescript
import { useId, useRef, useEffect } from 'react';

function Modal({ isOpen, onClose, children }: ModalProps) {
  const titleId = useId();
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      // Store current focus
      previousFocusRef.current = document.activeElement as HTMLElement;

      // Focus modal
      modalRef.current?.focus();

      // Trap focus
      const handleTab = (e: KeyboardEvent) => {
        if (e.key === 'Tab') {
          const focusables = modalRef.current?.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );

          if (focusables && focusables.length > 0) {
            const first = focusables[0] as HTMLElement;
            const last = focusables[focusables.length - 1] as HTMLElement;

            if (e.shiftKey && document.activeElement === first) {
              e.preventDefault();
              last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
              e.preventDefault();
              first.focus();
            }
          }
        }
      };

      document.addEventListener('keydown', handleTab);

      return () => {
        document.removeEventListener('keydown', handleTab);
        // Restore focus
        previousFocusRef.current?.focus();
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      ref={modalRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      tabIndex={-1}
    >
      <h2 id={titleId}>Modal Title</h2>
      {children}
      <button onClick={onClose}>Close</button>
    </div>
  );
}
```

## Best Practices Summary

1. **Use React 19 Features**: Leverage Server Components, Actions, and the use()
   hook
2. **Minimize Manual Optimization**: Let React Compiler handle memoization
3. **Embrace Concurrent Features**: Use Suspense, transitions, and streaming
4. **Prefer Composition**: Build with compound components and render props
5. **Handle Errors Gracefully**: Use error boundaries for both sync and async
   errors
6. **Focus on Accessibility**: Manage focus, ARIA attributes, and keyboard
   navigation
7. **Type Everything**: Leverage TypeScript for props, hooks, and components
