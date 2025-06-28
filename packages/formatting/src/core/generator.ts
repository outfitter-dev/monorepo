/**
 * Configuration file generator orchestration
 */

import type {
  PresetConfig,
  FormatterType,
  GeneratedConfig,
  FormatterDetectionResult,
  SetupOptions,
} from '../types/index.js';
import type { Result } from '@outfitter/contracts';
import { success, failure, makeError } from '@outfitter/contracts';
import type { YamlPreset } from '../utils/yaml-presets.js';
import {
  generatePrettierConfigFile,
  generateBiomeConfigFile,
  generateRemarkConfigFile,
  generateEslintConfigFile,
  generateDevContainerConfig,
  formatDevContainerConfig,
} from '../generators/index.js';

/**
 * Generate configuration files for available formatters
 */
export async function generateConfigs(
  formatters: Array<FormatterType>,
  preset: PresetConfig,
  yamlPreset?: YamlPreset,
  detection?: FormatterDetectionResult,
): Promise<Result<Array<GeneratedConfig>, Error>> {
  try {
    const configs: Array<GeneratedConfig> = [];

    for (const formatter of formatters) {
      const configResult = await generateFormatterConfig(formatter, preset, yamlPreset, detection);
      if (configResult.success) {
        configs.push(configResult.data);
      } else {
        return failure(configResult.error);
      }
    }

    return success(configs);
  } catch (error) {
    return failure(
      makeError('INTERNAL_ERROR', 'Failed to generate configurations', { cause: error }),
    );
  }
}

/**
 * Generate configuration for a specific formatter
 */
export async function generateFormatterConfig(
  formatter: FormatterType,
  preset: PresetConfig,
  yamlPreset?: YamlPreset,
  detection?: FormatterDetectionResult,
): Promise<Result<GeneratedConfig, Error>> {
  try {
    switch (formatter) {
      case 'prettier':
        return generatePrettierConfigFile(preset, yamlPreset);
      case 'biome':
        return generateBiomeConfigFile(preset, yamlPreset);
      case 'remark':
        return generateRemarkConfigFile(preset, yamlPreset, detection);
      case 'eslint':
        return generateEslintConfigFile(preset, yamlPreset);
      default:
        return failure(makeError('VALIDATION_ERROR', `Unknown formatter: ${formatter}`));
    }
  } catch (error) {
    return failure(
      makeError('INTERNAL_ERROR', `Failed to generate ${formatter} configuration`, {
        cause: error,
      }),
    );
  }
}

// Re-export the package.json scripts generator
export { generatePackageJsonScripts } from '../generators/package-json.js';

/**
 * Generate devcontainer configuration
 */
export function generateDevContainer(
  detectionResult: FormatterDetectionResult,
  options: SetupOptions,
): { filename: string; content: string } | undefined {
  if (!options.devcontainer) {
    return undefined;
  }

  // Convert detection result to simple formatter detection object
  const formatters = {
    prettier: detectionResult.available.includes('prettier'),
    biome: detectionResult.available.includes('biome'),
    remark: detectionResult.available.includes('remark'),
    eslint: detectionResult.available.includes('eslint'),
  };

  const config = generateDevContainerConfig(formatters);
  const content = formatDevContainerConfig(config);

  return {
    filename: '.devcontainer/devcontainer.json',
    content,
  };
}
