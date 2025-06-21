# Proposal: @outfitter/agents-config Package

## Summary

This proposal outlines the creation of `@outfitter/agents-config`, a package that provides standardized, reusable configurations for AI development agents (CodeRabbit, GitHub Copilot, Cursor, etc.). This package would serve as the first "supply" in the Outfitter ecosystem, demonstrating the value proposition of standardized development configurations.

## Problem Statement

### Current Pain Points

1. **Configuration Fragmentation**: Each project requires manual setup of AI agent configurations, leading to inconsistency across teams and repositories.

2. **Complex Configuration Learning Curve**: Tools like CodeRabbit have extensive configuration options (profiles, tools, path instructions, tone instructions) that require deep understanding to optimize.

3. **Monorepo Complexity**: Large codebases with multiple project types need sophisticated path-based configurations that are time-consuming to create and maintain.

4. **Team Standardization**: No easy way to share and enforce consistent AI agent configurations across an organization.

5. **Configuration Drift**: Projects start with good configurations but degrade over time without centralized maintenance.

### Opportunity

The comprehensive [CodeRabbit Configuration Guide](../fieldguides/content/guides/coderabbit-guide.md) demonstrates proven patterns that could benefit every project. Rather than each team recreating these configurations, we can package them as reusable, maintainable supplies.

## Proposed Solution

### Package Overview

Create `@outfitter/agents-config` as a TypeScript package that:

- **Provides Templates**: Pre-built configurations for common project types
- **Generates Configurations**: Smart configuration generation based on project detection
- **Supports Monorepos**: Automatic path-based instruction generation
- **Enables Customization**: Extensible template system for team-specific needs
- **Maintains Standards**: Centralized updates to configuration best practices

### Target Agents (Priority Order)

1. **CodeRabbit** (Phase 1) - AI code review with complex YAML configuration
2. **GitHub Copilot** (Phase 2) - Workspace settings and custom instructions
3. **Cursor** (Phase 3) - AI rules and codebase context
4. **Claude Code** (Phase 4) - CLAUDE.md generation and project instructions

## Technical Design

### Package Structure

```text
packages/agents-config/
├── src/
│   ├── types/
│   │   ├── common.ts           # Shared types across agents
│   │   ├── coderabbit.ts       # CodeRabbit-specific types
│   │   └── project.ts          # Project detection types
│   ├── agents/
│   │   ├── coderabbit/
│   │   │   ├── templates/      # YAML template files
│   │   │   ├── generators/     # Configuration generators
│   │   │   ├── validators/     # Configuration validation
│   │   │   └── index.ts        # Public API
│   │   ├── copilot/
│   │   │   └── (future phases)
│   │   └── index.ts
│   ├── detection/
│   │   ├── project-scanner.ts  # Detect project types
│   │   ├── monorepo-analyzer.ts # Analyze monorepo structure
│   │   └── language-detector.ts # Language/framework detection
│   ├── utils/
│   │   ├── yaml-merger.ts      # Template merging utilities
│   │   ├── file-matcher.ts     # Glob pattern utilities
│   │   └── template-engine.ts  # Template interpolation
│   └── index.ts                # Main package exports
├── templates/
│   └── coderabbit/
│       ├── base/
│       │   ├── minimal.yaml
│       │   ├── secure.yaml
│       │   └── ai-structured.yaml
│       ├── project-types/
│       │   ├── typescript-npm.yaml
│       │   ├── typescript-app.yaml
│       │   ├── python-fastapi.yaml
│       │   ├── python-library.yaml
│       │   ├── documentation.yaml
│       │   ├── react-app.yaml
│       │   └── nextjs-app.yaml
│       └── monorepo/
│           ├── mixed-language.yaml
│           ├── typescript-only.yaml
│           └── path-templates/
├── __tests__/
│   ├── agents/
│   ├── detection/
│   ├── utils/
│   └── fixtures/
│       └── sample-projects/
├── package.json
├── tsconfig.json
└── README.md
```

### Core API Design

