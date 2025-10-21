# monorepo-next Linear Map

This repo replaces the legacy `/Users/mg/Developer/outfitter/monorepo` while keeping that workspace read-only for reference. Active implementation lives here and every milestone in `.agents/docs/SHARED_CORE.md` now points at a Linear issue so the plan is fully executable.

## Milestones → Linear

| Milestone | Linear Issue |
|-----------|--------------|
| Foundation (Milestone 00) | [MONO-2](https://linear.app/outfitter/issue/MONO-2) |
| Core Packages (Milestone 01) | [MONO-3](https://linear.app/outfitter/issue/MONO-3) |
| Infrastructure Packages (Milestone 02) | [MONO-10](https://linear.app/outfitter/issue/MONO-10) |
| Specialized Packages (Milestone 03) | [MONO-18](https://linear.app/outfitter/issue/MONO-18) |
| Tooling & Quality (Milestone 04) | [MONO-26](https://linear.app/outfitter/issue/MONO-26) |
| Observability (Milestone 05) | [MONO-32](https://linear.app/outfitter/issue/MONO-32) |
| Utilities (Milestone 06) | [MONO-35](https://linear.app/outfitter/issue/MONO-35) |
| Project Migrations (Milestone 07) | [MONO-41](https://linear.app/outfitter/issue/MONO-41) |

Each milestone issue links out to the detailed package or migration tickets (MONO-4 → MONO-47, MONO-48 → MONO-53, etc.). Update `.agents/docs/SHARED_CORE.md` whenever new work items are added so this table stays authoritative.

## Working Commands

Use the composite scripts defined in `package.json`:

```bash
# install deps + Lefthook hooks
bun install

# format with Ultracite/Biome
bun run format

# lint sequence: Syncpack → Ultracite → Oxlint
bun run lint

# dependency drift only
bun run lint:deps

# run tests (Vitest, currently zero tests is OK)
bun run test

# lint GitHub Actions (skips if .github/workflows missing)
bun run actions:lint

# run Actions locally via act (requires act + Docker)
bun run actions:test -- --list
```

## Transition Notes

- This workspace replaces the legacy monorepo while keeping it available for reference.
- Legacy patterns can be copied, but the old workspace should not receive new commits.
- Unified CodeRabbit configuration lives at `.coderabbit.yaml` (ported from legacy branch with all team keys).
- When documenting changes for agents or humans, reference this file or the respective Linear issue to keep conversations grounded in the current workspace.
