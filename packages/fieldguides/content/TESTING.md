# Universal Testing Standards

Core testing principles and requirements that apply across all projects, languages, and frameworks. These standards ensure comprehensive test coverage while supporting modern development practices including AI agent collaboration.

## Related Standards

- [Coding Standards](./CODING.md) - Test-driven development integration
- [Security Standards](./SECURITY.md) - Security testing practices
- [TypeScript Standards](./standards/typescript-standards.md) - Type-safe testing
- [Testing Standards](./standards/testing-standards.md) - Detailed testing methodology

## Core Testing Philosophy

### Test-Driven Development (TDD)

Follow the Red-Green-Refactor cycle:

1. **Red**: Write a failing test that captures the requirement
2. **Green**: Implement the minimum code to make the test pass
3. **Refactor**: Improve the design while keeping tests green

### Testing Strategy

Balance your test portfolio for optimal coverage and speed:

- **Unit Tests** (60-70%): Fast, isolated, numerous
- **Integration Tests** (20-30%): Component interactions
- **End-to-End Tests** (5-10%): Critical user workflows
- **Contract Tests**: API compatibility
- **Visual Regression Tests**: UI consistency
- **Accessibility Tests**: WCAG compliance
- **Performance Tests**: Load and benchmarking
- **Security Tests**: Vulnerability scanning

## Test Characteristics (FIRST)

### Fast

- Tests should execute quickly for fast feedback
- Milliseconds for unit tests (< 50ms ideal, < 100ms max)
- Seconds for integration tests (< 2s ideal, < 5s max)
- Minutes for E2E tests (< 5m ideal, < 10m max)
- Use parallel execution and test sharding
- Optimize test setup and teardown

### Independent

- No shared state between tests
- Tests can run in any order
- Each test sets up its own data
- Use test isolation and cleanup
- Mock external dependencies properly

### Repeatable

- Same result every time across environments
- No dependency on external factors
- Deterministic outcomes
- Use fixed test data and mocked time
- Control randomness with seeded generators

### Self-Validating

- Clear pass/fail result with descriptive messages
- No manual verification needed
- Automated assertions with proper error reporting
- Include screenshots for visual test failures
- Generate detailed test reports

### Timely

- Written just before the code (TDD)
- Part of the development process
- Not an afterthought or separate phase
- Integrated into CI/CD pipeline
- Fast feedback loops with developers

## Testing Levels

### Unit Tests

- Test individual functions/methods in isolation
- Mock external dependencies comprehensively
- Focus on one behavior per test
- Should complete in milliseconds (< 50ms)
- Use descriptive test names that read like sentences
- Cover edge cases and error conditions
- Test pure business logic thoroughly

### Integration Tests

- Test component interactions with real implementations
- Use test databases and services where practical
- Verify data flow between modules
- Test API contracts and database schemas
- Include authentication and authorization flows
- Test external service integrations
- Use testcontainers for database testing

### End-to-End Tests

- Test complete user scenarios from UI to database
- Exercise the full stack in production-like environment
- Verify critical business workflows only
- Accept longer execution times but optimize where possible
- Include accessibility testing
- Test across different browsers and devices
- Use visual regression testing for UI consistency

### Contract Tests

- Verify API compatibility between services
- Test both provider and consumer contracts
- Use tools like Pact or Spring Cloud Contract
- Prevent integration failures early
- Version contracts appropriately
- Include in CI/CD pipeline

## Test Organization

### Directory Structure

```plaintext
src/
  feature/
    feature.ts
    feature.test.ts              # Unit tests
    feature.integration.test.ts  # Integration tests
    __tests__/                   # Alternative: tests folder
tests/
  integration/
    api.test.ts
    database.test.ts
  e2e/
    critical-paths.test.ts
    accessibility.test.ts
  contracts/
    api-contracts.test.ts
  performance/
    load.test.ts
    benchmark.test.ts
  security/
    vulnerability.test.ts
  visual/
    screenshot.test.ts
```

### Naming Conventions

- **Test files**: `*.test.*` or `*.spec.*`
- **Integration tests**: `*.integration.test.*`
- **E2E tests**: `*.e2e.test.*`
- **Contract tests**: `*.contract.test.*`
- **Performance tests**: `*.perf.test.*` or `*.benchmark.test.*`
- **Test suites**: Describe what is being tested
- **Test cases**: Describe expected behavior clearly
- Use descriptive names that read like sentences
- Follow "should do X when Y" pattern

## Coverage Requirements & Metrics

### Minimum Thresholds

