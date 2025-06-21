# ADR-0007: Refocus rightdown on markdownlint-cli2 and its Plugin Ecosystem

- **Status**: Proposed
- **Date**: 2025-06-19
- **Deciders**: Max

---

## Context and Problem Statement

`rightdown` currently provides a thin wrapper around `markdownlint-cli2` with custom presets and a terminology enforcement rule. While functional, it could deliver significantly more value by:

1. Being a true drop-in replacement for `markdownlint-cli2` - any existing usage should work unchanged
2. Adding valuable features on top (dry-run, watch mode, better presets)
3. Leveraging the rich ecosystem of markdownlint plugins
4. Progressively improving type safety without breaking compatibility

A core engineering principle is to favor simplicity and leverage battle-tested, standard tools wherever possible. The `markdownlint-cli2` ecosystem is robust and extensible, with community plugins that provide advanced formatting capabilities without requiring us to build custom solutions.

This proposal outlines a focused direction: enhance rightdown to be a **superset** of markdownlint-cli2, maintaining 100% compatibility while adding developer-friendly features and type-safe rules.

## Decision Drivers

- **Simplicity & Maintainability**: Continue using markdownlint-cli2 as our single engine for all operations.
- **Zero Additional Complexity**: No new processing engines, no AST manipulation, no custom parsers.
- **Ecosystem Leverage**: Capitalize on the existing `markdownlint` community and its ecosystem of custom rule packages.
- **Performance**: Maintain the highly-performant Rust-based core for all linting and fixing operations.

## Proposed Solution: A Plugin-First Architecture

We will pivot mdmedic to be a curated distribution of `markdownlint-cli2` and a selection of powerful community plugins, tied together with our existing presets. This positions mdmedic as a "batteries-included" Markdown linter that provides immediate value.

### 1. Enhanced Presets with Plugin Integration

Our presets (`strict`, `standard`, `relaxed`) will be updated to not only configure built-in rules but also to enable and configure rules from third-party packages.

