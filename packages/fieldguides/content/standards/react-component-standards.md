---
slug: react-component-standards
title: Build scalable components with clear APIs and composition
description: Framework-agnostic patterns for maintainable component architecture.
type: convention
---

# React Component Standards

Modern React patterns for building scalable, type-safe component systems.

## Related Documentation

- [React State Derivation](../patterns/react-state-derivation.md) - State
  management patterns
- [React Patterns](../patterns/react-patterns.md) - Advanced React patterns
- [Testing React Components](../patterns/testing-react-components.md) -
  Component testing
- [TypeScript Standards](./typescript-standards.md) - TypeScript with React
- [Testing Standards](./testing-standards.md) - Testing component behavior
- [Documentation Standards](./documentation-standards.md) - Documenting
  components

## Overview

React component architecture has evolved significantly with React 19, Server
Components, and modern TypeScript patterns. This guide provides authoritative
standards while acknowledging the ecosystem's rapid evolution.

## Version Compatibility

This guide assumes:

- React: 19.0+ (for Server Components and use() hook)
- TypeScript: 5.0+ (for const type parameters and satisfies)
- Next.js: 13+ (for App Router and Server Components)
- Node.js: 18+ (for modern JavaScript features)

**Note**: Many patterns work with React 18.x, but React 19 features (Server
Components, use() hook, useOptimistic) require React 19.0+.

## Core Principles

### Single Responsibility

Each component should have one clear purpose and do it well. Split complex
components into smaller, focused pieces.

### Composition Over Inheritance

Build complex UIs by combining simple components rather than creating deeply
nested hierarchies.

### Props as API

Component props form the public API. Design them carefully for clarity,
flexibility, and stability.

### Isolation

Components should work independently without relying on external state or
specific contexts unless explicitly designed to do so.

## Component Design Patterns

### Separation of Concerns

```typescript
// 📚 Educational: Separation of concerns pattern
// Data logic separated from presentation
interface UserData {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

// Pure presentation component
interface UserCardProps {
  user: UserData;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

// Container component handles data
interface UserContainerProps {
  userId: string;
}

// Business logic abstracted to hooks/services
interface UserService {
  getUser(id: string): Promise<UserData>;
  updateUser(id: string, data: Partial<UserData>): Promise<UserData>;
  deleteUser(id: string): Promise<void>;
}
```

### Interface Segregation

```typescript
// 📚 Educational: Interface segregation pattern
// Split interfaces by concern
interface Clickable {
  onClick?: () => void;
  disabled?: boolean;
}

interface Styled {
  className?: string;
  style?: Record<string, any>;
}

interface Identifiable {
  id: string;
  testId?: string;
}

// Compose interfaces for specific components
interface ButtonProps extends Clickable, Styled, Identifiable {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
  size?: 'small' | 'medium' | 'large';
}
```

### Dependency Injection

```typescript
// 📚 Educational: Dependency injection pattern
// Define interfaces for dependencies
interface Logger {
  log(message: string, level: 'info' | 'warn' | 'error'): void;
}

interface Analytics {
  track(event: string, properties?: Record<string, any>): void;
}

// Inject dependencies through props or context
interface ComponentProps {
  logger?: Logger;
  analytics?: Analytics;
}

// Use dependency injection for testability
const createComponent = (deps: { logger: Logger; analytics: Analytics }) => {
  return (props: ComponentProps) => {
    const logger = props.logger || deps.logger;
    const analytics = props.analytics || deps.analytics;
    // Component implementation
  };
};
```

## State Management Patterns

For comprehensive state patterns including derived state, see
[React State Derivation](../patterns/react-state-derivation.md).

### Modern Hook Patterns

```typescript
// ✂️ Production-ready: Custom hooks with TypeScript-first design
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Composable hooks
export function useUser(userId: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['user', userId],
    queryFn: () => fetchUser(userId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const mutation = useMutation({
    mutationFn: (data: UpdateUserInput) => updateUser(userId, data),
    onSuccess: updatedUser => {
      queryClient.setQueryData(['user', userId], updatedUser);
    },
  });

  return {
    user: query.data,
    isLoading: query.isLoading,
    error: query.error,
    updateUser: mutation.mutate,
    isUpdating: mutation.isPending,
  };
}

// Effect management with cleanup
export function useEventListener<K extends keyof WindowEventMap>(
  eventName: K,
  handler: (event: WindowEventMap[K]) => void,
  element: HTMLElement | Window = window
) {
  const savedHandler = useRef(handler);

  useLayoutEffect(() => {
    savedHandler.current = handler;
  }, [handler]);

  useEffect(() => {
    const eventListener = (event: WindowEventMap[K]) =>
      savedHandler.current(event);
    element.addEventListener(eventName, eventListener as EventListener);

    return () => {
      element.removeEventListener(eventName, eventListener as EventListener);
    };
  }, [eventName, element]);
}
```

