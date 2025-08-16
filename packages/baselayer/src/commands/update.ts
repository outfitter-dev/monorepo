import { existsSync } from 'node:fs';
import {
  ErrorCode,
  failure,
  isFailure,
  makeError,
  type Result,
  success,
} from '@outfitter/contracts';
import { DEFAULT_FEATURES, TOOL_GENERATORS } from '../constants/tools.js';
import { ConfigLoader } from '../orchestration/config-loader.js';
import type { BaselayerConfig } from '../schemas/baselayer-config.js';
import type { FlintResult } from '../types.js';
import {
  backupFile,
  type FileSystemError,
  writeJSON,
} from '../utils/file-system.js';

export interface UpdateOptions {
  /** Force update even if current version is newer */
  force?: boolean;
  /** Show what would be updated without making changes */
  dryRun?: boolean;
  /** Enable verbose logging */
  verbose?: boolean;
}

/**
 * Update command - Updates existing baselayer configuration to latest version
 * Detects current config and updates it intelligently while preserving customizations
 */
export async function update(
  options: UpdateOptions = {}
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

    if (options.force !== undefined && typeof options.force !== 'boolean') {
      return failure(
        makeError(
          'VALIDATION_ERROR',
          `Invalid force: expected boolean, got ${typeof options.force}`
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

    const { dryRun = false, verbose = false } = options;

    if (verbose) {
      console.log('🔄 Starting baselayer configuration update...');
    }

    // Step 1: Load current configuration
    const configLoader = new ConfigLoader();
    const configResult = await configLoader.loadConfig(process.cwd());

    if (configResult.success === false) {
      return failure(
        makeError(
          'UPDATE_FAILED',
          `Failed to load existing configuration: ${configResult.error.message}`
        )
      );
    }

    const currentConfig = configResult.data;

    if (verbose) {
      console.log('✅ Loaded current configuration');
      console.log(
        `   Features enabled: ${
          Object.entries(currentConfig.features ?? {})
            .filter(([, enabled]) => enabled)
            .map(([feature]) => feature)
            .join(', ') || 'none'
        }`
      );
    }

    // Step 2: Check if backup is needed
    const configPath = 'baselayer.jsonc';
    if (existsSync(configPath) && !dryRun) {
      const backupResult = await backupFile(configPath);
      if (isFailure(backupResult)) {
        return failure(
          makeError(
            'UPDATE_FAILED',
            `Failed to backup current config: ${backupResult.error.message}`
          )
        );
      }

      if (verbose) {
        console.log(`📁 Backed up current config to ${backupResult.data}`);
      }
    }

    // Step 3: Update tool configurations based on enabled features
    const updateTasks: Array<{
      name: string;
      task: () => Promise<Result<void, FileSystemError>>;
    }> = [];

    // Map features to their primary tools and display names
    const featureToTask = {
      typescript: {
        name: 'Biome (TypeScript)',
        generator: TOOL_GENERATORS.biome,
      },
      json: { name: 'Prettier (JSON)', generator: TOOL_GENERATORS.prettier },
      styles: {
        name: 'Stylelint (CSS)',
        generator: TOOL_GENERATORS.stylelint,
      },
      markdown: {
        name: 'Markdownlint',
        generator: TOOL_GENERATORS.markdownlint,
      },
      commits: {
        name: 'Lefthook (Git hooks)',
        generator: TOOL_GENERATORS.lefthook,
      },
    } as const;

    // Add tasks for enabled features
    for (const [feature, config] of Object.entries(featureToTask)) {
      const isEnabled =
        feature === 'typescript' || feature === 'json'
          ? currentConfig.features?.[
              feature as keyof typeof currentConfig.features
            ] !== false
          : currentConfig.features?.[
              feature as keyof typeof currentConfig.features
            ] === true;

      if (isEnabled && config.generator) {
        updateTasks.push({
          name: config.name,
          task: config.generator,
        });
      }
    }

    if (verbose) {
      console.log(`🔧 Updating ${updateTasks.length} tool configurations...`);
    }

    // Step 4: Execute updates
    if (dryRun) {
      console.log('🧪 DRY RUN - Would update the following configurations:');
      for (const task of updateTasks) {
        console.log(`   • ${task.name}`);
      }
      console.log('   • baselayer.jsonc (preserving custom overrides)');
    } else {
      // Execute configuration updates in parallel
      if (updateTasks.length > 0) {
        if (verbose) {
          console.log(
            `🔧 Updating ${updateTasks.length} configurations in parallel...`
          );
        }

        const results = await Promise.allSettled(
          updateTasks.map(async ({ name, task }) => {
            try {
              const result = await task();
              if (isFailure(result)) {
                return {
                  name,
                  success: false,
                  error: result.error.message,
                };
              }
              return {
                name,
                success: true,
                error: null,
              };
            } catch (error) {
              return {
                name,
                success: false,
                error: (error as Error).message,
              };
            }
          })
        );

        // Process results and collect errors
        const successful: string[] = [];
        const failed: Array<{ name: string; error: string }> = [];

        for (const result of results) {
          if (result.status === 'fulfilled') {
            if (result.value.success) {
              successful.push(result.value.name);
            } else {
              failed.push({
                name: result.value.name,
                error: result.value.error || 'Unknown update error',
              });
            }
          } else {
            // Promise rejection (shouldn't happen with our error handling, but safety first)
            failed.push({
              name: 'unknown',
              error: result.reason?.message || 'Unknown error',
            });
          }
        }

        // Report results
        if (verbose) {
          if (successful.length > 0) {
            console.log(`✅ Successfully updated: ${successful.join(', ')}`);
          }
          if (failed.length > 0) {
            for (const failure of failed) {
              console.warn(
                `⚠️  Warning: Failed to update ${failure.name}: ${failure.error}`
              );
            }
          }
        } else {
          // Show summary in non-verbose mode
          if (successful.length > 0) {
            console.log(`✅ Updated ${successful.length} configurations`);
          }
          if (failed.length > 0) {
            console.warn(
              `⚠️  ${failed.length} configurations failed to update (use --verbose for details)`
            );
          }
        }
      }

      // Step 5: Update baselayer.jsonc with enhanced schema and preserve overrides
      const updatedConfig: BaselayerConfig = {
        $schema: 'https://schemas.outfitter.dev/baselayer.json',
        ...currentConfig,
        // Add any new default features that might have been added
        features: {
          ...DEFAULT_FEATURES,
          ...currentConfig.features,
        },
      };

      const writeResult = await writeJSON(configPath, updatedConfig);
      if (isFailure(writeResult)) {
        return failure(
          makeError(
            'UPDATE_FAILED',
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
      console.log('✨ Update preview completed');
    } else {
      console.log('✨ Baselayer configuration updated successfully');
      if (verbose) {
        console.log('   Run `baselayer doctor` to verify the update');
      }
    }

    return success(undefined);
  } catch (error) {
    return failure(
      makeError(
        'UPDATE_FAILED',
        `Update failed with unexpected error: ${(error as Error).message}`
      )
    );
  }
}

/**
 * Check if an update is available by comparing configurations
 */
export async function checkUpdateAvailable(): Promise<FlintResult<boolean>> {
  try {
    // Check if any configuration file exists
    const configExists =
      existsSync('baselayer.jsonc') ||
      existsSync('baselayer.json') ||
      existsSync('.baselayerrc.jsonc') ||
      existsSync('.baselayerrc.json');

    if (!configExists) {
      return success(false); // No config file means no update available (nothing to update)
    }

    const configLoader = new ConfigLoader();
    const configResult = await configLoader.loadConfig(process.cwd());

    if (configResult.success === false) {
      return success(false); // Failed to load means no valid config to update
    }

    // Check if config has latest schema
    const hasLatestSchema = configResult.data.$schema?.includes(
      'schemas.outfitter.dev'
    );

    // Check if config has all latest feature flags
    const currentFeatures = configResult.data.features ?? {};
    const expectedFeatures = Object.keys(DEFAULT_FEATURES);
    const missingFeatures = expectedFeatures.filter(
      (feature) => !(feature in currentFeatures)
    );

    return success(!hasLatestSchema || missingFeatures.length > 0);
  } catch (error) {
    return failure(
      makeError(
        ErrorCode.INTERNAL_ERROR,
        `Failed to check update availability: ${(error as Error).message}`
      )
    );
  }
}
