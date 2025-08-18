import type { FormatOptions, LintOptions, ToolResult } from '../types.js';
import { BaseAdapter } from './base-adapter.js';

/**

- Ultracite adapter for TypeScript/JavaScript formatting and linting
- Uses bun x ultracite@latest for consistent behavior
 */
export class UltraciteAdapter extends BaseAdapter {
  readonly name = 'ultracite';
  readonly extensions = ['.ts', '.tsx', '.js', '.jsx'] as const;

  /**

- Format TypeScript/JavaScript files using Ultracite
   */
  async format(
    files: readonly string[],
    options: FormatOptions = {}
  ): Promise<ToolResult> {
    const filteredFiles = this.filterFiles(files);

    if (filteredFiles.length === 0) {
      return {
        success: true,
        output: 'No TypeScript/JavaScript files to format',
        errors: [],
        exitCode: 0,
        filesProcessed: 0,
        tool: this.name,
      };
    }

    const args = ['x', 'ultracite@latest', 'format'];

    if (options.dryRun) {
      args.push('--check');
    }

    // Ultracite works on all files, so we don't need to pass individual files
    const result = await this.executeCommand('bun', args);

    return {
      ...result,
      filesProcessed: filteredFiles.length,
    };
  }

  /**

- Lint TypeScript/JavaScript files using Ultracite
   */
  async lint(
    files: readonly string[],
    options: LintOptions = {}
  ): Promise<ToolResult> {
    const filteredFiles = this.filterFiles(files);

    if (filteredFiles.length === 0) {
      return {
        success: true,
        output: 'No TypeScript/JavaScript files to lint',
        errors: [],
        exitCode: 0,
        filesProcessed: 0,
        tool: this.name,
      };
    }

    const args = ['x', 'ultracite@latest'];

    if (options.fix && !options.checkOnly) {
      args.push('format'); // Ultracite format fixes issues
    } else {
      args.push('lint'); // Ultracite lint checks only
    }

    const result = await this.executeCommand('bun', args);

    return {
      ...result,
      filesProcessed: filteredFiles.length,
    };
  }
}
