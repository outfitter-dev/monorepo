# monorepo-next

> Fresh scaffold for the next-generation Outfitter monorepo.

## What’s in place

- Bun workspaces (`apps/*`, `packages/*`) with Bun `1.3.0`
- Biome (`biome.json`) and Ultracite (`ultracite.config.json`) for linting/formatting
- Lefthook pre-commit/push hooks wired to Ultracite and Bun test
- Baseline scripts (`format`, `lint`, `test`) available at the workspace root

## Getting started

```bash
# install dependencies & set up Git hooks
bun install

# format everything with Ultracite + Biome
bun run format

# run lint checks
bun run lint

# run tests (wire up packages/apps first)
bun run test
```

## Next steps

- Create packages under `packages/` (e.g. `packages/contracts`, `packages/config`)
- Add applications/examples under `apps/`
- Port shared tooling incrementally from the legacy monorepo
- Extend Lefthook/Ultracite configuration as packages come online

This scaffold is intentionally minimal—expand the workspace as we migrate code outlined in `SHARED_CORE.md`.
