import {
  ErrorCode,
  failure,
  isFailure,
  isSuccess,
  success,
} from '@outfitter/contracts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as fs from '../../utils/file-system';
import {
  deepMerge,
  mergeJSONFile,
  mergePackageScripts,
  mergeVSCodeExtensions,
  mergeVSCodeSettings,
  removeEmbeddedConfigs,
  removeJSONFields,
} from '../merger';

describe('merger', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock file system functions
    vi.spyOn(fs, 'fileExists').mockImplementation(vi.fn());
    vi.spyOn(fs, 'readJSON').mockImplementation(vi.fn());
    vi.spyOn(fs, 'writeJSON').mockImplementation(vi.fn());
  });

  describe('deepMerge', () => {
    it('should merge simple objects', () => {
      const target = { a: 1, b: 2 };
      const source = { b: 3, c: 4 };

      const result = deepMerge(target, source);

      expect(result).toEqual({ a: 1, b: 3, c: 4 });
    });

    it('should merge nested objects', () => {
      const target = {
        config: {
          port: 3000,
          host: 'localhost',
        },
      };
      const source = {
        config: {
          port: 4000,
          ssl: true,
        },
      };

      const result = deepMerge(target, source);

      expect(result).toEqual({
        config: {
          port: 4000,
          host: 'localhost',
          ssl: true,
        },
      });
    });

    it('should handle arrays with concat strategy', () => {
      const target = { items: [1, 2] };
      const source = { items: [3, 4] };

      const result = deepMerge(target, source, { arrays: 'concat' });

      expect(result).toEqual({ items: [1, 2, 3, 4] });
    });

    it('should handle arrays with replace strategy', () => {
      const target = { items: [1, 2] };
      const source = { items: [3, 4] };

      const result = deepMerge(target, source, { arrays: 'replace' });

      expect(result).toEqual({ items: [3, 4] });
    });

    it('should handle arrays with unique strategy', () => {
      const target = { items: [1, 2, 3] };
      const source = { items: [2, 3, 4] };

      const result = deepMerge(target, source, { arrays: 'unique' });

      expect(result).toEqual({ items: [1, 2, 3, 4] });
    });

    it('should replace entire object with replace strategy', () => {
      const target = { a: 1, b: 2 };
      const source = { c: 3 };

      const result = deepMerge(target, source, { strategy: 'replace' });

      expect(result).toEqual({ c: 3 });
    });

    it('should preserve target with preserve strategy', () => {
      const target = { a: 1, b: 2 };
      const source = { b: 3, c: 4 };

      const result = deepMerge(target, source, { strategy: 'preserve' });

      expect(result).toEqual({ a: 1, b: 2 });
    });

    it('should skip undefined values', () => {
      const target = { a: 1, b: 2 };
      const source = { b: undefined, c: 3 };

      const result = deepMerge(target, source);

      expect(result).toEqual({ a: 1, b: 2, c: 3 });
    });

    it('should handle null values', () => {
      const target = { a: 1, b: { nested: true } };
      const source = { b: null };

      const result = deepMerge(target, source);

      expect(result).toEqual({ a: 1, b: null });
    });
  });

  describe('mergeJSONFile', () => {
    it('should merge new data into existing file', async () => {
      vi.mocked(fs.fileExists).mockResolvedValue(success(true));
      vi.mocked(fs.readJSON).mockResolvedValue(
        success({ existing: true, value: 1 })
      );
      vi.mocked(fs.writeJSON).mockResolvedValue(success(undefined));

      const result = await mergeJSONFile('config.json', {
        value: 2,
        new: true,
      });

      expect(isSuccess(result)).toBe(true);
      expect(fs.writeJSON).toHaveBeenCalledWith('config.json', {
        existing: true,
        value: 2,
        new: true,
      });
    });

    it('should create new file if it does not exist', async () => {
      vi.mocked(fs.fileExists).mockResolvedValue(success(false));
      vi.mocked(fs.writeJSON).mockResolvedValue(success(undefined));

      const result = await mergeJSONFile('config.json', { new: true });

      expect(isSuccess(result)).toBe(true);
      expect(fs.writeJSON).toHaveBeenCalledWith('config.json', { new: true });
    });

    it('should fail when read fails', async () => {
      vi.mocked(fs.fileExists).mockResolvedValue(success(true));
      vi.mocked(fs.readJSON).mockResolvedValue(
        failure({
          code: ErrorCode.INTERNAL_ERROR,
          message: 'Permission denied',
        })
      );

      const result = await mergeJSONFile('config.json', { new: true });

      expect(isFailure(result)).toBe(true);
      if (isFailure(result)) {
        expect(result.error.code).toBe(ErrorCode.INTERNAL_ERROR);
      }
    });

    it('should fail when write fails', async () => {
      vi.mocked(fs.fileExists).mockResolvedValue(success(false));
      vi.mocked(fs.writeJSON).mockResolvedValue(
        failure({
          code: ErrorCode.INTERNAL_ERROR,
          message: 'No space',
        })
      );

      const result = await mergeJSONFile('config.json', { new: true });

      expect(isFailure(result)).toBe(true);
      if (isFailure(result)) {
        expect(result.error.code).toBe(ErrorCode.INTERNAL_ERROR);
      }
    });
  });

  describe('mergeVSCodeSettings', () => {
    it('should merge VS Code settings with unique arrays', async () => {
      vi.mocked(fs.fileExists).mockResolvedValue(success(true));
      vi.mocked(fs.readJSON).mockResolvedValue(
        success({
          'editor.formatOnSave': true,
          'files.exclude': ['node_modules'],
        })
      );
      vi.mocked(fs.writeJSON).mockResolvedValue(success(undefined));

      const result = await mergeVSCodeSettings({
        'editor.tabSize': 2,
        'files.exclude': ['dist'],
      });

      expect(isSuccess(result)).toBe(true);
      expect(fs.writeJSON).toHaveBeenCalledWith('.vscode/settings.json', {
        'editor.formatOnSave': true,
        'editor.tabSize': 2,
        'files.exclude': ['node_modules', 'dist'],
      });
    });
  });

  describe('mergeVSCodeExtensions', () => {
    it('should merge VS Code extensions with unique recommendations', async () => {
      vi.mocked(fs.fileExists).mockResolvedValue(success(true));
      vi.mocked(fs.readJSON).mockResolvedValue(
        success({
          recommendations: ['biomejs.biome'],
        })
      );
      vi.mocked(fs.writeJSON).mockResolvedValue(success(undefined));

      const result = await mergeVSCodeExtensions({
        recommendations: ['biomejs.biome', 'esbenp.prettier-vscode'],
      });

      expect(isSuccess(result)).toBe(true);
      expect(fs.writeJSON).toHaveBeenCalledWith('.vscode/extensions.json', {
        recommendations: ['biomejs.biome', 'esbenp.prettier-vscode'],
      });
    });
  });

  describe('mergePackageScripts', () => {
    it('should add new scripts to package.json', async () => {
      vi.mocked(fs.readJSON).mockResolvedValue(
        success({
          name: 'test-project',
          scripts: {
            test: 'vitest',
          },
        })
      );
      vi.mocked(fs.writeJSON).mockResolvedValue(success(undefined));

      const result = await mergePackageScripts({
        format: 'bunx ultracite@latest format --write .',
        lint: 'oxlint',
      });

      expect(isSuccess(result)).toBe(true);
      expect(fs.writeJSON).toHaveBeenCalledWith('package.json', {
        name: 'test-project',
        scripts: {
          test: 'vitest',
          format: 'bunx ultracite@latest format --write .',
          lint: 'oxlint',
        },
      });
    });

    it('should not overwrite existing scripts by default', async () => {
      vi.mocked(fs.readJSON).mockResolvedValue(
        success({
          scripts: {
            format: 'prettier --write .',
          },
        })
      );
      vi.mocked(fs.writeJSON).mockResolvedValue(success(undefined));

      const result = await mergePackageScripts({
        format: 'bunx ultracite@latest format --write .',
      });

      expect(isSuccess(result)).toBe(true);
      expect(fs.writeJSON).toHaveBeenCalledWith('package.json', {
        scripts: {
          format: 'prettier --write .',
        },
      });
    });

    it('should overwrite scripts when specified', async () => {
      vi.mocked(fs.readJSON).mockResolvedValue(
        success({
          scripts: {
            format: 'prettier --write .',
          },
        })
      );
      vi.mocked(fs.writeJSON).mockResolvedValue(success(undefined));

      const result = await mergePackageScripts(
        {
          format: 'bunx ultracite@latest format --write .',
        },
        { overwrite: true }
      );

      expect(isSuccess(result)).toBe(true);
      expect(fs.writeJSON).toHaveBeenCalledWith('package.json', {
        scripts: {
          format: 'bunx ultracite@latest format --write .',
        },
      });
    });

    it('should create scripts object if it does not exist', async () => {
      vi.mocked(fs.readJSON).mockResolvedValue(
        success({
          name: 'test-project',
        })
      );
      vi.mocked(fs.writeJSON).mockResolvedValue(success(undefined));

      const result = await mergePackageScripts({
        format: 'bunx ultracite@latest format --write .',
      });

      expect(isSuccess(result)).toBe(true);
      expect(fs.writeJSON).toHaveBeenCalledWith('package.json', {
        name: 'test-project',
        scripts: {
          format: 'bunx ultracite@latest format --write .',
        },
      });
    });
  });

  describe('removeJSONFields', () => {
    it('should remove specified fields from JSON file', async () => {
      vi.mocked(fs.fileExists).mockResolvedValue(success(true));
      vi.mocked(fs.readJSON).mockResolvedValue(
        success({
          keep: 'this',
          remove1: 'delete',
          remove2: 'also delete',
        })
      );
      vi.mocked(fs.writeJSON).mockResolvedValue(success(undefined));

      const result = await removeJSONFields('config.json', [
        'remove1',
        'remove2',
      ]);

      expect(isSuccess(result)).toBe(true);
      expect(fs.writeJSON).toHaveBeenCalledWith('config.json', {
        keep: 'this',
      });
    });

    it('should succeed when file does not exist', async () => {
      vi.mocked(fs.fileExists).mockResolvedValue(success(false));

      const result = await removeJSONFields('config.json', ['field']);

      expect(isSuccess(result)).toBe(true);
      expect(fs.writeJSON).not.toHaveBeenCalled();
    });

    it('should fail when read fails', async () => {
      vi.mocked(fs.fileExists).mockResolvedValue(success(true));
      vi.mocked(fs.readJSON).mockResolvedValue(
        failure({
          code: ErrorCode.INTERNAL_ERROR,
          message: 'Permission denied',
        })
      );

      const result = await removeJSONFields('config.json', ['field']);

      expect(isFailure(result)).toBe(true);
      if (isFailure(result)) {
        expect(result.error.code).toBe(ErrorCode.INTERNAL_ERROR);
      }
    });
  });

  describe('removeEmbeddedConfigs', () => {
    it('should remove embedded configs from package.json', async () => {
      vi.mocked(fs.fileExists).mockResolvedValue(success(true));
      vi.mocked(fs.readJSON).mockResolvedValue(
        success({
          name: 'test-project',
          eslintConfig: { extends: ['standard'] },
          prettier: { semi: false },
          scripts: {},
        })
      );
      vi.mocked(fs.writeJSON).mockResolvedValue(success(undefined));

      const result = await removeEmbeddedConfigs();

      expect(isSuccess(result)).toBe(true);
      expect(fs.writeJSON).toHaveBeenCalledWith('package.json', {
        name: 'test-project',
        scripts: {},
      });
    });
  });
});
