# Comprehensive Cleanup Plan

**Date**: 2025-08-18 14:48 **Branch**: review/stash-contents

## Executive Summary

This plan addresses all outstanding issues identified during code review, including missing syncpack configuration, TypeScript build errors, Biome configuration inconsistencies, and various code quality improvements.

## Priority 1: Critical Issues (🔴 Must Fix)

### 1.1 Missing Syncpack Configuration

**Issue**: Syncpack files are missing from current branch despite being in commit history **Impact**: Dependency version inconsistencies across packages **Solution**:

- Recreate `.syncpackrc.json` with proper configuration
- Ensure all packages use consistent dependency versions
- Add syncpack to CI pipeline

### 1.2 TypeScript Build Errors

**Issue**: Multiple temporary dist directories with `any` types in declarations **Files**:

- `packages/contracts/ts/temp-dist*/zod/env.d.ts` (lines 54, 80)
- Build artifacts not properly cleaned **Solution**:
- Remove all temp-dist\* directories
- Fix `any` types in TypeScript declarations
- Update build scripts to clean properly
- Add dist/ to .gitignore

### 1.3 Remove Build Artifacts from Git

**Issue**: Compiled files tracked in version control **Files**:

- `packages/contracts/ts/dist/`
- `packages/contracts/ts/temp-dist*/` **Solution**:
- Remove from git tracking
- Add to .gitignore
- Update build process

## Priority 2: Important Issues (🟡 Should Fix)

### 2.1 Console Usage in Baselayer

**Issue**: Direct console.log usage instead of structured logging **File**: `packages/baselayer/src/utils/console.ts` **Solution**:

- Already has a Console class wrapper
- Consider migrating to shared logging utility (future)
- Current implementation is acceptable for CLI context

### 2.2 Error Message Completeness

**Issue**: Ensure all ErrorCode values have corresponding messages **File**: `packages/contracts/ts/src/errors/humanize.ts` **Solution**:

- Verify all ErrorCode enum values are in errorMessages
- Add any missing mappings
- Add test to ensure completeness

### 2.3 Test Coverage Gaps

**Packages Needing Tests**:

- `@outfitter/cli`: 0% coverage
- `@outfitter/baselayer`: Limited coverage
- `@outfitter/packlist`: No tests **Solution**:
- Write comprehensive tests for each package
- Target 80% minimum coverage
- Focus on critical paths first

### 2.4 Build Performance

**Issue**: Redundant operations in build scripts **Solution**:

- Optimize turbo.json pipeline
- Remove duplicate type checking
- Parallelize independent tasks

### 2.5 Git Hooks Enhancement

**Issue**: Basic pre-commit hooks only **Solution**:

- Add commit message validation
- Add branch naming convention checks
- Add pre-push hooks for tests

## Priority 3: Code Quality (🟢 Suggestions)

### 3.1 Package Documentation

**Issue**: Missing or incomplete README files **Packages**: All packages need better docs **Solution**:

- Add comprehensive README to each package
- Include usage examples
- Document API surface

### 3.2 CI/CD Improvements

**Issue**: Basic CI pipeline **Solution**:

- Add matrix testing for multiple Node/Bun versions
- Add automated dependency updates
- Add security scanning
- Add performance benchmarks

### 3.3 Error Handling Patterns

**Issue**: Inconsistent error handling **Solution**:

- Ensure all packages use Result pattern
- Add error boundary components
- Improve error messages

## Priority 4: Nitpicks (🔵 Minor Issues)

### 4.1 Import Organization

**Issue**: Inconsistent import ordering **Solution**:

- Configure Biome to auto-sort imports
- Group by: external, internal, relative
- Add blank lines between groups

### 4.2 File Naming Conventions

**Issue**: Mix of kebab-case and camelCase **Solution**:

- Standardize on kebab-case for files
- Update all files to match convention
- Add linting rule

### 4.3 TypeScript Strictness

**Issue**: Some packages not using full strict mode **Solution**:

- Enable all strict flags
- Fix resulting errors
- Add to shared tsconfig

### 4.4 Package.json Consistency

**Issue**: Inconsistent script names and structures **Solution**:

- Standardize script names across packages
- Use consistent ordering
- Add missing metadata fields

## Implementation Plan

### Phase 1: Critical Fixes (Immediate)

1. **Syncpack Setup** (15 min)
   - Create .syncpackrc.json
   - Run syncpack fix-mismatches
   - Verify all dependencies aligned

2. **Build Artifacts Cleanup** (10 min)
   - Remove temp-dist directories
   - Update .gitignore
   - Clean git history

3. **TypeScript Errors** (20 min)
   - Fix any types in declarations
   - Ensure clean builds
   - Update build scripts

### Phase 2: Important Improvements (Today)

4. **Test Coverage** (2 hours)
   - Write tests for CLI package
   - Write tests for baselayer
   - Write tests for packlist
   - Ensure 80% coverage

5. **Build Optimization** (30 min)
   - Update turbo.json
   - Parallelize tasks
   - Remove redundancies

6. **Error Messages** (15 min)
   - Verify all error codes mapped
   - Add missing messages
   - Write validation test

### Phase 3: Quality Enhancements (This Week)

7. **Documentation** (1 hour)
   - Write package READMEs
   - Add usage examples
   - Document APIs

8. **CI/CD Updates** (45 min)
   - Add matrix testing
   - Add security scanning
   - Enhance workflows

### Phase 4: Polish (Next Sprint)

9. **Code Style** (30 min)
   - Fix import ordering
   - Standardize file names
   - Update linting rules

10. **Final Review** (15 min)
    - Run full test suite
    - Check coverage reports
    - Validate all fixes

## Success Criteria

- [ ] All TypeScript errors resolved
- [ ] Syncpack configuration working
- [ ] No build artifacts in git
- [ ] 80% test coverage achieved
- [ ] All packages build successfully
- [ ] Pre-commit hooks pass
- [ ] Code reviewer approval

## Risks & Mitigations

- **Risk**: Breaking changes during cleanup
  - **Mitigation**: Comprehensive test coverage first
- **Risk**: Merge conflicts with main
  - **Mitigation**: Rebase frequently
- **Risk**: CI/CD failures
  - **Mitigation**: Test locally first

## Notes

- Priority on fixing breaking issues first
- Tests before refactoring
- Document all changes
- Keep commits atomic and descriptive
