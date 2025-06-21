---
slug: documentation-standards
title: Write clear docs that serve humans and AI agents
description: Standards for consistent, practical documentation across all projects.
type: convention
---

# Documentation Standards

Clear, consistent documentation that serves both human developers and AI agents effectively.

## Related Documentation

- [TypeScript Standards](./typescript-standards.md) - Code documentation
- [Testing Standards](./testing-standards.md) - Test documentation
- [Component Architecture](./react-component-standards.md) - Component docs
- [Deployment Standards](./deployment-standards.md) - Deployment docs

## Version Compatibility

This guide assumes:

- Markdown: CommonMark specification
- TypeScript: 4.0+ (for JSDoc features)
- Markdownlint: 0.25+ (for linting)

## Core Principles

### Clarity First

- Write for comprehension, not cleverness
- Use simple, direct language
- Avoid jargon unless industry-standard
- Define technical terms on first use

### Consistency Matters

- Follow established patterns within the codebase
- Use consistent terminology throughout
- Maintain uniform formatting and structure
- Match the style of existing documentation

### Practical Focus

- Include executable examples
- Provide real-world use cases
- Explain the "why" not just the "how"
- Keep content actionable

## Document Structure

### Required Sections

Every technical document must include:

```markdown
# 🚧 Pseudo-code: Document structure template

# [Feature/Component Name]

Brief description of what this covers and why it matters.

## Overview

High-level explanation of the concept or component.

## Usage

How to use this in practice, with examples.

## API Reference (if applicable)

Detailed parameter and return value documentation.

## Examples

Complete, working code examples.

## Common Patterns

Typical use cases and recommended approaches.

## Troubleshooting (if applicable)

Common issues and their solutions.
```

### Headings Hierarchy

- **H1 (#)**: Document title only
- **H2 (##)**: Major sections
- **H3 (###)**: Subsections
- **H4 (####)**: Specific topics within subsections
- Avoid deeper nesting than H4

## Writing Style

### Language Guidelines

**DO:**

- Use active voice: "The function returns an array"
- Write in present tense: "This method creates a new instance"
- Be specific: "Increases timeout to 5000ms" not "Increases timeout"
- Use imperative mood for instructions: "Set the environment variable"

**DON'T:**

- Use passive voice: "An array is returned by the function"
- Use future tense: "This will create a new instance"
- Be vague: "Makes it wait longer"
- Use conditional mood: "You should set the environment variable"

### Code Examples

#### Formatting

```typescript
// 📚 Educational: Good documentation example
// Good: Clear, complete example with context
interface UserConfig {
  timeout: number;
  retries: number;
}

function configureUser(options: UserConfig): void {
  // Validate timeout is positive
  if (options.timeout <= 0) {
    throw new Error('Timeout must be positive');
  }

  // Apply configuration
  applyConfig(options);
}

// Usage
configureUser({ timeout: 5000, retries: 3 });
```

```typescript
// 📚 Educational: Bad documentation example
// Bad: Incomplete, lacks context
function configure(opts) {
  // ...
}
```

#### Requirements

- Include all necessary imports
- Show both definition and usage
- Add brief comments for complex logic
- Ensure examples are runnable
- Test examples before documenting

## API Documentation

### Function Documentation

````typescript
// 📚 Educational: JSDoc documentation example
/**
 * Processes user data according to specified rules.
 *
 * @param userData - The raw user data to process
 * @param rules - Processing rules to apply
 * @returns Processed user data with applied transformations
 *
 * @example
 * ```typescript
 * const processed = processUser(
 *   { name: 'John', age: 30 },
 *   { uppercase: true }
 * );
 * // Returns: { name: 'JOHN', age: 30 }
 * ```
 *
 * @throws {ValidationError} When userData is invalid
 * @throws {RuleError} When rules cannot be applied
 */
function processUser(userData: UserData, rules: ProcessRules): ProcessedUser {
  // Implementation
}
````

### Parameter Documentation

Always document:

- **Type**: Explicit TypeScript types
- **Purpose**: What the parameter controls
- **Constraints**: Valid ranges, formats, or values
- **Defaults**: If applicable
- **Examples**: For complex types

## Maintenance

### Keeping Documentation Current

1. **Update with code**: Documentation changes must accompany code changes
2. **Review regularly**: Audit documentation quarterly for accuracy
3. **Remove outdated content**: Delete obsolete information rather than marking
as deprecated
4. **Version appropriately**: Clearly document breaking changes and migration
paths
5. **Test examples**: Verify all code examples work with current versions

### Documentation Tests

Where possible, extract and test code examples:

```json
// 🚧 Pseudo-code: Documentation testing script
{
  "scripts": {
    "test:docs": "doctest README.md docs/**/*.md"
  }
}
```

## Special Considerations

### For AI Agents

- Use consistent naming patterns across all documentation
- Provide explicit type information and parameter details
- Include complete error handling examples
- Document edge cases and error conditions clearly
- Avoid ambiguous pronouns (use specific nouns instead)
- Structure information hierarchically for easy parsing

### For Human Developers

- Include conceptual explanations and background context
- Provide migration guides for breaking changes
- Link to related documentation and external resources
- Add visual diagrams where helpful
- Include performance considerations and trade-offs
- Explain the reasoning behind design decisions

## Common Patterns

### Configuration Documentation

````markdown
# 🚧 Pseudo-code: Configuration documentation template

## Configuration

The service accepts the following configuration options:

| Option    | Type      | Default | Description                     |
| --------- | --------- | ------- | ------------------------------- |
| `port`    | `number`  | `3000`  | Server port                     |
| `timeout` | `number`  | `30000` | Request timeout in milliseconds |
| `debug`   | `boolean` | `false` | Enable debug logging            |

### Example Configuration

\```json { "port": 8080, "timeout": 60000, "debug": true } \```
````

### Error Documentation

````markdown
# 🚧 Pseudo-code: Error documentation template

## Error Handling

The API may return the following errors:

### ValidationError

Thrown when input validation fails.

**Code**: `VALIDATION_ERROR` **Status**: 400

\```typescript { code: 'VALIDATION_ERROR', message: 'Invalid email format',
field: 'email' } \```
````

## Review Checklist

Before finalizing documentation:

- [ ] All code examples are tested and working
- [ ] Technical terms are defined or linked
- [ ] Structure follows the standard template
- [ ] No outdated information remains
- [ ] Examples cover common use cases
- [ ] Error scenarios are documented
- [ ] API signatures are complete
- [ ] Cross-references are valid
