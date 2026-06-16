---
name: outfitter-writing-style
description: "Outfitter prose craft and terminology. Use when writing or reviewing docs, ADRs, READMEs, release notes, announcements, blog posts, agent prompts, comments, PR descriptions, or issue language for rhythm, clarity, and word choice."
metadata:
  version: "0.1.0"
  author: outfitter
  category: content
---

# Outfitter Writing Style

This skill covers how Outfitter prose should read: sentence rhythm, structural patterns, examples, enthusiasm calibration, and word choice.

For the larger stance, load `outfitter-writing-voice`. For document placement and required sections, load `outfitter-writing-docs`. For the detailed, canonical rules and a full set of before/after samples, load `docs/contributing/language-styleguide.md`.

## Attention Is The Constraint

Every word should respect the reader's time. Prioritize information density over word count. If a sentence does not add value, delete it. Voice is how we say things, not permission to say more. The writing is a recursive implementation of the product philosophy: respect the reader the way the product respects the user.

## Sentence Rhythm: Punch-and-Flow

The voice is engineered for readability. Ideas are atomized for digital consumption. Mix four sentence types.

| Type | Function | Example |
| --- | --- | --- |
| Setup (flow) | Draws the reader in, establishes context | "Recently we've seen agents waste 60,000+ tokens per documentation lookup…" |
| Pivot (hinge) | Connects thought to consequence; colon or dash | "The result: search in 5-50ms, not 5-50 seconds." |
| Punch (impact) | Short, direct; resets attention | "That changed everything." |
| Aside (meta) | Parenthetical; adds intimacy | "…context engineering (more on that later)…" |

The rule: every third or fourth sentence should act as a reset — short, punchy, direct. Uniform paragraph sludge loses readers. If a paragraph has more than one job, split it.

## Status Modulation

Mix high-status authority and low-status trust signals. Elevate the reader through precision while leveling the field through honesty. Never lecture down.

- **High status:** specific metrics ("5-50ms," "6ms warm cache"), correct technical terms (latency, index, cache), concrete examples over hand-waving.
- **Low status:** admitted struggles ("bugs galore"), builder's vulnerability ("first tool I've shipped"), colloquial release valves ("not fully baked yet").

The constraint: do not over-credential. Let precision and comfort with tradeoffs signal competence; do not announce it.

## Enthusiasm Calibration

Earned enthusiasm lands. Manufactured enthusiasm repels.

- Allowed: "I actually laughed out loud when I saw the result." "This is the part that changed everything for me."
- Not allowed: "This is absolutely incredible!" "Game-changing innovation." "We are thrilled to announce."

The test: would you say this to a smart friend over coffee? If it sounds like marketing copy, rewrite it. One well-placed superlative lands; three read as marketing.

## Headers

Headers should help the reader navigate and make a claim. Prefer headers that name the work or take a position:

- `Make It Copy-Paste Runnable`
- `Plain Language Over Jargon`
- `What This Does Not Cover`

Avoid decorative or vague headers:

- `Overview`
- `Background`
- `More Details`
- `Things To Consider`

`Overview` and `Background` are acceptable only when a document template requires them. Even then, make the first sentence do real work.

## Examples Are Primary Evidence

A reader or agent should often understand the rule from the example before reading the prose.

Good examples:

- include imports when imports matter;
- show both definition and use;
- include expected output for commands, including error output;
- are runnable or clearly marked as abridged.

Showing error output proves the error handling works. Avoid examples that hide the important part behind `...`.

For worked good-and-bad samples across openings, rhythm, status, metaphors, and anti-patterns, see `assets/SAMPLES.md`.

## Voice Mechanics

Prefer:

- active voice;
- concrete nouns;
- direct verbs;
- exact file paths, commands, package names, or ADR links when relevant;
- "this means" lists after dense claims;
- "the test:" heuristics when a reviewer needs to apply a rule.

Avoid:

- hedging settled decisions;
- corporate filler;
- marketing superlatives;
- unexplained jargon;
- clever metaphors that require decoding;
- passive voice that hides who acts.

## Plain Language Over Jargon

"Typed errors instead of throwing" lands better than `Result<T, E>` in prose. Save the generics for code blocks. When explaining concepts, use words people actually say. Technical precision matters in code; human clarity matters in explanation. This is not dumbing down — it is choosing the right level of abstraction for the medium.

## Clever Beats Forgettable, Clear Beats Clever

Default to clarity. Clever can be clear when it reinforces the mental model — a breadcrumb tool named "crumbs" makes `crumb drop` memorable. Clever fails when it requires translation — Cold/Warm/Hot stability tiers make readers stop and decode; just say Stable.

The test: does the cleverness help you understand, or make you pause to decode? Reinforce the vibe; do not invent vocabulary.

## The Expedition Layer Is Not A Checklist

Outdoor language belongs when it clarifies or when it is an official product name. It does not belong as decorative prose.

Good:

> Well-supplied teams build better software.

Bad:

> Traverse the codebase wilderness with your trusty CLI companion.

Use plain words unless the themed word carries the concept better, or the thing is literally named that way.

## Banned Words And Substitutes

| Instead of…               | Try…                         |
| ------------------------- | ---------------------------- |
| "game-changing"           | describe the actual change   |
| "seamless"                | "I didn't have to…"          |
| "incredible" / "amazing"  | a concrete fact or benchmark |
| "revolutionary"           | "new capability: …"          |
| "We are excited to share" | start with the value         |
| "best-in-class"           | a specific comparison        |
| "synergy"                 | never                        |

## Replacement Patterns

| Weak phrasing | Stronger phrasing |
| --- | --- |
| "This is a flexible solution for your needs." | "This maps tokens to a Tailwind theme so one design source drives every app." |
| "We are excited to announce a new package." | "`@outfitter/ui` ships presentational React components with `react` as a peer dependency." |
| "It is recommended to add a changeset." | "Add a changeset on the branch that changes the publishable package." |
| "This tool is incredibly fast." | "Queries return in 5-50ms against a local index." |
| "Seamless integration with your workflow." | "Drop it into an existing Bun workspace; no config rewrite required." |
| "A revolutionary approach to errors." | "Typed errors instead of throwing, so callers handle failure explicitly." |

## Review Checklist

When reviewing Outfitter prose:

- Is the first claim clear enough to quote?
- Does each paragraph have one job?
- Is the rhythm varied, with a punch sentence resetting attention?
- Are examples concrete, runnable, and aligned with current source?
- Is enthusiasm earned, not manufactured?
- Are themed terms official names or genuinely clarifying?
- Is jargon explained in plain language, with generics saved for code?
- Does the text avoid the banned words and corporate filler?
- Does it teach the check or heuristic an agent should apply later?
