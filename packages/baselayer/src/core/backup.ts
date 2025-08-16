/**
 * Create markdown backups of existing configurations
 */

import * as path from 'node:path';
import { failure, isFailure, type Result, success } from '@outfitter/contracts';
import { ensureDir, writeFile } from '../utils/file-system';
import type { DetectedConfig } from './detector';

export interface BackupOptions {
  backupDir?: string;
  includeRestoreInstructions?: boolean;
}

export interface BackupError {
  type: 'BACKUP_ERROR';
  code: string;
  message: string;
}

/**
 * Create a markdown backup of configurations
 */
export async function createBackup(
  configs: DetectedConfig[],
  options: BackupOptions = {}
): Promise<Result<string, BackupError>> {
  const { backupDir = '.flint-backup', includeRestoreInstructions = true } =
    options;

  if (configs.length === 0) {
    return failure({
      type: 'BACKUP_ERROR' as const,
      code: 'VALIDATION_ERROR',
      message: 'No configurations to backup',
    });
  }

  // Ensure backup directory exists
  const ensureDirResult = await ensureDir(backupDir);
  if (isFailure(ensureDirResult)) {
    return failure({
      type: 'BACKUP_ERROR' as const,
      code: 'INTERNAL_ERROR',
      message: `Failed to create backup directory: ${ensureDirResult.error.message}`,
    });
  }

  // Generate backup content
  const timestamp = new Date().toISOString();
  const date = timestamp.split('T')[0];
  const filename = `flint-backup-${date}.md`;
  const backupPath = path.join(backupDir, filename);

  const content = generateBackupContent(
    configs,
    timestamp,
    includeRestoreInstructions
  );

  // Write backup file
  const writeResult = await writeFile(backupPath, content);
  if (isFailure(writeResult)) {
    return failure({
      type: 'BACKUP_ERROR' as const,
      code: 'INTERNAL_ERROR',
      message: `Failed to write backup file: ${writeResult.error.message}`,
    });
  }

  return success(backupPath);
}

/**
 * Generate markdown content for backup
 */
function generateBackupContent(
  configs: DetectedConfig[],
  timestamp: string,
  includeRestoreInstructions: boolean
): string {
  const lines: string[] = [];

  // Header
  lines.push('# Flint Configuration Backup');
  lines.push('');
  lines.push(`**Generated**: ${timestamp}`);
  lines.push(`**Project**: ${process.cwd()}`);
  lines.push(`**Total Configurations**: ${configs.length}`);
  lines.push('');

  // Table of contents
  lines.push('## Table of Contents');
  lines.push('');
  const groupedConfigs = groupConfigsByTool(configs);
  for (const tool of Object.keys(groupedConfigs)) {
    lines.push(
      `- [${capitalizeFirst(tool)} Configuration](#${tool}-configuration)`
    );
  }
  if (includeRestoreInstructions) {
    lines.push('- [Restoration Instructions](#restoration-instructions)');
  }
  lines.push('');

  // Configuration sections
  for (const [tool, toolConfigs] of Object.entries(groupedConfigs)) {
    lines.push(`## ${capitalizeFirst(tool)} Configuration`);
    lines.push('');

    for (const config of toolConfigs) {
      if (toolConfigs.length > 1) {
        lines.push(`### File: \`${config.path}\``);
      } else {
        lines.push(`**File**: \`${config.path}\``);
      }
      lines.push('');

      const ext = getFileExtension(config.path);
      const lang = getLanguageFromExtension(ext);

      lines.push(`\`\`\`${lang}`);
      lines.push(config.content.trimEnd());
      lines.push('```');
      lines.push('');
    }
  }

  // Restoration instructions
  if (includeRestoreInstructions) {
    lines.push('## Restoration Instructions');
    lines.push('');
    lines.push('To restore any of these configurations:');
    lines.push('');
    lines.push('1. **Individual File Restoration**:');
    lines.push('   - Create a new file with the original filename shown above');
    lines.push('   - Copy the content from the appropriate code block');
    lines.push('   - Save the file in your project root');
    lines.push('');
    lines.push('2. **Remove Flint Configuration**:');
    lines.push('   ```bash');
    lines.push('   # Remove Flint-generated configs');
    lines.push('   rm -f biome.jsonc .oxlintrc.json .prettierrc.json');
    lines.push('   rm -f .markdownlint-cli2.yaml .stylelintrc.json');
    lines.push('   rm -f lefthook.yml .commitlintrc.json');
    lines.push('   ```');
    lines.push('');
    lines.push('3. **Restore Package Dependencies**:');
    lines.push(
      '   - You may need to reinstall your previous linting/formatting tools'
    );
    lines.push('   - Check your git history for the exact versions');
    lines.push('');
    lines.push('4. **Update VS Code Settings**:');
    lines.push('   - Revert any changes made to `.vscode/settings.json`');
    lines.push('   - Update default formatters back to your original tools');
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Group configurations by tool
 */
function groupConfigsByTool(
  configs: DetectedConfig[]
): Record<string, DetectedConfig[]> {
  const grouped: Record<string, DetectedConfig[]> = {};

  for (const config of configs) {
    if (!grouped[config.tool]) {
      grouped[config.tool] = [];
    }
    grouped[config.tool]?.push(config);
  }

  return grouped;
}

/**
 * Get file extension from path
 */
function getFileExtension(filePath: string): string {
  const ext = path.extname(filePath);
  return ext.startsWith('.') ? ext.slice(1) : ext;
}

/**
 * Map file extension to language for syntax highlighting
 */
function getLanguageFromExtension(ext: string): string {
  const languageMap: Record<string, string> = {
    js: 'javascript',
    mjs: 'javascript',
    cjs: 'javascript',
    ts: 'typescript',
    jsx: 'javascript',
    tsx: 'typescript',
    json: 'json',
    jsonc: 'jsonc',
    json5: 'json5',
    yaml: 'yaml',
    yml: 'yaml',
    toml: 'toml',
    '': 'text',
  };

  return languageMap[ext] || ext;
}

/**
 * Capitalize first letter of string
 */
function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Create a summary backup with just the list of configs
 */
export async function createBackupSummary(
  configs: DetectedConfig[],
  backupPath: string
): Promise<Result<string, BackupError>> {
  const timestamp = new Date().toISOString();
  const summaryPath = backupPath.replace('.md', '-summary.txt');

  const lines: string[] = [
    `Flint Backup Summary - ${timestamp}`,
    '='.repeat(50),
    '',
    'Backed up configurations:',
    '',
  ];

  for (const config of configs) {
    lines.push(`- ${config.tool}: ${config.path}`);
  }

  lines.push('');
  lines.push(`Full backup available at: ${backupPath}`);

  const writeResult = await writeFile(summaryPath, lines.join('\n'));
  if (isFailure(writeResult)) {
    return failure({
      type: 'BACKUP_ERROR' as const,
      code: 'INTERNAL_ERROR',
      message: `Failed to write summary: ${writeResult.error.message}`,
    });
  }

  return success(summaryPath);
}
