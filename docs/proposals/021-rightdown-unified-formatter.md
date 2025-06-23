# Proposal: Rightdown as a Unified Markdown Formatting Orchestrator

## Summary

Transform Rightdown from a markdownlint wrapper into a comprehensive Markdown formatting orchestrator that unifies Prettier, Remark, and markdownlint-cli2 under a single configuration format, while allowing gradual internalization of functionality over time.

## Background

Currently, Rightdown is a thin wrapper around markdownlint-cli2 that adds presets and custom rules. However, this leaves gaps:

- Code blocks inside Markdown files are not formatted
- Multiple tools are needed for comprehensive Markdown handling
- Each tool requires its own configuration format
- Projects need to manage multiple dependencies

## Proposal

### Phase 1: Rightdown 2.1 - The Orchestrator

Transform Rightdown into a meta-tool that orchestrates multiple best-in-class tools:

```yaml
# .rightdown.config.yaml - Single source of truth
version: 2
preset: standard

# Markdown structure rules (markdownlint)
rules:
  blanks-around-lists: true
  single-trailing-newline: true
  # ... other rules

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
    markdown: prettier  # For nested markdown
    html: prettier
    css: prettier
    scss: prettier
    graphql: prettier
    python: prettier  # If prettier-python plugin available
    
    # Future: could add language-specific formatters
    # rust: rustfmt
    # go: gofmt

# Formatter-specific options
formatterOptions:
  prettier:
    printWidth: 80
    tabWidth: 2
    semi: true
  biome:
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

### Implementation Details

1. **Config Compilation**: Rightdown reads its config and generates appropriate configs for each tool:
   ```
   .rightdown.config.yaml → .markdownlint-cli2.jsonc
                         → .prettierrc.json (scoped to code blocks)
                         → biome.json (for code blocks)
   ```

2. **Intelligent Routing**: Based on code block languages, route to appropriate formatter:
   ```javascript
   async function formatCodeBlock(code, language) {
     const formatter = config.codeFormatters[language] || 'prettier';
     
     switch (formatter) {
       case 'biome':
         return formatWithBiome(code, language);
       case 'prettier':
         return formatWithPrettier(code, language);
       default:
         return code; // Unknown formatter, leave as-is
     }
   }
   ```

3. **Single Command Interface**:
   ```bash
   rightdown              # Lint/format all Markdown files
   rightdown --fix        # Fix everything (structure + code blocks)
   rightdown --check      # CI mode: no writes, exit 1 on differences
   rightdown --dry-run    # Preview changes without writing files
   rightdown --init       # Create config with formatter detection
   rightdown --config <p> # Use explicit config path
   rightdown --version    # Show version + detected formatters
   rightdown --write-configs # Write generated tool configs
   rightdown --check-drift  # Check if configs have drifted
   ```

### Benefits

1. **Single Dependency**: Projects only need `@outfitter/rightdown`
2. **Single Config**: One YAML file controls everything
3. **Best Tool for Each Job**: Use Biome for TS/JS, Prettier for others
4. **Gradual Evolution**: Can internalize formatters over time
5. **No Breaking Changes**: As we improve, the config format stays stable

### Migration Path

```jsonc
// ***Dependency strategy***
// We keep the dependency surface minimal and use **peerDependencies** for the
// heavy-weight formatters that consuming repos may already have installed.

{
  // Phase 1 – Orchestrator (Rightdown 2.1)
  "dependencies": {
    "markdownlint-cli2": "^0.15.0",
    "remark": "^15.0.0",            // optional but bundled for AST features
    "unified": "^11.0.0"            // remark peer
  },
  "peerDependencies": {
    "prettier": "^3.0.0",            // ESM-only – require Node >=18.12
    "@biomejs/biome": "^2.0.0"       // biome is heavy; peer keeps install size down
  },

  // Phase 2 – Partial internalisation (Rightdown 3.0)
  // We may drop markdownlint-cli2 and embed the rule engine, but this stays
  // out of scope for 2.x.
  "optionalDependencies": {
    "prettier-plugin-python": "*"      // example: extra formatters auto-detected
  }
}
```

### Configuration Examples

**Basic Setup**:
```yaml
preset: standard
```

**Advanced Setup**:
```yaml
preset: strict

# Override specific rules
rules:
  line-length: 100
  
# Custom code formatters
formatters:
  languages:
    javascript: biome
    typescript: biome
    sql: none  # Don't format SQL blocks
  
# Ignore patterns
ignores:
  - "vendor/**"
  - "*.generated.md"
```

**Monorepo Setup**:

```yaml
version: 2
preset: standard

