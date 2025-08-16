/**
 * Remove old configs and dependencies
 */
import {
  ErrorCode,
  failure,
  isFailure,
  makeError,
  type Result,
  success,
} from '@outfitter/contracts';
import { console } from '../utils/console';
import { fileExists, remove } from '../utils/file-system';
import { getConfigsToCleanup } from './detector';

export interface CleanupOptions {
  dryRun?: boolean;
  force?: boolean;
  silent?: boolean;
}

/**
 * Remove old configuration files
 */
export async function removeOldConfigs(
  configs: string[],
  options: CleanupOptions = {}
): Promise<Result<string[], Error>> {
  const { dryRun = false, force = false, silent = false } = options;
  const removed: string[] = [];

  for (const config of configs) {
    const existsResult = await fileExists(config);
    if (isFailure(existsResult)) {
      continue;
    }

    if (!existsResult.data) {
      continue;
    }

    if (!silent) {
      console.step(`Removing ${config}...`);
    }

    if (dryRun) {
      removed.push(config);
    } else {
      const removeResult = await remove(config);
      if (isFailure(removeResult)) {
        if (!force) {
          return failure(
            makeError(
              ErrorCode.INTERNAL_ERROR,
              `Failed to remove ${config}: ${removeResult.error.message}`
            )
          );
        }
        console.warning(`Failed to remove ${config}, continuing...`);
      } else {
        removed.push(config);
      }
    }
  }

  if (!silent && removed.length > 0) {
    console.success(`Removed ${removed.length} old configuration files`);
  }

  return success(removed);
}

/**
 * Clean up all old tool configurations
 */
export async function cleanupOldTools(
  options: CleanupOptions = {}
): Promise<Result<string[], Error>> {
  const configsResult = await getConfigsToCleanup();
  if (isFailure(configsResult)) {
    return failure(
      makeError(
        ErrorCode.INTERNAL_ERROR,
        `Failed to detect configs: ${configsResult.error.message}`
      )
    );
  }

  return removeOldConfigs(configsResult.data, options);
}

/**
 * Remove specific tool configurations
 */
export async function removeToolConfigs(
  tool: string,
  options: CleanupOptions = {}
): Promise<Result<string[], Error>> {
  const toolConfigs: Record<string, string[]> = {
    eslint: [
      '.eslintrc',
      '.eslintrc.js',
      '.eslintrc.cjs',
      '.eslintrc.mjs',
      '.eslintrc.json',
      '.eslintrc.yaml',
      '.eslintrc.yml',
      'eslint.config.js',
      'eslint.config.mjs',
      'eslint.config.cjs',
      '.eslintignore',
    ],
    prettier: [
      '.prettierrc',
      '.prettierrc.js',
      '.prettierrc.cjs',
      '.prettierrc.mjs',
      '.prettierrc.json',
      '.prettierrc.json5',
      '.prettierrc.yaml',
      '.prettierrc.yml',
      '.prettierrc.toml',
      'prettier.config.js',
      'prettier.config.cjs',
      'prettier.config.mjs',
      '.prettierignore',
    ],
    stylelint: [
      '.stylelintrc',
      '.stylelintrc.js',
      '.stylelintrc.cjs',
      '.stylelintrc.mjs',
      '.stylelintrc.json',
      '.stylelintrc.yaml',
      '.stylelintrc.yml',
      'stylelint.config.js',
      'stylelint.config.cjs',
      'stylelint.config.mjs',
      '.stylelintignore',
    ],
    tslint: ['tslint.json'],
    standard: ['.standard.json'],
  };

  const configs = toolConfigs[tool.toLowerCase()];
  if (!configs) {
    return failure(
      makeError(ErrorCode.VALIDATION_ERROR, `Unknown tool: ${tool}`)
    );
  }

  return removeOldConfigs(configs, options);
}

/**
 * Clean up VS Code settings for old tools
 */
export async function cleanupVSCodeSettings(): Promise<Result<void, Error>> {
  const settingsPath = '.vscode/settings.json';
  const existsResult = await fileExists(settingsPath);

  if (isFailure(existsResult) || !existsResult.data) {
    return success(undefined);
  }

  // This would need to be implemented to remove old formatter settings
  // For now, we'll leave VS Code settings alone as they might be customized
  return success(undefined);
}

/**
 * Remove old git hooks
 */
export async function removeOldGitHooks(
  hookType: 'husky' | 'simple-git-hooks',
  options: CleanupOptions = {}
): Promise<Result<void, Error>> {
  const { dryRun = false, silent = false } = options;

  if (hookType === 'husky') {
    if (!silent) {
      console.step('Removing husky configuration...');
    }

    if (!dryRun) {
      const removeResult = await remove('.husky');
      if (isFailure(removeResult)) {
        return failure(
          makeError(
            ErrorCode.INTERNAL_ERROR,
            `Failed to remove .husky: ${removeResult.error.message}`
          )
        );
      }
    }
  }

  // simple-git-hooks cleanup would be handled in package.json
  return success(undefined);
}
