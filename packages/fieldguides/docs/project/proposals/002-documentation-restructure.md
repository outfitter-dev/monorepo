# Proposal: Documentation Restructure for Reduced Context Usage

**Issue**: #15 - Simplify, streamline, or split documentation  
**Date**: January 6, 2025  
**Status**: Completed

## Problem Statement

Current fieldguides total ~6,938 lines across 10 files, with critical files exceeding 900 lines each:

- `typescript-conventions.md`: 1,089 lines
- `environment-config.md`: 977 lines
- `testing-strategy.md`: 929 lines
- `ci-cd-pipelines.md`: 869 lines

This density creates significant AI context window consumption, reducing the effectiveness of AI agents working with our documentation.

## Proposed Solution

Implement a "Scalable Category Hierarchy" structure that:

1. Reduces total documentation to ~4,200 lines (39% reduction)
2. Separates universal standards from specific implementations
3. Uses clear naming conventions for discoverability
4. Preserves all existing content in a better-organized structure

## Directory Structure

```text
fieldguides/
├── README.md                       # Overview and navigation
├── CODING.md                       # Universal coding standards (~300 lines)
├── TESTING.md                      # Universal testing requirements (~200 lines)
├── SECURITY.md                     # Security baseline (~150 lines)
├── languages/
│   └── typescript/
│       ├── standards.md            # Essential TypeScript patterns (~400 lines)
│       ├── patterns/
│       │   ├── utility-types.md    # Custom utility patterns (~200 lines)
│       │   ├── error-handling.md   # Result pattern focus (~250 lines)
│       │   └── validation.md       # Zod schema patterns (~200 lines)
│       └── examples/
│           ├── configs/            # TSConfig templates
│           └── utilities/          # Reusable utility code
├── frameworks/
│   ├── react.md                   # React patterns (single file, ~300 lines)
│   └── next.md                    # Next.js patterns (single file, ~200 lines)
├── libraries/
│   ├── configuration/
│   │   └── standards.md           # Environment & config patterns (~400 lines)
│   └── testing/
│       ├── standards.md           # Testing methodology (~300 lines)
│       ├── patterns/
│       │   ├── unit.md            # Unit testing patterns (~200 lines)
│       │   ├── integration.md     # Integration patterns (~200 lines)
│       │   └── e2e.md             # E2E testing patterns (~200 lines)
│       └── examples/
│           ├── vitest.config.example.ts
│           ├── test-utils.example.tsx
│           └── setup/
├── operations/
│   ├── deployment/
│   │   ├── standards.md           # CI/CD essentials (~300 lines)
│   │   ├── patterns/
│   │   │   ├── github-actions.md  # GitHub Actions patterns (~250 lines)
│   │   │   └── environments.md    # Environment management (~200 lines)
│   │   └── examples/
│   │       ├── workflows/
│   │       └── dockerfiles/
│   └── monitoring.md              # Observability patterns (single file, ~200 lines)
└── architecture/
    ├── monorepo/
    │   └── standards.md            # Monorepo patterns (~400 lines)
    ├── components/
    │   └── standards.md            # Component architecture (~300 lines)
    └── documentation.md            # Documentation standards (single file, ~200 lines)
```

## Naming Conventions

1. **ALL CAPS top-level docs** for canonical standards (single word when possible)
2. **Small scope = single file** (`name.md`)
3. **Large scope = directory** with subdocs (`category/topic/standards.md`)
4. **If only one thing in folder** = use `name.md` instead of directory
5. **Example files** = `<name>.example.<ext>` for easy identification

## Content Preservation Strategy

### Safety Measures

To ensure no content is lost during the restructure:

1. **Work in new directories only** - Never modify existing files directly
2. **Create parallel structure** - Build new structure alongside existing
3. **Content extraction, not moving** - Copy content to new files, leave originals intact
4. **Validation before cleanup** - Only remove old files after confirming migration

### Files at Risk of Override

The following existing files would conflict with our new structure:

- None identified - all new files use different paths or names

### Execution Phases

#### Phase 1: Setup and Documentation

- [x] Create this proposal document
- [x] Build new directory structure with .gitkeep files
- [x] No file overwrites - all new paths

#### Phase 2: Extract Universal Standards (NEW FILES)

- [x] **CODING.md** - Extract from all existing files
  - **Cross-check sources**:
    - typescript-conventions.md (naming, code organization)
    - component-architecture.md (separation of concerns)
    - result-pattern.md (error handling principles)
    - documentation.md (code documentation standards)
