/**
 * YAML preset configuration system
 * Loads and processes YAML-based presets with "common" and "raw" sections
 */

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { parse as parseYaml } from 'yaml';
import { z } from 'zod';
import { fromZod } from '@outfitter/contracts-zod';
import type { PresetConfig } from '../types/index.js';
import type { Result } from '@outfitter/contracts';
import { success, failure, makeError } from '@outfitter/contracts';

/**
 * YAML preset structure with common formatting concepts and raw tool-specific configs
 */
export interface YamlPreset {
  name: string;
  description?: string;
  extends?: string;
  common?: {
    indentation?: {
      style?: 'space' | 'tab';
      width?: number;
    };
    lineWidth?: number;
    quotes?: {
      style?: 'single' | 'double';
      jsx?: 'single' | 'double';
    };
    semicolons?: 'always' | 'asNeeded';
    trailingComma?: 'all' | 'es5' | 'none';
    bracketSpacing?: boolean;
    arrowParens?: 'always' | 'asNeeded';
    endOfLine?: 'lf' | 'crlf' | 'cr' | 'auto';
  };
  raw?: {
    prettier?: Record<string, unknown>;
    biome?: Record<string, unknown>;
    remark?: Record<string, unknown>;
    eslint?: Record<string, unknown>;
    markdownlint?: Record<string, unknown>;
  };
}

/**
 * Zod schema for YamlPreset validation
 */
const YamlPresetSchema = z.object({
  name: z.string({
    required_error: 'Preset must have a name',
    invalid_type_error: 'Preset name must be a string',
  }),
  description: z.string().optional(),
  extends: z.string().optional(),
  common: z
    .object({
      indentation: z
        .object({
          style: z.enum(['space', 'tab']).optional(),
          width: z.number().optional(),
        })
        .optional(),
      lineWidth: z.number().optional(),
      quotes: z
        .object({
          style: z.enum(['single', 'double']).optional(),
          jsx: z.enum(['single', 'double']).optional(),
        })
        .optional(),
      semicolons: z.enum(['always', 'asNeeded']).optional(),
      trailingComma: z.enum(['all', 'es5', 'none']).optional(),
      bracketSpacing: z.boolean().optional(),
      arrowParens: z.enum(['always', 'asNeeded']).optional(),
      endOfLine: z.enum(['lf', 'crlf', 'cr', 'auto']).optional(),
    })
    .optional(),
  raw: z
    .object({
      prettier: z.record(z.unknown()).optional(),
      biome: z.record(z.unknown()).optional(),
      remark: z.record(z.unknown()).optional(),
      eslint: z.record(z.unknown()).optional(),
      markdownlint: z.record(z.unknown()).optional(),
    })
    .optional(),
});

/**
 * Load a YAML preset file
 */
export async function loadYamlPreset(path: string): Promise<Result<YamlPreset, Error>> {
  try {
    const content = await readFile(path, 'utf-8');
    const parsedContent = parseYaml(content);

    // Validate with Zod schema
    const parseResult = YamlPresetSchema.safeParse(parsedContent);

    if (!parseResult.success) {
      // Get the first error message for better user experience
      const firstError = parseResult.error.issues[0];
      if (firstError && firstError.message.includes('must have a name')) {
        return failure(makeError('VALIDATION_ERROR', firstError.message));
      }
      return failure(fromZod(parseResult.error));
    }

    return success(parseResult.data);
  } catch (error) {
    return failure(makeError('INTERNAL_ERROR', `Failed to load preset: ${path}`, { cause: error }));
  }
}

/**
 * Convert YAML preset to PresetConfig
 */
export function yamlPresetToConfig(preset: YamlPreset): PresetConfig {
  const { common = {} } = preset;

  return {
    name: ['standard', 'strict', 'relaxed'].includes(preset.name)
      ? (preset.name as 'standard' | 'strict' | 'relaxed')
      : 'standard',
    lineWidth: common.lineWidth ?? 80,
    indentation: {
      style: common.indentation?.style ?? 'space',
      width: common.indentation?.width ?? 2,
    },
    quotes: {
      style: common.quotes?.style ?? 'single',
      jsx: common.quotes?.jsx ?? 'double',
    },
    semicolons: common.semicolons ?? 'always',
    trailingComma: common.trailingComma ?? 'all',
    bracketSpacing: common.bracketSpacing ?? true,
    arrowParens: common.arrowParens ?? 'always',
    endOfLine: common.endOfLine ?? 'lf',
  };
}

/**
 * Merge raw tool-specific configurations with generated configs
 */
export function mergeRawConfig(
  generated: Record<string, unknown>,
  raw?: Record<string, unknown>,
): Record<string, unknown> {
  if (!raw) {
    return generated;
  }

  // Deep merge with raw config taking precedence
  return deepMerge(generated, raw);
}

/**
 * Deep merge two objects (raw config takes precedence)
 */
function deepMerge(
  target: Record<string, unknown>,
  source: Record<string, unknown>,
): Record<string, unknown> {
  const result = { ...target };

  for (const [key, value] of Object.entries(source)) {
    if (value === null || value === undefined) {
      continue;
    }

    if (typeof value === 'object' && !Array.isArray(value)) {
      result[key] = deepMerge(
        (result[key] as Record<string, unknown>) || {},
        value as Record<string, unknown>,
      );
    } else {
      result[key] = value;
    }
  }

  return result;
}

