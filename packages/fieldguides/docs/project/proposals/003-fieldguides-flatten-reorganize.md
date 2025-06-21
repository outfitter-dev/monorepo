# Proposal: Flatten and Reorganize Fieldguides Structure

## Summary

This proposal outlines a comprehensive restructuring of the fieldguides documentation to improve discoverability, reduce nesting, and add metadata support through frontmatter. The new structure emphasizes clarity of purpose for each document type while maintaining our opinionated approach to development practices.

## Motivation

The current fieldguides structure has several pain points:

1. **Deep nesting** makes files hard to discover (e.g., `languages/typescript/patterns/error-handling.md`)
2. **Mixed concerns** within directories blur the purpose of different document types
3. **No metadata** for tooling, search, or categorization
4. **Large files** (600+ lines) exceed our context optimization targets
5. **Unclear distinctions** between standards, conventions, patterns, and guides

## Proposed Structure

### Directory Organization

```text
fieldguides/
├── CODING.md          # Universal coding standards (unchanged)
├── SECURITY.md        # Universal security standards (unchanged)
├── TESTING.md         # Universal testing standards (unchanged)
├── conventions/       # Informal agreements for consistency
├── patterns/          # Reusable solutions to recurring problems
├── templates/         # Copy-paste starting points
├── guides/            # Comprehensive single-topic references
└── references/        # Quick-lookup tables and high-noise content
```

### Document Categories

#### Standards (ALL CAPS .md files)

- **Purpose**: Non-negotiable, opinionated rules
- **Examples**: CODING.md, SECURITY.md, TESTING.md
- **No frontmatter**: These remain as-is at the root

#### conventions/

- **Purpose**: Informal agreements and lightweight contracts for consistency
- **Enforcement**: Discretionary - teams can adapt based on context
- **Examples**: `typescript-conventions.md`, `api-design-conventions.md`
- **File naming**: `<topic>-conventions.md`

#### patterns/

- **Purpose**: Problem-focused reusable solutions
- **Content**: Implementation patterns with embedded examples
- **Examples**: `typescript-error-handling.md`, `react-compound-components.md`
- **File naming**:
  - Patterns: `<topic>-<pattern-name>.md`
  - Examples: `<topic>-<pattern-name>.example.md`

#### templates/

- **Purpose**: Production-ready boilerplate code
- **Content**: Well-commented, ready-to-use configurations and code
- **Examples**: `vitest-config-template.ts`, `github-actions-ci-template.yml`
- **File naming**: `<topic>-<purpose>-template.<ext>`

#### guides/

- **Purpose**: If you read ONE document about a topic, read this
- **Content**: Terse, comprehensive, opinionated overviews
- **Examples**: `react-guide.md`, `testing-guide.md`
- **File naming**: `<topic>-guide.md`

#### references/

- **Purpose**: Keep high-noise reference material out of narrative guides
- **Content**: Lookup tables, API specs, command references
- **Examples**: `http-status-codes-reference.md`, `typescript-compiler-options-reference.md`
- **File naming**: `<topic>-<content>-reference.md`

### Frontmatter Schema

All documents (except STANDARDS) will include frontmatter:

```yaml
---
slug: typescript-error-handling # required, unique, kebab-case
title: Handle errors with type-safe Result patterns # required, ~60 chars
description: Type-safe error handling without throwing exceptions. # required, 72 char
type: pattern # required: convention|pattern|guide|template|reference
category: typescript # optional: for grouping
tags: [error-handling, typescript, fp] # optional: for discovery
related: [typescript-conventions, validation-patterns] # optional: cross-refs
status: stable # optional: draft|stable|deprecated
---
```

## Migration Plan

### Phase 1: Structure Setup ✅

- Rename directories: `fieldguides-v2` → `fieldguides`, existing → `fieldguides-archived`
- Create new directory structure
- Add README.md to each directory
- Define frontmatter schema

### Phase 2: TypeScript Migration ✅

- Move `languages/typescript/standards.md` → `conventions/typescript-conventions.md`
- Move patterns to flat structure with frontmatter
- Create example files for patterns

### Phase 3: Testing & Frameworks (Current)

- Split large testing files (680 lines → multiple focused files)
- Create testing guide from existing content
- Migrate testing patterns to flat structure
- Move React/Next.js to guides with proper frontmatter

### Phase 4: Operations & References

- Split monitoring.md (661 lines) into conventions + references
- Extract reference content from large files
- Create deployment and monitoring guides

### Phase 5: Cleanup

- Remove old nested structures
- Update all cross-references
- Validate frontmatter compliance

## File Mapping Examples

```text
# TypeScript
languages/typescript/standards.md → conventions/typescript-conventions.md
languages/typescript/patterns/error-handling.md → patterns/typescript-error-handling.md
languages/typescript/patterns/utility-types.md → patterns/typescript-utility-types.md

# Testing
libraries/testing/standards.md → Split:
  - conventions/testing-methodology-conventions.md
  - guides/testing-guide.md
libraries/testing/patterns/unit.md → patterns/testing-unit.md
libraries/testing/examples/vitest.config.example.ts → templates/vitest-config-template.ts

# Frameworks
frameworks/react.md → guides/react-guide.md
frameworks/next.md → guides/nextjs-guide.md

# Operations
operations/monitoring.md → Split:
  - conventions/monitoring-conventions.md
  - references/monitoring-metrics-reference.md
```

## Benefits

1. **Improved Discoverability**: Flat structure makes finding documents easier
2. **Clear Purpose**: Each directory has a specific, well-defined role
3. **Better Tooling**: Frontmatter enables search, filtering, and automation
4. **Context Optimization**: Smaller, focused files (≤400 lines)
5. **Scalability**: Structure accommodates growth without deep nesting

## Success Criteria

- [ ] All files have appropriate frontmatter (except STANDARDS)
- [ ] No file exceeds 400-500 lines
- [ ] Clear distinction between document types
- [ ] All cross-references updated
- [ ] Migration completes without losing content
- [ ] Improved developer experience when finding documentation

## Timeline

- Phase 1-2: ✅ Complete
- Phase 3: In Progress (1-2 days)
- Phase 4-5: 2-3 days
- Total: ~1 week

## Risks & Mitigation

**Risk**: Breaking existing references in projects

- **Mitigation**: Keep `fieldguides-archived` for transition period

**Risk**: Confusion about document categories

- **Mitigation**: Clear README in each directory, consistent naming

**Risk**: Large migration scope

- **Mitigation**: Phased approach, incremental commits

## Alternatives Considered

1. **Keep nested structure**: Rejected - doesn't solve discoverability
2. **Single flat directory**: Rejected - loses semantic organization
3. **Tag-based only**: Rejected - directories provide natural grouping

## Conclusion

This restructuring will significantly improve the fieldguides' usability while maintaining our opinionated approach. The flatter structure, clear categorization, and metadata support will benefit both human developers and AI agents working with our documentation.
