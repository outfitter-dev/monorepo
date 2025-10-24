# Repository Guidelines

## Project Layout
- Root hosts shared tooling (`biome.json`, `ultracite.config.json`, `vitest.config.ts`, `lefthook.yml`, `bunfig.toml`, `README.md`).
- Libraries live in `packages/*` (publishable, versioned). Executable entrypoints go under `apps/*`.
- Keep generated assets out of git (`dist`, `coverage`, etc.) and update `.gitignore` when introducing new tooling.

## Tooling & Commands
- Install dependencies: `bun install`.
- Format & lint: `bun run format` (Ultracite fix) and `bun run lint` (Syncpack drift check → Ultracite → Oxlint).
- Tests: `bun run test` (Vitest config in root). Package-specific scripts can delegate to the root command.
- Git hooks (Lefthook) run formatting and tests automatically—do not bypass them.

## Workflow Expectations
- Track work in Linear (team **Monorepo**). Move issues through: Todo → In Progress → In Review → Ready to Merge → Done.
- Use Graphite (`gt`) for stacked development. Follow conventions in `.agents/rules/SOURCE-CONTROL.md` and `GRAPHITE.md`.
- Before submitting, ensure `bun run format`, `bun run lint`, and `bun run test` all succeed locally.
- Document new conventions or architectural decisions by updating `.agents/rules/`.

## Style & Packaging
- TypeScript (strict) with ESM-only modules. Formatting is handled by Biome through Ultracite—no Prettier.
- Each package should expose a clear API, contain localized tests, and include a README once ready.
- Shared utilities belong in dedicated packages, not in apps.

## Additional References
- `.agents/rules/CORE.md` – guiding principles for the new shared core.
- `.agents/rules/MONOREPO.md` – workspace layout and expectations.
- `.agents/rules/WORKFLOW.md` – daily development loop.
- `.agents/rules/IMPORTANT.md` – quick-hit guardrails.
- `.agents/docs/monorepo-next.md` – Linear links and working commands for this workspace.
