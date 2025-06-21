---
slug: zustand-guide
title: Modern state management with Zustand
description: TypeScript-first state management patterns with Zustand.
type: guide
---

# Zustand Guide

Modern, lightweight state management with TypeScript-first patterns and minimal boilerplate.

## Overview

Zustand provides a small, fast, and scalable state management solution that doesn't wrap your app in providers. It's TypeScript-ready out of the box with excellent inference.

## Installation

```bash
pnpm add zustand
# Optional devtools
pnpm add -D @redux-devtools/extension
```

## Basic Store Setup

### TypeScript-First Approach

```typescript
// stores/user.store.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface User {
  id: string;
  name: string;
  email: string;
}

interface UserState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  setUser: (user: User) => void;
  clearUser: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useUserStore = create<UserState>()(
  devtools(
    set => ({
      user: null,
      isLoading: false,
      error: null,
      setUser: user => set({ user, error: null }),
      clearUser: () => set({ user: null }),
      setLoading: isLoading => set({ isLoading }),
      setError: error => set({ error }),
    }),
    {
      name: 'user-store',
    }
  )
);
```

## React Integration

### Component Usage

```typescript
// components/UserProfile.tsx
import { useUserStore } from '@/stores/user.store';

export function UserProfile() {
  const { user, isLoading, error } = useUserStore();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!user) return <div>No user logged in</div>;

  return (
    <div>
      <h2>{user.name}</h2>
      <p>{user.email}</p>
    </div>
  );
}
```

### Selective Subscriptions

```typescript
// Only re-render when specific fields change
function UserName() {
  const name = useUserStore((state) => state.user?.name);
  return <span>{name || 'Guest'}</span>;
}

// Using shallow equality for object selections
import { shallow } from 'zustand/shallow';

function UserActions() {
  const { setUser, clearUser } = useUserStore(
    (state) => ({ setUser: state.setUser, clearUser: state.clearUser }),
    shallow
  );

  return (
    <div>
      <button onClick={() => setUser({ id: '1', name: 'John', email: 'john@example.com' })}>
        Login
      </button>
      <button onClick={clearUser}>Logout</button>
    </div>
  );
}
```

## Advanced Patterns

### Async Actions

```typescript
interface AuthState extends UserState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  devtools(
    (set, get) => ({
      // ... previous state
      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
          });

          if (!response.ok) {
            throw new Error('Login failed');
          }

          const user = await response.json();
          set({ user, isLoading: false });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Unknown error',
            isLoading: false,
          });
        }
      },
      logout: async () => {
        set({ isLoading: true });
        try {
          await fetch('/api/logout', { method: 'POST' });
          set({ user: null, isLoading: false });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Logout failed',
            isLoading: false,
          });
        }
      },
    }),
    {
      name: 'auth-store',
    }
  )
);
```

### Computed Values

```typescript
interface CartState {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  // Computed values as getters
  total: () => number;
  itemCount: () => number;
}

export const useCartStore = create<CartState>()((set, get) => ({
  items: [],
  addItem: item =>
    set(state => ({
      items: [...state.items, item],
    })),
  removeItem: id =>
    set(state => ({
      items: state.items.filter(item => item.id !== id),
    })),
  total: () => {
    const { items } = get();
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  },
  itemCount: () => {
    const { items } = get();
    return items.reduce((count, item) => count + item.quantity, 0);
  },
}));
```

## Persistence

### Local Storage Persistence

```typescript
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface SettingsState {
  theme: 'light' | 'dark';
  language: string;
  setTheme: (theme: 'light' | 'dark') => void;
  setLanguage: (language: string) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    set => ({
      theme: 'light',
      language: 'en',
      setTheme: theme => set({ theme }),
      setLanguage: language => set({ language }),
    }),
    {
      name: 'app-settings',
      storage: createJSONStorage(() => localStorage),
      partialize: state => ({
        theme: state.theme,
        language: state.language,
      }),
    }
  )
);
```

## Testing

### Jest Setup

```typescript
// __tests__/stores/user.store.test.ts
import { renderHook, act } from '@testing-library/react';
import { useUserStore } from '@/stores/user.store';

// Reset store between tests
beforeEach(() => {
  useUserStore.setState({
    user: null,
    isLoading: false,
    error: null,
  });
});

describe('useUserStore', () => {
  it('should set user correctly', () => {
    const { result } = renderHook(() => useUserStore());

    act(() => {
      result.current.setUser({
        id: '1',
        name: 'Test User',
        email: 'test@example.com',
      });
    });

    expect(result.current.user).toEqual({
      id: '1',
      name: 'Test User',
      email: 'test@example.com',
    });
    expect(result.current.error).toBeNull();
  });

  it('should handle loading states', () => {
    const { result } = renderHook(() => useUserStore());

    act(() => {
      result.current.setLoading(true);
    });

    expect(result.current.isLoading).toBe(true);
  });
});
```

### Vitest Setup

```typescript
// __tests__/stores/cart.store.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCartStore } from '@/stores/cart.store';

beforeEach(() => {
  useCartStore.setState({ items: [] });
});

describe('useCartStore', () => {
  it('should calculate total correctly', () => {
    const { result } = renderHook(() => useCartStore());

    act(() => {
      result.current.addItem({
        id: '1',
        name: 'Product 1',
        price: 10,
        quantity: 2,
      });
      result.current.addItem({
        id: '2',
        name: 'Product 2',
        price: 20,
        quantity: 1,
      });
    });

    expect(result.current.total()).toBe(40);
    expect(result.current.itemCount()).toBe(3);
  });
});
```

## DevTools Integration

```typescript
// Enable Redux DevTools
import { devtools } from 'zustand/middleware';

const useStore = create<StoreState>()(
  devtools(
    set => ({
      /* ... */
    }),
    {
      name: 'my-store',
      // Action names in DevTools
      trace: true,
      // Anonymize actions in production
      anonymousActionType: process.env.NODE_ENV === 'production',
    }
  )
);
```

## Best Practices

1. **Keep stores focused**: One store per domain concern
2. **Use TypeScript**: Define interfaces for all state
3. **Avoid nested updates**: Use immer for complex updates
4. **Subscribe selectively**: Use selectors to minimize re-renders
5. **Test stores**: Unit test complex logic and async actions

## Common Patterns

### Store Composition

```typescript
// Combine multiple stores
export const useAppStore = () => {
  const user = useUserStore();
  const cart = useCartStore();
  const settings = useSettingsStore();

  return { user, cart, settings };
};
```

### Middleware Stack

```typescript
import { devtools, persist, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

const useStore = create<State>()(
  devtools(
    persist(
      subscribeWithSelector(
        immer(set => ({
          /* ... */
        }))
      ),
      { name: 'store-key' }
    ),
    { name: 'store-name' }
  )
);
```
