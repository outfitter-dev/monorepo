---
slug: tanstack-router-guide
title: Type-safe routing with TanStack Router
description: File-based routing with type safety and data loading.
type: guide
---

# TanStack Router Guide

Type-safe, file-based routing for React applications with automatic code splitting and data loading.

## Overview

TanStack Router provides a fully type-safe routing solution with file-based routing, search params validation, and seamless integration with TanStack Query for data fetching.

## Installation

```bash
pnpm add @tanstack/react-router
# Development dependencies
pnpm add -D @tanstack/router-vite-plugin @tanstack/router-devtools
```

## Initial Setup

### Vite Configuration

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { TanStackRouterVite } from '@tanstack/router-vite-plugin';

export default defineConfig({
  plugins: [react(), TanStackRouterVite()],
});
```

### Root Route Setup

```typescript
// src/routes/__root.tsx
import { createRootRoute, Link, Outlet } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/router-devtools';

export const Route = createRootRoute({
  component: () => (
    <>
      <div className="p-2 flex gap-2">
        <Link to="/" className="[&.active]:font-bold">
          Home
        </Link>
        <Link to="/about" className="[&.active]:font-bold">
          About
        </Link>
        <Link to="/posts" className="[&.active]:font-bold">
          Posts
        </Link>
      </div>
      <hr />
      <Outlet />
      <TanStackRouterDevtools />
    </>
  ),
});
```

### Router Instance

```typescript
// src/router.tsx
import { createRouter } from '@tanstack/react-router';
import { routeTree } from './routeTree.gen';

export const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
  defaultPreloadStaleTime: 0,
});

// Register router for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
```

### App Entry Point

```typescript
// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from '@tanstack/react-router';
import { router } from './router';

const rootElement = document.getElementById('root')!;

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
```

## File-Based Routing

### Route Structure

```text
src/routes/
├── __root.tsx          # Root layout
├── index.tsx           # / route
├── about.tsx           # /about route
├── posts/
│   ├── index.tsx       # /posts route
│   └── $postId.tsx     # /posts/:postId route
└── users/
    ├── _layout.tsx     # Layout wrapper
    ├── index.tsx       # /users route
    └── $userId/
        ├── index.tsx   # /users/:userId route
        └── edit.tsx    # /users/:userId/edit route
```

### Basic Route

```typescript
// src/routes/about.tsx
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/about')({
  component: AboutComponent,
});

function AboutComponent() {
  return (
    <div className="p-2">
      <h1>About Page</h1>
      <p>This is the about page.</p>
    </div>
  );
}
```

## Type-Safe Parameters

### Route Parameters

```typescript
// src/routes/posts/$postId.tsx
import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

// Define parameter schema
const postIdSchema = z.object({
  postId: z.string().uuid(),
});

export const Route = createFileRoute('/posts/$postId')({
  parseParams: (params) => postIdSchema.parse(params),
  component: PostComponent,
});

function PostComponent() {
  // Fully typed params
  const { postId } = Route.useParams();

  return (
    <div>
      <h1>Post: {postId}</h1>
    </div>
  );
}
```

### Search Parameters

```typescript
// src/routes/posts/index.tsx
import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

const postsSearchSchema = z.object({
  page: z.number().catch(1),
  limit: z.number().catch(10),
  sort: z.enum(['date', 'title']).catch('date'),
  filter: z.string().optional(),
});

export const Route = createFileRoute('/posts/')({
  validateSearch: postsSearchSchema,
  component: PostsListComponent,
});

function PostsListComponent() {
  const { page, limit, sort, filter } = Route.useSearch();
  const navigate = Route.useNavigate();

  const updateSearch = (updates: Partial<z.infer<typeof postsSearchSchema>>) => {
    navigate({
      search: (prev) => ({ ...prev, ...updates }),
    });
  };

  return (
    <div>
      <input
        value={filter || ''}
        onChange={(e) => updateSearch({ filter: e.target.value })}
        placeholder="Filter posts..."
      />
      <button onClick={() => updateSearch({ page: page + 1 })}>
        Next Page
      </button>
    </div>
  );
}
```

## Data Loading

### Basic Loader

```typescript
// src/routes/posts/$postId.tsx
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/posts/$postId')({
  loader: async ({ params }) => {
    const response = await fetch(`/api/posts/${params.postId}`);
    if (!response.ok) {
      throw new Error('Post not found');
    }
    return response.json();
  },
  component: PostComponent,
});

function PostComponent() {
  const post = Route.useLoaderData();

  return (
    <article>
      <h1>{post.title}</h1>
      <p>{post.content}</p>
    </article>
  );
}
```

### React Query Integration

```typescript
// src/routes/posts/$postId.tsx
import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';

