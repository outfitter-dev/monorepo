# CLI: Package vs App Migration Proposal

## Summary

This proposal examines splitting `@outfitter/cli` into a shared core library (`packages/cli`) and a standalone CLI application (`apps/cli`), establishing patterns for similar decisions across Outfitter projects.

## Current State

`@outfitter/cli` currently lives in `packages/cli/` and:

- Is published to npm as `@outfitter/cli`
- Can be installed globally via `npm install -g @outfitter/cli`
- Depends on `@outfitter/packlist` and `@outfitter/fieldguides` as libraries
- Provides the `outfitter` command for managing development "supplies"
- Uses Commander.js with commands: init, add, list, update, pack
- Creates `.outfitter/` directory structure in projects
- Currently has basic implementation with TODOs for core supply system

## Insights from Current Analysis

Based on examining the current CLI implementation:

1. **Command structure is solid**: Well-architected with Commander.js
2. **Library dependencies are clear**: Uses `@outfitter/packlist` for core logic
3. **Contains CLI-specific logic**: Error handling, user prompts, spinners
4. **Hardcoded supplies list**: No actual supply registry implemented yet
5. **Good separation exists**: Core logic vs CLI presentation already somewhat separated

## Decision Framework

### When to use `packages/`

A CLI belongs in `packages/` when it:

- **Is consumed as a library** by other packages/apps
- **Exports reusable APIs** beyond just CLI commands
- **Provides programmatic interfaces** that other tools depend on
- **Shares core business logic** that needs to be accessible elsewhere

Examples:

- `@outfitter/packlist` - Core configuration logic used by CLI and potentially other tools
- Build tool CLIs that expose JavaScript APIs (like `esbuild`, `tsup`)
- Testing frameworks with both CLI and programmatic usage

### When to use `apps/`

A CLI belongs in `apps/` when it:

- **Is purely an end-user tool** with no library consumers
- **Has unique deployment requirements** (different Node version, special builds)
- **Contains application-specific logic** not reusable elsewhere
- **Needs isolated dependencies** that shouldn't affect other packages

Examples:

- Developer tools that only provide commands (like `create-react-app`)
- Internal company CLIs for specific workflows
- CLIs with heavy dependencies or native bindings

## Analysis for @outfitter/cli Split

### Core Library Functions (should be in `packages/cli`)

1. **Command implementations**: Core logic for init, add, list, update, pack
2. **Supply management APIs**: Programmatic interfaces for managing supplies
3. **Configuration utilities**: Reading/writing `.outfitter/` structure
4. **Validation logic**: Supply validation, project state checking
5. **Shared types**: Interfaces for supplies, configs, presets
6. **Error handling**: CLI-specific error types and handling

### CLI Application Functions (should be in `apps/cli`)

1. **Commander.js setup**: CLI framework configuration
2. **User interaction**: Inquirer prompts, ora spinners, chalk styling
3. **Process management**: Exit codes, signal handling
4. **Global installation**: Binary entry point and publishing
5. **CLI-specific error presentation**: User-friendly error messages
6. **Help and documentation**: Command help text and examples

### Benefits of Split

1. **Programmatic usage**: Other tools can use `@outfitter/cli` as a library
2. **Testing isolation**: Test command logic separately from CLI presentation
3. **Multiple interfaces**: Could add web UI, VS Code extension, etc.
4. **Cleaner dependencies**: Core library doesn't need chalk, inquirer, ora
5. **Better maintenance**: Separate CLI concerns from business logic

## Recommendation

**Split into both `packages/cli` and `apps/cli`** with clear separation:

### `packages/cli` - Core Library

```typescript
// packages/cli/src/index.ts
export * from './commands/init';
export * from './commands/add';
export * from './commands/list';
export * from './commands/update';
export * from './commands/pack';
export * from './types';
export * from './config';

// packages/cli/src/commands/init.ts
export interface InitOptions {
  preset?: string;
  withClaude?: boolean;
  force?: boolean;
}

export async function initProject(
  options: InitOptions
): Promise<Result<void, AppError>> {
  // Core logic without CLI dependencies
}
```

### `apps/cli` - CLI Application

```typescript
// apps/cli/src/index.ts
#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { initProject, addSupplies, listSupplies } from '@outfitter/cli';

const program = new Command();

program
  .command('init')
  .description('Initialize a project with Outfitter supplies')
  .option('-p, --preset <preset>', 'Use a preset configuration')
  .action(async (options) => {
    const spinner = ora('Initializing project...').start();
    const result = await initProject(options);

    if (result.success) {
      spinner.succeed(chalk.green('Project initialized!'));
    } else {
      spinner.fail(chalk.red(`Error: ${result.error.message}`));
      process.exit(1);
    }
  });
```

### Package Dependencies

