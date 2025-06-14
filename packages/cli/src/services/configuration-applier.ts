import chalk from 'chalk';
import { execa } from 'execa';
import fsExtra from 'fs-extra';
import { join } from 'path';

const { writeFile, pathExists, writeJSON } = fsExtra;

export async function applyConfigurations(
  configs: Array<string>
): Promise<void> {
  console.log(chalk.gray('Applying configurations...'));
  const cwd = process.cwd();

  const handlers: Record<string, (cwd: string) => Promise<void>> = {
    '@outfitter/eslint-config': createEslintConfig,
    '@outfitter/typescript-config': createTsconfigJson,
    '@outfitter/prettier-config': createPrettierConfig,
    '@outfitter/husky-config': initializeHusky,
    '@outfitter/changeset-config': initializeChangesets,
  };

  for (const config of configs) {
    const handler = handlers[config];
    if (!handler) {
      console.warn(chalk.yellow(`⚠ Unknown configuration package: ${config}`));
      continue;
    }

    try {
      await handler(cwd);
    } catch (error) {
      console.error(
        chalk.red(`  ✗ Failed to apply ${config}:`),
        (error as Error).message
      );
    }
  }
}

async function createEslintConfig(cwd: string): Promise<void> {
  const configPath = join(cwd, 'eslint.config.mjs');

  if (await pathExists(configPath)) {
    console.log(chalk.gray('  ✓ ESLint config already exists'));
    return;
  }

  const config = `export { default } from '@outfitter/eslint-config';
`;

  await writeFile(configPath, config, 'utf8');
  console.log(chalk.green('  ✓ Created eslint.config.mjs'));
}

async function createTsconfigJson(cwd: string): Promise<void> {
  const configPath = join(cwd, 'tsconfig.json');

  if (await pathExists(configPath)) {
    console.log(chalk.gray('  ✓ TypeScript config already exists'));
    return;
  }

  const config = {
    extends: '@outfitter/typescript-config/base',
    compilerOptions: {
      outDir: './dist',
      rootDir: './src',
    },
    include: ['src/**/*'],
    exclude: ['node_modules', 'dist'],
  };

  await writeJSON(configPath, config, { spaces: 2 });
  console.log(chalk.green('  ✓ Created tsconfig.json'));
}

async function createPrettierConfig(cwd: string): Promise<void> {
  const configPath = join(cwd, 'prettier.config.cjs');

  if (await pathExists(configPath)) {
    console.log(chalk.gray('  ✓ Prettier config already exists'));
    return;
  }

  const config = `module.exports = require('@outfitter/prettier-config');
`;

  await writeFile(configPath, config, 'utf8');
  console.log(chalk.green('  ✓ Created prettier.config.cjs'));
}

async function initializeChangesets(cwd: string): Promise<void> {
  const changesetDir = join(cwd, '.changeset');

  if (await pathExists(changesetDir)) {
    console.log(chalk.gray('  ✓ Changesets already initialized'));
    return;
  }

  try {
    await execa('npx', ['@changesets/cli', 'init'], {
      cwd,
      stdio: 'inherit',
    });
    console.log(chalk.green('  ✓ Initialized changesets'));
  } catch (error) {
    throw new Error(
      `Failed to initialize changesets: ${(error as Error).message}`
    );
  }
}

/**
 * Initializes Husky by running the installation command to set up Git hooks.
 */
export async function initializeHusky(cwd: string): Promise<void> {
  try {
    await execa('npx', ['husky', 'init'], {
      cwd,
      stdio: 'inherit',
    });
    console.log(chalk.green('  ✓ Initialized Husky'));
  } catch (error) {
    throw new Error(`Failed to initialize Husky: ${(error as Error).message}`);
  }
}
