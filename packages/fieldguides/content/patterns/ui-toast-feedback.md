---
slug: ui-toast-feedback
title: Display toast notifications with Sonner and Result patterns
description: Type-safe toast notifications with Sonner for consistent user feedback.
type: pattern
---

# Toast Notifications with Sonner

Type-safe toast notifications with Sonner and Result pattern integration for
consistent user feedback across your application.

## Related Documentation

- [TypeScript Error Handling](./typescript-error-handling.md) - Result pattern
  implementation
- [React Patterns](./react-patterns.md) - Component integration patterns
- [TypeScript Validation](./typescript-validation.md) - Form validation with
  toasts

## Overview

Sonner provides beautiful, accessible toast notifications for React
applications. When integrated with the Result pattern and AppError types, it
creates a consistent system for displaying operation outcomes to users with
appropriate context and styling.

## Setup

```bash
npm install sonner
```

Add the Toaster component to your app root:

```tsx
import { Toaster } from 'sonner';

export function App() {
  return (
    <>
      <YourApp />
      <Toaster
        position="bottom-right"
        expand={false}
        richColors
        duration={5000}
      />
    </>
  );
}
```

## Toast Wrapper with Result Pattern

```typescript
import { toast } from 'sonner';
import type { Result, AppError, ErrorCode } from '@/lib/result';

type ToastOptions = {
  loading?: string;
  duration?: number; // in milliseconds
};

// Displays a toast message based on the Result status.
// Returns true if the result was successful, acting as a type guard.
export function showResultToast<T>(
  title: string,
  res: Result<T, AppError>,
  options?: Pick<ToastOptions, 'duration'> & { showSuccess?: boolean }
): res is { ok: true; data: T } {
  if (res.ok) {
    // Show success toast when explicitly enabled for consistent positive feedback
    if (options?.showSuccess) {
      toast.success(title, {
        description: 'Operation completed successfully.',
        duration: options?.duration,
      });
    }
  } else {
    toast.error(title, {
      description: humanise(res.error),
      duration: options?.duration,
    });
  }
  return res.ok;
}

// Wraps an async operation (Promise<Result<T>>) with loading, success, and error toasts.
export async function withToast<T>(
  promise: Promise<Result<T, AppError>>,
  messages: {
    loading: string;
    success: string;
    error?: string; // Optional custom error title, defaults to 'Operation failed'
  },
  toastOptions?: Pick<ToastOptions, 'duration'>
): Promise<Result<T, AppError>> {
  const id = toast.loading(messages.loading);
  const result = await promise;

  if (result.ok) {
    toast.success(messages.success, { id, duration: toastOptions?.duration });
  } else {
    toast.error(messages.error ?? 'Operation failed', {
      id,
      description: humanise(result.error),
      duration: toastOptions?.duration,
    });
  }

  return result;
}
```

## Error Humanization

Convert technical error codes to user-friendly messages:

```typescript
export function humanise(err: AppError): string {
  const messages: Partial<Record<ErrorCode, string>> = {
    'user.emailTaken':
      'This email is already registered. Please use a different email.',
    'user.notFound': 'The requested user could not be found.',
    notFound: 'The requested resource could not be found.',
    'auth.invalidToken': 'Your session has expired. Please sign in again.',
    'auth.unauthorized': "You don't have permission to perform this action.",
    validation: `Invalid input: ${err.message}`,
    badRequest: `There was a problem with your request: ${err.message}`,
    network:
      'A network error occurred. Please check your connection and try again.',
    serverError:
      'An unexpected error occurred on our server. Please try again later.',
    unexpected: 'An unexpected error occurred. Please try again.',
  };

  const message = messages[err.code];

  // Log unmapped error codes for telemetry and debugging
  if (!message && err.code) {
    console.warn(`Unmapped error code: ${err.code}`, { error: err });
  }

  return message ?? err.message ?? 'An unknown error occurred.';
}
```

## Usage Patterns

### Basic Usage

```typescript
// Simple operation feedback
async function deleteUser(id: string) {
  const result = await api.deleteUser(id);

  if (showResultToast('Delete User', result, { showSuccess: true })) {
    // Navigate away or update UI
    router.push('/users');
  }
}

// With loading state
async function updateProfile(data: ProfileData) {
  const result = await withToast(api.updateProfile(data), {
    loading: 'Updating profile...',
    success: 'Profile updated successfully',
    error: 'Failed to update profile',
  });

  if (result.ok) {
    // Handle success
  }
}
```

