# Logging Rules

## Logging Approach

This monorepo uses **console.log** with structured output for development tools and CLI applications. All operations use the Result pattern for error handling.

## Setup

```typescript
import { Result, success, failure, makeError } from '@outfitter/contracts';

// For operations with potential failures
function processFiles(): Result<string[], AppError> {
  try {
    console.log('🔍 Processing files...');
    // ... processing logic
    console.log('✅ Files processed successfully');
    return success(processedFiles);
  } catch (error) {
    console.error('❌ Failed to process files:', error);
    return failure(makeError('PROCESS_FAILED', 'File processing failed'));
  }
  }
});

// For production/server code
const logger = pino();
```

## Log Levels

Use appropriate log levels:

- `fatal`: Application crash/termination
- `error`: Error conditions that should be investigated
- `warn`: Warning conditions that might need attention
- `info`: General information about application flow
- `debug`: Detailed information for debugging
- `trace`: Very detailed information, typically only of interest when diagnosing problems

## Best Practices

### 1. Never use `console.*`

```typescript
// ❌ Bad
console.log('User logged in');
console.error('Database connection failed');

// ✅ Good
logger.info('User logged in', { userId: user.id });
logger.error('Database connection failed', { error: err.message });
```

### 2. Include Context

Always include relevant context in log messages:

```typescript
// ❌ Bad
logger.info('Processing file');

// ✅ Good
logger.info('Processing file', {
  fileName: 'data.json',
  fileSize: 1024,
  userId: 'user-123',
});
```

### 3. Use Structured Logging

Leverage Pino's structured logging capabilities:

```typescript
// ❌ Bad
logger.info(`User ${userId} performed action ${action} at ${timestamp}`);

// ✅ Good
logger.info('User action performed', {
  userId,
  action,
  timestamp,
  duration: performance.now() - start,
});
```

### 4. Handle Errors Properly

```typescript
// ❌ Bad
try {
  riskyOperation();
} catch (error) {
  logger.error('Something went wrong');
}

// ✅ Good
try {
  riskyOperation();
} catch (error) {
  logger.error('Risky operation failed', {
    error: error.message,
    stack: error.stack,
    operation: 'riskyOperation',
    context: {
      /* relevant context */
    },
  });
}
```

### 5. Performance Considerations

Use child loggers for request/operation-specific context:

```typescript
// Create child logger with request context
const requestLogger = logger.child({ requestId: req.id, userId: req.user.id });

// Use throughout request lifecycle
requestLogger.info('Processing request');
requestLogger.debug('Validating input', { input: req.body });
requestLogger.info('Request completed', { duration: elapsed });
```

### 6. Environment-Specific Configuration

```typescript
const isDev = process.env.NODE_ENV === 'development';

const logger = pino({
  level: process.env.LOG_LEVEL || (isDev ? 'debug' : 'info'),
  transport: isDev
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      }
    : undefined,
});
```

## Script and CLI Logging

For scripts like our symlink-agent-files.ts:

```typescript
#!/usr/bin/env bun
import pino from 'pino';

const logger = pino({
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname',
      messageFormat: '{msg}',
    },
  },
  level: 'info',
});

// Usage
logger.info('Script starting');
logger.warn('Warning message', { context: 'additional-info' });
logger.error('Error occurred', { error: err.message });
```

## Testing with Logs

Use pino-test for testing:

```typescript
import { createLogger } from 'pino';
import { createWriteStream } from 'pino-test';

const stream = createWriteStream();
const logger = createLogger(stream);

// Your code that logs
someFunction(logger);

// Assert logs
const logs = stream.getAll();
expect(logs).toHaveLength(1);
expect(logs[0].msg).toBe('Expected message');
```

## Integration with Turbo

For monorepo scripts that might be run via Turbo, ensure consistent logging format across all packages by sharing logger configuration.
