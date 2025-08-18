import { execSync } from 'node:child_process';
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
import * as pm from '../../utils/package-manager';
import {
  cleanupDependencies,
  findDependenciesToRemove,
  getEslintDependencies,
  removeDependency,
} from '../dependency-cleanup';

describe('dependency-cleanup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock file system functions
    vi.spyOn(fs, 'readPackageJson').mockImplementation(vi.fn());
    // Mock package manager functions
    vi.spyOn(pm, 'getPackageManager').mockImplementation(vi.fn());
    // Mock console logger functions
    vi.spyOn(console.logger, 'info').mockImplementation(() => {});
    vi.spyOn(console.logger, 'success').mockImplementation(() => {});
    vi.spyOn(console.logger, 'warning').mockImplementation(() => {});
    vi.spyOn(console.logger, 'section').mockImplementation(() => {});
    vi.spyOn(console.logger, 'step').mockImplementation(() => {});
    // Mock execSync
    vi.spyOn(require('node:child_process'), 'execSync').mockImplementation(
      vi.fn()
    );
  });

  describe('findDependenciesToRemove', () => {
    it('should find ESLint dependencies', async () => {
      vi.mocked(fs.readPackageJson).mockResolvedValue(
        success({
          devDependencies: {
            eslint: '^8.0.0',
            'eslint-plugin-react': '^7.0.0',
            '@typescript-eslint/parser': '^5.0.0',
            '@eslint/create-config': '^1.0.0',
            oxlint: '^0.10.0',
          },
        })
      );

      const result = await findDependenciesToRemove();

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data).toContain('eslint');
        expect(result.data).toContain('eslint-plugin-react');
        expect(result.data).toContain('@typescript-eslint/parser');
        expect(result.data).toContain('@eslint/create-config');
        expect(result.data).not.toContain('oxlint');
      }
    });

    it('should find TSLint and Standard', async () => {
      vi.mocked(fs.readPackageJson).mockResolvedValue(
        success({
          devDependencies: {
            tslint: '^6.0.0',
            standard: '^17.0.0',
            xo: '^0.50.0',
            jshint: '^2.0.0',
            jscs: '^3.0.0',
          },
        })
      );

      const result = await findDependenciesToRemove();

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data).toContain('tslint');
        expect(result.data).toContain('standard');
        expect(result.data).toContain('xo');
        expect(result.data).toContain('jshint');
        expect(result.data).toContain('jscs');
      }
    });

    it('should include Prettier when not keeping it', async () => {
      vi.mocked(fs.readPackageJson).mockResolvedValue(
        success({
          devDependencies: {
            prettier: '^3.0.0',
            'prettier-plugin-tailwindcss': '^0.5.0',
          },
        })
      );

      const result = await findDependenciesToRemove({ keepPrettier: false });

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data).toContain('prettier');
        expect(result.data).toContain('prettier-plugin-tailwindcss');
      }
    });

    it('should exclude Prettier when keeping it', async () => {
      vi.mocked(fs.readPackageJson).mockResolvedValue(
        success({
          devDependencies: {
            prettier: '^3.0.0',
            'prettier-plugin-tailwindcss': '^0.5.0',
            eslint: '^8.0.0',
          },
        })
      );

      const result = await findDependenciesToRemove({ keepPrettier: true });

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data).not.toContain('prettier');
        expect(result.data).not.toContain('prettier-plugin-tailwindcss');
        expect(result.data).toContain('eslint');
      }
    });

    it('should not remove dependencies in keep list', async () => {
      vi.mocked(fs.readPackageJson).mockResolvedValue(
        success({
          devDependencies: {
            oxlint: '^0.10.0',
            markdownlint: '^0.30.0',
            'markdownlint-cli2': '^0.14.0',
            stylelint: '^16.0.0',
            'stylelint-config-tailwindcss': '^0.0.7',
            eslint: '^8.0.0',
          },
        })
      );

      const result = await findDependenciesToRemove();

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data).not.toContain('oxlint');
        expect(result.data).not.toContain('markdownlint');
        expect(result.data).not.toContain('markdownlint-cli2');
        expect(result.data).not.toContain('stylelint');
        expect(result.data).not.toContain('stylelint-config-tailwindcss');
        expect(result.data).toContain('eslint');
      }
    });

    it('should check both dependencies and devDependencies', async () => {
      vi.mocked(fs.readPackageJson).mockResolvedValue(
        success({
          dependencies: {
            eslint: '^8.0.0',
          },
          devDependencies: {
            tslint: '^6.0.0',
          },
        })
      );

      const result = await findDependenciesToRemove();

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data).toContain('eslint');
        expect(result.data).toContain('tslint');
      }
    });

    it('should fail when package.json cannot be read', async () => {
      vi.mocked(fs.readPackageJson).mockResolvedValue(
        failure({
          code: 'PACKAGE_READ_FAILED',
          message: 'Not found',
        })
      );

      const result = await findDependenciesToRemove();

      expect(isFailure(result)).toBe(true);
      if (isFailure(result)) {
        expect(result.error.code).toBe('PACKAGE_READ_FAILED');
      }
    });
  });

  describe('cleanupDependencies', () => {
    it('should remove dependencies', async () => {
      vi.mocked(fs.readPackageJson).mockResolvedValue(
        success({
          devDependencies: {
            eslint: '^8.0.0',
            tslint: '^6.0.0',
          },
        })
      );

      vi.mocked(pm.getPackageManager).mockResolvedValue(
        success({ type: 'pnpm', lockFile: 'pnpm-lock.yaml' })
      );

      vi.mocked(execSync).mockImplementation(() => '');

      const result = await cleanupDependencies();

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data).toEqual(['eslint', 'tslint']);
      }
      expect(execSync).toHaveBeenCalledWith(
        'pnpm remove eslint tslint',
        expect.objectContaining({ stdio: 'inherit' })
      );
    });

    it('should skip when no dependencies to remove', async () => {
      vi.mocked(fs.readPackageJson).mockResolvedValue(
        success({
          devDependencies: {
            oxlint: '^0.10.0',
          },
        })
      );

      const result = await cleanupDependencies();

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data).toEqual([]);
      }
      expect(execSync).not.toHaveBeenCalled();
    });

    it('should not execute in dry run mode', async () => {
      vi.mocked(fs.readPackageJson).mockResolvedValue(
        success({
          devDependencies: {
            eslint: '^8.0.0',
          },
        })
      );

      const result = await cleanupDependencies({ dryRun: true });

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data).toEqual(['eslint']);
      }
      expect(execSync).not.toHaveBeenCalled();
    });

    it('should suppress output when silent', async () => {
      vi.mocked(fs.readPackageJson).mockResolvedValue(
        success({
          devDependencies: {
            eslint: '^8.0.0',
          },
        })
      );

      vi.mocked(pm.getPackageManager).mockResolvedValue(
        success({ type: 'npm', lockFile: 'package-lock.json' })
      );

      vi.mocked(execSync).mockImplementation(() => '');

      const result = await cleanupDependencies({ silent: true });

      expect(isSuccess(result)).toBe(true);
      expect(execSync).toHaveBeenCalledWith(
        'npm uninstall eslint',
        expect.objectContaining({ stdio: 'ignore' })
      );
      expect(console.logger.section).not.toHaveBeenCalled();
    });

    it('should fail when command fails without force', async () => {
      vi.mocked(fs.readPackageJson).mockResolvedValue(
        success({
          devDependencies: {
            eslint: '^8.0.0',
          },
        })
      );

      vi.mocked(pm.getPackageManager).mockResolvedValue(
        success({ type: 'npm', lockFile: 'package-lock.json' })
      );

      vi.mocked(execSync).mockImplementation(() => {
        throw new Error('Command failed');
      });

      const result = await cleanupDependencies();

      expect(isFailure(result)).toBe(true);
      if (isFailure(result)) {
        expect(result.error.code).toBe(ErrorCode.INTERNAL_ERROR);
      }
    });

    it('should continue when command fails with force', async () => {
      vi.mocked(fs.readPackageJson).mockResolvedValue(
        success({
          devDependencies: {
            eslint: '^8.0.0',
          },
        })
      );

      vi.mocked(pm.getPackageManager).mockResolvedValue(
        success({ type: 'npm', lockFile: 'package-lock.json' })
      );

      vi.mocked(execSync).mockImplementation(() => {
        throw new Error('Command failed');
      });

      const result = await cleanupDependencies({ force: true });

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data).toEqual(['eslint']);
      }
      expect(console.logger.warning).toHaveBeenCalled();
    });
  });

  describe('removeDependency', () => {
    it('should remove single dependency', async () => {
      vi.mocked(pm.getPackageManager).mockResolvedValue(
        success({ type: 'yarn', lockFile: 'yarn.lock' })
      );

      vi.mocked(execSync).mockImplementation(() => '');

      const result = await removeDependency('eslint');

      expect(isSuccess(result)).toBe(true);
      expect(execSync).toHaveBeenCalledWith(
        'yarn remove eslint',
        expect.objectContaining({ stdio: 'inherit' })
      );
    });

    it('should not execute in dry run mode', async () => {
      const result = await removeDependency('eslint', { dryRun: true });

      expect(isSuccess(result)).toBe(true);
      expect(execSync).not.toHaveBeenCalled();
    });

    it('should fail when command fails', async () => {
      vi.mocked(pm.getPackageManager).mockResolvedValue(
        success({ type: 'npm', lockFile: 'package-lock.json' })
      );

      vi.mocked(execSync).mockImplementation(() => {
        throw new Error('Command failed');
      });

      const result = await removeDependency('eslint');

      expect(isFailure(result)).toBe(true);
      if (isFailure(result)) {
        expect(result.error.code).toBe(ErrorCode.INTERNAL_ERROR);
      }
    });
  });

  describe('getEslintDependencies', () => {
    it('should return all ESLint-related dependencies', async () => {
      vi.mocked(fs.readPackageJson).mockResolvedValue(
        success({
          dependencies: {
            react: '^18.0.0',
          },
          devDependencies: {
            eslint: '^8.0.0',
            'eslint-config-standard': '^17.0.0',
            'eslint-plugin-react': '^7.0.0',
            '@typescript-eslint/parser': '^5.0.0',
            '@typescript-eslint/eslint-plugin': '^5.0.0',
            '@eslint/create-config': '^1.0.0',
            prettier: '^3.0.0',
          },
        })
      );

      const result = await getEslintDependencies();

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data).toContain('eslint');
        expect(result.data).toContain('eslint-config-standard');
        expect(result.data).toContain('eslint-plugin-react');
        expect(result.data).toContain('@typescript-eslint/parser');
        expect(result.data).toContain('@typescript-eslint/eslint-plugin');
        expect(result.data).toContain('@eslint/create-config');
        expect(result.data).not.toContain('react');
        expect(result.data).not.toContain('prettier');
      }
    });

    it('should return empty array when no ESLint dependencies', async () => {
      vi.mocked(fs.readPackageJson).mockResolvedValue(
        success({
          devDependencies: {
            prettier: '^3.0.0',
            vitest: '^1.0.0',
          },
        })
      );

      const result = await getEslintDependencies();

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data).toEqual([]);
      }
    });

    it('should fail when package.json cannot be read', async () => {
      vi.mocked(fs.readPackageJson).mockResolvedValue(
        failure({
          code: ErrorCode.INTERNAL_ERROR,
          message: 'Not found',
        })
      );

      const result = await getEslintDependencies();

      expect(isFailure(result)).toBe(true);
      if (isFailure(result)) {
        expect(result.error.code).toBe(ErrorCode.INTERNAL_ERROR);
      }
    });
  });
});
