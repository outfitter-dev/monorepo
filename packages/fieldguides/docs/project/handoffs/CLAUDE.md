# Handoff Formatting Guide

This guide provides the structure and formatting conventions for creating project handoff documents.

## Template Structure

Every handoff should follow this structure:

```markdown
# [Title of Change/Feature]

## Overview

[2-3 sentence summary of what was done and why it matters]

## Context

[Background information that led to this work] [Problem statement or requirements] [Links to related issues/PRs if applicable]

## Key Changes

### 1. [Major Change Area]

[Description of what changed] [Why this approach was chosen]

### 2. [Another Change Area]

[Continue for all significant changes]

## Technical Details

### Architecture Decisions

[Key architectural choices made] [Trade-offs considered]

### Implementation Notes

[Important implementation details] [Patterns used] [Dependencies added/removed]

## Breaking Changes

[List any breaking changes] [Migration steps required]

## Verification

- [ ] Tests pass
- [ ] Linting passes
- [ ] Documentation updated
- [ ] [Other verification steps]

## Next Steps

[What should happen next] [Known limitations or future improvements]

## References

- [Link to PR]
- [Link to related documentation]
- [External resources consulted]
```

## Writing Guidelines

1. **Be Specific**: Include file paths, function names, and concrete examples
2. **Explain Why**: Document not just what changed, but why decisions were made
3. **Think Future**: Write for someone (including yourself) reading this months later
4. **Include Examples**: Show code snippets for complex changes
5. **List Commands**: Include any commands needed for migration or testing

## Common Sections

### For Refactoring

- Before/after code examples
- Performance improvements measured
- Patterns replaced and why

### For New Features

- User-facing changes
- API documentation
- Usage examples

### For Bug Fixes

- Root cause analysis
- Steps to reproduce (before fix)
- Test cases added

### For Dependency Updates

- Version changes
- Breaking changes in dependencies
- Required code modifications

## Example References

See existing handoffs for examples:

- `@202506021654-phase4-migration.md` - Large structural migration
- `@202506031719-conventions-update.md` - Documentation and standards update
