---
slug: testing-snapshots
title: Use snapshot testing judiciously for UI consistency
description: Snapshot testing strategies that balance value and maintenance.
type: pattern
---

# Snapshot Testing Patterns

Strategic snapshot testing that balances UI consistency checks with maintainability.

## Related Documentation

- [Testing React Components](./testing-react-components.md) - Component testing
- [Unit Testing Patterns](./testing-unit.md) - Testing fundamentals
- [Testing Philosophy](../conventions/testing-philosophy.md) - Core principles
- [Vitest Guide](../guides/vitest-guide.md) - Snapshot configuration

## When to Use Snapshots

### Excellent Use Cases

1. **Design System Components** - Ensure consistent rendering across versions
2. **Error Message Formatting** - Maintain user-facing error consistency
3. **Configuration Generation** - Verify generated configs remain stable
4. **API Response Shapes** - Contract testing for external APIs
5. **Markdown/HTML Generation** - Content transformation accuracy

### Poor Use Cases

1. **Dynamic Content** - Timestamps, UUIDs, random values
2. **Rapidly Evolving UI** - Components under active development
3. **Large DOM Trees** - Full page snapshots become unmaintainable
4. **Implementation Details** - Component internal state or styles
5. **Frequently Updated Data** - Lists with changing content

## Modern Snapshot Patterns

### Focused Component Snapshots

```typescript
import { render } from '@testing-library/react';
import { Card } from './Card';

describe('Card component snapshots', () => {
  it('renders default state', () => {
    const { container } = render(
      <Card
        title="User Profile"
        description="View and edit user information"
        icon="user"
      />
    );

    // Snapshot only the component, not the container
    expect(container.firstChild).toMatchSnapshot('card-default');
  });

  it('renders all variants consistently', () => {
    const variants = ['primary', 'secondary', 'danger'] as const;

    variants.forEach(variant => {
      const { container } = render(
        <Card variant={variant} title="Test" />
      );
      expect(container.firstChild).toMatchSnapshot(`card-${variant}`);
    });
  });
});
```

### Smart Inline Snapshots

```typescript
describe('Data transformations', () => {
  it('formats user data consistently', () => {
    const result = transformUserData({
      id: '123',
      firstName: 'John',
      lastName: 'Doe',
      createdAt: new Date('2024-01-01'),
    });

    expect(result).toMatchInlineSnapshot(
      {
        id: expect.any(String),
        createdAt: expect.any(String),
      },
      `
      {
        "displayName": "Doe, John",
        "id": Any<String>,
        "createdAt": Any<String>,
        "initials": "JD",
        "isActive": true
      }
    `
    );
  });

  it('generates environment config', () => {
    const config = generateEnvConfig('staging');

    expect(config).toMatchInlineSnapshot(`
      {
        "apiUrl": "https://api.staging.example.com",
        "environment": "staging",
        "features": {
          "analytics": true,
          "payments": false,
          "experiments": true
        },
        "logLevel": "debug"
      }
    `);
  });
});
```

## Advanced Snapshot Techniques

### Custom Serializers for Stability

```typescript
// test/serializers/index.ts
export const stableSerializer = {
  test: (val: any) => val && typeof val === 'object' && '_unstable' in val,
  serialize: (val: any) => {
    const { _unstable, ...stable } = val;
    return JSON.stringify(stable, null, 2);
  },
};

export const dateSerializer = {
  test: (val: any) => val instanceof Date,
  serialize: (val: Date) => `[Date: ${val.toISOString()}]`,
};

export const functionSerializer = {
  test: (val: any) => typeof val === 'function',
  serialize: (val: Function) => `[Function: ${val.name || 'anonymous'}]`,
};

// vitest.config.ts
export default defineConfig({
  test: {
    snapshotSerializers: ['./test/serializers/index.ts'],
    snapshotFormat: {
      printBasicPrototype: false,
      escapeString: true,
    },
  },
});
```

### Asymmetric Matchers for Dynamic Content

```typescript
import { expect } from 'vitest';

describe('API responses', () => {
  it('matches expected shape with dynamic values', () => {
    const response = await fetchUser('123');

    expect(response).toMatchSnapshot({
      id: expect.any(String),
      email: expect.stringMatching(/^[\w.]+@[\w.]+$/),
      createdAt: expect.any(String),
      lastLogin: expect.any(String),
      sessionToken: expect.stringMatching(/^[A-Za-z0-9+/]{32,}$/),
      preferences: {
        theme: expect.stringMatching(/^(light|dark|auto)$/),
        notifications: expect.any(Boolean),
      },
    });
  });
});
```

### Snapshot Organization Strategy