```typescript
// Main package exports
export interface AgentConfig {
  agent: 'coderabbit' | 'copilot' | 'cursor' | 'claude';
  projectType?: ProjectType;
  profile?: 'minimal' | 'standard' | 'strict' | 'ai-optimized';
  customizations?: Record<string, unknown>;
}

export interface ProjectDetectionResult {
  type: ProjectType;
  language: Language;
  framework?: Framework;
  isMonorepo: boolean;
  structure?: MonorepoStructure;
}

// Core functions
export function detectProject(
  rootPath: string
): Promise<ProjectDetectionResult>;
export function generateConfig(config: AgentConfig): Promise<string>;
export function validateConfig(
  agent: string,
  content: string
): Promise<ValidationResult>;

// CodeRabbit-specific API
export interface CodeRabbitConfig {
  profile: 'chill' | 'assertive';
  outputFormat: 'human' | 'structured' | 'github-issues';
  projectType:
    | 'typescript-npm'
    | 'typescript-app'
    | 'python-fastapi'
    | 'python-library'
    | 'documentation'
    | 'react-app'
    | 'nextjs-app';
  tools?: {
    eslint?: boolean;
    ruff?: boolean;
    gitleaks?: boolean;
    semgrep?: boolean;
    markdownlint?: boolean;
  };
  customInstructions?: string;
  pathInstructions?: Array<{
    pattern: string;
    instructions: string;
  }>;
  monorepo?: MonorepoConfig;
}

export interface MonorepoConfig {
  apps: Record<
    string,
    {
      type: string;
      language: string;
      instructions: string;
    }
  >;
  packages: Record<
    string,
    {
      type: string;
      language: string;
      instructions: string;
    }
  >;
  sharedPaths?: Array<{
    pattern: string;
    instructions: string;
  }>;
}

// CodeRabbit functions
export namespace CodeRabbit {
  export function generateConfig(config: CodeRabbitConfig): Promise<string>;
  export function generateMonorepoConfig(
    structure: MonorepoStructure
  ): Promise<string>;
  export function validateConfig(
    yamlContent: string
  ): Promise<ValidationResult>;
  export function mergeTemplates(base: string, overlay: string): string;
}
```

### Project Detection Logic

```typescript
// Project detection algorithm
// Note: Consider separating I/O operations from pure detection logic
// for better testability and composability
export class ProjectScanner {
  async detectProjectType(rootPath: string): Promise<ProjectType> {
    const files = await this.scanFiles(rootPath);

    // Check for specific files and patterns
    if (files.includes('package.json')) {
      const packageJson = await this.readPackageJson(rootPath);

      if (
        packageJson.devDependencies?.typescript ||
        packageJson.dependencies?.typescript
      ) {
        return this.detectTypeScriptProject(packageJson, files);
      }

      return this.detectJavaScriptProject(packageJson, files);
    }

    if (
      files.includes('pyproject.toml') ||
      files.includes('requirements.txt')
    ) {
      return this.detectPythonProject(rootPath, files);
    }

    if (files.some(f => f.endsWith('.md'))) {
      return 'documentation';
    }

    return 'unknown';
  }

  private detectTypeScriptProject(
    packageJson: any,
    files: string[]
  ): ProjectType {
    // Library detection
    if (packageJson.main || packageJson.exports) {
      if (packageJson.bin) return 'typescript-cli';
      return 'typescript-npm';
    }

    // App detection
    if (packageJson.dependencies?.next) return 'nextjs-app';
    if (packageJson.dependencies?.react) return 'react-app';
    if (packageJson.dependencies?.express || packageJson.dependencies?.fastify)
      return 'typescript-api';

    return 'typescript-app';
  }

  async detectMonorepoStructure(
    rootPath: string
  ): Promise<MonorepoStructure | null> {
    const workspaceFile = await this.findWorkspaceFile(rootPath);
    if (!workspaceFile) return null;

    const packages = await this.scanWorkspacePackages(rootPath, workspaceFile);

    return {
      type: 'monorepo',
      workspaceFile,
      packages: packages.map(pkg => ({
        name: pkg.name,
        path: pkg.path,
        type: this.detectProjectType(pkg.path),
        language: this.detectLanguage(pkg.path),
      })),
    };
  }
}
```

### Template System

```typescript
// Template engine for configuration generation
export class TemplateEngine {
  private templates = new Map<string, string>();

  async loadTemplate(agent: string, templateName: string): Promise<string> {
    const templatePath = path.join(
      __dirname,
      '../templates',
      agent,
      `${templateName}.yaml`
    );
    return await fs.readFile(templatePath, 'utf8');
  }

  interpolate(template: string, variables: Record<string, any>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return variables[key] ?? match;
    });
  }

  mergeTemplates(baseTemplate: string, overlayTemplate: string): string {
    const base = yaml.load(baseTemplate) as any;
    const overlay = yaml.load(overlayTemplate) as any;

    return yaml.dump(deepMerge(base, overlay), {
      indent: 2,
      lineWidth: 100,
      noRefs: true,
    });
  }
}
```

## Template Examples

### Base Templates

