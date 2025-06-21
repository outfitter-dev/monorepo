---
slug: testing-unit
title: Write fast, isolated unit tests with AAA pattern
description: Best practices for unit tests that are fast, isolated, and maintainable.
type: pattern
---

# Unit Testing Patterns

Best practices for writing effective unit tests that are fast, isolated, and maintainable.

## Related Documentation

- [Testing Standards](../standards/testing-standards.md) - Testing fundamentals
- [TypeScript Standards](../standards/typescript-standards.md) - Type-safe testing
- [TypeScript Error Handling](./typescript-error-handling.md) - Testing error scenarios
- [Integration Testing](./testing-integration.md) - Testing component interactions

## Framework Choice

Both Jest and Vitest are supported. Choose based on your project needs:

### Jest

- Mature ecosystem with extensive plugins
- Built-in code coverage
- Excellent for projects already using Jest
- Better for React Native projects

```typescript
// Jest configuration
export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  collectCoverageFrom: ['src/**/*.ts'],
  coverageThreshold: {
    global: { branches: 80, functions: 80, lines: 80 },
  },
};
```

### Vitest

- Faster execution with native ES modules
- Better TypeScript support out of the box
- Compatible with Vite projects
- Jest-compatible API

```typescript
// Vitest configuration
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      thresholds: {
        branches: 80,
        functions: 80,
        lines: 80,
      },
    },
  },
});
```

## Core Principles

### Test Structure (AAA Pattern)

```typescript
describe('Calculator', () => {
  describe('add', () => {
    it('should add two positive numbers', () => {
      // Arrange
      const calculator = new Calculator();
      const a = 5;
      const b = 3;

      // Act
      const result = calculator.add(a, b);

      // Assert
      expect(result).toBe(8);
    });
  });
});
```

### Test Naming

```typescript
// Good: Descriptive, behavior-focused
it('should return user data when valid ID is provided', () => {});
it('should throw ValidationError when email format is invalid', () => {});
it('should retry failed requests up to 3 times', () => {});

// Bad: Vague or implementation-focused
it('test user', () => {});
it('checks email', () => {});
it('retry logic', () => {});
```

## Pure Functions

### Simple Calculations

```typescript
// Function to test
export function calculateDiscount(price: number, percentage: number): number {
  if (price < 0 || percentage < 0 || percentage > 100) {
    throw new Error('Invalid input');
  }
  return price * (1 - percentage / 100);
}

// Tests
describe('calculateDiscount', () => {
  it('should calculate correct discount', () => {
    expect(calculateDiscount(100, 10)).toBe(90);
    expect(calculateDiscount(50, 25)).toBe(37.5);
    expect(calculateDiscount(200, 0)).toBe(200);
  });

  it('should handle edge cases', () => {
    expect(calculateDiscount(100, 100)).toBe(0);
    expect(calculateDiscount(0, 50)).toBe(0);
  });

  it('should throw on invalid input', () => {
    expect(() => calculateDiscount(-100, 10)).toThrow('Invalid input');
    expect(() => calculateDiscount(100, -10)).toThrow('Invalid input');
    expect(() => calculateDiscount(100, 101)).toThrow('Invalid input');
  });
});
```

### Data Transformations

```typescript
// Function to test
export function normalizeUser(rawUser: any): User {
  return {
    id: rawUser.id || rawUser._id,
    email: rawUser.email.toLowerCase().trim(),
    name: rawUser.name.trim(),
    isActive: Boolean(rawUser.active || rawUser.isActive),
    createdAt: new Date(rawUser.created_at || rawUser.createdAt),
  };
}

// Tests with test data
describe('normalizeUser', () => {
  it('should normalize user data correctly', () => {
    const rawUser = {
      _id: '123',
      email: ' USER@EXAMPLE.COM ',
      name: ' John Doe ',
      active: 1,
      created_at: '2023-01-01T00:00:00Z',
    };

    const result = normalizeUser(rawUser);

    expect(result).toEqual({
      id: '123',
      email: 'user@example.com',
      name: 'John Doe',
      isActive: true,
      createdAt: new Date('2023-01-01T00:00:00Z'),
    });
  });

  it('should handle alternative field names', () => {
    const rawUser = {
      id: '456',
      email: 'test@example.com',
      name: 'Jane Doe',
      isActive: false,
      createdAt: '2023-01-01T00:00:00Z',
    };

    const result = normalizeUser(rawUser);

    expect(result.id).toBe('456');
    expect(result.isActive).toBe(false);
  });
});
```

