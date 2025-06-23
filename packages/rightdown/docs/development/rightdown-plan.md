# Rightdown 2.0 Development Plan

## Overview

This document tracks the development of Rightdown 2.0, a unified Markdown formatting orchestrator that coordinates code formatters (Prettier, Biome) for code blocks within markdown files.

## Architecture

### Core Components

```text
rightdown/
├── src/
│   ├── core/
│   │   ├── config-reader.ts      # Reads .rightdown.config.yaml
│   │   ├── config-compiler.ts    # Generates tool-specific configs
│   │   └── orchestrator.ts       # Coordinates all tools
│   ├── formatters/
│   │   ├── base.ts              # Base formatter interface
│   │   ├── prettier.ts          # Prettier integration (peer dep)
│   │   ├── biome.ts            # Biome integration (peer dep)
│   │   └── markdownlint.ts    # Existing markdownlint wrapper
│   ├── processors/
│   │   ├── code-block.ts       # Extract/replace code blocks using AST
│   │   └── ast.ts              # Remark/unified AST processing
│   └── cli/
│       └── commands/
│           └── format.ts       # Enhanced format command
```

### Config Schema (Draft)

```yaml
# .rightdown.config.yaml
version: 2
preset: standard

# Markdown structure rules (markdownlint)
rules:
  blanks-around-lists: true
  single-trailing-newline: true

# Code block formatting
formatters:
  # Default formatter for unknown languages
  default: prettier
  
  # Language-specific formatters
  languages:
    javascript: biome
    typescript: biome
    jsx: biome
    tsx: biome
    json: biome
    jsonc: biome
    yaml: prettier
    css: prettier
    html: prettier
    markdown: prettier  # For nested markdown

# Formatter-specific options
formatterOptions:
  prettier:
    printWidth: 80
    tabWidth: 2
    semi: true
  biome:
    # Biome-specific options
    indentStyle: space
    indentWidth: 2

# Output configuration
output:
  # Where to write generated configs (optional)
  configs:
    markdownlint: .markdownlint-cli2.jsonc
    prettier: false  # Don't generate, use API
    biome: false     # Don't generate, use API
```

## Implementation Phases

### Phase 1: Foundation (Week 1)
- [ ] Set up new directory structure
- [ ] Create base formatter interface
- [ ] Implement config reader for v2 schema
- [ ] Implement config validation for v2 schema

### Phase 2: Prettier Integration (Week 2)
- [ ] Add Prettier as dependency
- [ ] Implement code block extraction/replacement
- [ ] Create Prettier formatter adapter
- [ ] Test with various code block languages

### Phase 3: Biome Integration (Week 3)
- [ ] Add Biome as optional peer dependency
- [ ] Create Biome formatter adapter
- [ ] Implement language routing logic
- [ ] Test JS/TS formatting

### Phase 4: Orchestration (Week 4)
- [ ] Build orchestrator to coordinate tools
- [ ] Implement parallel processing for performance
- [ ] Add progress reporting
- [ ] Handle errors gracefully

### Phase 5: Polish & Release (Week 5-6)
- [ ] Performance optimization
- [ ] Comprehensive test suite
- [ ] Documentation updates
- [ ] CLI command implementation
- [ ] Integration testing

## Technical Decisions

### Dependencies

**Core Dependencies** (required):
- `markdownlint-cli2` - Markdown linting engine
- `remark` & `unified` - AST parsing for code block extraction
- `@outfitter/contracts` - Error handling patterns

**Peer Dependencies** (optional):
- `prettier` - Code formatting (optional peer dependency)
- `@biomejs/biome` - Fast JS/TS formatting (optional peer dependency)
- Future: `eslint` - Additional JS/TS linting

All formatters are peer dependencies to:
- Avoid version conflicts with existing project setups
- Allow global installations (`npm i -g prettier`)
- Keep bundle size minimal for basic usage
- Let users control formatter versions

### Features
- Simple YAML configuration with version 2 format
- Preset support (strict, standard, relaxed)
- Language-specific formatter routing

### Performance Considerations
- Parallelize code block formatting
- Cache formatted results
- Lazy load optional formatters
- Stream processing for large files

