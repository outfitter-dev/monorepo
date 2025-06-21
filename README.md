# @outfitter/monorepo

Core shared configurations and utilities for Outfitter projects.

## Packages

This monorepo contains the following packages:

### Core Libraries

- **[@outfitter/packlist](./packages/packlist)** - Unified development configuration manager
- **[@outfitter/contracts](./packages/contracts/typescript)** - Type-safe utility functions and error handling

### Development Configurations

- **[@outfitter/eslint-config](./packages/eslint-config)** - Shared ESLint configuration
- **[@outfitter/typescript-config](./packages/typescript-config)** - Shared TypeScript configurations
- **[@outfitter/husky-config](./packages/husky-config)** - Git hooks configuration
- **[@outfitter/changeset-config](./packages/changeset-config)** - Release management configuration

### Tools & Documentation

- **[@outfitter/cli](./packages/cli)** - Command-line tool for project setup and management
- **[@outfitter/fieldguides](./packages/fieldguides)** - Comprehensive coding guidelines and best practices

## Development

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test

# Lint and format
pnpm ci:local
```

## Publishing

This monorepo uses [Changesets](https://github.com/changesets/changesets) for version management and publishing.

```bash
# Add a changeset
pnpm changeset

# Version packages
pnpm changeset:version

# Publish to npm
pnpm changeset:publish
```

## License

MIT
