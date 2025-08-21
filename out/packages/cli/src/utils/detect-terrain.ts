import fsExtra from 'fs-extra';

const { pathExists } = fsExtra;

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

interface PackageJson {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
}

export interface TerrainFeatures {
  // Frameworks
  nextjs: boolean;
  react: boolean;
  vue: boolean;
  svelte: boolean;
  angular: boolean;

  // Languages/Runtime
  typescript: boolean;
  javascript: boolean;
  node: boolean;
  python: boolean;

  // Testing
  vitest: boolean;
  jest: boolean;
  playwright: boolean;
  cypress: boolean;

  // State Management
  zustand: boolean;
  redux: boolean;
  mobx: boolean;

  // Build Tools
  vite: boolean;
  webpack: boolean;

  // Features
  monorepo: boolean;
  docker: boolean;
  githubActions: boolean;
  gitlabCi: boolean;

  // Package Manager
  pnpm: boolean;
  yarn: boolean;
  npm: boolean;
  bun: boolean;
}

/**
 * Determines whether a given npm package is listed as a dependency in the project's `package.json`.
 *
 * Checks for the presence of the specified package in the `dependencies`, `devDependencies`, or `peerDependencies` fields of `package.json` within the provided directory.
 *
 * @param packageName - The name of the npm package to check for.
 * @param cwd - The directory to search in. Defaults to the current working directory.
 * @returns `true` if the package is found in any dependency section; otherwise, `false`.
 */
async function hasPackage(
  packageName: string,
  cwd: string = process.cwd()
): Promise<boolean> {
  try {
    const packageJsonPath = join(cwd, 'package.json');
    if (await pathExists(packageJsonPath)) {
      const packageJson = JSON.parse(
        await readFile(packageJsonPath, 'utf-8')
      ) as PackageJson;
      const deps = {
        ...(packageJson.dependencies ?? {}),
        ...(packageJson.devDependencies ?? {}),
        ...(packageJson.peerDependencies ?? {}),
      };
      return packageName in deps;
    }
  } catch (error) {
    // File read errors are expected in many cases
    if (error instanceof Error && 'code' in error) {
      // Only log unexpected errors (not ENOENT)
      if (error.code !== 'ENOENT') {
        console.debug(`Warning: Error reading package.json: ${error.message}`);
      }
    }
  }
  return false;
}

/**
 * Checks if a file exists at the specified path within a given directory.
 *
 * @param filePath - Relative path to the file to check.
 * @param cwd - Directory to resolve {@link filePath} from. Defaults to the current working directory.
 * @returns `true` if the file exists, otherwise `false`.
 */
async function fileExists(
  filePath: string,
  cwd: string = process.cwd()
): Promise<boolean> {
  return pathExists(join(cwd, filePath));
}

/**
 * Detects the presence of common frameworks, languages, tools, and features in a project directory.
 *
 * Inspects the specified directory for configuration files and package dependencies to determine which development environment features are present. Returns a {@link TerrainFeatures} object with boolean flags for each detected feature.
 *
 * @param cwd - The directory to analyze. Defaults to the current working directory.
 * @returns An object indicating detected frameworks, languages, testing tools, state management libraries, build tools, project features, and package managers.
 */