# Monorepo-specific overrides
rules:
  line-length: false  # Let Prettier handle this
  
formatters:
  default: prettier
  languages:
    javascript: biome
    typescript: biome
    json: biome
    
# Monorepo ignores
ignores:
  - "packages/*/dist/**"
  - "packages/*/build/**"
  - "**/node_modules/**"
  - "**/.turbo/**"
```

**IDE Integration**:
```yaml
# Also generate configs for IDEs
ide:
  vscode: true  # Generate .vscode/settings.json
  intellij: true  # Generate .idea configs
```

### Technical Architecture

```
rightdown/
├── src/
│   ├── core/
│   │   ├── config-reader.ts      # Reads .rightdown.config.yaml
│   │   ├── config-compiler.ts    # Generates tool-specific configs
│   │   └── orchestrator.ts       # Coordinates all tools
│   ├── formatters/
│   │   ├── base.ts              # Base formatter interface
│   │   ├── prettier.ts          # Prettier integration
│   │   ├── biome.ts            # Biome integration
│   │   └── markdownlint.ts    # Existing markdownlint wrapper
│   ├── processors/
│   │   ├── code-block.ts       # Extract/replace code blocks
│   │   └── remark.ts          # Future: Remark AST processing
│   └── cli/
│       └── commands/
│           └── format.ts       # Enhanced format command
```

### CI Integration

**GitHub Actions**:

```yaml
- name: Check Markdown
  run: pnpm rightdown --check

- name: Verify No Drift
  run: pnpm rightdown --check-drift
```

**Pre-commit Hooks**:

```bash
# .husky/pre-commit
pnpm rightdown --dry-run || {
  echo "Markdown issues found. Run 'pnpm rightdown --fix'"
  exit 1
}
```

### Future Possibilities

1. **Smart Language Detection**: Auto-detect available formatters
2. **Performance Mode**: Parallel processing of large documents
3. **Watch Mode**: Format on save with incremental processing
4. **Plugin System**: Allow custom formatters and processors
5. **Cloud Formation**: Format via API for CI/CD pipelines
6. **Configuration Sync**: Auto-sync tool configs with Rightdown config
7. **Monorepo Awareness**: Inherit configs from parent directories

## Alternatives Considered

1. **Just Use Prettier**: Doesn't provide Markdown-specific linting rules
2. **Multiple Tools**: Current approach - requires multiple configs and dependencies
3. **Fork markdownlint**: Too much maintenance burden
4. **Build From Scratch**: Reinventing wheels that already work well

## Implementation Plan

1. **Research Phase**: Test integration patterns with each tool
2. **Config Design**: Finalize the unified config schema
3. **MVP**: Basic orchestration with Prettier + markdownlint
4. **Biome Integration**: Add Biome for JS/TS code blocks
5. **Remark Integration**: Add AST processing capabilities
6. **Polish**: IDE configs, performance optimization
7. **Release**: Version 2.1.0 with migration guide

## Success Metrics

- Single command formats everything correctly
- Configuration is simpler than managing multiple tools
- Performance: ≤1.5× the time of raw markdownlint-cli2 alone
- Test coverage ≥90% on core components
- v1 configs continue to work unchanged
- Community adoption increases
- Clear path to future improvements

## Exit Codes

| Code | Meaning                                |
|------|----------------------------------------|
| 0    | No issues detected                     |
| 1    | Lint/formatting errors found           |
| 2    | Configuration error or invalid flag    |
| 3    | Unexpected runtime error              |

## Questions to Resolve

1. Should we embed common configs or fetch them?
2. How to handle version conflicts between tools?
3. Should the config compiler be a separate package?
4. How to handle formatter-specific options?
5. What's the best way to test the orchestration?

## Risk Mitigation

| Risk                                  | Impact | Mitigation                                          |
|---------------------------------------|--------|-----------------------------------------------------|
| Biome size inflates install           | High   | Keep Biome a peerDependency, lazy-import at runtime |
| Formatter version conflicts           | Medium | Pin versions, surface `--versions` diagnostics      |
| Prettier v3 ESM-only                  | High   | Dynamic import, require Node ≥ 18.12               |
| Large monorepo memory usage           | Medium | Stream processing & file chunking                   |
| Unformatted exotic languages          | Low    | Skip file with warning, expose formatter hooks      |

## Conclusion

By positioning Rightdown as an orchestrator rather than just a wrapper, we can provide immediate value while maintaining flexibility for future improvements. This approach allows us to leverage the best tools available today while building toward a more integrated solution tomorrow.