```typescript
// test/snapshot-resolver.ts
import path from 'path';

export default {
  resolveSnapshotPath: (testPath: string, snapshotExtension: string) => {
    // Group snapshots by feature
    const testDir = path.dirname(testPath);
    const testFile = path.basename(testPath);

    return path.join(testDir, '__snapshots__', testFile + snapshotExtension);
  },

  resolveTestPath: (snapshotFilePath: string, snapshotExtension: string) => {
    return snapshotFilePath
      .replace('__snapshots__/', '')
      .replace(snapshotExtension, '');
  },

  testPathForConsistencyCheck: 'src/example.test.ts',
};
```

## Best Practices for Maintainable Snapshots

### Keep Snapshots Focused and Small

```typescript
// ❌ Bad: Entire component tree
it('renders dashboard', () => {
  const { container } = render(
    <Provider store={store}>
      <Router>
        <Dashboard />
      </Router>
    </Provider>
  );
  expect(container).toMatchSnapshot();
});

// ✅ Good: Specific component output
it('renders user stats card', () => {
  const { getByTestId } = render(
    <StatsCard
      title="Active Users"
      value={1234}
      trend="up"
      change={12.5}
    />
  );

  const statsCard = getByTestId('stats-card');
  expect(statsCard).toMatchSnapshot('stats-card-positive-trend');
});

// ✅ Better: Extracted HTML for clarity
it('renders stats card structure', () => {
  const { getByTestId } = render(<StatsCard {...props} />);
  const cardHTML = getByTestId('stats-card').innerHTML;

  expect(cardHTML).toMatchInlineSnapshot(`
    "<h3>Active Users</h3>
     <div class=\"value\">1,234</div>
     <div class=\"trend trend-up\">+12.5%</div>"
  `);
});
```

### Descriptive Snapshot Names

```typescript
describe('Button component states', () => {
  const states = [
    { props: { variant: 'primary' }, name: 'primary-default' },
    { props: { variant: 'primary', disabled: true }, name: 'primary-disabled' },
    { props: { variant: 'primary', loading: true }, name: 'primary-loading' },
    { props: { variant: 'danger', size: 'small' }, name: 'danger-small' },
  ];

  states.forEach(({ props, name }) => {
    it(`renders ${name} state correctly`, () => {
      const { container } = render(<Button {...props}>Action</Button>);
      expect(container.firstChild).toMatchSnapshot(`button-${name}`);
    });
  });
});
```

### Snapshot Review Workflow

```bash
# 1. Run tests to see failures
npm test

# 2. Review specific snapshot changes
npm test -- --reporter=verbose ComponentName

# 3. Update snapshots selectively
npm test -- -u ComponentName.test.tsx

# 4. Verify changes with git
git diff --stat **/__snapshots__/
git diff **/__snapshots__/ComponentName.test.tsx.snap

# 5. Document snapshot updates in commit
git commit -m "test: update Button snapshots for new design system"
```

## Strategic Snapshot Testing

### Design System Component Matrix

```typescript
import { render } from '@testing-library/react';
import { Button } from './Button';

// Comprehensive variant testing
describe('Button design system snapshots', () => {
  const variants = ['primary', 'secondary', 'danger', 'ghost'] as const;
  const sizes = ['sm', 'md', 'lg'] as const;
  const states = ['default', 'hover', 'focus', 'disabled'] as const;

  // Generate test matrix
  const testMatrix = variants.flatMap(variant =>
    sizes.flatMap(size =>
      states.map(state => ({ variant, size, state }))
    )
  );

  testMatrix.forEach(({ variant, size, state }) => {
    it(`renders ${variant}-${size}-${state}`, () => {
      const props = {
        variant,
        size,
        disabled: state === 'disabled',
        'data-state': state,
      };

      const { container } = render(
        <Button {...props}>Click me</Button>
      );

      // Apply pseudo-states for snapshot
      const button = container.firstChild as HTMLElement;
      if (state === 'hover') button.dataset.hover = 'true';
      if (state === 'focus') button.dataset.focus = 'true';

      expect(button).toMatchSnapshot();
    });
  });
});
```

### API Contract Testing

```typescript
describe('API response contracts', () => {
  it('matches user endpoint contract', async () => {
    const response = await api.getUser('123');

    // Snapshot the structure, not the values
    expect(response).toMatchSnapshot({
      data: {
        id: expect.any(String),
        email: expect.stringMatching(/.+@.+/),
        profile: {
          name: expect.any(String),
          avatar: expect.stringMatching(/^https?:\/\/.+/),
          bio: expect.any(String),
        },
        settings: {
          theme: expect.stringMatching(/^(light|dark|system)$/),
          notifications: {
            email: expect.any(Boolean),
            push: expect.any(Boolean),
            sms: expect.any(Boolean),
          },
        },
        metadata: {
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
          lastLogin: expect.any(String),
          loginCount: expect.any(Number),
        },
      },
      meta: {
        version: expect.stringMatching(/^\d+\.\d+\.\d+$/),
        timestamp: expect.any(String),
      },
    });
  });
});
```

