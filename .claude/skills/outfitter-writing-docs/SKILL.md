---
name: outfitter-writing-docs
description: "Outfitter documentation structure and maintenance guidance. Use when creating or reorganizing Outfitter docs, READMEs, ADRs, guides, API and CLI reference, release notes, or agent-facing documentation."
metadata:
  version: "0.1.0"
  author: outfitter
  category: documentation
---

# Outfitter Writing Docs

This skill covers what an Outfitter document should include and where it should live in the monorepo. It reflects the current repository shape.

For voice and stance, load `outfitter-writing-voice`. For prose craft and word choice, load `outfitter-writing-style`. For the canonical rules behind all three, load `docs/contributing/language-styleguide.md`.

## Documentation Hierarchy

Documentation is prioritized in this order, closest-to-code first:

1. **Types and schemas** carry intent in the code itself.
2. **Inline comments** (TSDoc/JSDoc) explain non-obvious decisions.
3. **Examples** prove and teach the happy path.
4. **Tests and lint rules** prevent drift.
5. **`docs/`** holds broader architectural and reference material.
6. **Release notes and changesets** carry migration and publication intent.

All levels matter. Types express intent through code, comments explain why, docs provide context, and changesets carry the release story. Feature work is not done until the affected layer is updated or explicitly marked not applicable.

## Current Repo Map

Use the current structure unless an ADR says otherwise:

| Location | Use for |
| --- | --- |
| `README.md` | Project entry point, layout, quick start, links to docs. |
| `docs/` | Public and contributor-facing documentation. |
| `docs/contributing/` | Contributor guidance: language styleguide, code standards, workflow. |
| `docs/architecture/` | System design notes (web platform, package tiers, diagrams). |
| `docs/adr/` | Architecture Decision Records and the ADR index. |
| `apps/*/` | App-local docs that ship with the app (e.g. the Fumadocs site). |
| `packages/*/README.md` | Per-package usage and API surface. |
| `.changeset/` | Branch-local release intent for publishable `@outfitter/*` packages. |
| `.claude/skills/` | Repo-local skills for contributors and agents. |

When in doubt, update the nearest existing document instead of creating a new one. Avoid duplicating content across locations — link instead of copy.

## Source Of Truth

Each type of documentation has one canonical home:

- API reference is generated from code or lives in the package README / `docs/`.
- CLI reference lives near the command or is generated from help text.
- Architecture decisions live in `docs/adr/`.
- Architecture notes live in `docs/architecture/`.

## Document Types

### README

READMEs are the entry point. Keep them focused and scannable.

Keep:

- the first usable path near the top;
- copy-pasteable examples;
- explanation after the quick path;
- links to deeper docs instead of duplicating them.

Length: target 150-250 lines, 400 maximum (extract to `docs/` beyond that), 50 minimum (description, install, usage). Lead with "Quick Start" for libraries and tools, "Why X?" for frameworks and platforms, and "Usage" for internal tools.

Avoid long architecture essays, stale command lists, and repeating docs that already have a canonical page.

### Guide

Use a guide when the reader needs to apply a concept.

Include:

- the reader's starting point;
- the minimal working example;
- the common wrong shape;
- runtime or integration implications;
- verification commands;
- links to reference and ADRs.

### Reference

Use reference docs for exact lookup. Include API names and signatures, option tables, input and output shapes, defaults, and error behavior. Keep reference pages dense and predictable. Do not turn them into essays.

### ADR

Use an ADR when reversing the decision would materially change Outfitter — the web platform, the package tiering, the release tooling, or org-wide conventions. State the context and tension, the decision, the consequences, and the alternatives considered. Add the entry to the `docs/adr/README.md` index.

### Release Doc And Changeset

Use release notes and changesets when existing users or release operators need a path. Include what changed, why it matters, exact commands, any migration or bridge steps, and known non-support. Every PR that changes publishable `@outfitter/*` package contents needs branch-local release intent — a `.changeset/*.md` entry for the affected package.

### Agent Guidance

Use agent guidance when future agents need to preserve a behavior. Include when to use it, source-of-truth files, stop conditions, exact commands, known stale paths or noise, and what not to mutate.

## Stability Tier Labels

When documenting packages or components with different maturity, use literal labels:

| Label      | Meaning                                | Guidance          |
| ---------- | -------------------------------------- | ----------------- |
| **Stable** | APIs locked, breaking changes rare     | Safe to depend on |
| **Active** | APIs evolving based on usage           | Watch for updates |
| **Early**  | APIs will change, not production-ready | Use with caution  |

Avoid metaphorical labels (Cold/Warm/Hot). Literal labels require no interpretation.

## Code Examples

Every code example should be either runnable or clearly marked as abridged.

Examples should:

- include all necessary imports;
- show both definition and use;
- show expected output for CLI examples, including error output;
- use current package names;
- prefer realistic domain examples over generic "Hello, World!" placeholders.

Make Quick Start examples copy-paste runnable. Use heredoc format when showing file creation, and demonstrate both success and failure output — showing error output proves the error handling works. End a Quick Start with a confident one-liner rather than an empty summary.

## Heading Hierarchy

- H1 (`#`): document title only.
- H2 (`##`): major sections.
- H3 (`###`): subsections.
- H4 (`####`): specific topics within subsections.

Avoid deeper nesting than H4. Headers should make a claim or give direction, not act as decorative labels.

## Maintenance Checks

Before considering docs done:

- Run the repo's docs and format checks (`bun run check`, markdownlint) when available.
- Verify links and anchors touched by the change.
- Search for stale duplicates when moving or renaming concepts.
- Update repo-local skills if agents need the new guidance.
- Add a changeset when publishable package behavior or public API changes.
- Delete obsolete content rather than marking it deprecated.
- Note "not applicable" when reviewers would reasonably expect docs but none are needed.

## House Convention: Markdown At Paragraph Granularity

Author Markdown at paragraph granularity — one line per paragraph or bullet, with no hard wrapping at a fixed column. This applies to docs, ADRs, READMEs, changesets, and PR bodies. The markdownlint config disables line-length checks (MD013) for this reason.

## Review Checklist

When creating or reviewing Outfitter docs:

- Is there one canonical home for this information?
- Is the audience clear?
- Does the document teach use, lookup, decision, release operation, or agent workflow?
- Are examples current, runnable, and using current package names?
- Are links and commands verified?
- Are stability labels literal, not metaphorical?
- Does the change carry its release intent (changeset) when packages move?
- Would a future agent know where to update this next time?
