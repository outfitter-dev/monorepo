import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { confirm, select } from '@inquirer/prompts';
import type { Result } from '@outfitter/contracts';
import { failure, isFailure, makeError, success } from '@outfitter/contracts';
import { createBackup } from '../core/backup.js';
import { removeOldConfigs } from '../core/cleanup.js';
import { cleanupDependencies } from '../core/dependency-cleanup.js';
import { type DetectedConfig, detectExistingTools } from '../core/detector.js';
import type { CleanOptions } from '../types.js';

/**

- Clean up old configuration files
 */
export async function clean(
  options: CleanOptions
): Promise<Result<void, Error>> {
  try {
    const projectRoot = process.cwd();
    const packageJsonPath = join(projectRoot, 'package.json');

    if (!existsSync(packageJsonPath)) {
      return failure(
        makeError(
          'NOT_FOUND',
          'No package.json found. Please run this command in a project root.'
        )
      );
    }

    // Verify package.json exists and is readable
    JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
    const detectionResult = await detectExistingTools(projectRoot);
    if (isFailure(detectionResult)) {
      return failure(
        makeError(
          'INTERNAL_ERROR',
          `Detection failed: ${detectionResult.error.message}`
        )
      );
    }
    const detectedTools = detectionResult.data;

    // Check for Flint-generated configs
    const flintConfigs = [
      'biome.json',
      'oxlint.json',
      '.markdownlint.json',
      '.stylelintrc.json',
      'lefthook.yml',
      'commitlint.config.js',
      '.editorconfig',
    ];

    const flintGeneratedConfigs = detectedTools.configs.filter((config) =>
      flintConfigs.some((flintConfig) => config.path.endsWith(flintConfig))
    );

    const oldToolConfigs = detectedTools.configs.filter((config) =>
      ['eslint', 'prettier', 'husky'].includes(config.tool)
    );

    if (detectedTools.configs.length === 0) {
      return success(undefined);
    }

    if (oldToolConfigs.length > 0) {
      oldToolConfigs.forEach((_config) => {});
    }

    if (flintGeneratedConfigs.length > 0) {
      flintGeneratedConfigs.forEach((_config) => {});
    }

    // Ask what to clean
    let configsToClean: DetectedConfig[] = [];

    if (options.force) {
      // Force mode - clean all
      configsToClean = detectedTools.configs;
    } else {
      const cleanupMode = await select({
        message: 'What would you like to clean?',
        choices: [
          {
            name: 'All configurations',
            value: 'all',
            description: 'Remove all detected configuration files',
          },
          {
            name: 'Old tools only (ESLint, Prettier, Husky)',
            value: 'old',
            description: 'Remove only old tool configurations',
          },
          {
            name: 'Flint configurations only',
            value: 'flint',
            description: 'Remove only Flint-generated configurations',
          },
          {
            name: 'Select individually',
            value: 'select',
            description: 'Choose which configurations to remove',
          },
          {
            name: 'Cancel',
            value: 'cancel',
            description: 'Exit without making changes',
          },
        ],
      });

      switch (cleanupMode) {
        case 'all':
          configsToClean = detectedTools.configs;
          break;
        case 'old':
          configsToClean = oldToolConfigs;
          break;
        case 'flint':
          configsToClean = flintGeneratedConfigs;
          break;
        case 'select':
          // Individual selection
          for (const config of detectedTools.configs) {
            const remove = await confirm({
              message: `Remove ${config.path}?`,
              default: oldToolConfigs.includes(config),
            });
            if (remove) {
              configsToClean.push(config);
            }
          }
          break;
        case 'cancel':
          return success(undefined);
      }

      if (configsToClean.length === 0) {
        return success(undefined);
      }
      configsToClean.forEach((_config) => {});

      const proceed = await confirm({
        message: 'Continue with cleanup?',
        default: true,
      });

      if (!proceed) {
        return success(undefined);
      }
    }
    const backupResult = await createBackup(configsToClean);
    if (isFailure(backupResult)) {
      return failure(
        makeError(
          'INTERNAL_ERROR',
          `Backup failed: ${backupResult.error.message}`
        )
      );
    }
    const cleanupResult = await removeOldConfigs(
      configsToClean.map((c) => c.path)
    );
    if (isFailure(cleanupResult)) {
      return failure(
        makeError(
          'INTERNAL_ERROR',
          `Cleanup failed: ${cleanupResult.error.message}`
        )
      );
    }

    // 4. Clean up dependencies if old tools were removed
    const removedOldTools = configsToClean.some((config) =>
      ['eslint', 'prettier', 'husky'].includes(config.tool)
    );

    if (removedOldTools && !options.force) {
      const cleanDeps = await confirm({
        message: 'Also remove related dependencies from package.json?',
        default: true,
      });

      if (cleanDeps) {
        const depCleanupResult = await cleanupDependencies();
        if (isFailure(depCleanupResult)) {
        } else {
        }
      }
    } else if (removedOldTools && options.force) {
      const depCleanupResult = await cleanupDependencies({
        force: options.force,
      });
      if (isFailure(depCleanupResult)) {
      }
    }

    // Suggest next steps
    if (removedOldTools) {
    }

    return success(undefined);
  } catch (error) {
    return failure(
      makeError(
        'INTERNAL_ERROR',
        `Clean failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    );
  }
}
