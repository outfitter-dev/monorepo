---
slug: react-hook-form
title: Handle forms with React Hook Form v7 and Zod validation
description: Type-safe form handling with react-hook-form v7 and Zod validation.
type: guide
---

# React Hook Form v7 Integration

Type-safe form handling with react-hook-form v7, Zod validation, and Result pattern integration.

## Related Documentation

- [TypeScript Validation](../patterns/typescript-validation.md) - Zod validation patterns
- [React Patterns](../patterns/react-patterns.md) - React component patterns
- [TypeScript Error Handling](../patterns/typescript-error-handling.md) - Result pattern
- [TypeScript Standards](../standards/typescript-standards.md) - Type safety
- [React Component Standards](../standards/react-component-standards.md) - Form components

## Overview

React Hook Form v7 provides performant, flexible forms with excellent TypeScript support. When combined with Zod for schema validation and the Result pattern for API calls, it creates a robust form handling system with type safety throughout.

## Setup

```bash
npm install react-hook-form@^7 @hookform/resolvers zod
```

## TypeScript Configuration

```typescript
// Ensure strict mode in tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "strictNullChecks": true,
    "noUncheckedIndexedAccess": true
  }
}
```

## Basic Form with Zod Validation

```typescript
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// Define schema with Zod - single source of truth
const loginSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase().trim(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  rememberMe: z.boolean().optional().default(false),
});

// Infer TypeScript type from schema
type LoginFormData = z.infer<typeof loginSchema>;

export function LoginForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isValid },
    setError,
    reset,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: 'onBlur', // Validate on blur for better UX
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  const onSubmit: SubmitHandler<LoginFormData> = async (data) => {
    try {
      const result = await loginUser(data);
      if (!result.ok) {
        if (result.error.code === 'auth.invalidCredentials') {
          setError('root', {
            type: 'manual',
            message: 'Invalid email or password',
          });
        }
        return;
      }
      reset(); // Clear form on success
    } catch (error) {
      setError('root', {
        type: 'manual',
        message: 'An unexpected error occurred',
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          {...register('email')}
          aria-invalid={!!errors.email}
        />
        {errors.email && (
          <p className="error">{errors.email.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          {...register('password')}
          aria-invalid={!!errors.password}
        />
        {errors.password && (
          <p className="error">{errors.password.message}</p>
        )}
      </div>

      <div>
        <label>
          <input type="checkbox" {...register('rememberMe')} />
          Remember me
        </label>
      </div>

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Signing in...' : 'Sign In'}
      </button>
    </form>
  );
}
```

## Complex Form with Result Pattern Integration

```typescript
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ZodError } from 'zod';
import { createUserSchema, CreateUserInput } from '@/schemas/user.schema';
import { createUser } from '@/api/user.api';
import { showResultToast } from '@/lib/toast';
import { AppError } from '@/lib/error';

export function UserRegistrationForm() {
  const form = useForm<CreateUserInput>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      email: '',
      name: '',
      role: 'user', // Sensible default
      password: '',
      confirmPassword: '',
      bio: null,
    },
  });

  const { register, handleSubmit, formState: { errors, isSubmitting }, setError } = form;

  const onSubmit: SubmitHandler<CreateUserInput> = async (data) => {
    // The 'data' is already validated by Zod via react-hook-form
    const result = await createUser(data); // createUser returns Result<User, AppError>

    if (!result.ok) {
      const appError = result.error;

      // Map API errors back to form fields
      if (appError.code === 'user.emailTaken') {
        setError('email', {
          type: 'manual',
          message: appError.message,
        });
      } else if (appError.code === 'validation' && appError.cause instanceof ZodError) {
        // Handle detailed validation errors from server
        appError.cause.errors.forEach(err => {
          const field = err.path.join('.') as keyof CreateUserInput;
          if (field) {
            setError(field, { type: 'server', message: err.message });
          }
        });
      } else {
        // Generic error toast for other unmapped errors
        showResultToast('Registration Failed', result);
      }
      return;
    }

    // Success handling
    showResultToast('Registration Successful', result, { showSuccess: true });
    form.reset(); // Optionally reset form on success
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Email Field */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          type="email"
          {...register('email')}
          className={cn(
            'mt-1 block w-full rounded-md border px-3 py-2',
            errors.email && 'border-red-500'
          )}
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? 'email-error' : undefined}
        />
        {errors.email && (
          <p id="email-error" className="mt-1 text-sm text-red-600">
            {errors.email.message}
          </p>
        )}
      </div>

      {/* Name Field */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium">
          Name
        </label>
        <input
          id="name"
          type="text"
          {...register('name')}
          className={cn(
            'mt-1 block w-full rounded-md border px-3 py-2',
            errors.name && 'border-red-500'
          )}
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
        )}
      </div>

      {/* Role Select */}
      <div>
        <label htmlFor="role" className="block text-sm font-medium">
          Role
        </label>
        <select
          id="role"
          {...register('role')}
          className="mt-1 block w-full rounded-md border px-3 py-2"
        >
          <option value="user">User</option>
          <option value="admin">Admin</option>
          <option value="guest">Guest</option>
        </select>
      </div>

      {/* Password Fields */}
      <div>
        <label htmlFor="password" className="block text-sm font-medium">
          Password
        </label>
        <input
          id="password"
          type="password"
          {...register('password')}
          className={cn(
            'mt-1 block w-full rounded-md border px-3 py-2',
            errors.password && 'border-red-500'
          )}
        />
        {errors.password && (
          <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium">
          Confirm Password
        </label>
        <input
          id="confirmPassword"
          type="password"
          {...register('confirmPassword')}
          className={cn(
            'mt-1 block w-full rounded-md border px-3 py-2',
            errors.confirmPassword && 'border-red-500'
          )}
        />
        {errors.confirmPassword && (
          <p className="mt-1 text-sm text-red-600">
            {errors.confirmPassword.message}
          </p>
        )}
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {isSubmitting ? 'Registering...' : 'Register'}
      </button>
    </form>
  );
}
```

