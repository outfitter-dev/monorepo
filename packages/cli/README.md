# @outfitter/cli

> Command-line tool for managing development standards, patterns, and project
> setup

## Installation

```bash
npm install -g @outfitter/cli
# or
pnpm add -g @outfitter/cli
```

## Quick Start

```bash
# Initialize a new project with supplies
outfitter init

# Add specific supplies to your project
outfitter add react-patterns typescript-standards

# See what's available
outfitter list

# Update to latest versions
outfitter update
```

## Commands

### `outfitter init`

Initialize a project with Outfitter supplies.

```bash
outfitter init                    # Interactive setup
outfitter init --preset nextjs    # Use Next.js preset
outfitter init --with-claude      # Include CLAUDE.md for AI assistance
```

**Available presets:**

- `nextjs` - Next.js full-stack applications
- `react` - React single-page applications
- `node` - Node.js backend services
- `minimal` - Just TypeScript standards

### `outfitter add`

Add specific supplies to your project.

```bash
outfitter add react-patterns
outfitter add typescript-standards testing-standards
```

### `outfitter list`

List available supplies.

```bash
outfitter list              # Show all available supplies
outfitter list --installed  # Show only installed supplies
```

### `outfitter update`

Update supplies to their latest versions.

```bash
outfitter update          # Update all supplies
outfitter update --check  # Check for updates without installing
```

### `outfitter pack`

Manage supply configurations (packlists).

```bash
# Export current configuration
outfitter pack export
outfitter pack export --output team-standard.json

# Import a configuration
outfitter pack import team-standard.json
```

## Configuration

Projects initialized with Outfitter have a `.outfitter/` directory containing:

```text
.outfitter/
├── config.json      # Project configuration and installed supplies
├── supplies/        # Local copies of installed supplies
└── cache/          # Version and update cache
```

### config.json

```json
{
  "version": "1.0.0",
  "preset": "nextjs",
  "supplies": [
    "typescript-standards",
    "react-patterns",
    "nextjs-patterns",
    "testing-standards"
  ],
  "installed": "2024-01-20T10:30:00Z"
}
```

## Packlists

Packlists allow you to share and standardize supply configurations across teams.

### Creating a Packlist

```bash
# Export your current setup
outfitter pack export --output frontend-standard.json
```

### Using a Packlist

```bash
# In a new project
outfitter init
outfitter pack import frontend-standard.json
```

### Packlist Format

```json
{
  "name": "Frontend Standard",
  "version": "1.0.0",
  "supplies": ["typescript-standards", "react-patterns", "testing-standards"],
  "created": "2024-01-20T10:30:00Z"
}
```

## Available Supplies

### Standards

- `typescript-standards` - Core TypeScript patterns and conventions
- `testing-standards` - Comprehensive testing methodology
- `security-standards` - Security baseline and best practices
- `documentation-standards` - Clear documentation guidelines

### Patterns

- `react-patterns` - React component and hook patterns
- `nextjs-patterns` - Next.js specific patterns
- `typescript-error-handling` - Error handling patterns
- `performance-patterns` - Performance optimization patterns

### Guides

- `react-hook-form` - Form handling with React Hook Form
- `react-query` - Data fetching with React Query
- `zustand-guide` - State management with Zustand
- `vitest-guide` - Testing with Vitest
- `playwright-guide` - E2E testing with Playwright

## Integration with AI Assistants

Use the `--with-claude` flag during initialization to create a `CLAUDE.md` file
that references your installed supplies:

```bash
outfitter init --preset react --with-claude
```

This creates a CLAUDE.md that helps AI assistants understand your project's
standards and patterns.

## Development

This package is part of the
[@outfitter/monorepo](https://github.com/outfitter-dev/monorepo).

See the [Development Guide](../../docs/contributing/development.md) for
instructions on building, testing, and contributing to this package.

## Roadmap

- [ ] GitHub integration for fetching supplies
- [ ] Version management and updates
- [ ] Custom supply sources
- [ ] Team/organization presets
- [ ] Supply dependency resolution
- [ ] Offline mode with cached supplies
- [ ] `outfitter doctor` - Check project compliance
- [ ] `outfitter migrate` - Migrate between standards versions

## License

MIT
