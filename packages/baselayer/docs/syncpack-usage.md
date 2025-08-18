# Syncpack Configuration Support in Baselayer

Baselayer now includes built-in support for [Syncpack](https://github.com/JamieMason/syncpack), a tool that helps maintain consistent dependency versions across monorepo packages.

## Usage in Downstream Projects

### Basic Setup

```typescript
import { generateSyncpackConfig } from '@outfitter/baselayer/generators/syncpack';

// Generate .syncpackrc.json in your project
await generateSyncpackConfig('/path/to/project');
```

### Monorepo Configuration

```typescript
import { generateSyncpackConfig } from '@outfitter/baselayer/generators/syncpack';

// For monorepos with internal packages
await generateSyncpackConfig('/path/to/project', undefined, {
  monorepo: true,
  internalPackageScope: '@mycompany',
});
```

### Custom Semver Groups

```typescript
import { generateSyncpackConfig } from '@outfitter/baselayer/generators/syncpack';

// Add project-specific dependency groups
await generateSyncpackConfig('/path/to/project', undefined, {
  additionalSemverGroups: [
    {
      label: 'Keep React versions in sync',
      packages: ['**'],
      dependencies: ['react', 'react-dom', '@types/react'],
      dependencyTypes: ['dev', 'prod'],
      range: '^',
    },
    {
      label: 'Keep Next.js versions in sync',
      packages: ['apps/**'],
      dependencies: ['next'],
      dependencyTypes: ['prod'],
      range: '',
    },
  ],
});
```

### Using the Syncpack Adapter

The Syncpack adapter integrates with Baselayer's orchestration system:

```typescript
import { Orchestrator, SyncpackAdapter } from '@outfitter/baselayer';

const orchestrator = new Orchestrator({
  cwd: process.cwd(),
  adapters: [new SyncpackAdapter()],
});

// Check for dependency mismatches
const checkResult = await orchestrator.check({
  tools: ['syncpack'],
});

// Fix mismatches
const fixResult = await orchestrator.format({
  tools: ['syncpack'],
});
```

### Adding to package.json Scripts

After generating the configuration, add these scripts to your `package.json`:

```json
{
  "scripts": {
    "deps:check": "syncpack list-mismatches",
    "deps:fix": "syncpack fix-mismatches",
    "deps:update": "syncpack update"
  }
}
```

## Default Configuration

Baselayer provides sensible defaults for Outfitter projects:

- **Workspace Protocol**: Automatically configures `workspace:*` for internal packages in monorepos
- **Core Dependencies**: Synchronizes versions for TypeScript, Vitest, Bun types, and common dev tools
- **Build Tools**: Keeps tsup, Biome, Prettier, and other tooling versions consistent
- **Package.json Sorting**: Orders fields consistently for better readability

## Features

- ✅ Zero-config setup for standard projects
- ✅ Monorepo support with workspace protocol
- ✅ Customizable semver groups
- ✅ Integration with Baselayer's orchestration system
- ✅ Smart filtering based on enabled project features
- ✅ TypeScript types included

## Example: Complete Setup

```typescript
import {
  generateSyncpackConfig,
  installSyncpackConfig,
} from '@outfitter/baselayer/generators/syncpack';

// Install with all options
await installSyncpackConfig(
  '/path/to/project',
  {
    features: {
      linting: true,
      formatting: true,
      testing: true,
    },
  },
  {
    monorepo: true,
    internalPackageScope: '@mycompany',
    addScripts: true, // Note: Currently logs suggested scripts
    additionalSemverGroups: [
      {
        label: 'Keep AWS SDK versions in sync',
        packages: ['**'],
        dependencies: ['@aws-sdk/*'],
        dependencyTypes: ['prod'],
        range: '^',
      },
    ],
  },
);
```

This will:

1. Generate `.syncpackrc.json` with your configuration
2. Filter out tools you're not using
3. Add your custom dependency groups
4. Configure workspace protocol for monorepos
5. Suggest package.json scripts to add
