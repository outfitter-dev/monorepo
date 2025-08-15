import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isFailure, isSuccess } from '@outfitter/contracts';
import { Command } from 'commander';
import { add } from './commands/add.js';
// Legacy commands for backward compatibility
import { clean } from './commands/clean.js';
import { doctor } from './commands/doctor.js';
import { init } from './commands/init.js';
// New commands
import { cleanOldConfigs, migrate } from './commands/migrate.js';
import { remove } from './commands/remove.js';
import { setup, teardown } from './commands/setup.js';
import { update } from './commands/update.js';
// New orchestration system
import { Orchestrator } from './orchestration/orchestrator.js';

// Read version from package.json
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJson = JSON.parse(
  readFileSync(join(__dirname, '../package.json'), 'utf-8')
);
const version = packageJson.version;

// Initialize orchestrator and register adapters
const orchestrator = new Orchestrator();
orchestrator.registerAdapter('typescript', new UltraciteAdapter());
orchestrator.registerAdapter('json', new PrettierAdapter());
orchestrator.registerAdapter('yaml', new PrettierAdapter());
orchestrator.registerAdapter('css', new StylelintAdapter());
orchestrator.registerAdapter('markdown', new MarkdownlintAdapter());

const program = new Command();

program
  .name('baselayer')
  .description(
    'Foundation layer for code quality - Biome, Prettier, Stylelint, Markdownlint unified'
  )
  .version(version);

// Format command - primary interface
program
  .command('format')
  .description('Format all files using appropriate tools')
  .option(
    '--only <types...>',
    'Only format specific file types (ts, json, css, md)'
  )
  .option('--staged', 'Only format staged files')
  .option('--dry-run', 'Check formatting without making changes')
  .option('--verbose', 'Show detailed output')
  .action(async (options) => {
    const patterns = ['**/*'];
    const result = await orchestrator.format(patterns, {
      only: options.only,
      staged: options.staged,
      dryRun: options.dryRun,
      verbose: options.verbose,
    });

    if (isFailure(result)) {
      process.exit(1);
    }

    const { data } = result;

    if (options.verbose) {
      data.results.forEach((toolResult) => {
        if (toolResult.output) {
        }
        if (toolResult.errors.length > 0) {
        }
      });
    }

    if (data.success) {
    } else {
      process.exit(1);
    }
  });

// Lint command - check without fixing
program
  .command('lint')
  .description('Lint all files using appropriate tools')
  .option(
    '--only <types...>',
    'Only lint specific file types (ts, json, css, md)'
  )
  .option('--staged', 'Only lint staged files')
  .option('--fix', 'Fix linting issues')
  .option('--verbose', 'Show detailed output')
  .action(async (options) => {
    const patterns = ['**/*'];
    const result = await orchestrator.lint(patterns, {
      only: options.only,
      staged: options.staged,
      fix: options.fix,
      verbose: options.verbose,
    });

    if (isFailure(result)) {
      process.exit(1);
    }

    const { data } = result;

    if (options.verbose) {
      data.results.forEach((toolResult) => {
        if (toolResult.output) {
        }
        if (toolResult.errors.length > 0) {
        }
      });
    }

    if (data.success) {
    } else {
      process.exit(1);
    }
  });

// Check command - comprehensive check (lint + format check)
program
  .command('check')
  .description('Check all files (format + lint)')
  .option(
    '--only <types...>',
    'Only check specific file types (ts, json, css, md)'
  )
  .option('--staged', 'Only check staged files')
  .option('--fix', 'Fix all issues found')
  .option('--verbose', 'Show detailed output')
  .action(async (options) => {
    const patterns = ['**/*'];
    const result = await orchestrator.check(patterns, {
      only: options.only,
      staged: options.staged,
      fix: options.fix,
      verbose: options.verbose,
    });

    if (isFailure(result)) {
      process.exit(1);
    }

    const { data } = result;

    if (options.verbose) {
      data.results.forEach((toolResult) => {
        if (toolResult.output) {
        }
        if (toolResult.errors.length > 0) {
        }
      });
    }

    if (data.success) {
    } else {
      process.exit(1);
    }
  });

// Setup command - initialize git hooks and configuration
program
  .command('setup')
  .description('Initialize Baselayer configuration and git hooks')
  .option('--force', 'Overwrite existing configuration')
  .option('--skip-hooks', 'Skip git hooks installation')
  .option('--dry-run', 'Show what would happen without making changes')
  .option('--verbose', 'Show detailed output')
  .action(async (options) => {
    const result = await setup(options);

    if (isFailure(result)) {
      process.exit(1);
    }
  });

