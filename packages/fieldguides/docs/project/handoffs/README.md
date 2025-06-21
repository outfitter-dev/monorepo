# Project Handoffs

This directory contains handoff documents that capture significant changes, migrations, or feature implementations in the project.

## Naming Convention

All handoff files follow the pattern:

```text
YYYYMMDDhhmm-<descriptive-title>.md
```

Where:

- `YYYY` - 4-digit year
- `MM` - 2-digit month (01-12)
- `DD` - 2-digit day (01-31)
- `hh` - 2-digit hour in 24-hour format (00-23)
- `mm` - 2-digit minute (00-59)
- `<descriptive-title>` - Kebab-case descriptive title

## Current Handoffs

- `202506021654-phase4-migration.md` - Migration to v2 fieldguides structure
- `202506031719-conventions-update.md` - Update conventions to 2025 best practices

## Purpose

Handoff documents serve as:

- Historical record of major changes
- Context for future developers
- Migration guides for teams
- Decision documentation

## Creating a New Handoff

When creating a new handoff document:

1. Use the current timestamp when the work is completed
2. Choose a clear, descriptive title
3. Include:
   - Overview of changes
   - Key decisions made
   - Breaking changes
   - Migration notes
   - Verification steps
