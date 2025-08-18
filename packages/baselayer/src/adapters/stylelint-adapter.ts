import type { FormatOptions, LintOptions, ToolResult } from '../types.js';
import { BaseAdapter } from './base-adapter.js';

/**

- Stylelint adapter for CSS/SCSS linting and formatting
- Based on bun-monorepo template configuration
 */
export class StylelintAdapter extends BaseAdapter {
  readonly name = 'stylelint';
  readonly extensions = ['.css', '.scss', '.sass', '.less'] as const;

  /**

- Format CSS files using Stylelint
   */
  async format(
    files: readonly string[],
    options: FormatOptions = {}
  ): Promise<ToolResult> {
    const filteredFiles = this.filterFiles(files);

    if (filteredFiles.length === 0) {
      return {
        success: true,
        output: 'No CSS files to format',
        errors: [],
        exitCode: 0,
        filesProcessed: 0,
        tool: this.name,
      };
    }

    const args = ['stylelint'];

    if (!options.dryRun) {
      args.push('--fix');
    }

    // Use glob pattern to match template behavior
    args.push('"**/*.css"');

    const result = await this.executeCommand('bunx', args);

    // Stylelint may exit with code 2 for unfixable issues, treat as partial success
    const success = result.exitCode === 0 || result.exitCode === 2;

    return {
      ...result,
      success,
      filesProcessed: filteredFiles.length,
    };
  }

  /**

- Lint CSS files using Stylelint
   */
  async lint(
    files: readonly string[],
    options: LintOptions = {}
  ): Promise<ToolResult> {
    const filteredFiles = this.filterFiles(files);

    if (filteredFiles.length === 0) {
      return {
        success: true,
        output: 'No CSS files to lint',
        errors: [],
        exitCode: 0,
        filesProcessed: 0,
        tool: this.name,
      };
    }

    const args = ['stylelint'];

    if (options.fix) {
      args.push('--fix');
    }

    // Use glob pattern to match template behavior
    args.push('"**/*.css"');

    const result = await this.executeCommand('bunx', args);

    // Handle case where no CSS files exist (template behavior)
    if (
      result.output.includes('No files') ||
      result.errors.some((err) => err.includes('No files'))
    ) {
      return {
        success: true,
        output: 'No CSS files found',
        errors: [],
        exitCode: 0,
        filesProcessed: 0,
        tool: this.name,
      };
    }

    return {
      ...result,
      filesProcessed: filteredFiles.length,
    };
  }
}
