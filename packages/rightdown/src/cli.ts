#!/usr/bin/env node

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

// Import command handlers
import { initCommand } from './commands/init.js';
import { formatCommand } from './commands/format.js';
import { rulesListCommand, rulesUpdateCommand, rulesForgetCommand } from './commands/rules.js';
import { configPresetCommand, configIgnoreCommand } from './commands/config.js';
import { lintCommand } from './commands/lint.js';

// Build CLI
yargs(hideBin(process.argv))
  // Default command: lint files
  .command(
    '$0 [files..]',
    'Lint markdown files',
    (yargs) => {
      return yargs
        .positional('files', {
          describe: 'Files to lint',
          type: 'string',
          array: true,
          default: ['.'],
        })
        .option('fix', {
          describe: 'Fix issues automatically',
          type: 'boolean',
          default: false,
        })
        .option('config', {
          alias: 'c',
          describe: 'Configuration file path',
          type: 'string',
        });
    },
    lintCommand,
  )

  // Init command
  .command(
    'init [preset]',
    'Initialize rightdown configuration',
    (yargs) => {
      return yargs.positional('preset', {
        describe: 'Preset to use',
        type: 'string',
        choices: ['strict', 'standard', 'relaxed'],
      });
    },
    initCommand,
  )

  // Format command
  .command(
    'format [source] [path]',
    'Format markdown from various sources',
    (yargs) => {
      return yargs
        .positional('source', {
          describe: 'Source to format from',
          type: 'string',
          choices: ['file'],
        })
        .positional('path', {
          describe: 'File path (when source is "file")',
          type: 'string',
        })
        .option('input', {
          describe: 'Read from stdin',
          type: 'boolean',
        })
        .option('text', {
          describe: 'Format inline text',
          type: 'string',
        })
        .check((argv) => {
          // Ensure at least one source is specified
          if (!argv.source && !argv.input && !argv.text) {
            throw new Error('Must specify a source: file, --input, or --text');
          }
          if (argv.source === 'file' && !argv.path) {
            throw new Error('File path required when source is "file"');
          }
          return true;
        })
        .option('preset', {
          alias: 'p',
          describe: 'Preset to use for formatting',
          type: 'string',
          choices: ['strict', 'standard', 'relaxed'],
        })
        .option('output', {
          describe: 'Output to stdout',
          type: 'boolean',
          default: true,
        });
    },
    formatCommand,
  )

  // Rules commands
  .command('rules', 'Manage markdown rules', (yargs) => {
    return yargs
      .command(
        'list [preset]',
        'List rules',
        (yargs) => {
          return yargs.positional('preset', {
            describe: 'Show rules for specific preset',
            type: 'string',
            choices: ['strict', 'standard', 'relaxed'],
          });
        },
        rulesListCommand,
      )
      .command(
        'update <rules..>',
        'Update rule configurations',
        (yargs) => {
          return yargs
            .positional('rules', {
              describe: 'Rules to update (e.g., md003 atx md013 --line-length 80)',
              type: 'string',
              array: true,
              demandOption: true,
            })
            .strict(false); // Allow dynamic options for rules
        },
        rulesUpdateCommand,
      )
      .command(
        'forget <rules..>',
        'Remove rule overrides',
        (yargs) => {
          return yargs.positional('rules', {
            describe: 'Rules to forget',
            type: 'string',
            array: true,
            demandOption: true,
          });
        },
        rulesForgetCommand,
      )
      .demandCommand(1, 'You need to specify a rules subcommand');
  })

  // Config commands
  .command('config', 'Manage configuration', (yargs) => {
    return yargs
      .command(
        'preset <name>',
        'Set configuration preset',
        (yargs) => {
          return yargs.positional('name', {
            describe: 'Preset name',
            type: 'string',
            choices: ['strict', 'standard', 'relaxed'],
            demandOption: true,
          });
        },
        configPresetCommand,
      )
      .command(
        'ignore <patterns..>',
        'Manage ignore patterns',
        (yargs) => {
          return yargs
            .positional('patterns', {
              describe: 'Patterns to add or remove',
              type: 'string',
              array: true,
              demandOption: true,
            })
            .option('remove', {
              describe: 'Remove patterns instead of adding',
              type: 'boolean',
              default: false,
            });
        },
        configIgnoreCommand,
      )
      .demandCommand(1, 'You need to specify a config subcommand');
  })

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
  .alias('version', 'v')
  .strict()
  .recommendCommands()
  .showHelpOnFail(false, 'Use --help for available options')

  // Examples
  .example('$0', 'Lint all markdown files in current directory')
  .example('$0 --fix README.md', 'Fix issues in README.md')
  .example('$0 init standard', 'Initialize with standard preset')
  .example('$0 format --text "# My Title" --preset strict', 'Format text with strict preset')
  .example('$0 rules update md013 --line-length 100', 'Update line length rule')
  .example('$0 rules forget md050', 'Remove emphasis style override')

  .epilogue('For more information, visit https://github.com/outfitter-dev/rightdown')
  .parse();
