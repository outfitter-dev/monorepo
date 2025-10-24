# monorepo-next

> Fresh scaffold for the next-generation Outfitter monorepo.

## What’s in place

- Bun workspaces (`apps/*`, `packages/*`) with Bun `1.3.0`
- Biome (`biome.json`) + Ultracite for formatting and linting (runs after dependency drift check)
- Syncpack (`.syncpackrc.json`) to enforce semver ranges across workspaces
- Lefthook pre-commit/push hooks wired to the composite lint + Bun test suite
- Action tooling helpers: `scripts/actions/lint-actionlint.sh` (Docker-aware) and `scripts/actions/run-act.sh`

## Getting started

```bash
# install dependencies & set up Git hooks
bun install

# check dependency versions are aligned
bun run lint:deps

# format everything with Ultracite + Biome
bun run format

# run lint checks (Syncpack → Ultracite)
bun run lint

# run tests (wire up packages/apps first)
bun run test

# lint GitHub Actions (requires actionlint or Docker)
bun run actions:lint

# run workflows locally (requires act)
bun run actions:test -- --list
```

## Next steps

- Create packages under `packages/` (e.g. `packages/contracts`, `packages/config`)
- Add applications/examples under `apps/`
- Port shared tooling incrementally from the legacy monorepo
- Extend Lefthook/Ultracite configuration as packages come online

This scaffold is intentionally minimal—expand the workspace as we migrate code outlined in `SHARED_CORE.md`.
