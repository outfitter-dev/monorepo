import {
  ErrorCode,
  failure,
  isFailure,
  isSuccess,
  success,
} from '@outfitter/contracts';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as fs from '../../utils/file-system';
import { createBackup, createBackupSummary } from '../backup';
import type { DetectedConfig } from '../detector';

describe('backup', () => {
  beforeEach(() => {
    vi.clearAllMocks(); // Mock file system functions
    vi.spyOn(fs, 'ensureDir').mockImplementation(vi.fn());
    vi.spyOn(fs, 'writeFile').mockImplementation(vi.fn());
    // Mock current time to 2024-01-15T10:30:00.000Z
  });

  afterEach(() => {});

  describe('createBackup', () => {
    it('should create markdown backup of configurations', async () => {
      const configs: DetectedConfig[] = [
        {
          tool: 'eslint',
          path: '.eslintrc.json',
          content: '{\n  "extends": ["standard"]\n}',
        },
        {
          tool: 'prettier',
          path: '.prettierrc',
          content: 'semi: false\nsingleQuote: true',
        },
      ];

      vi.mocked(fs.ensureDir).mockResolvedValue(success(undefined));

      vi.mocked(fs.writeFile).mockResolvedValue(success(undefined));

      const result = await createBackup(configs);

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data).toBe('.flint-backup/flint-backup-2024-01-15.md');
      }

      expect(fs.ensureDir).toHaveBeenCalledWith('.flint-backup');
      expect(fs.writeFile).toHaveBeenCalledWith(
        '.flint-backup/flint-backup-2024-01-15.md',
        expect.stringContaining('# Flint Configuration Backup')
      );
    });

    it('should include all configurations in backup', async () => {
      const configs: DetectedConfig[] = [
        {
          tool: 'eslint',
          path: '.eslintrc.json',
          content: '{"extends": ["standard"]}',
        },
      ];

      vi.mocked(fs.ensureDir).mockResolvedValue(success(undefined));

      let writtenContent = '';
      vi.mocked(fs.writeFile).mockImplementation(async (_path, content) => {
        writtenContent = content;
        return success(undefined);
      });

      await createBackup(configs);

      expect(writtenContent).toContain('## Eslint Configuration');
      expect(writtenContent).toContain('**File**: `.eslintrc.json`');
      expect(writtenContent).toContain('```json');
      expect(writtenContent).toContain('{"extends": ["standard"]}');
    });

    it('should include restoration instructions by default', async () => {
      const configs: DetectedConfig[] = [
        {
          tool: 'eslint',
          path: '.eslintrc.json',
          content: '{}',
        },
      ];

      vi.mocked(fs.ensureDir).mockResolvedValue(success(undefined));

      let writtenContent = '';
      vi.mocked(fs.writeFile).mockImplementation(async (_path, content) => {
        writtenContent = content;
        return success(undefined);
      });

      await createBackup(configs);

      expect(writtenContent).toContain('## Restoration Instructions');
      expect(writtenContent).toContain('Individual File Restoration');
      expect(writtenContent).toContain('Remove Flint Configuration');
    });

    it('should skip restoration instructions when disabled', async () => {
      const configs: DetectedConfig[] = [
        {
          tool: 'eslint',
          path: '.eslintrc.json',
          content: '{}',
        },
      ];

      vi.mocked(fs.ensureDir).mockResolvedValue(success(undefined));

      let writtenContent = '';
      vi.mocked(fs.writeFile).mockImplementation(async (_path, content) => {
        writtenContent = content;
        return success(undefined);
      });

      await createBackup(configs, { includeRestoreInstructions: false });

      expect(writtenContent).not.toContain('## Restoration Instructions');
    });

    it('should use custom backup directory', async () => {
      const configs: DetectedConfig[] = [
        {
          tool: 'eslint',
          path: '.eslintrc.json',
          content: '{}',
        },
      ];

      vi.mocked(fs.ensureDir).mockResolvedValue(success(undefined));

      vi.mocked(fs.writeFile).mockResolvedValue(success(undefined));

      const result = await createBackup(configs, {
        backupDir: '/custom/backup',
      });

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data).toBe('/custom/backup/flint-backup-2024-01-15.md');
      }
      expect(fs.ensureDir).toHaveBeenCalledWith('/custom/backup');
    });

    it('should fail when no configurations provided', async () => {
      const result = await createBackup([]);

      expect(isFailure(result)).toBe(true);
      if (isFailure(result)) {
        expect(result.error.code).toBe(ErrorCode.VALIDATION_ERROR);
        expect(result.error.message).toBe('No configurations to backup');
      }
    });

    it('should fail when directory creation fails', async () => {
      const configs: DetectedConfig[] = [
        {
          tool: 'eslint',
          path: '.eslintrc.json',
          content: '{}',
        },
      ];

      vi.mocked(fs.ensureDir).mockResolvedValue(
        failure({
          type: 'FILE_SYSTEM_ERROR',
          code: 'EACCES',
          message: 'Permission denied',
        })
      );

      const result = await createBackup(configs);

      expect(isFailure(result)).toBe(true);
      if (isFailure(result)) {
        expect(result.error.code).toBe(ErrorCode.INTERNAL_ERROR);
        expect(result.error.message).toContain(
          'Failed to create backup directory'
        );
      }
    });

    it('should fail when file write fails', async () => {
      const configs: DetectedConfig[] = [
        {
          tool: 'eslint',
          path: '.eslintrc.json',
          content: '{}',
        },
      ];

      vi.mocked(fs.ensureDir).mockResolvedValue(success(undefined));

      vi.mocked(fs.writeFile).mockResolvedValue(
        failure({
          type: 'FILE_SYSTEM_ERROR',
          code: 'ENOSPC',
          message: 'No space left',
        })
      );

      const result = await createBackup(configs);

      expect(isFailure(result)).toBe(true);
      if (isFailure(result)) {
        expect(result.error.code).toBe(ErrorCode.INTERNAL_ERROR);
        expect(result.error.message).toContain('Failed to write backup file');
      }
    });

    it('should group multiple configs from same tool', async () => {
      const configs: DetectedConfig[] = [
        {
          tool: 'eslint',
          path: '.eslintrc.json',
          content: '{}',
        },
        {
          tool: 'eslint',
          path: 'eslint.config.js',
          content: 'module.exports = {}',
        },
      ];

      vi.mocked(fs.ensureDir).mockResolvedValue(success(undefined));

      let writtenContent = '';
      vi.mocked(fs.writeFile).mockImplementation(async (_path, content) => {
        writtenContent = content;
        return success(undefined);
      });

      await createBackup(configs);

      expect(writtenContent).toContain('## Eslint Configuration');
      expect(writtenContent).toContain('### File: `.eslintrc.json`');
      expect(writtenContent).toContain('### File: `eslint.config.js`');
    });
  });

  describe('createBackupSummary', () => {
    it('should create summary file', async () => {
      const configs: DetectedConfig[] = [
        {
          tool: 'eslint',
          path: '.eslintrc.json',
          content: '{}',
        },
        {
          tool: 'prettier',
          path: '.prettierrc',
          content: '{}',
        },
      ];

      let summaryContent = '';
      vi.mocked(fs.writeFile).mockImplementation(async (path, content) => {
        if (path.endsWith('-summary.txt')) {
          summaryContent = content;
        }
        return success(undefined);
      });

      const result = await createBackupSummary(
        configs,
        '/backup/flint-backup.md'
      );

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data).toBe('/backup/flint-backup-summary.txt');
      }
      expect(summaryContent).toContain('Flint Backup Summary');
      expect(summaryContent).toContain('- eslint: .eslintrc.json');
      expect(summaryContent).toContain('- prettier: .prettierrc');
      expect(summaryContent).toContain(
        'Full backup available at: /backup/flint-backup.md'
      );
    });

    it('should fail when write fails', async () => {
      const configs: DetectedConfig[] = [
        {
          tool: 'eslint',
          path: '.eslintrc.json',
          content: '{}',
        },
      ];

      vi.mocked(fs.writeFile).mockResolvedValue(
        failure({
          type: 'FILE_SYSTEM_ERROR',
          code: 'EACCES',
          message: 'Permission denied',
        })
      );

      const result = await createBackupSummary(
        configs,
        '/backup/flint-backup.md'
      );

      expect(isFailure(result)).toBe(true);
      if (isFailure(result)) {
        expect(result.error.code).toBe(ErrorCode.INTERNAL_ERROR);
        expect(result.error.message).toContain('Failed to write summary');
      }
    });
  });
});
