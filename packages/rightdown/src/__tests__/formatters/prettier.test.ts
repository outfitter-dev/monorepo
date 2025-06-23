import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { isSuccess, isFailure } from '@outfitter/contracts';
import { PrettierFormatter } from '../../formatters/prettier.js';

// Mock Prettier module
const mockFormat = vi.fn();
const mockPrettier = {
  format: mockFormat,
  version: '3.0.0',
};

vi.mock('prettier', () => {
  return {
    default: mockPrettier,
    ...mockPrettier,
  };
});

describe('PrettierFormatter', () => {
  let formatter: PrettierFormatter;

  beforeEach(() => {
    formatter = new PrettierFormatter();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('isAvailable', () => {
    it('should return true when prettier is installed', async () => {
      const result = await formatter.isAvailable();

      expect(isSuccess(result)).toBe(true);
      if (result.success) {
        expect(result.data).toBe(true);
      }
    });

    it('should return false when prettier is not installed', async () => {
      // Create a new formatter instance for this test
      const testFormatter = new PrettierFormatter();

      // Mock dynamic import to fail
      vi.doMock('prettier', () => {
        const error = new Error('Cannot find module');
        (error as NodeJS.ErrnoException).code = 'MODULE_NOT_FOUND';
        throw error;
      });

      const result = await testFormatter.isAvailable();

      expect(isSuccess(result)).toBe(true);
      if (result.success) {
        expect(result.data).toBe(false);
      }

      // Restore mock for other tests
      vi.doUnmock('prettier');
    });
  });

  describe('getVersion', () => {
    it('should return prettier version', async () => {
      const result = await formatter.getVersion();

      expect(isSuccess(result)).toBe(true);
      if (result.success) {
        expect(result.data).toMatch(/^\d+\.\d+\.\d+/);
      }
    });

    it('should handle missing prettier gracefully', async () => {
      const testFormatter = new PrettierFormatter();

      vi.doMock('prettier', () => {
        const error = new Error('Cannot find module');
        (error as NodeJS.ErrnoException).code = 'MODULE_NOT_FOUND';
        throw error;
      });

      const result = await testFormatter.getVersion();

      expect(isFailure(result)).toBe(true);
      if (!result.success) {
        expect(result.error.code).toBe('NOT_FOUND');
      }

      vi.doUnmock('prettier');
    });
  });

  describe('format', () => {
    it('should format JavaScript code', async () => {
      const code = 'const x=1;const y=2;';
      mockFormat.mockResolvedValueOnce('const x = 1;\nconst y = 2;\n');

      const result = await formatter.format(code, 'javascript');

      expect(isSuccess(result)).toBe(true);
      if (result.success) {
        expect(result.data.formatted).toBe('const x = 1;\nconst y = 2;\n');
        expect(result.data.didChange).toBe(true);
      }
    });

    it('should format TypeScript code', async () => {
      const code = 'interface User{name:string;age:number}';
      mockFormat.mockResolvedValueOnce('interface User {\n  name: string;\n  age: number;\n}\n');

      const result = await formatter.format(code, 'typescript');

      expect(isSuccess(result)).toBe(true);
      if (result.success) {
        // Formatted output should have proper spacing
        expect(result.data).toContain('interface User');
        expect(result.data).toContain('name: string');
        expect(result.data).toContain('age: number');
      }
    });

    it('should format JSON', async () => {
      const code = '{"name":"test","value":123}';
      mockFormat.mockResolvedValueOnce('{\n  "name": "test",\n  "value": 123\n}\n');

      const result = await formatter.format(code, 'json');

      expect(isSuccess(result)).toBe(true);
      if (result.success) {
        // JSON should be properly formatted
        const parsed = JSON.parse(result.data);
        expect(parsed.name).toBe('test');
        expect(parsed.value).toBe(123);
      }
    });

    it('should use custom options', async () => {
      const code = 'const x = 1;';
      const options = {
        semi: false,
        singleQuote: true,
        tabWidth: 4,
      };
      mockFormat.mockResolvedValueOnce('const x = 1\n');

      const result = await formatter.format(code, 'javascript', options);

      expect(isSuccess(result)).toBe(true);
      if (result.success) {
        // With semi: false, should not have semicolon
        expect(result.data).toMatch(/const x = 1(?!;)/);
      }
    });

    it('should handle syntax errors', async () => {
      const code = 'const x = {';
      mockFormat.mockRejectedValueOnce(new Error('Unexpected end of input'));

      const result = await formatter.format(code, 'javascript');

      expect(isFailure(result)).toBe(true);
      if (!result.success) {
        expect(result.error.code).toBe('INTERNAL_ERROR');
        // Prettier reports syntax errors
        expect(result.error.message).toMatch(/Unexpected (end of input|token)/);
      }
    });

    it('should handle unsupported languages', async () => {
      const code = 'SELECT * FROM users;';
      const result = await formatter.format(code, 'sql');

      expect(isFailure(result)).toBe(true);
      if (!result.success) {
        expect(result.error.code).toBe('INTERNAL_ERROR');
        expect(result.error.message).toContain('Unsupported language');
      }
    });
  });

  describe('getSupportedLanguages', () => {
    it('should return list of supported languages', () => {
      const languages = formatter.getSupportedLanguages();

      expect(languages).toContain('javascript');
      expect(languages).toContain('typescript');
      expect(languages).toContain('html');
      expect(languages).toContain('css');
      expect(languages).toContain('json');
      expect(languages).toContain('yaml');
      expect(languages).toContain('markdown');
    });
  });

  describe('ESM import handling', () => {
    it('should handle Prettier v3 ESM-only import', async () => {
      // Prettier v3 is ESM-only, requiring dynamic import
      const code = 'const x = 1;';
      mockFormat.mockResolvedValueOnce('const x = 1;\n');

      const result = await formatter.format(code, 'javascript');

      expect(isSuccess(result)).toBe(true);
    });

    it('should provide helpful error for Node.js version issues', async () => {
      const testFormatter = new PrettierFormatter();

      // Mock import error for old Node.js
      vi.doMock('prettier', () => {
        const error = new Error('Cannot use import statement outside a module');
        (error as any).code = 'ERR_REQUIRE_ESM';
        throw error;
      });

      const result = await testFormatter.format('const x = 1;', 'javascript');

      expect(isFailure(result)).toBe(true);
      if (!result.success) {
        // Should have an error message about the import issue
        expect(result.error.message).toBeTruthy();
      }

      vi.doUnmock('prettier');
    });
  });
});
