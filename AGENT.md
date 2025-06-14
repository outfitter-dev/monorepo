# AGENT.md

## Commands

```bash
# Build/test/lint
pnpm ci:local          # Full CI check (format:fix, lint, lint:md, type-check, tests)
pnpm test              # Run tests in watch mode
pnpm test --run        # Single test run
pnpm test packages/contracts/typescript/src/__tests__/result.test.ts  # Single test file
pnpm test --filter @outfitter/contracts  # Test specific package
pnpm build             # Build all packages (contracts/typescript builds first)
pnpm lint              # ESLint check
pnpm format:fix        # Auto-fix formatting
```

## Architecture

Monorepo with 8 packages using pnpm workspaces. Build order:
`contracts/typescript` first (zero deps), then others. Core packages:
`contracts/typescript` (Result pattern utilities), `packlist` (config manager),
`cli` (globally installable tool). Configuration packages: `eslint-config`,
`typescript-config`, `husky-config`, `changeset-config`. Documentation:
`fieldguides`.

## Code Style

- Always use pnpm, never npm/yarn
- Result pattern mandatory for error handling:
  `import { Result, success, failure, makeError } from '@outfitter/contracts'`
- TypeScript strict mode, prefer `Array<T>` over `T[]`, no `I` prefix on
  interfaces
- Workspace dependencies use `workspace:*` protocol
- Conventional commits: `type(scope): subject` (feat, fix, docs, etc.)
- Tests in `src/__tests__/` directories, 80% coverage target (90% for critical)
- Zero runtime dependencies in core libs, parse boundaries with proven libraries
  (Zod/Joi/Yup), TSDoc for documentation
