import { existsSync, unlinkSync } from 'node:fs';
import {
  ErrorCode,
  failure,
  isFailure,
  makeError,
  success,
} from '@outfitter/contracts';
import {
  DEFAULT_FEATURES,
  getConfigFilesForTool,
  isCoreTool,
  isValidTool,
  TOOL_TO_FEATURE,
  VALID_TOOLS,
} from '../constants/tools.js';
import { ConfigLoader } from '../orchestration/config-loader.js';
import type { BaselayerConfig } from '../schemas/baselayer-config.js';
import type { FlintResult } from '../types.js';
import { backupFile, writeJSON } from '../utils/file-system.js';

export interface RemoveOptions {
  /** Tools/features to remove */
  tools: Array<string>;
  /**Show what would be removed without making changes */
  dryRun?: boolean;
  /** Enable verbose logging */
  verbose?: boolean;
}

/**

- Remove command - Removes tools/features from existing baselayer config
- Validates tool names, disables features, and optionally removes configuration files
 */
export async function remove(
  options: RemoveOptions
): Promise<FlintResult<void>> {
  try {
    // Input validation
    if (!options || typeof options !== 'object') {
      return failure(
        makeError(
          'VALIDATION_ERROR',
          `Invalid options: expected object, got ${typeof options}`
        )
      );
    }

    if (!Array.isArray(options.tools)) {
      return failure(
        makeError(
          'VALIDATION_ERROR',
          `Invalid tools: expected array, got ${typeof options.tools}`
        )
      );
    }

    if (options.dryRun !== undefined && typeof options.dryRun !== 'boolean') {
      return failure(
        makeError(
          'VALIDATION_ERROR',
          `Invalid dryRun: expected boolean, got ${typeof options.dryRun}`
        )
      );
    }

    if (options.verbose !== undefined && typeof options.verbose !== 'boolean') {
      return failure(
        makeError(
          'VALIDATION_ERROR',
          `Invalid verbose: expected boolean, got ${typeof options.verbose}`
        )
      );
    }

    const { tools, dryRun = false, verbose = false } = options;

    if (!tools || tools.length === 0) {
      return failure(
        makeError(
          'REMOVE_FAILED',
          'No tools specified. Use --tools to specify tools to remove.'
        )
      );
    }

    if (verbose) {
      console.log(`🔧 Removing tools: ${tools.join(', ')}`);
    }

    // Step 1: Validate tool names
    const invalidTools = tools.filter((tool) => !isValidTool(tool));
    if (invalidTools.length > 0) {
      return failure(
        makeError(
          'REMOVE_FAILED',
          `Invalid tool names: ${invalidTools.join(', ')}. Valid tools: ${VALID_TOOLS.join(', ')}`
        )
      );
    }

    // Step 2: Check for core tools and warn
    const coreToolsToRemove = tools.filter((tool) => isCoreTool(tool));
    if (coreToolsToRemove.length > 0) {
      console.warn(
        `⚠️  Warning: Attempting to remove core tools: ${coreToolsToRemove.join(', ')}`
      );
      console.warn('   This may break your development workflow.');
    }

    // Step 3: Check if configuration file exists
    const configPath = 'baselayer.jsonc';
    if (!(existsSync(configPath) || existsSync('baselayer.json'))) {
      return failure(
        makeError(
          'REMOVE_FAILED',
          'No existing configuration found. Nothing to remove.'
        )
      );
    }

    // Step 4: Load current configuration
    const configLoader = new ConfigLoader();
    const configResult = await configLoader.loadConfig(process.cwd());

    if (configResult.success === false) {
      return failure(
        makeError(
          'REMOVE_FAILED',
          `Failed to load configuration: ${configResult.error.message}`
        )
      );
    }

    const currentConfig = configResult.data;

    if (verbose) {
      console.log('✅ Loaded existing configuration');
    }

    // Step 5: Check which tools are currently enabled
    const currentlyDisabled = tools.filter((tool) => {
      const feature = TOOL_TO_FEATURE[tool];
      return (
        feature &&
        currentConfig.features?.[
          feature as keyof typeof currentConfig.features
        ] !== true
      );
    });

    if (currentlyDisabled.length > 0 && verbose) {
      console.log(`ℹ️  Already disabled: ${currentlyDisabled.join(', ')}`);
    }

    // Step 6: Determine what needs to be removed
    const toolsToRemove = tools.filter((tool) => {
      const feature = TOOL_TO_FEATURE[tool];
      return (
        feature &&
        currentConfig.features?.[
          feature as keyof typeof currentConfig.features
        ] === true
      );
    });

    if (toolsToRemove.length === 0) {
      console.log('✨ All specified tools are already disabled');
      return success(undefined);
    }

    // Step 7: Backup existing config
    if (existsSync(configPath) && !dryRun) {
      const backupResult = await backupFile(configPath);
      if (isFailure(backupResult)) {
        return failure(
          makeError(
            'REMOVE_FAILED',
            `Failed to backup current config: ${backupResult.error.message}`
          )
        );
      }

      if (verbose) {
        console.log(`📁 Backed up current config to ${backupResult.data}`);
      }
    }

    // Step 8: Update configuration (disable features)
    const updatedConfig: BaselayerConfig = {
      ...currentConfig,
      features: {
        ...DEFAULT_FEATURES,
        ...currentConfig.features,
      },
    };

    // Disable features for the tools being removed
    for (const tool of toolsToRemove) {
      const feature = TOOL_TO_FEATURE[tool];
      if (feature && updatedConfig.features) {
        updatedConfig.features[feature] = false;
      }
    }

    if (verbose) {
      console.log(
        `🔧 Disabling features: ${toolsToRemove.map((tool) => TOOL_TO_FEATURE[tool]).join(', ')}`
      );
    }

    // Step 9: Identify configuration files to remove
    const configFilesToRemove: string[] = [];
    for (const tool of toolsToRemove) {
      const configFiles = getConfigFilesForTool(tool);
      for (const file of configFiles) {
        if (existsSync(file) && !configFilesToRemove.includes(file)) {
          configFilesToRemove.push(file);
        }
      }
    }

    if (dryRun) {
      console.log('🧪 DRY RUN - Would make the following changes:');
      console.log(
        `• Disable features: ${toolsToRemove.map((tool) => TOOL_TO_FEATURE[tool]).join(', ')}`
      );
      if (configFilesToRemove.length > 0) {
        console.log(
          `• Remove configuration files: ${configFilesToRemove.join(', ')}`
        );
      }
      console.log('   • Update baselayer.jsonc');
    } else {
      // Step 10: Remove configuration files
      if (configFilesToRemove.length > 0) {
        if (verbose) {
          console.log(
            `🗑️  Processing ${configFilesToRemove.length} configuration files...`
          );
        }

        // Backup files before removal (in parallel)
        const backupDir = '.baselayer-backup/remove';
        const backupResults = await Promise.allSettled(
          configFilesToRemove.map(async (file) => {
            try {
              const backupResult = await backupFile(file, backupDir);
              if (isFailure(backupResult)) {
                return {
                  file,
                  operation: 'backup',
                  success: false,
                  error: backupResult.error.message,
                };
              }
              return {
                file,
                operation: 'backup',
                success: true,
                backupPath: backupResult.data,
                error: null,
              };
            } catch (error) {
              return {
                file,
                operation: 'backup',
                success: false,
                error: (error as Error).message,
              };
            }
          })
        );

        // Process backup results and track successful backups
        const successfulBackups: string[] = [];
        const failedBackups: Array<{ file: string; error: string }> = [];

        for (const result of backupResults) {
          if (result.status === 'fulfilled') {
            if (result.value.success) {
              successfulBackups.push(result.value.file);
              if (verbose && result.value.backupPath) {
                console.log(
                  `📁 Backed up ${result.value.file} to ${result.value.backupPath}`
                );
              }
            } else {
              failedBackups.push({
                file: result.value.file,
                error: result.value.error || 'Unknown backup error',
              });
            }
          } else {
            failedBackups.push({
              file: 'unknown',
              error: result.reason?.message || 'Unknown error',
            });
          }
        }

        // Report backup failures
        if (failedBackups.length > 0 && verbose) {
          for (const failure of failedBackups) {
            console.warn(
              `⚠️  Warning: Failed to backup ${failure.file}: ${failure.error}`
            );
          }
        }

        // Remove files (synchronously as it's filesystem dependent)
        // Note: File removal is kept synchronous as parallel unlinkSync can cause race conditions
        const removedFiles: string[] = [];
        const failedRemovals: Array<{ file: string; error: string }> = [];

        for (const file of configFilesToRemove) {
          try {
            unlinkSync(file);
            removedFiles.push(file);
            if (verbose) {
              console.log(`🗑️  Removed ${file}`);
            }
          } catch (error) {
            failedRemovals.push({ file, error: (error as Error).message });
            if (verbose) {
              console.warn(
                `⚠️  Warning: Failed to remove ${file}: ${(error as Error).message}`
              );
            }
          }
        }

        // Summary reporting
        if (!verbose && configFilesToRemove.length > 0) {
          console.log(
            `🗑️  Processed ${configFilesToRemove.length} configuration files`
          );
          if (failedRemovals.length > 0) {
            console.warn(
              `⚠️  ${failedRemovals.length} files failed to remove (use --verbose for details)`
            );
          }
        }
      }

      // Step 11: Write updated configuration
      const writeResult = await writeJSON(configPath, updatedConfig);
      if (isFailure(writeResult)) {
        return failure(
          makeError(
            'REMOVE_FAILED',
            `Failed to write updated config: ${writeResult.error.message}`
          )
        );
      }

      if (verbose) {
        console.log('✅ Updated baselayer.jsonc');
      }
    }

    // Success message
    if (dryRun) {
      console.log('✨ Remove preview completed');
    } else {
      console.log(`✨ Successfully removed tools: ${toolsToRemove.join(', ')}`);
      if (configFilesToRemove.length > 0) {
        console.log(
          `🗑️  Removed ${configFilesToRemove.length} configuration files`
        );
        console.log('   (Backed up to .baselayer-backup/remove)');
      }
      if (verbose) {
        console.log('   Run `baselayer doctor` to verify the changes');
      }
    }

    return success(undefined);
  } catch (error) {
    return failure(
      makeError(
        'REMOVE_FAILED',
        `Remove operation failed with unexpected error: ${(error as Error).message}`
      )
    );
  }
}

