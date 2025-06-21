---
slug: testing-integration
title: Test component interactions with external dependencies
description: Testing how multiple components work together with dependencies.
type: pattern
---

# Integration Testing Patterns

Testing how multiple components work together, including external dependencies.

## Framework Choice

Integration tests work with both Jest and Vitest. The main differences are in setup and mock handling.

### Jest Setup

```typescript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],
  testMatch: ['**/*.integration.test.ts'],
  maxWorkers: 1, // Run integration tests serially
};
```

### Vitest Setup

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['./test/setup.ts'],
    include: ['**/*.integration.test.ts'],
    pool: 'forks', // Better isolation for integration tests
    poolOptions: {
      forks: {
        singleFork: true, // Run tests serially
      },
    },
  },
});
```

## Database Integration

### Test Database Setup

```typescript
// test/setup/database.ts
import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import { randomUUID } from 'crypto';

const prismaBinary = './node_modules/.bin/prisma';

export async function setupTestDatabase() {
  // Create unique database URL for this test run
  const schemaId = randomUUID();
  const databaseUrl = `postgresql://postgres:password@localhost:5432/test_${schemaId}`;

  // Set environment variable
  process.env.DATABASE_URL = databaseUrl;

  // Run migrations
  execSync(`${prismaBinary} migrate deploy`, {
    env: {
      ...process.env,
      DATABASE_URL: databaseUrl,
    },
  });

  return new PrismaClient({
    datasources: {
      db: { url: databaseUrl },
    },
  });
}

export async function teardownTestDatabase(prisma: PrismaClient) {
  await prisma.$disconnect();

  // Drop test database
  const url = new URL(process.env.DATABASE_URL!);
  const dbName = url.pathname.slice(1);

  const adminClient = new PrismaClient({
    datasources: {
      db: {
        url: `postgresql://${url.username}:${url.password}@${url.host}/postgres`,
      },
    },
  });

  await adminClient.$executeRawUnsafe(`DROP DATABASE IF EXISTS "${dbName}"`);
  await adminClient.$disconnect();
}
```

### Repository Testing

```typescript
// Vitest imports
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
// Jest imports (alternative)
// import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';

import { PrismaClient } from '@prisma/client';
import { UserRepository } from '@/repositories/user.repository';
import { setupTestDatabase, teardownTestDatabase } from '@/test/setup/database';

describe('UserRepository Integration', () => {
  let prisma: PrismaClient;
  let userRepository: UserRepository;

  beforeAll(async () => {
    prisma = await setupTestDatabase();
    userRepository = new UserRepository(prisma);
  });

  afterAll(async () => {
    await teardownTestDatabase(prisma);
  });

  beforeEach(async () => {
    // Clean tables before each test
    await prisma.user.deleteMany();
  });

  describe('create', () => {
    it('should create user with all fields', async () => {
      const userData = {
        email: 'test@example.com',
        name: 'Test User',
        password: 'hashed_password',
      };

      const user = await userRepository.create(userData);

      expect(user).toMatchObject({
        id: expect.any(String),
        email: 'test@example.com',
        name: 'Test User',
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });

      // Verify in database
      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
      });

      expect(dbUser).toBeTruthy();
      expect(dbUser?.email).toBe('test@example.com');
    });

    it('should enforce unique email constraint', async () => {
      await userRepository.create({
        email: 'duplicate@example.com',
        name: 'First User',
      });

      await expect(
        userRepository.create({
          email: 'duplicate@example.com',
          name: 'Second User',
        })
      ).rejects.toThrow();
    });
  });

  describe('findByEmail', () => {
    it('should find existing user', async () => {
      const created = await userRepository.create({
        email: 'find@example.com',
        name: 'Find Me',
      });

      const found = await userRepository.findByEmail('find@example.com');

      expect(found).toEqual(created);
    });

    it('should return null for non-existent user', async () => {
      const found = await userRepository.findByEmail('notfound@example.com');

      expect(found).toBeNull();
    });
  });
});
```

## API Integration

### Express API Testing

```typescript
import request from 'supertest';
import express from 'express';
import { createApp } from '@/app';
import { setupTestDatabase, teardownTestDatabase } from '@/test/setup/database';