### Local State Encapsulation

```typescript
// 📚 Educational: State encapsulation pattern
// Keep state close to where it's used
interface PaginationState {
  currentPage: number;
  pageSize: number;
  totalItems: number;
}

interface PaginationActions {
  goToPage: (page: number) => void;
  setPageSize: (size: number) => void;
}

// Encapsulate state logic
class PaginationController {
  private state: PaginationState;
  private listeners: Set<() => void> = new Set();

  constructor(initialState: PaginationState) {
    this.state = initialState;
  }

  getState(): Readonly<PaginationState> {
    return { ...this.state };
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  goToPage(page: number): void {
    const maxPage = Math.ceil(this.state.totalItems / this.state.pageSize);
    this.state.currentPage = Math.max(1, Math.min(page, maxPage));
    this.notify();
  }

  private notify(): void {
    this.listeners.forEach(listener => listener());
  }
}
```

### Event-Driven Communication

```typescript
// ✂️ Production-ready: Type-safe event emitter
// Define event types
interface ComponentEvents {
  'item:select': { id: string };
  'item:delete': { id: string };
  'filter:change': { filters: Record<string, any> };
}

// Type-safe event emitter
class EventBus<Events extends Record<string, any>> {
  private handlers = new Map<keyof Events, Set<(data: any) => void>>();

  on<K extends keyof Events>(
    event: K,
    handler: (data: Events[K]) => void
  ): () => void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)!.add(handler);

    return () => {
      this.handlers.get(event)?.delete(handler);
    };
  }

  emit<K extends keyof Events>(event: K, data: Events[K]): void {
    this.handlers.get(event)?.forEach(handler => handler(data));
  }
}
```

## React 19 Patterns

### Server Components

```typescript
// ✂️ Production-ready: Server Component example
// app/users/page.tsx - Server Component
import { db } from '@/lib/db';
import { UserList } from './user-list';

// Server Components can be async
export default async function UsersPage() {
  const users = await db.user.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div>
      <h1>Users</h1>
      <UserList users={users} />
    </div>
  );
}

// app/users/user-list.tsx - Client Component
'use client';

import { useState } from 'react';
import type { User } from '@/types';

interface UserListProps {
  users: User[];
}

export function UserList({ users }: UserListProps) {
  const [filter, setFilter] = useState('');

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <>
      <input
        type="search"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        placeholder="Filter users..."
      />
      <ul>
        {filteredUsers.map(user => (
          <li key={user.id}>{user.name}</li>
        ))}
      </ul>
    </>
  );
}
```

### The use() Hook

```typescript
// ✂️ Production-ready: React 19's use() hook
// React 19's use() hook for promises and context
import { use, Suspense } from 'react';

// Promise example
function UserProfile({ userPromise }: { userPromise: Promise<User> }) {
  // use() unwraps the promise - component suspends until resolved
  const user = use(userPromise);

  return (
    <div>
      <h2>{user.name}</h2>
      <p>{user.email}</p>
    </div>
  );
}

// Context example
const ThemeContext = createContext<Theme | null>(null);

function ThemedButton({ children }: { children: React.ReactNode }) {
  // use() can conditionally read context
  const theme = use(ThemeContext);

  if (!theme) {
    throw new Error('ThemedButton must be used within ThemeProvider');
  }

  return (
    <button className={theme.buttonClass}>
      {children}
    </button>
  );
}

// Usage with Suspense
function App() {
  const userPromise = fetchUser(userId);

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <UserProfile userPromise={userPromise} />
    </Suspense>
  );
}
```

### Advanced Suspense Patterns

