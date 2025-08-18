import { failure, isFailure, type Result, success } from '@outfitter/contracts';
import type { BaselayerConfig } from '../schemas/baselayer-config.js';
import { writeFile } from '../utils/file-system.js';

/**

- Generate .editorconfig content based on configuration
 */
export function generateEditorconfigContent(config?: BaselayerConfig): string {
  const sections = [
    '# EditorConfig is awesome: https://EditorConfig.org',
    '',
    '# top-most EditorConfig file',
    'root = true',
    '',
    '# Unix-style newlines with a newline ending every file',
    '[*]',
    'indent_style = space',
    'indent_size = 2',
    'end_of_line = lf',
    'charset = utf-8',
    'trim_trailing_whitespace = true',
    'insert_final_newline = true',
    'max_line_length = 80',
    '',
  ];

  // Markdown files (enabled by default)
  if (config?.features?.markdown !== false) {
    sections.push(
      '# Markdown files',
      '[*.{md,mdx}]',
      'trim_trailing_whitespace = false',
      'max_line_length = 100',
      ''
    );
  }

  // TypeScript/JavaScript (enabled by default)
  if (config?.features?.typescript !== false) {
    sections.push(
      '# TypeScript/JavaScript',
      '[*.{ts,tsx,js,jsx,mjs,cjs}]',
      'indent_size = 2',
      'max_line_length = 100',
      ''
    );
  }

  // JSON files (enabled by default)
  if (config?.features?.json !== false) {
    sections.push('# JSON files', '[*.{json,jsonc}]', 'indent_size = 2', '');
  }

  // CSS/SCSS files
  if (config?.features?.styles === true) {
    sections.push(
      '# CSS/SCSS files',
      '[*.{css,scss,sass,less}]',
      'indent_size = 2',
      'max_line_length = 120',
      ''
    );
  }

  // YAML files
  sections.push('# YAML files', '[*.{yml,yaml}]', 'indent_size = 2', '');

  // Package files
  sections.push('# Package files', '[package.json]', 'indent_size = 2', '');

  // Testing files
  if (config?.features?.testing === true) {
    sections.push(
      '# Test configuration',
      '[{vitest,jest}.config.{js,ts,mjs,mts}]',
      'indent_size = 2',
      ''
    );
  }

  // Framework-specific files
  if (config?.project?.framework === 'next') {
    sections.push(
      '# Next.js files',
      '[next.config.{js,mjs,ts}]',
      'indent_size = 2',
      '',
      '# Next.js app directory',
      '[{app,pages}/**/*.{ts,tsx,js,jsx}]',
      'indent_size = 2',
      ''
    );
  }

  // Monorepo-specific configurations
  if (config?.project?.type === 'monorepo') {
    sections.push(
      '# Monorepo configuration',
      '[{turbo,lerna,nx}.json]',
      'indent_size = 2',
      '',
      '# Workspace configuration',
      '[pnpm-workspace.yaml]',
      'indent_size = 2',
      ''
    );
  }

  // Common build and config files
  sections.push(
    '# Build configuration',
    '[*.config.{js,ts,mjs,mts}]',
    'indent_size = 2',
    '',
    '# Makefiles',
    '[Makefile]',
    'indent_style = tab',
    '',
    '# Shell scripts',
    '[*.sh]',
    'end_of_line = lf',
    '',
    '# Windows scripts',
    '[*.{cmd,bat,ps1}]',
    'end_of_line = crlf',
    '',
    '# Git files',
    '[.git*]',
    'indent_size = 2',
    '',
    '# Docker files',
    '[{Dockerfile,docker-compose.yml}]',
    'indent_size = 2'
  );

  return `${sections.join('\n')}\n`;
}

/**

- Write .editorconfig file based on configuration
 */
export async function generateEditorconfigConfig(
  config?: BaselayerConfig
): Promise<Result<void, Error>> {
  try {
    const content = generateEditorconfigContent(config);

    const writeResult = await writeFile('.editorconfig', content);
    if (isFailure(writeResult)) {
      return failure(new Error(writeResult.error.message));
    }

    return success(undefined);
  } catch (error) {
    return failure(error as Error);
  }
}
