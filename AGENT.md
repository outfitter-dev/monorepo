# AGENT.md

## Commands

```bash
# Build/test/lint
bun run ci:local       # Full CI check
bun test               # Run tests in watch mode
bun test --run         # Single test run
bun test packages/contracts/ts/src/__tests__/result.test.ts
bun run test --filter @outfitter/contracts  # Test specific package
bun run build          # Build all packages
bun run lint           # Biome lint check
bun run format:fix     # Auto-fix formatting
```

## Architecture

Monorepo with packages using Bun workspaces. Build order: `contracts/ts` first (zero deps), then others. Core packages: `contracts/ts` (Result pattern utilities), `packlist` (config manager), `cli` (globally installable tool). Configuration packages: `typescript-config`, `husky-config`, `changeset-config`. Documentation: `fieldguides`.

## Code Style

- Always use Bun, never npm/yarn/pnpm
- Result pattern mandatory for error handling: `import { Result, success, failure, makeError } from '@outfitter/contracts'`
- TypeScript strict mode, prefer `Array<T>` over `T[]`, no `I` prefix on interfaces
- Workspace dependencies use `workspace:*` protocol
- Conventional commits: `type(scope): subject` (feat, fix, docs, etc.)
- Tests in `src/__tests__/` directories, 80% coverage target (90% for critical)
- Zero runtime dependencies in core libs, parse boundaries with proven libraries (Zod/Joi/Yup), TSDoc for documentation