### Configuration Drift Detection

Rightdown can detect when generated configs have drifted from what would be generated:

```bash
# Check if existing tool configs match what Rightdown would generate
rightdown --check-drift

# Example output:
# ⚠️  Configuration drift detected:
#   .markdownlint-cli2.jsonc: 3 differences found
#   .prettierrc.json: File missing (would be generated)
# 
# Run 'rightdown --write-configs' to update configurations
```

This helps teams:
- Identify manual changes to tool configs
- Ensure consistency across projects
- Validate CI configurations match local development

## CLI Contract

Rightdown 2.1 must remain drop-in compatible with the existing CLI while surfacing the
new functionality.  The following contract is **binding** for the first public beta
(`2.1.0-beta.1`) and therefore drives the automated test-suite.

### Commands & Flags

| Command / Flag            | Alias | Description                                                                |
|---------------------------|-------|----------------------------------------------------------------------------|
| `rightdown`              |       | Lint/format all Markdown files (respecting `preset` or config file)        |
| `rightdown --fix`        | `-f`  | Format in-place (structure **and** code-blocks)                            |
| `rightdown --check`      | `-c`  | Run in CI mode: no writes, non-zero exit on any difference                 |
| `rightdown --dry-run`    | `-n`  | Preview what would be changed without writing files                        |
| `rightdown --init [lvl]` |       | Scaffold `.rightdown.config.yaml` (`lvl` = `strict|standard|relaxed`)       |
| `rightdown --config <p>` | `-C`  | Use explicit config path                                                   |
| `rightdown --version`    | `-v`  | Print version + detected tool versions (Prettier, Biome, markdownlint)     |
| `rightdown --write-configs` |     | Write generated tool configs (for debugging)                              |
| `rightdown --check-drift` |       | Check if generated configs differ from existing ones                      |

### Exit Codes

| Code | Meaning                                |
|------|----------------------------------------|
| 0    | No issues detected                     |
| 1    | Lint/formatting errors found           |
| 2    | Configuration error or invalid flag    |
| 3    | Unexpected runtime error              |

The exit-code matrix is used by both CI fixtures and unit tests (see **Testing
Strategy**).

## Definition of Done (DoD)

The feature is considered **complete** when ALL items are ✅.

1. ✅ `rightdown --fix` formats code-blocks for the languages defined in the
   default schema (JS/TS/JSON/YAML/HTML/CSS/Markdown).
2. ✅ `.rightdown.config.yaml` v2 is validated against a JSON schema at runtime;
   helpful diagnostics are printed on failure.
3. ✅ Simple configuration format with presets.
4. ✅ Generated configs are written **only** when `--write-configs` is passed;
   otherwise they are built in-memory.
5. ✅ Optional Biome peer-dependency is lazily required; a clear warning is shown
   if a user assigns `biome` as a formatter but the package is missing.
6. ✅ Performance: formatting the fixture set (<250 files, 1 CPU core) completes
   in ≤1.5× the time of running raw markdownlint-cli2 alone.
7. ✅ Test coverage ≥ 90 % on core orchestrator, formatters, and CLI flags.
8. ✅ Documentation (README & website) updated.
9. ✅ `rightdown --dry-run` shows what would change without modifying files;
   exits with code 1 if changes would be made (CI-friendly).
10. ✅ `rightdown --check-drift` detects configuration drift between Rightdown
    config and generated tool configs; provides actionable feedback.

## Risk Register

| Risk                                      | Impact | Likelihood | Mitigation                                         |
|-------------------------------------------|--------|------------|----------------------------------------------------|
| Biome size inflates install footprint     | High   | Medium     | Peer-dependency, lazy import, document tree-shaking|
| Formatter version conflicts               | Medium | Medium     | Pin recommended versions in generated `package.json`|
| Prettier v3 ESM-only in Node <18          | High   | Low        | Document minimum engine, load via dynamic import   |
| Large monorepos → OOM when compiling configs | Medium | Low     | Stream processing & file chunking                  |
| Unformatted exotic languages              | Low    | High       | Fallback : skip with verbose warning               |