## Advanced Patterns

### Dynamic Form Arrays

```typescript
import { useFieldArray } from 'react-hook-form';

const teamSchema = z.object({
  name: z.string().min(1, 'Team name is required'),
  members: z.array(z.object({
    email: z.string().email('Invalid email'),
    role: z.enum(['leader', 'member']),
  })).min(1, 'At least one member is required'),
});

type TeamFormData = z.infer<typeof teamSchema>;

export function TeamForm() {
  const { control, register, handleSubmit, formState: { errors } } = useForm<TeamFormData>({
    resolver: zodResolver(teamSchema),
    defaultValues: {
      name: '',
      members: [{ email: '', role: 'member' }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'members',
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('name')} placeholder="Team Name" />

      {fields.map((field, index) => (
        <div key={field.id} className="flex gap-2">
          <input
            {...register(`members.${index}.email`)}
            placeholder="Email"
          />
          <select {...register(`members.${index}.role`)}>
            <option value="member">Member</option>
            <option value="leader">Leader</option>
          </select>
          <button
            type="button"
            onClick={() => remove(index)}
            disabled={fields.length === 1}
          >
            Remove
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={() => append({ email: '', role: 'member' })}
      >
        Add Member
      </button>

      <button type="submit">Create Team</button>
    </form>
  );
}
```

### Controlled Components Integration

```typescript
import { Controller } from 'react-hook-form';
import { DatePicker } from '@/components/ui/date-picker';
import { Switch } from '@/components/ui/switch';

const eventSchema = z.object({
  title: z.string().min(1),
  date: z.date(),
  isPublic: z.boolean(),
});

export function EventForm() {
  const { control, handleSubmit } = useForm<z.infer<typeof eventSchema>>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: '',
      date: new Date(),
      isPublic: false,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Controller
        control={control}
        name="date"
        render={({ field, fieldState }) => (
          <div>
            <DatePicker
              value={field.value}
              onChange={field.onChange}
              error={fieldState.error?.message}
            />
          </div>
        )}
      />

      <Controller
        control={control}
        name="isPublic"
        render={({ field }) => (
          <div className="flex items-center space-x-2">
            <Switch
              checked={field.value}
              onCheckedChange={field.onChange}
            />
            <label>Make event public</label>
          </div>
        )}
      />
    </form>
  );
}
```

### Form State Management

```typescript
import { useFormContext, FormProvider } from 'react-hook-form';

// Parent component
export function MultiStepForm() {
  const methods = useForm<ComplexFormData>({
    resolver: zodResolver(complexSchema),
    mode: 'onChange', // Validate on change for better UX
  });

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)}>
        <Step1 />
        <Step2 />
        <Step3 />
      </form>
    </FormProvider>
  );
}

// Child component accessing form context
function Step1() {
  const {
    register,
    formState: { errors },
    watch,
  } = useFormContext<ComplexFormData>();

  const email = watch('email'); // Watch specific field

  return (
    <div>
      <input {...register('email')} />
      {email && <p>Sending to: {email}</p>}
    </div>
  );
}
```

### Advanced Zod Integration

