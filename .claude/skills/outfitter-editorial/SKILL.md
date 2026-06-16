---
name: outfitter-editorial
description: "Complete Outfitter editorial review workflow. Use when reviewing docs, ADRs, READMEs, release notes, announcements, blog posts, agent guidance, or docs-heavy PRs for voice, style, structure, correctness, and readiness."
metadata:
  version: "0.1.0"
  author: outfitter
  category: documentation
---

# Outfitter Editorial

Run a complete editorial review for Outfitter documentation and prose-heavy changes. This is a workflow skill. It should work in Claude, Codex, or any agent harness that can read skills, inspect files, and run commands.

## Load First

Before reviewing, load:

1. `outfitter-writing-voice`
2. `outfitter-writing-style`
3. `outfitter-writing-docs`

The canonical rules behind all three live in `docs/contributing/language-styleguide.md`. If a skill is unavailable, continue only after reading the corresponding `.claude/skills/<name>/SKILL.md` file directly. If a file is missing, report that as part of the review.

## Inputs

The target can be:

- one file;
- a directory;
- a PR diff;
- an ADR draft;
- a release note or changeset;
- a README;
- a blog post or announcement;
- agent guidance;
- a question such as "is this ready to merge?"

If no target is supplied, infer the smallest relevant target from the current conversation or working tree.

## Workflow

### 1. Establish Scope

Identify:

- target files;
- source-of-truth docs, ADRs, or package source;
- current branch and dirty state when working in a repo;
- whether the review is read-only or may edit.

Do not expand beyond the target unless a nearby file must change to keep the docs truthful.

### 2. Classify The Document

Classify each target as one of: README, guide, reference, ADR, release doc, announcement, blog post, agent guidance, or issue/PR prose.

Use that classification to decide what "good" means. A reference page should not sound like a blog post. A blog post can carry full voice. An ADR must state the decision. Match the container.

### 3. Voice Review

Check against `outfitter-writing-voice`:

- Does it state choices clearly without hedging?
- Is it structured for both human and agent readers?
- Are claims evidence-backed?
- Is the tone right for the container?
- Does the expedition theme clarify rather than decorate?
- Does it speak as Outfitter, not about Outfitter?

### 4. Style And Craft Review

Check against `outfitter-writing-style`:

- Is the rhythm varied, with a punch sentence resetting attention?
- Is enthusiasm earned, not manufactured?
- Are the banned words and corporate filler absent?
- Are examples concrete, runnable, and aligned with current source?
- Is jargon explained in plain language, with generics saved for code?
- Are headers claims or directions, not decorative labels?
- Does the opening use one of the four moves and the closing leave a door ajar?

### 5. Structure Review

Check against `outfitter-writing-docs`:

- Does the information live in the right repo location?
- Is there one canonical home?
- Are links, references, and examples current?
- Does the doc include the sections its document type needs?
- Are stability labels literal, not metaphorical?
- Does the change carry its release intent (changeset) when packages move?

### 6. Technical Verification

Work through the verification checklist for the target. For each item, record PASS/FAIL plus evidence.

**Correctness:**

| Check | How to verify |
| --- | --- |
| Code examples run | Extract and execute each example. Report errors verbatim. |
| API signatures match | Compare documented signatures against source. |
| Links resolve | Check each target exists (relative paths, anchors, URLs). |
| Technical claims accurate | Cross-reference against implementation or an authoritative source. |
| Versions current | Verify version numbers against `package.json` and the lockfile. |

**Completeness:**

| Check                        | How to verify                                 |
| ---------------------------- | --------------------------------------------- |
| Required sections present    | Compare against the applicable document type. |
| Parameters documented        | Each has type, purpose, constraints, default. |
| Error scenarios covered      | Document what happens when things go wrong.   |
| Edge cases addressed         | Empty inputs, nulls, boundaries.              |
| Success and failure examples | Show both the happy path and error handling.  |

**Comprehensiveness:**

| Check            | How to verify                                         |
| ---------------- | ----------------------------------------------------- |
| Common use cases | List 3-5 typical scenarios; verify each is addressed. |
| Migration paths  | Breaking changes include upgrade instructions.        |
| Cross-references | Related docs linked where helpful.                    |
| Agent-friendly   | Clear headers and examples for AI consumption.        |
| Troubleshooting  | Common issues and solutions documented.               |

Useful repo checks:

```bash
bun run check
bun run build
git diff --check
```

Do not run broad checks just for ceremony. Choose the checks that prove the target. For claims about code behavior, inspect source or run targeted tests. For claims about CLI output, run the command or state that it was not verified.

### 7. Findings

Report findings by severity:

- **P0:** materially false, unsafe, or blocks release correctness.
- **P1:** likely to mislead users or agents into wrong behavior.
- **P2:** voice, style, structure, or missing-doc gap that will cause drift.
- **P3:** polish, clarity, minor duplication, or optional tightening.

Lead with P0-P2 findings. Include file paths and line numbers when possible. Keep P3s selective.

### 8. Fix Loop

If edits are allowed:

1. Fix P0-P2 issues.
2. Fix relevant P3 issues when they are nearby and low-risk.
3. Re-run targeted verification.
4. Repeat until the target is ready or blocked.

If edits are not allowed, produce a concise review with exact recommended changes.

### 9. Outcome

End with one of: `ready`, `ready with nits`, `needs fixes`, `blocked`, or `wrong target`.

Include files reviewed, files changed (if any), checks run and results, unresolved risks, and the exact next action.

## Goal Invocation Shape

For a larger editorial pass, use this generic goal shape:

```markdown
Goal: Bring [target docs/change/PR] to Outfitter editorial readiness.

Done when:

- P0-P2 voice, style, structure, and correctness issues are fixed or explicitly deferred with rationale.
- Relevant P3s are handled when they improve clarity without expanding scope.
- Required docs, skills, release notes, ADRs, and changesets are updated or marked not applicable.
- Verification commands pass or failures are explained with evidence.
- The final report lists changed files, checks, remaining risks, and the exact next action.

Constraints:

- Follow `outfitter-writing-voice`, `outfitter-writing-style`, and `outfitter-writing-docs`.
- Keep changes scoped to the target and necessary nearby truth.
- Do not rewrite stable doctrine without an ADR or explicit approval.
```

## Report Template

```markdown
State: ready | ready with nits | needs fixes | blocked | wrong target

Reviewed:

- path
- path

Findings:

- [P2] path:line - Issue and recommended fix.

Changed:

- path - Summary.

Verification:

- command - pass/fail/not run, with reason.

Remaining:

- Risk, decision, or follow-up.

Next:

- Exact next action.
```
