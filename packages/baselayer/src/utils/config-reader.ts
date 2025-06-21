import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import {
  type AppError,
  ErrorCode,
  failure,
  makeError,
  type Result,
  success,
} from '@outfitter/contracts';
import { fromZod } from '@outfitter/contracts-zod';
import { parse } from 'comment-json';
import type { OutfitterConfig, PartialOutfitterConfig } from '../types/index.js';
import { DEFAULT_CONFIG, OutfitterConfigSchema } from '../types/index.js';

/**
 * Reads and parses the .outfitter/config.jsonc file
 */
export async function readConfig(
  cwd: string = process.cwd(),
): Promise<Result<OutfitterConfig, AppError>> {
  const configPath = join(cwd, '.outfitter', 'config.jsonc');

  try {
    if (!existsSync(configPath)) {
      return success(DEFAULT_CONFIG);
    }

    const configContent = await readFile(configPath, 'utf-8');
    const userConfig = parse(configContent);

    // 1. Parse against the lenient schema
    const validationResult = OutfitterConfigSchema.safeParse(userConfig);
    if (!validationResult.success) {
      return failure(fromZod(validationResult.error));
    }

    // 2. Merge the parsed partial config with defaults
    const fullConfig = mergeConfigs(DEFAULT_CONFIG, validationResult.data);

    return success(fullConfig);
  } catch (error) {
    return failure(
      makeError(
        ErrorCode.INTERNAL_ERROR,
        `Failed to read or parse config from ${configPath}`,
        { path: configPath },
        error instanceof Error ? error : undefined,
      ),
    );
  }
}

/**
 * Deeply merges the default configuration with a user-provided partial configuration, giving precedence to user values.
 *
 * Merges nested objects for `baselayer`, `codeStyle`, and `overrides` (including `biome`, `eslint`, `prettier`, and `rightdown`), ensuring user-specified settings override defaults where provided.
 *
 * @param defaultConfig - The base configuration object to merge into
 * @param userConfig - The user-supplied partial configuration to merge
 * @returns The resulting configuration object after merging
 */
function mergeConfigs(
  defaultConfig: OutfitterConfig,
  userConfig: PartialOutfitterConfig,
): OutfitterConfig {
  const result: OutfitterConfig = {
    ...defaultConfig,
    ...userConfig,
    baselayer: {
      ...defaultConfig.baselayer,
      ...(userConfig.baselayer ?? {}),
      tools: {
        ...defaultConfig.baselayer.tools,
        ...(userConfig.baselayer?.tools ?? {}),
      },
      features: {
        ...defaultConfig.baselayer.features,
        ...(userConfig.baselayer?.features ?? {}),
      },
    },
    codeStyle: {
      ...defaultConfig.codeStyle,
      ...(userConfig.codeStyle ?? {}),
    },
    overrides: {
      ...defaultConfig.overrides,
      ...(userConfig.overrides ?? {}),
      biome: {
        ...(defaultConfig.overrides?.biome ?? {}),
        ...(userConfig.overrides?.biome ?? {}),
      },
      eslint: {
        ...(defaultConfig.overrides?.eslint ?? {}),
        ...(userConfig.overrides?.eslint ?? {}),
      },
      prettier: {
        ...(defaultConfig.overrides?.prettier ?? {}),
        ...(userConfig.overrides?.prettier ?? {}),
      },
      rightdown: {
        ...(defaultConfig.overrides?.rightdown ?? {}),
        ...(userConfig.overrides?.rightdown ?? {}),
      },
    },
  };
  return result;
}
