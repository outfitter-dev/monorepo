# Universal Coding Standards

Core principles and practices that apply across all languages, frameworks, and projects. These standards establish a foundation for maintainable, secure, and performant software development in 2025 and beyond.

## Related Standards

- [Testing Standards](./TESTING.md) - Test-driven development practices
- [Security Standards](./SECURITY.md) - Security-first development
- [TypeScript Standards](./standards/typescript-standards.md) - Type safety patterns
- [Documentation Standards](./standards/documentation-standards.md) - Clear documentation

## Foundational Design Principles

### KISS (Keep It Simple, Stupid)

- Write clear, direct, understandable code
- Avoid unnecessary abstraction layers
- Prioritize readability over cleverness
- Choose simple solutions that work

### YAGNI (You Aren't Gonna Need It)

- Only implement features needed today
- Avoid speculative generalization
- Delete unused code promptly
- Keep codebases lean and focused

### DRY (Don't Repeat Yourself)

- Extract common logic into reusable functions
- Maintain single sources of truth
- Refactor duplication as soon as it appears
- Balance DRY with readability

### SOLID Principles

#### Single Responsibility

- One class, one purpose
- One reason to change
- Clear, focused responsibilities

#### Open/Closed

- Open for extension
- Closed for modification
- Extend behavior without changing existing code

#### Liskov Substitution

- Subtypes must be substitutable for base types
- Maintain behavioral compatibility
- Honor contracts and invariants

#### Interface Segregation

- Many specific interfaces over one general interface
- Clients shouldn't depend on methods they don't use
- Keep interfaces focused and cohesive

#### Dependency Inversion

- Depend on abstractions, not concretions
- High-level modules shouldn't depend on low-level modules
- Both should depend on abstractions

## Code Organization

### Single Responsibility

- Each module/class/function has one clear purpose
- Split complex logic into smaller, focused pieces
- Name things according to what they do
- Use interfaces to define clear contracts
- Prefer pure functions for predictable behavior

### Composition Over Inheritance

- Build complex behavior by combining simple pieces
- Favor object composition over class inheritance
- Use interfaces and union types for flexibility
- Leverage functional composition patterns
- Use dependency injection for testability

### Separation of Concerns

- Separate business logic from presentation
- Isolate infrastructure from domain logic
- Keep side effects at system boundaries
- Implement clean architecture with clear layer boundaries
- Use appropriate patterns for your framework

## Error Handling

### Make Errors Explicit

- Use Result/Either types for explicit error handling
- Make error cases visible in function signatures
- Document potential failure modes clearly
- Prefer discriminated unions for error states
- Use runtime validation with clear error types

### Handle All Cases

- Always handle both success and error paths
- Provide meaningful, user-actionable error messages
- Include context for debugging (user ID, action, timestamp)
- Use error boundaries for graceful UI degradation
- Implement structured logging for error tracking

### Fail Fast

- Detect problems as early as possible
- Validate inputs at system boundaries
- Return errors immediately when detected
- Use assert-style validation in development
- Implement circuit breakers for external dependencies

### Graceful Degradation

- Design systems to handle partial failures
- Provide fallback behavior where appropriate
- Log errors for monitoring and debugging

## Naming Conventions

### General Rules

- Use descriptive, self-documenting names
- Avoid abbreviations and acronyms
- Be consistent within a codebase
- Prefer clarity over brevity
- Use semantic naming that AI agents can understand
- Follow language-specific conventions

### Common Patterns

- **Classes/Types**: Nouns (User, OrderService, ApiResponse)
- **Functions/Methods**: Verbs (calculateTotal, getUserById, transformData)
- **Booleans**: Questions (isValid, hasPermission, canEdit)
- **Constants**: SCREAMING_SNAKE_CASE
- **Private members**: Language-specific convention
- **Components**: Framework-specific patterns
- **Hooks/Composables**: Framework conventions

### Avoid

- Single letter variables (except loop counters)
- Generic names (data, info, temp)
- Negative boolean names (notValid, disabled)
- Temporal references (newUser, oldConfig, v2Component)
- Misleading names that don't match implementation
- Overly abbreviated names that reduce clarity

## Documentation & AI Collaboration

### Code Comments

- Explain "why" not "what"
- Document complex algorithms with examples
- Note assumptions and constraints
- Keep comments up to date with code
- Remove outdated comments promptly
- Use language-specific documentation formats
- Include performance considerations for critical paths
- Document AI agent collaboration patterns

### Function Documentation

- Document purpose and behavior clearly
- List parameters with types and constraints
- Describe return values and types (including error cases)
- Note side effects and exceptions
- Include usage examples for complex APIs
- Use documentation tools for IDE and AI agent support
- Document async behavior and error handling
- Include performance characteristics where relevant

### Self-Documenting Code

- Choose clear variable and function names
- Keep functions small and focused (< 20 lines ideal)
- Use meaningful constants instead of magic numbers
- Structure code to reveal intent
- Use type systems as documentation
- Prefer explicit over implicit behavior
- Use descriptive test names as living documentation

## Testing Integration

### Test-First Development

- Write tests before implementation
- Let tests drive design decisions
- Red-Green-Refactor cycle
- One failing test at a time

### Test Characteristics

- **Fast**: Tests run quickly
- **Independent**: No shared state
- **Repeatable**: Same results every time
- **Self-Validating**: Clear pass/fail
- **Timely**: Written just before code

### Test Coverage

- Test behavior, not implementation
- Cover happy paths and edge cases
- Include error scenarios
- Maintain agreed coverage thresholds

See [Testing Standards](./TESTING.md) for comprehensive testing practices.

