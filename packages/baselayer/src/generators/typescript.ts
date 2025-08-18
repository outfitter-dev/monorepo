import { failure, isFailure, type Result, success } from '@outfitter/contracts';
import type { BaselayerConfig } from '../schemas/baselayer-config.js';
import { writeJSON } from '../utils/file-system.js';

export type TypeScriptPreset = 'strict' | 'standard' | 'minimal';

export interface TypeScriptConfig {
  extends?: string;
  compilerOptions: Record<string, unknown>;
  include?: string[];
  exclude?: string[];
  references?: Array<{ path: string }>;
}

/**

- Get TypeScript compiler options for different presets
 */
function getPresetCompilerOptions(
  preset: TypeScriptPreset
): Record<string, unknown> {
  const base = {
    target: 'ES2022',
    lib: ['ES2022'],
    module: 'ESNext',
    moduleResolution: 'bundler',
    esModuleInterop: true,
    allowSyntheticDefaultImports: true,
    skipLibCheck: true,
    forceConsistentCasingInFileNames: true,
    resolveJsonModule: true,
  };

  switch (preset) {
    case 'strict':
      return {
        ...base,
        strict: true,
        noImplicitAny: true,
        noImplicitReturns: true,
        noImplicitThis: true,
        noImplicitOverride: true,
        noUnusedLocals: true,
        noUnusedParameters: true,
        exactOptionalPropertyTypes: true,
        noUncheckedIndexedAccess: true,
        allowUnusedLabels: false,
        allowUnreachableCode: false,
      };

    case 'standard':
      return {
        ...base,
        strict: true,
        noImplicitReturns: true,
        noFallthroughCasesInSwitch: true,
        noUncheckedIndexedAccess: true,
      };

    case 'minimal':
      return {
        ...base,
        strict: false,
        noImplicitAny: false,
      };

    default:
      return base;
  }
}

/**

- Generate tsconfig.json configuration
 */
export function generateTypeScriptConfig(
  config?: BaselayerConfig,
  preset: TypeScriptPreset = 'strict'
): TypeScriptConfig {
  const compilerOptions = getPresetCompilerOptions(preset);

  // Project-specific adjustments
  if (config?.project?.framework === 'react') {
    Object.assign(compilerOptions, {
      jsx: 'react-jsx',
      lib: [...(compilerOptions.lib as string[]), 'DOM', 'DOM.Iterable'],
    });
  } else if (config?.project?.framework === 'next') {
    Object.assign(compilerOptions, {
      jsx: 'preserve',
      lib: [...(compilerOptions.lib as string[]), 'DOM', 'DOM.Iterable'],
      incremental: true,
      plugins: [{ name: 'next' }],
    });
  }

  // Add declaration files for libraries
  if (config?.project?.type === 'library') {
    Object.assign(compilerOptions, {
      declaration: true,
      declarationMap: true,
      outDir: './dist',
      rootDir: './src',
    });
  }

  // Output configuration
  if (!compilerOptions.outDir && config?.project?.type !== 'library') {
    compilerOptions.outDir = './dist';
  }

  const tsConfig: TypeScriptConfig = {
    compilerOptions,
  };

  // Include/exclude patterns
  const include = ['src/**/*'];
  const exclude = ['node_modules', 'dist', 'build'];

  if (config?.project?.type === 'monorepo') {
    exclude.push('packages/**/node_modules', 'packages/**/dist');
  }

  // Add testing files if testing is enabled
  if (config?.features?.testing) {
    include.push('**/*.test.*', '**/*.spec.*');
  }

  // Add custom ignores
  if (config?.ignore) {
    exclude.push(...config.ignore);
  }

  tsConfig.include = include;
  tsConfig.exclude = exclude;

  return tsConfig;
}

/**

- Generate tsconfig for different project types
 */
export function generateProjectTypeScriptConfigs(
  config?: BaselayerConfig
): Record<string, TypeScriptConfig> {
  const configs: Record<string, TypeScriptConfig> = {};

  // Main tsconfig
  configs['tsconfig.json'] = generateTypeScriptConfig(config, 'strict');

  // Build-specific config for libraries
  if (config?.project?.type === 'library') {
    configs['tsconfig.build.json'] = {
      extends: './tsconfig.json',
      compilerOptions: {
        composite: true,
        declaration: true,
        declarationMap: true,
        emitDeclarationOnly: false,
      },
      exclude: [
        '**/*.test.*',
        '**/*.spec.*',
        '__tests__/**',
        'tests/**',
        'mocks/**',
        'vitest.config.*',
        'vite.config.*',
      ],
    };
  }

  // Test-specific config
  if (config?.features?.testing) {
    configs['tsconfig.test.json'] = {
      extends: './tsconfig.json',
      compilerOptions: {
        types: ['vitest/globals', 'node'],
        lib: ['ES2022', 'DOM'],
      },
      include: ['**/*.test.*', '**/*.spec.*', 'vitest.config.*'],
    };
  }

  return configs;
}

/**

- Write TypeScript configuration files
 */
export async function generateAllTypeScriptConfigs(
  config?: BaselayerConfig
): Promise<Result<void, Error>> {
  try {
    const configs = generateProjectTypeScriptConfigs(config);

    for (const [filename, tsConfig] of Object.entries(configs)) {
      const result = await writeJSON(filename, tsConfig);
      if (isFailure(result)) {
        return failure(new Error(result.error.message));
      }
    }

    return success(undefined);
  } catch (error) {
    return failure(error as Error);
  }
}

/**

- Write single tsconfig.json file
 */
export async function generateTypeScriptConfigFile(
  config?: BaselayerConfig,
  preset: TypeScriptPreset = 'strict'
): Promise<Result<void, Error>> {
  try {
    const tsConfig = generateTypeScriptConfig(config, preset);

    const result = await writeJSON('tsconfig.json', tsConfig);
    if (isFailure(result)) {
      return failure(new Error(result.error.message));
    }

    return success(undefined);
  } catch (error) {
    return failure(error as Error);
  }
}
