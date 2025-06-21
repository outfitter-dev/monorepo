---
slug: why-monorepo
title: Why choose a monorepo architecture
description: Deep dive into the reasoning and benefits of monorepo architecture for modern development teams.
type: convention
---

# Why Monorepo

A deep exploration of when and why to choose monorepo architecture, based on real-world experience across various project scales.

## The Core Value Proposition

Monorepos solve three fundamental problems in modern software development:

### 1. Coordination Overhead

In multi-repo setups, making a change that spans multiple packages requires:

- Multiple PRs across repositories
- Careful coordination of merge order
- Version bumping and dependency updates
- Potential breaking changes between releases

With a monorepo:

- One atomic commit updates everything
- Changes are tested together before merge
- No version mismatches possible
- Refactoring tools work across boundaries

### 2. Inconsistent Standards

Multiple repositories naturally drift apart:

- Different linting rules
- Varying test frameworks
- Inconsistent build processes
- Divergent coding styles

Monorepos enforce consistency:

- Single source of configuration
- Shared tooling and scripts
- Unified CI/CD pipeline
- Consistent developer experience

### 3. Knowledge Silos

Separate repositories create barriers:

- Developers specialize in "their" repo
- Cross-team collaboration requires context switching
- Shared patterns are discovered, not designed
- Documentation lives in scattered locations

Monorepos promote knowledge sharing:

- All code is discoverable
- Patterns emerge and propagate naturally
- Single location for all documentation
- Easier onboarding to any part of the system

## When Monorepo Shines

### Rapid Product Development

**Scenario**: Startup building a SaaS product with web app, mobile app, and API

**Why monorepo works**:

- Feature development touches all layers
- Shared types ensure API contract safety
- Design system components used everywhere
- Quick pivots don't break version dependencies

**Example structure**:

```text
apps/
  web/          # Next.js customer portal
  mobile/       # React Native app
  admin/        # Internal admin panel
  api/          # Node.js backend
packages/
  ui/           # Shared component library
  types/        # TypeScript interfaces
  utils/        # Business logic
```

### Platform Engineering

**Scenario**: Building internal developer platform with multiple tools

**Why monorepo works**:

- Tools share common abstractions
- Configuration standards propagate instantly
- Updates to core affect all tools atomically
- Single deployment pipeline for all tools

**Real benefit**: When you fix a bug in the auth library, every tool gets the fix immediately - no waiting for downstream updates.

### Microservices with Shared Libraries

**Scenario**: Multiple services sharing authentication, logging, and monitoring

**Why monorepo works**:

- Shared libraries evolve with their consumers
- Breaking changes are impossible to miss
- Service boundaries remain clear
- Deployment can still be independent

**Key insight**: Monorepo ≠ monolith. Services can deploy independently while sharing code at build time.

## When Monorepo Struggles

### Open Source with External Contributors

**Challenge**: External contributors need to understand entire repository

**Why it's hard**:

- Large codebases intimidate new contributors
- CI runs everything, even for small changes
- Permissions become all-or-nothing
- Fork management is complex

**Better approach**: Separate repos with clear boundaries and simple contribution paths.

### Radically Different Tech Stacks

**Challenge**: iOS app (Swift), Android app (Kotlin), Backend (Go), Frontend (TypeScript)

**Why it's hard**:

- No shared tooling benefits
- Different build systems fight each other
- CI complexity explodes
- Developers rarely work across boundaries

**Better approach**: Separate repos by tech stack, share via published packages or APIs.

### Regulated or Compliance-Heavy Code

**Challenge**: Healthcare app with HIPAA-compliant services

**Why it's hard**:

- Audit requirements for entire repository
- Access control needs are different
- Compliance tools may scan everything
- Legal review of all code changes

**Better approach**: Separate regulated services with strict access control and audit trails.

## The Hidden Costs

### Build Time Complexity

Monorepos require sophisticated build orchestration:

- Dependency graph analysis
- Incremental builds
- Remote caching
- Parallel execution

**Investment required**: Plan to spend significant time on build infrastructure.

### Git Performance

Large monorepos can strain Git:

- Clone times increase
- History becomes massive
- Git operations slow down

**Mitigations needed**:

- Shallow clones
- Git LFS for large files
- Sparse checkouts
- History pruning

### Mental Model Shift

Teams must think differently:

- "My code" becomes "our code"
- Local changes can break distant packages
- Testing burden increases
- Ownership models need clarity

**Cultural change required**: Not just technical, but organizational.

## Making the Decision

### Choose monorepo when you have:

✅ **Tight coupling between projects** - Changes frequently span boundaries

✅ **Shared team ownership** - Same people work across projects

✅ **Need for consistency** - Standards matter more than autonomy

✅ **Frequent refactoring** - Architecture evolves rapidly

✅ **Complex dependency graph** - Many shared libraries

### Choose multi-repo when you have:

❌ **Strong autonomy needs** - Teams want full control

❌ **Different deployment cadences** - Some projects release hourly, others quarterly

❌ **Security boundaries** - Some code needs restricted access

❌ **Technology diversity** - Little shared tooling benefit

❌ **External contributors** - Open source or partner development

## Success Patterns

### Start Small

Begin with 2-3 closely related projects:

- Prove the tooling works
- Establish patterns
- Build team confidence
- Measure actual benefits

### Invest in Tooling

Budget significant time for:

- Build system optimization
- CI/CD pipeline setup
- Developer scripts
- Documentation

### Define Ownership

Clear ownership prevents chaos:

- CODEOWNERS files for each package
- Team responsibilities documented
- Review requirements defined
- Breaking change process established

### Measure Success

Track metrics that matter:

- Time from commit to deploy
- Cross-package refactoring time
- Build cache hit rates
- Developer satisfaction

## Conclusion

Monorepos are not universally better - they're a tool that excels in specific situations. The key is understanding whether your situation matches their strengths.

The best monorepo is one where:

- Developers barely notice it's a monorepo
- Tooling handles all the complexity
- Benefits clearly outweigh costs
- Teams actively choose to add new projects

The worst monorepo is one where:

- Build times frustrate developers
- Unrelated changes break your code
- Deployment becomes a nightmare
- Teams actively try to escape

Choose wisely, invest properly, and measure constantly.