Key rules to implement (with TypeScript):
- **Typography rule** - Smart quotes, em-dashes, ellipses (inspired by `markdownlint-rule-foliant/typograph`)
- **Code block language** - Adds configurable default language to bare ``` blocks
- **Consistent terminology** - Already implemented, will port to TypeScript

**Proposed `.mdmedic.config.jsonc` with inline documentation:**

```jsonc
// .mdmedic.config.jsonc (Standard Preset)
// JSONC format allows comments for better developer experience
{
  // Extend base configuration (null = start fresh)
  "extends": null,
  
  // Default state for all rules
  "default": true,
  
  // Rules can use EITHER kebab-case names OR rule IDs (MD013)
  // Both work identically:
  "line-length": false,        // Same as MD013
  "MD013": false,              // Same as line-length
  
  // Built-in markdownlint rules with all options documented:
  "heading-style": {
    "style": "atx"             // Options: "atx" | "atx_closed" | "setext" | "setext_with_atx" | "setext_with_atx_closed"
  },
  
  "ul-style": {
    "style": "dash"            // Options: "consistent" | "asterisk" | "plus" | "dash" | "sublist"
  },
  
  "list-indent": {
    "space_after_marker": 1    // Number of spaces after list marker (default: 1)
  },
  
  // Custom rules provided by mdmedic:
  "consistent-terminology": {
    "terminology": [
      { "incorrect": "Javascript", "correct": "JavaScript" },
      { "incorrect": "NPM", "correct": "npm" }
    ]
  },
  
  "typography": {
    "quotes": true,            // Convert straight quotes to smart quotes
    "dashes": true,            // Convert -- to em-dash
    "ellipses": true          // Convert ... to ellipsis character
  },
  
  "code-block-language": {
    "default": "text",         // Language to add to bare ``` blocks
    "allowed": ["text", "bash", "js", "ts", "json", "yaml"]  // Optional: restrict languages
  },
  
  // Include additional custom rules
  "customRules": [
    "./node_modules/markdown-medic/dist/rules/consistent-terminology.js",
    "./node_modules/markdown-medic/dist/rules/code-block-language.js",
    "./node_modules/markdown-medic/dist/rules/typography.js"
  ]
}
```

### 2. Progressive Enhancement Strategy

We'll support three tiers of rules, allowing users to leverage the ecosystem while we progressively improve type safety:

**Tier 1: Community Rules (JavaScript)**
- Users can install any markdownlint rule package
- md-medic loads them dynamically with defensive error handling
- Configuration validated at runtime

**Tier 2: Verified Rules (Bundled)**
- Popular, well-tested community rules bundled as optionalDependencies
- We provide TypeScript type definitions for their configurations
- Graceful fallback if not available

**Tier 3: Native Rules (TypeScript)**
- Our own implementations with full type safety
- Start with high-value rules (terminology, code blocks, typography)
- Progressively replace Tier 2 rules as resources allow

**Example `package.json` - progressive approach:**

```json
// packages/markdown-medic/package.json
"dependencies": {
  // ... existing dependencies
  "diff": "^5.2.0"  // For dry-run mode
},
"optionalDependencies": {
  // Popular community rules
  "markdownlint-rule-search-replace": "^1.2.0",
  "markdownlint-rules-foliant": "^0.1.15"
},
"peerDependencies": {
  // Allow users to bring their own rules
  "markdownlint": ">=0.32.0"
}
```

### 3. User-Extensible Configuration

Users can easily add community rules to their setup using well-documented JSONC:

```jsonc
// .mdmedic.config.jsonc
{
  "extends": "standard",  // Use mdmedic preset: "strict" | "standard" | "relaxed"
  
  // Add community rules (must be installed separately)
  "customRules": [
    "markdownlint-rule-github",
    "./my-project/custom-rules/team-conventions.js"
  ],
  
  // Configure any rule using kebab-case OR rule ID:
  "line-length": false,          // Same as "MD013": false
  "typography": true,            // mdmedic native rule
  "github-issue-links": true,    // Community rule config
  
  // Full IntelliSense-like experience with options:
  "emphasis-style": {
    "style": "asterisk"          // Options: "consistent" | "asterisk" | "underscore"
  }
}
```

Installation is familiar to markdownlint users:
```bash
npm install -D markdownlint-rule-github
mdmedic check  # Works with all rules
```

The `init` command generates a fully-documented config:
```bash
mdmedic init standard  # Creates .mdmedic.config.jsonc with all options documented
```

### 3a. Pre-commit Integration

mdmedic will support pre-commit hooks out of the box:

```yaml
# .pre-commit-config.yaml
repos:
  - repo: https://github.com/outfitter/monorepo
    rev: mdmedic-v1.1.0
    hooks:
      - id: mdmedic
        args: ['--fix']  # Auto-fix on commit
        # or
      - id: mdmedic-check
        # Check only, fail if issues found
```

We'll provide a `.pre-commit-hooks.yaml` in the package:
```yaml
- id: mdmedic
  name: mdmedic formatter
  entry: mdmedic format
  language: node
  files: \.(md|markdown|mdc)$
  # Matches: README.md, api.v2.md, content.mdc, etc.
  
- id: mdmedic-check
  name: mdmedic checker
  entry: mdmedic check
  language: node
  files: \.(md|markdown|mdc)$
```

### 3b. Granular Strictness Control (Beyond Simple Ignoring)

Instead of just ignoring files, md-medic could support different strictness levels for different contexts:

**Inline Mode Control:**
```markdown
<!-- mdmedic:strict -->
This section enforces all rules strictly.

<!-- mdmedic:relaxed -->
This section uses relaxed rules (e.g., longer line lengths, no typography enforcement).

<!-- mdmedic:disable line-length,typography -->
Specific rules disabled here.

<!-- mdmedic:enable -->
Back to default rules.

