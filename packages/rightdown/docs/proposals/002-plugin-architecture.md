# Plugin Architecture Design

**Status**: Ready for Implementation  
**Author**: Development Team  
**Created**: 2025-06-19  
**Priority**: High - Foundation for Tree-sitter

## Overview

Design the plugin architecture that will enable tree-sitter integration and community extensibility while maintaining the lightweight core that we achieved today.

## Current Architecture Analysis

### What We Have ✅
- **Lean core** (45kb total bundle)
- **Type-safe foundations** (@outfitter/contracts)
- **Native utilities** (colors, prompts, paths)
- **Modular command structure**

### Plugin Requirements
- **Lazy loading** - Don't impact core bundle size
- **Type safety** - Full TypeScript support
- **Hot reloading** - Development experience
- **Backward compatibility** - Existing markdownlint rules
- **Discovery** - Auto-detection and registration

## Plugin Interface Specification

### Core Plugin Types

```typescript
// src/plugins/types.ts
export interface PluginManifest {
  name: string;
  version: string;
  description: string;
  author: string;
  engines: {
    mixdown: string; // semver range
  };
  main: string;
  type: 'rule' | 'formatter' | 'command' | 'preset';
}

export interface RulePlugin {
  type: 'rule';
  rules: Record<string, RuleDefinition>;
}

export interface FormatterPlugin {
  type: 'formatter';
  formatters: Record<string, FormatterDefinition>;
}

export interface CommandPlugin {
  type: 'command';
  commands: Record<string, CommandDefinition>;
}

export interface PresetPlugin {
  type: 'preset';
  presets: Record<string, PresetDefinition>;
}

export type Plugin = RulePlugin | FormatterPlugin | CommandPlugin | PresetPlugin;
```

### Rule Plugin Architecture

```typescript
// src/plugins/rules.ts
export interface RuleDefinition {
  name: string;
  description: string;
  category: 'style' | 'structure' | 'content' | 'performance';
  
  // Traditional regex-based rule
  traditional?: {
    pattern: RegExp;
    validate: (match: RegExpMatchArray, context: ValidationContext) => RuleViolation[];
  };
  
  // Tree-sitter structural rule
  structural?: {
    query: string; // Tree-sitter query syntax
    validate: (captures: QueryCapture[], context: ValidationContext) => RuleViolation[];
    fix?: (tree: Tree, violations: RuleViolation[]) => Edit[];
  };
  
  // Configuration schema
  schema?: ZodSchema;
}

export interface ValidationContext {
  file: string;
  content: string;
  config: Record<string, any>;
  metadata: FileMetadata;
}

export interface RuleViolation {
  rule: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
  location: {
    line: number;
    column: number;
    length: number;
  };
  fix?: AutoFix;
}
```

## Plugin Discovery & Loading

### Discovery Strategy

```typescript
// src/plugins/discovery.ts
export class PluginDiscovery {
  async discoverPlugins(): Promise<PluginManifest[]> {
    const sources = [
      this.discoverFromPackageJson(),
      this.discoverFromConfigFile(),
      this.discoverFromNodeModules(),
      this.discoverFromLocalDirectories()
    ];
    
    const discovered = await Promise.all(sources);
    return discovered.flat();
  }
  
  private async discoverFromPackageJson(): Promise<PluginManifest[]> {
    const pkg = await this.readPackageJson();
    const plugins = pkg.mixdown?.plugins || [];
    return this.resolvePluginPaths(plugins);
  }
  
  private async discoverFromNodeModules(): Promise<PluginManifest[]> {
    // Auto-discover packages matching @mixdown/* or *-mixdown-plugin patterns
    const nodeModules = await glob('node_modules/{@mixdown/*,*-mixdown-plugin}');
    return this.validatePlugins(nodeModules);
  }
}
```

### Lazy Loading Implementation

```typescript
// src/plugins/loader.ts
export class PluginLoader {
  private loadedPlugins = new Map<string, Plugin>();
  private manifestCache = new Map<string, PluginManifest>();
  
  async loadPlugin(name: string): Promise<Plugin> {
    if (this.loadedPlugins.has(name)) {
      return this.loadedPlugins.get(name)!;
    }
    
    const manifest = await this.getManifest(name);
    const plugin = await this.dynamicImport(manifest.main);
    
    // Validate plugin interface
    await this.validatePlugin(plugin, manifest);
    
    this.loadedPlugins.set(name, plugin);
    return plugin;
  }
  
  private async dynamicImport(path: string): Promise<Plugin> {
    // Support both CJS and ESM plugins
    try {
      const module = await import(path);
      return module.default || module;
    } catch (error) {
      // Fallback to require for CJS
      return require(path);
    }
  }
}
```

