import { failure, isFailure, type Result, success } from '@outfitter/contracts';
import type { BaselayerConfig } from '../schemas/baselayer-config.js';
import { writeJSON } from '../utils/file-system.js';

/**

- Syncpack configuration for dependency synchronization
 */
export interface SyncpackConfig {
  versionGroups?: Array<{
    label: string;
    packages: string[];
    dependencies: string[];
    dependencyTypes?: Array<'dev' | 'peer' | 'prod'>;
    pinVersion?: string;
  }>;
  semverGroups?: Array<{
    label: string;
    packages: string[];
    dependencies: string[];
    dependencyTypes?: Array<'dev' | 'peer' | 'prod'>;
    range?: '' | '^' | '~' | '>=';
  }>;
  filter?: string;
  indent?: string;
  source?: string[];
  sortAz?: string[];
  sortFirst?: string[];
  specifierTypes?: string[];
}

/**

- Default syncpack configuration for Outfitter projects
 */
const DEFAULT_SYNCPACK_CONFIG: SyncpackConfig = {
  versionGroups: [
    {
      label: 'Use workspace protocol for internal packages',
      packages: ['**'],
      dependencies: ['@outfitter/**'],
      dependencyTypes: ['dev', 'peer', 'prod'],
      pinVersion: 'workspace:*',
    },
  ],
  semverGroups: [
    {
      label: 'Keep TypeScript versions in sync',
      packages: ['**'],
      dependencies: ['typescript'],
      dependencyTypes: ['dev'],
      range: '',
    },
    {
      label: 'Keep @types/node versions in sync',
      packages: ['**'],
      dependencies: ['@types/node'],
      dependencyTypes: ['dev'],
      range: '',
    },
    {
      label: 'Keep @types/bun versions in sync',
      packages: ['**'],
      dependencies: ['@types/bun'],
      dependencyTypes: ['dev'],
      range: '',
    },
    {
      label: 'Keep vitest versions in sync',
      packages: ['**'],
      dependencies: ['vitest'],
      dependencyTypes: ['dev'],
      range: '',
    },
    {
      label: 'Keep tsup versions in sync',
      packages: ['**'],
      dependencies: ['tsup'],
      dependencyTypes: ['dev'],
      range: '^',
    },
    {
      label: 'Keep @biomejs/biome versions in sync',
      packages: ['**'],
      dependencies: ['@biomejs/biome'],
      dependencyTypes: ['dev'],
      range: '^',
    },
    {
      label: 'Keep prettier versions in sync',
      packages: ['**'],
      dependencies: ['prettier'],
      dependencyTypes: ['dev'],
      range: '^',
    },
    {
      label: 'Keep markdownlint-cli2 versions in sync',
      packages: ['**'],
      dependencies: ['markdownlint-cli2'],
      dependencyTypes: ['dev'],
      range: '^',
    },
    {
      label: 'Keep lefthook versions in sync',
      packages: ['**'],
      dependencies: ['lefthook'],
      dependencyTypes: ['dev'],
      range: '^',
    },
    {
      label: 'Keep ultracite versions in sync',
      packages: ['**'],
      dependencies: ['ultracite'],
      dependencyTypes: ['dev'],
      range: '^',
    },
    {
      label: 'Keep ESLint versions in sync',
      packages: ['**'],
      dependencies: ['eslint', 'eslint-*', '@eslint/*'],
      dependencyTypes: ['dev'],
      range: '^',
    },
    {
      label: 'Keep changesets versions in sync',
      packages: ['**'],
      dependencies: ['@changesets/*'],
      dependencyTypes: ['dev'],
      range: '^',
    },
  ],
  sortAz: [
    'contributors',
    'dependencies',
    'devDependencies',
    'keywords',
    'peerDependencies',
    'resolutions',
    'scripts',
  ],
  sortFirst: [
    'name',
    'version',
    'description',
    'type',
    'private',
    'engines',
    'packageManager',
    'workspaces',
    'main',
    'module',
    'types',
    'exports',
    'files',
    'sideEffects',
    'scripts',
    'dependencies',
    'devDependencies',
    'peerDependencies',
    'keywords',
    'author',
    'license',
    'repository',
    'bugs',
    'homepage',
    'publishConfig',
  ],
};

