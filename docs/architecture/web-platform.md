# Outfitter Web Platform — Architecture

**Status:** Living · **Owner:** Matt Galligan · **Captured:** 2026-06-14 · **Scaffolded:** 2026-06-15

The shared frontend architecture for Outfitter project sites (Trails, Skillset), the Outfitter landing/blog, and the personal site — built once, reused across all of them. This is a living doc; record decisions and their _why_ so intent survives.

---

## 0. Implementation status (as-built)

What the current scaffold proves, so this doc reads as ground truth rather than aspiration:

- **Wired:** Bun workspaces + Turborepo + Changesets; `@outfitter/tsconfig`, `@outfitter/tokens`, `@outfitter/config` (Tier 0); `@outfitter/ui` (Tier 1); `apps/trails-web` (Fumadocs on Next 16). The Tier 0 → Tier 1 → app chain is exercised live: a `@outfitter/ui` component renders both in a React page and inside Fumadocs MDX, design tokens flow into the Tailwind v4 theme, and `next/link` is injected through the framework-primitive seam. `bun install`, repo-wide `typecheck`, and `turbo build` (static generation) are green.
- **Deferred (not yet built):** `@outfitter/mdx`, `@pierre/diffs` integration, `apps/outfitter-web`, `skillset-web`, the personal site, the shadcn registry, the Trails projection/web adapter, lint/format tooling, and the full injection-provider plumbing (only the minimal `<a>`-default seam exists today).
- **Open seam:** how Trails content reaches `trails-web` (§7). Decision pending; today the docs site holds placeholder shell content. "Pull from existing Trails docs" is an acceptable interim stance.

Two intentional deviations from the original draft, both forced by reality during scaffolding:

1. **`@outfitter/tsconfig` is its own package**, not folded into `@outfitter/config`. Bundling the shared tsconfig into `config` created a dependency cycle (`config` depends on `tokens` for its Tailwind theme; `tokens` depended back on `config` only for the tsconfig). Splitting tsconfig into a zero-dependency package keeps the `config → tokens` edge meaningful and gives `tokens` zero dependencies, as the most fundamental Tier 0 package should have. This also matches the legacy repo's `typescript-config` convention.
2. **Next 16 ships without Cache Components for now.** Cache Components (`cacheComponents: true`) is the newest surface in Next 16, and `trails-web` is the first app built. It is opt-in by design, so it stays a tightening step adopted once the static path is proven — not the baseline.

---

## 1. Summary

Build all sites from a **single Bun-first monorepo** (`outfitter`) where shared design, content, and logic live as workspace packages, and each site is a **Next.js App Router** app deployed independently to **Vercel**. Sites start co-located for development velocity; individual sites get **extracted into their own repos later**, on a forcing function, not a schedule.

The reuse layer is the set of `@outfitter/*` packages, **tiered by framework coupling** so that the bulk of the code (schema, tokens, logic, presentational components) is reusable by _any_ frontend — including a future Bun-served one — and only a thin layer is Next-specific.

| Area | Decision | Why |
| --- | --- | --- |
| Framework | **Next.js 16** App Router, all sites | First-classes Fumadocs, `@pierre/diffs`, shadcn, React demos. One mental model; static-by-default with opt-in dynamic islands. |
| Hosting | Vercel, all-in | First-party Next host; preview deploys per branch with zero hand-wiring; no adapter. |
| Toolchain | Bun (package manager, runner, test, CLIs) | All-in on Bun for everything _around_ Next. |
| Next runtime | Node (not Bun runtime) | Matches Vercel; avoids native-module breakage. Bun runs the toolchain, Node runs Next. |
| Docs | Fumadocs | Best-in-class React docs framework; SSG-capable; happiest on Next; built-in component playground for demos. |
| Diffs/code | `@pierre/diffs` | Shiki-based, React + vanilla, handles scale; shares Shiki with Fumadocs for theme coherence. |
| Content | MDX | Prose in Markdown, inject components where needed. |
| Components | shadcn (registry deferred) | In-monorepo = plain workspace imports; registry earns its keep only at extraction. |
| Repo model | Monorepo-first, extract sites later | Develop shared tooling against a live consumer; defer the mechanical repo split. |
| Naming | `apps/<name>-web` | Leaves room for `apps/<name>-cli`, services, etc. |
| Versioning posture | Latest stable, gated by the Kit | Adopt newest stable once Diffs/shadcn/Fumadocs ride it; pin the laggard, never the reverse. |
| Content typing | Type-safe end to end (Zod) | Contract → projected content → component share one schema. One source of truth, made literal. |
| Agent surfaces | llms.txt + per-page `.md` + docs-as-MCP | Docs are first-class agent inputs, not just human pages — the core Outfitter thesis, dogfooded. |
| Live demos | `@pierre/diffs`, Sandpack, libghostty terminal | Show the real thing (incl. authentic CLI), not a screenshot. |
| Visual system | Field-guide language; NPS Unigrid as org model | Coherent family, distinct per-project identity — the Unigrid model _is_ the preset architecture. |

