# Outfitter Language Styleguide

This guide defines how Outfitter writes across docs, ADRs, READMEs, release notes, announcements, blog posts, agent guidance, and PR and issue language. It is the canonical source for how Outfitter prose should sound. The writing skills under `.claude/skills/outfitter-*` are entry points; this document holds the detailed rules.

Outfitter writes like it means it. We are unapologetically opinionated — not because we think we are always right, but because wishy-washy tools make for wishy-washy software. If we have made a choice, we tell you why and stand behind it. The voice should feel like a fellow builder who found a useful path and is sharing it, not a guru dispensing wisdom from a mountaintop.

## Core Stance

Two stances run underneath everything Outfitter publishes.

**The builder on the trail.** You are a fellow traveler who found a useful path, not an authority handing down rules. Problems are design challenges, not insurmountable obstacles. Optimism is structural, but grounded in what actually works. We never tear something down without offering a better alternative, and we focus on utility and durability over hype.

**The product person who ships.** Outfitter lives at the intersection of product thinking and engineering craft. We respect engineering enough to use specific metrics, because craft matters. We care about durable software, not code elegance for its own sake. We are not claiming expert status — we are builders empowered by new tools, learning in public.

These two stances set the altitude. The rest of this guide is how to keep prose at that altitude sentence by sentence.

## Two Readers At Once

Write for humans and agents at the same time. Agents are first-class consumers of everything we make, not an afterthought or a marketing angle. When we write, we are writing for Claude as much as for a person.

This shapes structure, not just tone:

- Structure for machine readability, not only human skimming: clear headings, predictable sections, explicit lists.
- Make examples copy-paste runnable, because that is how agents learn.
- State errors and edge cases explicitly, because agents need to handle them too.
- Codify rules where they matter. An opinion without teeth is a suggestion; if a rule matters, lint for it, test for it, fail builds over it.

## Attention Is The Constraint

Every word should respect the reader's time. Prioritize information density over word count. If a sentence does not add value, delete it. Voice is how we say things, not permission to say more. If someone needs a code example, give them the code example. Do not make people scroll past a backstory to reach the recipe.

The writing is a recursive implementation of the product philosophy: respect the reader the way the product respects the user.

## Voice vs. Tone

**Voice is always present:**

- Curious practitioner.
- Builder's mindset, even when learning.
- Respectful of the reader's intelligence and time.
- Sincere enthusiasm without self-importance.
- Concrete specificity over abstraction.

**Tone adjusts per container:**

- Playful when introducing tools.
- Precise when documenting.
- Earnest when mission-driven.
- Technical without gatekeeping.

The key tension: we care deeply about craft and ideas, and we refuse to be precious about it.

## The Expedition Layer

Outfitter carries an outdoor and exploration aesthetic. It is a brand aesthetic, not a prose checklist. It should shape the feel of names, structure, and examples without turning every paragraph into metaphor.

Use expedition language literally when it is part of the product — a command, package, feature, or docs heading that is actually named that way. Otherwise treat it as background texture: present when useful, invisible when forced.

| Layer | How to apply it |
| --- | --- |
| Product terminology (literal) | Use exact expedition terms when they are official names: commands, packages, features, headings. |
| Thematic vibe (atmospheric) | Let the outdoors and exploration feel shape framing and identity, but default to direct language in body copy. |
| Product decisions (examples) | Expedition concepts can guide naming systems, information architecture, or onboarding journeys when they improve clarity. |

The practical distinction:

- If the thing is literally named `scout`, write `scout`.
- If the thing is not named `scout`, say "research" unless the metaphor genuinely improves understanding.
- Prefer clarity first. Theme is a multiplier, not the main payload.

Skip the theme entirely in technical specifications (just be precise), error messages (just be clear), and API reference (just be accurate).

The test: would a thoughtful reader roll their eyes? If yes, drop the metaphor and say it straight.

## Clear Beats Clever, But Personality Matters

Default to clarity. When established conventions exist, follow them. But clever can be clear when it reinforces the mental model.

Clever that works reinforces the vibe:

- A breadcrumb tool called "crumbs" makes `crumb drop` memorable. `crumb new` is functional but forgettable.
- Names like Ranger, Firewatch, or Waymark evoke what they do.
- "Done. You're building type-safe infrastructure." is confident and memorable.

Clever that fails requires translation:

- Cold/Warm/Hot for stability tiers makes readers stop and decode. Just say Stable.
- Jargon that sounds smart but means nothing to a newcomer.

The test: does the cleverness help you understand, or make you pause to decode? Reinforce the vibe; do not invent vocabulary.

## Plain Language Over Jargon

"Typed errors instead of throwing" lands better than `Result<T, E>` in prose. Save the generics for code blocks. When explaining concepts, use words people actually say. Technical precision matters in code; human clarity matters in explanation. This is not dumbing down — it is choosing the right level of abstraction for the medium.

## Earned Confidence

We care how things feel, but we do not trust feelings alone. If we claim something is simple, there is a working example. If we claim something is fast, there is a benchmark. Earned confidence, not asserted confidence.