### Form Integration

```typescript
export function ContactForm() {
  const { handleSubmit, reset } = useForm<ContactData>();

  const onSubmit = async (data: ContactData) => {
    const result = await withToast(
      api.sendMessage(data),
      {
        loading: 'Sending message...',
        success: 'Message sent! We\'ll get back to you soon.',
      },
      { duration: 6000 } // Longer duration for important messages
    );

    if (result.ok) {
      reset();
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* Form fields */}
    </form>
  );
}
```

### Mutation Hook Integration

```typescript
import { useMutation } from '@tanstack/react-query';

export function useDeletePost() {
  return useMutation({
    mutationFn: (id: string) => api.deletePost(id),
    onMutate: () => {
      toast.loading('Deleting post...', { id: 'delete-post' });
    },
    onSuccess: () => {
      toast.success('Post deleted', { id: 'delete-post' });
    },
    onError: (error: AppError) => {
      toast.error('Failed to delete post', {
        id: 'delete-post',
        description: humanise(error),
      });
    },
  });
}
```

## Advanced Patterns

### Server Action Integration

```typescript
'use server';

import { revalidatePath } from 'next/cache';
import { createServerAction } from '@/lib/server-actions';

// Server action with built-in toast handling
export const updateProfile = createServerAction(
  async (data: ProfileData) => {
    const user = await db.user.update({
      where: { id: data.userId },
      data: data.updates,
    });

    revalidatePath('/profile');
    return user;
  },
  {
    toastMessages: {
      loading: 'Updating profile...',
      success: 'Profile updated successfully',
      error: 'Failed to update profile',
    },
  }
);

// Client component
function ProfileForm() {
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await updateProfile(formData);
      // Toast is automatically shown based on result
    });
  }

  return (
    <form action={handleSubmit}>
      {/* Form fields */}
      <button disabled={isPending}>Save</button>
    </form>
  );
}
```

### Optimistic Updates with Toasts

```typescript
import { useOptimistic } from 'react';

function TodoList({ todos }: { todos: Todo[] }) {
  const [optimisticTodos, updateOptimisticTodos] = useOptimistic(
    todos,
    (state, { action, todo }: { action: 'add' | 'delete' | 'toggle'; todo: Todo }) => {
      switch (action) {
        case 'add':
          return [...state, { ...todo, optimistic: true }];
        case 'delete':
          return state.filter(t => t.id !== todo.id);
        case 'toggle':
          return state.map(t =>
            t.id === todo.id ? { ...t, completed: !t.completed } : t
          );
        default:
          return state;
      }
    }
  );

  async function addTodo(title: string) {
    const tempTodo = { id: crypto.randomUUID(), title, completed: false };

    // Optimistic update
    updateOptimisticTodos({ action: 'add', todo: tempTodo });

    // Show loading toast
    const toastId = toast.loading('Adding todo...');

    try {
      const result = await api.createTodo({ title });

      if (result.ok) {
        toast.success('Todo added', { id: toastId });
      } else {
        // Revert optimistic update
        toast.error('Failed to add todo', {
          id: toastId,
          description: humanise(result.error),
        });
      }
    } catch (error) {
      toast.error('Network error', { id: toastId });
    }
  }

  return (
    <>
      {optimisticTodos.map(todo => (
        <TodoItem
          key={todo.id}
          todo={todo}
          className={todo.optimistic ? 'opacity-50' : ''}
        />
      ))}
    </>
  );
}
```

### Action Toasts

```typescript
export function showUndoToast(message: string, onUndo: () => void) {
  toast(message, {
    action: {
      label: 'Undo',
      onClick: onUndo,
    },
    duration: 8000, // Give users time to undo
  });
}

// Usage
async function archiveItem(id: string) {
  const result = await api.archiveItem(id);

  if (result.ok) {
    showUndoToast('Item archived', async () => {
      await api.unarchiveItem(id);
      toast.success('Item restored');
    });
  }
}
```

### Custom Toast Types

```typescript
// Warning toast for non-critical issues
export function showWarning(message: string, description?: string) {
  toast(message, {
    description,
    duration: 6000,
    style: {
      background: '#FEF3C7',
      color: '#92400E',
      border: '1px solid #F59E0B',
    },
    icon: '⚠️',
  });
}

// Info toast for neutral information
export function showInfo(message: string, description?: string) {
  toast(message, {
    description,
    duration: 4000,
    style: {
      background: '#DBEAFE',
      color: '#1E40AF',
      border: '1px solid #3B82F6',
    },
    icon: 'ℹ️',
  });
}
```