```typescript
// ✂️ Production-ready: Suspense with Error Boundaries
import { Suspense, Component, ErrorInfo } from 'react';

class ErrorBoundary extends Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}

// React 19: Simplified error handling with use() hook
import { use, Suspense } from 'react';

function UserProfile({ userPromise }: { userPromise: Promise<User> }) {
  // use() hook unwraps promises and handles errors
  const user = use(userPromise);

  return (
    <div>
      <h1>{user.name}</h1>
      <p>{user.email}</p>
    </div>
  );
}

// React 19: Document metadata support
export function BlogPost({ post }: { post: Post }) {
  return (
    <>
      <title>{post.title}</title>
      <meta name="description" content={post.excerpt} />
      <meta property="og:title" content={post.title} />

      <article>
        <h1>{post.title}</h1>
        <div>{post.content}</div>
      </article>
    </>
  );
}

// Streaming SSR with nested Suspense
export function Dashboard() {
  return (
    <ErrorBoundary fallback={<ErrorFallback />}>
      <Suspense fallback={<HeaderSkeleton />}>
        <Header />
      </Suspense>

      <div className="grid grid-cols-2 gap-4">
        <Suspense fallback={<ChartSkeleton />}>
          <RevenueChart />
        </Suspense>

        <Suspense fallback={<TableSkeleton />}>
          <RecentOrders />
        </Suspense>
      </div>

      <Suspense fallback={<ActivitySkeleton />}>
        <ActivityFeed />
      </Suspense>
    </ErrorBoundary>
  );
}

// Optimistic updates with useOptimistic
import { useOptimistic } from 'react';

function TodoList({ todos }: { todos: Todo[] }) {
  const [optimisticTodos, addOptimisticTodo] = useOptimistic(
    todos,
    (state, newTodo: string) => [
      ...state,
      { id: Math.random(), text: newTodo, pending: true },
    ]
  );

  async function formAction(formData: FormData) {
    const text = formData.get('todo') as string;
    addOptimisticTodo(text);
    await createTodo(text); // Server action
  }

  return (
    <>
      <form action={formAction}>
        <input name="todo" type="text" />
        <button type="submit">Add Todo</button>
      </form>
      <ul>
        {optimisticTodos.map(todo => (
          <li key={todo.id} style={{ opacity: todo.pending ? 0.5 : 1 }}>
            {todo.text}
          </li>
        ))}
      </ul>
    </>
  );
}
```

### Server Actions

```typescript
// ✂️ Production-ready: Server Actions implementation
// app/actions/user.ts
'use server';

import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const UpdateUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
});

export async function updateUser(userId: string, formData: FormData) {
  const validatedFields = UpdateUserSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
  });

  if (!validatedFields.success) {
    return {
      error: 'Invalid fields',
      issues: validatedFields.error.flatten().fieldErrors,
    };
  }

  try {
    await db.user.update({
      where: { id: userId },
      data: validatedFields.data,
    });

    revalidatePath(`/users/${userId}`);
    return { success: true };
  } catch (error) {
    return { error: 'Failed to update user' };
  }
}

// Using in a Client Component
'use client';

import { updateUser } from '@/app/actions/user';
import { useFormState, useFormStatus } from 'react-dom';

function EditUserForm({ userId }: { userId: string }) {
  const [state, formAction] = useFormState(
    updateUser.bind(null, userId),
    null
  );

  return (
    <form action={formAction}>
      {state?.error && (
        <div className="error">{state.error}</div>
      )}

      <input name="name" type="text" required />
      {state?.issues?.name && (
        <span className="field-error">{state.issues.name[0]}</span>
      )}

      <input name="email" type="email" required />
      {state?.issues?.email && (
        <span className="field-error">{state.issues.email[0]}</span>
      )}

      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button type="submit" disabled={pending}>
      {pending ? 'Saving...' : 'Save Changes'}
    </button>
  );
}
```

## Testing Strategies

### Component Testing Principles

```typescript
// 📚 Educational: Testing principles
// Test interfaces, not implementation
interface Component {
  render(): string;
  update(props: any): void;
  destroy(): void;
}

// Test public API
describe('Component', () => {
  it('should render with default props', () => {
    const component = createComponent();
    expect(component.render()).toMatchSnapshot();
  });

  it('should handle prop updates', () => {
    const component = createComponent();
    component.update({ title: 'New Title' });
    expect(component.render()).toContain('New Title');
  });

  it('should clean up on destroy', () => {
    const component = createComponent();
    const spy = jest.spyOn(component, 'destroy');
    component.destroy();
    expect(spy).toHaveBeenCalled();
  });
});
```

### Mocking Strategies

```typescript
// 📚 Educational: Mocking pattern
// Define mockable interfaces
interface ApiClient {
  get<T>(url: string): Promise<T>;
  post<T>(url: string, data: any): Promise<T>;
}

// Create test doubles
class MockApiClient implements ApiClient {
  private responses = new Map<string, any>();

  setResponse(url: string, response: any): void {
    this.responses.set(url, response);
  }

  async get<T>(url: string): Promise<T> {
    if (!this.responses.has(url)) {
      throw new Error(`No mock response for ${url}`);
    }
    return this.responses.get(url);
  }

  async post<T>(url: string, data: any): Promise<T> {
    return this.get<T>(url);
  }
}
```