#### Minimal Secure Default (`templates/coderabbit/base/minimal.yaml`)

```yaml
# yaml-language-server: $schema=https://coderabbit.ai/integrations/schema.v2.json
language: 'en-US'

reviews:
  profile: 'chill'
  high_level_summary: true
  poem: false

tools:
  markdownlint: { enabled: true }
  gitleaks: { enabled: true }
  github-checks: { enabled: true }
  yamllint: { enabled: true }

path_filters:
  - '{{sourcePattern}}'
  - '!**/node_modules/**'
  - '!**/dist/**'
  - '!**/*.min.js'
```

#### AI-Structured Output (`templates/coderabbit/base/ai-structured.yaml`)

````yaml
# yaml-language-server: $schema=https://coderabbit.ai/integrations/schema.v2.json
language: 'en-US'

tone_instructions: |
  Output structured feedback for machine parsing:
  Format: ID|SEVERITY|CATEGORY|FILE:LINES|FIX_AVAILABLE

  Severity: CRITICAL > HIGH > MEDIUM > LOW
  Categories: Security|Performance|Types|Breaking|Style|Test
  Fix: YES (with code) | MANUAL (human needed) | NO (info only)

  After issue list, include fixes:
  --- FIXES ---
  ID: <issue_id>
  ```{{language}}
<replacement code>
````

reviews:
  profile: 'assertive'
  poem: false
  high_level_summary: true
  request_changes_workflow: true

tools:
  gitleaks: { enabled: true }
  semgrep: { enabled: true }
````

### Project-Specific Templates

#### TypeScript NPM Package (`templates/coderabbit/project-types/typescript-npm.yaml`)

```yaml
# Extends: base/ai-structured.yaml

tone_instructions: |
  TypeScript library for NPM publication.
  Focus: API stability, TypeScript types, breaking changes.
  Flag: [BREAKING] for API changes, [TYPES] for TS issues, [SECURITY] for vulnerabilities.
  Every export change = potential breaking change for consumers.

reviews:
  labeling_instructions:
    - label: 'breaking-change'
      instructions: 'Apply when: exports change, types change, behavior changes'
    - label: 'semver-major'
      instructions: 'Apply when: breaking changes require major version bump'
    - label: 'types'
      instructions: 'Apply when: TypeScript types need improvement'

  path_instructions:
    - path: '**/index.{ts,js}'
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
  eslint: { enabled: true }
  ast-grep: { enabled: true, essential_rules: true }
  npm-audit: { enabled: true }

path_filters:
  - 'src/**'
  - '!**/*.test.ts'
  - '!node_modules/**'
````

### Monorepo Templates

#### Mixed Language Monorepo (`templates/coderabbit/monorepo/mixed-language.yaml`)

```yaml
# Extends: base/ai-structured.yaml

reviews:
  path_instructions:
    # Frontend apps
    - path: 'apps/web/**/*.{ts,tsx}'
      instructions: |
        React application code.
        Focus: Performance, accessibility, user experience.
        Check: Hooks usage, memoization, event handlers.
        Flag: [PERF] for performance issues, [A11Y] for accessibility.

    - path: 'apps/mobile/**/*.{ts,tsx}'
      instructions: |
        React Native mobile application.
        Focus: Performance, platform-specific patterns.
        Check: Platform imports, navigation patterns.

    # Backend services
    - path: 'apps/api/**/*.py'
      instructions: |
        Python FastAPI backend service.
        Focus: Security, performance, API design.
        Check: Input validation, auth, query optimization.
        Flag: [SECURITY:LEVEL] for security issues.

    # Shared packages
    - path: 'packages/**/*.ts'
      instructions: |
        CRITICAL: Shared code affects all apps.
        Any change = potential breaking change.
        Require: Extensive tests, full documentation.
        Flag: [BREAKING] for any behavior changes.

    # Package-specific rules
    - path: 'packages/ui/**'
      instructions: 'Focus: Accessibility, responsive design, component API stability'

    - path: 'packages/utils/**'
      instructions: 'Focus: Type safety, tree shaking, zero dependencies'

    - path: 'packages/contracts/**'
      instructions: 'Focus: API contracts, breaking changes, semver compliance'

tools:
  # TypeScript/JavaScript
  eslint: { enabled: true }

  # Python
  ruff: { enabled: true }
  bandit: { enabled: true }
  mypy: { enabled: true }

  # Universal
  gitleaks: { enabled: true }
  semgrep: { enabled: true }
  markdownlint: { enabled: true }
```

## Implementation Phases