- **Overall**: 80% (90% for critical paths)
- **Statements**: 80%
- **Branches**: 75%
- **Functions**: 80%
- **Lines**: 80%
- **Mutation Testing**: 70% (where applicable)
- **Accessibility**: 100% of interactive elements
- **Security**: 100% of authentication/authorization code

### What to Cover

- All public APIs and their contracts
- Edge cases and error paths
- Critical business logic and calculations
- Security-sensitive code and authentication
- Performance-critical paths
- User interaction flows
- Accessibility features and keyboard navigation
- Data validation and transformation
- State management logic

### What Not to Cover

- Third-party libraries (test integrations instead)
- Generated code and build artifacts
- Simple getters/setters without logic
- Configuration files (validate in integration tests)
- Type definitions without runtime behavior
- External service implementations (use contract tests)
- UI framework internals
- Development-only code

## Test Writing Guidelines

### AAA Pattern

```typescript
describe('UserService', () => {
  it('should create user with valid data', async () => {
    // Arrange
    const userData = createValidUserData();
    const mockRepository = createMockRepository();

    // Act
    const result = await userService.create(userData);

    // Assert
    expect(result).toMatchObject({
      id: expect.any(String),
      ...userData,
    });
    expect(mockRepository.save).toHaveBeenCalledOnce();
  });
});
```

### Focused Test Design

- Test one behavior at a time for clarity
- Multiple assertions only if testing one concept
- Split complex tests into smaller, focused ones
- Use test.each for parameterized testing
- Group related assertions logically
- Keep test setup minimal and relevant

### Test Behavior, Not Implementation

- Focus on what the code does, not how it does it
- Don't test private methods directly
- Verify outcomes and public contracts
- Test user-facing behavior and API contracts
- Avoid testing internal implementation details
- Refactor tests when implementation changes

## Testing Patterns

### Test Data Management

- Use factories for complex objects (Factory Pattern)
- Keep test data minimal but realistic
- Make data intention-revealing and semantic
- Avoid production data in tests
- Use builders for flexible test data creation
- Implement data cleanup strategies
- Use faker libraries for realistic test data

### Mocking Strategies

- Mock external dependencies and side effects
- Keep mocks simple and focused
- Verify mock interactions and call counts
- Don't mock what you don't own (use contract tests)
- Use MSW for API mocking in integration tests
- Mock time and randomness for deterministic tests
- Prefer dependency injection for easier mocking

### Async Testing Best Practices

- Always handle promises and async/await properly
- Set appropriate timeouts (not too short/long)
- Avoid arbitrary delays (use waitFor utilities)
- Test both success and failure cases
- Use fake timers for time-dependent code
- Test race conditions and concurrent scenarios
- Handle cleanup for async operations

### Error Testing Patterns

- Test error conditions explicitly with expect.rejects
- Verify error messages and error types
- Check error handling and recovery paths
- Test boundary conditions and edge cases
- Test user-facing error messages
- Validate error logging and monitoring
- Test timeout and retry behaviors

## Performance & Accessibility Testing

### Performance Testing

- Define clear performance requirements (SLAs)
- Test under realistic conditions and data volumes
- Monitor resource usage (CPU, memory, network)
- Identify bottlenecks and scaling limits
- Use tools like k6, Artillery, or Playwright for performance
- Test both normal and peak load scenarios
- Include performance regression tests in CI

### Benchmark Testing

- Establish performance baselines with Vitest bench
- Track performance over time in CI
- Test performance-critical paths
- Set acceptable thresholds and alerts
- Use statistical analysis for reliable results
- Include memory and CPU profiling
- Compare performance across implementations

### Accessibility Testing

- Test keyboard navigation and focus management
- Verify screen reader compatibility
- Check color contrast and visual accessibility
- Test with automated tools (axe-core, Lighthouse)
- Include manual accessibility testing
- Follow WCAG 2.1 AA guidelines minimum
- Test with real assistive technologies
- Include accessibility in E2E tests

## Modern Testing Tools

### Jest/Vitest Dual Support

- Support both Jest and Vitest configurations
- Use Vitest for new projects (faster, ESM-native)
- Keep Jest for legacy projects and complex mocking
- Maintain compatible test patterns
- Share test utilities between frameworks
- Use framework-specific features wisely

See our framework-specific guides:

- [Vitest Guide](./guides/vitest-guide.md)
- [Testing Frameworks Reference](./references/testing-frameworks-reference.md)

### Testing Tool Ecosystem