/**
 * Merge primitive values from parent and child
 */
function mergePrimitive<T>(child: T | undefined, parent: T | undefined): T | undefined {
  return child ?? parent;
}

/**
 * Merge object values with custom merger function
 */
function mergeObject<T extends Record<string, unknown>>(
  child: T | undefined,
  parent: T | undefined,
  merger: (c: T, p: T) => T,
): T | undefined {
  if (!child && !parent) return undefined;
  if (!child) return parent;
  if (!parent) return child;
  return merger(child, parent);
}

/**
 * Helper to merge primitive properties into a target object
 */
function mergePrimitiveProperty<T extends Record<string, unknown>, K extends keyof T>(
  target: T,
  key: K,
  childValue: T[K] | undefined,
  parentValue: T[K] | undefined,
): void {
  const value = mergePrimitive(childValue, parentValue);
  if (value !== undefined) {
    target[key] = value;
  }
}

/**
 * Merge common sections specifically
 */
function mergeCommonSections(
  parent: YamlPreset['common'],
  child: YamlPreset['common'],
): YamlPreset['common'] | undefined {
  if (!parent && !child) {
    return undefined;
  }

  const merged: NonNullable<YamlPreset['common']> = {};
  const parentCommon = parent || {};
  const childCommon = child || {};

  // Merge primitive properties
  mergePrimitiveProperty(merged, 'lineWidth', childCommon.lineWidth, parentCommon.lineWidth);
  mergePrimitiveProperty(merged, 'semicolons', childCommon.semicolons, parentCommon.semicolons);
  mergePrimitiveProperty(merged, 'trailingComma', childCommon.trailingComma, parentCommon.trailingComma);
  mergePrimitiveProperty(merged, 'bracketSpacing', childCommon.bracketSpacing, parentCommon.bracketSpacing);
  mergePrimitiveProperty(merged, 'arrowParens', childCommon.arrowParens, parentCommon.arrowParens);
  mergePrimitiveProperty(merged, 'endOfLine', childCommon.endOfLine, parentCommon.endOfLine);

  // Merge indentation object
  const indentation = mergeObject(
    childCommon.indentation,
    parentCommon.indentation,
    (child, parent) => {
      const result: NonNullable<typeof merged.indentation> = {};
      mergePrimitiveProperty(result, 'style', child.style, parent.style);
      mergePrimitiveProperty(result, 'width', child.width, parent.width);
      return Object.keys(result).length > 0 ? result : {};
    },
  );
  if (indentation && Object.keys(indentation).length > 0) {
    merged.indentation = indentation;
  }

  // Merge quotes object
  const quotes = mergeObject(childCommon.quotes, parentCommon.quotes, (child, parent) => {
    const result: NonNullable<typeof merged.quotes> = {};
    mergePrimitiveProperty(result, 'style', child.style, parent.style);
    mergePrimitiveProperty(result, 'jsx', child.jsx, parent.jsx);
    return Object.keys(result).length > 0 ? result : {};
  });
  if (quotes && Object.keys(quotes).length > 0) {
    merged.quotes = quotes;
  }

  return Object.keys(merged).length > 0 ? merged : undefined;
}

/**
 * Resolve preset inheritance (extends field)
 */
export async function resolvePresetInheritance(
  preset: YamlPreset,
  presetsDir: string,
  visited = new Set<string>(),
): Promise<Result<YamlPreset, Error>> {
  if (!preset.extends) {
    return success(preset);
  }

  // Check for circular dependencies
  if (visited.has(preset.extends)) {
    return failure(
      makeError(
        'VALIDATION_ERROR',
        `Circular dependency detected: ${Array.from(visited).join(' -> ')} -> ${preset.extends}`,
      ),
    );
  }

  visited.add(preset.extends);

  // Load parent preset
  const parentPath = join(presetsDir, `${preset.extends}.yaml`);
  const parentResult = await loadYamlPreset(parentPath);

  if (!parentResult.success) {
    return failure(
      makeError('NOT_FOUND', `Parent preset not found: ${preset.extends}`, {
        cause: parentResult.error,
      }),
    );
  }

  // Recursively resolve parent's inheritance
  const resolvedParentResult = await resolvePresetInheritance(
    parentResult.data,
    presetsDir,
    visited,
  );
  if (!resolvedParentResult.success) {
    return resolvedParentResult;
  }

  const parent = resolvedParentResult.data;

  // Merge with parent (child takes precedence)
  const merged: YamlPreset = {
    name: preset.name || parent.name,
    raw: {
      prettier: deepMerge(parent.raw?.prettier || {}, preset.raw?.prettier || {}),
      biome: deepMerge(parent.raw?.biome || {}, preset.raw?.biome || {}),
      remark: deepMerge(parent.raw?.remark || {}, preset.raw?.remark || {}),
      eslint: deepMerge(parent.raw?.eslint || {}, preset.raw?.eslint || {}),
      markdownlint: deepMerge(parent.raw?.markdownlint || {}, preset.raw?.markdownlint || {}),
    },
  };

  // Add optional properties only if they exist
  const description = preset.description || parent.description;
  if (description !== undefined) {
    merged.description = description;
  }

  // Note: extends field is intentionally omitted as inheritance has been resolved

  // Merge common section if either parent or child has it
  const mergedCommon = mergeCommonSections(parent.common, preset.common);
  if (mergedCommon !== undefined) {
    merged.common = mergedCommon;
  }

  return success(merged);
}