- [x] **TESTING.md** - Consolidate testing philosophy
  - **Cross-check sources**:
    - test-driven-development.md (TDD principles)
    - testing-strategy.md (testing pyramid, methodology)
    - ci-cd-pipelines.md (automated testing requirements)
    - monorepo.md (monorepo testing patterns)
- [x] **SECURITY.md** - Extract security practices
  - **Cross-check sources**:
    - ci-cd-pipelines.md (security scanning, secret management)
    - environment-config.md (secure config handling)
    - All files for auth/authz patterns

#### Phase 3: Reorganize Language-Specific Content

- [x] **languages/typescript/standards.md**
  - **Primary source**: typescript-conventions.md
  - **Cross-check**: All files for TypeScript-specific patterns
- [x] **languages/typescript/patterns/utility-types.md**
  - **Extract from**: typescript-conventions.md
  - **Cross-check**: component-architecture.md for type utilities
- [x] **languages/typescript/patterns/error-handling.md**
  - **Primary source**: result-pattern.md
  - **Cross-check**: typescript-conventions.md for error types
- [x] **languages/typescript/patterns/validation.md**
  - **Extract from**: environment-config.md (Zod patterns)
  - **Cross-check**: typescript-conventions.md for validation types

#### Phase 4: Extract Framework Content

- [x] **frameworks/react.md**
  - **Primary source**: component-architecture.md (React sections)
  - **Cross-check**: typescript-conventions.md (React types)
- [x] **frameworks/next.md**
  - **Extract from**: Multiple files mentioning Next.js
  - **Cross-check**: environment-config.md, component-architecture.md

#### Phase 5: Organize Library Categories

- [x] **libraries/configuration/standards.md**
  - **Primary source**: environment-config.md
  - **Cross-check**: All files for config patterns
- [x] **libraries/testing/standards.md**
  - **Merge**: testing-strategy.md + test-driven-development.md
  - **Cross-check**: All files for testing references
- [x] **libraries/testing/patterns/\*.md**
  - **Extract from**: testing-strategy.md by test type
  - **Cross-check**: ci-cd-pipelines.md for CI testing

#### Phase 6: Setup Operations Content

- [x] **operations/deployment/standards.md**
  - **Primary source**: ci-cd-pipelines.md
  - **Cross-check**: monorepo.md for deployment patterns
- [x] **operations/deployment/patterns/github-actions.md**
  - **Extract from**: ci-cd-pipelines.md
  - **Cross-check**: All files for GitHub Actions workflows
- [x] **operations/monitoring.md**
  - **Search all files**: Monitoring, observability, logging patterns

#### Phase 7: Migrate Architecture Content

- [x] **architecture/monorepo/standards.md**
  - **Direct copy**: monorepo.md
  - **Cross-check**: Other files for monorepo references
- [x] **architecture/components/standards.md**
  - **Primary source**: component-architecture.md (non-React parts)
  - **Cross-check**: typescript-conventions.md for component types
- [x] **architecture/documentation.md**
  - **Direct copy**: documentation.md
  - **Cross-check**: Other files for doc standards

#### Phase 8: Cleanup and Validation

- [x] Update all cross-references to new paths
- [x] Verify no broken links
- [x] Confirm line count targets met
- [x] Create OLD_FIELDGUIDES backup directory
- [x] Move (not delete) original files to backup

## Content Extraction Guidelines

For each new document:

1. **Start with primary source** as indicated above
2. **Search all fieldguides** for related content using grep/search for key terms
3. **Check these common locations** for missed content:
   - Introduction sections often contain principles
   - "Best Practices" or "Guidelines" sections
   - Code examples that demonstrate patterns
   - Error handling sections
   - Security considerations
   - Performance notes
4. **Deduplicate** content that appears in multiple places
5. **Preserve** unique insights from each source

## Migration Checklist

Before removing any original files:

- [x] All content accounted for in new structure
- [x] Line count targets achieved (~4,200 total)
- [x] No file exceeds target length (400 lines max)
- [x] All cross-references updated
- [x] Examples follow .example.<ext> convention
- [x] Directory structure matches proposal
- [x] Original files backed up to OLD_FIELDGUIDES/

## Success Criteria

1. **Quantitative**:

   - Total lines: ~4,200 (from 6,938)
   - Max file size: 400 lines
   - Reduction: ~39%

2. **Qualitative**:
   - Clear separation of universal vs specific
   - Intuitive navigation structure
   - No lost content
   - Improved discoverability

## Rollback Plan

If issues arise:

1. New structure is parallel, originals remain intact
2. Simply delete new directories to revert
3. No changes to existing files until validation complete

## Next Steps

1. Review and approve this proposal
2. Execute phases in order
3. Validate at each phase before proceeding
4. Only remove originals after full validation