## Performance & Optimization

### Measure First

- Profile before optimizing with modern tools
- Identify actual bottlenecks using APM tools
- Set performance targets (Core Web Vitals for web)
- Monitor production metrics continuously
- Use language-specific performance features
- Implement performance budgets in CI/CD

### Common Optimizations

- Cache expensive computations appropriately
- Minimize I/O operations and use connection pooling
- Use appropriate data structures (Map vs Object, Set vs Array)
- Batch operations where possible
- Lazy load components and modules
- Use streaming and pagination for large datasets
- Implement proper database indexing

### Avoid Premature Optimization

- Write clear code first
- Optimize only when necessary
- Document performance-critical sections
- Consider maintenance cost

## Security-First Development

### Least Privilege

- Grant minimal necessary permissions by default
- Limit scope of access appropriately
- Review permissions regularly through automated audits
- Revoke unused access promptly
- Use environment-specific configurations
- Implement role-based access control (RBAC)

### Input Validation

- Never trust user input - validate everything
- Validate at system boundaries using schema validation
- Sanitize data before use and storage
- Use allowlists over denylists for better security
- Implement CSRF protection on all forms
- Use parameterized queries to prevent SQL injection
- Validate file uploads thoroughly

### Secure by Default

- Fail closed, not open (deny by default)
- Require explicit permission for sensitive operations
- Use secure defaults in all configurations
- Keep security simple and understandable
- Enable strict type checking where available
- Use HTTPS everywhere (HSTS headers)
- Implement secure headers (CSP, CSRF protection)

### Defense in Depth

- Multiple layers of security at every level
- Don't rely on single controls or trust boundaries
- Plan for control failures with graceful degradation
- Monitor and alert on anomalies
- Implement client-side and server-side validation
- Use security scanning in CI/CD pipelines
- Regular dependency vulnerability scanning

See [Security Standards](./SECURITY.md) for comprehensive security practices.

## Version Control & AI Collaboration

### Commit Practices

- Make atomic commits with single responsibility
- Write clear commit messages using conventional commits
- Commit early and often to enable collaboration
- Keep commits focused and reviewable
- Use semantic commit types (feat, fix, docs, refactor)
- Include issue references where applicable

### Branching Strategy

- Use trunk-based development with feature branches
- Keep branches short-lived (< 1 week)
- Merge regularly to avoid conflicts
- Delete merged branches promptly
- Use meaningful branch names (feat/user-auth, fix/memory-leak)
- Implement branch protection rules

### Code Review

- Review all changes before merging (no exceptions)
- Focus on correctness, security, and maintainability
- Be constructive and specific in feedback
- Learn from review feedback and share knowledge
- Use automated checks before human review
- Include AI agents in code review process where appropriate
- Check for security vulnerabilities and performance issues

## Continuous Improvement & AI Integration

### Refactoring

- Improve code without changing behavior
- Refactor in small steps with tests
- Keep tests passing throughout
- Clean up as you go (Boy Scout rule)
- Use IDE refactoring tools
- Leverage AI agents for safe refactoring
- Monitor performance impact of changes

### Learning & AI Collaboration

- Stay current with best practices and emerging patterns
- Learn from mistakes through postmortems
- Share knowledge with team and AI agents
- Experiment in safe environments (feature flags)
- Collaborate effectively with AI agents
- Understand AI agent capabilities and limitations
- Provide clear context for AI assistance

### Feedback Loops

- Shorten feedback cycles with modern tooling
- Automate repetitive checks (linting, testing, security)
- Monitor production behavior with observability
- Act on lessons learned quickly
- Use feature flags for safe deployments
- Implement continuous deployment with proper gates
- Gather user feedback early and often

## Modern Development Practices

### AI/Agent-Assisted Development

- Provide clear context and constraints for AI/Agent assistance
- Use descriptive names and comments that AI/Agents can understand
- Structure code in patterns that AI/Agents recognize
- Maintain consistent conventions across the codebase
- Document complex business logic for AI/Agents comprehension

### Modern Type Safety

- Use strict type checking in statically typed languages
- Leverage advanced type system features appropriately
- Use const assertions and literal types where available
- Implement proper error handling with type discrimination
- Validate runtime data against type definitions
- Prefer compile-time safety over runtime checks
- Use type inference to reduce boilerplate

### Framework Evolution

- Stay current with framework best practices
- Use server-side rendering where appropriate
- Implement proper code splitting and lazy loading
- Leverage concurrent features for better UX
- Follow composition patterns over inheritance
- Use framework-specific optimizations wisely
- Keep framework updates manageable

### Performance Monitoring

- Implement comprehensive observability from day one
- Use distributed tracing for microservices
- Monitor Core Web Vitals and user experience metrics
- Set up alerting for performance regressions
- Use feature flags for gradual rollouts
- Implement proper error tracking and reporting
- Regular performance audits and optimization

### Security Automation

- Automate dependency vulnerability scanning
- Implement SAST/DAST in CI/CD pipelines
- Use security linters and pre-commit hooks
- Regular security training for development teams
- Automated compliance checking
- Implement security chaos engineering
- Continuous security monitoring in production

## Summary

These universal coding standards provide a foundation for building high-quality software in 2025 and beyond. They emphasize:

- **Security and reliability** as fundamental requirements
- **AI collaboration** as a force multiplier for development
- **Type safety and validation** to prevent errors early
- **Performance and user experience** as key metrics
- **Continuous improvement** through automation and monitoring

Apply these principles thoughtfully, adapting them to your specific context while maintaining the core values of simplicity, security, and maintainability.
