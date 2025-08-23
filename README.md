# @outfitter/monorepo

[![Built with Bun](https://img.shields.io/badge/Built%20with-Bun-pink?logo=bun)](https://bun.sh) [![Native Workspaces](https://img.shields.io/badge/Native-Workspaces-blue?logo=bun)](https://bun.sh) [![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)

Core shared configurations and utilities for Outfitter projects.

## Packages

This monorepo contains the following packages:

### Core Libraries

- **[@outfitter/contracts](./packages/contracts/ts)** - Result pattern utilities with zero dependencies (Bun build, 18ms)
- **[@outfitter/baselayer](./packages/baselayer)** - Consolidated configurations with sub-path exports (includes TypeScript configs: `@outfitter/baselayer/typescript/*`)

### Tools & CLI

- **[outfitter (CLI)](./packages/cli)** - Globally installable command-line tool
- **[@outfitter/flint](./packages/flint)** - Unified formatting/linting setup
- **[@outfitter/packlist](./packages/packlist)** - Development setup orchestration

### Documentation & Utilities

- **[@outfitter/fieldguides](./packages/fieldguides)** - Living documentation system
- **[@outfitter/contracts-zod](./packages/contracts-zod)** - Zod integration utilities

### Configuration Usage

```typescript
// Modern sub-path export pattern
import { biomeConfig } from '@outfitter/baselayer/biome-config';
import { prettierConfig } from '@outfitter/baselayer/prettier-config';
import { changesetConfig } from '@outfitter/baselayer/changeset-config';
```

## Development

**Requirements:**

- Bun 1.2.19+
- Node.js 18+ LTS

```bash
# Install dependencies
bun install

# Build all packages (contracts builds first, then everything else)
bun run build

# Run tests
bun test

# Lint and format
bun run ci:local

# Development with watch mode
bun run dev  # In specific package directory
```

## Performance

This monorepo is optimized for speed:

- **Full build**: ~626ms (5-6x faster than baseline)
- **Individual packages**: 18-24ms bundling (8-10x faster)
- **Bun native workspace filtering**: Intelligent task orchestration
- **Bun hybrid builds**: JavaScript bundling + TypeScript declarations

## Publishing

This monorepo uses [Changesets](https://github.com/changesets/changesets) for version management and publishing.

```bash
# Add a changeset
bun run changeset

# Version packages
bun run changeset:version

# Publish to npm
bun run changeset:publish
```

## License

MIT