Good sources of proof:

- Runnable examples.
- Benchmarks and concrete metrics.
- Tests and lint rules.
- Type signatures.
- CLI output, including error output.

Weak sources:

- Vibes.
- Future promises.
- "Should be easy."
- Claims about other tools without citation.

## Sentence Rhythm: Punch-and-Flow

The voice is engineered for readability. Ideas are atomized for digital consumption. Mix four sentence types.

| Type | Function | Example |
| --- | --- | --- |
| Setup (flow) | Draws the reader in, establishes context | "Recently we've seen agents waste 60,000+ tokens per documentation lookup…" |
| Pivot (hinge) | Connects thought to consequence; uses a colon or dash | "The result: search in 5-50ms, not 5-50 seconds." |
| Punch (impact) | Short, direct; resets attention | "That changed everything." |
| Aside (meta) | Parenthetical; adds intimacy | "…context engineering (more on that later)…" |

The rule: every third or fourth sentence should act as a reset — short, punchy, direct. Uniform paragraph sludge loses readers. If a paragraph has more than one job, split it.

## Status Modulation

Mix high-status authority and low-status trust signals strategically. Elevate the reader through precision while leveling the field through honesty. Never lecture down. Position as a peer figuring it out alongside them.

**High status (establish credibility):**

- Specific metrics: "5-50ms," "6ms warm cache," "100k tokens saved."
- Technical precision: terms like latency, index, and cache used correctly.
- Concrete examples over hand-waving.

**Low status (build connection):**

- Admitted struggles: "bugs galore," "countless hours lost."
- Builder's vulnerability: "first tool I've shipped despite five startups."
- Colloquial release valves: "not fully baked yet," "I actually laughed out loud."

The constraint: do not over-credential. Let precision and comfort with tradeoffs signal competence; do not announce it.

## Enthusiasm Calibration

Earned enthusiasm lands. Manufactured enthusiasm repels.

Allowed:

- "I actually laughed out loud when I saw the result."
- "This is the part that changed everything for me."
- "Trust me — this is worth the setup."

Not allowed:

- "This is absolutely incredible!"
- "Game-changing innovation."
- "We are thrilled to announce."

The test: would you say this to a smart friend over coffee? If it sounds like marketing copy, rewrite it. One well-placed superlative lands; three read as marketing.

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

## Opening Moves

Pick exactly one:

- **Scene → tension:** start grounded, then reveal the problem.
- **Vulnerability hook:** admit the struggle that led to the discovery.
- **Punchy declaration → why it matters:** a clean statement, then human context.
- **Problem framing:** state what is broken before offering the fix.

## Closing Moves

Pick exactly one:

- **Invitation:** "If you're building with agents, give it a shot."
- **What's next:** "We're still figuring out X, but here's where we're headed."
- **Practical nudge:** "Start with the simplest case and expand from there."
- **Door left ajar:** end with a question or possibility, not a summary.

Not allowed: an empty summary of what was just said, "In conclusion…," or a marketing call to action.

## Structural Signatures

- **Headers as mini-theses:** not decorative. Each header should be a claim or a direction, not a label like "Overview" or "Background."
- **Signposting that moves:** "But first…," "Here's the thing…," "So where does that leave us?"
- **Parenthetical texture:** caveats, humanity, small admissions.
- **Context jumps:** a quick explanation for an unfamiliar term, then back to momentum.
- **Bold used sparingly:** for the single emphasis that matters.

## Content Modes

The goal of the content determines its shape. Match the container.

| Container | What the voice does |
| --- | --- |
| README / agent guidance | Expedition metaphors welcome where they clarify. Orient and prepare. Quick Start gets to code fast; context comes after. |
| Blog post | Full voice DNA. Narrative arc of problem → journey → discovery → reflection. Vulnerability and precision blend. Room to breathe. |
| Announcement | Lead with value, not company news. "Here's what you can do now" over "We built X." Specifics over superlatives. |
| Technical docs | Voice recedes; clarity leads. Skip expedition metaphors. Precision and completeness matter most. |
| API reference | Precision over personality. Just the facts. Examples are copy-paste runnable. |
| ADR | Declarative and reasoned. State the tension, then the decision, then the consequences. |
| Release note | Operator-focused. What changed, why it matters, what to do, and any migration path. |
| PR / issue prose | Direct. Lead with the decision or the ask. State what changed and why a reviewer or future agent should care. |

## Ownership

Outfitter takes ownership. Use first-person "we" when speaking as the project, and the possessive when it fits: "Outfitter's shared infrastructure," not "shared infrastructure for Outfitter." Speak as Outfitter, not about Outfitter. Use direct imperatives when giving instructions.

Prefer:

> Add a changeset on the branch that changes the publishable package.

Avoid:

> It is recommended that a changeset should be considered.

## Anti-Patterns

**Voice violations:**

- Corporate-speak or press-release gloss.
- Excessive hedging or qualification.
- Lecturing or talking down.
- Manufactured enthusiasm.
- Vague abstractions without examples.

**Structural violations:**

