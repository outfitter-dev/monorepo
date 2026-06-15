# Outfitter Web Platform

The shared frontend monorepo for Outfitter project sites (Trails, Skillset), the Outfitter landing/blog, and the personal site — built once, reused across all of them.

Architecture and rationale live in [`docs/architecture/web-platform.md`](./docs/architecture/web-platform.md).

## Layout

```
apps/
  trails-web/      # Fumadocs/Next docs site  → Vercel project
packages/
  tsconfig/        # Tier 0: shared TypeScript configs (zero deps)
  tokens/          # Tier 0: design tokens (TS object + generated CSS vars)
  config/          # Tier 0: Tailwind theme bridge (maps tokens → Tailwind)
  ui/              # Tier 1: presentational React components (react as peer)
```

Packages are **tiered by framework coupling** with one-way dependencies (Tier 0 → Tier 1 → app). Tier 0 is pure TypeScript / config and runtime-agnostic; Tier 1 is React-only with `react`/`react-dom` as peer deps; Next-specific glue stays at the app edge until a second Next app justifies extracting it.

## Toolchain

- **Bun** owns the toolchain (install, run, test, CLIs).
- **Node** runs Next (locally and on Vercel) — scripts never pass `--bun`.
- **Turborepo** orchestrates builds; **Changesets** versions publishable packages.

## Develop

```
bun install
bun run dev          # all apps via turbo
bun run typecheck
bun run build
```

`apps/trails-web` serves at <http://localhost:3000>.

## Status

Early scaffold — see the architecture doc for what's wired versus deferred. The legacy TypeScript-utilities monorepo (`@outfitter/contracts`, `@outfitter/core`, …) is preserved out-of-tree at `../monorepo.legacy-2026-06-15` and may be lifted forward on real need.