describe('User API Integration', () => {
  let app: express.Application;
  let prisma: PrismaClient;

  beforeAll(async () => {
    prisma = await setupTestDatabase();
    app = await createApp({ prisma });
  });

  afterAll(async () => {
    await teardownTestDatabase(prisma);
  });

  describe('POST /api/users', () => {
    it('should create user with valid data', async () => {
      const response = await request(app)
        .post('/api/users')
        .send({
          email: 'newuser@example.com',
          name: 'New User',
          password: 'SecurePassword123!',
        })
        .expect(201);

      expect(response.body).toMatchObject({
        id: expect.any(String),
        email: 'newuser@example.com',
        name: 'New User',
      });
      expect(response.body.password).toBeUndefined();
    });

    it('should validate request body', async () => {
      const response = await request(app)
        .post('/api/users')
        .send({
          email: 'invalid-email',
          name: '',
        })
        .expect(400);

      expect(response.body).toMatchObject({
        error: 'Validation failed',
        details: expect.arrayContaining([
          expect.objectContaining({
            field: 'email',
            message: expect.any(String),
          }),
        ]),
      });
    });
  });

  describe('GET /api/users/:id', () => {
    it('should return user by id', async () => {
      // Create user first
      const user = await prisma.user.create({
        data: {
          email: 'getuser@example.com',
          name: 'Get User',
        },
      });

      const response = await request(app)
        .get(`/api/users/${user.id}`)
        .expect(200);

      expect(response.body).toMatchObject({
        id: user.id,
        email: 'getuser@example.com',
        name: 'Get User',
      });
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .get('/api/users/non-existent-id')
        .expect(404);

      expect(response.body).toMatchObject({
        error: 'User not found',
      });
    });
  });
});
```

### Next.js API Route Testing

```typescript
import { createMocks } from 'node-mocks-http';
import handler from '@/pages/api/users/[id]';
import { setupTestDatabase, teardownTestDatabase } from '@/test/setup/database';