<!-- mdmedic:preset technical -->
Use a different preset for this section.
```

**File/Directory-Level Control via `.mdmedicmode`:**
```
# Strict mode for docs
docs/**/*.md strict

# Relaxed for changelogs (dates, long lines OK)
CHANGELOG.md relaxed

# Standard for most code
*.md standard

# Custom mode for specific needs
legacy-docs/**/*.md line-length=120,typography=false

# Generated files get minimal rules
generated/**/*.md line-length=false,list-marker-space=false
```

**Implementation Approach:**
```typescript
interface StrictnessContext {
  preset: 'strict' | 'standard' | 'relaxed';
  overrides: Record<string, any>;
}

// Custom markdownlint rule that adjusts other rules dynamically
export = {
  names: ['MD999', 'mdmedic-mode-control'],
  description: 'Apply different strictness modes',
  tags: ['mdmedic'],
  function: (params, onError, ruleConfig) => {
    // Parse mdmedic: comments
    // Apply mode-specific rule configurations
    // This rule would modify the behavior of other rules in context
  }
};
```

**Use Cases:**
- API docs need strict formatting, but code examples can be longer
- README files are strict, but CHANGELOG can be relaxed
- Legacy content gets looser rules during migration
- Generated files skip certain formatting rules
- Gradual adoption: start relaxed, tighten over time

This goes beyond markdownlint's binary enable/disable to provide nuanced control. Teams could define their own modes in the config:

```jsonc
{
  "modes": {
    "api-docs": {
      "preset": "strict",
      "line-length": { "code_blocks": false }
    },
    "blog-posts": {
      "preset": "standard",
      "typography": true
    }
  }
}
```

### 4. CLI as Transparent markdownlint-cli2 Wrapper

The `mdmedic` command is a **drop-in replacement** for `markdownlint-cli2`. Any existing command works unchanged:

```bash
# These markdownlint-cli2 commands work identically with mdmedic:
mdmedic "**/*.md" "#node_modules"
mdmedic --fix "docs/**/*.md" 
mdmedic --config .markdownlint.json "*.md"
mdmedic --ignore-path .gitignore "**/*.md"

# All markdownlint-cli2 flags pass through:
mdmedic --no-globs README.md
mdmedic --ignore CHANGELOG.md "**/*.md"
mdmedic --fix --no-inline-config "**/*.md"
```

**Enhanced Commands (additions to markdownlint-cli2):**
- `mdmedic init [preset]`: Creates `.mdmedic.config.jsonc` with selected preset and inline docs
- `mdmedic check`: Alias for default behavior (no --fix)
- `mdmedic format`: Alias for `--fix`

**Config File Support (all markdownlint formats work):**
- `.markdownlint.json` / `.markdownlint.jsonc` / `.markdownlint.yaml`
- `.markdownlintrc` (JSON format)
- `.mdmedic.config.jsonc` (our enhanced format with inline documentation)
- Rule names work as both kebab-case (`line-length`) and IDs (`MD013`)

**Additional Flags (on top of markdownlint-cli2):**
- `--dry-run`: Preview changes (our addition, uses `diff` package)
- `--watch, -w`: Watch mode (our addition)
- `--preset <name>`: Quick preset selection without config file

**Implementation Strategy:**
```typescript
// cli.ts - Transparent wrapper approach
import { markdownlintCli2 } from 'markdownlint-cli2';

// Parse args to detect our custom commands/flags
const args = process.argv.slice(2);
if (args[0] === 'init') {
  // Handle our init command
} else if (args.includes('--dry-run')) {
  // Handle dry-run mode
} else {
  // Pass everything else directly to markdownlint-cli2
  markdownlintCli2(args);
}
```

This ensures 100% compatibility - users can migrate by simply replacing `markdownlint-cli2` with `mdmedic` in their scripts.

### Code Implementation Sketch

The core logic becomes much simpler. The main task is constructing the correct configuration object to pass to `markdownlint-cli2`.

#### Updated `config-generator.ts`

This file will be updated to correctly merge and reference `customRules` from npm packages.

```typescript
// src/config-generator.ts (Illustrative changes)
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

