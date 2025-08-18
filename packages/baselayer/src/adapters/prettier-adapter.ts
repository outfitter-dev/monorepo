import type { FormatOptions, LintOptions, ToolResult } from '../types.js';
import { BaseAdapter } from './base-adapter.js';

/**

- Prettier adapter for JSON and YAML formatting
- Based on bun-monorepo template configuration
 */
export class PrettierAdapter extends BaseAdapter {
  readonly name = 'prettier';
  readonly extensions = ['.json', '.yaml', '.yml'] as const;

  /**

- Format JSON/YAML files using Prettier
   */
  async format(
    files: readonly string[],
    options: FormatOptions = {}
  ): Promise<ToolResult> {
    const filteredFiles = this.filterFiles(files);

    if (filteredFiles.length === 0) {
      return {
        success: true,
        output: 'No JSON/YAML files to format',
        errors: [],
        exitCode: 0,
        filesProcessed: 0,
        tool: this.name,
      };
    }

    const args = ['prettier'];

    if (options.dryRun) {
      args.push('--check');
    } else {
      args.push('--write');
    }

    // Use glob pattern to match template behavior
    args.push('"**/*.{json,yaml,yml}"');

    const result = await this.executeCommand('bunx', args);

    return {
      ...result,
      filesProcessed: filteredFiles.length,
    };
  }

  /**

- Lint JSON/YAML files using Prettier (check mode)
   */
  async lint(
    files: readonly string[],
    options: LintOptions = {}
  ): Promise<ToolResult> {
    const filteredFiles = this.filterFiles(files);

    if (filteredFiles.length === 0) {
      return {
        success: true,
        output: 'No JSON/YAML files to lint',
        errors: [],
        exitCode: 0,
        filesProcessed: 0,
        tool: this.name,
      };
    }

    const args = ['prettier'];

    if (options.fix) {
      args.push('--write');
    } else {
      args.push('--check');
    }

    // Use glob pattern to match template behavior
    args.push('"**/*.{json,yaml,yml}"');

    const result = await this.executeCommand('bunx', args);

    return {
      ...result,
      filesProcessed: filteredFiles.length,
    };
  }
}
