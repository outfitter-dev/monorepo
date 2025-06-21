---
slug: frontmatter-schema
title: Frontmatter metadata schema for fieldguides
description: Schema and validation rules for fieldguide metadata.
type: reference
---

# Frontmatter Schema

All fieldguide documents (except STANDARDS) must include frontmatter with the following fields:

## Required Fields

```yaml
---
slug: typescript-error-handling # Unique ID, kebab-case, no special chars
title: Handle errors with type-safe Result patterns # ~60 chars max, sentence case
description: Type-safe error handling without throwing exceptions. # One sentence, 72 char line limit
type: pattern # ENUM: convention|pattern|guide|template|reference
---
```

## Field Definitions

### `slug` (required)

- Unique identifier for the document
- Must be kebab-case
- No special characters except hyphens
- Examples: `typescript-conventions`, `react-compound-components`

### `title` (required)

- Human-readable title
- Sentence case, present tense
- Maximum ~60 characters
- Should be action-oriented when possible
- Examples:
  - "Handle errors with type-safe Result patterns"
  - "Configure TypeScript for strict type checking"
  - "Build accessible React components"

### `description` (required)

- One-sentence explanation of why this document exists
- Maximum 72 characters per line
- Focus on the value/purpose
- Examples:
  - "Type-safe error handling without throwing exceptions."
  - "Consistent TypeScript configuration across all projects."

### `type` (required)

- Category of the document
- Must be one of:
  - `convention` - Informal agreements for consistency
  - `pattern` - Reusable solutions to problems
  - `guide` - Comprehensive single-topic reference
  - `template` - Copy-paste starting point
  - `reference` - Quick-lookup material

## Optional Fields

```yaml
---
# ... required fields ...
category: typescript # For grouping/filtering
tags: [error-handling, fp, typescript] # For discovery
related: [typescript-conventions, validation-patterns] # Cross-references
status: stable # ENUM: draft|stable|deprecated
---
```

## Validation Rules

1. `slug` must be unique across all documents
2. `slug` must match the filename (minus extension)
3. `title` should not exceed 60 characters
4. `description` should not exceed 72 characters per line
5. `type` must be a valid enum value
6. All required fields must be present

## Examples

### Convention Document

```yaml
---
slug: typescript-conventions
title: Configure TypeScript for consistent type safety
description: TypeScript configuration and coding conventions for all projects.
type: convention
category: typescript
tags: [typescript, configuration, conventions]
---
```

### Pattern Document

```yaml
---
slug: react-compound-components
title: Build flexible components with compound pattern
description: Create composable React components with implicit state sharing.
type: pattern
category: react
tags: [react, patterns, components]
related: [react-conventions, component-architecture-conventions]
---
```

### Guide Document

```yaml
---
slug: testing-guide
title: Test effectively with modern JavaScript tools
description: Comprehensive testing methodology from unit to E2E.
type: guide
tags: [testing, jest, vitest, playwright]
---
```

## Validation

### Automated Validation

All fieldguide documents are automatically validated for proper frontmatter:

```bash
# Validate all fieldguides
pnpm run lint:frontmatter

# Run all linting (includes frontmatter validation)
pnpm run lint
```

### Pre-commit Validation

Frontmatter is automatically validated before commits via lint-staged. Any files with invalid or missing frontmatter will prevent the commit.

### Validation Script

The validation script (`scripts/validate-frontmatter.js`) checks:

- Required fields are present
- Field types are correct
- Character limits are enforced
- Slugs match filenames
- Enums contain valid values
- Standards files do NOT have frontmatter

### Continuous Integration

Pull requests automatically validate all documentation changes to ensure consistency across the codebase.