### Phase 1: Core Foundation (Weeks 1-2)

**Deliverables:**

- Package structure and basic TypeScript setup
- Project detection utilities
- Template loading and merging system
- CodeRabbit template generation
- Basic validation

**Key Files:**

- `src/detection/project-scanner.ts`
- `src/utils/template-engine.ts`
- `src/agents/coderabbit/index.ts`
- `templates/coderabbit/base/*.yaml`
- `templates/coderabbit/project-types/*.yaml`

**Success Criteria:**

- Can detect project type from filesystem scan
- Can generate basic CodeRabbit configuration
- Templates validate against CodeRabbit schema

### Phase 2: Monorepo Support (Weeks 3-4)

**Deliverables:**

- Monorepo structure detection
- Path-based instruction generation
- Complex template merging
- Monorepo-specific templates

**Key Files:**

- `src/detection/monorepo-analyzer.ts`
- `src/agents/coderabbit/generators/monorepo.ts`
- `templates/coderabbit/monorepo/*.yaml`

**Success Criteria:**

- Correctly detects monorepo structure
- Generates appropriate path instructions
- Handles mixed-language projects

### Phase 3: CLI Integration (Weeks 5-6)

**Deliverables:**

- Integration with `@outfitter/cli`
- Interactive configuration wizard
- File system operations
- Configuration validation commands

**Key Files:**

- CLI command implementations
- Interactive prompts for customization
- File writing utilities

**Success Criteria:**

- `outfitter agents init coderabbit` works end-to-end
- Generated configurations are valid and functional
- Users can customize templates

### Phase 4: Testing & Polish (Weeks 7-8)

**Deliverables:**

- Comprehensive test suite
- Documentation and examples
- Performance optimization
- Error handling improvements

**Success Criteria:**

- 90%+ test coverage
- All templates tested with real projects
- Performance benchmarks established

## Integration Points

### CLI Package Integration

```bash
# New command group
outfitter agents --help

# CodeRabbit workflows
outfitter agents init coderabbit                    # Interactive setup
outfitter agents init coderabbit --type react-app   # Direct template
outfitter agents update coderabbit                  # Update to latest
outfitter agents validate coderabbit                # Validate existing config

# Future agents
outfitter agents init copilot
outfitter agents init cursor
```

### Packlist Integration

The agents-config package should integrate with the packlist system:

```json
{
  "name": "Frontend Standard",
  "version": "1.0.0",
  "supplies": ["typescript-standards", "react-patterns", "agents-config"],
  "agentConfigs": {
    "coderabbit": {
      "type": "react-app",
      "profile": "assertive"
    }
  }
}
```

### Fieldguides Integration

The package should reference and extend the existing CodeRabbit guide:

- Templates based on guide examples
- Documentation that links back to guide
- Validation that references guide best practices

## API Examples

### Basic Usage

```typescript
import { CodeRabbit, detectProject } from '@outfitter/agents-config';

// Auto-detect and generate
const project = await detectProject('/path/to/project');
const config = await CodeRabbit.generateConfig({
  projectType: project.type,
  profile: 'assertive',
  outputFormat: 'structured',
});

await fs.writeFile('.coderabbit.yaml', config);
```

### Custom Configuration

```typescript
import { CodeRabbit } from '@outfitter/agents-config';

// Custom configuration
const config = await CodeRabbit.generateConfig({
  projectType: 'typescript-npm',
  profile: 'assertive',
  tools: {
    eslint: true,
    gitleaks: true,
    semgrep: false,
  },
  customInstructions: 'Focus on performance and security',
  pathInstructions: [
    {
      pattern: 'src/auth/**',
      instructions: 'CRITICAL: Authentication code - zero tolerance for issues',
    },
  ],
});
```

### Monorepo Configuration

```typescript
import { CodeRabbit, detectProject } from '@outfitter/agents-config';

// Monorepo detection and config
const project = await detectProject('/path/to/monorepo');

if (project.isMonorepo) {
  const config = await CodeRabbit.generateMonorepoConfig(project.structure);
  await fs.writeFile('.coderabbit.yaml', config);
}
```

## Testing Strategy

### Unit Tests

- **Project Detection**: Test with fixture projects of different types
- **Template Generation**: Verify YAML output matches expected structure
- **Template Merging**: Test complex overlay scenarios
- **Validation**: Test valid/invalid configurations

### Integration Tests

- **Real Projects**: Test against actual open source projects
- **CLI Integration**: End-to-end workflow testing
- **File Operations**: Test file reading/writing with permissions

### Validation Tests

