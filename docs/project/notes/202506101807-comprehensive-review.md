# Comprehensive Repository Review

_Reviewer: **Max, The Principled Engineer**_

## Table of Contents

1. Overview
2. Monorepo Architecture & Tooling
3. Package-by-Package Findings
   1. @outfitter/contracts
   2. @outfitter/packlist
   3. @outfitter/husky-config
   4. @outfitter/eslint-config
   5. @outfitter/typescript-config
   6. @outfitter/cli
   7. @outfitter/fieldguides (docs)
4. Cross-Cutting Quality Concerns
5. Documentation & Governance
6. Recommended Action Plan (10-step)

---

## 1 Overview

> Goal: Harden the monorepo so a **greenfield app** can be bootstrapped from scratch with production-grade linting, testing, security and release automation — _"rock-solid out of the box."_

Severity legend

| Icon | Meaning                        |
| :--: | ------------------------------ |
|  🔴  | Must fix (Blocker)             |
|  🟡  | Should fix (High-value)        |
|  🟢  | Forward-looking (Nice-to-have) |
|  🔵  | Nitpick (Polish)               |

---

## 2 Monorepo Architecture & Tooling

### 🔴 CI / CD Missing

- **Problem** – No GitHub Actions.
- **Fix** – Add `.github/workflows/ci.yml` running `pnpm run ci` on matrix `{ node: [20, 22], os: ubuntu-latest }`.
- **Code Sketch**
  ```yaml
  name: CI
  on: [push, pull_request]
  jobs:
    build:
      runs-on: ${{ matrix.os }}
      strategy:
        matrix:
          node: [20, 22]
          os: [ubuntu-latest]
      steps:
        - uses: actions/checkout@v4
        - uses: pnpm/action-setup@v3
          with: { version: 10 }
        - run: pnpm install --frozen-lockfile
        - run: pnpm run ci
  ```

### 🔴 Duplicate Source Files

`init.ts` vs `init-refactored.ts` inside `packlist`. Keep **one**; RFC/ADR required.

### 🟡 Release Automation

Wire Changesets into CI → `publish.yml` gating on successful build.

### 🟡 Security Posture

Wrap all `execa` calls with allow-lists & argument escaping; add `npm audit --audit-level=high` in CI.

### 🟡 TypeScript Strictness

`allowJs` is `true` in root `tsconfig.json`. Tighten to `false`; move legacy JS elsewhere.

### 🟢 Project Meta & DX

Add `CODEOWNERS`, contribution templates, `.devcontainer`.

### 🟢 Related Analysis

See **docs/project/handoffs/202506101749-monorepo-build-system-analysis.md** for a deep dive into TypeScript project-reference problems and build-system modernization options (Paths A–E). Decisions here **must** align with whichever path (A or B) is selected and formalized in an upcoming ADR-0004.

---

## 3 Package-by-Package Findings

### 3.1 @outfitter/contracts

🟡 _Error Taxonomy_ – introduce `enum ErrorCode` + enrich `OutfitterError`.

🟡 _Result Helpers_ – add `map`, `mapErr`, `unwrapOr` utilities.

🟢 _Benchmarks_ – use `vitest bench`.

```typescript
// future result helpers
export function map<A, B, E>(r: Result<A, E>, fn: (a: A) => B): Result<B, E> {
  return r.success ? success(fn(r.data)) : r;
}
```

### 3.2 @outfitter/packlist

🔴 _Side-effectful install_ – `execa(packageManager, ['add', …])` w/o `--exact`. Pin versions.

🟡 _Idempotency_ – detect if deps already satisfy required semver.

🟡 _Tests Needed_ – use `memfs` to assert file creation.

### 3.3 @outfitter/husky-config

🟡 _Sync IO_ – replace `execSync`, `copyFileSync` with async. Wrap errors.

🔵 _Cross-OS paths_ – rely on `husky add` to avoid CRLF mishaps.

### 3.4 @outfitter/eslint-config

🟡 _Dual Configs_ – Deprecate legacy export, publish v2 major.

🟢 _Plugin Coverage_ – Add `eslint-plugin-security`, `sonarjs`.

### 3.5 @outfitter/typescript-config

🟢 _Path Aliases_ – expose `@/*` helper.

🔵 _Composite Flag_ – enable for project references.

### 3.6 @outfitter/cli

🟡 _Package-manager Detection_ – DRY with Packlist helper.

🟡 _Unhandled Rejection_ – attach global listener → `process.exit(1)`.

### 3.7 @outfitter/fieldguides (docs)

🟢 _Website_ – Publish via Docusaurus for better UX.

---

## 4 Cross-Cutting Quality Concerns

| Severity | Concern                           | Recommendation                                                       |
| -------- | --------------------------------- | -------------------------------------------------------------------- |
| 🔴       | **Testing Coverage** (≈ <20 %)    | Target 80 % lines; fail CI below threshold using `vitest --coverage` |
| 🔴       | **Version Drift** – TS 5.3 vs 5.8 | `pnpm up -r typescript@latest` and pin across packages               |
| 🟡       | **Semantic Versioning**           | Declare `peerDependencies` on ESLint, TS, Vitest, Husky              |
| 🟢       | **Security Scanning**             | Integrate OSSF Scorecard / Snyk                                      |
| 🟢       | **CLI Performance**               | Bundle with `ncc`, aim cold-start < 100 ms                           |

---

## 5 Documentation & Governance

- 🟡 ADR cadence — store decisions like _"Why pnpm?"_
- 🟡 Versioned docs — docs should track major versions.
- 🟢 Roadmap — publish to attract contributors.

Example ADR header:

```text
# ADR-0003: Adopt ESLint flat config
Date: 2025-06-10
Status: Proposed
Context: …
Decision: …
Consequences: …
```

---

## 6 Recommended 10-Step Action Plan

1. **Bootstrap CI** (lint, type-check, test, coverage).
2. **Consolidate Packlist code**, remove duplicate file, add unit tests.
3. **Harden CLI inputs** (validation & escaping).
4. **Unify TS & dependency versions**.
5. **Publish ADRs** for ESLint migration, TS strictness roadmap.
6. **Add Changesets publish workflow** gated on CI green.
7. **Expand tests** across husky-config & cli packages.
8. **Ship governance files** (CODEOWNERS, CONTRIBUTING.md, templates).
9. **Tighten ESLint rules** to strict once build passes.
10. **Launch Docusaurus site** for Fieldguides.

4b. **Select Build-System Path (A: Fix project refs | B: Split multi-entry packages)** and record as **ADR-0004** (include option matrix & trade-offs).

---

> _"Correctness, clarity, performance—in that order."_ — Max
