# Code Quality Prevention Pipeline

This document describes the automated prevention pipeline that catches common code issues before they reach code review, based on patterns identified from CodeRabbit feedback across multiple PRs.

## Overview

The prevention pipeline consists of multiple layers:

1. **IDE/Editor Integration** - Catch issues while coding
2. **Pre-commit Hooks** - Validate before committing
3. **CI/CD Pipeline** - Comprehensive checks on PR
4. **Automated Code Review** - AI-powered review assistance

## Components

### 1. Enhanced Biome Configuration (`biome.enhanced.json`)

An extended Biome configuration that enforces stricter rules based on common patterns:

- **Type Safety**: No `any` types, explicit return types, proper null handling
- **Security**: No eval, innerHTML, or hardcoded secrets
- **Code Quality**: Import type usage, consistent patterns, proper documentation
- **Performance**: Optimized imports, no accumulating spread, efficient patterns
- **Accessibility**: Full WCAG AA compliance

**Usage:**
```bash
# Run enhanced linting
bun run lint:enhanced

# Auto-fix what's possible
bunx @biomejs/biome check --write --config-path=./biome.enhanced.json
```

### 2. Pre-commit Validation Script (`scripts/pre-commit-validation.ts`)

Runs comprehensive validation on staged files:

- **Result Pattern Validation**: Ensures proper Result pattern usage
- **Type Annotations**: Checks for missing types on functions and parameters
- **Security Scanning**: Detects potential security issues
- **Documentation**: Validates JSDoc on exported items
- **Import/Export**: Checks for proper import patterns

**Features:**
- Only validates staged files
- Provides line-specific feedback
- Distinguishes between errors (blocking) and warnings (non-blocking)
- Clear, actionable error messages

### 3. Custom Lint Rules (`scripts/custom-lint-rules.ts`)

Monorepo-specific linting rules that enforce our patterns:

- **Result Pattern Rule**: Enforces Result usage for error handling
- **Import Path Rule**: Ensures consistent import paths
- **Logging Pattern Rule**: Console for CLI, Pino for libraries
- **Documentation Rule**: JSDoc requirements
- **Test Structure Rule**: Consistent test patterns

**Usage:**
```bash
# Run custom linting
bun run lint:custom

# Run on specific directory
bun ./scripts/custom-lint-rules.ts packages/cli
```

### 4. GitHub Actions Workflow (`code-quality.yml`)

Comprehensive CI pipeline with multiple jobs:

#### Type Safety & Linting
- Runs enhanced Biome checks
- TypeScript strict type checking
- Result pattern validation
- Generates quality report

#### Security Scan
- Trufflehog for secret scanning
- Dependency vulnerability audit
- Outdated dependency checks

#### Documentation Check
- JSDoc coverage validation
- README file presence
- Comment quality checks

#### Import Analysis
- Type import validation
- Extension checking
- Circular dependency detection

#### Auto-fix Suggestions
- Automatically fixes formatting issues
- Creates fix commits when possible
- Non-intrusive, clearly marked commits

### 5. Enhanced Code Review Workflow

Updated Claude Code Review with specific patterns to check:

- Type safety and Result pattern usage
- Import/export patterns specific to our monorepo
- Security vulnerabilities
- Documentation completeness
- Testing coverage and quality

### 6. Lefthook Integration

Pre-commit hooks that run automatically:

```yaml
pre-commit:
  commands:
    validation:
      run: bun ./scripts/pre-commit-validation.ts
    ultracite-format:
      glob: "*.{js,ts,jsx,tsx}"
      run: bunx ultracite format {staged_files}
    custom-lint:
      glob: "*.{js,ts,jsx,tsx}"
      run: bun ./scripts/custom-lint-rules.ts {staged_files}
```

## JSDoc Templates (`scripts/templates/jsdoc-templates.ts`)

Provides consistent documentation templates:

- Result function template
- Async function template
- Class and interface templates
- Complex function documentation
- VS Code snippets for quick insertion

## Usage Guide

### For Developers

1. **Before Starting Work:**
   ```bash
   # Ensure hooks are installed
   bun run prepare
   ```

2. **During Development:**
   - Use provided JSDoc templates
   - Run `bun run validate` to check your changes
   - Use `bun run lint:all` for comprehensive linting

