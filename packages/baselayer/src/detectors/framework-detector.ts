/**

- Framework-specific detection utilities
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  type AppError,
  ErrorCode,
  failure,
  makeError,
  type Result,
  success,
} from '@outfitter/contracts';

export interface FrameworkConfig {
  name: string;
  version?: string;
  configFiles: Array<string>;
  hasConfigFile: boolean;
  customSetup?: boolean;
}

/**

- Detect framework-specific configurations and requirements
 */
export async function detectFrameworkConfig(
  framework: string,
  cwd = process.cwd()
): Promise<Result<FrameworkConfig, AppError>> {
  try {
    const packageJsonPath = join(cwd, 'package.json');
    let version: string | undefined;

    if (existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
      const deps = {
        ...(packageJson.dependencies ?? {}),
        ...(packageJson.devDependencies ?? {}),
      };
      version = deps[framework];
    }

    const configFiles = getFrameworkConfigFiles(framework);
    const hasConfigFile = configFiles.some((file) =>
      existsSync(join(cwd, file))
    );

    // Check for custom setup patterns
    const customSetup = await hasCustomFrameworkSetup(framework, cwd);

    const result = {
      name: framework,
      configFiles: configFiles.filter((file) => existsSync(join(cwd, file))),
      hasConfigFile,
      customSetup,
    } as FrameworkConfig;

    // Only set version if it exists (exactOptionalPropertyTypes compliance)
    if (version) {
      result.version = version;
    }

    return success(result);
  } catch (error) {
    return failure(
      makeError(
        ErrorCode.FRAMEWORK_DETECTION_FAILED,
        `Failed to detect framework config: ${(error as Error).message}`,
        undefined,
        error instanceof Error ? error : undefined
      )
    );
  }
}

function getFrameworkConfigFiles(framework: string): Array<string> {
  const configMap: Record<string, Array<string>> = {
    next: ['next.config.js', 'next.config.mjs', 'next.config.ts'],
    react: ['.babelrc', '.babelrc.js', 'babel.config.js'],
    vue: ['vue.config.js', 'vite.config.js', 'vite.config.ts'],
    svelte: ['svelte.config.js', 'vite.config.js', 'vite.config.ts'],
    astro: ['astro.config.js', 'astro.config.mjs', 'astro.config.ts'],
    angular: ['angular.json', '.angular-cli.json', 'workspace.json'],
  };

  return configMap[framework] || [];
}

async function hasCustomFrameworkSetup(
  framework: string,
  cwd: string
): Promise<boolean> {
  // Check for common custom setup patterns
  const customPatterns: Record<string, Array<string>> = {
    next: ['src/app/layout.tsx', 'pages/_app.tsx', 'app/layout.tsx'],
    react: ['src/index.tsx', 'src/main.tsx', 'src/App.tsx'],
    vue: ['src/main.js', 'src/main.ts', 'src/App.vue'],
    svelte: ['src/main.js', 'src/main.ts', 'src/App.svelte'],
    astro: ['src/pages/index.astro', 'src/layouts/Layout.astro'],
    angular: [
      'src/app/app.component.ts',
      'src/main.ts',
      'src/app/app.module.ts',
    ],
  };

  const patterns = customPatterns[framework] || [];
  return patterns.some((pattern) => existsSync(join(cwd, pattern)));
}
