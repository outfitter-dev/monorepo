# CLI and Packlist Architecture

This document explains the relationship between `@outfitter/cli` and `@outfitter/packlist`, and how they work together to provide a complete configuration management system.

## Overview

The Outfitter monorepo contains two complementary packages for configuration management:

- **`@outfitter/cli`**: User-facing command-line interface (the `outfitter` command)
- **`@outfitter/packlist`**: Core configuration engine and programmatic API

## Architecture Design

```text
┌─────────────┐         ┌──────────────┐
│   User      │────────▶│     CLI      │
└─────────────┘         └───────┬──────┘
                                │ uses
                                ▼
                        ┌──────────────┐
                        │  Packlist    │
                        └───────┬──────┘
                                │ manages
                                ▼
                    ┌─────────────────────┐
                    │ Config Packages     │
                    ├─────────────────────┤
                    │ • eslint-config     │
                    │ • typescript-config │
                    │ • husky-config      │
                    │ • changeset-config  │
                    └─────────────────────┘
```

## Separation of Concerns

### @outfitter/cli

**Responsibilities**:

- Command-line interface parsing
- User interaction and prompts
- Command organization
- Output formatting
- Global installation support

**What it does NOT do**:

- Direct configuration manipulation
- Package dependency resolution
- Config file generation

### @outfitter/packlist

**Responsibilities**:

- Configuration orchestration
- Package dependency management
- Config file generation
- Preset definitions
- Error handling with Result pattern

**What it does NOT do**:

- Command-line parsing
- User interaction
- Terminal output formatting

## How They Work Together

### Example: `outfitter packlist init` Command

```typescript
// CLI Layer (packages/cli/src/commands/init.ts)
import { init } from '@outfitter/packlist';
import { isSuccess } from '@outfitter/contracts';

export async function initCommand(options: InitOptions) {
  // 1. CLI handles user interaction
  const preset = await promptForPreset();
  const features = await promptForFeatures();

  // 2. CLI calls Packlist API
  const result = await init({
    preset,
    features,
    projectRoot: process.cwd(),
  });

  // 3. CLI handles output formatting
  if (isSuccess(result)) {
    console.log('✅ Project initialized!');
    displaySummary(result.data);
  } else {
    console.error('❌ Initialization failed:', result.error.message);
    process.exit(1);
  }
}
```

```typescript
// Packlist Layer (packages/packlist/src/init.ts)
export async function init(
  options: InitOptions
): Result<InitResult, PacklistError> {
  // 1. Validate environment
  const validation = validateProjectRoot(options.projectRoot);
  if (!isSuccess(validation)) return validation;

  // 2. Resolve configurations
  const configs = resolveConfigurations(options.preset, options.features);

  // 3. Install configurations
  for (const config of configs) {
    const result = await installConfiguration(config);
    if (!isSuccess(result)) return result;
  }

  // 4. Generate config files
  return generateProjectConfig(options);
}
```

## Data Flow

### 1. Command Execution

```
User Input → CLI Command → Packlist API → Config Packages → File System
```

### 2. Error Handling

```
Config Error → Result.failure() → CLI formats error → User sees message
```

### 3. Configuration Resolution

```
Preset Selection → Feature Flags → Dependency Graph → Installation Order
```

## Package Design Principles

### CLI Design Principles

1. **Thin command layer**: Commands should be simple orchestrators
2. **Rich user experience**: Interactive prompts, progress indicators, colored output
3. **Graceful degradation**: Work in various terminal environments
4. **Global installation**: Must work when installed globally

### Packlist Design Principles

1. **Pure functions**: All operations return Result types
2. **No side effects**: Until explicitly committed
3. **Testable**: Can be tested without CLI layer
4. **Reusable**: Other tools can build on Packlist

## Extension Points

### Adding New Commands to CLI

```typescript
// packages/cli/src/commands/new-command.ts
import { newFeature } from '@outfitter/packlist';

export async function newCommand(args: string[]) {
  // 1. Parse CLI arguments
  const options = parseArgs(args);

  // 2. Call Packlist API
  const result = await newFeature(options);

  // 3. Handle result
  return handleResult(result);
}
```

### Adding New Features to Packlist

```typescript
// packages/packlist/src/features/new-feature.ts
export async function newFeature(
  options: FeatureOptions
): Result<FeatureResult, PacklistError> {
  // Implementation using Result pattern
}
```

## Testing Strategy

### CLI Testing

Focus on:

- Command parsing
- User interaction flows
- Output formatting
- Error message display

```typescript
test('init command with preset', async () => {
  const mockInit = vi.fn().mockResolvedValue(success({ configs: ['eslint'] }));
  vi.mocked(packlist.init).mockImplementation(mockInit);

  await runCommand(['init', '--preset', 'react']);

  expect(mockInit).toHaveBeenCalledWith({
    preset: 'react',
    projectRoot: expect.any(String),
  });
});
```

### Packlist Testing

Focus on:

- Configuration logic
- Dependency resolution
- File generation
- Error cases

```typescript
test('init with react preset', async () => {
  const result = await init({
    preset: 'react',
    projectRoot: '/test/project',
  });

  expect(isSuccess(result)).toBe(true);
  expect(result.data.configs).toContain('@outfitter/eslint-config');
  expect(result.data.configs).toContain('@outfitter/typescript-config');
});
```

## Future Considerations

### Potential CLI Enhancements

- Web UI for configuration
- VS Code extension
- Interactive configuration builder
- Real-time config validation

### Potential Packlist Enhancements

- Plugin system for third-party configs
- Configuration migration tools
- Dependency conflict resolution
- Config performance profiling

## Summary

The separation between CLI and Packlist provides:

1. **Clear boundaries**: Each package has a single responsibility
2. **Reusability**: Packlist can be used by other tools
3. **Testability**: Each layer can be tested independently
4. **Flexibility**: CLI can be replaced without changing core logic
5. **Type safety**: Result pattern ensures error handling

This architecture allows the Outfitter monorepo to provide both an excellent user experience through the CLI and a robust programmatic API through Packlist.
