import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import type { Result } from '@outfitter/contracts';
import { ErrorCode, failure, isFailure, makeError, success } from '@outfitter/contracts';
import { parse } from 'comment-json';
import {
  generateBiomeConfig,
  generateESLintConfig,
  generateRightdownConfigContent,
  generatePrettierConfig,
  generateVSCodeSettings,
} from './generators/index.js';
import type { OutfitterConfig } from './types/index.js';
import { readConfig } from './utils/index.js';

export type { OutfitterConfig } from './types/index.js';
export { DEFAULT_CONFIG } from './types/index.js';

export interface SetupOptions {
  /** Working directory (defaults to process.cwd()) */
  cwd?: string;
  /** Path to config file (defaults to .outfitter/config.jsonc) */
  configPath?: string;
  /** Dry run - don't write files, just validate */
  dryRun?: boolean;
}

export interface SetupResult {
  /** Configuration that was used */
  config: OutfitterConfig;
  /** Files that were generated */
  generatedFiles: Array<string>;
}

/**
 * Sets up the development baselayer by reading configuration and generating tool config files and package.json scripts.
 *
 * Reads the configuration from the specified working directory, conditionally generates configuration files for supported tools (Biome, ESLint, Prettier, Rightdown, VS Code), and updates package.json scripts as needed. Supports dry run mode to simulate changes without writing files.
 *
 * @returns A result containing the used configuration and a list of generated files, or an error if setup fails.
 */
export async function setup(options: SetupOptions = {}): Promise<Result<SetupResult, Error>> {
  const { cwd = process.cwd(), dryRun = false } = options;

  // Read and validate configuration
  const configResult = await readConfig(cwd);
  if (isFailure(configResult)) {
    return configResult;
  }
  const config = configResult.data;

  // Generate all configurations
  const generatedFiles: Array<string> = [];

  // Generate Biome config if needed
  if (shouldGenerateBiomeConfig(config)) {
    const biomeConfig = generateBiomeConfig(config);
    const biomeResult = await writeConfigFile(join(cwd, 'biome.json'), biomeConfig, dryRun);
    if (isFailure(biomeResult)) {
      return failure(biomeResult.error);
    }
    generatedFiles.push('biome.json');
  }

  // Always generate ESLint bridge for gap coverage
  const eslintConfig = generateESLintConfig(config);
  const eslintResult = await writeConfigFile(
    join(cwd, 'eslint.config.js'),
    `export default ${JSON.stringify(eslintConfig, null, 2)};`,
    dryRun,
  );
  if (isFailure(eslintResult)) {
    return failure(eslintResult.error);
  }
  generatedFiles.push('eslint.config.js');

  // Generate Prettier config if needed
  if (shouldGeneratePrettierConfig(config)) {
    const prettierConfig = generatePrettierConfig(config);
    const prettierResult = await writeConfigFile(join(cwd, '.prettierrc'), prettierConfig, dryRun);
    if (isFailure(prettierResult)) {
      return failure(prettierResult.error);
    }
    generatedFiles.push('.prettierrc');
  }

  // Generate rightdown config if needed
  if (shouldGenerateRightdownConfig(config)) {
    const rightdownConfig = generateRightdownConfigContent(config);
    const rightdownResult = await writeConfigFile(
      join(cwd, '.rightdown.config.jsonc'),
      rightdownConfig,
      dryRun,
    );
    if (isFailure(rightdownResult)) {
      return failure(rightdownResult.error);
    }
    generatedFiles.push('.rightdown.config.jsonc');
  }

  // Generate VS Code settings if enabled
  if (config.baselayer.features.vscode) {
    const vscodeSettings = generateVSCodeSettings(config);
    const vscodeResult = await writeConfigFile(
      join(cwd, '.vscode', 'settings.json'),
      vscodeSettings,
      dryRun,
    );
    if (isFailure(vscodeResult)) {
      return failure(vscodeResult.error);
    }
    generatedFiles.push('.vscode/settings.json');
  }

  // Generate package.json scripts if needed
  const scriptsResult = await generatePackageScripts(config, cwd, dryRun);
  if (isFailure(scriptsResult)) {
    return failure(scriptsResult.error);
  }
  if (scriptsResult.data) {
    generatedFiles.push('package.json (scripts updated)');
  }

  return success({
    config,
    generatedFiles,
  });
}

/**
 * Determines if Biome config should be generated
 */
function shouldGenerateBiomeConfig(config: OutfitterConfig): boolean {
  const { tools } = config.baselayer;
  return tools.typescript === 'biome' || tools.javascript === 'biome' || tools.json === 'biome';
}

/**
 * Returns true if a Prettier configuration file should be generated based on the baselayer tool settings.
 *
 * @param config - The Outfitter configuration object to evaluate
 * @returns True if Prettier is selected for CSS, YAML, or Markdown tools
 */