### Configuration Generation Testing

```typescript
describe('Config generation snapshots', () => {
  const environments = ['development', 'staging', 'production'] as const;

  environments.forEach(env => {
    it(`generates ${env} configuration correctly`, () => {
      const config = generateConfig({
        environment: env,
        region: 'us-east-1',
        features: ['auth', 'payments', 'analytics'],
      });

      // Mask sensitive values
      const sanitized = {
        ...config,
        apiKey: '[REDACTED]',
        dbPassword: '[REDACTED]',
        secrets: Object.keys(config.secrets).reduce(
          (acc, key) => ({ ...acc, [key]: '[REDACTED]' }),
          {}
        ),
      };

      expect(sanitized).toMatchSnapshot(`config-${env}`);
    });
  });
});
```

## Snapshot Maintenance Strategies

### Automated Snapshot Health

```javascript
// scripts/snapshot-health.js
import { glob } from 'glob';
import { readFileSync, statSync } from 'fs';

const SNAPSHOT_SIZE_LIMIT = 50 * 1024; // 50KB
const SNAPSHOT_AGE_LIMIT = 90 * 24 * 60 * 60 * 1000; // 90 days

async function checkSnapshotHealth() {
  const snapshots = await glob('**/__snapshots__/*.snap');
  const issues = [];

  for (const file of snapshots) {
    const stats = statSync(file);
    const content = readFileSync(file, 'utf8');

    // Check size
    if (stats.size > SNAPSHOT_SIZE_LIMIT) {
      issues.push({
        file,
        issue: 'large',
        size: stats.size,
      });
    }

    // Check age
    const age = Date.now() - stats.mtimeMs;
    if (age > SNAPSHOT_AGE_LIMIT) {
      issues.push({
        file,
        issue: 'stale',
        age: Math.floor(age / (24 * 60 * 60 * 1000)),
      });
    }

    // Check for common issues
    if (content.includes('className=')) {
      issues.push({
        file,
        issue: 'implementation-detail',
        detail: 'Contains className',
      });
    }
  }

  return issues;
}
```

### Snapshot Update Protocol

```bash
#!/bin/bash
# scripts/update-snapshots.sh

echo "Snapshot Update Protocol"
echo "======================="

# 1. Show current failures
echo "Current snapshot failures:"
npm test -- --reporter=list | grep "Snapshot"

# 2. Interactive update
read -p "Update snapshots interactively? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  npm test -- --updateSnapshot --watch
else
  # 3. Batch update with confirmation
  echo "Files to update:"
  npm test -- --listTests | grep -E "\.(test|spec)\.(ts|tsx|js|jsx)$"

  read -p "Update all snapshots? (y/n): " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    npm test -- --updateSnapshot
  fi
fi

# 4. Show changes
echo "\nSnapshot changes:"
git diff --stat **/__snapshots__/

# 5. Validate
echo "\nValidating updated snapshots..."
npm test
```

### Preventing Snapshot Decay

1. **Regular Audits**

   ```json
   // package.json
   {
     "scripts": {
       "snapshots:audit": "node scripts/snapshot-health.js",
       "snapshots:clean": "find . -name '*.snap' -size +50k -delete",
       "snapshots:age": "find . -name '*.snap' -mtime +90 -print"
     }
   }
   ```

2. **PR Checks**

   ```yaml
   # .github/workflows/snapshot-review.yml
   - name: Check snapshot changes
     run: |
       SNAP_CHANGES=$(git diff --name-only | grep -c \.snap$ || true)
       if [ $SNAP_CHANGES -gt 0 ]; then
         echo "::warning::This PR includes $SNAP_CHANGES snapshot changes"
         echo "Please ensure snapshot changes are intentional"
       fi
   ```

3. **Snapshot Guidelines**
   - Max 50 lines per snapshot
   - No implementation details (classes, IDs)
   - Clear naming convention
   - Regular review cycles

## Summary

Effective snapshot testing requires:

- **Strategic use** - Only where snapshots provide value
- **Small, focused snapshots** - Easy to review and maintain
- **Property matchers** - Handle dynamic content gracefully
- **Regular maintenance** - Prevent snapshot decay
- **Clear naming** - Understand what each snapshot tests
