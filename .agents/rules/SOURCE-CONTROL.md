# Source Control & Branching

- Use Git + Graphite (`gt`) for stacked workflows (see `GRAPHITE.md`).
- Branch naming: `feat/<area>/<slug>` or Linear-derived `feat/mono-123-short-title`.
- Before pushing, run `bun run format && bun run lint && bun run test`.
- Keep commits clean and scoped. Squash via Graphite when merging to `main`.
- No direct merges from GitHub UI—use Graphite submit flow once CI is configured (or local `gt submit --no-interactive` for now).
