# Fieldguides - Navigation Guide

Structured documentation for consistent development practices, optimized for AI agent consumption and modern 2025 development workflows. These fieldguides provide opinionated, battle-tested patterns for building quality software efficiently.

## Structure

### Universal Standards (Top Level)

- **[CODING.md](CODING.md)** - Universal coding principles with 2025 patterns
- **[TESTING.md](TESTING.md)** - Core testing requirements with Jest/Vitest support
- **[SECURITY.md](SECURITY.md)** - Security baseline with modern threat prevention

### By Category

#### Standards

- **[standards/](standards/)** - Core standards for various aspects:
  - [TypeScript Standards](standards/typescript-standards.md) - Type safety and modern patterns
  - [Testing Standards](standards/testing-standards.md) - Comprehensive testing methodology
  - [Configuration Standards](standards/configuration-standards.md) - Environment management
  - [Documentation Standards](standards/documentation-standards.md) - Clear, maintainable docs
  - [React Component Standards](standards/react-component-standards.md) - Component design patterns
  - [Deployment Standards](standards/deployment-standards.md) - CI/CD and deployment patterns
  - [Monorepo Standards](standards/monorepo-standards.md) - Monorepo organization

#### Patterns

- **[patterns/](patterns/)** - Reusable implementation patterns:
  - [TypeScript Error Handling](patterns/typescript-error-handling.md) - Result types and error patterns
  - [TypeScript Validation](patterns/typescript-validation.md) - Zod and runtime validation
  - [TypeScript Utility Types](patterns/typescript-utility-types.md) - Advanced type patterns
  - [React Patterns](patterns/react-patterns.md) - Modern React 19 patterns
  - [React State Derivation](patterns/react-state-derivation.md) - State management patterns
  - [Next.js Patterns](patterns/nextjs-patterns.md) - Server Components and App Router
  - [Testing Unit](patterns/testing-unit.md) - Unit testing best practices
  - [Testing Integration](patterns/testing-integration.md) - Integration testing patterns
  - [Testing E2E](patterns/testing-e2e.md) - End-to-end testing with Playwright
  - [Testing Mocking](patterns/testing-mocking.md) - Mocking strategies
  - [Testing React Components](patterns/testing-react-components.md) - React testing patterns
  - [Framework Agnostic Testing](patterns/framework-agnostic-testing.md) - Cross-framework testing
  - [Performance Optimization](patterns/performance-optimization.md) - Performance patterns
  - [GitHub Actions](patterns/github-actions.md) - CI/CD automation
  - [Security Scanning](patterns/security-scanning.md) - Automated security checks

#### Guides

- **[guides/](guides/)** - Library-specific implementation guides:
  - [React Hook Form](guides/react-hook-form.md) - Form handling and validation
  - [React Query](guides/react-query.md) - Data fetching and state management
  - [Vitest Guide](guides/vitest-guide.md) - Modern testing framework
  - [Playwright Guide](guides/playwright-guide.md) - End-to-end testing
  - [TanStack Router Guide](guides/tanstack-router-guide.md) - Type-safe routing
  - [Zustand Guide](guides/zustand-guide.md) - Lightweight state management

#### Conventions

- **[conventions/](conventions/)** - Team agreements and philosophies:
  - [TypeScript Conventions](conventions/typescript-conventions.md) - Code style and patterns
  - [Testing Organization](conventions/testing-organization.md) - Test structure and naming
  - [Testing Philosophy](conventions/testing-philosophy.md) - Testing principles and TDD

#### Templates

- **[templates/](templates/)** - Ready-to-use configuration files:
  - [TypeScript Config](templates/typescript-tsconfig.json) - Base TypeScript configuration
  - [Jest Config](templates/testing-jest-config.ts) - Jest setup and configuration
  - [Vitest Config](templates/testing-vitest-config.ts) - Vitest setup and configuration
  - [React Testing Utils](templates/testing-react-utils.tsx) - React testing utilities
  - [GitHub Actions Workflow](templates/testing-github-actions.yml) - CI/CD workflow

#### Operations

- **[operations/](operations/)** - Deployment and monitoring practices:
  - [Monitoring & Observability](operations/monitoring-observability.md) - Application monitoring patterns

#### References

- **[references/](references/)** - Quick lookup material:
  - [Testing Frameworks Reference](references/testing-frameworks-reference.md) - Framework comparison and selection

## Navigation Tips

1. **Start with universal standards** (CODING, TESTING, SECURITY) for foundational principles
2. **Navigate to technology-specific standards** for detailed implementation guidance
3. **Use patterns** for specific implementation challenges and proven solutions
4. **Reference guides** for library-specific best practices and configurations
5. **Check templates** for ready-to-use configuration files and examples
6. **Follow conventions** for team consistency and code style

## Quick Start Paths

### New Project Setup

1. [CODING.md](CODING.md) → [TypeScript Standards](standards/typescript-standards.md) → [Configuration Standards](standards/configuration-standards.md)
2. [TESTING.md](TESTING.md) → [Testing Standards](standards/testing-standards.md) → [Vitest Guide](guides/vitest-guide.md)
3. [SECURITY.md](SECURITY.md) → [Security Scanning](patterns/security-scanning.md) → [GitHub Actions](patterns/github-actions.md)

### React Development

1. [React Component Standards](standards/react-component-standards.md) → [React Patterns](patterns/react-patterns.md)
2. [React Hook Form Guide](guides/react-hook-form.md) → [React Query Guide](guides/react-query.md)
3. [Testing React Components](patterns/testing-react-components.md) → [React Testing Utils](templates/testing-react-utils.tsx)

### Testing Focus

1. [TESTING.md](TESTING.md) → [Testing Standards](standards/testing-standards.md)
2. [Testing Unit](patterns/testing-unit.md) → [Testing Integration](patterns/testing-integration.md) → [Testing E2E](patterns/testing-e2e.md)
3. [Testing Organization](conventions/testing-organization.md) → [Testing Philosophy](conventions/testing-philosophy.md)

## Documentation Standards

### File Size Guidelines

- **Maximum 400 lines per file** for readability
- **Universal standards**: 250-350 lines (comprehensive coverage)
- **Category standards**: 300-400 lines (detailed implementation)
- **Pattern files**: 200-300 lines (focused examples)
- **Guide files**: 150-250 lines (practical tutorials)
- **Template files**: As needed for completeness

### Content Quality

- **Opinionated guidance**: These are proven patterns, not suggestions
- **Executable examples**: All code snippets are tested and working
- **Modern patterns**: Updated for 2025 best practices
- **AI-friendly**: Structured for both human and AI agent consumption

## Metadata Standards

### Frontmatter Requirements

All documents (except universal standards) require frontmatter with metadata:

```yaml
---
slug: unique-kebab-case-id
title: Descriptive title under 60 characters
description: One-sentence purpose ending with period.
type: convention|pattern|guide|template|reference
---
```

### Document Types

- **convention**: Team agreements and coding philosophies
- **pattern**: Reusable implementation patterns and solutions
- **guide**: Library-specific tutorials and best practices
- **template**: Ready-to-use configuration files and examples
- **reference**: Quick lookup tables and comparison guides

See [frontmatter-schema.md](../docs/fieldguides/frontmatter-schema.md) for full validation details.

## Contributing

When adding new fieldguides:

1. **Follow the documentation standards** outlined above
2. **Include working code examples** that have been tested
3. **Maintain consistency** with existing document structure
4. **Focus on practical guidance** over theoretical concepts
5. **Update this README** with links to new content

These fieldguides are living documentation that evolve with our development practices and industry best practices.
