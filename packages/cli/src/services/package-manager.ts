import fsExtra from 'fs-extra';
const { pathExists } = fsExtra;
import { execa } from 'execa';
import type { PackageManager, InstallCommand } from '../types/index.js';

/**
 * Detects the package manager used in the current project directory.
 *
 * Checks for the presence of lock files to determine if the project uses pnpm, yarn, bun, or npm, returning the corresponding package manager name. Defaults to 'npm' if no recognized lock file is found.
 *
 * @returns The detected package manager: 'pnpm', 'yarn', 'bun', or 'npm'.
 */
export async function detectPackageManager(): Promise<PackageManager> {
  if (await pathExists('pnpm-lock.yaml')) return 'pnpm';
  if (await pathExists('yarn.lock')) return 'yarn';
  if (await pathExists('bun.lockb')) return 'bun';
  if (await pathExists('package-lock.json')) return 'npm';

  return 'npm';
}

/**
 * Returns the install command details for a given package manager.
 *
 * @param manager - The package manager to retrieve command details for.
 * @returns An object containing the command name, install verb, and development flag for the specified package manager.
 */
export function getInstallCommand(manager: PackageManager): InstallCommand {
  switch (manager) {
    case 'npm':
      return { command: 'npm', installVerb: 'install', devFlag: '--save-dev' };
    case 'pnpm':
      return { command: 'pnpm', installVerb: 'add', devFlag: '-D' };
    case 'yarn':
      return { command: 'yarn', installVerb: 'add', devFlag: '-D' };
    case 'bun':
      return { command: 'bun', installVerb: 'add', devFlag: '--dev' };
  }
}

export async function installPackages(
  packages: Array<string>,
  manager: PackageManager
): Promise<void> {
  if (packages.length === 0) return;

  const { command, installVerb, devFlag } = getInstallCommand(manager);
  await execa(command, [installVerb, devFlag, ...packages], {
    stdio: 'inherit',
  });
}
