/**
 * Main setup orchestration
 */

import { readFile, writeFile, access, constants, mkdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import type { SetupResult } from '../types/index.js';
import type { Result } from '@outfitter/contracts';
import { success, failure, makeError } from '@outfitter/contracts';
import { validateSetupOptions, validatePackageJson } from '../utils/validation.js';
import { detectAvailableFormatters } from '../utils/detection.js';
import { getPreset } from './presets.js';
import type { PresetConfig } from '../types/index.js';
import { generateConfigs, generatePackageJsonScripts, generateDevContainer } from './generator.js';
import {
  loadYamlPreset,
  yamlPresetToConfig,
  resolvePresetInheritance,
  type YamlPreset,
} from '../utils/yaml-presets.js';

/**
 * Main setup function - orchestrates the entire formatting setup process
 */
export async function setup(options: unknown = {}): Promise<Result<SetupResult, Error>> {
  // Validate options first
  const optionsResult = validateSetupOptions(options);
  if (!optionsResult.success) {
    return failure(
      makeError('VALIDATION_ERROR', 'Invalid setup options', { cause: optionsResult.error }),
    );
  }
  const {
    preset = 'standard',
    presetConfig,
    formatters: requestedFormatters,
    installMissing = false,
    updateScripts = true,
    targetDir = process.cwd(),
    dryRun = false,
    verbose = false,
  } = optionsResult.data;

  const result: SetupResult = {
    success: false,
    configs: [],
    scripts: {},
    errors: [],
    warnings: [],
    info: [],
  };

  try {
    // Step 1: Get preset configuration
    let basePreset: PresetConfig;
    let yamlPreset: YamlPreset | undefined;

    // Check if preset is a path to a YAML file
    if (preset.endsWith('.yaml') || preset.endsWith('.yml')) {
      // Load YAML preset
      const presetPath = resolve(targetDir, preset);
      const loadResult = await loadYamlPreset(presetPath);
      if (!loadResult.success) {
        result.errors.push(`Failed to load preset: ${loadResult.error.message}`);
        return success(result);
      }

      // Resolve inheritance
      const presetsDir = join(targetDir, 'presets');
      const resolvedResult = await resolvePresetInheritance(loadResult.data, presetsDir);
      if (!resolvedResult.success) {
        result.errors.push(`Failed to resolve preset inheritance: ${resolvedResult.error.message}`);
        return success(result);
      }

      yamlPreset = resolvedResult.data;
      basePreset = yamlPresetToConfig(yamlPreset);
    } else {
      // Use built-in preset
      basePreset = getPreset(preset as 'standard' | 'strict' | 'relaxed');
    }

    // Merge preset config with base preset
    const presetConfigResolved: PresetConfig = presetConfig
      ? {
          ...basePreset,
          ...(presetConfig.name !== undefined && { name: presetConfig.name }),
          ...(presetConfig.lineWidth !== undefined && { lineWidth: presetConfig.lineWidth }),
          ...(presetConfig.indentation !== undefined && { indentation: presetConfig.indentation }),
          ...(presetConfig.quotes !== undefined && { quotes: presetConfig.quotes }),
          ...(presetConfig.semicolons !== undefined && { semicolons: presetConfig.semicolons }),
          ...(presetConfig.trailingComma !== undefined && {
            trailingComma: presetConfig.trailingComma,
          }),
          ...(presetConfig.bracketSpacing !== undefined && {
            bracketSpacing: presetConfig.bracketSpacing,
          }),
          ...(presetConfig.arrowParens !== undefined && { arrowParens: presetConfig.arrowParens }),
          ...(presetConfig.endOfLine !== undefined && { endOfLine: presetConfig.endOfLine }),
        }
      : basePreset;
    if (verbose) {
      result.info.push(`Using preset: ${presetConfigResolved.name}`);
    }

    // Step 2: Detect available formatters
    const detectionResult = await detectAvailableFormatters();
    if (!detectionResult.success) {
      result.errors.push(`Failed to detect formatters: ${detectionResult.error.message}`);
      return success(result);
    }

    const { available, missing } = detectionResult.data;

    if (verbose) {
      result.info.push(`Available formatters: ${available.join(', ') || 'none'}`);
      if (missing.length > 0) {
        result.info.push(`Missing formatters: ${missing.join(', ')}`);
      }
    }

    // Step 3: Determine which formatters to configure
    const formattersToSetup = requestedFormatters
      ? requestedFormatters.filter((f) => available.includes(f))
      : available;

    if (formattersToSetup.length === 0) {
      result.warnings.push('No formatters available for setup');
      if (missing.length > 0 && !installMissing) {
        result.info.push('Consider installing formatters or use --install-missing flag');
      }
      result.success = true; // No errors, just no formatters
      return success(result);
    }

    if (verbose) {
      result.info.push(`Setting up formatters: ${formattersToSetup.join(', ')}`);
    }

    // Step 4: Generate configuration files
    const configsResult = await generateConfigs(
      formattersToSetup,
      presetConfigResolved,
      yamlPreset,
      detectionResult.data,
    );
    if (!configsResult.success) {
      result.errors.push(`Failed to generate configs: ${configsResult.error.message}`);
      return success(result);
    }

    // Step 5: Write configuration files
    for (const config of configsResult.data) {
      const filePath = join(targetDir, config.path);

      // Check if file already exists
      const exists = await fileExists(filePath);
      if (exists) {
        result.warnings.push(`File already exists: ${config.path} (skipping)`);
        continue;
      }

      if (!dryRun) {
        try {
          await writeFile(filePath, config.content, 'utf-8');
          result.info.push(`Generated: ${config.path}`);
        } catch (error) {
          result.errors.push(
            `Failed to write ${config.path}: ${error instanceof Error ? error.message : 'Unknown error'}`,
          );
          continue;
        }
      } else {
        result.info.push(`Would generate: ${config.path}`);
      }

      result.configs.push(config);
    }

    // Step 6: Update package.json scripts
    if (updateScripts) {
      const scripts = generatePackageJsonScripts(formattersToSetup);
      result.scripts = scripts;

      if (!dryRun) {
        const updateResult = await updatePackageJsonScripts(targetDir, scripts);
        if (updateResult.success) {
          result.info.push('Updated package.json scripts');
        } else {
          result.warnings.push(`Failed to update package.json: ${updateResult.error.message}`);
        }
      } else {
        result.info.push('Would update package.json scripts');
      }
    }

    // Step 7: Generate DevContainer if requested
    if (optionsResult.data.devcontainer) {
      const devContainerConfig = generateDevContainer(detectionResult.data, optionsResult.data);
      if (devContainerConfig) {
        const devContainerPath = join(targetDir, '.devcontainer', 'devcontainer.json');

        if (!dryRun) {
          // Create .devcontainer directory if it doesn't exist
          const devContainerDir = join(targetDir, '.devcontainer');
          try {
            await mkdir(devContainerDir, { recursive: true });
            await writeFile(devContainerPath, devContainerConfig.content, 'utf-8');
            result.configs.push({
              path: '.devcontainer/devcontainer.json',
              formatter: 'prettier', // DevContainer files are JSON, format with Prettier
              content: devContainerConfig.content,
              generated: true,
            });
            result.info.push('Created .devcontainer/devcontainer.json');
          } catch (error) {
            result.warnings.push(
              `Failed to create devcontainer config: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
          }
        } else {
          result.info.push('Would create .devcontainer/devcontainer.json');
        }
      }
    }

    // Step 8: Final success check
    result.success = result.errors.length === 0;

    if (result.success) {
      result.info.push(`Setup completed successfully for ${formattersToSetup.length} formatter(s)`);
    }

    return success(result);
  } catch (error) {
    result.errors.push(`Setup failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return success(result);
  }
}

/**
 * Check if a file exists
 */
async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

/**
 * Update package.json with new scripts
 */
async function updatePackageJsonScripts(
  targetDir: string,
  scripts: Record<string, string>,
): Promise<Result<void, Error>> {
  try {
    const packageJsonPath = join(targetDir, 'package.json');

    // Check if package.json exists
    if (!(await fileExists(packageJsonPath))) {
      return failure(makeError('VALIDATION_ERROR', 'package.json not found'));
    }

    // Read and parse package.json
    const content = await readFile(packageJsonPath, 'utf-8');
    const parseResult = await validatePackageJson(content);

    if (!parseResult.success) {
      return failure(
        makeError('VALIDATION_ERROR', 'Invalid package.json format', { cause: parseResult.error }),
      );
    }

    const packageJson = parseResult.data;

    // Update scripts
    packageJson.scripts = {
      ...packageJson.scripts,
      ...scripts,
    };

    // Write back to file
    const updatedContent = `${JSON.stringify(packageJson, null, 2)}\n`;
    await writeFile(packageJsonPath, updatedContent, 'utf-8');

    return success(undefined);
  } catch (error) {
    return failure(makeError('INTERNAL_ERROR', 'Failed to update package.json', { cause: error }));
  }
}