## Class Testing

### Testing with Dependencies

```typescript
// Class to test
export class UserService {
  constructor(
    private db: Database,
    private emailService: EmailService,
    private logger: Logger
  ) {}

  async createUser(data: CreateUserData): Promise<User> {
    this.logger.info('Creating user', { email: data.email });

    const existingUser = await this.db.users.findByEmail(data.email);
    if (existingUser) {
      throw new Error('Email already exists');
    }

    const user = await this.db.users.create(data);

    await this.emailService.sendWelcomeEmail(user.email, user.name);

    this.logger.info('User created', { userId: user.id });
    return user;
  }
}

// Tests with mocks (Vitest)
describe('UserService', () => {
  let userService: UserService;
  let mockDb: MockDatabase;
  let mockEmailService: MockEmailService;
  let mockLogger: MockLogger;

  beforeEach(() => {
    // Vitest uses vi.fn()
    mockDb = {
      users: {
        findByEmail: vi.fn(),
        create: vi.fn(),
      },
    };
    mockEmailService = {
      sendWelcomeEmail: vi.fn(),
    };
    mockLogger = {
      info: vi.fn(),
      error: vi.fn(),
    };

    userService = new UserService(mockDb, mockEmailService, mockLogger);
  });

  // Alternative: Jest syntax
  beforeEach(() => {
    // Jest uses jest.fn()
    mockDb = {
      users: {
        findByEmail: jest.fn(),
        create: jest.fn(),
      },
    };
    mockEmailService = {
      sendWelcomeEmail: jest.fn(),
    };
    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
    };

    userService = new UserService(mockDb, mockEmailService, mockLogger);
  });

  describe('createUser', () => {
    it('should create user successfully', async () => {
      const userData = {
        email: 'new@example.com',
        name: 'New User',
        password: 'password123',
      };
      const createdUser = { id: '123', ...userData };

      // Vitest syntax
      mockDb.users.findByEmail.mockResolvedValue(null);
      mockDb.users.create.mockResolvedValue(createdUser);
      mockEmailService.sendWelcomeEmail.mockResolvedValue(undefined);

      // Jest syntax (identical in this case)
      // mockDb.users.findByEmail.mockResolvedValue(null);
      // mockDb.users.create.mockResolvedValue(createdUser);
      // mockEmailService.sendWelcomeEmail.mockResolvedValue(undefined);

      const result = await userService.createUser(userData);

      expect(result).toEqual(createdUser);
      expect(mockDb.users.findByEmail).toHaveBeenCalledWith('new@example.com');
      expect(mockDb.users.create).toHaveBeenCalledWith(userData);
      expect(mockEmailService.sendWelcomeEmail).toHaveBeenCalledWith(
        'new@example.com',
        'New User'
      );
      expect(mockLogger.info).toHaveBeenCalledTimes(2);
    });

    it('should throw error if email exists', async () => {
      mockDb.users.findByEmail.mockResolvedValue({ id: 'existing' });

      await expect(
        userService.createUser({ email: 'existing@example.com' })
      ).rejects.toThrow('Email already exists');

      expect(mockDb.users.create).not.toHaveBeenCalled();
      expect(mockEmailService.sendWelcomeEmail).not.toHaveBeenCalled();
    });
  });
});
```

## Error Testing

### Testing Error Cases

```typescript
describe('Error handling', () => {
  it('should handle synchronous errors', () => {
    const dangerousFunction = () => {
      throw new Error('Something went wrong');
    };

    expect(dangerousFunction).toThrow('Something went wrong');
    expect(dangerousFunction).toThrow(Error);
  });

  it('should handle async errors', async () => {
    const asyncFunction = async () => {
      throw new Error('Async error');
    };

    await expect(asyncFunction()).rejects.toThrow('Async error');
  });

  it('should handle specific error types', () => {
    class ValidationError extends Error {
      constructor(
        public field: string,
        message: string
      ) {
        super(message);
      }
    }

    const validate = (email: string) => {
      if (!email.includes('@')) {
        throw new ValidationError('email', 'Invalid email format');
      }
    };

    expect(() => validate('invalid')).toThrow(ValidationError);

    try {
      validate('invalid');
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationError);
      expect(error.field).toBe('email');
      expect(error.message).toBe('Invalid email format');
    }
  });
});
```

