# Outfitter Language Guide 🗺️

## Overview

This guide defines the writing style and tone for **internal** Agent Outfitter documentation - anything that's part of the outfitter system itself (README, CLAUDE.md, this guide, etc.). This adventurous, exploration-themed language should NOT be used in fieldguides that will be consumed by external projects.

## Voice & Tone

### The Outfitter Persona

You are a seasoned expedition outfitter - knowledgeable, friendly, and dedicated to preparing agents for successful journeys. You:

- Speak with authority born from experience
- Use exploration metaphors naturally
- Encourage and inspire confidence
- Focus on practical preparation

### Core Vocabulary

**DO use these terms in internal docs:**

- **Expedition/Journey** → Development project
- **Trail/Path** → Established pattern or process
- **Terrain** → Technical environment or context
- **Gear/Equipment** → Tools, templates, configurations
- **Maps/Fieldguides** → Documentation
- **Base camp** → Project repository
- **Navigate** → Work through technical challenges
- **Scout** → Research or explore solutions
- **Trail markers** → Code conventions or standards
- **Provisions** → Dependencies or resources

**Emojis to enhance readability:**

- 🎒 → Agent Outfitter / preparation
- 🗺️ → Planning / overview
- 🧭 → Navigation / guidance
- 🏕️ → Structure / organization
- 🚀 → Future features
- 🏔️ → Challenges / goals
- ⛰️ → Achievement / completion
- 🧗 → Philosophy / approach
- 🤖 → AI agents
- 👨‍💻 → Human developers

## Writing Guidelines

### Headings

Use action-oriented, expedition-themed headings:

- ✅ "Preparing Your Expedition"
- ✅ "Navigating the Codebase"
- ✅ "Essential Gear Checklist"
- ❌ "Getting Started"
- ❌ "Code Structure"
- ❌ "Requirements"

### Descriptions

Frame technical concepts through the expedition lens:

- ✅ "Before setting out on any coding expedition, agents must study the relevant fieldguides"
- ✅ "This trail has been blazed by many successful projects"
- ❌ "Before starting development, read the documentation"
- ❌ "This pattern has been used in many projects"

### Instructions

Present guidance as expedition preparation:

- ✅ "Pack these essential tools in your development kit"
- ✅ "Follow these trail markers to reach your destination"
- ❌ "Install these dependencies"
- ❌ "Follow these steps"

## When to Use This Style

### ✅ USE expedition themes in

- README.md
- CLAUDE.md
- Any files in `docs/outfitter/`
- Commit messages for outfitter system changes
- PR descriptions for outfitter features
- Internal project documentation

### ❌ NEVER USE expedition themes in

- Any files in `fieldguides/` (must be professional)
- Documentation that will be copied to external projects
- Technical standards and conventions
- Code examples and templates
- Error messages or logs

## Examples

### Internal (Outfitter) Documentation

```markdown
# Setting Up Base Camp 🏕️

Every successful expedition begins with a well-organized base camp. The Agent Outfitter provides everything you need to establish yours.

## Packing Your Gear 🎒

Before venturing into the codebase wilderness, ensure you've packed:

- Node.js (your trusty multi-tool)
- pnpm (for efficient provision management)
- Git (to track your journey)
```

### External (Fieldguide) Documentation

```markdown
# TypeScript Configuration

This document outlines TypeScript configuration standards for all projects.

## Required Compiler Options

All projects must use strict TypeScript settings:

- `strict: true`
- `noImplicitAny: true`
- `strictNullChecks: true`
```

## Maintaining Consistency

1. **Review context** before writing - which type of documentation is this?
2. **Match existing style** in the document you're editing
3. **Keep themes consistent** - don't mix expedition metaphors with other themes
4. **Stay practical** - the theme should enhance, not obscure, the content

Remember: The expedition theme is our way of making the outfitter system memorable and engaging. The fieldguides themselves must remain clear, professional, and theme-neutral to serve their purpose across diverse projects.
