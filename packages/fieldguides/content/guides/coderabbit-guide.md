---
slug: coderabbit-guide
title: CodeRabbit Configuration Guide
description: Configure AI-powered code reviews that enforce your team's standards and catch issues before they reach production.
type: guide
---

# CodeRabbit Configuration Guide

Configure AI-powered code reviews that enforce your team's standards and catch issues before they reach production.

## OVERVIEW

CodeRabbit = AI code reviewer → Automated PR feedback → Enforces standards → Catches issues early. This guide provides **actionable configurations** for different project types with structured output for AI implementation.

## CONFIGURATION DECISION TREE

### Profile Selection

```yaml
# Use "chill" profile when:
# - New to CodeRabbit → Learning curve needed
# - Small team or solo → Less noise preferred
# - Mature codebase → Good practices established
# - Open source → Community-friendly approach
profile: "chill" # Preferred for most projects

# Use "assertive" profile when:
# - Security-critical apps → Every issue matters
# - Training juniors → Detailed feedback helps
# - AI agent workflows → Structured output needed
# - Large teams → Consistency enforcement critical
profile: "assertive" # Comprehensive feedback mode
```

### Tool Selection Strategy

```yaml
# ALWAYS enable (universal):
tools:
  markdownlint: { enabled: true } # Documentation quality
  gitleaks: { enabled: true } # Security scanning
  github-checks: { enabled: true } # CI integration
  yamllint: { enabled: true } # Config validation

  # Language-specific (choose ONE per category):
  # JavaScript/TypeScript:
  eslint: { enabled: true } # Traditional, configurable
  # OR
  biome: { enabled: false } # Modern, fast, opinionated

  # Python:
  ruff: { enabled: true } # Fast, modern
  # OR
  pylint: { enabled: false } # Traditional, thorough
```

## STRUCTURED TONE INSTRUCTIONS

### For AI Agent Integration

````yaml
tone_instructions: |
  # Output structured feedback for machine parsing:
  # Format: ISSUE_ID | SEVERITY | CATEGORY | FILE:LINES | FIX_AVAILABLE

  # Example output:
  # SEC-001 | CRITICAL | Security | src/auth.ts:45-47 | YES
  # PERF-002 | MEDIUM | Performance | src/api.ts:120-125 | YES
  # TYPE-003 | HIGH | Types | src/models.ts:15 | YES

  # When FIX_AVAILABLE = YES, include:
  # ```language
  # // Exact replacement code for FILE:LINES
  # ```
````

### Project-Specific Templates

```yaml
# FOR LIBRARIES:
tone_instructions: |
  Focus on API stability, breaking changes, and downstream impact.
  Every public API change = potential breaking change.
  Flag: [BREAKING] for API changes, [DEPRECATED] for old patterns.
  Verify: Semantic versioning matches changes.

# FOR SECURITY-CRITICAL:
tone_instructions: |
  Zero tolerance for security issues. Flag all risks.
  Format: [SECURITY:SEVERITY] Description
  - CRITICAL: RCE, auth bypass, data exposure
  - HIGH: XSS, SQL injection, path traversal
  - MEDIUM: Missing validation, weak crypto
  Include: CWE/CVE references where applicable.

# FOR LEARNING/TRAINING:
tone_instructions: |
  Educational approach for skill development.
  Include: Why issue matters + How to fix + Link to docs.
  Format:
  ISSUE: Description
  WHY: Impact explanation
  FIX: Step-by-step solution
  LEARN: Documentation link
```

## COMPLETE CONFIGURATION EXAMPLES

### TypeScript NPM Package

