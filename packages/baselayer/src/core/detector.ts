/**

- Detect existing tools and configurations
 */

import { join } from 'node:path';
import {
  ErrorCode,
  failure,
  isFailure,
  isSuccess,
  makeError,
  type Result,
  success,
} from '@outfitter/contracts';
import { fileExists, findFiles, readFile } from '../utils/file-system';

export interface DetectedConfig {
  tool: string;
  path: string;
  content: string;
}

export interface DetectedTools {
  hasConfigs: boolean;
  configs: DetectedConfig[];
  tools: Set<string>;
}

// Use the error pattern from contracts for consistency
export type DetectorError = ReturnType<typeof makeError>;

// Configuration file patterns for various tools
const TOOL_PATTERNS: Record<string, string[]> = {
  eslint: [
    '.eslintrc',
    '.eslintrc.js',
    '.eslintrc.cjs',
    '.eslintrc.mjs',
    '.eslintrc.json',
    '.eslintrc.yaml',
    '.eslintrc.yml',
    'eslint.config.js',
    'eslint.config.mjs',
    'eslint.config.cjs',
  ],
  prettier: [
    '.prettierrc',
    '.prettierrc.js',
    '.prettierrc.cjs',
    '.prettierrc.mjs',
    '.prettierrc.json',
    '.prettierrc.json5',
    '.prettierrc.yaml',
    '.prettierrc.yml',
    '.prettierrc.toml',
    'prettier.config.js',
    'prettier.config.cjs',
    'prettier.config.mjs',
  ],
  biome: ['biome.json', 'biome.jsonc'],
  oxlint: ['.oxlintrc.json', 'oxlint.json'],
  stylelint: [
    '.stylelintrc',
    '.stylelintrc.js',
    '.stylelintrc.cjs',
    '.stylelintrc.mjs',
    '.stylelintrc.json',
    '.stylelintrc.yaml',
    '.stylelintrc.yml',
    'stylelint.config.js',
    'stylelint.config.cjs',
    'stylelint.config.mjs',
  ],
  markdownlint: [
    '.markdownlint.json',
    '.markdownlint.yaml',
    '.markdownlint.yml',
    '.markdownlintrc',
    '.markdownlint-cli2.yaml',
    '.markdownlint-cli2.yml',
    '.markdownlint-cli2.jsonc',
    '.markdownlint-cli2.mjs',
    '.markdownlint-cli2.cjs',
  ],
  tslint: ['tslint.json'],
  standard: ['.standard.json'],
  xo: ['.xo-config', '.xo-config.js', '.xo-config.json'],
};

/**

- Detect all existing tool configurations
 */
export async function detectExistingTools(
  cwd: string = process.cwd()
): Promise<Result<DetectedTools, DetectorError>> {
  const configs: DetectedConfig[] = [];
  const tools = new Set<string>();

  for (const [tool, patterns] of Object.entries(TOOL_PATTERNS)) {
    for (const pattern of patterns) {
      const filePath = join(cwd, pattern);
      const existsResult = await fileExists(filePath);

      if (isSuccess(existsResult) && existsResult.data) {
        const contentResult = await readFile(filePath);
        if (isSuccess(contentResult)) {
          configs.push({
            tool,
            path: pattern,
            content: contentResult.data,
          });
          tools.add(tool);
        }
      }
    }
  }

  // Also check package.json for embedded configs
  const pkgJsonResult = await readFile(join(cwd, 'package.json'));
  if (isSuccess(pkgJsonResult)) {
    try {
      const pkg = JSON.parse(pkgJsonResult.data);

      // Check for embedded configs in package.json
      const embeddedConfigs = [
        'eslintConfig',
        'prettier',
        'stylelint',
        'xo',
        'standard',
      ];

      for (const configKey of embeddedConfigs) {
        if (pkg[configKey]) {
          const tool = configKey.replace('Config', '').toLowerCase();
          configs.push({
            tool,
            path: 'package.json',
            content: JSON.stringify(pkg[configKey], null, 2),
          });
          tools.add(tool);
        }
      }
    } catch (error) {
      return failure(
        makeError(
          ErrorCode.VALIDATION_ERROR,
          `Failed to parse package.json: ${error}`
        )
      );
    }
  }

  return success({
    hasConfigs: configs.length > 0,
    configs,
    tools,
  });
}

/**

- Detect if ESLint is configured
 */
export async function detectEslintConfig(
  cwd: string = process.cwd()
): Promise<Result<boolean, DetectorError>> {
  const toolsResult = await detectExistingTools(cwd);
  if (isFailure(toolsResult)) {
    return failure(toolsResult.error);
  }

  return success(toolsResult.data.tools.has('eslint'));
}