- Burying the lede.
- Walls of text without signposts.
- Over-formatting, with headers used as decoration.
- Ending with a thud instead of a door.

**Model-specific anti-patterns:**

- Over-signposting, the "Now…" spam.
- Generic tech-blogger voice.
- Preamble before getting to the point.
- Empty concluding summaries.

## Before And After

Worked examples carry the rules faster than prose. Read these, then apply the same moves to your own draft.

### Opening: vulnerability hook

> "I've co-founded five startups, raised $60M+, and shipped products to millions of users. But the engineering? Always in someone else's hands."

High status lands immediately, then pivots to vulnerability, creating tension the rest of the piece resolves. The reader thinks, "If this person couldn't do it, maybe I'm not alone."

### Opening: problem framing

> "Bugs galore, code that was unmaintainable, and countless hours lost to ill-fated ideas."

It admits failure before claiming success, and it is specific enough to be credible. It sets up the solution without overselling.

### Punch-and-flow in action

> "Recently we've seen agents waste 60,000+ tokens per documentation lookup. That's not a rounding error — that's the whole context window. BLZ returns results in 5-50ms."

Setup, then pivot ("That's not a rounding error —"), then punch ("that's the whole context window"), then resolution. Each sentence has one job.

### Earned enthusiasm

> "I actually laughed out loud when I saw the result: 6 milliseconds."

A personal reaction, not a marketing claim. The specific number carries the weight, and the reader can imagine the moment.

### High status: technical precision

> "Uses Tantivy for full-text indexing. Think `ripgrep`, purpose-built for documentation."

It names the actual technology for credibility, then gives an accessible analogy for those who do not know it. "Purpose-built" signals intentional design, not a hack.

### Low status: builder's vulnerability

> "This is my first shipped tool. Despite founding five startups, I'd never written production code that others actually use. Agents changed that."

Vulnerability wrapped in credibility. "Agents changed that" points forward without hype, and the reader understands the stakes were personal.

### Technical without gatekeeping

> "Context engineering — delivering the right data, at the right time, in the right shape."

It introduces the jargon, then immediately defines it in plain terms. The three-part structure is memorable.

### Expedition metaphor: earned

> "Well-supplied teams build better software."

A natural extension of the Outfitter name. It makes a real claim — supplies lead to outcomes — and it does not force the metaphor. It would survive if you stripped the theme.

### Expedition metaphor: forced, then fixed

> Forced: "Traverse the codebase wilderness with your trusty CLI companion!"
>
> Fixed: "Navigate the codebase with a CLI that knows where to look."

"Traverse" tries too hard, "wilderness" overstates the drama, and "trusty companion" is cutesy. The fix keeps "navigate" (natural), drops the drama, and focuses on utility.

### Generic tech blogger, then fixed

> Generic: "In today's fast-paced development landscape, documentation has become increasingly important. That's why we built BLZ — a revolutionary tool that will transform how you work with docs."
>
> Fixed: "Agents burn through context windows searching docs. BLZ indexes them locally and returns results in milliseconds."

"Fast-paced development landscape" is filler, "increasingly important" says nothing, "revolutionary" is unearned, and "transform how you work" is a vague promise. The fix states the problem concretely and the solution concretely, with no wasted words.

### The coffee test

Read any sentence aloud. Would you actually say this to a smart friend explaining what you built?

> Fails: "We are thrilled to announce the launch of our innovative documentation solution."
>
> Passes: "I built a thing that searches docs in 6 milliseconds. Want to try it?"

## Replacement Patterns

| Weak phrasing | Stronger phrasing |
| --- | --- |
| "This is a flexible solution for your needs." | "This maps tokens to a Tailwind theme so one design source drives every app." |
| "We are excited to announce a new package." | "`@outfitter/ui` ships presentational React components with `react` as a peer dependency." |
| "It is recommended to add a changeset." | "Add a changeset on the branch that changes the publishable package." |
| "This tool is incredibly fast." | "Queries return in 5-50ms against a local index." |
| "Seamless integration with your workflow." | "Drop it into an existing Bun workspace; no config rewrite required." |
| "A revolutionary approach to errors." | "Typed errors instead of throwing, so callers handle failure explicitly." |

## The Litmus Test

Before publishing, ask:

1. Would you say this to a smart friend over coffee?
2. Is there a concrete example within two paragraphs of any claim?
3. Does the ending open a door or close with a thud?
4. Would a reader roll their eyes at any metaphor?
5. Is enthusiasm earned or manufactured?

If any answer is wrong, revise.

## Review Checklist

When tightening docs, ADRs, READMEs, release notes, announcements, or agent prompts, check:

- Does it state choices clearly without hedging?
- Is it structured for both human and agent readers?
- Does the voice match the container?
- Would any cleverness make a reader pause to decode?
- Are concepts explained in plain language, with generics saved for code?
- Are claims backed by examples, benchmarks, tests, or CLI output?
- Does every header make a claim or give direction rather than label?
- Is the rhythm varied, with a punch sentence resetting attention?
- Does it speak as Outfitter, not about Outfitter?
- Does it avoid the banned words and the manufactured-enthusiasm tells?