### Promise Toast Pattern

```typescript
// Automatically handle promise states
export function toastPromise<T>(
  promise: Promise<Result<T, AppError>>,
  messages: {
    loading: string;
    success: string;
    error?: string;
  }
): Promise<Result<T, AppError>> {
  return toast
    .promise(
      promise.then(result => {
        if (!result.ok) {
          throw result.error;
        }
        return result.data;
      }),
      {
        loading: messages.loading,
        success: messages.success,
        error: (err: AppError) =>
          messages.error
            ? `${messages.error}: ${humanise(err)}`
            : humanise(err),
      }
    )
    .then(
      data => ({ ok: true, data }) as const,
      error => ({ ok: false, error }) as const
    );
}
```

### Context-Aware Toasts

```typescript
// Show different messages based on error type
export function showContextualError(error: AppError, context?: string) {
  const title = getErrorTitle(error.code, context);
  const description = humanise(error);

  // Critical errors get longer duration and different styling
  const isCritical = ['auth.invalidToken', 'serverError'].includes(error.code);

  toast.error(title, {
    description,
    duration: isCritical ? 10000 : 5000,
    important: isCritical,
  });
}

function getErrorTitle(code: ErrorCode, context?: string): string {
  if (context) {
    return `Failed to ${context}`;
  }

  const titles: Partial<Record<ErrorCode, string>> = {
    'auth.invalidToken': 'Session Expired',
    'auth.unauthorized': 'Access Denied',
    network: 'Connection Error',
    serverError: 'Server Error',
    validation: 'Invalid Input',
  };

  return titles[code] ?? 'Operation Failed';
}
```

### Multi-Step Operations

```typescript
export async function performBulkOperation<T>(
  items: T[],
  operation: (item: T) => Promise<Result<void, AppError>>,
  options: {
    title: string;
    onProgress?: (completed: number, total: number) => void;
  }
) {
  const total = items.length;
  let completed = 0;
  let failed = 0;

  const toastId = toast.loading(`${options.title} (0/${total})`);

  for (const item of items) {
    const result = await operation(item);

    if (result.ok) {
      completed++;
    } else {
      failed++;
    }

    // Update progress
    toast.loading(
      `${options.title} (${completed}/${total})${failed ? ` - ${failed} failed` : ''}`,
      { id: toastId }
    );

    options.onProgress?.(completed, total);
  }

  // Final status
  if (failed === 0) {
    toast.success(`${options.title} completed successfully`, { id: toastId });
  } else if (failed === total) {
    toast.error(`${options.title} failed`, { id: toastId });
  } else {
    toast.warning(`${options.title} completed with errors`, {
      id: toastId,
      description: `${completed} succeeded, ${failed} failed`,
    });
  }

  return { completed, failed, total };
}

// Usage
const result = await performBulkOperation(
  selectedUsers,
  async user => api.sendNotification(user.id),
  {
    title: 'Sending notifications',
    onProgress: (completed, total) => {
      setProgress((completed / total) * 100);
    },
  }
);
```

## Real-time Updates

### WebSocket Integration

```typescript
import { useEffect } from 'react';
import { toast } from 'sonner';

export function useRealtimeNotifications() {
  useEffect(() => {
    const ws = new WebSocket(process.env.NEXT_PUBLIC_WS_URL!);

    ws.onmessage = event => {
      const notification = JSON.parse(event.data);

      switch (notification.type) {
        case 'info':
          toast.info(notification.title, {
            description: notification.message,
          });
          break;

        case 'success':
          toast.success(notification.title, {
            description: notification.message,
          });
          break;

        case 'warning':
          toast.warning(notification.title, {
            description: notification.message,
            duration: 8000,
          });
          break;

        case 'error':
          toast.error(notification.title, {
            description: notification.message,
            duration: 10000,
          });
          break;

        case 'update':
          // Update existing toast
          toast.message(notification.title, {
            id: notification.id,
            description: notification.message,
          });
          break;
      }
    };

    return () => ws.close();
  }, []);
}
```

### Push Notification Fallback