## Testing Strategy

### Unit Tests
- Config reading/compilation
- Individual formatter adapters
- Code block extraction/replacement
- Error handling

### Integration Tests
- Full formatting pipeline
- Multiple formatters together
- Large file handling
- Edge cases (empty blocks, nested languages)

### E2E Tests
- CLI commands with various options
- Real-world markdown files
- Performance benchmarks

## Monorepo Usage

### As a Dependency

When using Rightdown as a dependency in a monorepo:

```json
{
  "devDependencies": {
    "@outfitter/rightdown": "^2.1.0"
  }
}
```

### Root Configuration

For the Outfitter monorepo itself, we'll use Rightdown at the root:

```yaml
# .rightdown.config.yaml at monorepo root
version: 2
preset: standard

# Override for consistency with monorepo conventions
rules:
  line-length: false  # Handled by Prettier
  
formatters:
  default: prettier
  languages:
    javascript: biome
    typescript: biome
    json: biome
    jsonc: biome

# Monorepo-specific ignores
ignores:
  - "packages/*/dist/**"
  - "packages/*/build/**"
  - "packages/*/coverage/**"
  - "**/node_modules/**"
  - "**/.turbo/**"
```

### Workspace Integration

Rightdown respects pnpm workspaces:

```bash
# Run from monorepo root
pnpm rightdown --fix

# Run in specific package
pnpm --filter @outfitter/cli rightdown --check

# Run across all packages
pnpm -r rightdown --fix
```

## CI Integration

### GitHub Actions

```yaml
name: Lint Markdown
on: [push, pull_request]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      
      - run: pnpm install --frozen-lockfile
      - run: pnpm rightdown --check
        
      # Optional: Check for config drift
      - run: pnpm rightdown --check-drift
```

### Pre-commit Hook

```bash
#!/bin/sh
# .husky/pre-commit

# Check markdown files
pnpm rightdown --check --dry-run || {
  echo "Markdown formatting issues found. Run 'pnpm rightdown --fix' to fix."
  exit 1
}
```

### Continuous Deployment

```yaml
# Validate formatting before deploy
- name: Validate Markdown
  run: |
    pnpm rightdown --check
    pnpm rightdown --check-drift
```

## Implementation Strategy

### Test-First Development

Following TDD principles, we'll create comprehensive test fixtures before implementation:

1. **Test Fixtures** (`src/__tests__/fixtures/`):
   ```
   fixtures/
   ├── markdown/
   │   ├── basic.md              # Simple markdown with code blocks
   │   ├── nested-blocks.md      # Nested code blocks
   │   ├── mixed-languages.md   # Multiple language blocks
   │   ├── edge-cases.md        # Malformed blocks, edge cases
   │   └── large-file.md        # Performance testing
   ├── configs/
   │   ├── no-version.yaml      # Config without version field
   │   ├── v2-basic.yaml        # Simple v2 config
   │   ├── v2-full.yaml         # All features
   │   └── v2-invalid.yaml      # Invalid config for error testing
   └── expected/
       ├── basic.formatted.md    # Expected output
       └── ...                   # Expected for each fixture
   ```

2. **Test Categories**:
   - Unit tests for each component (config reader, formatters, etc.)
   - Integration tests for full pipeline
   - Performance benchmarks
   - CLI command tests
   - Error handling scenarios

3. **Implementation Order**:
   - Write tests for config reader → Implement config reader
   - Write tests for AST processor → Implement AST processor
   - Write tests for formatters → Implement formatters
   - Write tests for orchestrator → Implement orchestrator
   - Write tests for CLI → Update CLI

## Next Steps

1. Create feature branch ✓
2. Set up development environment
3. Create comprehensive test fixtures
4. Implement components test-first
5. Build incrementally with full test coverage

## Success Criteria

- [ ] Single command formats everything
- [ ] Performance comparable to individual tools
- [ ] Clear documentation and examples
- [ ] No breaking changes
- [ ] Comprehensive test coverage
- [ ] Well-documented APIs

*(See the detailed Definition-of-Done checklist above for the authoritative
criteria.)*