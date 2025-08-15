/**
 * Clean up unwanted dependencies
 */

import { execSync } from 'node:child_process';
import {
  ErrorCode,
  failure,
  isFailure,
  makeError,
  type Result,
  success,
} from '@outfitter/contracts';
import { console } from '../utils/console.js';
import { readPackageJson } from '../utils/file-system.js';
import {
  getPackageManager,
  getRemoveCommand,
} from '../utils/package-manager.js';

export interface DependencyCleanupOptions {
  keepPrettier?: boolean;
  dryRun?: boolean;
  force?: boolean;
  silent?: boolean;
}

export interface DependencyCleanupError {
  type: 'DEPENDENCY_CLEANUP_ERROR';
  code: string;
  message: string;
}

// Patterns for dependencies to remove
const UNWANTED_PATTERNS = [
  /^eslint$/,
  /^eslint-/,
  /^@typescript-eslint\//,
  /^@eslint\//,
  /^tslint$/,
  /^standard$/,
  /^xo$/,
  /^jshint$/,
  /^jscs$/,
];

// Dependencies to keep even if they match patterns
const KEEP_LIST = [
  'oxlint',
  'markdownlint',
  'markdownlint-cli2',
  'stylelint',
  'stylelint-config-tailwindcss',
];

/**
 * Find dependencies to remove
 */
export async function findDependenciesToRemove(
  options: DependencyCleanupOptions = {}
): Promise<Result<string[], any>> {
  const { keepPrettier = false } = options;

  const pkgResult = await readPackageJson();
  if (isFailure(pkgResult)) {
    return failure(
      makeError(
        ErrorCode.INTERNAL_ERROR,
        `Failed to read package.json: ${pkgResult.error.message}`
      )
    );
  }

  const pkg = pkgResult.data;
  const allDeps = {
    ...pkg.dependencies,
    ...pkg.devDependencies,
  };

  const patterns = [...UNWANTED_PATTERNS];
  if (!keepPrettier) {
    patterns.push(/^prettier$/);
    patterns.push(/^prettier-plugin-/);
  }

  const toRemove: string[] = [];

  for (const [dep] of Object.entries(allDeps)) {
    // Skip if in keep list
    if (KEEP_LIST.includes(dep)) {
      continue;
    }

    // Check if matches any unwanted pattern
    if (patterns.some((pattern) => pattern.test(dep))) {
      toRemove.push(dep);
    }
  }

  return success(toRemove);
}

/**
 * Remove unwanted dependencies
 */
export async function cleanupDependencies(
  options: DependencyCleanupOptions = {}
): Promise<Result<string[], DependencyCleanupError>> {
  const { dryRun = false, force = false, silent = false } = options;

  const depsResult = await findDependenciesToRemove(options);
  if (isFailure(depsResult)) {
    return failure(depsResult.error);
  }

  const depsToRemove = depsResult.data;
  if (depsToRemove.length === 0) {
    if (!silent) {
      console.info('No dependencies to remove');
    }
    return success([]);
  }

  if (!silent) {
    console.section('Dependencies to remove:');
    depsToRemove.forEach((dep) => console.step(dep));
  }

  if (dryRun) {
    return success(depsToRemove);
  }

  const pmResult = await getPackageManager();
  if (isFailure(pmResult)) {
    return failure(
      makeError(
        ErrorCode.INTERNAL_ERROR,
        `Failed to detect package manager: ${pmResult.error.message}`
      )
    );
  }

  const pm = pmResult.data.type;
  const command = getRemoveCommand(pm, depsToRemove);

  if (!silent) {
    console.info(`Removing ${depsToRemove.length} dependencies...`);
  }

  try {
    execSync(command, {
      stdio: silent ? 'ignore' : 'inherit',
      encoding: 'utf-8',
    });

    if (!silent) {
      console.success(
        `Successfully removed ${depsToRemove.length} dependencies`
      );
    }

    return success(depsToRemove);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!force) {
      return failure(
        makeError(
          ErrorCode.INTERNAL_ERROR,
          `Failed to remove dependencies: ${message}`
        )
      );
    }

    if (!silent) {
      console.warning('Some dependencies could not be removed, continuing...');
    }

    return success(depsToRemove);
  }
}

/**
 * Remove specific dependency
 */
export async function removeDependency(
  packageName: string,
  options: Omit<DependencyCleanupOptions, 'keepPrettier'> = {}
): Promise<Result<void, any>> {
  const { dryRun = false, silent = false } = options;

  if (dryRun) {
    if (!silent) {
      console.info(`Would remove: ${packageName}`);
    }
    return success(undefined);
  }

  const pmResult = await getPackageManager();
  if (isFailure(pmResult)) {
    return failure(
      makeError(
        ErrorCode.INTERNAL_ERROR,
        `Failed to detect package manager: ${pmResult.error.message}`
      )
    );
  }

  const pm = pmResult.data.type;
  const command = getRemoveCommand(pm, [packageName]);

  try {
    execSync(command, {
      stdio: silent ? 'ignore' : 'inherit',
      encoding: 'utf-8',
    });

    if (!silent) {
      console.success(`Removed ${packageName}`);
    }

    return success(undefined);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return failure(
      makeError(
        ErrorCode.INTERNAL_ERROR,
        `Failed to remove ${packageName}: ${message}`
      )
    );
  }
}

/**
 * Get list of ESLint-related dependencies
 */
export async function getEslintDependencies(): Promise<Result<string[], any>> {
  const pkgResult = await readPackageJson();
  if (isFailure(pkgResult)) {
    return failure(
      makeError(
        ErrorCode.INTERNAL_ERROR,
        `Failed to read package.json: ${pkgResult.error.message}`
      )
    );
  }

  const pkg = pkgResult.data;
  const allDeps = {
    ...pkg.dependencies,
    ...pkg.devDependencies,
  };

  const eslintDeps = Object.keys(allDeps).filter(
    (dep) =>
      dep === 'eslint' ||
      dep.startsWith('eslint-') ||
      dep.startsWith('@typescript-eslint/') ||
      dep.startsWith('@eslint/')
  );

  return success(eslintDeps);
}
