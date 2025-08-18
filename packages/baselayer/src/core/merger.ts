/**

- Smart config merging utilities
 */
import { failure, isFailure, type Result, success } from '@outfitter/contracts';
import {
  type FileSystemError,
  fileExists,
  readJSON,
  writeJSON,
} from '../utils/file-system';

export interface MergeOptions {
  strategy?: 'merge' | 'replace' | 'preserve';
  arrays?: 'concat' | 'replace' | 'unique';
  backup?: boolean;
}

/**

- Deep merge two objects
 */
export function deepMerge<T extends Record<string, unknown>>(
  target: T,
  source: Partial<T>,
  options: MergeOptions = {}
): T {
  const { strategy = 'merge', arrays = 'unique' } = options;

  if (strategy === 'replace') {
    return source as T;
  }

  if (strategy === 'preserve') {
    return target;
  }

  const result = { ...target };

  for (const key in source) {
    const sourceValue = source[key];
    const targetValue = target[key];

    if (sourceValue === undefined) {
      continue;
    }

    if (Array.isArray(sourceValue) && Array.isArray(targetValue)) {
      switch (arrays) {
        case 'concat':
          result[key] = [...targetValue, ...sourceValue] as T[Extract<
            keyof T,
            string
          >];
          break;
        case 'replace':
          result[key] = sourceValue as T[Extract<keyof T, string>];
          break;
        case 'unique':
          result[key] = [
            ...new Set([...targetValue, ...sourceValue]),
          ] as T[Extract<keyof T, string>];
          break;
      }
    } else if (
      typeof sourceValue === 'object' &&
      sourceValue !== null &&
      !Array.isArray(sourceValue) &&
      typeof targetValue === 'object' &&
      targetValue !== null &&
      !Array.isArray(targetValue)
    ) {
      result[key] = deepMerge(
        targetValue as Record<string, unknown>,
        sourceValue as Record<string, unknown>,
        options
      ) as T[Extract<keyof T, string>];
    } else {
      result[key] = sourceValue as T[Extract<keyof T, string>];
    }
  }

  return result;
}

/**

- Merge JSON file with new data
 */
export async function mergeJSONFile(
  filePath: string,
  newData: Record<string, unknown>,
  options: MergeOptions = {}
): Promise<Result<void, FileSystemError>> {
  const existsResult = await fileExists(filePath);
  if (isFailure(existsResult)) {
    return failure(existsResult.error);
  }

  let existingData: Record<string, unknown> = {};
  if (existsResult.data) {
    const readResult = await readJSON<Record<string, unknown>>(filePath);
    if (isFailure(readResult)) {
      return failure(readResult.error);
    }
    existingData = readResult.data;
  }

  const merged = deepMerge(existingData, newData, options);

  const writeResult = await writeJSON(filePath, merged);
  if (isFailure(writeResult)) {
    return failure(writeResult.error);
  }

  return success(undefined);
}

/**

- Merge VS Code settings
 */
export async function mergeVSCodeSettings(
  newSettings: Record<string, unknown>,
  options: MergeOptions = {}
): Promise<Result<void, FileSystemError>> {
  return mergeJSONFile('.vscode/settings.json', newSettings, {
    ...options,
    arrays: 'unique',
  });
}

/**

- Merge VS Code extensions
 */
export async function mergeVSCodeExtensions(
  newExtensions: { recommendations: string[] },
  options: MergeOptions = {}
): Promise<Result<void, FileSystemError>> {
  return mergeJSONFile('.vscode/extensions.json', newExtensions, {
    ...options,
    arrays: 'unique',
  });
}

/**

- Merge package.json scripts
 */
export async function mergePackageScripts(
  newScripts: Record<string, string>,
  options: { overwrite?: boolean } = {}
): Promise<Result<void, FileSystemError>> {
  const { overwrite = false } = options;

  const pkgResult = await readJSON<Record<string, unknown>>('package.json');
  if (isFailure(pkgResult)) {
    return failure(pkgResult.error);
  }

  const pkg = pkgResult.data;
  const scripts = (pkg.scripts as Record<string, string>) || {};
  pkg.scripts = scripts;

  for (const [name, command] of Object.entries(newScripts)) {
    if (!scripts[name] || overwrite) {
      scripts[name] = command;
    }
  }

  const writeResult = await writeJSON('package.json', pkg);
  if (isFailure(writeResult)) {
    return failure(writeResult.error);
  }

  return success(undefined);
}

/**

- Remove fields from JSON file
 */
export async function removeJSONFields(
  filePath: string,
  fields: string[]
): Promise<Result<void, FileSystemError>> {
  const existsResult = await fileExists(filePath);
  if (isFailure(existsResult)) {
    return failure(existsResult.error);
  }

  if (!existsResult.data) {
    return success(undefined); // File doesn't exist, nothing to remove
  }

  const readResult = await readJSON<Record<string, unknown>>(filePath);
  if (isFailure(readResult)) {
    return failure(readResult.error);
  }

  const data = readResult.data;
  for (const field of fields) {
    delete data[field];
  }

  const writeResult = await writeJSON(filePath, data);
  if (isFailure(writeResult)) {
    return failure(writeResult.error);
  }

  return success(undefined);
}

/**

- Remove embedded configs from package.json
 */
export async function removeEmbeddedConfigs(): Promise<
  Result<void, FileSystemError>
> {
  const embeddedConfigs = [
    'eslintConfig',
    'prettier',
    'stylelint',
    'xo',
    'standard',
    'jest',
  ];

  return removeJSONFields('package.json', embeddedConfigs);
}