## Configuration Integration

### Plugin Configuration Schema

```yaml
# .mixdown.yaml
extends: ['@mixdown/strict']

plugins:
  '@company/docs-standards':
    enabled: true
    config:
      apiDocsRequired: true
      changelogFormat: 'keep-a-changelog'
  
  'local-rules':
    enabled: true
    path: './mixdown-plugins/local-rules'

rules:
  # Core rules
  line-length: false
  
  # Plugin rules (auto-prefixed)
  '@company/docs-standards/api-docs': true
  'local-rules/team-terminology': 
    terms:
      - { incorrect: 'API', correct: 'API' } # Enforce specific casing
```

### Plugin Config Validation

```typescript
// src/config/plugin-config.ts
export class PluginConfigValidator {
  async validateConfig(config: MixdownConfig): Promise<ValidationResult> {
    const results: ValidationResult[] = [];
    
    for (const [pluginName, pluginConfig] of Object.entries(config.plugins)) {
      const plugin = await this.pluginLoader.loadPlugin(pluginName);
      
      if (plugin.configSchema) {
        const validation = plugin.configSchema.safeParse(pluginConfig.config);
        if (!validation.success) {
          results.push({
            plugin: pluginName,
            errors: validation.error.errors
          });
        }
      }
    }
    
    return { valid: results.length === 0, errors: results };
  }
}
```

## Plugin Development Kit

### CLI Scaffolding

```bash
# Create new plugin
mixdown create-plugin @myorg/custom-rules

# Generated structure:
@myorg/custom-rules/
├── src/
│   ├── rules/
│   │   ├── api-documentation.ts
│   │   └── code-examples.ts
│   ├── index.ts
│   └── types.ts
├── test/
│   ├── fixtures/
│   └── rules.test.ts
├── package.json
├── mixdown.plugin.json
└── README.md
```

### Plugin Template

```typescript
// Template: src/index.ts
import type { RulePlugin, RuleDefinition } from '@mixdown/core';
import { z } from '@outfitter/contracts-zod';

const apiDocumentationRule: RuleDefinition = {
  name: 'api-documentation',
  description: 'Ensure API endpoints are documented',
  category: 'content',
  
  structural: {
    query: '(code_fence_content) @code (#match? @code "^(GET|POST|PUT|DELETE)")',
    validate: (captures, context) => {
      // Validate that API endpoints have corresponding documentation
      return validateApiDocumentation(captures, context);
    }
  },
  
  schema: z.object({
    requireExamples: z.boolean().default(true),
    allowedMethods: z.array(z.string()).default(['GET', 'POST', 'PUT', 'DELETE'])
  })
};

export default {
  type: 'rule',
  rules: {
    'api-documentation': apiDocumentationRule
  }
} satisfies RulePlugin;
```

### Testing Framework

```typescript
// test/rules.test.ts
import { testRule } from '@mixdown/testing';
import plugin from '../src/index';

const rule = plugin.rules['api-documentation'];

describe('api-documentation rule', () => {
  testRule(rule, {
    valid: [
      {
        name: 'documented API endpoint',
        code: `
## POST /users

Creates a new user.

\`\`\`
POST /users
Content-Type: application/json
\`\`\`
        `
      }
    ],
    invalid: [
      {
        name: 'undocumented API endpoint',
        code: `
\`\`\`
POST /users
\`\`\`
        `,
        errors: ['API endpoint requires documentation']
      }
    ]
  });
});
```

## Plugin Ecosystem Strategy

### Core Plugin Categories

1. **Structure Plugins**
   - `@mixdown/docs-as-code` - Documentation architecture
   - `@mixdown/api-docs` - API documentation standards
   - `@mixdown/blog-structure` - Blog post formatting

2. **Content Plugins**
   - `@mixdown/technical-writing` - Style and clarity
   - `@mixdown/inclusive-language` - Inclusive terminology
   - `@mixdown/spell-check` - Spelling and grammar

3. **Domain Plugins**
   - `@mixdown/openapi` - OpenAPI specification docs
   - `@mixdown/changelog` - Changelog formatting
   - `@mixdown/academic` - Academic paper formatting

4. **Integration Plugins**
   - `@mixdown/github` - GitHub-specific markdown
   - `@mixdown/notion` - Notion export compatibility
   - `@mixdown/confluence` - Confluence import/export

### Plugin Registry Design

```typescript
// Registry for plugin discovery and rating
export interface PluginRegistry {
  search(query: string): Promise<PluginSearchResult[]>;
  getPopular(category?: string): Promise<PluginManifest[]>;
  getPlugin(name: string): Promise<PluginDetails>;
  rate(name: string, rating: number): Promise<void>;
}