const postQueryOptions = (postId: string) => ({
  queryKey: ['posts', postId],
  queryFn: async () => {
    const response = await fetch(`/api/posts/${postId}`);
    if (!response.ok) throw new Error('Failed to fetch post');
    return response.json();
  },
});

export const Route = createFileRoute('/posts/$postId')({
  // Prefetch in loader
  loader: ({ context: { queryClient }, params }) =>
    queryClient.ensureQueryData(postQueryOptions(params.postId)),
  component: PostComponent,
});

function PostComponent() {
  const { postId } = Route.useParams();
  const { data: post, isLoading, error } = useQuery(postQueryOptions(postId));

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <article>
      <h1>{post.title}</h1>
      <p>{post.content}</p>
    </article>
  );
}
```

## Route Context

### Setting Up Context

```typescript
// src/router.tsx
import { createRouter } from '@tanstack/react-router';
import { QueryClient } from '@tanstack/react-query';
import { routeTree } from './routeTree.gen';

const queryClient = new QueryClient();

export const router = createRouter({
  routeTree,
  context: {
    queryClient,
    auth: undefined!, // Will be set in app
  },
  defaultPreload: 'intent',
});

export type RouterContext = {
  queryClient: QueryClient;
  auth: {
    isAuthenticated: boolean;
    user: User | null;
  };
};
```

### Using Context

```typescript
// src/routes/_authenticated.tsx
import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async ({ context, location }) => {
    if (!context.auth.isAuthenticated) {
      throw redirect({
        to: '/login',
        search: {
          redirect: location.href,
        },
      });
    }
  },
});
```

## Advanced Patterns

### Layout Routes

```typescript
// src/routes/dashboard/_layout.tsx
import { createFileRoute, Outlet } from '@tanstack/react-router';

export const Route = createFileRoute('/dashboard/_layout')({
  component: DashboardLayout,
});

function DashboardLayout() {
  return (
    <div className="flex">
      <aside className="w-64">
        <nav>{/* Dashboard navigation */}</nav>
      </aside>
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
```

### Error Boundaries

```typescript
// src/routes/posts/$postId.tsx
export const Route = createFileRoute('/posts/$postId')({
  errorComponent: PostErrorComponent,
  component: PostComponent,
});

function PostErrorComponent({ error, reset }: ErrorComponentProps) {
  return (
    <div>
      <h2>Something went wrong!</h2>
      <p>{error.message}</p>
      <button onClick={reset}>Try again</button>
    </div>
  );
}
```

### Route Meta

```typescript
// src/routes/admin/users.tsx
export const Route = createFileRoute('/admin/users')({
  meta: () => [
    { title: 'User Management' },
    { name: 'description', content: 'Manage application users' },
  ],
  component: UsersManagement,
});
```

## Navigation

### Programmatic Navigation

```typescript
function NavigationExample() {
  const navigate = useNavigate();

  const handleSubmit = async (data: FormData) => {
    await saveData(data);

    // Navigate with typed parameters
    await navigate({
      to: '/posts/$postId',
      params: { postId: data.id },
      search: { tab: 'comments' },
    });
  };

  return (
    <button onClick={() => navigate({ to: '..' })}>
      Go Back
    </button>
  );
}
```

### Active Link Styling

```typescript
import { Link } from '@tanstack/react-router';

function Navigation() {
  return (
    <nav>
      <Link
        to="/posts"
        search={{ page: 1 }}
        activeProps={{
          className: 'font-bold text-blue-600',
        }}
        inactiveProps={{
          className: 'text-gray-600',
        }}
      >
        Posts
      </Link>
    </nav>
  );
}
```

## Testing Routes

```typescript
// __tests__/routes/posts.test.tsx
import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from '@tanstack/react-router';
import { routeTree } from '@/routeTree.gen';

test('renders post details', async () => {
  const router = createMemoryRouter({
    routeTree,
    initialLocation: '/posts/123',
  });

  render(<RouterProvider router={router} />);

  expect(await screen.findByText('Post: 123')).toBeInTheDocument();
});
```

## Best Practices

1. **Use file-based routing**: Leverage automatic route generation
2. **Type everything**: Use schemas for params and search
3. **Integrate with React Query**: For data fetching and caching
4. **Handle errors gracefully**: Use error boundaries on routes
5. **Optimize with preloading**: Use `preload: 'intent'` for better UX

## Performance Optimization

### Code Splitting

```typescript
// Automatic with file-based routing
// Each route is automatically code-split

// For manual splitting
import { lazy } from '@tanstack/react-router';

export const Route = createFileRoute('/heavy-component')({
  component: lazy(() => import('./HeavyComponent')),
});
```

### Preloading Strategies

```typescript
const router = createRouter({
  routeTree,
  defaultPreload: 'intent', // Preload on hover/focus
  defaultPreloadDelay: 50, // Delay before preloading
});
```