## Parameterized Tests

```typescript
describe('Parameterized tests', () => {
  // Using test.each
  test.each([
    [1, 1, 2],
    [2, 3, 5],
    [0, 0, 0],
    [-1, 1, 0],
  ])('add(%i, %i) should return %i', (a, b, expected) => {
    expect(add(a, b)).toBe(expected);
  });

  // With objects for clarity
  test.each([
    { input: 'hello', expected: 'HELLO' },
    { input: 'World', expected: 'WORLD' },
    { input: '123', expected: '123' },
    { input: '', expected: '' },
  ])('toUpperCase($input) should return $expected', ({ input, expected }) => {
    expect(input.toUpperCase()).toBe(expected);
  });

  // Table format
  test.each`
    password         | expected
    ${'short'}       | ${false}
    ${'12345678'}    | ${false}
    ${'Password123'} | ${true}
    ${'P@ssw0rd!'}   | ${true}
  `(
    'isValidPassword($password) should return $expected',
    ({ password, expected }) => {
      expect(isValidPassword(password)).toBe(expected);
    }
  );
});
```

## Testing Private Methods

```typescript
// Don't test private methods directly - test through public interface
class StringProcessor {
  private removeWhitespace(str: string): string {
    return str.replace(/\s/g, '');
  }

  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }

  public process(str: string): string {
    const trimmed = this.removeWhitespace(str);
    return this.capitalize(trimmed);
  }
}

// Test the public method that uses private methods
describe('StringProcessor', () => {
  it('should process string correctly', () => {
    const processor = new StringProcessor();

    expect(processor.process('  hello world  ')).toBe('Helloworld');
    expect(processor.process('TEST')).toBe('Test');
    expect(processor.process('  MiXeD CaSe  ')).toBe('Mixedcase');
  });
});
```

## Test Doubles

### Stubs vs Mocks vs Spies

```typescript
// Vitest syntax
describe('Test doubles (Vitest)', () => {
  // Stub - provides canned answers
  it('should use stub for simple returns', () => {
    const getUserStub = vi.fn().mockReturnValue({ id: '123', name: 'John' });
    const result = getUserStub('123');
    expect(result.name).toBe('John');
  });

  // Mock - expects specific calls
  it('should use mock for behavior verification', () => {
    const loggerMock = {
      info: vi.fn(),
      error: vi.fn(),
    };

    const service = new Service(loggerMock);
    service.process();

    expect(loggerMock.info).toHaveBeenCalledWith('Processing started');
    expect(loggerMock.info).toHaveBeenCalledTimes(1);
  });

  // Spy - wraps real implementation
  it('should use spy to observe real behavior', () => {
    const math = {
      add: (a: number, b: number) => a + b,
    };

    const addSpy = vi.spyOn(math, 'add');

    const result = math.add(2, 3);

    expect(result).toBe(5); // Real implementation
    expect(addSpy).toHaveBeenCalledWith(2, 3);
  });
});

// Jest syntax
describe('Test doubles (Jest)', () => {
  // Stub - provides canned answers
  it('should use stub for simple returns', () => {
    const getUserStub = jest.fn().mockReturnValue({ id: '123', name: 'John' });
    const result = getUserStub('123');
    expect(result.name).toBe('John');
  });

  // Mock - expects specific calls
  it('should use mock for behavior verification', () => {
    const loggerMock = {
      info: jest.fn(),
      error: jest.fn(),
    };

    const service = new Service(loggerMock);
    service.process();

    expect(loggerMock.info).toHaveBeenCalledWith('Processing started');
    expect(loggerMock.info).toHaveBeenCalledTimes(1);
  });

  // Spy - wraps real implementation
  it('should use spy to observe real behavior', () => {
    const math = {
      add: (a: number, b: number) => a + b,
    };

    const addSpy = jest.spyOn(math, 'add');

    const result = math.add(2, 3);

    expect(result).toBe(5); // Real implementation
    expect(addSpy).toHaveBeenCalledWith(2, 3);
  });
});
```

## Advanced Error Testing

