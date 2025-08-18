import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { failure, isFailure, makeError, success } from '@outfitter/contracts';
import type { FlintResult, OutfitterConfig } from '../types.js';
import { backupFile } from '../utils/file-system.js';

export interface MigrateOptions {
  dryRun?: boolean;
  backup?: boolean;
  verbose?: boolean;
}

interface ExistingConfigs {
  biome?: Record<string, unknown>;
  prettier?: Record<string, unknown>;
  stylelint?: Record<string, unknown>;
  markdownlint?: Record<string, unknown>;
  commitlint?: Record<string, unknown>;
  lefthook?: Record<string, unknown>;
}

/**

- Detect existing configuration files in the project
 */
async function detectExistingConfigs(): Promise<ExistingConfigs> {
  const configs: ExistingConfigs = {};

  // Check for Biome config
  const biomeFiles = ['biome.json', 'biome.jsonc', '.biome.json'];
  for (const file of biomeFiles) {
    if (existsSync(file)) {
      try {
        const content = readFileSync(file, 'utf-8');
        // Remove comments for JSONC files
        const jsonContent = content
          .replace(/\/\/.*$/gm, '')
          .replace(/\/\*[\s\S]*?\*\//g, '');
        configs.biome = JSON.parse(jsonContent);
        break;
      } catch (_error) {}
    }
  }

  // Check for Prettier config
  const prettierFiles = [
    '.prettierrc',
    '.prettierrc.json',
    '.prettierrc.js',
    'prettier.config.js',
  ];
  for (const file of prettierFiles) {
    if (existsSync(file)) {
      try {
        if (file.endsWith('.js')) {
          // For JS configs, we'll just note they exist
          configs.prettier = {
            _file: file,
            _note: 'JavaScript config detected',
          };
        } else {
          const content = readFileSync(file, 'utf-8');
          configs.prettier = JSON.parse(content);
        }
        break;
      } catch (_error) {}
    }
  }

  // Check for Stylelint config
  const stylelintFiles = [
    '.stylelintrc',
    '.stylelintrc.json',
    '.stylelintrc.js',
    'stylelint.config.js',
  ];
  for (const file of stylelintFiles) {
    if (existsSync(file)) {
      try {
        if (file.endsWith('.js')) {
          configs.stylelint = {
            _file: file,
            _note: 'JavaScript config detected',
          };
        } else {
          const content = readFileSync(file, 'utf-8');
          configs.stylelint = JSON.parse(content);
        }
        break;
      } catch (_error) {}
    }
  }

  // Check for Markdownlint config
  const markdownlintFiles = [
    '.markdownlint.json',
    '.markdownlint.yaml',
    '.markdownlint-cli2.yaml',
  ];
  for (const file of markdownlintFiles) {
    if (existsSync(file)) {
      configs.markdownlint = { _file: file };
      break;
    }
  }

  // Check for Commitlint config
  const commitlintFiles = [
    '.commitlintrc',
    '.commitlintrc.json',
    '.commitlintrc.js',
    'commitlint.config.js',
  ];
  for (const file of commitlintFiles) {
    if (existsSync(file)) {
      configs.commitlint = { _file: file };
      break;
    }
  }

  // Check for Lefthook config
  if (existsSync('lefthook.yml') || existsSync('.lefthook.yml')) {
    configs.lefthook = {
      _file: existsSync('lefthook.yml') ? 'lefthook.yml' : '.lefthook.yml',
    };
  }

  return configs;
}

/**

- Generate Outfitter config from existing configs
 */
function generateOutfitterConfig(existing: ExistingConfigs): OutfitterConfig {
  const config: OutfitterConfig = {
    features: {
      typescript: !!existing.biome,
      markdown: !!existing.markdownlint,
      styles: !!existing.stylelint,
      json: !!existing.prettier,
      commits: !!existing.commitlint || !!existing.lefthook,
      packages: false, // Opt-in for package validation
    },
  };

  // Only include overrides if there are custom configurations
  const overrides: OutfitterConfig['overrides'] = {};
  let hasOverrides = false;

  // Extract custom Biome settings
  if (existing.biome && !existing.biome._file) {
    const {
      formatter:_formatter,
      linter: _linter,
      ...customSettings
    } = existing.biome;
    if (Object.keys(customSettings).length > 0) {
      overrides.biome = customSettings;
      hasOverrides = true;
    }
  }

  // Extract custom Prettier settings
  if (
    existing.prettier &&
    !existing.prettier._file &&
    !existing.prettier._note
  ) {
    overrides.prettier = existing.prettier;
    hasOverrides = true;
  }

  // Extract custom Stylelint settings
  if (
    existing.stylelint &&
    !existing.stylelint._file &&
    !existing.stylelint._note
  ) {
    const { extends: _, ...customSettings } = existing.stylelint;
    if (Object.keys(customSettings).length > 0) {
      overrides.stylelint = customSettings;
      hasOverrides = true;
    }
  }

  if (hasOverrides) {
    config.overrides = overrides;
  }

  return config;
}

/**

- Migrate existing configuration files to unified Outfitter config
 */
export async function migrate(
  options: MigrateOptions = {}
): Promise<FlintResult<void>> {
  try {
    const { dryRun = false, backup = true, verbose = false } = options;

    // Step 1: Detect existing configs
    if (verbose) {
    }

    const existingConfigs = await detectExistingConfigs();
    const foundConfigs = Object.keys(existingConfigs).filter(
      (key) => existingConfigs[key as keyof ExistingConfigs] !== undefined
    );

    if (foundConfigs.length === 0) {
      return success(undefined);
    }
    foundConfigs.forEach((config) => {
      const configData = existingConfigs[config as keyof ExistingConfigs];
      // File reference for potential future use
      configData?._file || config;
    });

    // Step 2: Generate Outfitter config
    if (verbose) {
    }

    const outfitterConfig = generateOutfitterConfig(existingConfigs);

    // Step 3: Write Outfitter config
    const configPath = 'outfitter.config.js';

    if (existsSync(configPath) && !dryRun && backup) {
      const backupResult = await backupFile(configPath);
      if (isFailure(backupResult)) {
        return failure(
          makeError(
            'MIGRATION_FAILED',
            `Failed to backup existing config: ${backupResult.error.message}`
          )
        );
      }
    }

    const configContent = `/**
- Outfitter Configuration
- Unified code quality orchestration
-
- Migrated from existing configuration files
- Generated on ${new Date().toISOString()}
 */

/** @type {import('@outfitter/baselayer').OutfitterConfig} */
export default ${JSON.stringify(outfitterConfig, null, 2)};
`;

    if (dryRun) {
    } else {
      writeFileSync(configPath, configContent, 'utf-8');
    }

    if (existingConfigs.biome) {
    }
    if (existingConfigs.prettier) {
    }
    if (existingConfigs.stylelint) {
    }
    if (existingConfigs.markdownlint) {
    }
    if (existingConfigs.commitlint || existingConfigs.lefthook) {
    }

    return success(undefined);
  } catch (error) {
    return failure(
      makeError(
        'MIGRATION_FAILED',
        `Migration failed with unexpected error: ${(error as Error).message}`
      )
    );
  }
}

/**

- Clean up old configuration files after successful migration
 */
export async function cleanOldConfigs(
  options: { force?: boolean; verbose?: boolean } = {}
): Promise<FlintResult<void>> {
  try {
    const { force = false, verbose = false } = options;

    const filesToRemove = [
      // Biome
      'biome.json',
      'biome.jsonc',
      '.biome.json',
      // Prettier
      '.prettierrc',
      '.prettierrc.json',
      '.prettierrc.js',
      'prettier.config.js',
      '.prettierignore',
      // Stylelint
      '.stylelintrc',
      '.stylelintrc.json',
      '.stylelintrc.js',
      'stylelint.config.js',
      '.stylelintignore',
      // Markdownlint
      '.markdownlint.json',
      '.markdownlint.yaml',
      '.markdownlint-cli2.yaml',
      '.markdownlintignore',
      // Commitlint
      '.commitlintrc',
      '.commitlintrc.json',
      '.commitlintrc.js',
      'commitlint.config.js',
      // ESLint (if present)
      '.eslintrc',
      '.eslintrc.json',
      '.eslintrc.js',
      'eslint.config.js',
      '.eslintignore',
    ];

    const existingFiles = filesToRemove.filter((file) => existsSync(file));

    if (existingFiles.length === 0) {
      return success(undefined);
    }

    if (!force) {
      existingFiles.forEach((_file) => {});
      return success(undefined);
    }

    // Backup files before removal
    const backupDir = '.flint-backup/migration';
    for (const file of existingFiles) {
      const backupResult = await backupFile(file, backupDir);
      if (isFailure(backupResult)) {
      } else if (verbose) {
      }
    }

    // Remove files
    const { unlinkSync } = await import('node:fs');
    for (const file of existingFiles) {
      try {
        unlinkSync(file);
        if (verbose) {
        }
      } catch (_error) {}
    }

    return success(undefined);
  } catch (error) {
    return failure(
      makeError(
        'CLEANUP_FAILED',
        `Cleanup failed with unexpected error: ${(error as Error).message}`
      )
    );
  }
}
