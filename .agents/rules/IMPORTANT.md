# Important Guardrails

1. **Bun-first everything.** All scripts, builds, and tests must use Bun 1.3.0+. Do not add Node/npm-specific tooling unless absolutely necessary, and gate it behind a documented fallback.
2. **Workspace boundaries.** Shared libraries belong under `packages/`, runnable surfaces under `apps/`. Any new folder at the root needs an explicit section in `README.md`.
3. **Keep `main` pristine.** The new repo is greenfield—every commit merged to `main` must pass Ultracite check/fix, Vitest, and Lefthook hooks locally.
4. **Codify decisions.** When you add a new convention, drop a note in `.agents/rules/` (or update an existing one) so agents stay in sync.
