/**

- Migration report generator
 */

import {
  type AppError,
  ErrorCode,
  failure,
  isFailure,
  makeError,
  type Result,
  success,
} from '@outfitter/contracts';
import { writeFile } from '../utils/file-system.js';

export interface MigrationStep {
  action: string;
  status: 'success' | 'warning' | 'error' | 'skipped';
  details?: string;
  duration?: number;
}

export interface MigrationReportOptions {
  includePerformance?: boolean;
  includeNextSteps?: boolean;
  includeTroubleshooting?: boolean;
}

export class MigrationReporter {
  private steps: MigrationStep[] = [];
  private startTime = Date.now();
  private toolsInstalled = new Set<string>();
  private toolsRemoved = new Set<string>();
  private configsCreated: string[] = [];
  private configsRemoved: string[] = [];
  private backupPath?: string;

  /**

- Add a migration step
   */
  addStep(step: Omit<MigrationStep, 'duration'>): void {
    this.steps.push({
      ...step,
      duration: Date.now() - this.startTime,
    });
  }

  /**

- Record installed tool
   */
  addInstalledTool(tool: string): void {
    this.toolsInstalled.add(tool);
  }

  /**

- Record removed tool
   */
  addRemovedTool(tool: string): void {
    this.toolsRemoved.add(tool);
  }

  /**

- Record created configuration
   */
  addCreatedConfig(config: string): void {
    this.configsCreated.push(config);
  }

  /**

- Record removed configuration
   */
  addRemovedConfig(config: string): void {
    this.configsRemoved.push(config);
  }

  /**

- Set backup file path
   */
  setBackupPath(path: string): void {
    this.backupPath = path;
  }

  /**

- Generate migration report
   */
  async generateReport(
    options: MigrationReportOptions = {}
  ): Promise<Result<string, AppError>> {
    const {
      includePerformance = true,
      includeNextSteps = true,
      includeTroubleshooting = true,
    } = options;

    const timestamp = new Date().toISOString();
    const date = timestamp.split['T'](0);
    const filename = `flint-migration-report-${date}.md`;

    const content = this.generateMarkdownContent({
      timestamp,
      includePerformance,
      includeNextSteps,
      includeTroubleshooting,
    });

    const writeResult = await writeFile(filename, content);
    if (isFailure(writeResult)) {
      return failure(
        makeError(
          ErrorCode.INTERNAL_ERROR,
          `Failed to write report: ${writeResult.error.message}`
        )
      );
    }

    return success(filename);
  }