/**

- Generate syncpack configuration object based on project configuration
 */
export function generateSyncpackConfigObject(
  config?: BaselayerConfig,
  options?: {
    monorepo?: boolean;
    internalPackageScope?: string;
    additionalSemverGroups?: SyncpackConfig['semverGroups'];
  }
): SyncpackConfig {
  const syncpackConfig: SyncpackConfig = {
    ...DEFAULT_SYNCPACK_CONFIG,
  };

  // If it's a monorepo with internal packages
  if (options?.monorepo && options?.internalPackageScope) {
    syncpackConfig.versionGroups = [
      {
        label: `Use workspace protocol for internal packages`,
        packages: ['**'],
        dependencies: [`${options.internalPackageScope}/**`],
        dependencyTypes: ['dev', 'peer', 'prod'],
        pinVersion: 'workspace:*',
      },
    ];
  } else if (!options?.monorepo) {
    // For single packages, we don't need workspace protocol
    syncpackConfig.versionGroups = [];
  }

  // Add additional semver groups if provided
  if (options?.additionalSemverGroups) {
    syncpackConfig.semverGroups = [
      ...(syncpackConfig.semverGroups || []),
      ...options.additionalSemverGroups,
    ];
  }

  // Filter out tools that aren't being used
  if (config?.features) {
    syncpackConfig.semverGroups = syncpackConfig.semverGroups?.filter(
      (group) => {
        // Keep TypeScript groups always
        if (
          group.dependencies.some(
            (dep) => dep.includes('typescript') || dep.includes('@types')
          )
        ) {
          return true;
        }

        // Filter based on enabled features
        if (group.dependencies.some((dep) => dep.includes('biome'))) {
          return config.features?.linting !== false;
        }
        if (group.dependencies.some((dep) => dep.includes('prettier'))) {
          return config.features?.formatting !== false;
        }
        if (group.dependencies.some((dep) => dep.includes('markdownlint'))) {
          return config.features?.markdown !== false;
        }
        if (group.dependencies.some((dep) => dep.includes('vitest'))) {
          return config.features?.testing !== false;
        }
        if (group.dependencies.some((dep) => dep.includes('lefthook'))) {
          return config.features?.gitHooks !== false;
        }

        // Keep by default
        return true;
      }
    );
  }

  return syncpackConfig;
}

/**

- Generate and write .syncpackrc.json configuration file
 */
export async function generateSyncpackConfig(
  projectPath: string,
  config?: BaselayerConfig,
  options?: {
    monorepo?: boolean;
    internalPackageScope?: string;
    additionalSemverGroups?: SyncpackConfig['semverGroups'];
  }
): Promise<Result<string, Error>> {
  const syncpackConfig = generateSyncpackConfigObject(config, options);

  const result = await writeJSON(
    projectPath,
    '.syncpackrc.json',
    syncpackConfig,
    { overwrite: true }
  );

  if (isFailure(result)) {
    return failure(result.error);
  }

  return success('.syncpackrc.json');
}

/**

- Install syncpack configuration with package.json scripts
 */
export async function installSyncpackConfig(
  projectPath: string,
  config?: BaselayerConfig,
  options?: {
    monorepo?: boolean;
    internalPackageScope?: string;
    additionalSemverGroups?: SyncpackConfig['semverGroups'];
    addScripts?: boolean;
  }
): Promise<Result<string[], Error>> {
  const results: string[] = [];

  // Generate .syncpackrc.json
  const configResult = await generateSyncpackConfig(
    projectPath,
    config,
    options
  );
  if (isFailure(configResult)) {
    return failure(configResult.error);
  }
  results.push(configResult.value);

  // Add scripts to package.json if requested
  if (options?.addScripts) {
    const scriptsToAdd = {
      'deps:check': 'syncpack list-mismatches',
      'deps:fix': 'syncpack fix-mismatches',
      'deps:update': 'syncpack update',
    };

    // This would integrate with the existing package-scripts.ts functionality
    // For now, we'll just return the config file result
    // biome-ignore lint/suspicious/noConsole: User feedback for manual script addition
    console.log('Note: Add these scripts to your package.json:', scriptsToAdd);
  }

  return success(results);
}
