# Outfitter

> Command-line tool for equipping your development journey with configurations and fieldguides.

## Installation

```bash
npm install -g outfitter
# or
pnpm add -g outfitter
# or
yarn global add outfitter
# or
brew install outfitter
```

## Quick Start

```bash
# Initialize a new project with Outfitter configurations
outfitter equip
# or
outfitter init

# Manage fieldguides (documentation & patterns)
outfitter fieldguides list
# or
outfitter fg list
outfitter fieldguides add react-patterns typescript-standards

# View help
outfitter --help
```

## Commands

### `outfitter equip` (alias: `init`)

Interactively install Outfitter configurations and utilities to your project.

```bash
outfitter equip                   # Interactive setup
outfitter equip --preset nextjs   # Use Next.js preset
```

**Available presets:**

- `nextjs` - Next.js full-stack applications
- `react` - React single-page applications
- `node` - Node.js backend services
- `minimal` - Just TypeScript standards

### `outfitter fieldguides` (alias: `fg`)

Manage project fieldguides - living documentation and patterns for your team.

```bash
# List available fieldguides
outfitter fieldguides list

# Add fieldguides to your project
outfitter fieldguides add react-patterns typescript-standards

# Update existing fieldguides
outfitter fieldguides update

# Create a new fieldguide
outfitter fieldguides create

# Configure fieldguide settings
outfitter fieldguides config
```

## Terrain Detection

Outfitter automatically detects your project's technology stack to provide tailored recommendations and configurations. This "terrain detection" analyzes your project for:

### Detected Frameworks

- **Frontend**: Next.js, React, Vue, Svelte, Angular
- **Build Tools**: Vite, Webpack
- **Languages**: TypeScript, JavaScript, Python

### Detected Tools

- **Testing**: Vitest, Jest, Playwright, Cypress
- **State Management**: Zustand, Redux, MobX
- **Package Managers**: pnpm, yarn, npm, bun
- **CI/CD**: GitHub Actions, GitLab CI
- **Containerization**: Docker

### Detected Project Types

- Monorepo structures (pnpm workspaces, Lerna, Nx, Rush)
- TypeScript projects
- Python projects

The terrain detection runs automatically when you use commands like `outfitter equip` or `outfitter fieldguides add`, ensuring that:

- Recommended configurations match your tech stack
- Fieldguides are relevant to your frameworks
- Installation commands use your preferred package manager

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

Use the `--with-claude` flag during initialization to create a `CLAUDE.md` file that references your installed supplies:

```bash
outfitter init --preset react --with-claude
```

This creates a CLAUDE.md that helps AI assistants understand your project's standards and patterns.

## Development

This package is part of the [Outfitter monorepo](https://github.com/outfitter-dev/monorepo).

See the [Development Guide](../../docs/contributing/development.md) for instructions on building, testing, and contributing to this package.

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
