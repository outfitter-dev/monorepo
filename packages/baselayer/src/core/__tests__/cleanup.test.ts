import {
  ErrorCode,
  failure,
  isFailure,
  isSuccess,
  success,
} from '@outfitter/contracts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import *as console from '../../utils/console';
import* as fs from '../../utils/file-system';
import {
  cleanupOldTools,
  cleanupVSCodeSettings,
  removeOldConfigs,
  removeOldGitHooks,
  removeToolConfigs,
} from '../cleanup';
import * as detector from '../detector';

describe('cleanup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock file system functions
    vi.spyOn(fs, 'fileExists').mockImplementation(vi.fn());
    vi.spyOn(fs, 'readFile').mockImplementation(vi.fn());
    vi.spyOn(fs, 'remove').mockImplementation(vi.fn());
    vi.spyOn(fs, 'findFiles').mockImplementation(vi.fn());
    // Mock detector functions
    vi.spyOn(detector, 'getConfigsToCleanup').mockImplementation(vi.fn());
    // Mock console logger functions
    vi.spyOn(console.logger, 'step').mockImplementation(() => {});
    vi.spyOn(console.logger, 'success').mockImplementation(() => {});
    vi.spyOn(console.logger, 'warning').mockImplementation(() => {});
  });

  describe('removeOldConfigs', () => {
    it('should remove existing configuration files', async () => {
      const configs = ['.eslintrc.json', '.prettierrc'];

      vi.mocked(fs.fileExists).mockResolvedValue(success(true));
      vi.mocked(fs.remove).mockResolvedValue(success(undefined));

      const result = await removeOldConfigs(configs);

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data).toEqual(['.eslintrc.json', '.prettierrc']);
      }
      expect(fs.remove).toHaveBeenCalledWith('.eslintrc.json');
      expect(fs.remove).toHaveBeenCalledWith('.prettierrc');
    });

    it('should skip non-existent files', async () => {
      const configs = ['.eslintrc.json', '.prettierrc'];

      vi.mocked(fs.fileExists).mockImplementation(async (path) =>
        success(path === '.eslintrc.json')
      );
      vi.mocked(fs.remove).mockResolvedValue(success(undefined));

      const result = await removeOldConfigs(configs);

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data).toEqual(['.eslintrc.json']);
      }
      expect(fs.remove).toHaveBeenCalledTimes(1);
      expect(fs.remove).toHaveBeenCalledWith('.eslintrc.json');
    });

    it('should not remove files in dry run mode', async () => {
      const configs = ['.eslintrc.json'];

      vi.mocked(fs.fileExists).mockResolvedValue(success(true));

      const result = await removeOldConfigs(configs, { dryRun: true });

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data).toEqual(['.eslintrc.json']);
      }
      expect(fs.remove).not.toHaveBeenCalled();
    });

    it('should fail when remove fails without force', async () => {
      const configs = ['.eslintrc.json'];

      vi.mocked(fs.fileExists).mockResolvedValue(success(true));
      vi.mocked(fs.remove).mockResolvedValue(
        failure({
          code: ErrorCode.INTERNAL_ERROR,
          message: 'Permission denied',
        })
      );

      const result = await removeOldConfigs(configs);

      expect(isFailure(result)).toBe(true);
      if (isFailure(result)) {
        expect(result.error.code).toBe(ErrorCode.INTERNAL_ERROR);
      }
    });

    it('should continue when remove fails with force', async () => {
      const configs = ['.eslintrc.json', '.prettierrc'];

      vi.mocked(fs.fileExists).mockResolvedValue(success(true));
      vi.mocked(fs.remove).mockImplementation(async (path) => {
        if (path === '.eslintrc.json') {
          return failure({
            code: ErrorCode.INTERNAL_ERROR,
            message: 'Permission denied',
          });
        }
        return success(undefined);
      });

      const result = await removeOldConfigs(configs, { force: true });

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data).toEqual(['.prettierrc']);
      }
      expect(console.logger.warning).toHaveBeenCalled();
    });

    it('should suppress output when silent', async () => {
      const configs = ['.eslintrc.json'];

      vi.mocked(fs.fileExists).mockResolvedValue(success(true));
      vi.mocked(fs.remove).mockResolvedValue(success(undefined));

      const result = await removeOldConfigs(configs, { silent: true });

      expect(isSuccess(result)).toBe(true);
      expect(console.logger.step).not.toHaveBeenCalled();
      expect(console.logger.success).not.toHaveBeenCalled();
    });
  });

  describe('cleanupOldTools', () => {
    it('should detect and remove all old tool configs', async () => {
      vi.mocked(detector.getConfigsToCleanup).mockResolvedValue(
        success(['.eslintrc.json', '.prettierrc', 'tslint.json'])
      );
      vi.mocked(fs.fileExists).mockResolvedValue(success(true));
      vi.mocked(fs.remove).mockResolvedValue(success(undefined));

      const result = await cleanupOldTools();

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data).toHaveLength(3);
      }
    });

    it('should fail when detection fails', async () => {
      vi.mocked(detector.getConfigsToCleanup).mockResolvedValue(
        failure({
          code: ErrorCode.INTERNAL_ERROR,
          message: 'Failed',
        })
      );

      const result = await cleanupOldTools();

      expect(isFailure(result)).toBe(true);
      if (isFailure(result)) {
        expect(result.error.code).toBe(ErrorCode.INTERNAL_ERROR);
      }
    });
  });

  describe('removeToolConfigs', () => {
    it('should remove ESLint configs', async () => {
      vi.mocked(fs.fileExists).mockImplementation(async (path) =>
        success(path === '.eslintrc.json' || path === '.eslintignore')
      );
      vi.mocked(fs.remove).mockResolvedValue(success(undefined));

      const result = await removeToolConfigs('eslint');

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data).toContain('.eslintrc.json');
        expect(result.data).toContain('.eslintignore');
      }
    });

    it('should remove Prettier configs', async () => {
      vi.mocked(fs.fileExists).mockImplementation(async (path) =>
        success(path === '.prettierrc' || path === '.prettierignore')
      );
      vi.mocked(fs.remove).mockResolvedValue(success(undefined));

      const result = await removeToolConfigs('prettier');

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data).toContain('.prettierrc');
        expect(result.data).toContain('.prettierignore');
      }
    });

    it('should remove Stylelint configs', async () => {
      vi.mocked(fs.fileExists).mockImplementation(async (path) =>
        success(path === '.stylelintrc.json')
      );
      vi.mocked(fs.remove).mockResolvedValue(success(undefined));

      const result = await removeToolConfigs('stylelint');

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data).toContain('.stylelintrc.json');
      }
    });

    it('should remove TSLint config', async () => {
      vi.mocked(fs.fileExists).mockImplementation(async (path) =>
        success(path === 'tslint.json')
      );
      vi.mocked(fs.remove).mockResolvedValue(success(undefined));

      const result = await removeToolConfigs('tslint');

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data).toContain('tslint.json');
      }
    });

    it('should fail for unknown tool', async () => {
      const result = await removeToolConfigs('unknown-tool');

      expect(isFailure(result)).toBe(true);
      if (isFailure(result)) {
        expect(result.error.code).toBe(ErrorCode.VALIDATION_ERROR);
        expect(result.error.message).toBe('Unknown tool: unknown-tool');
      }
    });
  });

  describe('cleanupVSCodeSettings', () => {
    it('should succeed when settings file exists', async () => {
      vi.mocked(fs.fileExists).mockResolvedValue(success(true));

      const result = await cleanupVSCodeSettings();

      expect(isSuccess(result)).toBe(true);
    });

    it('should succeed when settings file does not exist', async () => {
      vi.mocked(fs.fileExists).mockResolvedValue(success(false));

      const result = await cleanupVSCodeSettings();

      expect(isSuccess(result)).toBe(true);
    });

    it('should succeed when fileExists fails', async () => {
      vi.mocked(fs.fileExists).mockResolvedValue(
        failure({
          code: ErrorCode.INTERNAL_ERROR,
          message: 'Permission denied',
        })
      );

      const result = await cleanupVSCodeSettings();

      expect(isSuccess(result)).toBe(true);
    });
  });

  describe('removeOldGitHooks', () => {
    it('should remove husky directory', async () => {
      vi.mocked(fs.remove).mockResolvedValue(success(undefined));

      const result = await removeOldGitHooks('husky');

      expect(isSuccess(result)).toBe(true);
      expect(fs.remove).toHaveBeenCalledWith('.husky');
    });

    it('should not remove in dry run mode', async () => {
      const result = await removeOldGitHooks('husky', { dryRun: true });

      expect(isSuccess(result)).toBe(true);
      expect(fs.remove).not.toHaveBeenCalled();
    });

    it('should suppress output when silent', async () => {
      vi.mocked(fs.remove).mockResolvedValue(success(undefined));

      const result = await removeOldGitHooks('husky', { silent: true });

      expect(isSuccess(result)).toBe(true);
      expect(console.logger.step).not.toHaveBeenCalled();
    });

    it('should handle simple-git-hooks (no directory to remove)', async () => {
      const result = await removeOldGitHooks('simple-git-hooks');

      expect(isSuccess(result)).toBe(true);
      expect(fs.remove).not.toHaveBeenCalled();
    });

    it('should fail when remove fails', async () => {
      vi.mocked(fs.remove).mockResolvedValue(
        failure({
          code: ErrorCode.INTERNAL_ERROR,
          message: 'Permission denied',
        })
      );

      const result = await removeOldGitHooks('husky');

      expect(isFailure(result)).toBe(true);
      if (isFailure(result)) {
        expect(result.error.code).toBe(ErrorCode.INTERNAL_ERROR);
      }
    });
  });
});