## Performance Optimization

### Lazy Loading

```typescript
// ✂️ Production-ready: Component lazy loading
// Component lazy loading interface
interface LazyComponent<T> {
  load(): Promise<T>;
  preload(): void;
}

// Factory for lazy components
function createLazyComponent<T>(loader: () => Promise<T>): LazyComponent<T> {
  let cache: T | null = null;
  let promise: Promise<T> | null = null;

  return {
    load(): Promise<T> {
      if (cache) return Promise.resolve(cache);
      if (!promise) {
        promise = loader().then(result => {
          cache = result;
          return result;
        });
      }
      return promise;
    },
    preload(): void {
      this.load();
    },
  };
}
```

### Memoization Patterns

```typescript
// ✂️ Production-ready: Generic memoization
// Generic memoization
function memoize<Args extends any[], Result>(
  fn: (...args: Args) => Result,
  keyGenerator?: (...args: Args) => string
): (...args: Args) => Result {
  const cache = new Map<string, Result>();

  return (...args: Args): Result => {
    const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);

    if (cache.has(key)) {
      return cache.get(key)!;
    }

    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
}

// Bounded cache for memory management
class BoundedCache<K, V> {
  private cache = new Map<K, V>();
  private usage = new Map<K, number>();

  constructor(private maxSize: number) {}

  set(key: K, value: V): void {
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this.evictLeastUsed();
    }
    this.cache.set(key, value);
    this.usage.set(key, 0);
  }

  get(key: K): V | undefined {
    const value = this.cache.get(key);
    if (value !== undefined) {
      this.usage.set(key, (this.usage.get(key) || 0) + 1);
    }
    return value;
  }

  private evictLeastUsed(): void {
    let leastUsedKey: K | undefined;
    let minUsage = Infinity;

    for (const [key, usage] of this.usage) {
      if (usage < minUsage) {
        minUsage = usage;
        leastUsedKey = key;
      }
    }

    if (leastUsedKey !== undefined) {
      this.cache.delete(leastUsedKey);
      this.usage.delete(leastUsedKey);
    }
  }
}
```

## Best Practices

### Component Design

1. **Single Responsibility**: Each component does one thing well
2. **Composition**: Build complex UIs from simple building blocks
3. **Props Interface**: Clear, well-documented component APIs
4. **State Management**: Keep state local when possible
5. **Performance**: Optimize only when necessary
6. **Accessibility**: Build inclusive components from the start
7. **Testing**: Write tests that reflect user behavior

## React 19 Features

### Actions and Form Handling

```typescript
// ✂️ Production-ready: React 19 Server Actions
'use server';

export async function updateUser(prevState: any, formData: FormData) {
  const id = formData.get('id') as string;
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;

  try {
    const user = await db.user.update({
      where: { id },
      data: { name, email },
    });

    return { success: true, user };
  } catch (error) {
    return { success: false, error: 'Failed to update user' };
  }
}

// Client component using server action
'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { updateUser } from './actions';

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button type="submit" disabled={pending}>
      {pending ? 'Saving...' : 'Save Changes'}
    </button>
  );
}

export function UserEditForm({ user }: { user: User }) {
  const [state, formAction] = useFormState(updateUser, null);

  return (
    <form action={formAction}>
      <input type="hidden" name="id" value={user.id} />
      <input name="name" defaultValue={user.name} />
      <input name="email" defaultValue={user.email} />
      <SubmitButton />
      {state?.error && <p className="error">{state.error}</p>}
    </form>
  );
}
```

### Improved Hooks

```typescript
// ✂️ Production-ready: React 19 new hooks
import { use, useOptimistic, useTransition } from 'react';

// useOptimistic for instant UI updates
function TodoList({ todos }: { todos: Todo[] }) {
  const [optimisticTodos, addOptimisticTodo] = useOptimistic(
    todos,
    (state, newTodo: string) => [
      ...state,
      { id: crypto.randomUUID(), text: newTodo, pending: true },
    ]
  );

  return (
    <>
      {optimisticTodos.map(todo => (
        <div key={todo.id} className={todo.pending ? 'opacity-50' : ''}>
          {todo.text}
        </div>
      ))}
    </>
  );
}

// use() hook for cleaner async handling
function Comments({ postId }: { postId: string }) {
  const commentsPromise = fetchComments(postId);
  const comments = use(commentsPromise);

  return (
    <ul>
      {comments.map(comment => (
        <li key={comment.id}>{comment.text}</li>
      ))}
    </ul>
  );
}

// useTransition with async functions
function SearchResults() {
  const [isPending, startTransition] = useTransition();
  const [results, setResults] = useState<Result[]>([]);

  async function handleSearch(query: string) {
    startTransition(async () => {
      const data = await searchAPI(query);
      setResults(data);
    });
  }

  return (
    <div>
      <SearchInput onSearch={handleSearch} />
      {isPending && <Spinner />}
      <ResultsList results={results} />
    </div>
  );
}
```

