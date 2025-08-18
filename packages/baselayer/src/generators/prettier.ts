import { failure, isFailure, type Result, success } from '@outfitter/contracts';
import type { BaselayerConfig } from '../schemas/baselayer-config.js';
import { writeFile, writeJSON } from '../utils/file-system.js';

/**

- Generate .prettierrc.json configuration with smart file handling
 */
export function generatePrettierConfigObject(
  config?: BaselayerConfig
): Record<string, unknown> {
  const base = {
    semi: true,
    singleQuote: true,
    tabWidth: 2,
    trailingComma: 'es5' as const,
    printWidth: 80,
    endOfLine: 'lf' as const,
    arrowParens: 'always' as const,
    proseWrap: 'preserve' as const,
  };

  const overrides: Array<{
    files: string | string[];
    options: Record<string, unknown>;
  }> = [];

  // Always handle JSON (even if not explicitly enabled, it's common)
  overrides.push({
    files: ['*.json', '*.jsonc'],
    options: {
      singleQuote: false,
      trailingComma: 'none',
    },
  });

  // Handle markdown if enabled or no stylelint (default responsibility)
  if (
    config?.features?.markdown !== false ||
    config?.features?.styles === false
  ) {
    overrides.push({
      files: ['*.md', '*.mdx'],
      options: {
        proseWrap: 'preserve',
        printWidth: 100, // Wider for markdown
      },
    });
  }

  // Handle CSS files if stylelint is disabled (Prettier takes over)
  if (config?.features?.styles === false) {
    overrides.push({
      files: ['*.css', '*.scss', '*.less'],
      options: {
        singleQuote: false,
      },
    });
  }

  // Handle YAML files
  overrides.push({
    files: ['*.yml', '*.yaml'],
    options: {
      singleQuote: false,
    },
  });

  const result = {
    ...base,
    overrides,
  };

  // Apply user overrides
  if (config?.overrides?.prettier) {
    Object.assign(result, config.overrides.prettier);
  }

  return result;
}

/**

- Generate .prettierignore content with smart exclusions
 */
export function generatePrettierIgnore(config?: BaselayerConfig): string {
  const ignore = [
    '# Dependencies',
    'node_modules/',
    'bun.lockb',
    'package-lock.json',
    'yarn.lock',
    'pnpm-lock.yaml',
    '',
    '# Build outputs',
    'dist/',
    'build/',
    '.next/',
    'out/',
  ];

  // Add monorepo-specific ignores
  if (config?.project?.type === 'monorepo') {
    ignore.push('packages/**/dist/', 'packages/**/build/');
  }

  ignore.push(
    '',
    '# Test coverage',
    'coverage/',
    '',
    '# Biome handles these (TypeScript enabled by default)',
    '*.js',
    '*.jsx',
    '*.ts',
    '*.tsx',
    '*.mjs',
    '*.cjs'
  );

  // If TypeScript is disabled, don't ignore JS files
  if (config?.features?.typescript === false) {
    const jsIndex = ignore.indexOf('*.js');
    if (jsIndex > 0) {
      // Remove JS-related ignores
      ignore.splice(jsIndex - 1, 6); // Remove comment and JS extensions
    }
  }

  ignore.push(
    '',
    '# Generated files',
    '*.min.js',
    '*.min.css',
    '',
    '# IDE',
    '.vscode/',
    '.idea/'
  );

  // Add custom ignore patterns
  if (config?.ignore) {
    ignore.push('', '# Custom ignores', ...config.ignore);
  }

  return ignore.join('\n');
}

/**

- Write Prettier configuration files
 */
export async function generatePrettierConfig(
  config?: BaselayerConfig
): Promise<Result<void, Error>> {
  try {
    const configObject = generatePrettierConfigObject(config);
    const ignoreContent = generatePrettierIgnore(config);

    // Write .prettierrc.json
    const configResult = await writeJSON('.prettierrc.json', configObject);
    if (isFailure(configResult)) {
      return failure(new Error(configResult.error.message));
    }

    // Write .prettierignore
    const ignoreResult = await writeFile('.prettierignore', ignoreContent);
    if (isFailure(ignoreResult)) {
      return failure(new Error(ignoreResult.error.message));
    }

    return success(undefined);
  } catch (error) {
    return failure(error as Error);
  }
}
