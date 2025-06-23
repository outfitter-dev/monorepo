#!/usr/bin/env node

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

// Import command handlers
import { formatCommand } from './commands/format.js';
import { initCommand } from './commands/init.js';

// Build CLI
yargs(hideBin(process.argv))
  // Default command: format files
  .command(
    '$0 [files..]',
    'Format markdown files with code blocks',
    (yargs) => {
      return yargs
        .positional('files', {
          describe: 'Files to format',
          type: 'string',
          array: true,
          default: ['**/*.md'],
        })
        .option('write', {
          alias: 'w',
          describe: 'Write formatted output back to files',
          type: 'boolean',
          default: false,
        })
        .option('fix', {
          describe: 'Alias for --write (fix files in place)',
          type: 'boolean',
          default: false,
        })
        .option('check', {
          describe: 'Check if files are formatted correctly',
          type: 'boolean',
          default: false,
        })
        .option('dry-run', {
          describe: 'Show what would be formatted without making changes',
          type: 'boolean',
          default: false,
        })
        .option('config', {
          alias: 'c',
          describe: 'Configuration file path',
          type: 'string',
          default: '.rightdown.config.yaml',
        })
        .option('write-configs', {
          describe: 'Write generated tool configs (for debugging)',
          type: 'boolean',
          default: false,
        })
        .option('check-drift', {
          describe: 'Check if generated configs match expected',
          type: 'boolean',
          default: false,
        })
        .conflicts('write', 'check')
        .conflicts('fix', 'check')
        .conflicts('dry-run', ['write', 'fix']);
    },
    formatCommand,
  )

  // Init command
  .command(
    'init [preset]',
    'Initialize Rightdown configuration',
    (yargs) => {
      return yargs
        .positional('preset', {
          describe: 'Preset to use',
          type: 'string',
          choices: ['strict', 'standard', 'relaxed'],
          default: 'standard',
        })
        .option('force', {
          alias: 'f',
          describe: 'Overwrite existing configuration',
          type: 'boolean',
          default: false,
        });
    },
    initCommand,
  )

  // Global options
  .option('quiet', {
    alias: 'q',
    describe: 'Suppress non-error output',
    type: 'boolean',
    default: false,
  })
  .option('verbose', {
    alias: 'v',
    describe: 'Show detailed output',
    type: 'boolean',
    default: false,
  })

  // Help customization
  .help()
  .alias('help', 'h')
  .version()
  .alias('version', 'V')
  .strict()
  .recommendCommands()
  .showHelpOnFail(false, 'Use --help for available options')

  // Examples
  .example('$0 init', 'Initialize with standard preset')
  .example('$0 init strict', 'Initialize with strict preset')
  .example('$0', 'Format all markdown files (output to stdout)')
  .example('$0 --write', 'Format all markdown files in place')
  .example('$0 --check', 'Check if files are formatted correctly')
  .example('$0 README.md --write', 'Format specific file')
  .example('$0 docs/**/*.md --write', 'Format all docs')

  .epilogue('For more information, visit https://github.com/outfitter-dev/rightdown')
  .parse();
