#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { equipCommand } from './commands/equip-refactored.js';
import { fieldguidesCommand } from './commands/fieldguides.js';

const program = new Command();

program
  .name('outfitter')
  .description(
    'CLI tool for equipping your development journey with configurations and fieldguides'
  )
  .version('1.0.2');

// Add commands
program.addCommand(equipCommand);
program.addCommand(fieldguidesCommand);

// Error handling
program.exitOverride();

try {
  await program.parseAsync(process.argv);
} catch (error: unknown) {
  if (
    error instanceof Error &&
    'code' in error &&
    error.code === 'commander.help'
  ) {
    process.exit(0);
  }
  const message =
    error instanceof Error ? error.message : 'An unexpected error occurred';
  console.error(chalk.red('Error:'), message);
  process.exit(1);
}
