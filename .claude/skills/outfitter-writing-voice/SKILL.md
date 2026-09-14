---
name: outfitter-writing-voice
description: "Outfitter writing voice and values. Use when drafting or reviewing Outfitter docs, ADRs, READMEs, release notes, announcements, blog posts, agent guidance, or PR and issue language for stance, audience, and tone."
metadata:
  version: "0.1.0"
  author: outfitter
  category: content
---

# Outfitter Writing Voice

Outfitter writes like it means it.

We are unapologetically opinionated — not because we think we are always right, but because wishy-washy tools make for wishy-washy software. If we have made a choice, we tell you why and stand behind it. The voice should feel like a fellow builder who found a useful path, not a guru handing down wisdom from a mountaintop.

For the detailed, canonical rules, load `docs/contributing/language-styleguide.md`. This skill is the entry point for stance, audience, and tone. For prose craft and terminology, load `outfitter-writing-style`. For doc structure and placement, load `outfitter-writing-docs`.

## Core Stance

| Principle | In practice |
| --- | --- |
| Opinionated | State choices clearly. Explain why. Do not hedge. |
| Builder on the trail | Write as a fellow traveler who found a path, not an authority dispensing rules. |
| Agent-first | Structure for machines and humans at once. Runnable examples. Typed, explicit errors. |
| Goal-serving | Match voice to container. Quick starts are quick. |
| Clear over clever | Personality that reinforces understanding, never obscures it. |
| Plain language | Save generics for code. Use words people actually say. |
| Earned confidence | Claims backed by examples, benchmarks, tests, and CLI output. |
| Ownership stance | First-person "we" when speaking as the project. |

## Audience

Write for two readers at once:

- **Humans** deciding whether the tool helps them, or trying to use it correctly.
- **Agents** navigating the repo, learning from examples, and handling errors.

Agents are first-class consumers, not an afterthought or a marketing angle. When we write, we are writing for Claude as much as for a person. This does not mean writing more. It means writing with structure:

- clear headings and predictable sections;
- copy-paste runnable examples;
- explicit errors and edge cases;
- exact commands when commands are the point;
- links to the canonical source instead of repeated doctrine.

## The Two Stances

Two stances sit underneath everything Outfitter publishes.

**The builder on the trail.** You are a fellow traveler sharing a useful path, not an authority. Problems are design challenges, not insurmountable obstacles. Optimism is structural but grounded in what actually works. We never tear something down without offering a better alternative.

**The product person who ships.** Outfitter lives at the intersection of product thinking and engineering craft. We respect engineering enough to use specific metrics. We care about durable software, not code elegance for its own sake. We are builders empowered by new tools, learning in public — not claiming expert status.

## Voice And Tone

Voice is always present:

- **Curious practitioner.** Excited to share what you discovered, honest about rough edges.
- **Builder's mindset.** Present even when learning in public.
- **Respectful of time.** The reader's attention is the constraint.
- **Sincere, not self-important.** Enthusiasm without grandstanding.
- **Concrete over abstract.** Specifics carry the weight.

Tone adjusts per container:

| Container | Tone |
| --- | --- |
| README / Quick Start | Fast, concrete, copy-pasteable. |
| Blog post | Full voice. Narrative, personality, earned enthusiasm. |
| Announcement | Lead with value, not company news. Specifics over superlatives. |
| Technical docs | Voice recedes; clarity leads. |
| API reference | Precision over personality. Just the facts. |
| ADR | Declarative and reasoned. Tension, then decision, then consequences. |
| Release note | Operator-focused. What changed, why it matters, what to do. |
| Agent guidance | Direct. Rules, stop conditions, verification. |
| PR / issue prose | Lead with the decision or the ask. Why a reviewer should care. |

Prefer:

> `@outfitter/config` maps design tokens to a Tailwind theme so one source drives every app.

Avoid:

> Outfitter aims to provide a flexible and potentially powerful way to share styling across projects.

## Serve The Goal

Voice is how we say things, not permission to say more. If someone needs a code example, give them the code example. If they need a quick answer, give the quick answer. Do not make people scroll past a backstory to reach the recipe. The goal of the content determines its shape — match the container.

## The Expedition Layer

Outfitter carries an outdoor and exploration aesthetic. It is a brand aesthetic, not a prose checklist.

Use expedition language literally when it is part of the product — a command, package, feature, or heading that is actually named that way. Otherwise treat it as background texture: present when useful, invisible when forced.

- If the thing is literally named `scout`, write `scout`.
- If it is not, say "research" unless the metaphor genuinely improves understanding.
- Skip the theme in technical specs, error messages, and API reference.

The test:

> Would a thoughtful reader roll their eyes?

If yes, drop the metaphor and say it straight.

## Earned Confidence

Outfitter prose can be strongly worded when the claim is backed by proof. We care how things feel, but we do not trust feelings alone.

Good sources of proof:

- runnable examples;
- benchmarks and concrete metrics;
- tests and lint rules;
- type signatures;
- CLI output, including error output.

Weak sources:

- vibes;
- future promises;
- "should be easy";
- claims about other tools without citation.

If we claim something is simple, there is a working example. If we claim something is fast, there is a benchmark.

## Ownership

Use "we" when speaking as the project, and the possessive when it fits: "Outfitter's shared infrastructure," not "shared infrastructure for Outfitter." Speak as Outfitter, not about Outfitter. Use direct imperatives when giving instructions.

Prefer:

> Add a changeset on the branch that changes the publishable package.

Avoid:

> It is recommended that a changeset should be considered.

## Review Checklist

When reviewing an Outfitter document for voice:

- Does it state the decision or instruction without hedging?
- Is it structured for both human and agent readers?
- Does the voice match the container's job?
- Would any cleverness make a reader pause to decode?
- Are concepts explained in plain language, with generics saved for code?
- Are claims backed by example, benchmark, test, or CLI output?
- Does it speak as Outfitter, not about Outfitter?
- Does it avoid marketing language and manufactured enthusiasm?
- Does it make the next correct action clearer?
