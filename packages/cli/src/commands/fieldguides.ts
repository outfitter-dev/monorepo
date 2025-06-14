import { Command } from 'commander';

// Re-export functionality from other commands
import { addFieldguides } from './fieldguides/add.js';
import { listFieldguides } from './fieldguides/list.js';
import { updateFieldguides } from './fieldguides/update.js';
import { createFieldguideConfig } from './fieldguides/create.js';
import { manageFieldguideConfig } from './fieldguides/config.js';

interface ExportOptions {
  output: string;
}

interface ImportOptions {
  file: string;
}

export const fieldguidesCommand = new Command('fieldguides')
  .alias('fg')
  .description('Manage project fieldguides (documentation & patterns)')
  .addCommand(
    new Command('create')
      .description('Create fieldguide configuration (.outfitter directory)')
      .option('-p, --preset <preset>', 'Use a preset configuration', 'minimal')
      .option('--with-claude', 'Include CLAUDE.md for AI assistance')
      .option('-f, --force', 'Force initialization even if .outfitter exists')
      .action(createFieldguideConfig)
  )
  .addCommand(
    new Command('add')
      .description('Add fieldguides to your project')
      .argument(
        '<fieldguides...>',
        'Fieldguides to add (e.g., react-patterns typescript-standards)'
      )
      .action(addFieldguides)
  )
  .addCommand(
    new Command('list')
      .description('List available fieldguides')
      .option('-i, --installed', 'Show only installed fieldguides')
      .action(listFieldguides)
  )
  .addCommand(
    new Command('update')
      .description('Update fieldguides to latest versions')
      .option('-c, --check', 'Check for updates without installing')
      .action(updateFieldguides)
  )
  .addCommand(
    new Command('config')
      .description('Manage fieldguide configurations')
      .addCommand(
        new Command('export')
          .description('Export current configuration')
          .option(
            '-o, --output <file>',
            'Output file',
            'fieldguide-config.json'
          )
          .action(async (options: ExportOptions) => {
            await manageFieldguideConfig('export', options);
          })
      )
      .addCommand(
        new Command('import')
          .description('Import a configuration')
          .argument('<file>', 'Configuration file to import')
          .action(async (file: string) => {
            await manageFieldguideConfig('import', { file } as ImportOptions);
          })
      )
  );
