# Tree-sitter Future: Rightdown as the Biome of Markdown

**Status**: Proposal  
**Author**: Development Team  
**Created**: 2025-06-19  
**Priority**: High Impact, Long-term Vision

## Executive Summary

Transform Rightdown from a streamlined markdown linter into the **"Biome of Markdown"** - a comprehensive, opinionated, zero-config toolchain that provides semantic understanding, intelligent refactoring, and document architecture enforcement through tree-sitter integration.

## Current State Analysis

### What We Built Today ✅

- **85% smaller bundle** (300kb → 45kb)
- **Zero heavy dependencies** (removed chalk, clipboardy, ora, inquirer)
- **Native utilities** (colors, prompts, paths)
- **Type-safe foundations** (@outfitter/contracts integration)
- **Plugin-ready architecture**

### Current Limitations 🚫

- **Regex-based rules** → Fragile, false positives
- **No semantic understanding** → Can't distinguish contexts
- **Limited structural analysis** → No document architecture validation
- **Text-only fixes** → No intelligent refactoring

## Tree-sitter Integration Vision

### Phase 1: Foundation (Weeks 1-4)

#### 1.1 Core Parser Integration
```typescript
// src/parser/markdown.ts
import Parser from 'tree-sitter';
import Markdown from 'tree-sitter-markdown';

export class MarkdownParser {
  private parser: Parser;
  
  constructor() {
    this.parser = new Parser();
    this.parser.setLanguage(Markdown);
  }
  
  parse(content: string): Tree {
    return this.parser.parse(content);
  }
  
  query(source: string, queryPattern: string): QueryCapture[] {
    const tree = this.parse(source);
    const query = this.parser.getLanguage().query(queryPattern);
    return query.captures(tree.rootNode);
  }
}
```

#### 1.2 Plugin Architecture
```typescript
// src/plugins/interface.ts
export interface StructuralRule {
  name: string;
  description: string;
  query: string;  // Tree-sitter query syntax
  validate: (captures: QueryCapture[], context: ValidationContext) => RuleViolation[];
  fix?: (tree: Tree, violations: RuleViolation[]) => Edit[];
}

export interface Plugin {
  name: string;
  version: string;
  rules: StructuralRule[];
  formatters?: Formatter[];
  commands?: CommandExtension[];
}
```

#### 1.3 WASM Distribution Strategy
```typescript
// Lazy loading for optimal bundle size
export async function createStructuralLinter(): Promise<StructuralLinter> {
  const { MarkdownParser } = await import('./parser/tree-sitter.wasm');
  return new StructuralLinter(new MarkdownParser());
}
```

### Phase 2: Killer Features (Weeks 5-8)

#### 2.1 Document Structure Validation
```yaml
# .rightdown.yaml
rules:
  document-structure:
    enabled: true
    pattern: 'h1 > (h2 > h3*)*'
    message: 'Documentation must follow H1 → H2 → H3 hierarchy'
    autofix: true
  
  required-sections:
    enabled: true
    sections: ['Installation', 'Usage', 'Contributing']
    level: 'h2'
    order: 'strict'
```

#### 2.2 Context-Aware Link Validation
```typescript
// Different rules for different contexts
const linkRules = {
  internal: {
    query: '(link destination: (link_destination) @dest)',
    validate: (captures) => validateFileExists(captures),
    contexts: ['prose', 'lists']
  },
  external: {
    query: '(link destination: (link_destination) @dest (#match? @dest "^https?:"))',
    validate: (captures) => validateUrlReachable(captures),
    contexts: ['prose', 'lists']
  },
  code: {
    query: '(code_span) @code',
    validate: () => [], // Skip link validation in code
    contexts: ['code_block', 'inline_code']
  }
};
```

#### 2.3 Smart Auto-Generation
```typescript
// Auto-generate table of contents
export const tocGenerator: StructuralRule = {
  name: 'toc-sync',
  query: '(atx_heading (atx_h1_marker) @h1) (atx_heading (atx_h2_marker) @h2) (atx_heading (atx_h3_marker) @h3)',
  validate: (captures) => validateTocExists(captures),
  fix: (tree, violations) => generateToc(tree, { maxDepth: 3, location: '## Table of Contents' })
};
```