- **Unit/Integration**: Vitest, Jest
- **E2E**: Playwright, Cypress
- **API Testing**: Supertest, MSW, Hurl
- **Performance**: k6, Artillery, Vitest bench
- **Visual**: Percy, Chromatic, Playwright
- **Accessibility**: axe-core, Pa11y
- **Security**: OWASP ZAP, Snyk

## CI/CD Integration & Automation

### Pipeline Requirements

- All tests must pass before merge (no exceptions)
- Run tests on every commit and PR
- Fail fast on test failures with clear reporting
- Generate coverage reports and trends
- Include security and accessibility testing
- Run performance regression tests
- Implement flaky test detection and retry

### Pipeline Optimization

- Parallelize test execution across multiple workers
- Run unit tests first for fast feedback
- Cache dependencies and build artifacts
- Use affected test selection (nx, turborepo)
- Implement test sharding for large test suites
- Use matrix testing for multiple environments
- Optimize Docker layers for faster builds

## Security & Compliance Testing

### Input Validation Testing

- Test with malicious input (XSS, SQL injection)
- Verify sanitization and encoding
- Check boundary conditions and edge cases
- Test authorization and authentication rules
- Validate CSRF protection
- Test file upload security

### Security Test Scenarios

- Authentication flows and password policies
- Authorization checks and role-based access
- Data encryption at rest and in transit
- Session management and timeout handling
- API security and rate limiting
- Dependency vulnerability scanning

## Testing Best Practices

### DO 

- Write tests first (TDD) for better design
- Keep tests simple, focused, and readable
- Use descriptive test names that explain behavior
- Clean up test resources and side effects
- Run tests locally before pushing
- Fix flaky tests immediately (zero tolerance)
- Review test code like production code
- Include performance and accessibility tests
- Use AI agents to help generate test cases
- Test in isolation with proper mocking
- Use continuous testing during development

### DON'T

- Share state between tests
- Use production resources or data
- Ignore failing tests or mark as skip
- Test implementation details
- Write tests after the fact
- Use random or time-based data without seeding
- Skip tests to meet deadlines
- Write overly complex test setup
- Test multiple concerns in one test
- Mock too much (test real behavior when possible)
- Rely solely on E2E tests

## Test Debugging

### Investigation Steps

1. Read the error message and stack trace carefully
2. Run the single failing test in isolation
3. Check recent changes and git blame
4. Verify test assumptions and data setup
5. Add debugging output and logging
6. Simplify to isolate the root issue
7. Use debugger and inspection tools
8. Check for environment differences

### Common Issues & Solutions

- **Race conditions**: Use proper async/await and waitFor
- **Shared state pollution**: Implement proper test isolation
- **External dependency changes**: Use contract testing
- **Incorrect assertions**: Use precise matchers
- **Environment differences**: Standardize test environments
- **Flaky tests**: Add retry logic and improve stability
- **Timeout issues**: Optimize test performance

## Test Maintenance & Evolution

### Keep Tests Healthy

- Refactor tests with production code changes
- Remove obsolete and redundant tests
- Update tests for new requirements promptly
- Consolidate duplicate tests and test utilities
- Maintain test documentation and examples
- Regular test suite health checks

### Monitor Test Suite Health

- Track execution time and performance trends
- Monitor flaky tests and failure rates
- Review coverage trends and gaps
- Measure test effectiveness and value
- Analyze test maintenance overhead
- Use metrics to drive test improvements

## 2025 Testing Evolution

### AI-Assisted Testing

- Use AI to generate comprehensive test cases
- Leverage AI for test data generation
- Implement AI-driven test selection
- Use AI for identifying edge cases
- Generate tests from specifications
- AI-powered test maintenance and updates

### Modern Testing Practices

- Shift-left testing (test earlier in development)
- Contract testing for microservices
- Chaos engineering for resilience testing
- Property-based testing for better coverage
- Mutation testing for test quality
- Continuous testing in development

### Emerging Patterns

- Test containers for consistent environments
- Browser automation with Playwright
- API testing with OpenAPI specifications
- Component testing in isolation
- Snapshot testing for UI consistency
- Behavioral testing with Cucumber/Gherkin

## Summary

Effective testing is essential for maintaining software quality and enabling confident changes. These universal standards ensure consistent, reliable testing practices across all projects in 2025 and beyond.

Key principles:

- **Test-first development** drives better design
- **Comprehensive coverage** across all test types
- **Fast feedback loops** enable rapid iteration
- **AI collaboration** enhances test quality
- **Continuous testing** catches issues early
- **Framework flexibility** supports diverse projects

Remember: Tests are not just about finding bugs; they're about designing better software, documenting behavior, and enabling fearless refactoring.
