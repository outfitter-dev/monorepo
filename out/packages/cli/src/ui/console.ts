import chalk from 'chalk';
import ora, { type Ora } from 'ora';
import type { PackageSelection } from '../types/index.js';
import {
  getTerrainSummary,
  type TerrainFeatures,
} from '../utils/detect-terrain.js';

/**
 * Displays a cyan-colored welcome message introducing the Outfitter tool in the CLI.
 */
export function showWelcome(): void {
  console.log(
    chalk.cyan("🎒 Welcome to Outfitter! Let's equip your project.\n")
  );
}

/**
 * Displays a summary of detected terrain features in the console.
 *
 * If any terrain features are present in {@link terrain}, each is listed as a bullet point under a cyan-colored heading.
 *
 * @param terrain - The terrain features to summarize and display.
 */
export function showTerrainSummary(terrain: TerrainFeatures): void {
  const summary = getTerrainSummary(terrain);
  if (summary.length > 0) {
    console.log(chalk.cyan('\n🗻 Detected terrain:'));
    summary.forEach((feature) => {
      console.log(`  • ${feature}`);
    });
  }
}

/**
 * Displays the name of the package manager being used in gray text.
 *
 * @param manager - The name of the package manager.
 */
export function showPackageManager(manager: string): void {
  console.log(chalk.gray(`\n📦 Using ${manager}`));
}

/**
 * Displays an info message in gray text with a newline prefix.
 *
 * @param message - The message to display.
 */
export function logInfo(message: string): void {
  console.log(chalk.gray(`\nℹ️  ${message}`));
}

/**
 * Displays a list of recommended next steps after setting up the Outfitter project.
 *
 * Prints instructions for linting, reviewing AI assistant documentation, and, if applicable, exploring available fieldguides.
 *
 * @param packageManager - The package manager to use for running commands.
 * @param selection - The user's package selection, used to determine if fieldguides are included.
 */
export function showNextSteps(
  packageManager: string,
  selection: PackageSelection
): void {
  console.log(
    chalk.green('\n🎉 Your project is now equipped with Outfitter!\n')
  );

  console.log(chalk.cyan('Next steps:'));
  console.log(`  • Run '${packageManager} run lint' to check your code`);
  console.log('  • Check CLAUDE.md for AI assistant instructions');

  if (selection.fieldguides.length > 0) {
    console.log(`  • Explore fieldguides with 'outfitter fieldguides list'`);
  }
}

/**
 * Creates and returns a CLI spinner initialized with the specified text.
 *
 * @param text - The message to display alongside the spinner.
 * @returns An `Ora` spinner instance for indicating progress in the CLI.
 */
export function createSpinner(text: string): Ora {
  return ora(text);
}
