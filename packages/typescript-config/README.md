# @outfitter/typescript-config

> Shared TypeScript configurations for consistent, strict type safety across Outfitter projects

## Installation

```bash
npm install --save-dev @outfitter/typescript-config
# or
pnpm add -D @outfitter/typescript-config
```

## Usage

Extend one of the provided configurations in your `tsconfig.json`:

### Base Configuration (Recommended)

For general TypeScript projects:

```json
{
  "extends": "@outfitter/typescript-config/base",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### Next.js Configuration

For Next.js applications:

```json
{
  "extends": "@outfitter/typescript-config/next",
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"]
}
```

### Vite Configuration

For Vite-based applications:

```json
{
  "extends": "@outfitter/typescript-config/vite",
  "include": ["src", "vite.config.ts"],
  "exclude": ["node_modules", "dist"]
}
```

## What's Included

### Strict Type Safety

All configurations enforce maximum type safety:

- **`strict: true`**: Enables all strict type checking options
- **`noImplicitAny: true`**: No implicit `any` types allowed
- **`strictNullChecks: true`**: Null and undefined must be handled explicitly
- **`noUncheckedIndexedAccess: true`**: Array/object access returns `T | undefined`
- **`exactOptionalPropertyTypes: true`**: Optional properties can't be set to `undefined`

### Modern JavaScript

- **Target**: ES2022 with ES2023 library features
- **Module**: ESNext with bundler resolution
- **`verbatimModuleSyntax: true`**: Explicit import/export syntax

### Developer Experience

- **Path Mapping**: `@/*` maps to `./src/*` by default
- **Incremental Builds**: Faster subsequent compilations
- **Declaration Maps**: Better IDE navigation to source

### Code Quality

- **`noUnusedLocals: true`**: Catch unused variables
- **`noUnusedParameters: true`**: Catch unused function parameters
- **`noImplicitReturns: true`**: All code paths must return
- **`noFallthroughCasesInSwitch: true`**: Explicit break/return in switch cases

## Configuration Details

### Base Configuration

The strictest configuration for maximum type safety and code quality. Use this for:

- Libraries
- Node.js applications
- General TypeScript projects

### Next.js Configuration

Extends base with Next.js-specific settings:

- JSX support for React
- Next.js module resolution
- Optimized for Next.js build system

### Vite Configuration

Extends base with Vite-specific settings:

- JSX support for React
- Vite-compatible module resolution
- Client-side DOM types

## Customization

Override any setting in your local `tsconfig.json`:

```json
{
  "extends": "@outfitter/typescript-config/base",
  "compilerOptions": {
    // Example: Allow unused locals during development
    "noUnusedLocals": false,

    // Example: Custom paths
    "paths": {
      "@/*": ["./src/*"],
      "@components/*": ["./src/components/*"]
    }
  }
}
```

## Best Practices

1. **Don't disable strict checks**: Work with the type system, not against it
2. **Handle all cases**: The configs force you to handle edge cases explicitly
3. **Use path aliases**: Keep imports clean with the `@/*` alias
4. **Enable project references**: For monorepos, use TypeScript project references

## Migration Guide

For detailed instructions on migrating from a loose TypeScript configuration to strict settings, see the [TypeScript Migration Guide](../../docs/migration/loose-to-strict-typescript.md).

## Development

This package is part of the [@outfitter/monorepo](https://github.com/outfitter-dev/monorepo) monorepo.

See the [Development Guide](../../docs/contributing/development.md) for instructions on building, testing, and contributing to this package.

## License

MIT