- **Schema Compliance**: All generated configs validate against CodeRabbit
schema
- **Functional Testing**: Generated configs work with actual CodeRabbit
instances
- **Performance Testing**: Large monorepo configuration generation times

### Test Fixtures

```text
__tests__/fixtures/
├── typescript-npm/
│   ├── package.json
│   ├── src/index.ts
│   └── tsconfig.json
├── python-fastapi/
│   ├── pyproject.toml
│   ├── main.py
│   └── requirements.txt
├── monorepo-mixed/
│   ├── apps/
│   │   ├── web/package.json
│   │   └── api/pyproject.toml
│   ├── packages/
│   │   └── utils/package.json
│   └── pnpm-workspace.yaml
└── documentation/
    ├── README.md
    └── docs/
```

## Risk Analysis

### Technical Risks

**Risk**: CodeRabbit schema changes breaking generated configurations

- **Mitigation**: Pin to specific schema versions, automated validation in CI
- **Impact**: Medium - requires template updates

**Risk**: Complex monorepo detection edge cases

- **Mitigation**: Comprehensive test fixtures, fallback to manual configuration
- **Impact**: Low - graceful degradation possible

**Risk**: Template conflicts in complex scenarios

- **Mitigation**: Clear merge precedence rules, validation warnings
- **Impact**: Medium - could generate invalid configs

### Product Risks

**Risk**: Configuration templates become outdated

- **Mitigation**: Regular review cycle, community feedback integration
- **Impact**: Medium - affects quality of generated configs

**Risk**: Too many options overwhelming users

- **Mitigation**: Good defaults, progressive disclosure, wizard interface
- **Impact**: Low - CLI can guide users

**Risk**: Limited adoption due to learning curve

- **Mitigation**: Excellent documentation, examples, gradual rollout
- **Impact**: High - affects package value

### Operational Risks

**Risk**: Support burden for generated configurations

- **Mitigation**: Clear documentation about customization, community support
- **Impact**: Medium - requires ongoing maintenance

## Success Metrics

### Adoption Metrics

- **Package Downloads**: Monthly npm downloads
- **CLI Usage**: `outfitter agents` command usage frequency
- **Configuration Generation**: Number of configs generated per month

### Quality Metrics

- **Validation Rate**: Percentage of generated configs that validate successfully
- **User Satisfaction**: Survey feedback on generated configuration quality
- **Issue Reports**: Bug reports related to generated configurations

### Ecosystem Metrics

- **Template Contributions**: Community contributions to template library
- **Agent Coverage**: Number of different agents supported
- **Project Type Coverage**: Percentage of common project types supported

## Future Expansion

### Additional Agents

1. **GitHub Copilot** - Workspace settings, custom instructions
2. **Cursor** - AI rules, codebase context files
3. **Claude Code** - CLAUDE.md generation
4. **Codeium** - Configuration templates
5. **Tabnine** - Custom model configurations

### Enhanced Features

1. **Team Profiles**: Organization-specific template overlays
2. **Dynamic Updates**: Auto-update configurations based on project changes
3. **Analytics Integration**: Usage metrics and optimization suggestions
4. **VS Code Extension**: GUI for configuration management
5. **Web Dashboard**: Browser-based configuration editor

### Integration Opportunities

1. **GitHub Apps**: Automatic setup on repository creation
2. **CI/CD Integration**: Validate configurations in build pipelines
3. **IDE Plugins**: Direct integration with development environments
4. **Supply Registry**: Central repository of community templates

## Conclusion

The `@outfitter/agents-config` package addresses a clear need for standardized AI agent configurations while demonstrating the value of the Outfitter supply system. Starting with CodeRabbit provides a concrete, high-value use case that can be expanded to other agents over time.

The package design emphasizes:

- **Practical utility** with immediate value for teams
- **Extensibility** for future agents and project types
- **Maintainability** through clear separation of concerns
- **Community contribution** through template sharing

This package would serve as an excellent proof-of-concept for the broader Outfitter ecosystem while solving real problems that development teams face today.

## Appendix

### Related Documents

- [CodeRabbit Configuration Guide](../fieldguides/content/guides/coderabbit-guide.md)
- [CLI Package vs App Migration Proposal](./cli-package-and-app.md)
- [Monorepo Standards](../architecture/monorepo-design.md)

### References

- [CodeRabbit Documentation](https://docs.coderabbit.ai/)
- [CodeRabbit YAML Schema](https://coderabbit.ai/integrations/schema.v2.json)
- [Minimatch Glob Patterns](https://github.com/isaacs/minimatch)
