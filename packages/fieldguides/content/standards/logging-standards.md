# Logging Standards

This document defines logging standards and best practices for all projects.

## Overview

Production applications require proper logging infrastructure with structured logging, appropriate log levels, and environment-aware behavior. Direct console usage is prohibited by our linting rules (Biome) to ensure production-ready code.

## Required Setup

### Install tslog

All projects must use [tslog](https://github.com/fullstack-build/tslog) for logging:

```bash
npm install tslog
```

### Create Logger Instance

Create a centralized logger configuration:

```typescript
// src/lib/logger.ts
import { Logger } from 'tslog';

export const logger = new Logger({
  name: 'MyApp',
  minLevel: process.env.NODE_ENV === 'production' ? 3 : 0, // 3=info, 0=silly
  type: process.env.NODE_ENV === 'production' ? 'json' : 'pretty',
});
```

## Log Levels

Use appropriate log levels for different scenarios:

- **silly (0)**: Extremely detailed debugging information
- **trace (1)**: Detailed trace information
- **debug (2)**: Debug information for development
- **info (3)**: General informational messages
- **warn (4)**: Warning messages for potentially harmful situations
- **error (5)**: Error events that might still allow the application to continue
- **fatal (6)**: Severe errors that cause the application to abort

## Usage Patterns

### Basic Logging

```typescript
import { logger } from '@/lib/logger';

// Simple messages
logger.info('Server started on port 3000');
logger.debug('Processing user request');
logger.error('Failed to connect to database');

// With structured context
logger.info('User action', { userId: '123', action: 'login' });
logger.error('API request failed', {
  endpoint: '/api/users',
  status: 500,
  userId: '123',
});
```

### With Result Pattern

Combine logging with Outfitter's Result pattern for comprehensive error handling:

```typescript
import { Result, success, failure } from '@outfitter/contracts';
import { logger } from '@/lib/logger';

export async function fetchUserData(
  id: string,
): Promise<Result<User, AppError>> {
  logger.debug('Fetching user', { userId: id });

  try {
    const data = await api.getUser(id);
    logger.info('User fetched successfully', { userId: id });
    return success(data);
  } catch (error) {
    logger.error('Failed to fetch user', {
      userId: id,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return failure(createApiError(error));
  }
}
```

### Request Logging

For HTTP requests, include relevant context:

```typescript
logger.info('HTTP request', {
  method: req.method,
  path: req.path,
  userId: req.user?.id,
  duration: Date.now() - startTime,
});
```

### Performance Logging

Track performance metrics:

```typescript
const startTime = Date.now();
// ... operation ...
logger.info('Operation completed', {
  operation: 'dataProcessing',
  duration: Date.now() - startTime,
  recordsProcessed: records.length,
});
```

## What NOT to Do

### Never Use Console Directly

```typescript
// ❌ Bad: Direct console usage
console.log('User data:', userData);
console.error('Error:', error);

// ✅ Good: Use logger
logger.debug('User data processed', { userId: userData.id });
logger.error('Operation failed', { error: error.message });
```

### Avoid Logging Sensitive Data

Never log sensitive information that could compromise security, privacy, or compliance:

```typescript
// ❌ Bad: Logging sensitive information
logger.info('User authentication', {
  email: user.email,
  password: user.password, // Never log passwords!
  sessionToken: user.sessionToken, // Never log session tokens!
  apiKey: config.apiKey, // Never log API keys!
  creditCard: payment.cardNumber, // Never log payment details!
  ssn: user.socialSecurityNumber, // Never log PII!
  phoneNumber: user.phone, // Avoid logging personal data
  address: user.homeAddress, // Avoid logging personal data
});

// ✅ Good: Log only safe identifiers and non-sensitive data
logger.info('User authentication', {
  userId: user.id, // Safe: Internal identifier
  action: 'login', // Safe: Action type
  timestamp: new Date().toISOString(), // Safe: When it happened
  userAgent: req.headers['user-agent'], // Safe: Browser info
  ipAddress: hashIpAddress(req.ip), // Safe: Hashed IP for privacy
});
```

### Sensitive Data Categories

**Authentication & Authorization:**

- Passwords (plaintext or hashed)
- Session tokens, JWTs, refresh tokens
- API keys, secret keys, certificates
- Two-factor authentication codes
- OAuth tokens and secrets

**Personally Identifiable Information (PII):**

- Full names (consider using initials)
- Email addresses (consider hashing or masking)
- Phone numbers
- Physical addresses
- Social Security Numbers
- Driver's license numbers
- Passport numbers
- Date of birth

**Financial & Payment Data:**

- Credit card numbers
- Bank account numbers
- Transaction amounts (in some contexts)
- CVV codes, PINs
- Payment processor tokens

**Business Sensitive:**

- Customer data from other systems
- Internal system passwords
- Database connection strings
- Third-party service credentials
- Proprietary algorithms or business logic

### Safe Alternatives

Instead of logging sensitive data directly:

```typescript
// Hash or mask sensitive data
function maskEmail(email: string): string {
  const [username, domain] = email.split('@');
  const maskedUsername = username.slice(0, 2) + '*'.repeat(username.length - 2);
  return `${maskedUsername}@${domain}`;
}

function hashSensitiveData(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex').slice(0, 8);
}

logger.info('User registration', {
  userId: user.id,
  emailHash: hashSensitiveData(user.email),
  maskedEmail: maskEmail(user.email),
  registrationSource: 'web',
});

// Use structured logging for correlation without exposing data
logger.info('Payment processed', {
  paymentId: payment.id,
  userId: payment.userId,
  amountCents: payment.amountCents, // Only if not sensitive
  currency: payment.currency,
  paymentMethodType: payment.method.type, // 'card', 'bank', etc.
  // Don't log actual card details
});
```

## Production Considerations

### Structured Logging

In production, tslog outputs JSON for easy parsing by log aggregation services:

```json
{
  "date": "2024-01-20T10:30:00.000Z",
  "logLevel": "info",
  "name": "MyApp",
  "msg": "User action",
  "userId": "123",
  "action": "login"
}
```

### Log Aggregation

Configure your production environment to send logs to aggregation services:

- **CloudWatch** (AWS)
- **Stackdriver** (Google Cloud)
- **Application Insights** (Azure)
- **Sentry** (Error tracking)
- **LogRocket** (Session replay)

### Performance Impact

- Log level should be `info` or higher in production
- Avoid logging in hot code paths
- Use sampling for high-frequency events

## Testing

### Mocking Logger in Tests

```typescript
import { vi } from 'vitest';

// Mock the logger module
vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
  },
}));

// In tests
import { logger } from '@/lib/logger';

test('logs error on failure', async () => {
  // ... test setup ...

  expect(logger.error).toHaveBeenCalledWith(
    'Failed to fetch user',
    expect.objectContaining({ userId: '123' }),
  );
});
```

## Migration Guide

When migrating from console to tslog:

1. Install tslog: `npm install tslog`
2. Create logger instance in `src/lib/logger.ts`
3. Find and replace:
   - `console.log` → `logger.info` or `logger.debug`
   - `console.error` → `logger.error`
   - `console.warn` → `logger.warn`
4. Add structured context where beneficial
5. Remove any `// eslint-disable-next-line no-console` comments

## Alternative Libraries

While tslog is recommended for its TypeScript-first design and zero dependencies, these alternatives may be suitable for specific needs:

- **[pino](https://github.com/pinojs/pino)**: When maximum performance is critical
- **[winston](https://github.com/winstonjs/winston)**: When you need extensive transport options
- **[consola](https://github.com/unjs/consola)**: For universal apps (Node.js, Browser, Edge Workers)
- **[debug](https://github.com/debug-js/debug)**: For lightweight development-only debugging

## References

- [tslog Documentation](https://tslog.js.org/)
- [Structured Logging Best Practices](https://www.datadoghq.com/blog/structured-logging/)
- [The Twelve-Factor App: Logs](https://12factor.net/logs)
