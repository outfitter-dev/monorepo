# ADR-0001: A reusable Outfitter release Action

- **Status:** Accepted
- **Date:** 2026-06-15
- **Deciders:** Matt Galligan (with Clark)

## Context

Multiple Outfitter repositories publish packages to npm: this monorepo (the shared `@outfitter/*` design-system and tooling packages), Trails (`@ontrails/*`), and Skillset (`skillset`). Each has grown its own release machinery.

Skillset built a deliberate, well-tested release pipeline worth learning from: a `changesets/action` "Version Packages" PR-bot feeds a label-gated policy engine that **independently verifies** branch, bot identity, the exact generated-diff shape, CI status, changelog heading, version delta, and registry state before any automatic publish, then splits an OIDC `npm-auto` environment from a manual-approval `npm` environment and creates a tag-authoritative GitHub release. The strength is the posture: a human label states _intent_, but the script _verifies reality_ before trusting it.

Its weakness, for reuse, is that it is single-package and hardcoded throughout — `apps/skillset`, `outfitter-dev/skillset`, the exact two-file generated diff, and the required CI check names are all baked in. Trails, separately, already solves the multi-package half: a discovery-based `publish:check` that auto-discovers every non-private workspace, topo-sorts by `workspace:` dependency edges, and uses `bun pm pack` (the only packer that resolves `catalog:` ranges).

Maintaining divergent release logic in every repo is duplicated effort and a drift surface. We want one mechanism, maintained once, that every Outfitter project consumes.

## Decision

Build a single reusable release Action in a dedicated repository, `outfitter-dev/release-action`, that all Outfitter projects consume. Port Skillset's verify-don't-trust policy and generalize it to a multi-package workspace using the Trails discovery model. Specifics:

1. **Packaging: a JS/TS GitHub Action plus a reusable workflow.** The valuable, hard-to-reproduce logic is TypeScript (registry reasoning + the policy engine), so it ships as a bundled JS action — a composite action would only centralize YAML while leaving the logic copied per repo. But the job graph (version → plan → policy → auto/manual → release), the two deployment environments, and OIDC permissions live at the _workflow_ level and cannot be expressed by an action alone. So the action is paired with a reusable workflow (`outfitter-dev/release-action/.github/workflows/release.yml@v1`) that wires the jobs and calls the action at each stage.

2. **Versioning: lockstep for `@outfitter/*`.** All publishable packages bump together (the Trails model). This collapses dist-tag selection, registry-completeness checks, and tagging to a single version tuple. Independent per-package versioning is deferred until a package demonstrably needs its own cadence.

3. **Publish mechanism: `bun publish` / `bun pm pack`.** Our packages reference siblings via `workspace:`/`catalog:` ranges, and `npm publish` does not resolve them (it would ship broken ranges) — only Bun's packer does. This matches Trails. The accepted trade-off: a granular npm automation token rather than npm OIDC Trusted Publishing, because OIDC is npm-CLI-only and the npm CLI cannot resolve workspace ranges. (Skillset can use OIDC only because it publishes a self-contained bundle with no workspace ranges.)

4. **Policy core, ported and generalized.** Carry over Skillset's label families, the verify-don't-trust auto-publish gate, generated-diff verification, the version-suffix → dist-tag mapping with an allowlist, idempotent skip-if-already-published, and read-only registry probes.

5. **Multi-package generalization.** Replace the hardcoded package directory with workspace discovery + topo-sort by `workspace:` dep edges (publish dependencies before dependents). Generalize generated-diff verification to accept N modified `package.json`s + N modified `CHANGELOG.md`s + at least one deleted `.changeset/*.md`, all derived from the discovered package set, with any out-of-set path still downgrading auto to manual.

6. **Parameterize the hardcoded bits as Action inputs:** expected repository, package discovery (workspace globs), required-check names, the auto/manual environment names, the version-PR branch and title, the prerelease dist-tag allowlist, and the per-repo build command.

## The label model

Intent is expressed through label families on the release PR (and `stack:boundary` on the source PRs that contributed changesets):

- **Publish:** `publish:auto` · `publish:manual` · `publish:block` · `publish:none`
- **Channel:** `channel:stable` · `channel:preview` · `channel:canary`
- **Release:** `release:major` · `release:minor` · `release:patch`
- **Stack (on source PRs):** `stack:boundary`

The decision tree resolves, in order, to `block` (conflicts, unknowns, registry drift, or explicit block), `none` (skip with an audit reason), `manual` (default, or `publish:manual`), or `auto` (only if `publish:auto` _and_ every auto-check passes).

## The auto-publish gate (verify-don't-trust)

`publish:auto` is a request, not an authorization. The script grants automatic publish only when **all** of these hold, and downgrades to manual (never silently publishes) otherwise: the generated diff is exactly the expected version-bump file set and nothing else; every consumed changeset source PR carries `stack:boundary`; the repository and branch match; channel is stable and the dist-tag is `latest`; the release PR is the bot's version PR with the expected title; the squash commit's subject and author/committer identity match the CI bot; the changelog contains the new version heading; the version delta is positive and matches any `release:*` label; and exact-SHA CI passed. This is the property worth preserving: the human cannot fat-finger an unintended publish, because the machine re-derives the facts.

## Consequences

**Positive.** One release mechanism to maintain instead of one per repo. Consumers adopt in roughly ten lines of `uses:`. Trails and Skillset can migrate onto it later, converging release semantics across Outfitter. The verify-don't-trust gate is centralized and tested once.

**Costs and risks.** Multi-package generated-diff verification is meaningfully more complex than the single-package case. A granular npm automation token must be managed and rotated, where OIDC would have been passwordless. Porting and testing the policy engine (~1000 LOC of git/registry/GitHub-API reasoning) is real work. npm Trusted Publishing is per-package and cannot be automated away even if we later adopt OIDC.

**Neutral.** Lockstep versioning constrains independent package cadence — acceptable now, revisited only on demonstrated need.

## Alternatives considered

- **Per-repo copies (status quo).** Rejected: duplicated maintenance and a drift surface, which is the problem this ADR exists to remove.
- **`npm publish` + OIDC + a pre-publish version-rewrite step.** Keeps passwordless OIDC by rewriting `workspace:`/`catalog:` to fixed versions before publishing. Deferred, not rejected: revisit if passwordless publishing becomes a hard requirement. It trades token management for rewrite complexity and an extra failure mode.
- **A composite action only.** Rejected: it would centralize the workflow YAML but still shell out to per-repo scripts, leaving the actual logic copied — defeating the purpose.
- **Housing the action inside this monorepo.** Rejected: every `@outfitter/*` repo (including Trails and Skillset) needs to consume it, and embedding it in one product repo creates a circular bootstrap and couples its release cadence to that product. A dedicated repo earns its own SHA-pinned tags and changelog.

## Deferred / open

- Independent (non-lockstep) versioning support.
- OIDC via the version-rewrite path.
- Migrating Trails and Skillset onto the action (a separate effort per repo).
- Whether the Trails discovery + topo-sort logic is reused directly or reimplemented — its implementation module was not locatable during the design survey, only its documented contract. Confirm against the source before building.

## References

- Skillset: `.github/workflows/release.yml`, `scripts/publish.ts`, `scripts/release-policy.ts`, `scripts/changeset-guard.ts`, `docs/package-releases.md`.
- Trails: discovery-based `publish:check` (topo-sort + `bun pm pack` for `catalog:`), per its `AGENTS.md`.
- Platform architecture: [`../architecture/web-platform.md`](../architecture/web-platform.md).
