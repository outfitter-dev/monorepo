# @outfitter/packlist

> Unified development configuration manager that orchestrates all Outfitter development tools

## Installation

```bash
npm install --save-dev @outfitter/packlist
# or
pnpm add -D @outfitter/packlist
```

## Overview

Packlist is the central configuration manager for Outfitter projects. It brings together all the individual configuration packages (`eslint-config`, `typescript-config`, `husky-config`, etc.) and provides a unified interface for managing your development environment.

## Features

- **Unified Setup**: Single command to configure all development tools
- **Configuration Discovery**: Automatically detects and manages config dependencies
- **CLI Interface**: Command-line tool for easy project initialization
- **Programmatic API**: Use as a library in your build scripts
- **Result Pattern**: Built on `@outfitter/contracts` for robust error handling

## Usage

### CLI

```bash
# Initialize a new project with all configurations
npx packlist init

# Add specific configurations
npx packlist add eslint typescript

# List available configurations
npx packlist list

# Check configuration status
npx packlist status
```

### Programmatic API

```typescript
import { init, getConfig } from '@outfitter/packlist';
import { isSuccess } from '@outfitter/contracts';

// Initialize project configuration
const result = await init({
  preset: 'react',
  features: ['eslint', 'typescript', 'husky'],
});

if (isSuccess(result)) {
  console.log('Configuration complete!');
}

// Get configuration details
const config = getConfig('eslint');
```

## Available Configurations

- **`eslint`**: ESLint configuration (`@outfitter/eslint-config`)
- **`typescript`**: TypeScript configuration (`@outfitter/typescript-config`)
- **`husky`**: Git hooks configuration (`@outfitter/husky-config`)
- **`changeset`**: Release management (`@outfitter/changeset-config`)
- **`utils`**: TypeScript utilities (`@outfitter/contracts`)

## Presets

### React Preset

```bash
npx packlist init --preset react
```

Includes:

- TypeScript with React support
- ESLint with React rules
- Prettier formatting
- Git hooks for quality checks
- Testing setup

### Node Preset

```bash
npx packlist init --preset node
```

Includes:

- TypeScript for Node.js
- ESLint for backend code
- Testing configuration
- Build tools

### Minimal Preset

```bash
npx packlist init --preset minimal
```

Includes:

- Basic TypeScript configuration
- Essential ESLint rules
- Prettier formatting

## Configuration File

Packlist creates a `.packlist.json` file to track your project's configuration:

```json
{
  "version": "1.0.0",
  "preset": "react",
  "configurations": [
    "@outfitter/eslint-config",
    "@outfitter/typescript-config",
    "@outfitter/husky-config"
  ],
  "installed": "2024-01-20T10:30:00Z"
}
```

## Development

This package is part of the [@outfitter/monorepo](https://github.com/outfitter-dev/monorepo) monorepo.

See the [Development Guide](../../docs/contributing/development.md) for instructions on building, testing, and contributing to this package.

For architectural details about how this package relates to `@outfitter/cli`, see [CLI and Packlist Architecture](../../docs/architecture/cli-and-packlist.md).

## License

MIT