```typescript
import { z } from 'zod';

// Complex schema with refinements and transforms
const userSchema = z
  .object({
    username: z
      .string()
      .min(3, 'Minimum 3 characters')
      .max(20, 'Maximum 20 characters')
      .regex(/^[a-zA-Z0-9_]+$/, 'Only letters, numbers, and underscores')
      .transform(val => val.toLowerCase()),

    email: z
      .string()
      .email('Invalid email format')
      .transform(val => val.toLowerCase().trim()),

    password: z
      .string()
      .min(8, 'Minimum 8 characters')
      .regex(/[A-Z]/, 'Must contain uppercase letter')
      .regex(/[a-z]/, 'Must contain lowercase letter')
      .regex(/[0-9]/, 'Must contain number')
      .regex(/[^A-Za-z0-9]/, 'Must contain special character'),

    confirmPassword: z.string(),

    age: z.coerce
      .number()
      .int('Must be whole number')
      .min(18, 'Must be 18 or older')
      .max(120, 'Invalid age'),

    preferences: z.object({
      newsletter: z.boolean().default(false),
      notifications: z.enum(['all', 'important', 'none']).default('important'),
    }),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

// Async validation with server check
const registrationSchema = userSchema.extend({
  username: userSchema.shape.username.refine(
    async username => {
      const result = await checkUsernameAvailability(username);
      return result.ok && result.data.available;
    },
    { message: 'Username already taken' }
  ),
});

// Partial schemas for updates
const updateUserSchema = userSchema.partial().omit({ confirmPassword: true });
```

### TypeScript Validation Patterns

```typescript
// Type-safe error handling
type FormError<T> = {
  [K in keyof T]?: string | string[];
} & {
  root?: string;
};

// Generic form hook with validation
function useValidatedForm<TSchema extends z.ZodSchema>(
  schema: TSchema,
  onSubmit: (data: z.infer<TSchema>) => Promise<void>
) {
  type FormData = z.infer<TSchema>;

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: 'onBlur',
  });

  const handleSubmit = form.handleSubmit(async data => {
    try {
      await onSubmit(data);
    } catch (error) {
      if (error instanceof AppError) {
        mapErrorToForm(error, form.setError);
      }
    }
  });

  return {
    ...form,
    handleSubmit,
  };
}
```

## Error Handling Patterns

### Field-Level Error Mapping

```typescript
// Utility to map server errors to form fields
function mapServerErrorsToForm<T extends FieldValues>(
  error: AppError,
  setError: UseFormSetError<T>
) {
  if (error.code === 'validation' && error.cause instanceof ZodError) {
    error.cause.errors.forEach(err => {
      const field = err.path.join('.') as Path<T>;
      setError(field, {
        type: 'server',
        message: err.message,
      });
    });
  } else if (error.code === 'badRequest' && error.details) {
    // Handle custom server validation errors
    Object.entries(error.details).forEach(([field, message]) => {
      setError(field as Path<T>, {
        type: 'server',
        message: String(message),
      });
    });
  }
}
```

### Global Error Display

```typescript
export function FormWithGlobalError() {
  const [globalError, setGlobalError] = useState<string | null>(null);

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    setGlobalError(null);

    const result = await submitForm(data);

    if (!result.ok) {
      if (result.error.code === 'serverError') {
        setGlobalError('Server error. Please try again later.');
      } else {
        mapServerErrorsToForm(result.error, setError);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {globalError && (
        <div className="rounded-md bg-red-50 p-4 mb-4">
          <p className="text-sm text-red-800">{globalError}</p>
        </div>
      )}
      {/* Form fields */}
    </form>
  );
}
```

## Server Actions Integration (Next.js)

```typescript
// server-actions.ts
'use server';

import { z } from 'zod';
import { createUser } from '@/lib/db';
import { revalidatePath } from 'next/cache';

const createUserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  role: z.enum(['user', 'admin']),
});

export async function createUserAction(formData: FormData) {
  const rawData = Object.fromEntries(formData);

  const validated = createUserSchema.safeParse(rawData);
  if (!validated.success) {
    return {
      ok: false as const,
      errors: validated.error.flatten().fieldErrors,
    };
  }

  try {
    const user = await createUser(validated.data);
    revalidatePath('/users');
    return { ok: true as const, data: user };
  } catch (error) {
    return {
      ok: false as const,
      errors: { _form: ['Failed to create user'] },
    };
  }
}

// Client component
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createUserAction } from './server-actions';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';

export function CreateUserForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<z.infer<typeof createUserSchema>>({
    resolver: zodResolver(createUserSchema),
  });

  const onSubmit = handleSubmit((data) => {
    startTransition(async () => {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        formData.append(key, String(value));
      });

      const result = await createUserAction(formData);

      if (!result.ok) {
        // Map server errors to form
        Object.entries(result.errors).forEach(([field, messages]) => {
          if (field === '_form') {
            setError('root', { message: messages[0] });
          } else {
            setError(field as any, { message: messages[0] });
          }
        });
        return;
      }

      router.push('/users');
    });
  });

  return (
    <form onSubmit={onSubmit}>
      {/* Form fields */}
      <button type="submit" disabled={isPending}>
        {isPending ? 'Creating...' : 'Create User'}
      </button>
    </form>
  );
}
```

