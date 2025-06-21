# Architecture Decision Records (ADRs)

This directory contains Architecture Decision Records - documents that capture important architectural decisions made in the project.

## Format

ADRs follow this naming convention:

```
NNN-title-with-dashes.md
```

Where NNN is a sequential number (001, 002, etc.).

## Template

Each ADR should include:

1. **Title**: Short noun phrase
2. **Status**: Proposed, Accepted, Deprecated, Superseded
3. **Context**: What is the issue we're addressing?
4. **Decision**: What have we decided to do?
5. **Consequences**: What are the positive and negative outcomes?
6. **Alternatives**: What other options were considered?

## Current ADRs

- [001: Keep CLI as Package](001-keep-cli-as-package.md) - CLI remains in packages/ not apps/

## Creating New ADRs

When making significant architectural decisions:

1. Create a new file with the next number
2. Follow the template structure
3. Link to relevant code or documentation
4. Update this README with the new entry