describe('/api/users/[id]', () => {
  let prisma: PrismaClient;

  beforeAll(async () => {
    prisma = await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase(prisma);
  });

  it('should handle GET request', async () => {
    const user = await prisma.user.create({
      data: {
        email: 'api@example.com',
        name: 'API User',
      },
    });

    const { req, res } = createMocks({
      method: 'GET',
      query: { id: user.id },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(JSON.parse(res._getData())).toMatchObject({
      id: user.id,
      email: 'api@example.com',
      name: 'API User',
    });
  });
});
```

## MSW (Mock Service Worker) 2.0 Integration

### MSW Setup for Both Frameworks

```typescript
// test/mocks/server.ts
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

// Define handlers
export const handlers = [
  http.get('https://api.github.com/user/:username', ({ params }) => {
    return HttpResponse.json({
      login: params.username,
      id: 1,
      name: 'Test User',
      email: 'test@example.com',
    });
  }),

  http.post('https://api.stripe.com/v1/charges', async ({ request }) => {
    const body = await request.text();
    const params = new URLSearchParams(body);

    return HttpResponse.json({
      id: 'ch_test_123',
      amount: parseInt(params.get('amount') || '0'),
      currency: params.get('currency'),
      status: 'succeeded',
    });
  }),

  // Error scenarios
  http.get('https://api.external.com/flaky', () => {
    return HttpResponse.json(
      { error: 'Service temporarily unavailable' },
      { status: 503 }
    );
  }),
];

export const server = setupServer(...handlers);
```

### Jest Setup with MSW

```typescript
// test/setup.ts (Jest)
import { server } from './mocks/server';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// jest.config.js
module.exports = {
  setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],
};
```

### Vitest Setup with MSW

```typescript
// test/setup.ts (Vitest)
import { beforeAll, afterEach, afterAll } from 'vitest';
import { server } from './mocks/server';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// vitest.config.ts
export default defineConfig({
  test: {
    setupFiles: ['./test/setup.ts'],
  },
});
```

### Using MSW in Tests

```typescript
// Both Jest and Vitest
import { http, HttpResponse } from 'msw';
import { server } from '@/test/mocks/server';
import { GitHubService } from '@/services/github.service';

describe('GitHubService Integration', () => {
  let githubService: GitHubService;

  beforeEach(() => {
    githubService = new GitHubService();
  });

  it('should fetch user data', async () => {
    const user = await githubService.getUser('octocat');

    expect(user).toMatchObject({
      login: 'octocat',
      name: 'Test User',
      email: 'test@example.com',
    });
  });

  it('should handle API errors', async () => {
    // Override handler for this test
    server.use(
      http.get('https://api.github.com/user/:username', () => {
        return HttpResponse.json({ message: 'Not Found' }, { status: 404 });
      })
    );

    await expect(githubService.getUser('nonexistent')).rejects.toThrow(
      'User not found'
    );
  });

  it('should retry on temporary failures', async () => {
    let attempts = 0;

    server.use(
      http.get('https://api.github.com/user/:username', () => {
        attempts++;
        if (attempts < 3) {
          return HttpResponse.json(
            { message: 'Server Error' },
            { status: 500 }
          );
        }
        return HttpResponse.json({
          login: 'octocat',
          name: 'Test User',
        });
      })
    );

    const user = await githubService.getUser('octocat');

    expect(attempts).toBe(3);
    expect(user.login).toBe('octocat');
  });
});
```

### Framework-Agnostic HTTP Testing

```typescript
// Works with both Jest and Vitest
import { http, HttpResponse, delay } from 'msw';
import { server } from '@/test/mocks/server';

describe('API Client Integration', () => {
  it('should handle timeout scenarios', async () => {
    server.use(
      http.get('https://api.slow.com/data', async () => {
        await delay(5000); // Delay 5 seconds
        return HttpResponse.json({ data: 'too late' });
      })
    );

    const client = new ApiClient({ timeout: 1000 });

    await expect(client.get('https://api.slow.com/data')).rejects.toThrow(
      'Request timeout'
    );
  });

  it('should handle concurrent requests', async () => {
    let requestCount = 0;

    server.use(
      http.get('https://api.concurrent.com/resource', () => {
        requestCount++;
        return HttpResponse.json({
          id: requestCount,
          timestamp: Date.now(),
        });
      })
    );

    const client = new ApiClient();
    const requests = Array.from({ length: 5 }, () =>
      client.get('https://api.concurrent.com/resource')
    );

    const responses = await Promise.all(requests);

    expect(responses).toHaveLength(5);
    expect(requestCount).toBe(5);
    expect(new Set(responses.map(r => r.id)).size).toBe(5);
  });
});
```

## External Service Integration

### Email Service Testing

```typescript
import { EmailService } from '@/services/email.service';
import { createTransport, Transporter } from 'nodemailer';
// Vitest
import { mockDeep } from 'vitest-mock-extended';
// Jest alternative
// import { mockDeep } from 'jest-mock-extended';

describe('EmailService Integration', () => {
  describe('with real SMTP (test environment)', () => {
    let emailService: EmailService;

    beforeAll(() => {
      // Use test SMTP service like Ethereal Email
      const transport = createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        auth: {
          user: process.env.TEST_EMAIL_USER,
          pass: process.env.TEST_EMAIL_PASS,
        },
      });

      emailService = new EmailService(transport);
    });

    it('should send welcome email', async () => {
      const result = await emailService.sendWelcomeEmail({
        to: 'test@example.com',
        name: 'Test User',
      });

      expect(result.messageId).toBeTruthy();
      expect(result.accepted).toContain('test@example.com');
    });
  });

  describe('with mock transport', () => {
    it('should handle send failures', async () => {
      const mockTransport = mockDeep<Transporter>();
      mockTransport.sendMail.mockRejectedValue(new Error('Connection timeout'));

      const emailService = new EmailService(mockTransport);

      await expect(
        emailService.sendWelcomeEmail({
          to: 'test@example.com',
          name: 'Test User',
        })
      ).rejects.toThrow('Failed to send email');
    });
  });
});
```

### Redis Integration

```typescript
import { Redis } from 'ioredis';
import { CacheService } from '@/services/cache.service';

describe('CacheService Integration', () => {
  let redis: Redis;
  let cacheService: CacheService;

  beforeAll(() => {
    redis = new Redis({
      host: 'localhost',
      port: 6379,
      db: 15, // Use separate DB for tests
    });

    cacheService = new CacheService(redis);
  });

  afterAll(async () => {
    await redis.quit();
  });

  beforeEach(async () => {
    await redis.flushdb();
  });

  describe('set and get', () => {
    it('should store and retrieve values', async () => {
      await cacheService.set('user:123', {
        id: '123',
        name: 'John Doe',
      });

      const value = await cacheService.get('user:123');

      expect(value).toEqual({
        id: '123',
        name: 'John Doe',
      });
    });

    it('should expire values', async () => {
      await cacheService.set('temp:key', 'value', 1); // 1 second TTL

      expect(await cacheService.get('temp:key')).toBe('value');

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 1100));

      expect(await cacheService.get('temp:key')).toBeNull();
    });
  });
});
```

## Message Queue Integration

```typescript
import { Queue, Worker } from 'bullmq';
import { EmailQueue } from '@/queues/email.queue';