export interface PluginSearchResult {
  manifest: PluginManifest;
  downloads: number;
  rating: number;
  lastUpdate: string;
  compatibility: 'compatible' | 'outdated' | 'incompatible';
}
```

## Tree-sitter Integration Points

### Tree-sitter Plugin Interface

```typescript
// src/plugins/tree-sitter.ts
export interface TreeSitterPlugin extends RulePlugin {
  parser: 'markdown' | 'markdown-inline' | 'custom';
  
  rules: Record<string, StructuralRuleDefinition>;
}

export interface StructuralRuleDefinition extends RuleDefinition {
  structural: {
    query: string;
    validate: (captures: QueryCapture[], context: StructuralContext) => RuleViolation[];
    fix?: (tree: Tree, violations: RuleViolation[]) => TreeEdit[];
  };
}

export interface StructuralContext extends ValidationContext {
  tree: Tree;
  parser: Parser;
  syntax: SyntaxNode;
}
```

### Automatic Fallback Strategy

```typescript
// Graceful degradation when tree-sitter unavailable
export class RuleEngine {
  async validateFile(file: string, content: string): Promise<RuleViolation[]> {
    const violations: RuleViolation[] = [];
    
    for (const rule of this.enabledRules) {
      if (rule.structural && this.treeSitterAvailable) {
        // Use tree-sitter for structural analysis
        violations.push(...await this.validateStructural(rule, file, content));
      } else if (rule.traditional) {
        // Fallback to regex-based validation
        violations.push(...await this.validateTraditional(rule, file, content));
      }
    }
    
    return violations;
  }
}
```

## Performance Considerations

### Plugin Loading Optimization

```typescript
// Lazy load plugins only when needed
export class OptimizedPluginLoader {
  private pluginPromises = new Map<string, Promise<Plugin>>();
  
  async getPluginFor(ruleId: string): Promise<Plugin | null> {
    const pluginName = this.extractPluginName(ruleId);
    
    if (!this.pluginPromises.has(pluginName)) {
      this.pluginPromises.set(pluginName, this.loadPlugin(pluginName));
    }
    
    return this.pluginPromises.get(pluginName)!;
  }
  
  // Pre-load critical plugins in background
  async warmupCache(): Promise<void> {
    const criticalPlugins = await this.getCriticalPlugins();
    await Promise.all(criticalPlugins.map(name => this.loadPlugin(name)));
  }
}
```

### Bundle Size Management

```typescript
// Plugin bundles are separate from core
export const PLUGIN_BUNDLE_STRATEGY = {
  core: 'inline', // Core functionality bundled
  plugins: 'dynamic', // Plugins loaded on demand
  treeSitter: 'wasm', // Tree-sitter as WASM module
  
  maxCoreSize: '100kb',
  maxPluginSize: '50kb',
  recommendedPluginSize: '20kb'
};
```

## Implementation Phases

### Phase 1: Core Plugin System (Week 1-2)
- [ ] Plugin interface definition
- [ ] Discovery and loading mechanism  
- [ ] Configuration integration
- [ ] Basic testing framework

### Phase 2: Development Experience (Week 3-4)
- [ ] Plugin scaffolding CLI
- [ ] Hot reloading for development
- [ ] Error reporting and debugging
- [ ] Documentation generator

### Phase 3: Tree-sitter Foundation (Week 5-6)
- [ ] Tree-sitter plugin interface
- [ ] WASM loading strategy
- [ ] Fallback mechanisms
- [ ] Performance optimization

### Phase 4: Community Ecosystem (Week 7-8)
- [ ] Plugin registry design
- [ ] Publishing automation
- [ ] Quality guidelines
- [ ] Community documentation

## Success Criteria

### Technical Metrics
- **Core bundle size**: Remain under 100kb
- **Plugin load time**: < 100ms for typical plugin
- **Memory usage**: < 50MB for 100+ active rules
- **Compatibility**: 100% backward compatibility with markdownlint

### Developer Experience
- **Plugin creation**: < 5 minutes from idea to working plugin
- **Testing**: Full test coverage with minimal boilerplate
- **Documentation**: Auto-generated plugin docs
- **Publishing**: One-command plugin publishing

### Ecosystem Health
- **Plugin count**: 25+ plugins within 6 months
- **Usage diversity**: Plugins used across different domains
- **Quality**: Average 4+ star rating
- **Maintenance**: 90%+ plugins updated within 3 months of API changes

This plugin architecture provides the foundation for tree-sitter integration while maintaining the lean, fast characteristics we achieved today. It positions Mixdown for extensibility without compromising on performance.