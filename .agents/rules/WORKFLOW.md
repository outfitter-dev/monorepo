# Workflow

- **Install & bootstrap:** Run `bun install` after cloning. Lefthook installs automatically; do not skip hook installation.
- **Development loop:** `bun run format` (Ultracite fix) → `bun run lint` (Ultracite check) → `bun run test`.
- **Feature cadence:** Build features in focused branches (see `SOURCE-CONTROL.md`), keep stacks < 5 commits, and rebase on `main` daily.
- **Documentation updates:** When adding a new package/app, update `README.md` and relevant `.agents/rules/*`.
- **Deployment:** Publishing is not yet configured. Until we add CI + Changesets, treat the repo as pre-release.