```typescript
export async function showNotificationWithFallback(
  title: string,
  options?: {
    body?: string;
    icon?: string;
    tag?: string;
  }
) {
  // Try native notification first
  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(title, options);
      return;
    } catch (error) {
      console.warn('Native notification failed:', error);
    }
  }

  // Fall back to toast
  toast(title, {
    description: options?.body,
  });
}
```

## Configuration

### Global Configuration

```typescript
// app/providers.tsx
import { Toaster } from 'sonner';

export function ToastProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Toaster
        // Positioning
        position="bottom-right"

        // Styling
        toastOptions={{
          classNames: {
            toast: 'font-sans',
            title: 'text-sm font-medium',
            description: 'text-sm opacity-90',
            actionButton: 'bg-primary text-primary-foreground',
            cancelButton: 'bg-secondary text-secondary-foreground',
          },
        }}

        // Behavior
        closeButton
        richColors
        expand={false}
        duration={5000}
        visibleToasts={3}

        // Accessibility
        ariaLabel="Notifications"
      />
    </>
  );
}
```

### Theme Integration

```typescript
// Match toasts to your app theme
const isDarkMode = useTheme().theme === 'dark';

<Toaster
  theme={isDarkMode ? 'dark' : 'light'}
  toastOptions={{
    style: {
      background: isDarkMode ? '#1F2937' : '#FFFFFF',
      color: isDarkMode ? '#F9FAFB' : '#111827',
      border: isDarkMode ? '1px solid #374151' : '1px solid #E5E7EB',
    },
  }}
/>
```

## Accessibility Enhancements

### Screen Reader Support

```typescript
// Enhanced toast with ARIA live regions
export function accessibleToast(
  message: string,
  options?: {
    type?: 'success' | 'error' | 'info' | 'warning';
    description?: string;
    ariaLive?: 'polite' | 'assertive';
  }
) {
  const ariaLive = options?.type === 'error' ? 'assertive' : 'polite';

  const toastFn = toast[options?.type || 'message'];

  toastFn(message, {
    description: options?.description,
    ariaProps: {
      role: 'status',
      'aria-live': ariaLive,
      'aria-atomic': 'true',
    },
  });
}

// Announce important changes
export function announceChange(message: string) {
  // Create a visually hidden live region
  const liveRegion = document.createElement('div');
  liveRegion.setAttribute('role', 'status');
  liveRegion.setAttribute('aria-live', 'polite');
  liveRegion.setAttribute('aria-atomic', 'true');
  liveRegion.className = 'sr-only';
  liveRegion.textContent = message;

  document.body.appendChild(liveRegion);

  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(liveRegion);
  }, 1000);
}
```

## Testing Toast Notifications

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import { Toaster } from 'sonner';
import { showResultToast } from './toast-utils';

describe('Toast Notifications', () => {
  beforeEach(() => {
    render(<Toaster />);
  });

  test('shows success toast for successful result', async () => {
    const result = { ok: true as const, data: { id: '1' } };

    showResultToast('Operation', result, { showSuccess: true });

    await waitFor(() => {
      expect(screen.getByText('Operation')).toBeInTheDocument();
      expect(screen.getByText('Operation completed successfully.')).toBeInTheDocument();
    });
  });

  test('shows error toast with humanized message', async () => {
    const result = {
      ok: false as const,
      error: {
        code: 'auth.invalidToken' as const,
        message: 'Token expired',
      },
    };

    showResultToast('Login', result);

    await waitFor(() => {
      expect(screen.getByText('Login')).toBeInTheDocument();
      expect(screen.getByText('Your session has expired. Please sign in again.')).toBeInTheDocument();
    });
  });
});
```

## Best Practices

1. **Use Semantic Toast Types**: Success for completion, error for failures,
   loading for progress
2. **Provide Clear Messages**: Titles should be action-oriented, descriptions
   should explain why
3. **Handle All Error Types**: Map technical errors to user-friendly messages
4. **Consider Duration**: Critical errors need longer display time
5. **Enable User Actions**: Provide undo, retry, or navigation options when
   relevant
6. **Avoid Toast Spam**: Batch similar notifications, use replace for updates
7. **Test Accessibility**: Ensure screen readers announce toasts appropriately
8. **Provide Fallbacks**: Use native notifications when available, fall back to
   toasts
9. **Track Analytics**: Monitor which toasts users see most often
10. **Respect Preferences**: Allow users to configure notification preferences
