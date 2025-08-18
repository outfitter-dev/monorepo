import type {
  CheckOptions,
  FormatOptions,
  LintOptions,
  ToolResult,
} from '../types.js';
import { BaseAdapter } from './base-adapter.js';

/**

- Lefthook adapter for Git hook management and commit validation
- Handles hook installation, commit message validation, and hook execution
 */
export class LefthookAdapter extends BaseAdapter {
  readonly name = 'lefthook';
  readonly extensions = [] as const; // Lefthook doesn't process specific files

  /**

- Format operation - not applicable for Lefthook
- Returns success with no files processed
   */
  async format(
    _files: readonly string[],
    _options: FormatOptions = {}
  ): Promise<ToolResult> {
    return {
      success: true,
      output: 'Lefthook does not format files directly',
      errors: [],
      exitCode: 0,
      filesProcessed: 0,
      tool: this.name,
    };
  }

  /**

- Lint operation - not applicable for Lefthook
- Returns success with no files processed
   */
  async lint(
    _files: readonly string[],
    _options: LintOptions = {}
  ): Promise<ToolResult> {
    return {
      success: true,
      output: 'Lefthook does not lint files directly',
      errors: [],
      exitCode: 0,
      filesProcessed: 0,
      tool: this.name,
    };
  }

  /**

- Check operation - validates git hooks are installed and active
   */
  async check(
    _files: readonly string[],
    _options: CheckOptions = {}
  ): Promise<ToolResult> {
    // Check if lefthook is installed
    const installCheck = await this.executeCommand('lefthook', ['version']);

    if (!installCheck.success) {
      return {
        success: false,
        output: '',
        errors: ['Lefthook is not installed or not in PATH'],
        exitCode: 1,
        filesProcessed: 0,
        tool: this.name,
      };
    }

    // Check if hooks are installed
    const statusCheck = await this.executeCommand('lefthook', ['version']);

    if (!statusCheck.success) {
      return {
        success: false,
        output: statusCheck.output,
        errors: ['Failed to check Lefthook status'],
        exitCode: statusCheck.exitCode,
        filesProcessed: 0,
        tool: this.name,
      };
    }

    return {
      success: true,
      output: `Lefthook is active: ${installCheck.output}`,
      errors: [],
      exitCode: 0,
      filesProcessed: 0,
      tool: this.name,
    };
  }

  /**

- Install git hooks using Lefthook
   */
  async install(): Promise<ToolResult> {
    const result = await this.executeCommand('lefthook', ['install']);

    return {
      ...result,
      filesProcessed: 0,
    };
  }

  /**

- Uninstall git hooks
   */
  async uninstall(): Promise<ToolResult> {
    const result = await this.executeCommand('lefthook', ['uninstall']);

    return {
      ...result,
      filesProcessed: 0,
    };
  }

  /**

- Run specific hook manually (useful for testing)
   */
  async runHook(
    hookName: string,
    files?: readonly string[]
  ): Promise<ToolResult> {
    const args = ['run', hookName];

    if (files && files.length > 0) {
      args.push('--files', files.join(','));
    }

    const result = await this.executeCommand('lefthook', args);

    return {
      ...result,
      filesProcessed: files?.length ?? 0,
    };
  }

  /**

- Validate commit message using commitlint
   */
  async validateCommitMessage(message: string): Promise<ToolResult> {
    // Create temporary file with commit message
    const { writeFileSync, unlinkSync } = await import('node:fs');
    const { join } = await import('node:path');
    const { randomBytes } = await import('node:crypto');

    const tempFile = join(
      process.cwd(),
      `.commit-msg-${randomBytes(8).toString('hex')}`
    );

    try {
      writeFileSync(tempFile, message, 'utf-8');

      const result = await this.executeCommand('bunx', [
        'commitlint',
        '--edit',
        tempFile,
      ]);

      return {
        ...result,
        filesProcessed: 1,
      };
    } catch (error) {
      return {
        success: false,
        output: '',
        errors: [
          `Failed to validate commit message: ${(error as Error).message}`,
        ],
        exitCode: 1,
        filesProcessed: 0,
        tool: this.name,
      };
    } finally {
      try {
        unlinkSync(tempFile);
      } catch {
        // Ignore cleanup errors
      }
    }
  }

  /**

- Run pre-commit hooks manually
   */
  async runPreCommit(stagedFiles?: readonly string[]): Promise<ToolResult> {
    return this.runHook('pre-commit', stagedFiles);
  }

  /**

- Run pre-push hooks manually
   */
  async runPrePush(): Promise<ToolResult> {
    return this.runHook('pre-push');
  }
}
