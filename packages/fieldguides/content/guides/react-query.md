---
slug: react-query
title: Fetch data with TanStack Query v5 and Result patterns
description: Type-safe data fetching with TanStack Query v5.
type: guide
---

# TanStack Query v5 Integration

Type-safe data fetching and state management with @tanstack/react-query v5 and the Result pattern.

## Related Documentation

- [Error Handling Patterns](../patterns/typescript-error-handling.md) - Result type integration
- [React Standards](../patterns/react-patterns.md) - React patterns and best practices
- [Testing React Components](../patterns/testing-react-components.md) - Testing data fetching
- [TypeScript Standards](../standards/typescript-standards.md) - Type safety patterns
- [React Component Standards](../standards/react-component-standards.md) - Component integration

## Overview

TanStack Query v5 provides powerful asynchronous state management for React applications. When combined with the Result pattern, it creates a robust, type-safe data fetching layer that handles loading states, errors, and caching elegantly.

## Setup

```bash
npm install @tanstack/react-query@^5
```

## Breaking Changes from v4

### Key Migration Points

- `cacheTime` renamed to `gcTime` (garbage collection time)
- `useErrorBoundary` renamed to `throwOnError`
- Query functions now receive a single object parameter
- `isLoading` split into `isLoading` and `isFetching`
- `placeholderData` identity function receives `previousData` and `query` as parameters

## Query Key Factory

Consistent, type-safe query keys prevent cache conflicts and enable precise invalidation:

```typescript
// Query key factory for consistency and type safety
export const queryKeys = {
  all: ['root'] as const, // A common root key
  users: () => [...queryKeys.all, 'users'] as const,
  userLists: (filters?: Record<string, any>) =>
    [...queryKeys.users(), 'list', filters ?? {}] as const,
  userDetail: (id: string | number) =>
    [...queryKeys.users(), 'detail', id] as const,
  posts: () => [...queryKeys.all, 'posts'] as const,
  postDetail: (id: string) => [...queryKeys.posts(), 'detail', id] as const,
  postComments: (postId: string) =>
    [...queryKeys.posts(), postId, 'comments'] as const,
} as const;
```

## TypeScript-First Query Patterns

### Basic Query with Strict Types

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '@/lib/fetchApi';
import type { Result, AppError } from '@/lib/result';
import type { User } from '@/types/user';

// Type-safe query options factory
function userQueryOptions(id: string) {
  return {
    queryKey: queryKeys.userDetail(id),
    queryFn: async ({ signal }) => {
      const result = await fetchApi<User>(`/api/users/${id}`, { signal });
      if (!result.ok) {
        throw result.error;
      }
      return result.data;
    },
  } as const;
}

