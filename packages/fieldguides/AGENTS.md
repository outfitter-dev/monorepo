# AGENTS.md

This file provides guidance to OpenAI Codex Agent when working with code in this repository.

## Project Overview

Agent Outfitter (mg-outfitter) is a living documentation system that equips AI agents with consistent development practices across projects. It provides comprehensive fieldguides, templates, and standards to ensure all agents operate with unified patterns.

## Core Mission

You are working on a documentation system that helps AI agents maintain consistency across software projects. The fieldguides you help maintain are used by other AI agents in their development work.

## Repository Structure

- **fieldguides/**: Professional documentation for external use
  - `CODING.md`, `TESTING.md`, `SECURITY.md`: Universal standards at top level
  - `conventions/`: Team agreements and philosophies
  - `guides/`: Library-specific implementation guides
  - `operations/`: Deployment and monitoring practices
  - `patterns/`: Reusable implementation patterns
  - `references/`: Quick lookup material
  - `standards/`: Core standards by technology
  - `templates/`: Ready-to-use configurations
- **docs/**: Internal project documentation
  - `outfitter/`: Internal style guides (uses exploration theme)
  - `project/`: Proposals and architectural decisions
- **.claude/**: Claude-specific configurations
- **.github/**: GitHub-specific configurations

## Development Standards

### Code Conventions

- Follow existing patterns in the repository
- Use TypeScript for any code examples
- Maintain consistent formatting with existing files
- Test all code examples before documenting them

### Documentation Guidelines

When working with fieldguides:

- Use professional, theme-neutral language
- Be prescriptive and opinionated
- Include working examples
- Follow the structure in `fieldguides/standards/documentation-standards.md`

When working with internal docs:

- Follow the exploration theme guidelines in `docs/outfitter/LANGUAGE.md`
- Use adventure metaphors consistently

### Version Control

- Create feature branches from main
- Use conventional commits: `type(scope): subject`
  - Types: feat, fix, docs, style, refactor, perf, test, chore
  - Example: `docs(fieldguides): add Python conventions guide`
- Never commit directly to main

### Markdown Standards

Before committing documentation:

```bash
# Install if needed
npm install -g markdownlint-cli2

# Lint and fix
markdownlint-cli2 "**/*.md" --fix
```

Key rules:

- Use `-` for unordered lists
- Use ATX headers (`##`)
- Add blank lines around headings and code blocks
- Use fenced code blocks with language identifiers

## Common Tasks

### Adding a New Fieldguide

1. Determine the appropriate category (standards, processes, etc.)
2. Follow the template structure from existing guides
3. Use professional, clear language
4. Include practical examples
5. Run markdown linting before committing

### Updating Existing Documentation

1. Maintain consistency with existing style
2. Preserve the document's structure
3. Update examples to remain current
4. Ensure all cross-references are valid

## Testing and Validation

- Verify all code examples compile/run
- Check that markdown renders correctly
- Ensure links are not broken
- Validate against documentation standards

## Key Files to Reference

- `CLAUDE.md`: Parallel instructions for Claude
- `fieldguides/standards/documentation-standards.md`: Documentation standards
- `docs/outfitter/LANGUAGE.md`: Internal documentation style guide
- `.markdownlint.json`: Markdown formatting rules
