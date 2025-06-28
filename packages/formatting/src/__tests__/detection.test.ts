import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { detectFormatter, detectAvailableFormatters } from '../utils/detection.js';
import { exec } from 'node:child_process';
import { access } from 'node:fs/promises';

// Mock the modules
vi.mock('node:child_process');
vi.mock('node:fs/promises');
vi.mock('node:util', () => ({
  promisify: vi.fn((fn: (...args: any[]) => void) => {
    // Return a promisified version of the mocked exec
    return (...args: unknown[]) => {
      return new Promise((resolve, reject) => {
        const callback = (err: Error | null, result: unknown) => {
          if (err) reject(err);
          else resolve(result);
        };
        fn(...args, callback);
      });
    };
  }),
}));

describe('detection utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('detectFormatter', () => {
    it('should detect local prettier installation', async () => {
      const mockAccess = vi.mocked(access);
      mockAccess.mockResolvedValueOnce(undefined); // File exists

      const mockExec = vi.mocked(exec);
      // @ts-ignore - Mocking callback style
      mockExec.mockImplementation((cmd, callback) => {
        if (cmd.includes('--version')) {
          callback(null, { stdout: '3.1.0', stderr: '' });
        }
      });

      const result = await detectFormatter('prettier');

      expect(result.type).toBe('prettier');
      expect(result.available).toBe(true);
      expect(result.location).toBe('local');
      expect(result.version).toBe('3.1.0');
      expect(result.path).toContain('node_modules/.bin/prettier');
    });

    it('should detect global biome installation', async () => {
      const mockAccess = vi.mocked(access);
      mockAccess.mockRejectedValueOnce(new Error('Not found')); // Local not found

      const mockExec = vi.mocked(exec);
      // @ts-ignore - Mocking callback style
      mockExec.mockImplementation((cmd, callback) => {
        if (cmd.includes('which biome') || cmd.includes('where biome')) {
          callback(null, { stdout: '/usr/local/bin/biome', stderr: '' });
        } else if (cmd.includes('--version')) {
          callback(null, { stdout: 'Version: 1.8.3', stderr: '' });
        }
      });

      const result = await detectFormatter('biome');

      expect(result.type).toBe('biome');
      expect(result.available).toBe(true);
      expect(result.location).toBe('global');
      expect(result.version).toBe('1.8.3');
      expect(result.path).toBe('/usr/local/bin/biome');
    });

    it('should handle missing formatter', async () => {
      const mockAccess = vi.mocked(access);
      mockAccess.mockRejectedValueOnce(new Error('Not found'));

      const mockExec = vi.mocked(exec);
      // @ts-ignore - Mocking callback style
      mockExec.mockImplementation((cmd, callback) => {
        callback(new Error('Command not found'), { stdout: '', stderr: 'Command not found' });
      });

      const result = await detectFormatter('remark');

      expect(result.type).toBe('remark');
      expect(result.available).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle version detection failure gracefully', async () => {
      const mockAccess = vi.mocked(access);
      mockAccess.mockResolvedValueOnce(undefined);

      const mockExec = vi.mocked(exec);
      // @ts-ignore - Mocking callback style
      mockExec.mockImplementation((cmd, callback) => {
        if (cmd.includes('--version')) {
          callback(new Error('Version failed'), { stdout: '', stderr: '' });
        }
      });

      const result = await detectFormatter('prettier');

      expect(result.type).toBe('prettier');
      expect(result.available).toBe(true);
      expect(result.location).toBe('local');
      expect(result.version).toBeUndefined();
    });
  });

  describe('detectAvailableFormatters', () => {
    it('should detect all available formatters', async () => {
      const mockAccess = vi.mocked(access);
      // All local formatters exist
      mockAccess.mockResolvedValue(undefined);

      const mockExec = vi.mocked(exec);
      // @ts-ignore - Mocking callback style
      mockExec.mockImplementation((cmd, callback) => {
        if (cmd.includes('prettier') && cmd.includes('--version')) {
          callback(null, { stdout: '3.1.0', stderr: '' });
        } else if (cmd.includes('biome') && cmd.includes('--version')) {
          callback(null, { stdout: 'Version: 1.8.3', stderr: '' });
        } else if (cmd.includes('remark') && cmd.includes('--version')) {
          callback(null, { stdout: 'remark: 15.0.1', stderr: '' });
        } else if (cmd.includes('eslint') && cmd.includes('--version')) {
          callback(null, { stdout: 'v8.57.0', stderr: '' });
        }
      });

      const result = await detectAvailableFormatters();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.available).toContain('prettier');
        expect(result.data.available).toContain('biome');
        expect(result.data.available).toContain('remark');
        expect(result.data.available).toContain('eslint');
        expect(result.data.missing).toHaveLength(0);
        expect(result.data.formatters).toHaveLength(4);
      }
    });

    it('should handle mixed availability', async () => {
      const mockAccess = vi.mocked(access);
      // Only prettier is local
      mockAccess
        .mockResolvedValueOnce(undefined) // prettier exists
        .mockRejectedValueOnce(new Error('Not found')) // biome not found
        .mockRejectedValueOnce(new Error('Not found')) // remark not found
        .mockRejectedValueOnce(new Error('Not found')); // eslint not found

      const mockExec = vi.mocked(exec);
      // @ts-ignore - Mocking callback style
      mockExec.mockImplementation((cmd, callback) => {
        if (cmd.includes('prettier') && cmd.includes('--version')) {
          callback(null, { stdout: '3.1.0', stderr: '' });
        } else {
          callback(new Error('Command not found'), { stdout: '', stderr: '' });
        }
      });

      const result = await detectAvailableFormatters();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.available).toEqual(['prettier']);
        expect(result.data.missing).toContain('biome');
        expect(result.data.missing).toContain('remark');
        expect(result.data.missing).toContain('eslint');
        expect(result.data.formatters).toHaveLength(4);
      }
    });

    it('should handle detection errors', async () => {
      const mockAccess = vi.mocked(access);
      mockAccess.mockRejectedValue(new Error('Permission denied'));

      const mockExec = vi.mocked(exec);
      // @ts-ignore - Mocking callback style
      mockExec.mockImplementation((cmd, callback) => {
        callback(new Error('Command not found'), { stdout: '', stderr: '' });
      });

      const result = await detectAvailableFormatters();

      expect(result.success).toBe(true); // Still succeeds but with no formatters
      if (result.success) {
        expect(result.data.available).toHaveLength(0);
        expect(result.data.missing).toHaveLength(4);
      }
    });
  });

  describe('formatter version parsing', () => {
    it('should parse prettier version', async () => {
      const mockAccess = vi.mocked(access);
      mockAccess.mockResolvedValueOnce(undefined);

      const mockExec = vi.mocked(exec);
      // @ts-ignore
      mockExec.mockImplementation((cmd, callback) => {
        if (cmd.includes('--version')) {
          callback(null, { stdout: '3.1.0', stderr: '' });
        }
      });

      const result = await detectFormatter('prettier');
      expect(result.version).toBe('3.1.0');
    });

    it('should parse biome version with prefix', async () => {
      const mockAccess = vi.mocked(access);
      mockAccess.mockResolvedValueOnce(undefined);

      const mockExec = vi.mocked(exec);
      // @ts-ignore
      mockExec.mockImplementation((cmd, callback) => {
        if (cmd.includes('--version')) {
          callback(null, { stdout: 'Version: 1.8.3\nCopyright info', stderr: '' });
        }
      });

      const result = await detectFormatter('biome');
      expect(result.version).toBe('1.8.3');
    });

    it('should parse remark version from complex output', async () => {
      const mockAccess = vi.mocked(access);
      mockAccess.mockResolvedValueOnce(undefined);

      const mockExec = vi.mocked(exec);
      // @ts-ignore
      mockExec.mockImplementation((cmd, callback) => {
        if (cmd.includes('--version')) {
          callback(null, { stdout: 'remark: 15.0.1, remark-cli: 12.0.0', stderr: '' });
        }
      });

      const result = await detectFormatter('remark');
      expect(result.version).toBe('15.0.1');
    });
  });
});