### Phase 3: Advanced Intelligence (Weeks 9-12)

#### 3.1 Cross-Document Analysis
```typescript
// Validate cross-references across files
export class ProjectLinter {
  async validateProject(rootDir: string): Promise<ProjectViolations> {
    const files = await glob('**/*.md', { cwd: rootDir });
    const parsed = await Promise.all(files.map(this.parseFile));
    
    return {
      brokenLinks: this.findBrokenInternalLinks(parsed),
      duplicateHeadings: this.findDuplicateHeadings(parsed),
      inconsistentStructure: this.validateConsistentStructure(parsed)
    };
  }
}
```

#### 3.2 Frontmatter Schema Validation
```typescript
// src/rules/frontmatter.ts
import { z } from '@outfitter/contracts-zod';

const frontmatterSchema = z.object({
  title: z.string(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  tags: z.array(z.string()).optional(),
  draft: z.boolean().default(false)
});

export const frontmatterRule: StructuralRule = {
  name: 'frontmatter-schema',
  query: '(document (yaml_metadata_block) @frontmatter)',
  validate: (captures) => validateFrontmatter(captures, frontmatterSchema)
};
```

#### 3.3 Intelligent Refactoring
```typescript
// Auto-fix heading hierarchies
export const headingHierarchyFix: StructuralRule = {
  name: 'heading-hierarchy',
  query: '(atx_heading) @heading',
  validate: (captures) => findHierarchyViolations(captures),
  fix: (tree, violations) => fixHeadingLevels(tree, violations) // H1 → H2 → H4 becomes H1 → H2 → H3
};
```

## Configuration Evolution

### Current: .markdownlint-cli2.yaml
```yaml
default: true
MD013: false
MD033: false
```

### Future: .rightdown.yaml
```yaml
extends: ['@rightdown/strict', './custom-rules.yaml']

# Glob-scoped overrides (biome-style)
overrides:
  - files: ['docs/**/*.md']
    rules:
      document-structure:
        pattern: 'h1 > h2+ > h3*'
      required-sections:
        sections: ['Overview', 'API', 'Examples']
  
  - files: ['README.md']  
    rules:
      required-sections:
        sections: ['Installation', 'Usage', 'Contributing', 'License']
      heading-hierarchy:
        allow-skip-levels: false

# Structural rules (tree-sitter powered)
structural:
  document-architecture: true
  cross-references: true
  frontmatter-schema: './schemas/frontmatter.json'

# Traditional rules (regex-based, for compatibility)
traditional:
  line-length: false
  emphasis-style: underscore
```

## Plugin Ecosystem Design

### 3.1 Plugin Discovery
```json
// package.json
{
  "rightdown": {
    "plugins": [
      "@company/md-standards",
      "./local-rules",
      "@rightdown/docs-as-code"
    ]
  }
}
```

### 3.2 Plugin Development Kit
```bash
# Scaffold new plugin
npx rightdown create-plugin my-org-rules

# Generated structure:
my-org-rules/
├── src/
│   ├── rules/
│   │   ├── api-docs.ts
│   │   └── code-examples.ts
│   └── index.ts
├── test/
├── package.json
└── rightdown.config.ts
```

### 3.3 Community Plugins
```typescript
// @rightdown/docs-as-code plugin
export const docsAsCodeRules = [
  'api-documentation-sync',
  'code-example-validation',
  'changelog-structure',
  'contributor-attribution'
];

// @rightdown/technical-writing plugin  
export const technicalWritingRules = [
  'inclusive-language',
  'reading-level-analysis',
  'terminology-consistency',
  'voice-and-tone'
];
```

## Performance Architecture

### 4.1 Caching Strategy
```typescript
// .rightdown/cache.json
{
  "version": "2.0.0",
  "files": {
    "README.md": {
      "mtime": 1703123456789,
      "size": 2048,
      "hash": "sha256:abc123...",
      "violations": [],
      "lastCheck": 1703123456789
    }
  }
}
```

