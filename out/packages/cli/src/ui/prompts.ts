import { checkbox, confirm } from '@inquirer/prompts';
import chalk from 'chalk';
import type { FieldguideRecommendation } from '../config/fieldguide-mappings.js';
import type { Package } from '../types/index.js';

export async function selectConfigurations(
  packages: Array<Package>
): Promise<Array<string>> {
  return checkbox({
    message: 'Select configurations to install:',
    choices: packages.map((pkg) => ({
      name: pkg.name,
      value: pkg.value,
      checked: pkg.selected,
    })),
  });
}

export async function selectUtilities(
  packages: Array<Package>
): Promise<Array<string>> {
  return checkbox({
    message: 'Select utility packages:',
    choices: packages.map((pkg) => ({
      name: pkg.name,
      value: pkg.value,
      checked: pkg.selected,
    })),
  });
}

/**
 * Prompts the user to confirm whether to initialize git hooks.
 *
 * @returns A promise that resolves to true if the user confirms, or false otherwise.
 */
export async function confirmGitHooks(): Promise<boolean> {
  return confirm({
    message: 'Initialize git hooks?',
    default: true,
  });
}

export function showRecommendedFieldguides(
  fieldguides: Array<FieldguideRecommendation>
): void {
  console.log(chalk.cyan('\n📚 Recommended fieldguides for your terrain:'));
  fieldguides
    .slice() // copy
    .sort((a, b) => a.name.localeCompare(b.name))
    .forEach((fg) => {
      const icon =
        fg.priority === 'essential'
          ? '⭐'
          : fg.priority === 'recommended'
            ? '👍'
            : '📖';
      console.log(`  ${icon} ${fg.name} - ${fg.description}`);
    });
}