function shouldGeneratePrettierConfig(config: OutfitterConfig): boolean {
  const { tools } = config.baselayer;
  return tools.css === 'prettier' || tools.yaml === 'prettier' || tools.markdown === 'prettier';
}

/**
 * Returns true if the configuration specifies 'rightdown' as the markdown tool.
 *
 * @returns Whether a rightdown configuration file should be generated
 */
function shouldGenerateRightdownConfig(config: OutfitterConfig): boolean {
  const { tools } = config.baselayer;
  return tools.markdown === 'rightdown';
}

/**
 * Writes a configuration file to disk
 */
async function writeConfigFile(
  filePath: string,
  content: unknown,
  dryRun: boolean,
): Promise<Result<void, Error>> {
  try {
    if (dryRun) {
      return success(undefined);
    }

    // Ensure directory exists
    const dir = dirname(filePath);
    if (!existsSync(dir)) {
      await mkdir(dir, { recursive: true });
    }

    // Write file
    const fileContent = typeof content === 'string' ? content : JSON.stringify(content, null, 2);

    await writeFile(filePath, fileContent, 'utf-8');
    return success(undefined);
  } catch (error) {
    return failure(
      makeError(
        ErrorCode.INTERNAL_ERROR,
        `Failed to write config file: ${filePath}`,
        { filePath, dryRun },
        error as Error,
      ),
    );
  }
}

/**
 * Updates or adds lint and format scripts in package.json based on the provided tool configuration.
 *
 * Modifies scripts to use Biome, ESLint, Prettier, and Rightdown commands as appropriate for the configured tools. If dry run is enabled, simulates changes without writing to disk.
 *
 * @param config - The baselayer tool configuration
 * @param cwd - The working directory containing package.json
 * @param dryRun - If true, no files are written and changes are only simulated
 * @returns A result indicating whether scripts were updated
 */
async function generatePackageScripts(
  config: OutfitterConfig,
  cwd: string,
  dryRun: boolean,
): Promise<Result<boolean, Error>> {
  const packageJsonPath = join(cwd, 'package.json');

  try {
    if (!existsSync(packageJsonPath)) {
      // No package.json to update
      return success(false);
    }

    const packageJsonContent = await readFile(packageJsonPath, 'utf-8');
    const packageJson = parse(packageJsonContent) as Record<string, any>;

    const scripts = packageJson.scripts || {};
    let updated = false;

    // Generate scripts based on tool configuration
    const { tools } = config.baselayer;

    if (tools.typescript === 'biome' || tools.javascript === 'biome') {
      if (!scripts.lint || !scripts.lint.includes('biome')) {
        const markdownLint = tools.markdown === 'rightdown' ? ' && rightdown "**/*.md"' : '';
        scripts.lint = `biome lint . && eslint . --config=./eslint.config.js --max-warnings 0${markdownLint}`;
        scripts['lint:fix'] =
          `biome lint . --write && eslint . --fix --config=./eslint.config.js${tools.markdown === 'rightdown' ? ' && rightdown --fix "**/*.md"' : ''}`;
        updated = true;
      }

      if (!scripts.format || !scripts.format.includes('biome')) {
        scripts.format =
          tools.css === 'prettier' || tools.yaml === 'prettier'
            ? 'biome format . && prettier --check .'
            : 'biome format .';
        scripts['format:fix'] =
          tools.css === 'prettier' || tools.yaml === 'prettier'
            ? 'biome format . --write && prettier --write .'
            : 'biome format . --write';
        updated = true;
      }
    } else if (tools.typescript === 'eslint' || tools.javascript === 'eslint') {
      if (!scripts.lint || !scripts.lint.includes('eslint')) {
        const markdownLint = tools.markdown === 'rightdown' ? ' && rightdown "**/*.md"' : '';
        scripts.lint = `eslint . --max-warnings 0${markdownLint}`;
        scripts['lint:fix'] =
          `eslint . --fix${tools.markdown === 'rightdown' ? ' && rightdown --fix "**/*.md"' : ''}`;
        updated = true;
      }
      if (!scripts.format || !scripts.format.includes('prettier')) {
        scripts.format = 'prettier --check .';
        scripts['format:fix'] = 'prettier --write .';
        updated = true;
      }
    }

    if (updated) {
      if (dryRun) {
        return success(true); // Report that an update would occur
      }
      packageJson.scripts = scripts;
      await writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2), 'utf-8');
    }

    return success(updated);
  } catch (error) {
    return failure(
      makeError(
        ErrorCode.INTERNAL_ERROR,
        'Failed to update package.json scripts',
        { packageJsonPath, dryRun },
        error as Error,
      ),
    );
  }
}