```yaml
# yaml-language-server: $schema=https://coderabbit.ai/integrations/schema.v2.json
language: 'en-US'
early_access: false

tone_instructions: |
  You are reviewing a TypeScript library published to NPM.
  Focus: API stability, TypeScript types, breaking changes.
  Flag as: [BREAKING] for API changes, [TYPES] for TS issues, [SECURITY] for vulnerabilities.
  Every export change = potential breaking change for consumers.

reviews:
  profile: 'assertive' # Thorough for public APIs
  request_changes_workflow: true # Block on breaking changes
  high_level_summary: true
  poem: false

  labeling_instructions:
    - label: 'breaking-change'
      instructions: 'Apply when: exports change, types change, behavior changes'
    - label: 'semver-major'
      instructions: 'Apply when: breaking changes require major version bump'
    - label: 'types'
      instructions: 'Apply when: TypeScript types need improvement'

  path_instructions:
    - path: '**/index.ts'
      instructions: |
        CRITICAL: Public API surface. Any change may break consumers.
        - Check: All exports intentional
        - Verify: Types are explicit, not inferred
        - Flag: Removed/changed exports as [BREAKING]

    - path: '**/*.ts'
      instructions: |
        - No 'any' types → Suggest: unknown, generics, or specific types
        - All public functions need JSDoc
        - Prefer readonly arrays/objects for inputs
        - Use branded types for IDs/tokens

    - path: '**/*.test.ts'
      instructions: |
        - Test the public API, not internals
        - Include type tests for exports
        - Test error messages (consumers depend on them)

tools:
  # Core tools
  eslint: { enabled: true }
  ast-grep: { enabled: true, essential_rules: true }

  # Security
  gitleaks: { enabled: true }
  semgrep: { enabled: true }

  # npm-specific
  npm-audit: { enabled: true } # Check dependencies

  path_filters:
    - 'src/**'
    - '!**/*.test.ts' # Skip test files initially
    - '!node_modules/**'
```

### Python FastAPI Service

```yaml
# yaml-language-server: $schema=https://coderabbit.ai/integrations/schema.v2.json
language: 'en-US'

tone_instructions: |
  Reviewing production FastAPI service.
  Priority: Security > Performance > Code quality.
  Flag: [SECURITY:LEVEL], [PERFORMANCE], [ASYNC-ISSUE].
  Check: SQL injection, auth bypass, N+1 queries.

reviews:
  profile: 'assertive'

  path_instructions:
    - path: '**/routes/*.py'
      instructions: |
        - Verify: All endpoints have authentication
        - Check: Input validation with Pydantic
        - Flag: Raw SQL queries (use ORM)
        - Verify: Rate limiting on public endpoints

    - path: '**/models/*.py'
      instructions: |
        - All fields need type hints
        - Pydantic models: Use validators
        - SQLAlchemy: Check for N+1 queries

    - path: '**/auth/*.py'
      instructions: |
        CRITICAL: Authentication/authorization code
        - No hardcoded secrets
        - Verify: Token expiration
        - Check: Password hashing (bcrypt/argon2)

tools:
  ruff: { enabled: true }
  bandit: { enabled: true } # Security
  semgrep: { enabled: true }
  mypy: { enabled: true } # Type checking
```

### Documentation Repository

```yaml
# yaml-language-server: $schema=https://coderabbit.ai/integrations/schema.v2.json
language: 'en-US'

tone_instructions: |
  Focus: Clarity, accuracy, completeness.
  Check: Broken links, code examples, formatting.
  Verify: Examples are runnable and correct.
  Flag: [BROKEN-LINK], [BAD-EXAMPLE], [OUTDATED].

reviews:
  profile: 'chill' # Friendly for docs
  poem: true # Community touch

  path_instructions:
    - path: '**/*.md'
      instructions: |
        - Verify: Markdown formatting (ATX headers, lists)
        - Check: Code blocks have language tags
        - Test: Internal links work ([text](./path))
        - Flag: TODO/FIXME comments
        - Ensure: Examples match current API

    - path: '**/README.md'
      instructions: |
        Critical: First impression for users
        - Check: Installation instructions complete
        - Verify: Quick start actually works
        - Ensure: License and contributing info

tools:
  markdownlint: { enabled: true }
  languagetool:
    enabled: true
    level: 'picky' # Strict for docs

  # Disable code tools for doc repos
  eslint: { enabled: false }
  ruff: { enabled: false }
```

## PATH-SPECIFIC INSTRUCTIONS

### Context-Aware Rules

