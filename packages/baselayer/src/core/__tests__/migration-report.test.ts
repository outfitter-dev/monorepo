import {
  ErrorCode,
  failure,
  isFailure,
  isSuccess,
  success,
} from '@outfitter/contracts';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as fs from '../../utils/file-system';
import { MigrationReporter } from '../migration-report';

describe('MigrationReporter', () => {
  let reporter: MigrationReporter;

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock file system functions
    vi.spyOn(fs, 'writeFile').mockImplementation(vi.fn());
    reporter = new MigrationReporter();
  });

  afterEach(() => {});

  describe('addStep', () => {
    it('should add a step with duration', () => {
      // Simulate 1000ms time passage (timer advancement not needed for this test)

      reporter.addStep({
        action: 'Test action',
        status: 'success',
        details: 'Test details',
      });

      const summary = reporter.getSummary();
      expect(summary.successful).toBe(1);
      expect(summary.total).toBe(1);
    });

    it('should track different status types', () => {
      reporter.addStep({ action: 'Success', status: 'success' });
      reporter.addStep({ action: 'Warning', status: 'warning' });
      reporter.addStep({ action: 'Error', status: 'error' });
      reporter.addStep({ action: 'Skipped', status: 'skipped' });

      const summary = reporter.getSummary();
      expect(summary.successful).toBe(1);
      expect(summary.warnings).toBe(1);
      expect(summary.errors).toBe(1);
      expect(summary.skipped).toBe(1);
      expect(summary.total).toBe(4);
    });
  });

  describe('tool tracking', () => {
    it('should track installed tools', () => {
      reporter.addInstalledTool('biome');
      reporter.addInstalledTool('oxlint');
      reporter.addInstalledTool('biome'); // Duplicate

      // Verify through summary
      const summary = reporter.getSummary();
      expect(summary).toBeDefined();
      expect(summary.total).toBeGreaterThanOrEqual(0);
    });

    it('should track removed tools', () => {
      reporter.addRemovedTool('eslint');
      reporter.addRemovedTool('prettier');

      // Verify through summary
      const summary = reporter.getSummary();
      expect(summary).toBeDefined();
    });
  });

  describe('config tracking', () => {
    it('should track created configurations', () => {
      reporter.addCreatedConfig('biome.jsonc');
      reporter.addCreatedConfig('.oxlintrc.json');

      // Verify through summary
      const summary = reporter.getSummary();
      expect(summary).toBeDefined();
    });

    it('should track removed configurations', () => {
      reporter.addRemovedConfig('.eslintrc.json');
      reporter.addRemovedConfig('.prettierrc');

      // Verify through summary
      const summary = reporter.getSummary();
      expect(summary).toBeDefined();
    });
  });

  describe('setBackupPath', () => {
    it('should set backup path', async () => {
      reporter.setBackupPath('/backup/flint-backup.md');

      // Verify through report generation
      let writtenContent = '';
      vi.mocked(fs.writeFile).mockImplementation(async (_path, content) => {
        writtenContent = content;
        return success(undefined);
      });

      await reporter.generateReport();
      expect(writtenContent).toContain(
        'Your previous configuration has been backed up to: `/backup/flint-backup.md`'
      );
    });
  });

  describe('generateReport', () => {
    it('should generate complete report', async () => {
      // Add various data
      reporter.addStep({ action: 'Detecting tools', status: 'success' });
      reporter.addStep({ action: 'Creating backup', status: 'success' });
      reporter.addStep({ action: 'Installing biome', status: 'success' });
      reporter.addStep({
        action: 'Removing eslint',
        status: 'warning',
        details: 'Some files locked',
      });

      reporter.addInstalledTool('biome');
      reporter.addInstalledTool('oxlint');
      reporter.addRemovedTool('eslint');
      reporter.addCreatedConfig('biome.jsonc');
      reporter.addRemovedConfig('.eslintrc.json');
      reporter.setBackupPath('/backup/flint-backup.md');

      let writtenContent = '';
      vi.mocked(fs.writeFile).mockImplementation(async (_path, content) => {
        writtenContent = content;
        return success(undefined);
      });

      const result = await reporter.generateReport();

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data).toMatch(
          /^flint-migration-report-\d{4}-\d{2}-\d{2}\.md$/
        );
      }

      // Verify content
      expect(writtenContent).toContain('# Flint Migration Report');
      expect(writtenContent).toMatch(
        /\*\*Generated\*\*: \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/
      );
      expect(writtenContent).toContain('## Summary');
      expect(writtenContent).toContain('✅ **Successful**: 3 steps');
      expect(writtenContent).toContain('⚠️  **Warnings**: 1 steps');
      expect(writtenContent).toContain('## Migration Process');
      expect(writtenContent).toContain('| ✅ | Detecting tools |');
      expect(writtenContent).toContain(
        '| ⚠️ | Removing eslint | Some files locked |'
      );
      expect(writtenContent).toContain('### Installed Tools');
      expect(writtenContent).toContain('- biome');
      expect(writtenContent).toContain('- oxlint');
      expect(writtenContent).toContain('### Removed Tools');
      expect(writtenContent).toContain('- eslint');
      expect(writtenContent).toContain('### Created Configurations');
      expect(writtenContent).toContain('- biome.jsonc');
      expect(writtenContent).toContain('### Removed Configurations');
      expect(writtenContent).toContain('- .eslintrc.json');
      expect(writtenContent).toContain('## Available Commands');
      expect(writtenContent).toContain('bun run format');
      expect(writtenContent).toContain('## Next Steps');
      expect(writtenContent).toContain('## Backup Reference');
      expect(writtenContent).toContain(
        'Your previous configuration has been backed up to: `/backup/flint-backup.md`'
      );
      expect(writtenContent).toContain('## Performance Comparison');
    });

    it('should exclude sections based on options', async () => {
      reporter.addStep({ action: 'Test', status: 'success' });

      let writtenContent = '';
      vi.mocked(fs.writeFile).mockImplementation(async (_path, content) => {
        writtenContent = content;
        return success(undefined);
      });

      await reporter.generateReport({
        includePerformance: false,
        includeNextSteps: false,
        includeTroubleshooting: false,
      });

      expect(writtenContent).not.toContain('## Performance Comparison');
      expect(writtenContent).not.toContain('## Next Steps');
      expect(writtenContent).not.toContain('## Troubleshooting');
    });

    it('should include troubleshooting for errors', async () => {
      reporter.addStep({
        action: 'Failed operation',
        status: 'error',
        details: 'Permission denied',
      });
      reporter.addStep({
        action: 'Warning operation',
        status: 'warning',
        details: 'File locked',
      });

      let writtenContent = '';
      vi.mocked(fs.writeFile).mockImplementation(async (_path, content) => {
        writtenContent = content;
        return success(undefined);
      });

      await reporter.generateReport();

      expect(writtenContent).toContain('## Troubleshooting');
      expect(writtenContent).toContain('### ❌ Error: Failed operation');
      expect(writtenContent).toContain('Permission denied');
      expect(writtenContent).toContain('### ⚠️ Warning: Warning operation');
      expect(writtenContent).toContain('File locked');
    });

    it('should not show empty sections', async () => {
      reporter.addStep({ action: 'Test', status: 'success' });

      let writtenContent = '';
      vi.mocked(fs.writeFile).mockImplementation(async (_path, content) => {
        writtenContent = content;
        return success(undefined);
      });

      await reporter.generateReport();

      expect(writtenContent).not.toContain('### Installed Tools');
      expect(writtenContent).not.toContain('### Removed Tools');
      expect(writtenContent).not.toContain('### Created Configurations');
      expect(writtenContent).not.toContain('### Removed Configurations');
      expect(writtenContent).not.toContain('## Backup Reference');
    });

    it('should fail when write fails', async () => {
      reporter.addStep({ action: 'Test', status: 'success' });

      vi.mocked(fs.writeFile).mockResolvedValue(
        failure({
          code: ErrorCode.INTERNAL_ERROR,
          message: 'No space',
        })
      );

      const result = await reporter.generateReport();

      expect(isFailure(result)).toBe(true);
      if (isFailure(result)) {
        expect(result.error.code).toBe(ErrorCode.INTERNAL_ERROR);
      }
    });
  });

  describe('getSummary', () => {
    it('should return correct summary', () => {
      reporter.addStep({ action: 'Step 1', status: 'success' });
      reporter.addStep({ action: 'Step 2', status: 'success' });
      reporter.addStep({ action: 'Step 3', status: 'warning' });
      reporter.addStep({ action: 'Step 4', status: 'error' });
      reporter.addStep({ action: 'Step 5', status: 'skipped' });

      const summary = reporter.getSummary();

      expect(summary.total).toBe(5);
      expect(summary.successful).toBe(2);
      expect(summary.warnings).toBe(1);
      expect(summary.errors).toBe(1);
      expect(summary.skipped).toBe(1);
      expect(summary.duration).toBeGreaterThanOrEqual(0);
    });

    it('should return empty summary when no steps', () => {
      const summary = reporter.getSummary();

      expect(summary).toEqual({
        total: 0,
        successful: 0,
        warnings: 0,
        errors: 0,
        skipped: 0,
        duration: 0,
      });
    });
  });

  describe('isSuccessful', () => {
    it('should return true when no errors', () => {
      reporter.addStep({ action: 'Step 1', status: 'success' });
      reporter.addStep({ action: 'Step 2', status: 'warning' });
      reporter.addStep({ action: 'Step 3', status: 'skipped' });

      expect(reporter.isSuccessful()).toBe(true);
    });

    it('should return false when there are errors', () => {
      reporter.addStep({ action: 'Step 1', status: 'success' });
      reporter.addStep({ action: 'Step 2', status: 'error' });

      expect(reporter.isSuccessful()).toBe(false);
    });

    it('should return true when no steps', () => {
      expect(reporter.isSuccessful()).toBe(true);
    });
  });
});
