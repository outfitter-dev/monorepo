# Standardize on Bun.$ Instead of spawnSync Across Monorepo

## Summary

Replace all Node.js `spawnSync` calls with Bun's native `$` template literal API for better performance, safety, and developer experience.

## Current State

The monorepo currently uses a mix of:

- `spawnSync` from Node.js child_process module (primarily in packages/baselayer)
- Bun's `$` template literal API (in packages/cli)

This inconsistency leads to:

- Different error handling patterns
- Varying levels of shell injection protection
- Inconsistent subprocess management
- Mixed performance characteristics

## Proposed Change

Standardize on Bun's `$` API throughout the monorepo, replacing all `spawnSync` calls.

## Benefits

### 1. **Security - Built-in Shell Injection Protection**

```typescript
// Current (vulnerable to injection if not careful)
spawnSync(command, args.split(' '), { shell: true });

// Proposed (safe by default)
await $`${command} ${args}`; // Arrays are automatically escaped
```

### 2. **Performance - Native Bun Implementation**

- Bun's `$` is implemented in Zig, offering better performance than Node's child_process
- Automatic optimization for common patterns
- Better memory management for subprocess operations

### 3. **Developer Experience - Cleaner API**

```typescript
// Current - verbose and error-prone
const result = spawnSync('git', ['status', '--porcelain'], {
  encoding: 'utf8',
  stdio: 'pipe',
  cwd: projectDir,
});
if (result.error) throw result.error;
if (result.signal) throw new Error(`Process terminated by ${result.signal}`);
const output = result.stdout;

// Proposed - concise and clear
const output = await $`git status --porcelain`.cwd(projectDir).text();
```

### 4. **Better Async Support**

- Native promise-based API instead of synchronous blocking
- Built-in timeout support: `$`command`.timeout(5000)`
- Streaming support for long-running processes

### 5. **Cross-platform Consistency**

- Bun handles platform differences internally
- No need for manual Windows vs POSIX branching in many cases

## Implementation Plan

### Phase 1: Audit Current Usage

- [ ] Identify all `spawnSync` usage in the codebase
- [ ] Document any special cases or complex scenarios
- [ ] Create migration guide for common patterns

### Phase 2: Create Migration Utilities

- [ ] Build helper functions for common patterns if needed
- [ ] Ensure error handling consistency
- [ ] Add tests for migrated functionality

### Phase 3: Incremental Migration

- [ ] Migrate packages/baselayer/src/core/installer.ts
- [ ] Migrate packages/baselayer/src/core/initializer.ts
- [ ] Migrate other files as identified
- [ ] Update tests to use Bun.$ where appropriate

### Phase 4: Documentation

- [ ] Update CLAUDE.md with new patterns
- [ ] Add examples to developer guides
- [ ] Document any edge cases or gotchas

## Code Examples

### Installing Dependencies

```typescript
// Before
const result = spawnSync(baseCommand, [...baseArgs, ...args, ...packages], {
  stdio: 'inherit',
  shell: false,
});

// After
await $`${baseCommand} ${[...baseArgs, ...args, ...packages]}`;
```

### Checking Tool Availability

```typescript
// Before
const result = spawnSync('which', [tool], { encoding: 'utf8' });
const path = result.stdout?.trim();

// After
const path = await $`which ${tool}`.text().catch(() => null);
```

### Running with Timeout

```typescript
// Before (no built-in timeout)
const result = spawnSync('npm', ['test'], { timeout: 30000 });

// After
await $`npm test`.timeout(30000);
```

## Potential Challenges

1. **Bun Dependency**: This change makes Bun a hard requirement for development
   - Mitigation: Already using Bun as primary package manager
2. **Async Migration**: Converting sync to async may require broader refactoring
   - Mitigation: Most code paths already handle async operations

3. **Testing**: Need to ensure test coverage during migration
   - Mitigation: Incremental migration with tests at each step

## Success Metrics

- [ ] All spawnSync calls replaced with Bun.$
- [ ] No regression in functionality
- [ ] Improved subprocess error messages
- [ ] Consistent error handling patterns
- [ ] Documentation updated

## References

- [Bun Shell API Documentation](https://bun.sh/docs/runtime/shell)
- [Node.js child_process.spawnSync](https://nodejs.org/api/child_process.html#child_processspawnsynccommand-args-options)
- CodeRabbit PR #84 review comment suggesting this standardization

## Related Issues

- #84 - Security: fix cross-platform compatibility and shell injection vulnerabilities

---

**Labels:** `enhancement`, `refactor`, `security`, `performance`, `developer-experience`
**Assignees:** @galligan
**Project:** Outfitter Monorepo Improvements
