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
  getMissingDependencies,
  getPackageVersion,
  installDependencies,
  installMissingDependencies,
  installPackage,
  isPackageInstalled,
  runInstall,
} from '../installer';

describe('installer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock file system functions
    vi.spyOn(fs, 'readPackageJson').mockImplementation(vi.fn());
    // Mock package manager functions
    vi.spyOn(pm, 'getPackageManager').mockImplementation(vi.fn());
    vi.spyOn(pm, 'isCI').mockImplementation(vi.fn());
    vi.spyOn(pm, 'getCIFlags').mockImplementation(vi.fn());
    // Mock console logger functions
    vi.spyOn(console.logger, 'info').mockImplementation(() => {});
    vi.spyOn(console.logger, 'success').mockImplementation(() => {});
    vi.spyOn(console.logger, 'step').mockImplementation(() => {});
    // Mock execSync
    vi.mocked(execSync).mockImplementation(vi.fn());
  });

  describe('getMissingDependencies', () => {
    it('should return missing dependencies', async () => {
      vi.mocked(fs.readPackageJson).mockResolvedValue(
        success({
          devDependencies: {
            '@biomejs/biome': '^1.0.0',
            prettier: '^3.0.0',
          },
        })
      );

      const result = await getMissingDependencies();

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data).toContain('oxlint');
        expect(result.data).toContain('markdownlint-cli2');
        expect(result.data).toContain('stylelint');
        expect(result.data).not.toContain('@biomejs/biome');
        expect(result.data).not.toContain('prettier');
      }
    });

    it('should check both dependencies and devDependencies', async () => {
      vi.mocked(fs.readPackageJson).mockResolvedValue(
        success({
          dependencies: {
            ultracite: '^4.0.0',
          },
          devDependencies: {
            '@biomejs/biome': '^1.0.0',
          },
        })
      );

      const result = await getMissingDependencies();

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data).not.toContain('ultracite');
        expect(result.data).not.toContain('@biomejs/biome');
      }
    });

    it('should return all dependencies when none are installed', async () => {
      vi.mocked(fs.readPackageJson).mockResolvedValue(success({}));

      const result = await getMissingDependencies();

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data).toHaveLength(10); // All required dependencies
      }
    });

    it('should fail when package.json cannot be read', async () => {
      vi.mocked(fs.readPackageJson).mockResolvedValue(
        failure({
          code: ErrorCode.INTERNAL_ERROR,
          message: 'Not found',
        })
      );

      const result = await getMissingDependencies();

      expect(isFailure(result)).toBe(true);
      if (isFailure(result)) {
        expect(result.error.code).toBe(ErrorCode.INTERNAL_ERROR);
      }
    });
  });

  describe('installDependencies', () => {
    it('should install dependencies with package manager', async () => {
      vi.mocked(pm.getPackageManager).mockResolvedValue(
        success({ type: 'pnpm', lockFile: 'pnpm-lock.yaml' } as const)
      );

      vi.mocked(execSync).mockImplementation(() => '');

      const result = await installDependencies(['oxlint', 'prettier']);

      expect(isSuccess(result)).toBe(true);
      expect(execSync).toHaveBeenCalledWith(
        'pnpm add --save-dev oxlint prettier',
        expect.objectContaining({ stdio: 'inherit' })
      );
    });

    it('should skip when no packages to install', async () => {
      const result = await installDependencies([]);

      expect(isSuccess(result)).toBe(true);
      expect(execSync).not.toHaveBeenCalled();
    });

    it('should use exact versions when specified', async () => {
      vi.mocked(pm.getPackageManager).mockResolvedValue(
        success({ type: 'npm', lockFile: 'package-lock.json' } as const)
      );

      vi.mocked(execSync).mockImplementation(() => '');

      const result = await installDependencies(['oxlint'], { exact: true });

      expect(isSuccess(result)).toBe(true);
      expect(execSync).toHaveBeenCalledWith(
        'npm install --save-dev oxlint --exact',
        expect.any(Object)
      );
    });

    it('should install as regular dependencies when dev is false', async () => {
      vi.mocked(pm.getPackageManager).mockResolvedValue(
        success({ type: 'yarn', lockFile: 'yarn.lock' } as const)
      );

      vi.mocked(execSync).mockImplementation(() => '');

      const result = await installDependencies(['react'], { dev: false });

      expect(isSuccess(result)).toBe(true);
      expect(execSync).toHaveBeenCalledWith(
        'yarn add react',
        expect.any(Object)
      );
    });

    it('should suppress output when silent', async () => {
      vi.mocked(pm.getPackageManager).mockResolvedValue(
        success({ type: 'bun', lockFile: 'bun.lockb' } as const)
      );

      vi.mocked(execSync).mockImplementation(() => '');

      const result = await installDependencies(['oxlint'], { silent: true });

      expect(isSuccess(result)).toBe(true);
      expect(execSync).toHaveBeenCalledWith(
        'bun add --dev oxlint',
        expect.objectContaining({ stdio: 'ignore' })
      );
      expect(console.logger.info).not.toHaveBeenCalled();
    });

    it('should fail when package manager detection fails', async () => {
      vi.mocked(pm.getPackageManager).mockResolvedValue(
        failure({
          code: ErrorCode.INTERNAL_ERROR,
          message: 'Failed',
        })
      );

      const result = await installDependencies(['oxlint']);

      expect(isFailure(result)).toBe(true);
      if (isFailure(result)) {
        expect(result.error.code).toBe(ErrorCode.INTERNAL_ERROR);
      }
    });

    it('should fail when installation command fails', async () => {
      vi.mocked(pm.getPackageManager).mockResolvedValue(
        success({ type: 'npm', lockFile: 'package-lock.json' } as const)
      );

      vi.mocked(execSync).mockImplementation(() => {
        throw new Error('Command failed');
      });

      const result = await installDependencies(['oxlint']);

      expect(isFailure(result)).toBe(true);
      if (isFailure(result)) {
        expect(result.error.code).toBe(ErrorCode.INTERNAL_ERROR);
        expect(result.error.message).toContain('Command failed');
      }
    });
  });

  describe('runInstall', () => {
    it('should run install command', async () => {
      vi.mocked(pm.getPackageManager).mockResolvedValue(
        success({ type: 'pnpm', lockFile: 'pnpm-lock.yaml' } as const)
      );

      vi.mocked(pm.isCI).mockReturnValue(false);
      vi.mocked(execSync).mockImplementation(() => '');

      const result = await runInstall();

      expect(isSuccess(result)).toBe(true);
      expect(execSync).toHaveBeenCalledWith(
        'pnpm install',
        expect.objectContaining({ stdio: 'inherit' })
      );
    });

    it('should add CI flags in CI environment', async () => {
      vi.mocked(pm.getPackageManager).mockResolvedValue(
        success({ type: 'npm', lockFile: 'package-lock.json' } as const)
      );

      vi.mocked(pm.isCI).mockReturnValue(true);
      vi.mocked(pm.getCIFlags).mockReturnValue('--ci');
      vi.mocked(execSync).mockImplementation(() => '');

      const result = await runInstall();

      expect(isSuccess(result)).toBe(true);
      expect(execSync).toHaveBeenCalledWith(
        'npm install --ci',
        expect.any(Object)
      );
    });

    it('should suppress output when silent', async () => {
      vi.mocked(pm.getPackageManager).mockResolvedValue(
        success({ type: 'yarn', lockFile: 'yarn.lock' } as const)
      );

      vi.mocked(pm.isCI).mockReturnValue(false);
      vi.mocked(execSync).mockImplementation(() => '');

      const result = await runInstall({ silent: true });

      expect(isSuccess(result)).toBe(true);
      expect(execSync).toHaveBeenCalledWith(
        'yarn install',
        expect.objectContaining({ stdio: 'ignore' })
      );
      expect(console.logger.info).not.toHaveBeenCalled();
    });

    it('should fail when command fails', async () => {
      vi.mocked(pm.getPackageManager).mockResolvedValue(
        success({ type: 'npm', lockFile: 'package-lock.json' } as const)
      );

      vi.mocked(pm.isCI).mockReturnValue(false);
      vi.mocked(execSync).mockImplementation(() => {
        throw new Error('Install failed');
      });

      const result = await runInstall();

      expect(isFailure(result)).toBe(true);
      if (isFailure(result)) {
        expect(result.error.code).toBe(ErrorCode.INTERNAL_ERROR);
      }
    });
  });

  describe('isPackageInstalled', () => {
    it('should return true when package is in dependencies', async () => {
      vi.mocked(fs.readPackageJson).mockResolvedValue(
        success({
          dependencies: {
            react: '^18.0.0',
          },
        })
      );

      const result = await isPackageInstalled('react');

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data).toBe(true);
      }
    });

    it('should return true when package is in devDependencies', async () => {
      vi.mocked(fs.readPackageJson).mockResolvedValue(
        success({
          devDependencies: {
            vitest: '^1.0.0',
          },
        })
      );

      const result = await isPackageInstalled('vitest');

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data).toBe(true);
      }
    });

    it('should return false when package is not installed', async () => {
      vi.mocked(fs.readPackageJson).mockResolvedValue(
        success({
          dependencies: {},
        })
      );

      const result = await isPackageInstalled('react');

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data).toBe(false);
      }
    });
  });

  describe('getPackageVersion', () => {
    it('should return version when package is installed', async () => {
      vi.mocked(fs.readPackageJson).mockResolvedValue(
        success({
          dependencies: {
            react: '^18.2.0',
          },
        })
      );

      const result = await getPackageVersion('react');

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data).toBe('^18.2.0');
      }
    });

    it('should return null when package is not installed', async () => {
      vi.mocked(fs.readPackageJson).mockResolvedValue(
        success({
          dependencies: {},
        })
      );

      const result = await getPackageVersion('react');

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data).toBe(null);
      }
    });
  });

  describe('installPackage', () => {
    it('should install single package', async () => {
      vi.mocked(pm.getPackageManager).mockResolvedValue(
        success({ type: 'npm', lockFile: 'package-lock.json' } as const)
      );

      vi.mocked(execSync).mockImplementation(() => '');

      const result = await installPackage('oxlint');

      expect(isSuccess(result)).toBe(true);
      expect(execSync).toHaveBeenCalledWith(
        'npm install --save-dev oxlint',
        expect.any(Object)
      );
    });
  });

  describe('installMissingDependencies', () => {
    it('should install all missing dependencies', async () => {
      vi.mocked(fs.readPackageJson).mockResolvedValue(
        success({
          devDependencies: {
            '@biomejs/biome': '^1.0.0',
          },
        })
      );

      vi.mocked(pm.getPackageManager).mockResolvedValue(
        success({ type: 'pnpm', lockFile: 'pnpm-lock.yaml' } as const)
      );

      vi.mocked(execSync).mockImplementation(() => '');

      const result = await installMissingDependencies();

      expect(isSuccess(result)).toBe(true);
      expect(execSync).toHaveBeenCalled();
      expect(console.logger.info).toHaveBeenCalledWith(
        expect.stringContaining('missing dependencies')
      );
    });

    it('should skip when all dependencies are installed', async () => {
      vi.mocked(fs.readPackageJson).mockResolvedValue(
        success({
          devDependencies: {
            '@biomejs/biome': '^1.0.0',
            oxlint: '^0.1.0',
            prettier: '^3.0.0',
            'markdownlint-cli2': '^0.14.0',
            stylelint: '^16.0.0',
            'stylelint-config-tailwindcss': '^0.0.7',
            lefthook: '^1.8.0',
            '@commitlint/cli': '^19.0.0',
            '@commitlint/config-conventional': '^19.0.0',
            ultracite: '^4.0.0',
          },
        })
      );

      const result = await installMissingDependencies();

      expect(isSuccess(result)).toBe(true);
      expect(execSync).not.toHaveBeenCalled();
      expect(console.logger.info).toHaveBeenCalledWith(
        'All required dependencies are already installed'
      );
    });
  });
});