export async function detectTerrain(
  cwd: string = process.cwd()
): Promise<TerrainFeatures> {
  // Run all checks in parallel for better performance
  const [
    // Framework files
    nextConfigJs,
    nextConfigMjs,
    nextConfigTs,
    // Project files
    tsconfigExists,
    packageJsonExists,
    requirementsTxt,
    pyprojectToml,
    pipfile,
    vitestConfigTs,
    jestConfigJs,
    playwrightConfigTs,
    cypressConfigJs,
    viteConfigTs,
    webpackConfigJs,
    pnpmWorkspace,
    lernaJson,
    nxJson,
    rushJson,
    dockerfile,
    dockerCompose,
    githubWorkflows,
    gitlabCi,
    pnpmLock,
    yarnLock,
    packageLock,
    bunLock,
    // Packages
    hasNext,
    hasReact,
    hasVue,
    hasSvelte,
    hasAngular,
    hasVitest,
    hasJest,
    hasPlaywright,
    hasCypress,
    hasZustand,
    hasRedux,
    hasReduxToolkit,
    hasMobx,
    hasVite,
    hasWebpack,
  ] = await Promise.all([
    // Framework files
    fileExists('next.config.js', cwd),
    fileExists('next.config.mjs', cwd),
    fileExists('next.config.ts', cwd),
    // Project files
    fileExists('tsconfig.json', cwd),
    fileExists('package.json', cwd),
    fileExists('requirements.txt', cwd),
    fileExists('pyproject.toml', cwd),
    fileExists('Pipfile', cwd),
    fileExists('vitest.config.ts', cwd),
    fileExists('jest.config.js', cwd),
    fileExists('playwright.config.ts', cwd),
    fileExists('cypress.config.js', cwd),
    fileExists('vite.config.ts', cwd),
    fileExists('webpack.config.js', cwd),
    fileExists('pnpm-workspace.yaml', cwd),
    fileExists('lerna.json', cwd),
    fileExists('nx.json', cwd),
    fileExists('rush.json', cwd),
    fileExists('Dockerfile', cwd),
    fileExists('docker-compose.yml', cwd),
    fileExists('.github/workflows', cwd),
    fileExists('.gitlab-ci.yml', cwd),
    fileExists('pnpm-lock.yaml', cwd),
    fileExists('yarn.lock', cwd),
    fileExists('package-lock.json', cwd),
    fileExists('bun.lockb', cwd),
    // Packages
    hasPackage('next', cwd),
    hasPackage('react', cwd),
    hasPackage('vue', cwd),
    hasPackage('svelte', cwd),
    hasPackage('@angular/core', cwd),
    hasPackage('vitest', cwd),
    hasPackage('jest', cwd),
    hasPackage('@playwright/test', cwd),
    hasPackage('cypress', cwd),
    hasPackage('zustand', cwd),
    hasPackage('redux', cwd),
    hasPackage('@reduxjs/toolkit', cwd),
    hasPackage('mobx', cwd),
    hasPackage('vite', cwd),
    hasPackage('webpack', cwd),
  ]);

  const terrain: TerrainFeatures = {
    // Frameworks
    nextjs: nextConfigJs || nextConfigMjs || nextConfigTs || hasNext,
    react: hasReact,
    vue: hasVue,
    svelte: hasSvelte,
    angular: hasAngular,

    // Languages/Runtime
    typescript: tsconfigExists,
    javascript: packageJsonExists,
    node: packageJsonExists,
    python: requirementsTxt || pyprojectToml || pipfile,

    // Testing
    vitest: hasVitest || vitestConfigTs,
    jest: hasJest || jestConfigJs,
    playwright: hasPlaywright || playwrightConfigTs,
    cypress: hasCypress || cypressConfigJs,

    // State Management
    zustand: hasZustand,
    redux: hasRedux || hasReduxToolkit,
    mobx: hasMobx,

    // Build Tools
    vite: hasVite || viteConfigTs,
    webpack: hasWebpack || webpackConfigJs,

    // Features
    monorepo: pnpmWorkspace || lernaJson || nxJson || rushJson,
    docker: dockerfile || dockerCompose,
    githubActions: githubWorkflows,
    gitlabCi,

    // Package Manager
    pnpm: pnpmLock,
    yarn: yarnLock,
    npm: packageLock,
    bun: bunLock,
  };

  return terrain;
}

export function getTerrainSummary(terrain: TerrainFeatures): Array<string> {
  const features: Array<string> = [];

  // Primary framework
  if (terrain.nextjs) features.push('Next.js application');
  else if (terrain.react) features.push('React application');
  else if (terrain.vue) features.push('Vue application');
  else if (terrain.svelte) features.push('Svelte application');
  else if (terrain.angular) features.push('Angular application');

  // Language
  if (terrain.typescript) features.push('TypeScript');
  if (terrain.python) features.push('Python');

  // Testing
  if (terrain.vitest) features.push('Vitest testing');
  else if (terrain.jest) features.push('Jest testing');
  if (terrain.playwright) features.push('Playwright e2e');
  else if (terrain.cypress) features.push('Cypress e2e');

  // State management
  if (terrain.zustand) features.push('Zustand state');
  else if (terrain.redux) features.push('Redux state');
  else if (terrain.mobx) features.push('MobX state');

  // Build tools
  if (terrain.vite) features.push('Vite bundler');
  else if (terrain.webpack) features.push('Webpack bundler');

  // Special features
  if (terrain.monorepo) features.push('Monorepo structure');
  if (terrain.docker) features.push('Docker container');

  return features;
}