### 4.2 Worker Pool Architecture
```typescript
// src/performance/worker-pool.ts
import { Piscina } from 'piscina';

export class LintWorkerPool {
  private pool: Piscina;
  
  constructor() {
    this.pool = new Piscina({
      filename: new URL('./worker.js', import.meta.url).href,
      maxThreads: os.cpus().length
    });
  }
  
  async lintFile(filePath: string): Promise<LintResult> {
    return this.pool.run({ filePath, config: this.config });
  }
}
```

### 4.3 Incremental Analysis
```typescript
// Only re-analyze changed files and their dependents
export class IncrementalLinter {
  async lint(changedFiles: string[]): Promise<LintResults> {
    const affected = await this.findAffectedFiles(changedFiles);
    const results = await this.lintFiles(affected);
    await this.updateCache(results);
    return results;
  }
}
```

## CLI Evolution

### Current Commands
```bash
rightdown [files...]           # Lint files
rightdown init [preset]        # Initialize config
rightdown format [source]      # Format markdown
rightdown rules list|update    # Manage rules
rightdown config preset|ignore # Manage config
```

### Future Commands (Post Tree-sitter)
```bash
rightdown [files...]                    # Intelligent lint with structure analysis
rightdown init [preset]                 # Initialize with schema validation
rightdown format [source] --structural  # Format with document architecture fixes
rightdown rules list|update|create      # Enhanced rule management
rightdown config preset|ignore|schema   # Schema-aware configuration
rightdown doctor                        # Diagnose environment and performance
rightdown migrate                       # Convert from other markdown linters
rightdown dev                          # Live preview server with structural hints
rightdown generate toc|index|summary   # Auto-generate document components
```

## Implementation Timeline

### Immediate (Next 2 weeks)
- [ ] Add @outfitter/contracts-zod for config validation
- [ ] Design plugin interface specification
- [ ] Create tree-sitter integration prototype

### Short-term (1-2 months)
- [ ] Implement core tree-sitter parser
- [ ] Build structural rule system
- [ ] Add document architecture validation
- [ ] Create plugin loading mechanism

### Medium-term (3-6 months)
- [ ] Worker pool performance optimization
- [ ] Cross-document analysis
- [ ] VS Code extension
- [ ] Community plugin ecosystem

### Long-term (6+ months)
- [ ] Live preview server
- [ ] Advanced auto-generation
- [ ] Machine learning rule suggestions
- [ ] Integration with documentation platforms

## Success Metrics

### Technical Metrics
- **Bundle size**: Keep core < 100kb (tree-sitter as optional WASM)
- **Performance**: 10x faster than regex-based rules on large documents
- **Accuracy**: 95% reduction in false positives vs regex rules
- **Coverage**: 100% of markdownlint rules + structural rules

### Adoption Metrics
- **Plugin ecosystem**: 25+ community plugins within 12 months
- **VS Code integration**: Auto-install for markdown projects
- **Schema store**: Integration with schemastore.org
- **Community**: 1000+ GitHub stars, active contributor base

## Risk Assessment

### Technical Risks
- **WASM bundle size**: Mitigate with lazy loading and compression
- **Performance overhead**: Benchmark against pure regex approach
- **Tree-sitter maintenance**: Contribute upstream, maintain forks if needed

### Ecosystem Risks
- **markdownlint compatibility**: Maintain backward compatibility layer
- **Plugin quality**: Implement plugin verification and rating system
- **Migration complexity**: Provide automated migration tools

## Conclusion

This tree-sitter integration transforms Rightdown from a markdown linter into a comprehensive document intelligence platform. The semantic understanding enables:

1. **Document architecture enforcement**
2. **Intelligent auto-fixes and generation**
3. **Cross-document validation**
4. **Schema-driven configuration**
5. **Plugin ecosystem for specialized domains**

The result: **Rightdown becomes to Markdown what Biome is to JavaScript** - a single, fast, opinionated tool that handles all markdown development needs with zero configuration and maximum intelligence.

This positions Rightdown as the definitive solution for markdown tooling in the AI-driven development era, where documentation quality and automation are critical competitive advantages.