---

## 2. Goals & Non-Goals

### Goals

- One design system and codebase reused across Trails, Skillset, Outfitter, and personal — coherent feel, distinct per-project identity.
- Fast, version-controlled updates that propagate across sites without rebuilding from scratch.
- Independent deployments per site (separate domains, separate release cadence).
- Static-fast page loads where feasible.
- Shared code reusable on a **non-Next frontend** (e.g., a Bun-served app) from day one.
- Dogfooding: docs and changelogs stay aligned with the actual Trails/Skillset source of truth.

### Non-Goals

- A single deployment serving all sites.
- A single repo holding all sites long-term (they diverge in cadence and contributors).
- Running Next on the Bun runtime (explicitly out — see §6).
- Building the full design-system registry or framework-injection plumbing before there's a second consumer that needs it.

---

## 3. Decisions & Rationale

### 3.1 Next.js App Router everywhere

Next is the only choice that makes _all_ the named tools first-class simultaneously: Fumadocs is happiest on Next, `@pierre/diffs` is React, shadcn is React-native, demos want React. One framework collapses cognitive overhead to a single model and minimizes drift.

**Baseline: Next.js 16**, static-first. Cache Components (`cacheComponents: true`) gives a static shell with dynamic islands opted in behind `<Suspense>` — the static-first posture we want without an all-or-nothing SSG/SSR choice. We adopt it as a tightening step, not the floor (see §0).

**Rejected:** Astro for content + Next for docs. Fumadocs is **not** first-class on Astro; splitting would mean two build modes. The single-framework win outweighs Astro's static-perf edge, especially since Vercel makes SSG fast regardless.

### 3.2 Vercel, all-in

Per-branch preview deployments and automatic per-PR URLs are native on Vercel with zero adapter. Going static-first neutralizes Vercel's main cost concern (its premium features are server-side; we lean static).

**Rejected:** Cloudflare + OpenNext. The adapter adds a build step, Worker size limits, and image-optimization config we don't need for these sites. Cloudflare remains the home for _infrastructure_ (Workers, R2/D1, tunnels) — just not for hosting these Next sites.

### 3.3 Bun toolchain, Node runtime for Next

See §6. Bun owns the toolchain layer; Node executes Next; they sit at different layers and don't collide.

### 3.4 Monorepo-first, extract sites later

Develop the shared packages against a live consumer (Trails) with workspace links — no publish/version dance during the messy early phase. The repo extraction we defer is the _mechanical_ part. The shared-tooling _design_ is not deferred; it's the point.

### 3.5 Latest stable, gated by the Kit

Default to the newest stable release **once the Kit rides it** — "the Kit" being our load-bearing libraries: `@pierre/diffs`, shadcn, Fumadocs. Adopt latest stable when all three are compatible; if one lags, pin _it_, never hold the whole stack back. Gate also on **load-bearingness**: a young dependency under a swappable surface is fine; a young dependency under several load-bearing surfaces needs a named fallback. (`@pierre/diffs` is the youngest dep and feeds `<Diff>`, the changelog, and demos — its Shiki-direct fallback, shared with Fumadocs, keeps it replaceable.)

---

