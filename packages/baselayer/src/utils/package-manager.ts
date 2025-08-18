/**

- Package manager detection and operations
 */

import * as path from 'node:path';
import { isSuccess, type Result, success } from '@outfitter/contracts';
import { fileExists, readFile } from './file-system';

export type PackageManager = 'npm' | 'yarn' | 'pnpm' | 'bun';

export interface PackageManagerInfo {
  type: PackageManager;
  version?: string;
  lockFile: string;
}

export interface PackageManagerError {
  type: 'PACKAGE_MANAGER_ERROR';
  code: string;
  message: string;
}

const LOCK_FILES: Record<PackageManager, string> = {
  npm: 'package-lock.json',
  yarn: 'yarn.lock',
  pnpm: 'pnpm-lock.yaml',
  bun: 'bun.lockb',
};

const COMMANDS = {
  install: {
    npm: 'npm install',
    yarn: 'yarn install',
    pnpm: 'pnpm install',
    bun: 'bun install',
  },
  add: {
    npm: 'npm install',
    yarn: 'yarn add',
    pnpm: 'pnpm add',
    bun: 'bun add',
  },
  addDev: {
    npm: 'npm install --save-dev',
    yarn: 'yarn add --dev',
    pnpm: 'pnpm add --save-dev',
    bun: 'bun add --dev',
  },
  remove: {
    npm: 'npm uninstall',
    yarn: 'yarn remove',
    pnpm: 'pnpm remove',
    bun: 'bun remove',
  },
  run: {
    npm: 'npm run',
    yarn: 'yarn',
    pnpm: 'pnpm run',
    bun: 'bun run',
  },
  exec: {
    npm: 'npx',
    yarn: 'yarn dlx',
    pnpm: 'pnpm exec',
    bun: 'bunx',
  },
};

/**

- Detect package manager from lock file
 */
export async function detectPackageManager(
  cwd: string = process.cwd()
): Promise<Result<PackageManagerInfo, PackageManagerError>> {
  for (const [pm, lockFile] of Object.entries(LOCK_FILES) as [
    PackageManager,
    string,
  ][]) {
    const lockPath = path.join(cwd, lockFile);
    const existsResult = await fileExists(lockPath);

    if (isSuccess(existsResult) && existsResult.data) {
      return success({
        type: pm,
        lockFile,
      });
    }
  }

  // Check if we're in a monorepo by looking for parent lock files
  const parentDir = path.dirname(cwd);
  if (parentDir !== cwd && parentDir !== '/') {
    const parentResult = await detectPackageManager(parentDir);
    if (isSuccess(parentResult)) {
      return parentResult;
    }
  }

  // Default to npm if no lock file found
  return success({
    type: 'npm',
    lockFile: 'package-lock.json',
  });
}

/**

- Get install command for package manager
 */
export function getInstallCommand(pm: PackageManager): string {
  // In CI environments, use `npm ci` for npm for better security and reproducibility
  if (isCI() && pm === 'npm') {
    return 'npm ci';
  }
  return COMMANDS.install[pm];
}

/**

- Get add command for package manager
 */
export function getAddCommand(
  pm: PackageManager,
  dev: boolean,
  packages: string[]
): string {
  const command = dev ? COMMANDS.addDev[pm] : COMMANDS.add[pm];
  return `${command} ${packages.join(' ')}`;
}

/**

- Get remove command for package manager
 */
export function getRemoveCommand(
  pm: PackageManager,
  packages: string[]
): string {
  return `${COMMANDS.remove[pm]} ${packages.join(' ')}`;
}

/**

- Get remove command arguments for safer execution with spawn/execFile
- Returns [command, args] tuple to avoid shell injection
 */
export function getRemoveCommandArgs(
  pm: PackageManager,
  packages: string[]
): [string, string[]] {
  const commands: Record<PackageManager, [string, string[]]> = {
    npm: ['npm', ['uninstall', ...packages]],
    yarn: ['yarn', ['remove', ...packages]],
    pnpm: ['pnpm', ['remove', ...packages]],
    bun: ['bun', ['remove', ...packages]],
  };

  return commands[pm];
}

/**

- Get run command for package manager
 */
export function getRunCommand(pm: PackageManager, script: string): string {
  return `${COMMANDS.run[pm]} ${script}`;
}

/**

- Get exec command for package manager
 */
export function getExecCommand(pm: PackageManager, command: string): string {
  return `${COMMANDS.exec[pm]} ${command}`;
}

/**

- Check if user prefers a specific package manager from env or config
 */
export async function getPreferredPackageManager(): Promise<
  Result<PackageManager | null, PackageManagerError>
> {
  // Check environment variable
  const pmFromEnv = process.env.FLINT_PACKAGE_MANAGER;
  if (pmFromEnv && isValidPackageManager(pmFromEnv)) {
    return success(pmFromEnv as PackageManager);
  }

  // Check for .flintrc file
  const flintrcResult = await readFile('.flintrc');
  if (isSuccess(flintrcResult)) {
    try {
      const config = JSON.parse(flintrcResult.data);
      if (
        config.packageManager &&
        isValidPackageManager(config.packageManager)
      ) {
        return success(config.packageManager as PackageManager);
      }
    } catch {
      // Ignore parse errors
    }
  }

  return success(null);
}

/**

- Validate package manager type
 */
function isValidPackageManager(pm: string): boolean {
  return ['npm', 'yarn', 'pnpm', 'bun'].includes(pm);
}

/**

- Get package manager with fallback to preference or detection
 */
export async function getPackageManager(
  cwd?: string
): Promise<Result<PackageManagerInfo, PackageManagerError>> {
  // First check for user preference
  const preferredResult = await getPreferredPackageManager();
  if (isSuccess(preferredResult) && preferredResult.data) {
    return success({
      type: preferredResult.data,
      lockFile: LOCK_FILES[preferredResult.data],
    });
  }

  // Then detect from lock file
  return detectPackageManager(cwd);
}

/**

- Check if running in CI environment
 */
export function isCI(): boolean {
  return (
    process.env.CI === 'true' ||
    process.env.CONTINUOUS_INTEGRATION === 'true' ||
    process.env.GITHUB_ACTIONS === 'true' ||
    process.env.GITLAB_CI === 'true' ||
    process.env.CIRCLECI === 'true' ||
    process.env.TRAVIS === 'true'
  );
}

/**

- Get appropriate install flags for CI
 */
export function getCIFlags(pm: PackageManager): string {
  const flags: Record<PackageManager, string> = {
    // No flags needed for npm since getInstallCommand() returns 'npm ci' directly in CI
    npm: '',
    yarn: '--frozen-lockfile',
    pnpm: '--frozen-lockfile',
    bun: '',
  };

  return flags[pm];
}
