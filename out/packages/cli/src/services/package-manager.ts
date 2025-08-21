import fsExtra from 'fs-extra';

const { pathExists } = fsExtra;

import { execa } from 'execa';
import type { InstallCommand, PackageManager } from '../types/index.js';

/**
 * Detects if the current directory is a workspace/monorepo root.
 *
 * @returns True if the directory contains workspace configuration files.
 */
export async function isWorkspaceRoot(): Promise<boolean> {
  try {
    // Check for various workspace config files
    if (await pathExists('pnpm-workspace.yaml')) return true;
    if (await pathExists('lerna.json')) return true;

    // Check package.json for workspaces field
    if (await pathExists('package.json')) {
      try {
        const packageJson = await fsExtra.readJson('package.json');
        if (packageJson.workspaces) return true;
      } catch {
        // Ignore errors reading package.json
      }
    }

    return false;
  } catch (error) {
    // If we can't determine workspace status, assume it's not a workspace
    console.warn('Warning: Unable to detect workspace status:', error);
    return false;
  }
}

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
  manager: PackageManager,
  options?: {
    filter?: string; // For targeting specific workspace packages
    isWorkspace?: boolean; // Pre-detected workspace status
  }
): Promise<void> {
  if (packages.length === 0) return;

  const { command, installVerb, devFlag } = getInstallCommand(manager);
  const args = [installVerb, devFlag];

  // Use provided workspace status or detect if not provided
  const isWorkspace = options?.isWorkspace ?? (await isWorkspaceRoot());

  if (isWorkspace) {
    if (options?.filter) {
      // Install to specific package/app with filter
      if (manager === 'pnpm') {
        args.push('--filter', options.filter);
      } else if (manager === 'yarn') {
        // Yarn workspaces use a different syntax
        args.unshift('workspace', options.filter);
      } else if (manager === 'npm') {
        // npm workspaces use -w flag
        args.push('-w', options.filter);
      }
    } else {
      // Install to workspace root
      if (manager === 'pnpm') {
        args.push('-w');
      } else if (manager === 'yarn') {
        args.push('-W');
      } else if (manager === 'npm') {
        args.push('-w');
      }
    }
  }

  args.push(...packages);

  await execa(command, args, {
    stdio: 'inherit',
  });
}