```typescript
describe('Error handling patterns', () => {
  it('should validate error types and properties', () => {
    const validateUser = (data: unknown) => {
      if (!data || typeof data !== 'object') {
        throw new ValidationError('Invalid data', 'INVALID_FORMAT', 'data');
      }
      if (!('email' in data)) {
        throw new ValidationError('Email required', 'MISSING_FIELD', 'email');
      }
    };

    // Test error type
    expect(() => validateUser(null)).toThrow(ValidationError);

    // Test error properties
    try {
      validateUser({});
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationError);
      expect(error.code).toBe('MISSING_FIELD');
      expect(error.field).toBe('email');
    }
  });

  it('should handle async errors with context', async () => {
    const fetchWithRetry = async (url: string, options = {}) => {
      try {
        const response = await fetch(url, options);
        if (!response.ok) {
          throw new HttpError(response.status, response.statusText);
        }
        return response;
      } catch (error) {
        if (error instanceof HttpError && error.status >= 500) {
          throw new RetryableError('Server error', { originalError: error });
        }
        throw error;
      }
    };

    await expect(fetchWithRetry('https://api.example.com/500')).rejects.toThrow(
      RetryableError
    );
  });
});
```

## Performance Testing

```typescript
describe('Performance requirements', () => {
  it('should complete operation within time limit', () => {
    const start = performance.now();

    // Perform operation
    const result = processLargeDataset(generateTestData(1000));

    const duration = performance.now() - start;
    expect(duration).toBeLessThan(100); // Should complete within 100ms
    expect(result).toBeDefined();
  });

  it('should handle concurrent operations efficiently', async () => {
    const operations = Array.from({ length: 10 }, (_, i) => processAsync(i));

    const start = performance.now();
    const results = await Promise.all(operations);
    const duration = performance.now() - start;

    expect(results).toHaveLength(10);
    expect(duration).toBeLessThan(500); // All should complete within 500ms
  });
});
```

## Custom Matchers

```typescript
// Extend expect with custom matchers
declare module 'vitest' {
  interface Assertion<T> {
    toBeValidEmail(): void;
    toBeWithinRange(min: number, max: number): void;
  }
}

expect.extend({
  toBeValidEmail(received: string) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const pass = emailRegex.test(received);

    return {
      pass,
      message: () =>
        pass
          ? `expected ${received} not to be a valid email`
          : `expected ${received} to be a valid email`,
    };
  },

  toBeWithinRange(received: number, min: number, max: number) {
    const pass = received >= min && received <= max;

    return {
      pass,
      message: () =>
        pass
          ? `expected ${received} not to be within range ${min}-${max}`
          : `expected ${received} to be within range ${min}-${max}`,
    };
  },
});

// Usage
describe('Custom matchers', () => {
  it('should validate email format', () => {
    expect('user@example.com').toBeValidEmail();
    expect('invalid-email').not.toBeValidEmail();
  });

  it('should check numeric ranges', () => {
    expect(5).toBeWithinRange(1, 10);
    expect(15).not.toBeWithinRange(1, 10);
  });
});
```

## Framework API Differences

### Key Differences Between Jest and Vitest

| Feature       | Jest                   | Vitest               |
| ------------- | ---------------------- | -------------------- |
| Mock function | `jest.fn()`            | `vi.fn()`            |
| Spy on        | `jest.spyOn()`         | `vi.spyOn()`         |
| Mock modules  | `jest.mock()`          | `vi.mock()`          |
| Timers        | `jest.useFakeTimers()` | `vi.useFakeTimers()` |
| Clear mocks   | `jest.clearAllMocks()` | `vi.clearAllMocks()` |
| Reset mocks   | `jest.resetAllMocks()` | `vi.resetAllMocks()` |

### Import Statements

```typescript
// Jest
import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Vitest
import { describe, it, expect, vi, beforeEach } from 'vitest';
```

### Module Mocking

```typescript
// Jest
jest.mock('./database', () => ({
  connect: jest.fn(),
  query: jest.fn(),
}));

// Vitest
vi.mock('./database', () => ({
  connect: vi.fn(),
  query: vi.fn(),
}));
```

### Timer Mocking

```typescript
// Jest
beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
});

it('should delay execution', () => {
  const callback = jest.fn();
  setTimeout(callback, 1000);

  jest.advanceTimersByTime(1000);
  expect(callback).toHaveBeenCalled();
});

// Vitest
beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.runOnlyPendingTimers();
  vi.useRealTimers();
});

it('should delay execution', () => {
  const callback = vi.fn();
  setTimeout(callback, 1000);

  vi.advanceTimersByTime(1000);
  expect(callback).toHaveBeenCalled();
});
```