  /**

- Generate markdown content
   */
  private generateMarkdownContent(options: {
    timestamp: string;
    includePerformance: boolean;
    includeNextSteps: boolean;
    includeTroubleshooting: boolean;
  }): string {
    const {
      timestamp,
      includePerformance,
      includeNextSteps,
      includeTroubleshooting,
    } = options;
    const lines: string[] = [];
    const totalDuration = Date.now() - this.startTime;

    // Header
    lines.push('# Flint Migration Report');
    lines.push('');
    lines.push(`**Generated**: ${timestamp}`);
    lines.push(`**Project**: ${process.cwd()}`);
    lines.push(`**Duration**: ${(totalDuration / 1000).toFixed(2)}s`);
    lines.push('');

    // Summary
    const successful = this.steps.filter((s) => s.status === 'success').length;
    const warnings = this.steps.filter((s) => s.status === 'warning').length;
    const errors = this.steps.filter((s) => s.status === 'error').length;
    const skipped = this.steps.filter((s) => s.status === 'skipped').length;

    lines.push('## Summary');
    lines.push('');
    lines.push(`- ✅ **Successful**: ${successful} steps`);
    lines.push(`- ⚠️  **Warnings**: ${warnings} steps`);
    lines.push(`- ❌ **Errors**: ${errors} steps`);
    lines.push(`- ⏭️  **Skipped**: ${skipped} steps`);
    lines.push('');

    // Migration Process
    lines.push('## Migration Process');
    lines.push('');
    lines.push('| Status | Action | Details | Time |');
    lines.push('|--------|--------|---------|------|');

    for (const step of this.steps) {
      const icon = {
        success: '✅',
        warning: '⚠️',
        error: '❌',
        skipped: '⏭️',
      }[step.status];

      const time = step.duration
        ? `${(step.duration / 1000).toFixed(2)}s`
        : '-';
      const details = step.details || '-';

      lines.push(`| ${icon} | ${step.action} | ${details} | ${time} |`);
    }
    lines.push('');

    // Tools & Configuration
    lines.push('## Tools & Configuration');
    lines.push('');

    if (this.toolsInstalled.size > 0) {
      lines.push('### Installed Tools');
      lines.push('');
      for (const tool of this.toolsInstalled) {
        lines.push(`- ${tool}`);
      }
      lines.push('');
    }

    if (this.toolsRemoved.size > 0) {
      lines.push('### Removed Tools');
      lines.push('');
      for (const tool of this.toolsRemoved) {
        lines.push(`- ${tool}`);
      }
      lines.push('');
    }

    if (this.configsCreated.length > 0) {
      lines.push('### Created Configurations');
      lines.push('');
      for (const config of this.configsCreated) {
        lines.push(`- ${config}`);
      }
      lines.push('');
    }

    if (this.configsRemoved.length > 0) {
      lines.push('### Removed Configurations');
      lines.push('');
      for (const config of this.configsRemoved) {
        lines.push(`- ${config}`);
      }
      lines.push('');
    }

    // Available Commands
    lines.push('## Available Commands');
    lines.push('');
    lines.push('```bash');
    lines.push('# Formatting');
    lines.push('bun run format        # Format JS/TS files with Biome');
    lines.push('bun run format:md     # Format Markdown files');
    lines.push('bun run format:css    # Format CSS files');
    lines.push('bun run format:all    # Format all files');
    lines.push('');
    lines.push('# Linting');
    lines.push('bun run lint          # Lint JS/TS files with Oxlint');
    lines.push('bun run lint:md       # Lint Markdown files');
    lines.push('bun run lint:css      # Lint CSS files');
    lines.push('bun run lint:all      # Lint all files');
    lines.push('');
    lines.push('# Combined');
    lines.push('bun run check         # Check formatting and linting');
    lines.push('bun run check:fix     # Fix all formatting and linting issues');
    lines.push('bun run ci            # Run all checks (for CI/CD)');
    lines.push('```');
    lines.push('');

    // Next Steps
    if (includeNextSteps) {
      lines.push('## Next Steps');
      lines.push('');
      lines.push(
        '1. **Test the setup**: Run `bun run check` to verify everything works'
      );
      lines.push(
        '2. **Fix any issues**: Run `bun run check:fix` to auto-fix problems'
      );
      lines.push(
        '3. **Commit changes**: The pre-commit hooks will now format your code'
      );
      lines.push(
        '4. **VS Code**: Restart VS Code to activate the new extensions'
      );
      lines.push('');
    }

    // Troubleshooting
    if (includeTroubleshooting && (errors > 0 || warnings > 0)) {
      lines.push('## Troubleshooting');
      lines.push('');

      const issues = this.steps.filter(
        (s) => s.status === 'error' || s.status === 'warning'
      );
      for (const issue of issues) {
        lines.push(
          `### ${issue.status === 'error' ? '❌ Error' : '⚠️ Warning'}: ${issue.action}`
        );
        if (issue.details) {
          lines.push(issue.details);
          lines.push('');
        }
      }
    }

    // Backup Reference
    if (this.backupPath) {
      lines.push('## Backup Reference');
      lines.push('');
      lines.push(
        `Your previous configuration has been backed up to: \`${this.backupPath}\``
      );
      lines.push('');
      lines.push('If you need to restore any settings, refer to that file.');
      lines.push('');
    }

    // Performance Comparison
    if (includePerformance) {
      lines.push('## Performance Comparison');
      lines.push('');
      lines.push('Based on typical JavaScript/TypeScript projects:');
      lines.push('');
      lines.push(
        '| Operation | Before (ESLint + Prettier) | After (Biome + Oxlint) | Improvement |'
      );
      lines.push(
        '|-----------|----------------------------|------------------------|-------------|'
      );
      lines.push('| Format 1000 files | ~5s | ~0.3s | **16x faster** |');
      lines.push('| Lint 1000 files | ~10s | ~0.2s | **50x faster** |');
      lines.push('| Pre-commit (100 files) | ~2s | ~0.1s | **20x faster** |');
      lines.push('');
    }

    return lines.join('\n');
  }

  /**

- Get summary statistics
   */
  getSummary(): {
    total: number;
    successful: number;
    warnings: number;
    errors: number;
    skipped: number;
    duration: number;
  } {
    return {
      total: this.steps.length,
      successful: this.steps.filter((s) => s.status === 'success').length,
      warnings: this.steps.filter((s) => s.status === 'warning').length,
      errors: this.steps.filter((s) => s.status === 'error').length,
      skipped: this.steps.filter((s) => s.status === 'skipped').length,
      duration: Date.now() - this.startTime,
    };
  }

  /**

- Check if migration was successful
   */
  isSuccessful(): boolean {
    return this.steps.filter((s) => s.status === 'error').length === 0;
  }
}
