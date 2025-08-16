# Monorepo Rules

## Monorepo Structure

- **Bun Workspaces**: Native monorepo support with `workspaces` in package.json
- **Turbo Pipelines**: Task orchestration with dependency graph awareness
- **Shared Configuration**: TypeScript, Biome, and other configs at root level

## Build Pipeline (turbo.json)

- `build`: Depends on upstream builds and typecheck, outputs to dist/build/.next
- `dev`: Non-cached, persistent development servers
- `test`: Depends on upstream builds, outputs coverage reports
- `typecheck`: Depends on upstream builds, validates all TypeScript files

## Package Development

- Place shared configurations and utilities in `packages/`
- Place applications in `apps/` (planned)
- Place shared configurations in `shared/`
- Use workspace protocol for internal dependencies: `"@outfitter/package-name": "workspace:*"`
- Each package should have its own `package.json` and `tsconfig.json`

## Important Patterns

### Inter-Package References (Between Workspaces)

- **Primary Pattern**: Use scoped package names with `workspace:*` dependencies
- Always use the full scoped name when importing between packages:

```typescript
// In @outfitter/cli importing from @outfitter/contracts
import { Result, success, failure } from '@outfitter/contracts';
import { generateConfig } from '@outfitter/baselayer';
```

### Intra-Package References (Within a Package)

- **Secondary Pattern**: Use `@/` path mapping for imports within the same package
- Configure in each package's `tsconfig.json`:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@components/*": ["./src/components/*"],
      "@utils/*": ["./src/utils/*"]
    }
  }
}
```

```typescript
// Within @outfitter/cli package only
import { logger } from '@/utils/logger';
import { validateConfig } from '@/validators';
```

## Dependency Management

- Use Bun for all package management (`bun add`, `bun remove`)
- Syncpack ensures consistent versions across packages
- Publint validates packages before publishing