## 4. Repository & Monorepo Structure

```
outfitter/                      # @outfitter/* scope, Bun workspaces + Turborepo
  apps/
    trails-web/                 # Fumadocs/Next docs site   → Vercel project
    # later: outfitter-web/, skillset-web/, personal-web/
  packages/
    tsconfig/      # Tier 0: shared TypeScript configs (zero deps)
    tokens/        # Tier 0: design tokens (TS object + generated CSS vars)
    config/        # Tier 0: Tailwind theme bridge (maps tokens → Tailwind)
    # later: content/ (Zod content schema), mdx/ (<Callout> <Diff> <Demo>), next/ (Next-only glue)
    ui/            # Tier 1: presentational React components (react as peer)
  turbo.json
  package.json     # packageManager: bun, workspaces: [apps/*, packages/*]
```

Each site is a standalone Next app importing `@outfitter/*`. While in the monorepo, shared UI is consumed by **plain workspace imports** — no registry needed (see §8).

---

## 5. Package Tiering & Modularity

The reusability requirement is solved by **tiering packages by framework coupling** with **one-way dependencies**. Dependencies flow Tier 0 → Tier 1 → Tier 2 → app only.

### Tier 0 — pure TypeScript / config, runtime-agnostic

Runs on Bun, Node, browser, edge. **Most of the reuse lives here.**

- `@outfitter/tsconfig` — shared TypeScript configs (`base`, `react-lib`, `next`). Zero dependencies, so every other package can extend it without creating cycles.
- `@outfitter/tokens` — design tokens as a TS object _and_ a generated CSS-variables file (`scripts/build-css.ts` projects the object into `tokens.css`). Framework-agnostic so any frontend pulls the same variables; Tailwind merely consumes them.
- `@outfitter/config` — the Tailwind v4 theme bridge: `@theme inline` maps the token CSS vars into Tailwind's namespace so utilities resolve to tokens without copying values. (Future: eslint, fumadocs presets.)
- _Later:_ `@outfitter/content` — Zod schema for frontmatter and projected content.

### Tier 1 — React, framework-neutral

Depends only on `react` + styling. **No `next/*` imports** (a `next/link` here poisons portability). `react`/`react-dom` are `peerDependencies`, not deps — so each consuming app brings its own React, which prevents two-Reacts-in-one-tree when a Vite/Bun app and a Next app both pull the package.

- `@outfitter/ui` — presentational components.
- _Later:_ `@outfitter/mdx` — `<Callout>`, `<Diff>` (wraps `@pierre/diffs`, React + vanilla, no Next dependency), `<Demo>`.

### Tier 2 — Next-only glue

Anything touching `next/image`, `next/link`, route handlers, `generateMetadata`, Fumadocs Next adapter wiring. `next` as a peer dep. Kept thin and quarantined at the app edge — the deliberate "Next tax." Until a _second_ Next app exists, this lives in-app rather than as a package; promote to `@outfitter/next` at that point.

### The framework-primitive seam (day-one, minimal)

Components that need a link/image/router can't hard-import `next/link` (Tier 1 rule). The portable pattern is **injection**. The day-one version is the cheapest possible seam — a prop defaulting to a plain anchor (implemented in `@outfitter/ui` as `DefaultLink` / `NavItem`). The Next app injects `next/link`; a Bun/Vite app injects its own.

**Build the seam now** (nearly free, brutal to retrofit). **Defer the full provider/context/router abstraction** until a real second consumer needs it. The two likely non-Next targets (`Bun.serve`, Hono) are server/SSR frameworks with no Next-style `<Link>`/prefetch primitive, so the minimal `<a>`-default seam is very likely _sufficient_ for both.

### Rendering contract

**React is the universal rendering contract** for any surface reusing `@outfitter/ui`. Next (given), `Bun.serve` (imports React directly), and Hono via `@hono/react-renderer` all satisfy the React peer. A `hono/jsx` app cannot satisfy it and is therefore **Tier-0-only by construction** — the correct boundary. Escape hatch: `@pierre/diffs` ships a vanilla build, so even a `hono/jsx` surface can render diffs/code below the React line.