### Directives and Metadata

```typescript
// ✂️ Production-ready: React 19 directives
'use client'; // Marks component as client-side only

import { useState } from 'react';

export function InteractiveWidget() {
  const [count, setCount] = useState(0);

  return (
    <button onClick={() => setCount(count + 1)}>
      Count: {count}
    </button>
  );
}

// Document metadata in components
export function ProductPage({ product }: { product: Product }) {
  return (
    <>
      <title>{product.name} | Our Store</title>
      <meta name="description" content={product.description} />
      <link rel="canonical" href={`/products/${product.slug}`} />

      <article>
        <h1>{product.name}</h1>
        <p>{product.description}</p>
      </article>
    </>
  );
}
```

### Compiler Optimizations

```typescript
// ✂️ Production-ready: React Compiler compatible patterns
// React Compiler automatically optimizes these patterns

// Automatic memoization of expensive computations
function ExpensiveComponent({ data }: { data: Data[] }) {
  // Compiler auto-memoizes this
  const processed = data
    .filter(item => item.active)
    .map(item => ({
      ...item,
      computed: expensiveComputation(item),
    }))
    .sort((a, b) => b.computed - a.computed);

  return <DataTable items={processed} />;
}

// Automatic optimization of event handlers
function SearchForm() {
  const [query, setQuery] = useState('');

  // Compiler optimizes this - no need for useCallback
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    performSearch(query);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input value={query} onChange={(e) => setQuery(e.target.value)} />
    </form>
  );
}
```

### File Organization

```text
# App Router structure (React 19 / Next.js 13+)
app/
├── (auth)/                 # Route groups
│   ├── login/
│   │   └── page.tsx       # Server Component by default
│   └── register/
│       └── page.tsx
├── dashboard/
│   ├── layout.tsx         # Nested layout
│   ├── page.tsx           # Server Component
│   └── @analytics/        # Parallel route
│       └── page.tsx
├── api/                   # API routes
│   └── users/
│       └── route.ts
└── actions/               # Server actions
    └── user.ts

components/
├── ui/                    # Generic UI components
│   ├── button.tsx         # Client Component
│   ├── card.tsx
│   └── modal.tsx
├── features/              # Feature-specific components
│   ├── auth/
│   │   ├── login-form.tsx
│   │   └── auth-provider.tsx
│   └── user/
│       ├── user-profile.tsx
│       └── user-avatar.tsx
└── providers/             # Context providers
    ├── theme-provider.tsx
    └── query-provider.tsx

hooks/                     # Custom hooks
├── use-auth.ts
├── use-pagination.ts
└── use-debounce.ts

lib/                       # Utilities and configs
├── db.ts                  # Database client
├── auth.ts               # Auth utilities
└── api.ts                # API helpers
```

### Naming Conventions

- **Components**: PascalCase (`UserProfile`, `NavigationMenu`)
- **Hooks**: camelCase with 'use' prefix (`useAuth`, `usePagination`)
- **Props interfaces**: Component name + 'Props' (`ButtonProps`, `ModalProps`)
- **Event handlers**: 'handle' or 'on' prefix (`handleClick`, `onSubmit`)
- **Boolean props**: 'is', 'has', 'should' prefix (`isLoading`, `hasError`)

### Documentation

````typescript
// 📚 Educational: Component documentation example
/**
 * Button component with multiple variants and sizes.
 *
 * @example
 * ```tsx
 * <Button variant="primary" size="large" onClick={handleClick}>
 *   Click me
 * </Button>
 * ```
 */
export interface ButtonProps {
  /** Visual style variant */
  variant?: 'primary' | 'secondary' | 'destructive';

  /** Button size */
  size?: 'small' | 'medium' | 'large';

  /** Shows loading spinner and disables interaction */
  loading?: boolean;

  /** Renders as a different element while preserving button styles */
  asChild?: boolean;
}
````
