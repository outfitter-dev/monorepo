# Outfitter

The Outfitter monorepo — the single home for Outfitter's shared `@outfitter/*` packages, applications, and tooling. Built once, reused across every Outfitter project.

Today it centers on the **web platform** (the docs and marketing sites for Trails, Skillset, and Outfitter, plus the shared design and content packages behind them). It is also where org-wide decisions and release tooling live, and it will grow to hold more over time — additional shared packages and the Skillset-based agent setups.

## Layout

```
apps/
  trails-web/      # Fumadocs/Next docs site → Vercel
packages/
  tsconfig/        # Tier 0: shared TypeScript configs (zero deps)
  tokens/          # Tier 0: design tokens (TS object + generated CSS vars)
  config/          # Tier 0: Tailwind theme bridge (maps tokens → Tailwind)
  ui/              # Tier 1: presentational React components (react as peer)
docs/
  adr/             # Architecture Decision Records
  architecture/    # Architecture notes (web platform, …)
```

Packages are **tiered by framework coupling** with one-way dependencies (Tier 0 → Tier 1 → app). Tier 0 is pure TypeScript / config and runtime-agnostic; Tier 1 is React-only with `react`/`react-dom` as peer deps; framework-specific glue stays at the app edge until a second consumer justifies extracting it. The tiering keeps the bulk of the code reusable by any frontend, not just the Next apps.

## Toolchain

- **Bun** owns the toolchain (install, run, test, CLIs).
- **Node** runs Next (locally and on Vercel) — scripts never pass `--bun`.
- **Turborepo** orchestrates builds; **Changesets** versions publishable packages in lockstep.
- **Ultracite** (oxlint + oxfmt) formats and lints code; **markdownlint-cli2** lints Markdown; **lefthook** runs the pre-commit and pre-push gates.

## Develop

```
bun install
bun run dev          # all apps via turbo
bun run check        # format + markdown + typecheck
bun run build
```

`apps/trails-web` serves at <http://localhost:3000>.

## Decisions & releases

Significant, hard-to-reverse decisions are recorded as [ADRs](./docs/adr/). Web-platform architecture and rationale live in [`docs/architecture/web-platform.md`](./docs/architecture/web-platform.md).

Publishable `@outfitter/*` packages release in lockstep via Changesets, gated by the reusable [`outfitter-dev/release-action`](https://github.com/outfitter-dev/release-action) — see [ADR-0001](./docs/adr/0001-reusable-release-action.md).

## Status

Early. The web platform is the current focus — see the [architecture doc](./docs/architecture/web-platform.md) for what's wired versus deferred. The legacy TypeScript-utilities monorepo (`@outfitter/contracts`, `@outfitter/core`, …) is preserved out-of-tree at `../monorepo.legacy-2026-06-15` and may be lifted forward on real need.