3. **Before Committing:**
   - Pre-commit hooks run automatically
   - Fix any errors before the commit proceeds
   - Warnings are shown but don't block commits

4. **Quality Check Commands:**
   ```bash
   # Run all quality checks
   bun run quality
   
   # Run enhanced CI locally
   bun run ci:enhanced
   
   # Individual checks
   bun run lint:enhanced  # Enhanced Biome
   bun run lint:custom    # Custom rules
   bun run validate       # Pre-commit validation
   ```

### For CI/CD

The pipeline automatically:
1. Validates all code on PR creation/update
2. Runs security scans
3. Checks documentation
4. Analyzes imports
5. Attempts auto-fixes where safe
6. Generates quality reports
7. Posts summary comments on PRs

## Common Patterns Prevented

### 1. Type Safety Issues
```typescript
// ❌ Bad: Missing Result pattern
async function fetchData() {
  try {
    return await api.get('/data');
  } catch (error) {
    throw error;
  }
}

// ✅ Good: Using Result pattern
async function fetchData(): Promise<Result<Data, AppError>> {
  try {
    const data = await api.get('/data');
    return success(data);
  } catch (error) {
    return failure(makeError('FETCH_ERROR', error.message));
  }
}
```

### 2. Import Issues
```typescript
// ❌ Bad: Type import without 'type' keyword
import { Result } from '@outfitter/contracts';

// ✅ Good: Proper type import
import type { Result } from '@outfitter/contracts';

// ❌ Bad: Missing .js extension
import { helper } from './utils';

// ✅ Good: With .js extension
import { helper } from './utils.js';
```

### 3. Documentation Issues
```typescript
// ❌ Bad: No JSDoc
export function processData(input: string): Result<Output, AppError> {
  // ...
}

// ✅ Good: With JSDoc
/**
 * Processes input data and returns formatted output
 * 
 * @param input - Raw input string to process
 * @returns Success with processed output or failure with error details
 */
export function processData(input: string): Result<Output, AppError> {
  // ...
}
```

### 4. Logging Issues
```typescript
// ❌ Bad: Console in library code
// In packages/some-lib/src/index.ts
console.log('Processing data...');

// ✅ Good: Structured logging in libraries
import { logger } from './logger.js';
logger.info('Processing data', { dataSize: data.length });

// ✅ Good: Console in CLI tools
// In packages/cli/src/commands/init.ts
console.log('🚀 Initializing project...');
```

## Metrics and Success Criteria

Track these metrics to measure effectiveness:

1. **Pre-commit Prevention Rate**: % of issues caught before commit
2. **CI Detection Rate**: % of issues caught in CI vs review
3. **Auto-fix Success Rate**: % of issues automatically fixed
4. **Review Time Reduction**: Decrease in time spent on common issues
5. **False Positive Rate**: % of warnings that are incorrect

## Maintenance

### Adding New Rules

1. Identify pattern from code reviews
2. Add to `custom-lint-rules.ts` or `biome.enhanced.json`
3. Update pre-commit validation if needed
4. Document in this file
5. Test with known examples

### Updating Templates

1. Edit `jsdoc-templates.ts`
2. Update VS Code snippets
3. Communicate changes to team

### Performance Tuning

- Monitor pre-commit hook execution time
- Keep validation under 5 seconds for good DX
- Use caching where possible
- Run expensive checks only in CI

## Troubleshooting

### Pre-commit Hooks Not Running
```bash
# Reinstall hooks
bun run prepare
```

### False Positives
- Add inline suppressions with explanation
- Update rule configuration if pattern is valid
- Document exceptions in code

### Performance Issues
- Run validation on staged files only
- Use `--no-verify` flag for emergency commits (use sparingly)
- Report consistently slow operations for optimization

## Future Enhancements

- [ ] IDE plugins for real-time validation
- [ ] Custom Biome rules via plugins
- [ ] Machine learning-based pattern detection
- [ ] Automated fix generation for complex patterns
- [ ] Integration with code review tools beyond GitHub
- [ ] Performance profiling and optimization
- [ ] Team-specific rule configurations

## Conclusion

This prevention pipeline shifts quality checks left, catching issues earlier when they're cheaper and easier to fix. By automating the detection of common patterns, developers can focus on logic and architecture rather than style and conventions.