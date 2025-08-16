import { failure, isSuccess, makeError, success } from '@outfitter/contracts';
import type { MockedFunction } from 'vitest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as fs from '../file-system';
import {
  detectPackageManager,
  getAddCommand,
  getCIFlags,
  getExecCommand,
  getInstallCommand,
  getPackageManager,
  getPreferredPackageManager,
  getRemoveCommand,
  getRunCommand,
  isCI,
} from '../package-manager';

describe('package-manager utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    // Mock file system functions
    vi.spyOn(fs, 'fileExists').mockImplementation(vi.fn());
    vi.spyOn(fs, 'readFile').mockImplementation(vi.fn());
    // Clear all CI-related environment variables
    process.env.FLINT_PACKAGE_MANAGER = undefined;
    process.env.CI = undefined;
    process.env.CONTINUOUS_INTEGRATION = undefined;
    process.env.TRAVIS = undefined;
    process.env.CIRCLECI = undefined;
    process.env.JENKINS_URL = undefined;
    process.env.GITHUB_ACTIONS = undefined;
  });

  describe('detectPackageManager', () => {
    it('should detect npm from package-lock.json', async () => {
      vi.mocked(fs.fileExists).mockImplementation(async (path) =>
        success(path.endsWith('package-lock.json'))
      );

      const result = await detectPackageManager();

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data).toEqual({
          type: 'npm',
          lockFile: 'package-lock.json',
        });
      }
    });

    it('should detect yarn from yarn.lock', async () => {
      vi.mocked(fs.fileExists).mockImplementation(async (path) =>
        success(path.endsWith('yarn.lock'))
      );

      const result = await detectPackageManager();

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data).toEqual({
          type: 'yarn',
          lockFile: 'yarn.lock',
        });
      }
    });

    it('should detect pnpm from pnpm-lock.yaml', async () => {
      vi.mocked(fs.fileExists).mockImplementation(async (path) =>
        success(path.endsWith('pnpm-lock.yaml'))
      );

      const result = await detectPackageManager();

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data).toEqual({
          type: 'pnpm',
          lockFile: 'pnpm-lock.yaml',
        });
      }
    });

    it('should detect bun from bun.lockb', async () => {
      vi.mocked(fs.fileExists).mockImplementation(async (path) =>
        success(path.endsWith('bun.lockb'))
      );

      const result = await detectPackageManager();

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data).toEqual({
          type: 'bun',
          lockFile: 'bun.lockb',
        });
      }
    });

    it('should default to npm if no lock file found', async () => {
      (fs.fileExists as MockedFunction<typeof fs.fileExists>).mockResolvedValue(
        success(false)
      );

      const result = await detectPackageManager();

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data).toEqual({
          type: 'npm',
          lockFile: 'package-lock.json',
        });
      }
    });

    it('should check parent directory in monorepo', async () => {
      const cwd = '/project/packages/mypackage';
      let callCount = 0;

      (
        fs.fileExists as MockedFunction<typeof fs.fileExists>
      ).mockImplementation(async (filePath: string) => {
        callCount++;
        // First round: check current directory - no lock files
        if (callCount <= 4) {
          return success(false);
        }
        // Second round: check parent directory - find pnpm-lock.yaml
        return success(filePath.endsWith('pnpm-lock.yaml'));
      });

      const result = await detectPackageManager(cwd);

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data.type).toBe('pnpm');
      }
    });
  });

  describe('getInstallCommand', () => {
    it('should return correct install command for each package manager', () => {
      expect(getInstallCommand('npm')).toBe('npm install');
      expect(getInstallCommand('yarn')).toBe('yarn install');
      expect(getInstallCommand('pnpm')).toBe('pnpm install');
      expect(getInstallCommand('bun')).toBe('bun install');
    });
  });

  describe('getAddCommand', () => {
    it('should return correct add command for dependencies', () => {
      const packages = ['react', 'react-dom'];

      expect(getAddCommand('npm', false, packages)).toBe(
        'npm install react react-dom'
      );
      expect(getAddCommand('yarn', false, packages)).toBe(
        'yarn add react react-dom'
      );
      expect(getAddCommand('pnpm', false, packages)).toBe(
        'pnpm add react react-dom'
      );
      expect(getAddCommand('bun', false, packages)).toBe(
        'bun add react react-dom'
      );
    });

    it('should return correct add command for dev dependencies', () => {
      const packages = ['vitest', 'typescript'];

      expect(getAddCommand('npm', true, packages)).toBe(
        'npm install --save-dev vitest typescript'
      );
      expect(getAddCommand('yarn', true, packages)).toBe(
        'yarn add --dev vitest typescript'
      );
      expect(getAddCommand('pnpm', true, packages)).toBe(
        'pnpm add --save-dev vitest typescript'
      );
      expect(getAddCommand('bun', true, packages)).toBe(
        'bun add --dev vitest typescript'
      );
    });
  });

  describe('getRemoveCommand', () => {
    it('should return correct remove command', () => {
      const packages = ['eslint', 'prettier'];

      expect(getRemoveCommand('npm', packages)).toBe(
        'npm uninstall eslint prettier'
      );
      expect(getRemoveCommand('yarn', packages)).toBe(
        'yarn remove eslint prettier'
      );
      expect(getRemoveCommand('pnpm', packages)).toBe(
        'pnpm remove eslint prettier'
      );
      expect(getRemoveCommand('bun', packages)).toBe(
        'bun remove eslint prettier'
      );
    });
  });

  describe('getRunCommand', () => {
    it('should return correct run command', () => {
      expect(getRunCommand('npm', 'test')).toBe('npm run test');
      expect(getRunCommand('yarn', 'test')).toBe('yarn test');
      expect(getRunCommand('pnpm', 'test')).toBe('pnpm run test');
      expect(getRunCommand('bun', 'test')).toBe('bun run test');
    });
  });

  describe('getExecCommand', () => {
    it('should return correct exec command', () => {
      expect(getExecCommand('npm', 'vitest')).toBe('npx vitest');
      expect(getExecCommand('yarn', 'vitest')).toBe('yarn dlx vitest');
      expect(getExecCommand('pnpm', 'vitest')).toBe('pnpm exec vitest');
      expect(getExecCommand('bun', 'vitest')).toBe('bunx vitest');
    });
  });

  describe('getPreferredPackageManager', () => {
    it('should read from environment variable', async () => {
      process.env.FLINT_PACKAGE_MANAGER = 'pnpm';

      const result = await getPreferredPackageManager();

      expect(isSuccess(result)).toBe(true);
      expect(result.data).toBe('pnpm');
    });

    it('should ignore invalid environment value', async () => {
      process.env.FLINT_PACKAGE_MANAGER = 'invalid';
      (fs.readFile as MockedFunction<typeof fs.readFile>).mockResolvedValue(
        failure(makeError('FILE_NOT_FOUND', 'File not found'))
      );

      const result = await getPreferredPackageManager();

      expect(isSuccess(result)).toBe(true);
      expect(result.data).toBe(null);
    });

    it('should read from .flintrc file', async () => {
      (fs.readFile as MockedFunction<typeof fs.readFile>).mockResolvedValue(
        success('{"packageManager": "yarn"}')
      );

      const result = await getPreferredPackageManager();

      expect(isSuccess(result)).toBe(true);
      expect(result.data).toBe('yarn');
    });

    it('should handle invalid .flintrc json', async () => {
      (fs.readFile as MockedFunction<typeof fs.readFile>).mockResolvedValue(
        success('invalid json')
      );

      const result = await getPreferredPackageManager();

      expect(isSuccess(result)).toBe(true);
      expect(result.data).toBe(null);
    });

    it('should return null if no preference found', async () => {
      (fs.readFile as MockedFunction<typeof fs.readFile>).mockResolvedValue(
        failure(makeError('FILE_NOT_FOUND', 'File not found'))
      );

      const result = await getPreferredPackageManager();

      expect(isSuccess(result)).toBe(true);
      expect(result.data).toBe(null);
    });
  });

  describe('getPackageManager', () => {
    it('should use preferred package manager if set', async () => {
      process.env.FLINT_PACKAGE_MANAGER = 'bun';

      const result = await getPackageManager();

      expect(isSuccess(result)).toBe(true);
      expect(result.data).toEqual({
        type: 'bun',
        lockFile: 'bun.lockb',
      });
    });

    it('should detect from lock file if no preference', async () => {
      vi.mocked(fs.fileExists).mockImplementation(async (path: string) =>
        success(path.endsWith('pnpm-lock.yaml'))
      );

      (fs.readFile as MockedFunction<typeof fs.readFile>).mockResolvedValue(
        failure(makeError('FILE_NOT_FOUND', 'File not found'))
      );

      const result = await getPackageManager();

      expect(isSuccess(result)).toBe(true);
      expect(result.data.type).toBe('pnpm');
    });
  });

  describe('isCI', () => {
    it('should detect CI environment from CI variable', () => {
      process.env.CI = 'true';
      expect(isCI()).toBe(true);
    });

    it('should detect CI environment from CONTINUOUS_INTEGRATION', () => {
      process.env.CONTINUOUS_INTEGRATION = 'true';
      expect(isCI()).toBe(true);
    });

    it('should detect GitHub Actions', () => {
      process.env.GITHUB_ACTIONS = 'true';
      expect(isCI()).toBe(true);
    });

    it('should detect GitLab CI', () => {
      process.env.GITLAB_CI = 'true';
      expect(isCI()).toBe(true);
    });

    it('should detect CircleCI', () => {
      process.env.CIRCLECI = 'true';
      expect(isCI()).toBe(true);
    });

    it('should detect Travis CI', () => {
      process.env.TRAVIS = 'true';
      expect(isCI()).toBe(true);
    });

    it('should return false when not in CI', () => {
      expect(isCI()).toBe(false);
    });
  });

  describe('getCIFlags', () => {
    it('should return correct CI flags for each package manager', () => {
      expect(getCIFlags('npm')).toBe('--ci');
      expect(getCIFlags('yarn')).toBe('--frozen-lockfile');
      expect(getCIFlags('pnpm')).toBe('--frozen-lockfile');
      expect(getCIFlags('bun')).toBe('');
    });
  });
});