```yaml
reviews:
  path_instructions:
    # PUBLIC APIs - Highest scrutiny
    - path: '**/index.{ts,js,py}'
      instructions: |
        CRITICAL: Public API surface
        Every change = potential breaking change
        Flag: [BREAKING] for any modifications
        Require: Explicit exports, full docs

    # TESTS - Different standards
    - path: '**/*.{test,spec}.{ts,js,py}'
      instructions: |
        Focus: Test quality over style
        Allow: Inline data, repetition for clarity
        Check: Edge cases, error paths, async handling
        Skip: Documentation requirements

    # GENERATED CODE - Skip review
    - path: '**/*.generated.{ts,js,py}'
      instructions: 'SKIP: Generated code - do not review'

    # SECURITY-SENSITIVE
    - path: '**/auth/**'
      instructions: |
        SECURITY CRITICAL - Extra scrutiny
        Zero tolerance for vulnerabilities
        Check: Every auth decision, token handling
        Flag: Any suspicious patterns

    # CONFIGS - Special handling
    - path: '**/{package.json,pyproject.toml,go.mod}'
      instructions: |
        Check: Version bumps follow semver
        Verify: No unnecessary dependencies
        Security: Run vulnerability scan
        License: Check compatibility
```

## AI AGENT STRUCTURED OUTPUT

### Machine-Parseable Format

````yaml
tone_instructions: |
  # Structured output for automation:
  # One issue per line, pipe-delimited

  # Format:
  # ID|SEVERITY|CATEGORY|FILE|LINES|FIX_AVAILABLE|DESCRIPTION

  # Severity: CRITICAL > HIGH > MEDIUM > LOW
  # Categories: Security|Performance|Types|Breaking|Style|Test
  # Fix: YES (automated) | MANUAL (human needed) | NO (informational)

  # After issue list, include fixes:
  # --- FIXES ---
  # ID: <issue_id>
  # ```language
  # <replacement code>
  # ```
````

### GitHub Issue Creation

````yaml
tone_instructions: |
  # Group related issues for bulk creation:

  ## 🚨 Critical Issues Requiring Immediate Attention

  ### Security Vulnerabilities (3 issues)
  - [ ] **[SEC-001]** SQL injection in user.py:45 
  - [ ] **[SEC-002]** Missing auth check in api.py:78
  - [ ] **[SEC-003]** Hardcoded API key in config.py:12

  ### Breaking Changes (2 issues)  
  - [ ] **[BRK-001]** Removed export in index.ts:34
  - [ ] **[BRK-002]** Changed function signature in lib.ts:56

  ## Suggested Fixes
  <details>
  <summary>Click to expand fixes</summary>

  ### SEC-001 Fix:
  ```python
  # Replace line 45 in user.py
cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
````

  </details>
```

## PERFORMANCE OPTIMIZATION

### Large Codebases

```yaml
reviews:
  # Limit scope to avoid timeouts
  path_filters:
    - 'src/**' # Only source code
    - '!**/*.test.*' # Skip tests initially
    - '!**/vendor/**' # Skip vendored code
    - '!**/*.min.js' # Skip minified files
    - '!**/generated/**' # Skip generated code

  # Incremental rollout
  auto_review:
    enabled: true
    # Week 1: Start with utils
    base_branches: ['feat/coderabbit-test']

tools:
  # Disable expensive tools for large PRs
  ast-grep:
    enabled: true
    essential_rules: true # Only critical rules

  # Increase timeout for large repos
  github-checks:
    enabled: true
    timeout_ms: 300000 # 5 minutes
```

### Monorepo Configuration

```yaml
reviews:
  path_instructions:
    # Frontend app
    - path: 'apps/web/**/*.{ts,tsx}'
      instructions: |
        Focus: React patterns, performance, accessibility
        Check: Hooks usage, memoization, event handlers

    # Backend services
    - path: 'services/api/**/*.py'
      instructions: |
        Focus: API design, security, performance
        Check: Input validation, auth, query optimization

    # Shared packages
    - path: 'packages/**/*.ts'
      instructions: |
        CRITICAL: Shared code affects all apps
        Any change = potential breaking change
        Require: Extensive tests, full documentation

    # Different standards for different packages
    - path: 'packages/ui/**'
      instructions: 'Focus: Accessibility, responsive design'
    - path: 'packages/utils/**'
      instructions: 'Focus: Type safety, tree shaking'
```

## COMMON PITFALLS & SOLUTIONS

### Configuration Mistakes