export interface MdlintConfig {
  // ...
  customRules?: Array<string>;
  // Note: Rule configs are top-level, not nested under 'config'
}

export function generateConfig(options: MdlintConfig = {}): string {
  const { preset = 'standard', customRules = [], ...rest } = options;
  const config = getPresetConfig(preset) as MdlintConfig;

  // Resolve paths correctly for production
  const packageRoot = fileURLToPath(new URL('..', import.meta.url));
  
  // Tier 3: Our TypeScript rules (always available)
  const nativeRules = [
    join(packageRoot, 'rules/consistent-terminology.js'),
    join(packageRoot, 'rules/code-block-language.js'),
    join(packageRoot, 'rules/typography.js')
  ];
  
  // Tier 2: Bundled community rules (if available)
  const bundledRules: string[] = [];
  ['markdownlint-rules-foliant/lib/typograph', 
   'markdownlint-rule-search-replace'].forEach(rulePath => {
    try {
      const resolved = require.resolve(rulePath);
      bundledRules.push(resolved);
    } catch {
      // Optional dependency not available, continue
    }
  });
  
  // Tier 1: User-provided rules (external packages)
  config.customRules = [
    ...(config.customRules || []),
    ...nativeRules,
    ...bundledRules,
    ...customRules
  ];

  // Merge rule configurations with runtime validation
  Object.assign(config, rest);

  return JSON.stringify(config, null, 2);
}
```

## Config Format Enhancements

### Rule Name Normalization

To support both kebab-case and rule IDs, we'll implement a mapping layer:

```typescript
// Map kebab-case names to rule IDs
const RULE_NAME_MAP = {
  'line-length': 'MD013',
  'heading-style': 'MD003',
  'ul-style': 'MD004',
  'list-indent': 'MD007',
  'code-block-style': 'MD046',
  'emphasis-style': 'MD049',
  // ... etc
};