// Typed query hook using the options factory
export function useUser(id: string) {
  return useQuery({
    ...userQueryOptions(id),
    // Recommended query options for optimal UX
    staleTime: 5 * 60 * 1000, // Data considered fresh for 5 minutes
    retry: (failureCount, error) => {
      // Retry network errors up to 3 times, but not auth errors
      if (error.code === 'network' && failureCount < 3) return true;
      if (
        error.code === 'auth.invalidToken' ||
        error.code === 'auth.unauthorized'
      )
        return false;
      return false;
    },
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  });
}
```

## Mutations with Optimistic Updates

```typescript
// Typed mutation hook with optimistic updates example
export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation<User, AppError, { id: string; data: Partial<User> }>({
    mutationFn: async ({ id, data }) => {
      const result = await fetchApi<User>(`/api/users/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
      if (!result.ok) {
        throw result.error;
      }
      return result.data;
    },
    onMutate: async ({ id, data: newData }) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: queryKeys.userDetail(id) });

      // Snapshot the previous value
      const previousUserData = queryClient.getQueryData<User>(
        queryKeys.userDetail(id)
      );

      // Optimistically update to the new value
      if (previousUserData) {
        queryClient.setQueryData<User>(queryKeys.userDetail(id), {
          ...previousUserData,
          ...newData,
        });
      }

      // Return a context object with the snapshotted value
      return { previousUserData };
    },
    // If the mutation fails, use the context returned from onMutate to roll back
    onError: (err, { id }, context) => {
      if (context?.previousUserData) {
        queryClient.setQueryData(
          queryKeys.userDetail(id),
          context.previousUserData
        );
      }
      // Optionally, display a toast or handle the error
      // toast.error(`Failed to update user: ${humanise(err)}`);
    },
    // Always refetch after error or success:
    onSettled: (data, error, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.userDetail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.userLists() }); // Invalidate lists too
    },
  });
}
```

## Query Options Patterns

### List Queries with Filters

```typescript
interface UserFilters {
  role?: 'admin' | 'user';
  status?: 'active' | 'inactive';
  search?: string;
}

export function useUsers(filters?: UserFilters) {
  return useQuery<User[], AppError>({
    queryKey: queryKeys.userLists(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.role) params.append('role', filters.role);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.search) params.append('search', filters.search);

      const result = await fetchApi<User[]>(`/api/users?${params}`);
      if (!result.ok) throw result.error;
      return result.data;
    },
    staleTime: 2 * 60 * 1000, // Lists go stale faster
    // Keep previous data while fetching with new filters (v5 syntax)
    placeholderData: (previousData, previousQuery) => previousData,
  });
}
```

### Dependent Queries

```typescript
export function useUserPosts(userId: string | undefined) {
  return useQuery<Post[], AppError>({
    queryKey: ['users', userId, 'posts'],
    queryFn: async () => {
      const result = await fetchApi<Post[]>(`/api/users/${userId}/posts`);
      if (!result.ok) throw result.error;
      return result.data;
    },
    // Only run query if we have a userId
    enabled: !!userId,
  });
}
```

### Infinite Queries

```typescript
import { useInfiniteQuery } from '@tanstack/react-query';

interface PostsResponse {
  posts: Post[];
  nextCursor: string | null;
  hasMore: boolean;
}

export function useInfinitePosts() {
  return useInfiniteQuery<PostsResponse, AppError>({
    queryKey: ['posts', 'infinite'],
    queryFn: async ({ pageParam, signal }) => {
      const result = await fetchApi<PostsResponse>(
        `/api/posts?cursor=${pageParam}&limit=20`,
        { signal }
      );
      if (!result.ok) throw result.error;
      return result.data;
    },
    getNextPageParam: lastPage => lastPage.nextCursor,
    initialPageParam: '', // Required in v5
    maxPages: 5, // Optional: limit cached pages
  });
}
```

## Suspense Query Support

### Using useSuspenseQuery

```typescript
import { useSuspenseQuery, UseSuspenseQueryResult } from '@tanstack/react-query';
import { Suspense } from 'react';

// Define suspense-enabled query options
function userSuspenseQueryOptions(id: string) {
  return {
    queryKey: queryKeys.userDetail(id),
    queryFn: async ({ signal }) => {
      const result = await fetchApi<User>(`/api/users/${id}`, { signal });
      if (!result.ok) throw result.error;
      return result.data;
    },
    staleTime: 5 * 60 * 1000,
  } as const;
}

// Component using suspense query
function UserProfile({ userId }: { userId: string }) {
  // Data is guaranteed to be defined, no loading state needed
  const { data: user } = useSuspenseQuery(userSuspenseQueryOptions(userId));

  return <div>{user.name}</div>;
}

// Parent component with Suspense boundary
function UserProfilePage({ userId }: { userId: string }) {
  return (
    <Suspense fallback={<Skeleton className="h-32 w-full" />}>
      <UserProfile userId={userId} />
    </Suspense>
  );
}
```

### Suspense with Error Boundaries

```typescript
import { useSuspenseQueries } from '@tanstack/react-query';
import { ErrorBoundary } from 'react-error-boundary';

// Parallel suspense queries
function UserDashboard({ userId }: { userId: string }) {
  const [userResult, postsResult] = useSuspenseQueries({
    queries: [
      userSuspenseQueryOptions(userId),
      {
        queryKey: queryKeys.userPosts(userId),
        queryFn: async ({ signal }) => {
          const result = await fetchApi<Post[]>(`/api/users/${userId}/posts`, { signal });
          if (!result.ok) throw result.error;
          return result.data;
        },
      },
    ],
  });

  return (
    <div>
      <h1>{userResult.data.name}</h1>
      <PostList posts={postsResult.data} />
    </div>
  );
}

// Usage with error boundary
function UserDashboardPage({ userId }: { userId: string }) {
  return (
    <ErrorBoundary fallback={<ErrorFallback />}>
      <Suspense fallback={<DashboardSkeleton />}>
        <UserDashboard userId={userId} />
      </Suspense>
    </ErrorBoundary>
  );
}
```

## Error Handling Integration

```typescript
// Custom error boundary for React Query
import { QueryErrorResetBoundary } from '@tanstack/react-query';
import { ErrorBoundary } from 'react-error-boundary';
import { humanise } from '@/lib/toast';
import type { AppError } from '@/lib/error';

function QueryErrorFallback({ error, resetErrorBoundary }: {
  error: AppError;
  resetErrorBoundary: () => void;
}) {
  return (
    <div className="error-container p-4 text-center">
      <h2 className="text-xl font-semibold text-red-600 mb-2">
        Something went wrong
      </h2>
      <p className="text-gray-700 mb-4">{humanise(error)}</p>
      <button
        onClick={resetErrorBoundary}
        className="px-4 py-2 bg-blue-500 text-white rounded"
      >
        Try again
      </button>
    </div>
  );
}

// Wrap components that use React Query
export function QueryBoundary({ children }: { children: React.ReactNode }) {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary
          onReset={reset}
          FallbackComponent={QueryErrorFallback}
        >
          {children}
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
}
```

## Provider Setup

```typescript
// app/providers.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

// Create a client with sensible defaults
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Stale time: how long until a query is considered stale
      staleTime: 60 * 1000, // 1 minute
      // Garbage collection time: how long before inactive queries are removed
      gcTime: 5 * 60 * 1000, // 5 minutes (renamed from cacheTime in v5)
      // Retry failed requests
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors (client errors)
        if (error instanceof AppError) {
          const statusCode = error.statusCode ?? 500;
          if (statusCode >= 400 && statusCode < 500) return false;
        }
        return failureCount < 3;
      },
      // Show errors in UI rather than throwing (renamed from useErrorBoundary)
      throwOnError: false,
    },
    mutations: {
      // Don't retry mutations by default
      retry: false,
      // Show errors in UI rather than throwing (renamed from useErrorBoundary)
      throwOnError: false,
    },
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

## Common Patterns

### Loading States

```typescript
function UserProfile({ userId }: { userId: string }) {
  const { data: user, isLoading, isError, error } = useUser(userId);

  if (isLoading) {
    return <Skeleton className="h-32 w-full" />;
  }

  if (isError) {
    return <ErrorMessage error={error} />;
  }

  return <div>{user.name}</div>;
}
```

### Prefetching

```typescript
// Prefetch on hover
function UserLink({ userId }: { userId: string }) {
  const queryClient = useQueryClient();

  const prefetchUser = () => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.userDetail(userId),
      queryFn: async () => {
        const result = await fetchApi<User>(`/api/users/${userId}`);
        if (!result.ok) throw result.error;
        return result.data;
      },
      staleTime: 10 * 1000, // Only prefetch if data is older than 10s
    });
  };

  return (
    <Link
      href={`/users/${userId}`}
      onMouseEnter={prefetchUser}
    >
      View Profile
    </Link>
  );
}
```

### Cache Management

```typescript
// Invalidate specific queries
queryClient.invalidateQueries({ queryKey: queryKeys.users() });

// Remove specific queries from cache
queryClient.removeQueries({ queryKey: queryKeys.userDetail(userId) });

// Reset all queries (refetch active ones)
queryClient.resetQueries();

// Set query data manually
queryClient.setQueryData(queryKeys.userDetail(userId), updatedUser);
```

## TypeScript Best Practices

### Strict Query Types

```typescript
// Define query return types explicitly
type UserQuery = {
  data: User;
  meta: {
    lastUpdated: string;
    version: number;
  };
};

// Create typed query functions
const fetchUser = async (id: string): Promise<UserQuery> => {
  const result = await fetchApi<UserQuery>(`/api/users/${id}`);
  if (!result.ok) throw result.error;
  return result.data;
};

// Use with type inference
export function useTypedUser(id: string) {
  return useQuery({
    queryKey: queryKeys.userDetail(id),
    queryFn: () => fetchUser(id),
    // TypeScript infers all types correctly
  });
}
```

### Query Options Pattern

```typescript
// Reusable query options with const assertion
export const userQueries = {
  detail: (id: string) =>
    ({
      queryKey: queryKeys.userDetail(id),
      queryFn: ({ signal }) => fetchUser(id, { signal }),
      staleTime: 5 * 60 * 1000,
    }) as const,

  list: (filters?: UserFilters) =>
    ({
      queryKey: queryKeys.userLists(filters),
      queryFn: ({ signal }) => fetchUsers(filters, { signal }),
      staleTime: 2 * 60 * 1000,
    }) as const,
} as const;

// Usage
const { data } = useQuery(userQueries.detail(userId));
const { data: users } = useQuery(userQueries.list({ role: 'admin' }));
```

## Server Actions Integration (Next.js)

```typescript
// Server action
'use server';

export async function updateUserAction(id: string, data: UpdateUserDto) {
  const validated = updateUserSchema.parse(data);
  const user = await db.user.update({
    where: { id },
    data: validated,
  });
  revalidatePath(`/users/${id}`);
  return user;
}

// Client component
export function useUpdateUserWithAction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateUserDto }) =>
      updateUserAction(id, data),
    onSuccess: user => {
      // Update cache with server response
      queryClient.setQueryData(queryKeys.userDetail(user.id), user);
      queryClient.invalidateQueries({ queryKey: queryKeys.userLists() });
    },
  });
}
```

## Best Practices

1. **Use Query Key Factories**: Centralize and type your query keys
2. **Handle All Error States**: Network, auth, and validation errors differently
3. **Configure Retry Logic**: Don't retry client errors (4xx)
4. **Set Appropriate Stale Times**: Balance freshness with performance
5. **Prefetch Critical Data**: Improve perceived performance
6. **Use Optimistic Updates**: For better UX in mutations
7. **Invalidate Intelligently**: Update related queries after mutations
8. **Leverage Suspense**: For cleaner loading states in v5
9. **Type Query Options**: Use const assertions and factory patterns
10. **Integrate with Server Actions**: Combine with Next.js App Router patterns