```json
{
  "packages/cli": {
    "dependencies": {
      "@outfitter/contracts": "workspace:*",
      "@outfitter/packlist": "workspace:*",
      "@outfitter/fieldguides": "workspace:*"
    }
  },
  "apps/cli": {
    "dependencies": {
      "@outfitter/cli": "workspace:*",
      "commander": "^11.1.0",
      "inquirer": "^9.2.12",
      "chalk": "^5.3.0",
      "ora": "^8.0.1"
    }
  }
}
```

This approach:

- **Enables programmatic usage**: Other tools can import `@outfitter/cli`
- **Cleaner separation**: Business logic vs presentation concerns
- **Better testability**: Test command logic without CLI setup
- **Future flexibility**: Add web UI, VS Code extension using same core
- **Cleaner dependencies**: Core library stays lightweight

## Migration Path

To implement this split:

### Phase 1: Extract Core Library

1. **Create clean API exports** in current `packages/cli/src/index.ts`:

   ```typescript
   export { initProject } from './commands/init';
   export { addSupplies } from './commands/add';
   export { listSupplies } from './commands/list';
   export { updateSupplies } from './commands/update';
   export { exportPack, importPack } from './commands/pack';
   export type { InitOptions, AddOptions, ListOptions } from './types';
   ```

2. **Remove CLI dependencies** from `packages/cli/package.json`:

   - Remove: commander, inquirer, chalk, ora
   - Keep: fs-extra, @outfitter/packlist, @outfitter/fieldguides

3. **Return Result types** instead of process.exit() in command functions

### Phase 2: Create CLI App

1. **Create `apps/cli/` directory** with new package.json
2. **Move CLI-specific code**: Commander setup, user interaction, styling
3. **Import from `@outfitter/cli`**: Use the core library functions
4. **Update binary configuration**: Point to `apps/cli/dist/index.js`

### Phase 3: Update Publishing

1. **Publish both packages**:
   - `@outfitter/cli` (library) from `packages/cli/`
   - `@outfitter/outfitter` (CLI app) from `apps/cli/`
2. **Update installation docs**: `npm install -g @outfitter/outfitter`
3. **Maintain backwards compatibility**: Consider deprecation notice

## Patterns for Other Projects

### Multi-language Projects (Go + TypeScript/React)

For projects with mixed languages:

```text
monorepo/
├── apps/
│   ├── api/          # Go backend
│   │   ├── main.go
│   │   └── go.mod
│   └── tui/          # TypeScript/React frontend
│       ├── src/
│       └── package.json
├── packages/         # Shared TypeScript packages
│   ├── ui/
│   └── types/
└── tools/           # Build and development tools
```

Key considerations:

- Language-specific apps in `apps/` with their own build systems
- Shared TypeScript packages in `packages/`
- Clear build orchestration via Turbo or similar
- Separate dependency management per language

### Decision Checklist

When deciding on CLI architecture:

**Core Library (`packages/`):**

- [ ] Contains reusable business logic
- [ ] Can be imported by other packages/apps
- [ ] Has minimal UI/presentation dependencies
- [ ] Exports clean programmatic APIs
- [ ] Returns structured data/Results

**CLI Application (`apps/`):**

- [ ] Handles user interaction (prompts, styling, spinners)
- [ ] Manages process lifecycle (exit codes, signals)
- [ ] Has CLI framework dependencies (commander, inquirer)
- [ ] Provides global installation binary
- [ ] Focuses on presentation and UX

**Split Recommended When:**

- Core logic is substantial enough to warrant separate package
- Multiple interfaces might consume the same logic
- Testing command logic separately from CLI setup is valuable
- Dependencies can be meaningfully separated

## Next Steps

1. **Phase 1 Implementation**: Extract clean APIs from current CLI package
2. **Create `apps/` directory**: Set up monorepo structure for applications
3. **Phase 2 Implementation**: Create CLI app that consumes core library
4. **Update build tooling**: Support both packages and apps in build system
5. **Document patterns**: Add this split pattern to monorepo standards
6. **Consider naming**: Decide on final package names and installation commands

## Example Applications of This Pattern

### Future Outfitter Tools

- **`packages/git-hooks`** + **`apps/git-hooks-cli`**: Git hook management
- **`packages/supply-registry`** + **`apps/supply-server`**: Supply registry API + server
- **`packages/validation`** + **`apps/doctor`**: Project compliance checking

### Multi-Interface Support

With core libraries extracted, we could build:

- **VS Code Extension**: Uses `@outfitter/cli` APIs
- **Web Dashboard**: Import and call supply management functions
- **GitHub Actions**: Programmatic supply management in CI/CD
- **REST API**: Server that wraps CLI functionality

This split enables the core Outfitter ecosystem to grow beyond just CLI usage.
