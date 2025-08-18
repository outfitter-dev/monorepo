import { spawn } from 'node:child_process';
import { extname } from 'node:path';
import type {
  FormatOptions,
  LintOptions,
  ToolAdapter,
  ToolResult,
} from '../types.js';

/**

- Base adapter class providing common functionality
- All tool adapters extend this class
 */
export abstract class BaseAdapter implements ToolAdapter {
  abstract readonly name: string;
  abstract readonly extensions: readonly string[];

  /**

- Check if this adapter can handle the given file
   */
  canHandle(filePath: string): boolean {
    const ext = extname(filePath);
    return this.extensions.includes(ext);
  }

  /**

- Execute a command and return structured result
   */
  protected async executeCommand(
    command: string,
    args: readonly string[],
    options: {
      cwd?: string;
      timeout?: number;
    } = {}
  ): Promise<ToolResult> {
    const { cwd = process.cwd(), timeout = 30_000 } = options;

    return new Promise((resolve) => {
      const child = spawn(command, args as string[], {
        cwd,
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      let stdout = '';
      let stderr = '';

      child.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr?.on('data', (data) => {
        stderr += data.toString();
      });

      // Set timeout
      const timer = setTimeout(() => {
        child.kill('SIGTERM');
        resolve({
          success: false,
          output: stdout,
          errors: [`Command timed out after ${timeout}ms`],
          exitCode: 1,
          filesProcessed: 0,
          tool: this.name,
        });
      }, timeout);

      child.on('close', (code) => {
        clearTimeout(timer);

        const success = code === 0;
        const errors: string[] = [];

        if (!success && stderr) {
          errors.push(stderr.trim());
        }

        resolve({
          success,
          output: stdout.trim(),
          errors,
          exitCode: code ?? 1,
          filesProcessed: 0, // Will be set by subclasses
          tool: this.name,
        });
      });

      child.on('error', (error) => {
        clearTimeout(timer);
        resolve({
          success: false,
          output: '',
          errors: [`Failed to start ${command}: ${error.message}`],
          exitCode: 1,
          filesProcessed: 0,
          tool: this.name,
        });
      });
    });
  }

  /**

- Filter files that this adapter can handle
   */
  protected filterFiles(files: readonly string[]): string[] {
    return files.filter((file) => this.canHandle(file));
  }

  // Abstract methods that must be implemented by subclasses
  abstract format(
    files: readonly string[],
    options?: FormatOptions
  ): Promise<ToolResult>;
  abstract lint(
    files: readonly string[],
    options?: LintOptions
  ): Promise<ToolResult>;
}
