import type { FormatOptions, LintOptions, ToolResult } from '../types.js';
import { BaseAdapter } from './base-adapter.js';

/**

- Markdownlint adapter for Markdown linting and formatting
- Based on bun-monorepo template configuration with markdownlint-cli2
 */
export class MarkdownlintAdapter extends BaseAdapter {
  readonly name = 'markdownlint-cli2';
  readonly extensions = ['.md', '.mdx', '.mdc'] as const;

  /**

- Format Markdown files using markdownlint-cli2
   */
  async format(
    files: readonly string[],
    options: FormatOptions = {}
  ): Promise<ToolResult> {
    const filteredFiles = this.filterFiles(files);

    if (filteredFiles.length === 0) {
      return {
        success: true,
        output: 'No Markdown files to format',
        errors: [],
        exitCode: 0,
        filesProcessed: 0,
        tool: this.name,
      };
    }

    const args = ['markdownlint-cli2'];

    if (!options.dryRun) {
      args.push('--fix');
    }

    // Use glob pattern to match template behavior
    args.push('"**/*.{md,mdx,mdc}"');

    const result = await this.executeCommand('bunx', args);

    return {
      ...result,
      filesProcessed: filteredFiles.length,
    };
  }

  /**

- Lint Markdown files using markdownlint-cli2
   */
  async lint(
    files: readonly string[],
    options: LintOptions = {}
  ): Promise<ToolResult> {
    const filteredFiles = this.filterFiles(files);

    if (filteredFiles.length === 0) {
      return {
        success: true,
        output: 'No Markdown files to lint',
        errors: [],
        exitCode: 0,
        filesProcessed: 0,
        tool: this.name,
      };
    }

    const args = ['markdownlint-cli2'];

    if (options.fix) {
      args.push('--fix');
    }

    // Use glob pattern to match template behavior
    args.push('"**/*.{md,mdx,mdc}"');

    const result = await this.executeCommand('bunx', args);

    return {
      ...result,
      filesProcessed: filteredFiles.length,
    };
  }
}