## Performance Optimization

### Debounced Validation

```typescript
import { useDebouncedCallback } from 'use-debounce';
import { useEffect } from 'react';

export function SearchForm() {
  const { register, watch, setError, clearErrors, setValue } = useForm();
  const searchTerm = watch('search');

  // Debounced async validation
  const validateSearch = useDebouncedCallback(async (value: string) => {
    if (!value || value.length < 3) {
      setError('search', { message: 'Enter at least 3 characters' });
      return;
    }

    clearErrors('search');

    // Check availability
    const result = await checkAvailability(value);
    if (!result.ok) {
      setError('search', { message: 'Not available' });
    }
  }, 500);

  useEffect(() => {
    if (searchTerm) {
      validateSearch(searchTerm);
    }
  }, [searchTerm, validateSearch]);

  return (
    <div>
      <input
        {...register('search')}
        placeholder="Search..."
        autoComplete="off"
      />
      {errors.search && (
        <span className="text-red-500">{errors.search.message}</span>
      )}
    </div>
  );
}
```

### Optimized Re-renders

```typescript
// Use formState proxy to avoid unnecessary re-renders
export function OptimizedForm() {
  const { register, handleSubmit, control, formState } = useForm();

  // Only re-render when these specific values change
  const { errors, isSubmitting, isValid } = formState;

  // Watch specific fields without re-rendering entire form
  const watchEmail = useWatch({
    control,
    name: 'email',
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <EmailField register={register} error={errors.email} />
      <PasswordField register={register} error={errors.password} />

      {/* Only this component re-renders when email changes */}
      <EmailPreview email={watchEmail} />

      <button disabled={!isValid || isSubmitting}>
        Submit
      </button>
    </form>
  );
}
```

## TypeScript Best Practices

### Type-Safe Form Components

```typescript
// Generic form field component
interface FormFieldProps<TFieldValues extends FieldValues> {
  name: Path<TFieldValues>;
  control: Control<TFieldValues>;
  label: string;
  placeholder?: string;
  type?: string;
}

function FormField<TFieldValues extends FieldValues>({
  name,
  control,
  label,
  ...props
}: FormFieldProps<TFieldValues>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <div>
          <label htmlFor={name}>{label}</label>
          <input
            {...field}
            {...props}
            id={name}
            aria-invalid={!!fieldState.error}
            aria-describedby={fieldState.error ? `${name}-error` : undefined}
          />
          {fieldState.error && (
            <span id={`${name}-error`} className="error">
              {fieldState.error.message}
            </span>
          )}
        </div>
      )}
    />
  );
}
```

### Form State Types

```typescript
// Type-safe form state management
type FormStatus = 'idle' | 'submitting' | 'success' | 'error';

interface FormState<T> {
  status: FormStatus;
  data?: T;
  error?: string;
}

function useFormState<T>() {
  const [state, setState] = useState<FormState<T>>({
    status: 'idle',
  });

  const setSubmitting = () => setState({ status: 'submitting' });
  const setSuccess = (data: T) => setState({ status: 'success', data });
  const setError = (error: string) => setState({ status: 'error', error });
  const reset = () => setState({ status: 'idle' });

  return { state, setSubmitting, setSuccess, setError, reset };
}
```

## Best Practices

1. **Use Zod for Schema Definition**: Single source of truth for validation
2. **Handle All Error Types**: Field-level, global, and async validation errors
3. **Provide Loading States**: Disable form during submission
4. **Map Server Errors**: Convert API errors to field-specific messages
5. **Use Proper Accessibility**: Labels, error associations, and ARIA attributes
6. **Optimize Re-renders**: Use `formState` proxy and `useWatch` selectively
7. **Test Form Behavior**: Unit test validation logic and integration test form flow
8. **Type Everything**: Leverage TypeScript's inference with Zod schemas
9. **Use Server Actions**: Integrate with Next.js App Router when applicable
10. **Implement Proper Security**: Validate on both client and server
