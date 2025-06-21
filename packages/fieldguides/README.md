# Supplies 🎒

> Essential supplies for consistent, high-quality software development expeditions.

## Overview

Supplies provides everything developers and AI agents need before embarking on a development journey. This comprehensive collection ensures teams are equipped with the right standards, patterns, and knowledge to navigate any project terrain successfully.

## The Mission 🗺️

Every great expedition needs proper preparation. This supplies repository solves the fundamental challenges of consistent development:

- **Cross-project navigation**: Ensuring agents follow the same trails across different codebases
- **Team coordination**: Multiple agents working with shared maps and protocols
- **Journey continuity**: Maintaining consistent practices across different sessions
- **Knowledge sharing**: Discoveries from one expedition improve all future journeys

## Base Camp Structure 🏕️

```text
supplies/
├── guidebooks/               # Professional documentation (no themes)
│   ├── CODING.md             # Universal coding principles
│   ├── TESTING.md            # Core testing requirements
│   ├── SECURITY.md           # Security baseline
│   ├── conventions/          # Team agreements and philosophies
│   ├── guides/               # Library-specific implementation guides
│   ├── operations/           # Deployment and monitoring practices
│   ├── patterns/             # Reusable implementation patterns
│   ├── references/           # Quick lookup material
│   ├── standards/            # Core standards by technology
│   └── templates/            # Ready-to-use configurations
├── docs/
│   ├── guidebooks/           # Documentation about guidebooks
│   ├── outfitter/            # Internal docs (expedition themed)
│   └── project/
│       ├── proposals/        # New expedition ideas
│       └── decisions/        # Route decisions and learnings
├── packages/                 # Future: Gear distribution (npm)
└── outfitter-mcp/           # Future: Real-time guide service
```

> **Note**: The expedition theme is used only in internal documentation. All guidebooks maintain professional, theme-neutral language for use in external projects.

## Current Expedition Gear 🧭

### Available Supplies

#### Universal Standards (Top Level)

- **[CODING.md](guidebooks/CODING.md)**: Universal coding principles
- **[TESTING.md](guidebooks/TESTING.md)**: Core testing requirements
- **[SECURITY.md](guidebooks/SECURITY.md)**: Security baseline

#### Core Standards

- **[TypeScript Standards](guidebooks/standards/typescript-standards.md)**: Core TypeScript patterns and conventions
- **[Documentation Standards](guidebooks/standards/documentation-standards.md)**: Guidelines for writing clear, consistent technical documentation
- **[Testing Standards](guidebooks/standards/testing-standards.md)**: Comprehensive testing methodology
- **[Configuration Standards](guidebooks/standards/configuration-standards.md)**: Environment and config patterns
- **[Deployment Standards](guidebooks/standards/deployment-standards.md)**: CI/CD patterns
- **[React Component Standards](guidebooks/standards/react-component-standards.md)**: Component design patterns
- **[Monorepo Standards](guidebooks/standards/monorepo-standards.md)**: Monorepo patterns

#### Patterns & Guides

- **[React Patterns](guidebooks/patterns/react-patterns.md)**: React component and hook patterns
- **[Next.js Patterns](guidebooks/patterns/nextjs-patterns.md)**: Next.js specific patterns
- **[TypeScript Error Handling](guidebooks/patterns/typescript-error-handling.md)**: Error handling patterns
- **[React Hook Form Guide](guidebooks/guides/react-hook-form.md)**: Form handling with React Hook Form
- **[React Query Guide](guidebooks/guides/react-query.md)**: Data fetching with React Query

### Upcoming Expeditions

- JavaScript wilderness guide
- Python development guide
- React component compass
- Next.js navigation charts
- Database mapping techniques
- API route planning
- Testing equipment guide
- Deployment expedition protocols

## For AI Explorers 🤖

Before setting out on any coding expedition:

1. **Check your supplies** - Review relevant guidebooks for your journey
2. **Follow the trails** - Use established processes others have blazed
3. **Pack the right gear** - Leverage templates for consistent equipment
4. **Respect the terrain** - Adhere to architectural patterns that work
5. **Share your discoveries** - Report back with improvements found along the way

## For Human Guides 👨‍💻

1. **Outfit your agents** - Share these guides with AI assistants
2. **Plan new routes** - Reference guides when charting new projects
3. **Report findings** - Contribute improvements from the field
4. **Update your maps** - Keep guides current via the npm package (coming soon)

## Quality Assurance 🛡️

### Documentation Validation

All guidebooks are automatically validated for consistency:

```bash
# Run all validation (markdown + frontmatter)
pnpm run lint

# Validate frontmatter only
pnpm run lint:frontmatter
```

Every guidebook document (except STANDARDS) requires frontmatter metadata that is validated on commit and in CI/CD pipelines. See [docs/guidebooks/frontmatter-schema.md](docs/guidebooks/frontmatter-schema.md) for details.

## Future Expeditions 🚀

### Outfitter Package (NPM)

Soon agents can automatically pack these essentials:

- Auto-sync guidebooks to project base camps
- Gear inspection tools for compliance checking
- Quick-deploy templates for common scenarios

### Outfitter-MCP (Guide Service)

Real-time expedition support providing:

- Live navigation assistance for agents
- Context-aware route recommendations
- Terrain-specific guidance (framework versions)
- Decision checkpoints for architectural choices

## Join the Expedition Team 🏔️

Every journey improves our collective knowledge:

1. **Scout new patterns** - Identify what works in the wild
2. **Map your findings** - Document discoveries clearly
3. **Propose new routes** - Submit ideas for better paths
4. **Share trail wisdom** - Learn from each expedition

## Expedition Philosophy 🧗

Agent Outfitter believes in:

- **Well-worn paths**: Strong opinions from proven routes
- **Living maps**: Continuously updated with field discoveries
- **Team coordination**: Every agent follows the same trail markers
- **Dual readability**: Guides work for both human and AI navigators
- **Field-tested**: Every guide proven on real expeditions

## License

[MIT License](LICENSE) - Free to use on all your adventures

---

_"Well-supplied teams build better software."_ ⛰️
