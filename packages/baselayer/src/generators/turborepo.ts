import { failure, isFailure, type Result, success } from '@outfitter/contracts';
import type { BaselayerConfig } from '../schemas/baselayer-config.js';
import { writeJSON } from '../utils/file-system.js';

export interface TurboConfig {
  $schema: string;
  pipeline: Record<string, TurboPipeline>;
  globalDependencies?: string[];
  globalEnv?: string[];
  ui?: 'tui' | 'stream';
}

export interface TurboPipeline {
  dependsOn?: string[];
  inputs?: string[];
  outputs?: string[];
  cache?: boolean;
  env?: string[];
  outputMode?: 'full' | 'hash-only' | 'new-only' | 'errors-only';
  persistent?: boolean;
}

/**
 * Generate Turborepo configuration for monorepos
 */
export function generateTurboConfig(config?: BaselayerConfig): TurboConfig {
  const turboConfig: TurboConfig = {
    $schema: 'https://turbo.build/schema.json',
    ui: 'tui',
    pipeline: {},
    globalDependencies: [
      'tsconfig*.json',
      'vitest.config.*',
      'vite.config.*',
      '.env',
      '.env.local',
    ],
    globalEnv: [
      'NODE_ENV',
      'CI',
      'VERCEL',
      'VERCEL_ENV',
      'TURBO_REMOTE_ONLY',
      'TURBO_RUN_SUMMARY',
    ],
  };

  // Build pipeline - most packages need to build
  turboConfig.pipeline.build = {
    dependsOn: ['^build'],
    inputs: [
      'src/**',
      'tsconfig*.json',
      'package.json',
      'vite.config.*',
      'rollup.config.*',
      'tsup.config.*',
    ],
    outputs: ['dist/**', 'build/**', '.next/**'],
    outputMode: 'errors-only',
  };

  // Type checking
  if (config?.features?.typescript !== false) {
    turboConfig.pipeline['type-check'] = {
      dependsOn: ['^type-check'],
      inputs: ['src/**', 'tsconfig*.json'],
      outputs: [],
      cache: true,
    };
  }

  // Testing
  if (config?.features?.testing) {
    turboConfig.pipeline.test = {
      dependsOn: ['^build'],
      inputs: [
        'src/**',
        'test/**',
        '__tests__/**',
        '**/*.test.*',
        '**/*.spec.*',
        'vitest.config.*',
        'jest.config.*',
      ],
      outputs: ['coverage/**'],
      env: ['NODE_ENV'],
    };

    turboConfig.pipeline['test:run'] = {
      dependsOn: ['^build'],
      inputs: [
        'src/**',
        'test/**',
        '__tests__/**',
        '**/*.test.*',
        '**/*.spec.*',
        'vitest.config.*',
        'jest.config.*',
      ],
      outputs: ['coverage/**'],
      cache: false, // Always run tests in CI
    };
  }

  // Linting
  turboConfig.pipeline.lint = {
    inputs: [
      'src/**',
      '*.{js,jsx,ts,tsx,mjs,cjs}',
      'biome.json*',
      '.biomejs.json*',
      'eslint.config.*',
      '.eslintrc*',
    ],
    outputs: [],
    cache: true,
  };

  // Formatting
  turboConfig.pipeline.format = {
    inputs: [
      'src/**',
      '*.{js,jsx,ts,tsx,mjs,cjs,json,md,mdx,css,scss,yml,yaml}',
      'biome.json*',
      '.biomejs.json*',
      '.prettierrc*',
      'prettier.config.*',
    ],
    outputs: [],
    cache: true,
  };

  turboConfig.pipeline['format:check'] = {
    inputs: [
      'src/**',
      '*.{js,jsx,ts,tsx,mjs,cjs,json,md,mdx,css,scss,yml,yaml}',
      'biome.json*',
      '.biomejs.json*',
      '.prettierrc*',
      'prettier.config.*',
    ],
    outputs: [],
    cache: true,
  };

  // Development server
  turboConfig.pipeline.dev = {
    cache: false,
    persistent: true,
    env: ['NODE_ENV', 'PORT', 'HOST'],
  };

  turboConfig.pipeline.start = {
    dependsOn: ['^build'],
    cache: false,
    persistent: true,
    env: ['NODE_ENV', 'PORT', 'HOST'],
  };

  // Clean
  turboConfig.pipeline.clean = {
    cache: false,
    outputs: [],
  };

  // Package-specific tasks for libraries
  turboConfig.pipeline.prepublishOnly = {
    dependsOn: ['build', 'test', 'lint'],
    outputs: [],
    cache: false,
  };

  // Next.js specific tasks
  if (config?.project?.framework === 'next') {
    turboConfig.pipeline['build:next'] = {
      dependsOn: ['^build'],
      inputs: [
        'src/**',
        'app/**',
        'pages/**',
        'public/**',
        'next.config.*',
        'tailwind.config.*',
        'postcss.config.*',
      ],
      outputs: ['.next/**', '!.next/cache/**'],
      env: [
        'NODE_ENV',
        'NEXT_PUBLIC_*',
        'VERCEL_URL',
        'DATABASE_URL',
        'AUTH_SECRET',
      ],
    };
  }

  return turboConfig;
}

/**
 * Generate Turborepo configuration optimized for different project types
 */
export function generateProjectTurboConfig(
  config?: BaselayerConfig
): TurboConfig {
  const turboConfig = generateTurboConfig(config);

  // Library-specific optimizations
  if (config?.project?.type === 'library') {
    // Libraries typically don't need dev servers
    delete turboConfig.pipeline.dev;
    delete turboConfig.pipeline.start;

    // Add library-specific tasks
    turboConfig.pipeline['build:declarations'] = {
      dependsOn: ['^build'],
      inputs: ['src/**', 'tsconfig*.json'],
      outputs: ['dist/**/*.d.ts', 'dist/**/*.d.ts.map'],
    };
  }

  // Application-specific optimizations
  if (config?.project?.type === 'application') {
    // Apps might not publish
    delete turboConfig.pipeline.prepublishOnly;

    // Add deployment tasks
    turboConfig.pipeline.deploy = {
      dependsOn: ['build', 'test', 'lint'],
      cache: false,
      env: ['VERCEL_TOKEN', 'DEPLOY_URL', 'NODE_ENV'],
    };
  }

  return turboConfig;
}

/**
 * Write turbo.json configuration file
 */
export async function generateTurboConfigFile(
  config?: BaselayerConfig
): Promise<Result<void, Error>> {
  try {
    // Only generate turbo.json for monorepos
    if (config?.project?.type !== 'monorepo') {
      return success(undefined);
    }

    const turboConfig = generateProjectTurboConfig(config);

    const result = await writeJSON('turbo.json', turboConfig);
    if (isFailure(result)) {
      return failure(result.error);
    }

    return success(undefined);
  } catch (error) {
    return failure(error as Error);
  }
}
