#!/usr/bin/env node

import chalk from 'chalk';
import { Command } from 'commander';
import { equipCommand } from './commands/equip-refactored.js';
import { fieldguidesCommand } from './commands/fieldguides.js';
import { checkRequiredTools } from './utils/tool-check.js';

// Check required tools before running
const toolCheck = await checkRequiredTools();
if (!toolCheck.success) {
  console.error(chalk.red('Error:'), toolCheck.error.message);
  process.exit(1);
}

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
