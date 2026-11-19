# Archived packages from outfitter-dev/outfitter

Source snapshots of five `@outfitter/*` packages from the old Outfitter framework repo ([outfitter-dev/outfitter](https://github.com/outfitter-dev/outfitter)), copied at commit `05a38591` (2026-04-16). They are kept for reference only.

| Package | Last npm version | What it did |
| --- | --- | --- |
| `daemon/` | `@outfitter/daemon` 0.2.6 | Daemon lifecycle, IPC, and health checks |
| `docs/` | `@outfitter/docs` 0.2.1 | Docs CLI, assembly primitives, and freshness checks |
| `file-ops/` | `@outfitter/file-ops` 0.2.5 | Workspace detection, secure path handling, and file locking |
| `index/` | `@outfitter/index` 0.2.5 | SQLite FTS5 full-text search indexing |
| `tui/` | `@outfitter/tui` 0.2.3 | Terminal UI rendering (tables, lists, trees, spinners, prompts) |

## Status

- **Not built, tested, linted, or published.** This folder sits outside the Bun workspaces (`apps/*`, `packages/*`), so Turbo, Changesets, and typecheck never see it. It is excluded from oxlint, oxfmt, and markdownlint.
- **Does not compile as-is.** Every package imports `@outfitter/contracts`, and some import `@outfitter/types`, `@outfitter/cli`, or `@outfitter/logging`. Those were superseded by [Trails](https://github.com/outfitter-dev/trails) (`@ontrails/*`) and were not carried over.
- **Reviving one** means moving it into `packages/`, porting it to `@ontrails/core` or plain code, and publishing a new version. Earlier version numbers can't be reused on npm.

The rest of the old framework (contracts, cli, mcp, config, logging, schema, testing, and the `outfitter` CLI) was not copied. Trails replaces it, and the full history stays in the archived outfitter-dev/outfitter repository.