function normalizeConfig(config: any): any {
  const normalized: any = {};
  
  for (const [key, value] of Object.entries(config)) {
    // Convert kebab-case to rule ID if needed
    const ruleId = RULE_NAME_MAP[key] || key;
    normalized[ruleId] = value;
  }
  
  return normalized;
}
```

### Generated Config with Documentation

The `init` command will generate richly documented configs:

```typescript
const configTemplate = `{
  // mdmedic configuration (extends markdownlint)
  // Generated by: mdmedic init ${preset}
  
  "extends": "${preset}",
  
  // Line length
  "line-length": {
    "line_length": 80,              // Maximum line length
    "code_blocks": false,           // Exclude code blocks
    "tables": false,                // Exclude tables
    "headings": true,               // Include headings
    "strict": false                 // Strict length (no exceptions)
  },
  
  // ... more rules with inline documentation
}`;
```

## Type Safety Considerations

Since markdownlint custom rules must be CommonJS modules, we need a strategy for maintaining type safety:

### All Rules in TypeScript
1. **Example: Typography Rule Implementation**:
   ```typescript
   // src/rules/typography.ts
   import { z } from 'zod';
   
   const ConfigSchema = z.object({
     quotes: z.boolean().default(true),
     dashes: z.boolean().default(true),
     ellipses: z.boolean().default(true)
   });
   
   type Config = z.infer<typeof ConfigSchema>;
   
   interface RuleParams {
     lines: string[];
     config: unknown;
   }
   
   // TypeScript source with full type safety
   export = {
     names: ['MD102', 'typography'],
     description: 'Use proper typography characters',
     tags: ['formatting'],
     function: (params: RuleParams, onError: OnErrorCallback) => {
       const config = ConfigSchema.parse(params.config);
       
       params.lines.forEach((line, index) => {
         if (config.quotes) {
           // Replace straight quotes with smart quotes
           const smartQuoted = line
             .replace(/"([^"]*)"/g, '"$1"')
             .replace(/'([^']*)'/g, ''$1'');
           
           if (smartQuoted !== line) {
             onError({
               lineNumber: index + 1,
               detail: 'Use smart quotes instead of straight quotes',
               fixInfo: {
                 lineNumber: index + 1,
                 editColumn: 1,
                 deleteCount: line.length,
                 insertText: smartQuoted
               }
             });
           }
         }
         // Similar for dashes and ellipses...
       });
     }
   };
   ```

2. **Build process**: Use `tsup` with CommonJS output specifically for rules:
   ```typescript
   // tsup.config.ts
   {
     entry: ['src/rules/*.ts'],
     format: ['cjs'], // Only CommonJS for markdownlint compatibility
     outDir: 'dist/rules'
   }
   ```

3. **Runtime validation**: Use Zod schemas for all rule configurations
4. **Testing**: Each rule gets comprehensive unit tests with type checking

### Benefits of Full TypeScript Implementation
1. **No third-party dependencies**: All rules are our own code
2. **Consistent patterns**: All rules use Result pattern for errors
3. **Full test coverage**: Every rule is testable with mocked params
4. **Better performance**: Optimized implementations vs generic solutions
5. **Easier debugging**: Full source maps and type information

### ESM/CommonJS Interop
Since md-medic is ESM but markdownlint rules must be CommonJS:
1. Use `createRequire` from `node:module` to load CommonJS rules from ESM code
2. Build our custom rules as CommonJS but keep the rest of the package as ESM
3. Handle dynamic imports carefully to maintain compatibility

## Implementation Plan

1. **Phase 1: Type-Safe Foundation & DX**
    - Set up dual build process: ESM for main package, CommonJS for rules only
    - Create TypeScript interfaces for markdownlint rule API
    - Implement `createRequire` based loader for CommonJS rules from ESM code
    - Build kebab-case to rule ID mapping for better ergonomics
    - Create JSONC config templates with inline documentation

2. **Phase 2: Progressive Rule Support**
    - Enable Tier 1: Add documentation for using community rules
    - Implement Tier 2: Bundle 2-3 popular rules as optionalDependencies
    - Start Tier 3: Port `consistent-terminology.js` to TypeScript
    - Create type definitions for popular community rules

3. **Phase 3: Core Features**
    - Implement `code-block-language.ts` (Tier 3)
    - Implement `typography.ts` (Tier 3) to eventually replace foliant
    - Add dry-run mode with diff visualization
    - Add simple watch mode
    - Prototype granular strictness control (inline comments + .mdmedicmode file)

4. **Phase 4: Ecosystem Integration**
    - Document how to use any markdownlint rule with mdmedic
    - Create compatibility matrix for popular rules
    - Consider a `mdmedic add-rule <package>` command for easy rule installation
    - Publish type definitions for community rules we've tested
    - Add pre-commit hook support with `.pre-commit-hooks.yaml`

## Consequences

### Positive

- **Zero Migration Cost**: Existing markdownlint-cli2 commands work unchanged
- **Ecosystem Compatibility**: Users can leverage any markdownlint rule, not just ours
- **Progressive Enhancement**: Start with community rules, upgrade to type-safe versions over time
- **Lower Barrier to Entry**: Users familiar with markdownlint can adopt md-medic easily
- **Best of Both Worlds**: Type safety for our code, flexibility for user extensions
- **Clear Value Proposition**: "markdownlint-cli2 + batteries included + progressive type safety"

### Negative

- **Type Safety Challenges**: Community rules remain untyped, requiring runtime validation
- **Complexity**: Three tiers of rules add conceptual overhead
- **Maintenance**: Need to track ecosystem changes and update compatibility
- **Performance**: Dynamic rule loading has slight overhead vs static imports