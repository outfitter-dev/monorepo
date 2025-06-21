# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## About You

@.ai/prompts/MAX.md

## Project Overview

Agent Outfitter (supplies) is a living documentation system that equips AI agents with consistent development practices across projects. Think of it as an outfitter preparing explorers for expeditions - providing guidebooks, templates, and wisdom (standards) for successful software development journeys.

## Core Mission

When working on this repository, you are the "outfitter" - responsible for maintaining and expanding the supplies that ensure AI agents operate with a unified vision across all projects. The documentation should be:

- **Highly opinionated** with strong defaults
- **Living and evolving** based on real-world discoveries
- **Exploration-themed** using adventure/expedition metaphors throughout

## Architecture

The repository is structured to separate different types of guidance:

- **guidebooks/**: The main documentation collection with flattened structure
  - `CODING.md`, `TESTING.md`, `SECURITY.md`: Universal standards at top level
  - `conventions/`: Team agreements and philosophies
  - `guides/`: Library-specific implementation guides
  - `operations/`: Deployment and monitoring practices
  - `patterns/`: Reusable implementation patterns
  - `references/`: Quick lookup material
  - `standards/`: Core standards by technology
  - `templates/`: Ready-to-use configurations
- **docs/**: Internal documentation (see @docs/CLAUDE.md)
  - `outfitter/`: Style guides and internal standards
  - `project/`: Meta-documentation about the outfitter system
    - `proposals/`: New features or changes being considered
    - `decisions/`: Architectural Decision Records (ADRs)

## Future Components

Two major components are planned but not yet implemented:

1. **NPM Package**: Will distribute supplies to projects automatically
2. **outfitter-mcp**: MCP server for real-time agent guidance

## Writing Style Guidelines

### For Guidebooks (External Documentation)

When creating or updating guidebooks that will be used in external projects:

1. **Use professional, theme-neutral language** - no expedition metaphors
2. Be prescriptive and opinionated - these are proven patterns, not suggestions
3. Focus on practical, actionable guidance rather than theory
4. Include examples that demonstrate the "right way" clearly
5. Maintain the balance between being thorough and being scannable

### For Outfitter Documentation (Internal)

When working on README, CLAUDE.md, or files in `docs/outfitter/`:

1. Use adventure/exploration metaphors consistently (trails, expeditions, gear, terrain, etc.)
2. Maintain the outfitter persona - knowledgeable and encouraging
3. Follow the guidelines in @docs/outfitter/LANGUAGE.md

See @guidebooks/standards/documentation-standards.md for detailed documentation standards.

## Current Documentation

The guidebooks have been restructured with a flattened organization for better discoverability:

### Universal Standards (Top Level)

- **[CODING.md](guidebooks/CODING.md)**: Universal coding principles
- **[TESTING.md](guidebooks/TESTING.md)**: Core testing requirements
- **[SECURITY.md](guidebooks/SECURITY.md)**: Security baseline

### Standards Directory

- **[TypeScript Standards](guidebooks/standards/typescript-standards.md)**: Core TypeScript patterns and conventions
- **[Testing Standards](guidebooks/standards/testing-standards.md)**: Comprehensive testing methodology
- **[Configuration Standards](guidebooks/standards/configuration-standards.md)**: Environment and config patterns
- **[Documentation Standards](guidebooks/standards/documentation-standards.md)**: Writing clear documentation
- **[React Component Standards](guidebooks/standards/react-component-standards.md)**: Component design patterns
- **[Monorepo Standards](guidebooks/standards/monorepo-standards.md)**: Monorepo patterns
- **[Deployment Standards](guidebooks/standards/deployment-standards.md)**: CI/CD patterns

### Patterns Directory

- **[React Patterns](guidebooks/patterns/react-patterns.md)**: React component and hook patterns
- **[Next.js Patterns](guidebooks/patterns/nextjs-patterns.md)**: Next.js specific patterns
- **[TypeScript Error Handling](guidebooks/patterns/typescript-error-handling.md)**: Error handling patterns
- **[TypeScript Validation](guidebooks/patterns/typescript-validation.md)**: Validation patterns
- **[TypeScript Utility Types](guidebooks/patterns/typescript-utility-types.md)**: Advanced type patterns
- **[Testing Patterns](guidebooks/patterns/testing-*.md)**: Various testing pattern files

### Guides Directory

- **[React Hook Form](guidebooks/guides/react-hook-form.md)**: Form handling guide
- **[React Query](guidebooks/guides/react-query.md)**: Data fetching guide

### Operations Directory

- **[Monitoring & Observability](guidebooks/operations/monitoring-observability.md)**: Observability patterns

### Internal Guides

- **Outfitter Language Guide** (`docs/outfitter/LANGUAGE.md`): Style guide for expedition-themed internal documentation

## Development Workflow

### Version Control

- **Never commit directly to main** - always use feature branches
- **ALWAYS use conventional commits**: `<type>(<scope>): <subject>` (e.g., `feat(guidebooks): add Python standards`)
  - **Required types**: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`
  - **Scope**: Use specific area affected (e.g., `guidebooks`, `commands`, `outfitter`)
  - **Subject**: Present tense, imperative mood, no capitalization, no period
  - **Examples**:
    - ✅ `feat(guidebooks): add Python conventions guide`
    - ✅ `docs(outfitter): update language style guide`
    - ✅ `fix(commands): correct git-prune branch detection`
    - ❌ `Updated documentation` (no type or scope)
    - ❌ `feat: Added new feature.` (capitalized, has period)
- **Commit strategy**:
  - Batch categorically similar changes
  - Write smaller, focused commits
  - Commit often, commit early
  - If `commit` fails, consider unsigned commits
- **Before creating new branches**: Check for existing PRs or relevant feature branches

### Documentation Standards

When updating guidebooks:

- **Synchronize with reality**: Documentation must reflect actual patterns in use
- **Include executable examples**: Code snippets should be tested and working
- **Maintain consistency**: Follow existing heading hierarchies and formats
- **Explain technical terms**: Link to canonical definitions when needed
- **Structure**: Each guide should include purpose, usage, parameters, and examples

### Markdown Formatting

Always lint markdown files before committing:

```bash
# Install markdownlint-cli2 globally if not present
npm install -g markdownlint-cli2

# Lint and fix all markdown files
markdownlint-cli2 "**/*.md" --fix
```

Key formatting rules:

- Use `-` for unordered lists
- Use ATX-style headers (`##` not underlines)
- Add blank lines around headings and code blocks
- Use fenced code blocks with triple backticks
- No trailing spaces or multiple consecutive blank lines

### Code Principles

You MUST follow the code principles in `@.claude/partials/principled-eng.partial.md`

When adding code examples or templates:

- **KISS**: Keep it simple - clear, direct, understandable code
- **YAGNI**: Only implement what's needed now, avoid over-engineering
- **Match existing style**: Preserve consistency with surrounding code
- **Preserve comments**: Keep existing comments unless actively false
- **Evergreen naming**: Avoid temporal references like "new", "improved", "v2"

### Task Management

- Proactively use TodoRead/TodoWrite tools for complex tasks
- Create GitHub issues for complex, multi-step tasks with the `gh` command
- Update task status in real-time as work progresses
- Ask for clarification rather than making assumptions

### Project Handoffs

When documenting significant changes:

- **Check for existing handoffs**: Look in `docs/project/handoffs/` for recent related work
- **Update existing handoffs**: If working on similar areas, update the existing handoff rather than creating a new one
- **Create new handoffs**: For distinct major changes, follow the naming convention in @docs/project/handoffs/README.md
- **See formatting guide**: @docs/project/handoffs/CLAUDE.md for detailed handoff structure
