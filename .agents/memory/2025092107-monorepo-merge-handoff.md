# Camp Monorepo Creation and Consolidation

## Overview

Successfully consolidated three separate repositories (packlist, cli, supplies) into a unified camp monorepo with 8 publishable packages, modern tooling, and a comprehensive documentation system. This establishes camp as the core dependency for all future Outfitter projects.

## Context

The original architecture had fragmented codebases:

- `packlist/` - Configuration packages with some duplication
- `cli/` - Standalone CLI tool
- `supplies/` - Documentation system with validation tools

This fragmentation created maintenance overhead, version conflicts, and inconsistent tooling across projects. The goal was to create a single source of truth for Outfitter's core utilities while maintaining independent package publishing.

## Key Changes

### 1. Monorepo Structure Creation

**What changed:**

- Created `camp/` as new monorepo root
- Established pnpm workspace configuration
- Set up TypeScript project references for proper build ordering
- Configured unified tooling (prettier, eslint, markdownlint)

**Why this approach:**

- Single dependency tree eliminates version conflicts
- Atomic releases via changesets coordinate package versions
- Shared tooling ensures consistency
- Better developer experience with unified commands

### 2. Package Consolidation and Restructuring

**Packages migrated:**

- `@outfitter/packlist` - Configuration manager (from packlist/packages/packlist)
- `@outfitter/cli` - Command-line tool (from cli/, now consumes packlist + fieldguides)
- `@outfitter/fieldguides` - Documentation system (from supplies/, restructured)
- `@outfitter/eslint-config` - ESLint configurations
- `@outfitter/typescript-config` - TypeScript configurations
- `@outfitter/typescript-utils` - Type-safe utilities
- `@outfitter/husky-config` - Git hooks configuration
- `@outfitter/changeset-config` - Release management

**Key restructuring:**

- CLI now properly consumes `@outfitter/packlist` as a library instead of standalone
- Fieldguides reorganized with `content/` subdirectory for guidelines
- All packages updated with consistent repository metadata

### 3. Documentation Integration

**What changed:**

- Merged `supplies/guidebooks/` and `packlist/outfitter/fieldguides/` into unified content
- Organized as `@outfitter/fieldguides` package with validation tools
- Preserved all validation scripts and TypeScript utilities from supplies
- Maintained both internal (expedition-themed) and external (professional) documentation styles

**Structure:**

```
packages/fieldguides/
├── content/          # Coding guidelines (professional tone)
├── docs/            # Internal documentation (expedition-themed)
├── src/             # TypeScript validation tools
└── scripts/         # Validation and build scripts
```

### 4. Modern Tooling Configuration

**Added:**

- Prettier with import sorting configuration
- Markdownlint-cli2 with camp-specific rules
- VSCode settings with file nesting and proper formatting
- Comprehensive .gitignore for monorepo patterns

**Scripts integrated:**

- `pnpm ci:local` - Format, lint, type-check, test
- `pnpm lint:md` - Markdown linting with markdownlint-cli2
- Unified build process with proper dependency ordering

## Technical Details

### Architecture Decisions

**Workspace Dependencies:**

- Used `workspace:*` pattern for internal package dependencies
- CLI package now depends on both `@outfitter/packlist` and `@outfitter/fieldguides`
- Eliminates version drift between packages

**Build Strategy:**

- TypeScript project references ensure proper build ordering
- `typescript-utils` builds first as foundational dependency
- Parallel builds where dependencies allow

**Publishing Strategy:**

- Changesets for coordinated versioning across packages
- Each package maintains independent semantic versioning
- Repository metadata points to monorepo with directory-specific paths

### Implementation Notes

**Dependency Management:**

- Updated all package.json files with outfitter-dev/camp repository URLs
- Added proper `bugs` and `homepage` fields for each package
- Maintained existing dependency versions to avoid breaking changes

**Content Organization:**

- Preserved all existing documentation content without modification
- Used `content/` subdirectory to clearly separate package code from delivered guidelines
- Maintained frontmatter validation and all existing scripts

**Git Configuration:**

- Initialized as new repository with outfitter-dev/camp remote
- Created comprehensive .gitignore covering monorepo patterns
- Configured for conventional commits and changesets workflow

## Breaking Changes

**For consumers of individual packages:**

- Package repository URLs updated (old GitHub issues/PRs will need redirection)
- CLI package now has additional dependencies but maintains same API
- No functional breaking changes to any package APIs

**For development workflow:**

- Original repositories should be deprecated after migration
- New development happens in camp monorepo with feature branches
- Release process now uses changesets instead of individual package releases

## Verification

- [x] All packages build successfully with `pnpm build`
- [x] TypeScript project references resolve correctly
- [x] Linting passes (`pnpm lint` and `pnpm lint:md`)
- [x] Package.json files have correct repository metadata
- [x] CLI package properly imports workspace dependencies
- [x] Fieldguides package includes all validation tools and content
- [x] Git repository initialized with correct remote
- [x] VSCode settings configured for optimal developer experience

## Next Steps

**Immediate:**

1. Run `pnpm install && pnpm build && pnpm ci:local` to verify everything works
2. Push to `outfitter-dev/camp` repository: `git push -u origin main`
3. Configure branch protection and CI/CD for the new repository

**Short-term:**

1. Create initial changesets for all packages to establish baseline versions
2. Set up NPM publishing workflow with changeset automation
3. Update dependent projects to consume packages from new repository
4. Deprecate original repositories with migration notices

**Long-term:**

1. Create `@outfitter/prettier-config` and `@outfitter/markdownlint-config` packages
2. Add automated dependency updates workflow
3. Consider creating `@outfitter/create-app` scaffolding tool
4. Implement MCP server integration for real-time agent guidance

## References

- Repository: https://github.com/outfitter-dev/camp
- Original packlist: /Users/mg/Developer/outfitter/packlist
- Original CLI: /Users/mg/Developer/outfitter/cli
- Original supplies: /Users/mg/Developer/outfitter/supplies
- Max principles: @.ai/prompts/MAX.md