describe('EmailQueue Integration', () => {
  let emailQueue: EmailQueue;
  let worker: Worker;

  beforeAll(() => {
    emailQueue = new EmailQueue({
      connection: {
        host: 'localhost',
        port: 6379,
        db: 14,
      },
    });
  });

  afterAll(async () => {
    await emailQueue.close();
    if (worker) await worker.close();
  });

  it('should process email jobs', async () => {
    const processedJobs: any[] = [];

    // Create worker
    worker = new Worker(
      'emails',
      async job => {
        processedJobs.push(job.data);
      },
      {
        connection: {
          host: 'localhost',
          port: 6379,
          db: 14,
        },
      }
    );

    // Add job
    await emailQueue.addEmailJob({
      type: 'welcome',
      to: 'user@example.com',
      data: { name: 'Test User' },
    });

    // Wait for processing
    await new Promise(resolve => setTimeout(resolve, 100));

    expect(processedJobs).toHaveLength(1);
    expect(processedJobs[0]).toMatchObject({
      type: 'welcome',
      to: 'user@example.com',
    });
  });
});
```

## Database Testing Patterns

### Transaction Rollback Pattern

```typescript
describe('Database integration with rollback', () => {
  let db: Database;
  let tx: Transaction;

  beforeEach(async () => {
    db = new Database(process.env.TEST_DATABASE_URL);
    tx = await db.beginTransaction();
  });

  afterEach(async () => {
    await tx.rollback();
    await db.close();
  });

  it('should create and retrieve user within transaction', async () => {
    const userRepo = new UserRepository(tx);

    const created = await userRepo.create({
      email: 'test@example.com',
      name: 'Test User',
    });

    const retrieved = await userRepo.findById(created.id);
    expect(retrieved).toEqual(created);

    // Changes will be rolled back after test
  });
});
```

### In-Memory Database Testing

```typescript
describe('Service with in-memory database', () => {
  let service: UserService;
  let db: Database;

  beforeEach(async () => {
    // SQLite in-memory for fast, isolated tests
    db = new Database(':memory:');
    await db.migrate();
    service = new UserService(db);
  });

  afterEach(async () => {
    await db.close();
  });

  it('should handle concurrent operations', async () => {
    const operations = Array.from({ length: 10 }, (_, i) =>
      service.createUser({
        email: `user${i}@example.com`,
        name: `User ${i}`,
      })
    );

    const users = await Promise.all(operations);

    expect(users).toHaveLength(10);
    expect(new Set(users.map(u => u.id)).size).toBe(10); // All unique
  });
});
```

### Test Data Isolation

```typescript
describe('Multi-tenant testing', () => {
  let tenantA: string;
  let tenantB: string;

  beforeEach(async () => {
    // Create isolated test tenants
    tenantA = `tenant_${crypto.randomUUID()}`;
    tenantB = `tenant_${crypto.randomUUID()}`;

    await createTenant(tenantA);
    await createTenant(tenantB);
  });

  afterEach(async () => {
    // Clean up test tenants
    await deleteTenant(tenantA);
    await deleteTenant(tenantB);
  });

  it('should isolate data between tenants', async () => {
    // Create data in tenant A
    await createResource(tenantA, { name: 'Resource A' });

    // Query from tenant B should not see it
    const resourcesB = await getResources(tenantB);
    expect(resourcesB).toHaveLength(0);
  });
});
```

## Performance Testing

```typescript
describe('Integration performance', () => {
  it('should handle bulk operations efficiently', async () => {
    const records = Array.from({ length: 1000 }, (_, i) => ({
      id: i,
      data: `test-${i}`,
    }));

    const start = performance.now();

    // Bulk insert
    await db.batchInsert('records', records);

    const duration = performance.now() - start;
    expect(duration).toBeLessThan(5000); // Should complete within 5s

    // Verify all inserted
    const count = await db.count('records');
    expect(count).toBe(1000);
  });

  it('should maintain connection pool efficiency', async () => {
    const queries = Array.from({ length: 100 }, () => db.query('SELECT 1'));

    const start = performance.now();
    await Promise.all(queries);
    const duration = performance.now() - start;

    // Should reuse connections, not create 100 new ones
    expect(duration).toBeLessThan(1000);
  });
});
```

## Best Practices

1. **Isolate Test Data**: Each test should create its own data
2. **Clean Up**: Always clean up test data after tests
3. **Use Transactions**: Rollback database changes when possible
4. **Mock External Services**: Only test real integrations when necessary
5. **Parallel Safety**: Ensure tests can run in parallel
6. **Environment Variables**: Use test-specific configuration
7. **Timeouts**: Set appropriate timeouts for external services
8. **Error Scenarios**: Test both success and failure paths
