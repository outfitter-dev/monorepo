import type { Stats } from 'node:fs';
import * as fs from 'node:fs/promises';
import { isFailure, isSuccess } from '@outfitter/contracts';
import type { MockedFunction } from 'vitest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  backupFile,
  copyFile,
  ensureDir,
  fileExists,
  findFiles,
  getStats,
  listFiles,
  moveFile,
  readFile,
  readJSON,
  readPackageJson,
  remove,
  writeFile,
  writeJSON,
  writePackageJson,
} from '../file-system';

describe('file-system utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock fs/promises functions
    vi.spyOn(fs, 'access').mockImplementation(vi.fn());
    vi.spyOn(fs, 'readFile').mockImplementation(vi.fn());
    vi.spyOn(fs, 'writeFile').mockImplementation(vi.fn());
    vi.spyOn(fs, 'mkdir').mockImplementation(vi.fn());
    vi.spyOn(fs, 'copyFile').mockImplementation(vi.fn());
    vi.spyOn(fs, 'unlink').mockImplementation(vi.fn());
    vi.spyOn(fs, 'rename').mockImplementation(vi.fn());
    vi.spyOn(fs, 'stat').mockImplementation(vi.fn());
    vi.spyOn(fs, 'readdir').mockImplementation(vi.fn());
    vi.spyOn(fs, 'rm').mockImplementation(vi.fn());
  });

  describe('fileExists', () => {
    it('should return true when file exists', async () => {
      (fs.access as MockedFunction<typeof fs.access>).mockResolvedValue(
        undefined
      );

      const result = await fileExists('/test/file.txt');

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data).toBe(true);
      }
    });

    it('should return false when file does not exist', async () => {
      const error = new Error('ENOENT') as NodeJS.ErrnoException;
      error.code = 'ENOENT';
      (fs.access as MockedFunction<typeof fs.access>).mockRejectedValue(error);

      const result = await fileExists('/test/file.txt');

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data).toBe(false);
      }
    });

    it('should return error for other failures', async () => {
      (fs.access as MockedFunction<typeof fs.access>).mockRejectedValue(
        new Error('Permission denied')
      );

      const result = await fileExists('/test/file.txt');

      expect(isFailure(result)).toBe(true);
    });
  });

  describe('readFile', () => {
    it('should read file content', async () => {
      (fs.readFile as MockedFunction<typeof fs.readFile>).mockResolvedValue(
        'file content'
      );

      const result = await readFile('/test/file.txt');

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data).toBe('file content');
      }
      expect(fs.readFile).toHaveBeenCalledWith('/test/file.txt', 'utf-8');
    });

    it('should return error on failure', async () => {
      (fs.readFile as MockedFunction<typeof fs.readFile>).mockRejectedValue(
        new Error('Read failed')
      );

      const result = await readFile('/test/file.txt');

      expect(isFailure(result)).toBe(true);
      if (isFailure(result)) {
        expect(result.error.message).toContain('Read failed');
      }
    });
  });

  describe('writeFile', () => {
    it('should write file content', async () => {
      (fs.writeFile as MockedFunction<typeof fs.writeFile>).mockResolvedValue(
        undefined
      );

      const result = await writeFile('/test/file.txt', 'content');

      expect(isSuccess(result)).toBe(true);
      expect(fs.writeFile).toHaveBeenCalledWith(
        '/test/file.txt',
        'content',
        'utf-8'
      );
    });

    it('should return error on failure', async () => {
      (fs.writeFile as MockedFunction<typeof fs.writeFile>).mockRejectedValue(
        new Error('Write failed')
      );

      const result = await writeFile('/test/file.txt', 'content');

      expect(isFailure(result)).toBe(true);
    });
  });

  describe('readJSON', () => {
    it('should read and parse JSON file', async () => {
      (fs.readFile as MockedFunction<typeof fs.readFile>).mockResolvedValue(
        '{"key": "value"}'
      );

      const result = await readJSON('/test/file.json');

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data).toEqual({ key: 'value' });
      }
    });

    it('should return error for invalid JSON', async () => {
      (fs.readFile as MockedFunction<typeof fs.readFile>).mockResolvedValue(
        'invalid json'
      );

      const result = await readJSON('/test/file.json');

      expect(isFailure(result)).toBe(true);
      if (isFailure(result)) {
        expect(result.error.message).toContain('Failed to parse JSON');
      }
    });

    it('should return error for read failure', async () => {
      (fs.readFile as MockedFunction<typeof fs.readFile>).mockRejectedValue(
        new Error('Read failed')
      );

      const result = await readJSON('/test/file.json');

      expect(isFailure(result)).toBe(true);
    });
  });

  describe('writeJSON', () => {
    it('should stringify and write JSON', async () => {
      (fs.writeFile as MockedFunction<typeof fs.writeFile>).mockResolvedValue(
        undefined
      );

      const result = await writeJSON('/test/file.json', { key: 'value' });

      expect(isSuccess(result)).toBe(true);
      expect(fs.writeFile).toHaveBeenCalledWith(
        '/test/file.json',
        '{\n  "key": "value"\n}',
        'utf-8'
      );
    });

    it('should return error for circular reference', async () => {
      const circular: Record<string, unknown> = { key: 'value' };
      circular.self = circular;

      const result = await writeJSON('/test/file.json', circular);

      expect(isFailure(result)).toBe(true);
      if (isFailure(result)) {
        expect(result.error.message).toContain('Failed to stringify JSON');
      }
    });
  });

  describe('ensureDir', () => {
    it('should create directory', async () => {
      (fs.mkdir as MockedFunction<typeof fs.mkdir>).mockResolvedValue(
        undefined
      );

      const result = await ensureDir('/test/dir');

      expect(isSuccess(result)).toBe(true);
      expect(fs.mkdir).toHaveBeenCalledWith('/test/dir', { recursive: true });
    });

    it('should return error on failure', async () => {
      (fs.mkdir as MockedFunction<typeof fs.mkdir>).mockRejectedValue(
        new Error('Mkdir failed')
      );

      const result = await ensureDir('/test/dir');

      expect(isFailure(result)).toBe(true);
    });
  });

  describe('remove', () => {
    it('should remove file or directory', async () => {
      (fs.rm as MockedFunction<typeof fs.rm>).mockResolvedValue(undefined);

      const result = await remove('/test/target');

      expect(isSuccess(result)).toBe(true);
      expect(fs.rm).toHaveBeenCalledWith('/test/target', {
        recursive: true,
        force: true,
      });
    });

    it('should return error on failure', async () => {
      (fs.rm as MockedFunction<typeof fs.rm>).mockRejectedValue(
        new Error('Remove failed')
      );

      const result = await remove('/test/target');

      expect(isFailure(result)).toBe(true);
    });
  });

  describe('copyFile', () => {
    it('should copy file', async () => {
      (fs.copyFile as MockedFunction<typeof fs.copyFile>).mockResolvedValue(
        undefined
      );

      const result = await copyFile('/src/file.txt', '/dest/file.txt');

      expect(isSuccess(result)).toBe(true);
      expect(fs.copyFile).toHaveBeenCalledWith(
        '/src/file.txt',
        '/dest/file.txt'
      );
    });

    it('should return error on failure', async () => {
      (fs.copyFile as MockedFunction<typeof fs.copyFile>).mockRejectedValue(
        new Error('Copy failed')
      );

      const result = await copyFile('/src/file.txt', '/dest/file.txt');

      expect(isFailure(result)).toBe(true);
    });
  });

  describe('moveFile', () => {
    it('should move/rename file', async () => {
      (fs.rename as MockedFunction<typeof fs.rename>).mockResolvedValue(
        undefined
      );

      const result = await moveFile('/src/file.txt', '/dest/file.txt');

      expect(isSuccess(result)).toBe(true);
      expect(fs.rename).toHaveBeenCalledWith('/src/file.txt', '/dest/file.txt');
    });

    it('should return error on failure', async () => {
      (fs.rename as MockedFunction<typeof fs.rename>).mockRejectedValue(
        new Error('Move failed')
      );

      const result = await moveFile('/src/file.txt', '/dest/file.txt');

      expect(isFailure(result)).toBe(true);
    });
  });

  describe('listFiles', () => {
    it('should list files in directory', async () => {
      (fs.readdir as MockedFunction<typeof fs.readdir>).mockResolvedValue([
        'file1.txt',
        'file2.txt',
      ]);

      const result = await listFiles('/test/dir');

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data).toEqual(['file1.txt', 'file2.txt']);
      }
    });

    it('should return error on failure', async () => {
      (fs.readdir as MockedFunction<typeof fs.readdir>).mockRejectedValue(
        new Error('List failed')
      );

      const result = await listFiles('/test/dir');

      expect(isFailure(result)).toBe(true);
    });
  });

  describe('getStats', () => {
    it('should get file stats', async () => {
      const mockStats = { size: 1024, isFile: () => true } as Stats;
      (fs.stat as MockedFunction<typeof fs.stat>).mockResolvedValue(mockStats);

      const result = await getStats('/test/file.txt');

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data.size).toBe(1024);
      }
    });

    it('should return error on failure', async () => {
      (fs.stat as MockedFunction<typeof fs.stat>).mockRejectedValue(
        new Error('Stat failed')
      );

      const result = await getStats('/test/file.txt');

      expect(isFailure(result)).toBe(true);
    });
  });

  describe('findFiles', () => {
    it('should find files matching pattern', async () => {
      const glob = await import('glob');
      (glob.glob as MockedFunction<typeof glob.glob>).mockResolvedValue([
        'file1.js',
        'file2.js',
      ]);

      const result = await findFiles('**/*.js');

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data).toEqual(['file1.js', 'file2.js']);
      }
    });

    it('should return error on failure', async () => {
      const glob = await import('glob');
      (glob.glob as MockedFunction<typeof glob.glob>).mockRejectedValue(
        new Error('Glob failed')
      );

      const result = await findFiles('**/*.js');

      expect(isFailure(result)).toBe(true);
    });
  });

  describe('readPackageJson', () => {
    it('should read package.json from current directory', async () => {
      (fs.readFile as MockedFunction<typeof fs.readFile>).mockResolvedValue(
        '{"name": "test-package"}'
      );

      const result = await readPackageJson();

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data).toEqual({ name: 'test-package' });
      }
      expect(fs.readFile).toHaveBeenCalledWith('package.json', 'utf-8');
    });
  });

  describe('writePackageJson', () => {
    it('should write package.json to current directory', async () => {
      (fs.writeFile as MockedFunction<typeof fs.writeFile>).mockResolvedValue(
        undefined
      );

      const result = await writePackageJson({ name: 'test-package' });

      expect(isSuccess(result)).toBe(true);
      expect(fs.writeFile).toHaveBeenCalledWith(
        'package.json',
        '{\n  "name": "test-package"\n}',
        'utf-8'
      );
    });
  });

  describe('backupFile', () => {
    it('should create backup of existing file', async () => {
      // Mock file exists
      (fs.access as MockedFunction<typeof fs.access>).mockResolvedValue(
        undefined
      );

      // Mock read file
      (fs.readFile as MockedFunction<typeof fs.readFile>).mockResolvedValue(
        Buffer.from('original content')
      );

      // Mock mkdir
      (fs.mkdir as MockedFunction<typeof fs.mkdir>).mockResolvedValue(
        undefined
      );

      // Mock write file
      (fs.writeFile as MockedFunction<typeof fs.writeFile>).mockResolvedValue(
        undefined
      );

      const result = await backupFile('/test/file.txt');

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data).toMatch(
          /\.flint-backup\/file\.txt\.\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z\.backup$/
        );
      }
      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.any(String),
        'original content',
        'utf-8'
      );
    });

    it('should fail if file does not exist', async () => {
      const error = new Error('ENOENT') as NodeJS.ErrnoException;
      error.code = 'ENOENT';
      (fs.access as MockedFunction<typeof fs.access>).mockRejectedValue(error);

      const result = await backupFile('/test/file.txt');

      expect(isFailure(result)).toBe(true);
      expect(result.error.message).toBe('File does not exist');
    });

    it('should use custom backup directory', async () => {
      (fs.access as MockedFunction<typeof fs.access>).mockResolvedValue(
        undefined
      );
      (fs.readFile as MockedFunction<typeof fs.readFile>).mockResolvedValue(
        Buffer.from('content')
      );
      (fs.mkdir as MockedFunction<typeof fs.mkdir>).mockResolvedValue(
        undefined
      );
      (fs.writeFile as MockedFunction<typeof fs.writeFile>).mockResolvedValue(
        undefined
      );

      const result = await backupFile('/test/file.txt', '/custom/backup');

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data).toMatch(/^\/custom\/backup\/file\.txt\./);
      }
      expect(fs.mkdir).toHaveBeenCalledWith('/custom/backup', {
        recursive: true,
      });
    });
  });
});
