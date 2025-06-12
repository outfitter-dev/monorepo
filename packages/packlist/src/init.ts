import { execa } from 'execa';
import * as fs from 'fs/promises';
import * as path from 'path';
import pc from 'picocolors';

interface InitOptions {
  force?: boolean;
  eslint?: boolean;
  typescript?: boolean;
  utils?: boolean;
}

interface PackageJson {
  scripts?: Record<string, string>;
  [key: string]: unknown;
}

/**
 * Initializes Outfitter Packlist in the current Node.js project.
 *
 * Sets up recommended ESLint and TypeScript configurations, installs required dependencies, and adds useful scripts to `package.json` based on the provided options. Exits the process if `package.json` is not found in the project root.
 *
 * @param options - Configuration options to control which features and dependencies are set up.
 *
 * @remark
 * This function modifies `package.json` and may create or overwrite `.eslintrc.js` and `tsconfig.json` files in the project root.
 */
export async function init(options: InitOptions = {}): Promise<void> {
  console.log(pc.cyan('🎒 Initializing Outfitter Packlist...'));

  const cwd = process.cwd();
  const packageJsonPath = path.join(cwd, 'package.json');

  // Check if package.json exists
  try {
    await fs.access(packageJsonPath);
  } catch {
    console.error(
      pc.red(
        '❌ No package.json found. Please run this command in your project root.'
      )
    );
    process.exit(1);
  }

  // Read package.json
  const packageJson = JSON.parse(
    await fs.readFile(packageJsonPath, 'utf8')
  ) as PackageJson;

  // Detect package manager
  const packageManager = await detectPackageManager();
  console.log(pc.gray(`📦 Using ${packageManager}`));

  // Dependencies to install
  const dependencies: Array<string> = [];
  const devDependencies: Array<string> = [];

  // Add configurations based on options
  if (options.eslint !== false) {
    devDependencies.push('@outfitter/eslint-config');
    await createEslintConfig(cwd, options.force);
  }

  if (options.typescript !== false) {
    devDependencies.push('@outfitter/typescript-config');
    await createTsConfig(cwd, options.force);
  }

  if (options.utils !== false) {
    dependencies.push('@outfitter/contracts');
  }

  // Install dependencies
  if (dependencies.length > 0 || devDependencies.length > 0) {
    console.log(pc.cyan('📦 Installing dependencies...'));

    if (dependencies.length > 0) {
      await installDependencies(packageManager, dependencies, false);
    }

    if (devDependencies.length > 0) {
      await installDependencies(packageManager, devDependencies, true);
    }
  }

  // Add scripts if they don't exist
  packageJson.scripts ??= {};

  const scripts = {
    lint: 'eslint . --max-warnings 0',
    format: 'prettier --check .',
    'format:fix': 'prettier --write .',
    'type-check': 'tsc --noEmit',
  };

  for (const [name, command] of Object.entries(scripts)) {
    packageJson.scripts[name] ??= command;
  }

  // Write updated package.json
  await fs.writeFile(
    packageJsonPath,
    JSON.stringify(packageJson, null, 2) + '\\n'
  );

  console.log(pc.green('\\n✅ Packlist initialized successfully!'));
  console.log(pc.gray('\\nRun the following commands to get started:'));
  console.log(pc.white('  npm run lint        # Check code style'));
  console.log(pc.white('  npm run format      # Check formatting'));
  console.log(pc.white('  npm run type-check  # Check TypeScript'));
}

/**
 * Detects the package manager used in the current project by checking for lock files.
 *
 * @returns The name of the detected package manager: 'pnpm', 'yarn', 'bun', or 'npm' if none are found.
 */
async function detectPackageManager(): Promise<string> {
  try {
    await fs.access('pnpm-lock.yaml');
    return 'pnpm';
  } catch {
    // File doesn't exist, continue to next package manager check
  }

  try {
    await fs.access('yarn.lock');
    return 'yarn';
  } catch {
    // File doesn't exist, continue to next package manager check
  }

  try {
    await fs.access('bun.lockb');
    return 'bun';
  } catch {
    // File doesn't exist, fallback to npm
  }

  return 'npm';
}

async function installDependencies(
  packageManager: string,
  deps: Array<string>,
  dev: boolean
) {
  const args = dev ? ['add', '-D'] : ['add'];

  if (packageManager === 'npm') {
    args[0] = 'install';
    if (dev) args[1] = '--save-dev';
  }

  await execa(packageManager, [...args, ...deps], {
    stdout: 'inherit',
    stderr: 'inherit',
  });
}

/**
 * Creates a default ESLint configuration file in the specified project directory.
 *
 * If `.eslintrc.js` already exists and `force` is not set, the function logs a warning and does not overwrite the file.
 *
 * @param projectRoot - The root directory where the ESLint config should be created.
 * @param force - If true, overwrites any existing `.eslintrc.js` file.
 */
async function createEslintConfig(projectRoot: string, force?: boolean) {
  const eslintConfigPath = path.join(projectRoot, '.eslintrc.js');

  if (!force) {
    try {
      await fs.access(eslintConfigPath);
      console.log(
        pc.yellow('⚠️  .eslintrc.js already exists. Use --force to overwrite.')
      );
      return;
    } catch {
      // File doesn't exist, continue with creation
    }
  }

  const content = `module.exports = {
  extends: ['@outfitter/eslint-config'],
  parserOptions: {
    project: './tsconfig.json',
  },
};
`;

  await fs.writeFile(eslintConfigPath, content);
  console.log(pc.green('✓ Created .eslintrc.js'));
}

/**
 * Creates a default `tsconfig.json` in the specified project directory if it does not already exist.
 *
 * If the file exists and `force` is not set, the function logs a warning and does not overwrite the file.
 *
 * @param projectRoot - The root directory where `tsconfig.json` should be created.
 * @param force - If true, overwrites any existing `tsconfig.json`.
 */
async function createTsConfig(projectRoot: string, force?: boolean) {
  const tsconfigPath = path.join(projectRoot, 'tsconfig.json');

  if (!force) {
    try {
      await fs.access(tsconfigPath);
      console.log(
        pc.yellow('⚠️  tsconfig.json already exists. Use --force to overwrite.')
      );
      return;
    } catch {
      // File doesn't exist, continue with creation
    }
  }

  const content = `{
  "extends": "@outfitter/typescript-config/base",
  "compilerOptions": {
    "rootDir": "./src",
    "outDir": "./dist"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
`;

  await fs.writeFile(tsconfigPath, content);
  console.log(pc.green('✓ Created tsconfig.json'));
}