/**

- List tools that are currently enabled and can be removed
 */
export async function getRemovableTools(): Promise<FlintResult<string[]>> {
  try {
    const configLoader = new ConfigLoader();
    const configResult = await configLoader.loadConfig(process.cwd());

    if (configResult.success === false) {
      return success([]); // No config means no tools to remove
    }

    const enabledFeatures = Object.entries(configResult.data.features ?? {})
      .filter(([, enabled]) => enabled === true)
      .map(([feature]) => feature);

    return success(enabledFeatures);
  } catch (error) {
    return failure(
      makeError(
        ErrorCode.INTERNAL_ERROR,
        `Failed to get removable tools: ${(error as Error).message}`
      )
    );
  }
}

/**

- Check what configuration files would be affected by removing tools
 */
export async function previewRemoval(tools: string[]): Promise<
  FlintResult<{
    features: string[];
    configFiles: string[];
    warnings: string[];
  }>
> {
  try {
    const warnings: string[] = [];

    // Check for core tools
    const coreToolsToRemove = tools.filter((tool) => isCoreTool(tool));
    if (coreToolsToRemove.length > 0) {
      warnings.push(
        `Removing core tools may break your workflow: ${coreToolsToRemove.join(', ')}`
      );
    }

    // Get features that would be disabled
    const features = tools
      .map((tool) => TOOL_TO_FEATURE[tool])
      .filter(Boolean) as string[];

    // Get config files that would be removed
    const configFiles: string[] = [];
    for (const tool of tools) {
      const toolConfigFiles = getConfigFilesForTool(tool);
      for (const file of toolConfigFiles) {
        if (existsSync(file) && !configFiles.includes(file)) {
          configFiles.push(file);
        }
      }
    }

    return success({
      features,
      configFiles,
      warnings,
    });
  } catch (error) {
    return failure(
      makeError(
        ErrorCode.INTERNAL_ERROR,
        `Failed to preview removal: ${(error as Error).message}`
      )
    );
  }
}
