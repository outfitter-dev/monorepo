/**
 * Formatter detection utilities
 */

import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { access, constants } from 'node:fs/promises';
import { join } from 'node:path';
import type {
  FormatterDetection,
  FormatterDetectionResult,
  FormatterType,
} from '../types/index.js';
import type { Result } from '@outfitter/contracts';
import { success, failure, makeError } from '@outfitter/contracts';

const execAsync = promisify(exec);

/**
 * Detect if a specific formatter is available
 */
export async function detectFormatter(type: FormatterType): Promise<FormatterDetection> {
  const detection: FormatterDetection = {
    type,
    available: false,
  };

  try {
    // First try local node_modules
    const localPath = await findLocalFormatter(type);
    if (localPath) {
      const version = await getFormatterVersion(type, localPath);
      return {
        ...detection,
        available: true,
        location: 'local',
        path: localPath,
        ...(version && { version }),
      };
    }

    // Then try global/system installation
    const globalResult = await findGlobalFormatter(type);
    if (globalResult.success) {
      return {
        ...detection,
        available: true,
        location: 'global',
        path: globalResult.data.path,
        ...(globalResult.data.version && { version: globalResult.data.version }),
      };
    }

    return {
      ...detection,
      error: globalResult.error?.message || 'Not found',
    };
  } catch (error) {
    return {
      ...detection,
      error: error instanceof Error ? error.message : 'Detection failed',
    };
  }
}

/**
 * Detect all available formatters
 */
export async function detectAvailableFormatters(): Promise<
  Result<FormatterDetectionResult, Error>
> {
  try {
    const formatters: Array<FormatterType> = ['prettier', 'biome', 'remark', 'eslint'];
    const detections = await Promise.all(formatters.map((type) => detectFormatter(type)));

    const available = detections.filter((d) => d.available).map((d) => d.type);

    const missing = detections.filter((d) => !d.available).map((d) => d.type);

    return success({
      formatters: detections,
      available,
      missing,
    });
  } catch (error) {
    return failure(makeError('INTERNAL_ERROR', 'Failed to detect formatters', { cause: error }));
  }
}

/**
 * Find formatter in local node_modules
 */
async function findLocalFormatter(type: FormatterType): Promise<string | null> {
  const binName = getFormatterBinName(type);
  const localBinPath = join(process.cwd(), 'node_modules', '.bin', binName);

  try {
    await access(localBinPath, constants.F_OK);
    return localBinPath;
  } catch {
    return null;
  }
}

/**
 * Find formatter in global/system PATH
 */
async function findGlobalFormatter(
  type: FormatterType,
): Promise<Result<{ path: string; version?: string }, Error>> {
  const binName = getFormatterBinName(type);

  try {
    // Use 'which' on Unix-like systems, 'where' on Windows
    const command = process.platform === 'win32' ? `where ${binName}` : `which ${binName}`;
    const { stdout } = await execAsync(command);
    const path = stdout.trim().split('\n')[0];

    if (path) {
      const version = await getFormatterVersion(type, path);
      return success({ path, ...(version && { version }) });
    }

    return failure(makeError('VALIDATION_ERROR', `${binName} not found in PATH`));
  } catch (error) {
    return failure(makeError('INTERNAL_ERROR', `Failed to detect ${type}`, { cause: error }));
  }
}

/**
 * Get formatter version
 */
async function getFormatterVersion(type: FormatterType, path: string): Promise<string | undefined> {
  try {
    const versionFlag = getFormatterVersionFlag(type);
    const { stdout } = await execAsync(`"${path}" ${versionFlag}`);
    return parseVersionOutput(type, stdout);
  } catch {
    return undefined;
  }
}

/**
 * Get the binary name for a formatter
 */
function getFormatterBinName(type: FormatterType): string {
  switch (type) {
    case 'prettier':
      return 'prettier';
    case 'biome':
      return 'biome';
    case 'remark':
      return 'remark';
    case 'eslint':
      return 'eslint';
    default:
      throw new Error(`Unknown formatter type: ${type}`);
  }
}

/**
 * Get the version flag for a formatter
 */
function getFormatterVersionFlag(type: FormatterType): string {
  switch (type) {
    case 'prettier':
      return '--version';
    case 'biome':
      return '--version';
    case 'remark':
      return '--version';
    case 'eslint':
      return '--version';
    default:
      throw new Error(`Unknown formatter type: ${type}`);
  }
}

/**
 * Parse version output from different formatters
 */
function parseVersionOutput(type: FormatterType, output: string): string {
  const cleanOutput = output.trim();

  switch (type) {
    case 'prettier':
      // Prettier outputs just the version number
      return cleanOutput;
    case 'biome': {
      // Biome outputs "Version: 1.8.3" or similar
      const biomeMatch =
        cleanOutput.match(/Version:\s*(.+)/i) || cleanOutput.match(/(\d+\.\d+\.\d+)/);
      return biomeMatch?.[1] ?? cleanOutput;
    }
    case 'remark': {
      // Remark outputs version info, extract the number
      const remarkMatch = cleanOutput.match(/(\d+\.\d+\.\d+)/);
      return remarkMatch?.[1] ?? cleanOutput;
    }
    case 'eslint': {
      // ESLint outputs "v8.57.0" or similar
      const eslintMatch = cleanOutput.match(/v?(\d+\.\d+\.\d+)/);
      return eslintMatch?.[1] ?? cleanOutput;
    }
    default:
      return cleanOutput;
  }
}
