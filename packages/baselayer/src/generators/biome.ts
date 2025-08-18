import { execSync } from 'node:child_process';
import { failure, type Result, success } from '@outfitter/contracts';
import type { BaselayerConfig } from '../schemas/baselayer-config.js';
import type { FileSystemError } from '../utils/file-system.js';

/**

- Generate biome.json configuration with Ultracite base and smart overrides
 */
export function generateBiomeConfig(config?: BaselayerConfig): string {
  const base = {
    $schema: '<https://biomejs.dev/schemas/1.9.4/schema.json>',
    extends: ['ultracite'],
  };

  // Smart exclusions based on enabled tools
  const excludes: string[] = [];

  // Always exclude common build/dependency files
  excludes.push(
    'node_modules/**',
    'dist/**',
    'build/**',
    '.next/**',
    'out/**',
    'coverage/**',
    '*.min.js',
    '*.min.css'
  );

  // Add project-specific exclusions
  if (config?.project?.type === 'monorepo') {
    excludes.push('packages/**/node_modules/**');
  }

  // Add custom ignore patterns
  if (config?.ignore) {
    excludes.push(...config.ignore);
  }

  const result = {
    ...base,
    files: {
      ignore: excludes,
    },
  };

  // Apply user overrides
  if (config?.overrides?.biome) {
    Object.assign(result, config.overrides.biome);
  }

  return JSON.stringify(result, null, 2);
}

/**

- Install Biome via Ultracite and create configuration
 */
export async function installBiomeConfig(
  _config?: BaselayerConfig
): Promise<Result<void, FileSystemError>> {
  try {
    // Ultracite init handles installation and basic setup
    execSync('bunx ultracite init --yes', {
      stdio: 'inherit',
      env: { ...process.env, FORCE_COLOR: '1' },
    });
    return success(undefined);
  } catch (error) {
    const err = error as Error;
    return failure({
      type: 'FILE_SYSTEM_ERROR',
      code: 'BIOME_INSTALL_FAILED',
      message: `Failed to install Biome config: ${err.message}`,
    } as FileSystemError);
  }
}

// Maintain backward compatibility
export const generateBiomeConfigLegacy = installBiomeConfig;
