# Logging Rules

## Logging Philosophy

This monorepo uses a **hybrid logging approach** optimized for both development ergonomics and production reliability:

- **Console.log** for CLI tools, build scripts, and development utilities
- **Pino** for libraries, production services, and persistent logging needs

## Console Usage Guidelines

### ✅ When to Use Console.log

Console is appropriate and encouraged for:

1. **CLI Tools** - User-facing output in command-line interfaces

   ```typescript
   // packages/cli/src/commands/init.ts
   console.log('🔍 Scanning for configuration files...');
   console.log('✅ Found 3 config files');
   console.log('📦 Installing dependencies...');
   ```

2. **Build Scripts** - One-time execution scripts

   ```typescript
   // scripts/build.mjs
   console.log('Building with Bun...');
   console.log('✓ Core build complete');
   ```

3. **Development Debugging** - Temporary debug statements

   ```typescript
   if (process.env.DEBUG) {
     console.log('Cache hit:', cacheKey);
     console.table(performanceMetrics);
   }
   ```

4. **Test Output** - Test fixtures and debugging

   ```typescript
   test('should process files', () => {
     console.log('Test fixture:', testData); // Helps debug failing tests
     expect(result).toBe(expected);
   });
   ```

### 🚫 When NOT to Use Console.log

Console should be avoided in:

1. **Library Code** - Internal package logic
2. **Production Services** - Server applications, APIs
3. **Shared Utilities** - Reusable modules
4. **Error Reporting** - Use structured logging for errors

### Biome/Ultracite Console Rule

The monorepo uses Biome's `noConsole` rule with intelligent overrides:

- **Automatically allowed** in: CLI tools, test files, build scripts (via `biome.json` overrides)
- **Warned against** in: Library code (requires explicit suppression)
- **Message**: "Console is for debugging. Use structured logging (Pino) for production code. See .agent/rules/LOGGING.md"

#### Suppression Options

When you legitimately need console in library code:

```typescript
// Per-line suppression
// biome-ignore lint/suspicious/noConsole: Required for CLI output
console.log('Processing...');

// File-level suppression (at top of file)
// biome-ignore-all lint/suspicious/noConsole: This is a CLI tool

// Range suppression
// biome-ignore-start lint/suspicious/noConsole: User feedback section
console.log('Step 1...');
console.log('Step 2...');
// biome-ignore-end lint/suspicious/noConsole
```

## Structured Logging with Pino

### When to Use Pino

Use Pino for:

1. **Production Services**

   ```typescript
   import pino from 'pino';

   const logger = pino({
     level: process.env.LOG_LEVEL || 'info',
   });

   logger.info('Server started', { port: 3000 });
   logger.error('Database connection failed', {
     error: err.message,
     retry: retryCount,
   });
   ```

2. **Library Internals**

   ```typescript
   // Inside @outfitter/baselayer
   logger.debug('Config loaded', {
     configPath,
     toolsEnabled: Object.keys(config.tools),
   });
   ```

3. **Audit/Security Events**

   ```typescript
   logger.warn('Failed authentication attempt', {
     ip: request.ip,
     username: attempt.username,
     timestamp: Date.now(),
   });
   ```

### Pino Configuration

#### Development

```typescript
const logger = pino({
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname',
    },
  },
  level: 'debug',
});
```

#### Production

```typescript
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  serializers: {
    err: pino.stdSerializers.err,
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,
  },
});
```

## Result Pattern Integration

All operations use the Result pattern for error handling, with appropriate logging:

```typescript
import { Result, success, failure, makeError } from '@outfitter/contracts';

// CLI tool with console
function processFilesCLI(): Result<string[], AppError> {
  try {
    console.log('🔍 Processing files...');
    const files = processFiles();
    console.log('✅ Files processed successfully');
    return success(files);
  } catch (error) {
    console.error('❌ Failed to process files:', error);
    return failure(makeError('PROCESS_FAILED', 'File processing failed'));
  }
}

// Library code with Pino
function processFilesLib(logger: pino.Logger): Result<string[], AppError> {
  try {
    logger.info('Processing files started');
    const files = processFiles();
    logger.info('Processing complete', { fileCount: files.length });
    return success(files);
  } catch (error) {
    logger.error('Processing failed', { error: error.message });
    return failure(makeError('PROCESS_FAILED', 'File processing failed'));
  }
}
```

## Testing with Logs

### Console in Tests

```typescript
// Allowed by default in test files
test('processes configuration', () => {
  console.log('Test config:', testConfig);
  const result = processConfig(testConfig);
  expect(result).toEqual(expected);
});
```

### Pino in Tests

```typescript
import { pino } from 'pino';
import { createWriteStream } from 'pino-test';

test('logs correctly', () => {
  const stream = createWriteStream();
  const logger = pino(stream);

  myFunction(logger);

  const logs = stream.getAll();
  expect(logs[0].msg).toBe('Expected message');
});
```

## Quick Reference

| Context | Logging Solution | Reason |
| --- | --- | --- |
| CLI commands | `console.log` | Direct user feedback |
| Build scripts | `console.log` | One-time execution |
| Test files | `console.log` | Test debugging |
| Dev debugging | `console.log` with `DEBUG` env | Temporary |
| Library code | Pino | No console pollution |
| Production services | Pino | Structured, persistent |
| Error tracking | Pino | Searchable, analyzable |
| Audit events | Pino | Compliance, security |

## Enforcement

- Biome's `noConsole` rule warns in library code
- Automatic overrides for CLI/test/script files
- Clear suppression patterns when needed
- No fighting the tooling - work with it