### Build note: ship source while in-monorepo

`transpilePackages` lets Next compile the workspace source directly. Shipping source (not a prebuilt bundle) sidesteps the nastiest portability trap — `"use client"` / RSC directives getting mangled by a package bundler. Revisit prebuilding only at publish/extraction time.

---

## 6. The Bun + Next Runtime Model

**Bun owns the toolchain layer; Node owns executing Next. Different layers, no collision.** Because we deploy to Vercel — where Next runs on Node regardless — this is settled: **Next runs on Node**. We use Bun _around_ Next, not _under_ it.

- **Bun:** package manager (`bun install`, `bun.lock`), task runner, test runner, all CLIs, codegen, every package script that isn't a Next command.
- **Node:** executes `next dev` / `next build` / `next start`, locally and on Vercel.

`bun run dev` with `"dev": "next dev"` executes Next on **Node** — Bun only overrides the runtime if you pass `--bun`. So the app scripts pass **no `--bun`**: Bun as orchestrator, Node as Next's runtime, zero extra config.

**Parity rule:** don't dev on a runtime you don't ship on. Vercel runs Next on Node, so run Next on Node locally too. Use Bun for everything else.

**Explicitly out of scope:** `bun --bun next …`. Middleware edge-runtime behavior can differ subtly, and native modules (sharp, bcrypt) can turn into crash-loops. On Vercel it's moot. File under "an option only if we ever self-host on the `oven/bun` image and have tested the dependency set."

---

## 7. Content Pipeline

> **OPEN SEAM (decision pending).** How Trails content reaches `trails-web` is not yet decided. The original draft proposed a Trails-side "projection" package plus docs-as-MCP. That intersects a coherence question worth resolving before it hardens: the docs site is a _consumer_ of contract facts, and Trails already derives a queryable, committed, diffable picture of every contract (the resolved topo artifact family + Wayfinder + the existing MCP surface). The likely-correct shape is for `trails-web` to **consume the existing derivation** rather than stand up a second one, and for any contract-derived schema to be **owned by Trails** (the website maps it, never owns it). Until decided, `trails-web` holds placeholder shell content; "pull from existing Trails docs" is an acceptable interim stance. The rest of this section is the durable, non-Trails-specific content model.

### Type-safe, end to end

One schema flows the whole way: **contract → projected content → rendered component.** Fumadocs' native **Zod content collections** validate frontmatter and page shape; the same `@outfitter/content` schema (Tier 0, deferred) will type projected output; components consume those types. Nothing is re-described at a boundary — it's derived and checked. A contract change surfaces as a type error in the docs, not silent drift.

### MDX everywhere content lives

Prose in Markdown, components injected as needed. Fumadocs MDX is the content source for docs; the same MDX component set (`@outfitter/mdx`) renders marketing/blog content so everything looks coherent.

### Two changelog streams (keep them distinct)

