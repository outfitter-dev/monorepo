import { extname } from 'node:path';
import { glob } from 'glob';
import type { BaselayerConfig } from '../schemas/baselayer-config.js';

/**
 * Base file type mappings - tools handle these extensions by default
 */
export const BASE_FILE_HANDLERS = {
  typescript: ['.ts', '.tsx', '.js', '.jsx'], // Biome/Ultracite
  json: ['.json'], // Prettier
  yaml: ['.yaml', '.yml'], // Prettier
  css: ['.css', '.scss', '.sass', '.less'], // Stylelint
  markdown: ['.md', '.mdx', '.mdc'], // Markdownlint
} as const;

export type FileType = keyof typeof BASE_FILE_HANDLERS;

/**
 * Dynamic file handlers that adjust based on configuration
 * When tools are disabled, their files are handled by fallback tools
 */
export function getFileHandlers(
  config: BaselayerConfig
): Record<FileType, string[]> {
  const handlers: Record<FileType, string[]> = {
    typescript: [...BASE_FILE_HANDLERS.typescript],
    json: [...BASE_FILE_HANDLERS.json],
    yaml: [...BASE_FILE_HANDLERS.yaml],
    css: [...BASE_FILE_HANDLERS.css],
    markdown: [...BASE_FILE_HANDLERS.markdown],
  };

  // Tool boundary logic: when specific tools are disabled,
  // Prettier takes over their responsibilities

  // If stylelint is disabled, Prettier handles CSS files
  if (!config.features?.styles) {
    handlers.json = [...handlers.json, ...handlers.css];
    handlers.css = [];
  }

  // If markdownlint is disabled, Prettier handles Markdown files
  if (!config.features?.markdown) {
    handlers.json = [...handlers.json, ...handlers.markdown];
    handlers.markdown = [];
  }

  return handlers;
}

/**
 * Utility class for matching files to appropriate tools
 * Handles file discovery, filtering, and categorization with configuration awareness
 */
export class FileMatcher {
  private fileHandlers: Record<FileType, readonly string[]> =
    BASE_FILE_HANDLERS;

  /**
   * Update file handlers based on configuration
   * Must be called before categorizing files
   */
  updateHandlers(config: BaselayerConfig): void {
    this.fileHandlers = getFileHandlers(config);
  }

  /**
   * Categorize files by type for tool processing
   * Uses dynamic handlers based on current configuration
   */
  categorizeFiles(
    files: readonly string[],
    config?: BaselayerConfig
  ): Record<FileType, string[]> {
    // Update handlers if config provided
    if (config) {
      this.updateHandlers(config);
    }

    const categorized: Record<FileType, string[]> = {
      typescript: [],
      json: [],
      yaml: [],
      css: [],
      markdown: [],
    };

    for (const file of files) {
      const ext = extname(file);

      for (const [type, extensions] of Object.entries(this.fileHandlers)) {
        if (extensions.includes(ext as never)) {
          categorized[type as FileType].push(file);
          break; // First match wins - prevents double processing
        }
      }
    }

    return categorized;
  }

  /**
   * Find files matching specific patterns
   * Supports glob patterns and respects gitignore
   */
  async findFiles(
    patterns: readonly string[],
    options: {
      cwd?: string;
      ignore?: readonly string[];
      onlyStaged?: boolean;
    } = {}
  ): Promise<string[]> {
    const { cwd = process.cwd(), ignore = [], onlyStaged = false } = options;

    if (onlyStaged) {
      return this.getStagedFiles(cwd);
    }

    const defaultIgnore = [
      'node_modules/**',
      'dist/**',
      'build/**',
      '.git/**',
      'coverage/**',
      '**/*.min.js',
      '**/*.min.css',
      ...ignore,
    ];

    const allFiles: string[] = [];

    for (const pattern of patterns) {
      const files = await glob(pattern, {
        cwd,
        ignore: defaultIgnore,
        absolute: false,
        dot: false,
      });
      allFiles.push(...files);
    }

    // Remove duplicates and return
    return [...new Set(allFiles)];
  }

  /**
   * Get staged files from git
   * Used for pre-commit hooks and --staged flag
   */
  private async getStagedFiles(cwd: string): Promise<string[]> {
    try {
      const { spawn } = await import('node:child_process');
      const { promisify } = await import('node:util');
      const _execFile = promisify(spawn);

      const result = await execFileAsync(
        'git',
        ['diff', '--cached', '--name-only'],
        {
          cwd,
        }
      );

      if (result.stderr) {
        return [];
      }

      return result.stdout
        .split('\n')
        .filter(Boolean)
        .filter((file) => !file.startsWith('node_modules/'));
    } catch (_error) {
      return [];
    }
  }

  /**
   * Filter files by type
   * Useful for --only flag implementation
   */
  filterByType(files: readonly string[], types: readonly FileType[]): string[] {
    const filtered: string[] = [];

    for (const file of files) {
      const ext = extname(file);

      for (const type of types) {
        if (this.fileHandlers[type].includes(ext as never)) {
          filtered.push(file);
          break;
        }
      }
    }

    return filtered;
  }

  /**
   * Get file type for a single file
   * Uses current configuration-aware handlers
   */
  getFileType(filePath: string): FileType | null {
    const ext = extname(filePath);

    for (const [type, extensions] of Object.entries(this.fileHandlers)) {
      if (extensions.includes(ext as never)) {
        return type as FileType;
      }
    }

    return null;
  }

  /**
   * Get all supported file patterns for current configuration
   * Useful for glob patterns
   */
  getAllPatterns(): string[] {
    const extensions = Object.values(this.fileHandlers).flat();
    return [`**/*{${extensions.join(',')}}`];
  }

  /**
   * Get active handlers (for debugging/introspection)
   */
  getActiveHandlers(): Record<FileType, readonly string[]> {
    return { ...this.fileHandlers };
  }
}