// Teardown command - remove git hooks
program
  .command('teardown')
  .description('Remove Baselayer git hooks')
  .option('--verbose', 'Show detailed output')
  .action(async (options) => {
    const result = await teardown(options);

    if (isFailure(result)) {
      process.exit(1);
    }
  });

// Migrate command - convert existing configs to unified Outfitter config
program
  .command('migrate')
  .description(
    'Migrate existing configuration files to unified Outfitter config'
  )
  .option('--dry-run', 'Show what would happen without making changes')
  .option('--no-backup', 'Skip backing up existing files')
  .option('--verbose', 'Show detailed output')
  .action(async (options) => {
    const result = await migrate(options);

    if (isFailure(result)) {
      process.exit(1);
    }
  });

// Clean-configs command - remove old configuration files after migration
program
  .command('clean-configs')
  .description('Remove old configuration files after successful migration')
  .option('--force', 'Confirm removal of configuration files')
  .option('--verbose', 'Show detailed output')
  .action(async (options) => {
    const result = await cleanOldConfigs(options);

    if (isFailure(result)) {
      process.exit(1);
    }
  });

// Update command - update existing configuration to latest version
program
  .command('update')
  .description('Update existing baselayer configuration to latest version')
  .option('--force', 'Force update even if current version is newer')
  .option('--dry-run', 'Show what would be updated without making changes')
  .option('--verbose', 'Show detailed output')
  .action(async (options) => {
    const result = await update(options);

    if (isFailure(result)) {
      console.error(result.error.message);
      process.exit(1);
    }
  });

// Add command - add new tools/features to configuration
program
  .command('add')
  .description('Add new tools/features to existing baselayer config')
  .option(
    '-t, --tools <tools...>',
    'Tools to add (biome, prettier, stylelint, markdownlint, lefthook)'
  )
  .option('--dry-run', 'Show what would be added without making changes')
  .option('--verbose', 'Show detailed output')
  .action(async (options) => {
    if (!options.tools || options.tools.length === 0) {
      console.error(
        'Error: No tools specified. Use --tools to specify tools to add.'
      );
      console.log(
        'Valid tools: biome, prettier, stylelint, markdownlint, lefthook, typescript, markdown, styles, json, commits, packages, testing, docs'
      );
      process.exit(1);
    }

    const result = await add({
      tools: options.tools,
      dryRun: options.dryRun,
      verbose: options.verbose,
    });

    if (isFailure(result)) {
      console.error(result.error.message);
      process.exit(1);
    }
  });

// Remove command - remove tools/features from configuration
program
  .command('remove')
  .description('Remove tools/features from existing baselayer config')
  .option(
    '-t, --tools <tools...>',
    'Tools to remove (biome, prettier, stylelint, markdownlint, lefthook)'
  )
  .option('--dry-run', 'Show what would be removed without making changes')
  .option('--verbose', 'Show detailed output')
  .action(async (options) => {
    if (!options.tools || options.tools.length === 0) {
      console.error(
        'Error: No tools specified. Use --tools to specify tools to remove.'
      );
      console.log(
        'Valid tools: biome, prettier, stylelint, markdownlint, lefthook, typescript, markdown, styles, json, commits, packages, testing, docs'
      );
      process.exit(1);
    }

    const result = await remove({
      tools: options.tools,
      dryRun: options.dryRun,
      verbose: options.verbose,
    });

    if (isFailure(result)) {
      console.error(result.error.message);
      process.exit(1);
    }
  });

// Legacy commands for backward compatibility
program
  .command('init')
  .description('Initialize formatting and linting tools (legacy)')
  .option('-y, --yes', 'Skip prompts and use defaults')
  .option('--dry-run', 'Show what would happen without making changes')
  .option('--keep-existing', 'Keep existing configurations')
  .option('--no-stylelint', 'Skip Stylelint setup')
  .option('--no-git-hooks', 'Skip git hooks setup')
  .option('--monorepo', 'Configure for monorepo structure')
  .option('--keep-prettier', 'Keep Prettier for all files (not just non-JS/TS)')
  .action(async (options) => {
    const result = await init(options);

    if (isFailure(result)) {
      process.exit(1);
    }
  });

program
  .command('clean')
  .description('Remove old configs (creates backup first) (legacy)')
  .option('--force', 'Skip confirmation prompt')
  .action(async (options) => {
    const result = await clean(options);

    if (isFailure(result)) {
      process.exit(1);
    }
  });

program
  .command('doctor')
  .description('Diagnose configuration issues (legacy)')
  .action(async () => {
    const result = await doctor();

    if (isFailure(result)) {
      process.exit(1);
    }

    if (isSuccess(result)) {
      const report = result.data;

      if (report.issues.length === 0) {
      } else {
        report.issues.forEach((issue, _index) => {
          if (issue.fix) {
          }
        });
      }
    }
  });

program.parse();
