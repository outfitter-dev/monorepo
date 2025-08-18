import { failure, type Result, success } from '@outfitter/contracts';
import { execaCommand } from 'execa';
import type {
  CheckOptions,
  FormatOptions,
  LintOptions,
  ToolResult,
} from '../types.js';
import { BaseAdapter } from './base-adapter.js';

/**

- Adapter for Syncpack dependency synchronization
 */
export class SyncpackAdapter extends BaseAdapter {
  readonly name = 'syncpack' as const;
  readonly displayName = 'Syncpack';
  readonly extensions = ['package.json'];
  readonly configFiles = [
    '.syncpackrc.json',
    '.syncpackrc',
    '.syncpackrc.js',
    'syncpack.config.js',
  ];

  /**

- Check for dependency mismatches
   */
  async check(options: CheckOptions): Promise<Result<ToolResult, Error>> {
    try {
      const command = this.buildCommand(
        'syncpack',
        ['list-mismatches'],
        options
      );
      const result = await execaCommand(command, {
        cwd: options.cwd,
        reject: false,
      });

      // Syncpack returns non-zero exit code when mismatches are found
      const hasIssues = result.exitCode !== 0;
      const output = result.stdout || result.stderr || '';

      return success({
        tool: this.name,
        success: !hasIssues,
        output,
        errors: hasIssues ? this.parseOutput(output) : [],
      });
    } catch (error) {
      return failure(error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**

- Fix dependency mismatches
   */
  async format(options: FormatOptions): Promise<Result<ToolResult, Error>> {
    try {
      const args = ['fix-mismatches'];

      const command = this.buildCommand('syncpack', args, options);
      const result = await execaCommand(command, {
        cwd: options.cwd,
        reject: false,
      });

      const output = result.stdout || result.stderr || '';
      const success = result.exitCode === 0;

      return success({
        tool: this.name,
        success,
        output,
        errors: success ? [] : this.parseOutput(output),
      });
    } catch (error) {
      return failure(error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**

- Lint is the same as check for syncpack
   */
  async lint(options: LintOptions): Promise<Result<ToolResult, Error>> {
    return this.check(options);
  }

  /**

- Parse syncpack output for issues
   */
  private parseOutput(
    output: string
  ): Array<{ file: string; line?: number; column?: number; message: string }> {
    const issues: Array<{
      file: string;
      line?: number;
      column?: number;
      message: string;
    }> = [];
    const lines = output.split('\n');

    for (const line of lines) {
      // Syncpack output format varies, but typically includes package.json paths
      if (line.includes('package.json')) {
        // Extract file path from the line
        const match = line.match(/([^\s]+package\.json)/);
        if (match) {
          issues.push({
            file: match[1],
            message: line.trim(),
          });
        }
      } else if (line.includes('✗') || line.includes('mismatch')) {
        // Generic mismatch without specific file
        issues.push({
          file: 'package.json',
          message: line.trim(),
        });
      }
    }

    return issues;
  }

  /**

- Update dependencies to latest versions
   */
  async update(options: CheckOptions): Promise<Result<ToolResult, Error>> {
    try {
      const command = this.buildCommand('syncpack', ['update'], options);
      const result = await execaCommand(command, {
        cwd: options.cwd,
        reject: false,
      });

      const output = result.stdout || result.stderr || '';
      const success = result.exitCode === 0;

      return success({
        tool: this.name,
        success,
        output,
        errors: success ? [] : this.parseOutput(output),
      });
    } catch (error) {
      return failure(error instanceof Error ? error : new Error(String(error)));
    }
  }
}
