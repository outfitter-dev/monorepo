import { existsSync } from 'node:fs';
import {
  ErrorCode,
  failure,
  isFailure,
  makeError,
  type Result,
  success,
} from '@outfitter/contracts';
import {
  DEFAULT_FEATURES,
  isValidTool,
  TOOL_GENERATORS,
  TOOL_TO_FEATURE,
  VALID_TOOLS,
} from '../constants/tools.js';
import { ConfigLoader } from '../orchestration/config-loader.js';
import type { BaselayerConfig } from '../schemas/baselayer-config.js';
import type { FlintResult } from '../types.js';
import {
  backupFile,
  type FileSystemError,
  writeJSON,
} from '../utils/file-system.js';

export interface AddOptions {
  /** Tools/features to add */
  tools: string[];
  /**Show what would be added without making changes */
  dryRun?: boolean;
  /** Enable verbose logging */
  verbose?: boolean;
}

/**

- Add command - Adds new tools/features to existing baselayer config
- Validates tool names and updates configuration and tool files accordingly
 */
export async function add(options: AddOptions): Promise<FlintResult<void>> {
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
          'ADD_FAILED',
          'No tools specified. Use --tools to specify tools to add.'
        )
      );
    }

    if (verbose) {
      console.log(`🔧 Adding tools: ${tools.join(', ')}`);
    }

    // Step 1: Validate tool names
    const invalidTools = tools.filter((tool) => !isValidTool(tool));
    if (invalidTools.length > 0) {
      return failure(
        makeError(
          'ADD_FAILED',
          `Invalid tool names: ${invalidTools.join(', ')}. Valid tools: ${VALID_TOOLS.join(', ')}`
        )
      );
    }

    // Step 2: Load current configuration or create default
    const configLoader = new ConfigLoader();
    const configResult = await configLoader.loadConfig(process.cwd());

    let currentConfig: BaselayerConfig;

    if (configResult.success === false) {
      // Create default config if none exists
      currentConfig = {
        $schema: '<https://schemas.outfitter.dev/baselayer.json>',
        features: DEFAULT_FEATURES,
        overrides: {},
      };

      if (verbose) {
        console.log('📝 No existing configuration found, creating new one');
      }
    } else {
      currentConfig = configResult.data;

      if (verbose) {
        console.log('✅ Loaded existing configuration');
      }
    }

    // Step 3: Check which tools are already enabled
    const alreadyEnabled = tools.filter((tool) => {
      const feature = TOOL_TO_FEATURE[tool];
      return (
        feature &&
        currentConfig.features?.[
          feature as keyof typeof currentConfig.features
        ] === true
      );
    });

    if (alreadyEnabled.length > 0 && verbose) {
      console.log(`ℹ️  Already enabled: ${alreadyEnabled.join(', ')}`);
    }

    // Step 4: Determine what needs to be added
    const toolsToAdd = tools.filter((tool) => {
      const feature = TOOL_TO_FEATURE[tool];
      return (
        feature &&
        currentConfig.features?.[
          feature as keyof typeof currentConfig.features
        ] !== true
      );
    });

    if (toolsToAdd.length === 0) {
      console.log('✨ All specified tools are already enabled');
      return success(undefined);
    }

    // Step 5: Backup existing config if it exists
    const configPath = 'baselayer.jsonc';
    if (existsSync(configPath) && !dryRun) {
      const backupResult = await backupFile(configPath);
      if (isFailure(backupResult)) {
        return failure(
          makeError(
            'ADD_FAILED',
            `Failed to backup current config: ${backupResult.error.message}`
          )
        );
      }

      if (verbose) {
        console.log(`📁 Backed up current config to ${backupResult.data}`);
      }
    }

    // Step 6: Update configuration
    const updatedConfig: BaselayerConfig = {
      ...currentConfig,
      features: {
        ...DEFAULT_FEATURES,
        ...currentConfig.features,
      },
    };

    // Enable features for the tools being added
    for (const tool of toolsToAdd) {
      const feature = TOOL_TO_FEATURE[tool];
      if (feature && updatedConfig.features) {
        updatedConfig.features[feature] = true;
      }
    }

    if (verbose) {
      console.log(
        `🔧 Enabling features: ${toolsToAdd.map((tool) => TOOL_TO_FEATURE[tool]).join(', ')}`
      );
    }

    // Step 7: Generate tool configurations
    const configTasks: Array<{
      name: string;
      task: () => Promise<Result<void, FileSystemError>>;
    }> = [];

    for (const tool of toolsToAdd) {
      const generator = TOOL_GENERATORS[tool];
      if (generator) {
        configTasks.push({
          name: tool,
          task: generator,
        });
      }
    }

    if (dryRun) {
      console.log('🧪 DRY RUN - Would make the following changes:');
      console.log(
        `• Enable features: ${toolsToAdd.map((tool) => TOOL_TO_FEATURE[tool]).join(', ')}`
      );
      console.log(
        `• Generate configurations for: ${configTasks.map((task) => task.name).join(', ')}`
      );
      console.log('   • Update baselayer.jsonc');
    } else {
      // Execute configuration generation in parallel
      if (configTasks.length > 0) {
        if (verbose) {
          console.log(
            `🔧 Generating ${configTasks.length} configurations in parallel...`
          );
        }

        const results = await Promise.allSettled(
          configTasks.map(async ({ name, task }) => {
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
                error: result.value.error as string,
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
            console.log(`✅ Successfully generated: ${successful.join(', ')}`);
          }
          if (failed.length > 0) {
            for (const failure of failed) {
              console.warn(
                `⚠️  Warning: Failed to generate ${failure.name} config: ${failure.error}`
              );
            }
          }
        } else {
          // Show summary in non-verbose mode
          if (successful.length > 0) {
            console.log(`✅ Generated ${successful.length} configurations`);
          }
          if (failed.length > 0) {
            console.warn(
              `⚠️  ${failed.length} configurations failed to generate (use --verbose for details)`
            );
          }
        }
      }

      // Step 8: Write updated configuration
      const writeResult = await writeJSON(configPath, updatedConfig);
      if (isFailure(writeResult)) {
        return failure(
          makeError(
            'ADD_FAILED',
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
      console.log('✨ Add preview completed');
    } else {
      console.log(`✨ Successfully added tools: ${toolsToAdd.join(', ')}`);
      if (verbose) {
        console.log('   Run `baselayer doctor` to verify the setup');
      }
    }

    return success(undefined);
  } catch (error) {
    return failure(
      makeError(
        'ADD_FAILED',
        `Add operation failed with unexpected error: ${(error as Error).message}`
      )
    );
  }
}

/**

- List available tools that can be added
 */
export function listAvailableTools(): FlintResult<readonly string[]> {
  return success(VALID_TOOLS);
}

/**

- Check which tools are currently enabled
 */
export async function getEnabledTools(): Promise<FlintResult<string[]>> {
  try {
    const configLoader = new ConfigLoader();
    const configResult = await configLoader.loadConfig(process.cwd());

    if (configResult.success === false) {
      return success([]); // No config means no tools enabled
    }

    const enabledFeatures = Object.entries(configResult.data.features ?? {})
      .filter(([, enabled]) => enabled === true)
      .map(([feature]) => feature);

    return success(enabledFeatures);
  } catch (error) {
    return failure(
      makeError(
        ErrorCode.INTERNAL_ERROR,
        `Failed to get enabled tools: ${(error as Error).message}`
      )
    );
  }
}
