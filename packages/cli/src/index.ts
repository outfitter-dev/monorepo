#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { equipCommand } from './commands/equip.js';
import { fieldguidesCommand } from './commands/fieldguides.js';

const program = new Command();

program
  .name('outfitter')
  .description(
    'CLI tool for equipping your development journey with configurations and fieldguides'
  )
  .version('0.1.0');

// Add commands
program.addCommand(equipCommand);
program.addCommand(fieldguidesCommand);

// Error handling
program.exitOverride();

try {
  await program.parseAsync(process.argv);
} catch (error) {
  if (error instanceof Error) {
    if ('code' in error && error.code === 'commander.help') {
      process.exit(0);
    }
    console.error(chalk.red('Error:'), error.message);
  } else {
    console.error(chalk.red('Error:'), String(error));
  }
  process.exit(1);
}