- **Package changelog** — driven by **Changesets** in the monorepo (versions packages; generates changelog data the sites render).
- **Product changelog** — Trails/Skillset releases. Rendered with `@pierre/diffs` for code-level before/after. (Candidate upgrade: derive "what changed in the contract" from diffing committed Trails topo artifacts across releases — the contract can't then lie about itself. Tied to the open seam above.)

> **Note on Skillset:** the projection elegance is a _contract-first_ property of Trails. Whether Skillset shares that shape is unconfirmed; do not assume a symmetric pipeline until established.

### Agent-readable surfaces (first-class)

Docs are increasingly read by agents, and Outfitter's thesis is making agents better at building. Each docs site ships agent-native surfaces, nearly free with Fumadocs: `/llms.txt`, `/llms-full.txt`, per-page `.md` (Accept-header / `.md` suffix), an "Ask AI" action, and docs-as-MCP for query-style access. Honest framing: **not** an SEO/ranking play — the value is the agentic layer (an agent fetches clean markdown instead of scraping HTML) and the dogfood (our own agents read these surfaces).

---

## 8. Design System, Theming & Distribution

### Coherence with distinct identity

- **Outfitter base** design system defines the shared primitives and structure.
- **Per-project presets** (Trails palette, Skillset identity, a more-divergent personal preset) override tokens but inherit structure — coherent family, distinct faces.
- Tokens are **CSS custom properties** (Tailwind v4 CSS-first consumes them) plus a TS object, so the design system itself is portable (§5, Tier 0), not just the components.

### Visual language: a field-guide system

The aesthetic is **warm, thoughtful, field-guide** — and one reference does double duty as both look _and_ organizing model:

- **NPS Unigrid is the org model, not just inspiration.** Vignelli's National Park system is one shared grid, type system, and banner, with each park carrying its own identity color while staying unmistakably family. That maps 1:1 onto the preset architecture: **Outfitter base = the Unigrid system; Trails / Skillset / personal = individual parks.** The visual lineage and the reuse strategy are the _same decision_.
- **Field Notes** → utilitarian texture: kraft/cream tones, numbered editions, "made to be used."
- **WPA park posters + 1950s–70s technical manuals** → illustration language and restrained spot color; exploded diagrams, isotype-like clarity.
- **Field observation logbooks** → ruled ledger columns, specimen/field-tag labels, rubber-stamp accents — a natural fit for changelog entries, version tags, metadata.

**Typography:** Berkeley Mono = the logbook/technical voice (versions, code, field tags); a humanist sans (Frutiger lineage) = the signage voice; a serif (Source Serif) = editorial prose. Levity lands as small, clean field illustrations — characterful, never cute.

All of it is encoded as **tokens**, so it's a _system_, not a skin — and each "park" is a token override, not a re-style.

### Distribution: workspace imports now, shadcn registry at extraction

While everything is in the monorepo, shared design = a `packages/ui` workspace package with **plain imports**. The shadcn registry earns its keep **only once a site is a separate repo** that can't workspace-import. At that point a `registry:base` payload distributes the whole design system in one install, and `shadcn add --diff` pulls improvements forward against local changes. The registry is just schema-conforming JSON over HTTP, so **`outfitter-web` can serve it** (`/r/[name]`). Cheap insurance: stand up that route early with one component, as a tracer, so the mechanism is proven before extraction depends on it.

### Two distribution mechanisms, by concern

- **Registry (copy-in, `--diff`):** the _design layer_ you want forkable per site.
- **npm packages (`@outfitter/*`, semver):** the _logic layer_ (schema, projection types, config) you want pinned and updated deliberately.

---

## 9. Versioning & Changelog

**Changesets** from day one: versions the `@outfitter/*` packages, and generates structured changelog data the sites render. During in-monorepo dev, workspace links mean "always latest"; Changesets formalizes the version story when packages get published.

The **changelog is a first-class surface** — `/changelog` is a designed page (RSS/Atom feed, per-entry permalinks, entries rendered through `@pierre/diffs` in the logbook register, fed by Changesets and the product projection, built once as a reusable surface every site inherits).

---

## 10. Demos & Previews

- **Pre-baked fixtures + interactive React island components** in `@outfitter/ui` / `@outfitter/mdx`.
- **`@pierre/diffs`** for "input → emitted output" before/after — split or stacked, annotations, line selection; diffs any two files, not just git patches.
- **Fumadocs' built-in component playground** for live component showcases.
- **Sandpack** for snippet-level runnable code in MDX; reserve heavier **WebContainers** for a single flagship "try it" page.

### Terminal demos (Trails/Skillset are CLI-first)

Demo the real CLI in a real terminal emulator via **`ghostty-web`** (~400KB WASM, xterm.js-API-compatible). **Replay mode** (asciinema-style cast) is the default marketing demo — no backend, safe, fast. **Live PTY mode** (real shell over WebSocket to a sandboxed box) is reserved for one flagship page and is a real security surface. **Caveat:** the libghostty API is not stable yet — pin the version, treat it as a demo dependency, never load-bearing.

### Themed diagrams via tldraw

`tldraw` is deeply themeable. Dress it in the field-guide look and use agent-generated, on-brand architecture diagrams as a _house style_ across the docs — editable, consistent, themed to the Unigrid/logbook aesthetic.

---

## 11. Deployment

- **One Vercel project per app**, Root Directory pointed at its `apps/*-web` folder. Vercel detects Turborepo and builds only what changed.
- **Preview deploys on** — per-branch URLs for free.
- **Install via Bun** (lockfile-detected); **build/run Next on Node.**
- Independent domains and release cadence per site, all from one repo — _before_ any extraction.

---

## 12. Extraction Plan

Sites leave the monorepo on a **forcing function**, not a schedule. Triggers: an outside contributor needs to work on a site without monorepo access; a site's release cadence diverges meaningfully; or monorepo CI gets slow enough to hurt.

At extraction: packages **stay** in the monorepo and get **published** (`@outfitter/*`); the extracted site swaps workspace links for published semver deps; stand up the shadcn registry (served by `outfitter-web`). Because Tier-1 packages already use peer deps and the no-deep-import rule, extraction is mechanical, not surgical. **Premature extraction is premature abstraction wearing a different hat — don't.**

---

## 13. Sequencing

1. ~~Init monorepo: Turborepo + Bun workspaces, Changesets, `@outfitter/tsconfig`, `@outfitter/tokens`, `@outfitter/config`.~~ **Done (2026-06-15).**
2. ~~`apps/trails-web`: Fumadocs/Next, real content on a few docs pages.~~ **Done — shell with placeholder content; real content pending the §7 seam.**
3. ~~Extract `@outfitter/ui`~~ **Done early (one component, proving the tiering wiring).** `@outfitter/mdx` extracts as the second use arises.
4. `apps/outfitter-web`: landing + blog index + one MDX post (the non-docs shape check, so the abstraction sees both shapes before it hardens).
5. Two Vercel projects, preview deploys on.
6. Wire `@pierre/diffs` into `@outfitter/mdx` for the Trails demos.

**Deferred:** the registry, `skillset-web`, personal site, the Trails projection package, repo extraction, the full injection-provider plumbing, and lint/format tooling. Build order respects rule-of-three: ship against one real consumer plus a deliberately different second shape, then harvest shared packages from real duplication.

---

## 14. Open Questions / Revisit

- **Trails content seam (§7).** Consume the existing topo artifact family + MCP surface, with Trails owning the contract-derived schema — vs. a website-side projection. Resolve before it hardens.
- **npm scope visibility.** `@outfitter/*` published public or private at extraction?
- **Registry hosting.** Serve registry JSON from `outfitter-web` (`/r/[name]`) vs. a dedicated deployment.
- **Personal site divergence.** How far does it stray from the Outfitter family while still reusing Tier 0/1?
- **Cache Components adoption.** When to opt `trails-web` into `cacheComponents: true`.
- **Skillset symmetry.** Does Skillset share Trails' contract-first projection shape, or is its docs/changelog pipeline a different shape?
- **libghostty demo mode.** Replay-only to start, or a sandboxed live-PTY backend for one flagship page (a real security surface)?
- **Typography picks.** Final humanist sans for the signage voice (Frutiger-lineage); confirm Berkeley Mono + Source Serif round out the three registers.

---

## 15. References

- Fumadocs — <https://www.fumadocs.dev/> · <https://www.fumadocs.dev/docs> · LLM features: <https://www.fumadocs.dev/docs/integrations/llms>
- `@pierre/diffs` — <https://diffs.com/> · <https://www.npmjs.com/package/@pierre/diffs>
- shadcn registry — <https://ui.shadcn.com/docs/registry>
- Bun + Next.js — <https://bun.com/docs/guides/ecosystem/nextjs>
- Next.js 16 (Cache Components, PPR) — <https://nextjs.org/blog/next-16> · <https://nextjs.org/docs/app/api-reference/config/next-config-js/cacheComponents>
- llms.txt honest state — <https://limy.ai/blog/llms.txt-in-2026-the-full-guide>
- libghostty / `ghostty-web` — <https://github.com/coder/ghostty-web> · <https://mitchellh.com/writing/libghostty-is-coming>
- NPS Unigrid system — <https://www.nps.gov/subjects/hfc/unigrid-design-program.htm>