```yaml
# ❌ BAD: Conflicting tools
tools:
  eslint: { enabled: true }
  biome: { enabled: true }  # Don't enable both!

# ✅ GOOD: Choose one
tools:
  eslint: { enabled: true }
  biome: { enabled: false }  # Explicitly disabled

# ❌ BAD: Vague instructions
path_instructions:
  - path: "**/*.ts"
    instructions: "Review the code"

# ✅ GOOD: Specific, actionable
path_instructions:
  - path: "**/*.ts"
    instructions: |
      - No 'any' types - suggest specific alternatives
      - Check error handling - try/catch or Result types
      - Verify null checks - use optional chaining
```

### Performance Issues

```yaml
# ❌ BAD: Reviewing everything
path_filters: ["**/*"]  # Too broad

# ✅ GOOD: Focused review
path_filters:
  - "src/**"
  - "!**/*.test.*"
  - "!node_modules/**"
  - "!dist/**"
```

## TESTING YOUR CONFIGURATION

### Progressive Rollout Plan

```yaml
# Week 1: Documentation only
reviews:
  path_filters: ["**/*.md"]
  auto_review:
    base_branches: ["test/coderabbit-docs"]

# Week 2: Add type definitions
reviews:
  path_filters: ["**/*.md", "**/*.d.ts"]
  auto_review:
    base_branches: ["test/coderabbit-types"]

# Week 3: Add source code
reviews:
  path_filters: ["**/*.md", "**/*.ts", "!**/*.test.ts"]
  auto_review:
    base_branches: ["develop"]

# Week 4: Full coverage
reviews:
  path_filters: ["src/**", "tests/**"]
  auto_review:
    base_branches: ["develop", "main"]
```

### Success Metrics

```yaml
# Track these metrics:
# - Comments per PR: Should decrease over time
# - False positive rate: < 10% target
# - Developer satisfaction: Survey monthly
# - Time to merge: Should improve
# - Bugs caught: Track prevented issues

# Adjust based on metrics:
tone_instructions: |
  # If too many comments: Add to instructions:
  Focus on HIGH/CRITICAL issues only.
  Skip style nitpicks unless they impact readability.

  # If missing issues: Add to instructions:  
  Be thorough. Check edge cases and error paths.
  Flag potential issues even if uncertain.
```

## INTEGRATION WITH CI/CD

### GitHub Actions Integration

```yaml
# Ensure CodeRabbit runs before other checks
tools:
  github-checks:
    enabled: true
    timeout_ms: 300000 # 5 min for CodeRabbit

# .github/workflows/ci.yml integration:
# jobs:
#   coderabbit:
#     runs-on: ubuntu-latest
#     steps:
#       - name: Wait for CodeRabbit
#         run: |
#           # Wait for CodeRabbit checks to complete
#           gh pr checks ${{ github.event.pull_request.number }} --watch
```

### Conventional Commits Integration

```yaml
reviews:
  labeling_instructions:
    - label: 'fix'
      instructions: "Apply when PR title or commits start with 'fix:'"
    - label: 'feat'
      instructions: "Apply when PR title or commits start with 'feat:'"
    - label: 'breaking'
      instructions: "Apply when PR title or commits contain 'BREAKING CHANGE:'"
    - label: 'docs'
      instructions: "Apply when PR title or commits start with 'docs:'"
```

## QUICK START TEMPLATES

### Choose Your Template

```yaml
# 1. Copy the relevant template below
# 2. Save as .coderabbit.yaml in repo root
# 3. Customize tone_instructions for your needs
# 4. Test on a small PR first
# 5. Iterate based on results
```

### Minimal Secure Default

```yaml
# yaml-language-server: $schema=https://coderabbit.ai/integrations/schema.v2.json
language: 'en-US'
reviews:
  profile: 'chill'
tools:
  markdownlint: { enabled: true }
  gitleaks: { enabled: true }
  github-checks: { enabled: true }
```

### AI-Ready Template

```yaml
# yaml-language-server: $schema=https://coderabbit.ai/integrations/schema.v2.json
language: 'en-US'
tone_instructions: |
  Output format: ID|SEVERITY|CATEGORY|FILE:LINE|FIX
  Severity: CRITICAL|HIGH|MEDIUM|LOW
  Fix: YES with code block, or NO
reviews:
  profile: 'assertive'
  poem: false
tools:
  gitleaks: { enabled: true }
  semgrep: { enabled: true }
  eslint: { enabled: true }
```