/**

- Detect if Prettier is configured
 */
export async function detectPrettierConfig(
  cwd: string = process.cwd()
): Promise<Result<boolean, DetectorError>> {
  const toolsResult = await detectExistingTools(cwd);
  if (isFailure(toolsResult)) {
    return failure(toolsResult.error);
  }

  return success(toolsResult.data.tools.has('prettier'));
}

/**

- Detect if project uses TypeScript
 */
export async function detectTypeScript(
  cwd: string = process.cwd()
): Promise<Result<boolean, DetectorError>> {
  const tsconfigResult = await fileExists(join(cwd, 'tsconfig.json'));
  if (isSuccess(tsconfigResult) && tsconfigResult.data) {
    return success(true);
  }

  // Check for TypeScript files
  const tsFilesResult = await findFiles('**/*.{ts,tsx}', {
    cwd,
    ignore: ['node_modules/**', 'dist/**', 'build/**'],
  });

  if (isSuccess(tsFilesResult) && tsFilesResult.data.length > 0) {
    return success(true);
  }

  return success(false);
}

/**

- Detect if project uses React
 */
export async function detectReact(
  cwd: string = process.cwd()
): Promise<Result<boolean, DetectorError>> {
  const pkgJsonResult = await readFile(join(cwd, 'package.json'));
  if (isFailure(pkgJsonResult)) {
    return success(false);
  }

  try {
    const pkg = JSON.parse(pkgJsonResult.data);
    const deps = {
      ...pkg.dependencies,
      ...pkg.devDependencies,
    };

    return success('react' in deps || 'react-dom' in deps);
  } catch (_error) {
    return success(false);
  }
}

/**

- Detect if project uses CSS/SCSS/Less
 */
export async function detectStyles(
  cwd: string = process.cwd()
): Promise<Result<boolean, DetectorError>> {
  const styleFilesResult = await findFiles('**/*.{css,scss,sass,less}', {
    cwd,
    ignore: ['node_modules/**', 'dist/**', 'build/**'],
  });

  if (
    isSuccess(styleFilesResult) &&
    (styleFilesResult.data as string[]).length > 0
  ) {
    return success(true);
  }

  return success(false);
}

/**

- Detect if project has markdown files
 */
export async function detectMarkdown(
  cwd: string = process.cwd()
): Promise<Result<boolean, DetectorError>> {
  const mdFilesResult = await findFiles('**/*.{md,mdx}', {
    cwd,
    ignore: ['node_modules/**', 'dist/**', 'build/**'],
  });

  if (isSuccess(mdFilesResult) && mdFilesResult.data.length > 0) {
    return success(true);
  }

  return success(false);
}

/**

- Detect if VS Code is used
 */
export async function detectVSCode(
  cwd: string = process.cwd()
): Promise<Result<boolean, DetectorError>> {
  const vscodeResult = await fileExists(join(cwd, '.vscode'));
  if (isSuccess(vscodeResult) && vscodeResult.data) {
    return success(true);
  }

  return success(false);
}

/**

- Detect git hooks setup
 */
export async function detectGitHooks(
  cwd: string = process.cwd()
): Promise<Result<string | null, DetectorError>> {
  // Check for husky
  const huskyResult = await fileExists(join(cwd, '.husky'));
  if (isSuccess(huskyResult) && huskyResult.data) {
    return success('husky');
  }

  // Check for lefthook
  const lefthookResult = await fileExists(join(cwd, 'lefthook.yml'));
  if (isSuccess(lefthookResult) && lefthookResult.data) {
    return success('lefthook');
  }

  // Check for simple-git-hooks
  const pkgJsonResult = await readFile(join(cwd, 'package.json'));
  if (isSuccess(pkgJsonResult)) {
    try {
      const pkg = JSON.parse(pkgJsonResult.data);
      if (pkg['simple-git-hooks']) {
        return success('simple-git-hooks');
      }
    } catch (_error) {}
  }

  return success(null);
}

/**

- Get all configurations that need to be cleaned up
 */
export async function getConfigsToCleanup(
  cwd: string = process.cwd()
): Promise<Result<string[], DetectorError>> {
  const configsToRemove: string[] = [];

  // Get all potential config files
  const allPatterns = Object.values(TOOL_PATTERNS).flat();

  for (const pattern of allPatterns) {
    const filePath = join(cwd, pattern);
    const existsResult = await fileExists(filePath);

    if (isSuccess(existsResult) && existsResult.data) {
      configsToRemove.push(pattern);
    }
  }

  return success(configsToRemove);
}
