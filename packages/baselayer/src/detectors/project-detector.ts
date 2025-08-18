/**

- Project type detection utilities
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { failure, makeError, type Result, success } from '@outfitter/contracts';

export interface ProjectInfo {
  type: 'monorepo' | 'library' | 'application' | 'unknown';
  packageManager: 'npm' | 'yarn' | 'pnpm' | 'bun' | 'unknown';
  hasTypeScript: boolean;
  framework?: 'react' | 'vue' | 'svelte' | 'next' | 'astro' | 'unknown';
}

/**

- Detect project characteristics from package.json and other indicators
 */
export async function detectProjectInfo(
  cwd = process.cwd()
): Promise<Result<ProjectInfo, Error>> {
  try {
    const packageJsonPath = join(cwd, 'package.json');
    if (!existsSync(packageJsonPath)) {
      return success({
        type: 'unknown',
        packageManager: 'unknown',
        hasTypeScript: false,
      });
    }

    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));

    // Detect package manager
    let packageManager: ProjectInfo['packageManager'] = 'unknown';
    if (existsSync(join(cwd, 'pnpm-lock.yaml'))) {
      packageManager = 'pnpm';
    } else if (existsSync(join(cwd, 'yarn.lock'))) {
      packageManager = 'yarn';
    } else if (existsSync(join(cwd, 'bun.lockb'))) {
      packageManager = 'bun';
    } else if (existsSync(join(cwd, 'package-lock.json'))) {
      packageManager = 'npm';
    }

    // Detect project type
    let type: ProjectInfo['type'] = 'unknown';
    if (packageJson.workspaces) {
      type = 'monorepo';
    } else if (packageJson.main || packageJson.exports || packageJson.bin) {
      type = 'library';
    } else {
      type = 'application';
    }

    // Detect TypeScript
    const hasTypeScript = Boolean(
      packageJson.devDependencies?.typescript ||
        packageJson.dependencies?.typescript ||
        existsSync(join(cwd, 'tsconfig.json'))
    );

    // Detect framework
    let framework: ProjectInfo['framework'];
    const deps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    };
    if (deps.react || deps['@types/react']) {
      if (deps.next) {
        framework = 'next';
      } else {
        framework = 'react';
      }
    } else if (deps.vue) {
      framework = 'vue';
    } else if (deps.svelte) {
      framework = 'svelte';
    } else if (deps.astro) {
      framework = 'astro';
    }

    const result = {
      type,
      packageManager,
      hasTypeScript,
    } as ProjectInfo;

    // Only set framework if it's detected (exactOptionalPropertyTypes compliance)
    if (framework) {
      result.framework = framework;
    }

    return success(result);
  } catch (error) {
    return failure(
      makeError(
        'PROJECT_DETECTION_FAILED',
        `Failed to detect project info: ${(error as Error).message}`
      )
    );
  }
}
