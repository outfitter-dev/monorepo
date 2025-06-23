import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { isSuccess, isFailure } from '@outfitter/contracts';
import { BiomeFormatter } from '../../formatters/biome.js';

// Mock Biome module
const mockFormatContent = vi.fn();
const mockApplyConfiguration = vi.fn();
const mockShutdown = vi.fn();

const mockBiomeInstance = {
  applyConfiguration: mockApplyConfiguration,
  formatContent: mockFormatContent,
  shutdown: mockShutdown,
};

vi.mock('@biomejs/biome', () => {
  return {
    Biome: {
      create: vi.fn(() => Promise.resolve(mockBiomeInstance)),
    },
    Distribution: {
      NODE: 'node',
    },
  };
});

describe('BiomeFormatter', () => {
  let formatter: BiomeFormatter;

  beforeEach(() => {
    formatter = new BiomeFormatter();
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await formatter.shutdown();
    vi.restoreAllMocks();
  });

  describe('isAvailable', () => {
    it('should return true when @biomejs/biome is installed', async () => {
      const result = await formatter.isAvailable();

      expect(isSuccess(result)).toBe(true);
      if (result.success) {
        expect(result.data).toBe(true);
      }
    });

    it('should return false when @biomejs/biome is not installed', async () => {
      vi.doMock('@biomejs/biome', () => {
        const error = new Error('Cannot find module');
        (error as NodeJS.ErrnoException).code = 'MODULE_NOT_FOUND';
        throw error;
      });

      const testFormatter = new BiomeFormatter();
      const result = await testFormatter.isAvailable();

      expect(isSuccess(result)).toBe(true);
      if (result.success) {
        expect(result.data).toBe(false);
      }

      vi.doUnmock('@biomejs/biome');
    });
  });

  describe('getVersion', () => {
    it('should return biome version', async () => {
      // Mock the package.json import
      vi.doMock('@biomejs/biome/package.json', () => ({
        default: { version: '1.5.0' },
      }));

      const result = await formatter.getVersion();

      expect(isSuccess(result)).toBe(true);
      if (result.success) {
        expect(result.data).toBe('1.5.0');
      }
    });

    it('should handle missing biome gracefully', async () => {
      vi.doMock('@biomejs/biome', () => {
        const error = new Error('Cannot find module');
        (error as NodeJS.ErrnoException).code = 'MODULE_NOT_FOUND';
        throw error;
      });

      const testFormatter = new BiomeFormatter();
      const result = await testFormatter.getVersion();

      expect(isFailure(result)).toBe(true);
      if (!result.success) {
        expect(result.error.code).toBe('NOT_FOUND');
      }

      vi.doUnmock('@biomejs/biome');
    });
  });

  describe('format', () => {
    it('should format JavaScript code', async () => {
      const code = 'const x=1;const y=2;';
      const result = await formatter.format(code, 'javascript');

      expect(isSuccess(result)).toBe(true);
      if (result.success) {
        expect(result.data).toBe('const x = 1;\nconst y = 2;\n');
      }
    });

    it('should format TypeScript code', async () => {
      const code = 'interface User{name:string;age:number}';
      const result = await formatter.format(code, 'typescript');

      expect(isSuccess(result)).toBe(true);
      if (result.success) {
        expect(result.data).toContain('interface User {\n');
        expect(result.data).toContain('\tname: string;\n'); // Biome uses tabs by default
        expect(result.data).toContain('\tage: number;\n');
      }
    });

    it('should format JSON', async () => {
      const code = '{"name":"test","value":123}';
      const result = await formatter.format(code, 'json');

      expect(isSuccess(result)).toBe(true);
      if (result.success) {
        expect(result.data).toBe('{\n\t"name": "test",\n\t"value": 123\n}\n');
      }
    });

    it('should use custom options', async () => {
      const code = 'const x = 1;';
      const options = {
        indentStyle: 'space',
        indentWidth: 2,
        semicolons: 'asNeeded',
      };

      const result = await formatter.format(code, 'javascript', options);

      expect(isSuccess(result)).toBe(true);
      if (result.success) {
        expect(result.data).toBe('const x = 1\n'); // No semicolon with asNeeded
      }
    });

    it('should handle syntax errors', async () => {
      const code = 'const x = {';
      const result = await formatter.format(code, 'javascript');

      expect(isFailure(result)).toBe(true);
      if (!result.success) {
        expect(result.error.code).toBe('INTERNAL_ERROR');
        expect(result.error.message).toContain('Syntax error');
      }
    });

    it('should handle unsupported languages', async () => {
      const code = '.container { display: flex; }';
      const result = await formatter.format(code, 'css');

      expect(isFailure(result)).toBe(true);
      if (!result.success) {
        expect(result.error.code).toBe('INTERNAL_ERROR');
        expect(result.error.message).toContain('Unsupported language');
      }
    });

    it('should format JSX code', async () => {
      const code = 'const App=()=><div>Hello</div>;';
      const result = await formatter.format(code, 'jsx');

      expect(isSuccess(result)).toBe(true);
      if (result.success) {
        expect(result.data).toContain('const App = () => <div>Hello</div>;');
      }
    });

    it('should format TSX code', async () => {
      const code = 'const App:React.FC=()=><div>Hello</div>;';
      const result = await formatter.format(code, 'tsx');

      expect(isSuccess(result)).toBe(true);
      if (result.success) {
        expect(result.data).toContain('const App: React.FC = () => <div>Hello</div>;');
      }
    });
  });

  describe('getSupportedLanguages', () => {
    it('should return list of supported languages', () => {
      const languages = formatter.getSupportedLanguages();

      expect(languages).toContain('javascript');
      expect(languages).toContain('typescript');
      expect(languages).toContain('jsx');
      expect(languages).toContain('tsx');
      expect(languages).toContain('json');
      expect(languages).toContain('jsonc');
      expect(languages).not.toContain('css'); // Biome doesn't support CSS yet
      expect(languages).not.toContain('html');
    });
  });

  describe('performance', () => {
    it('should reuse Biome instance for multiple format calls', async () => {
      // Format multiple times
      await formatter.format('const x = 1;', 'javascript');
      await formatter.format('const y = 2;', 'javascript');
      await formatter.format('const z = 3;', 'javascript');

      // Biome.create should only be called once
      const biomeMock = await vi.importMock('@biomejs/biome');
      expect(biomeMock.Biome.create).toHaveBeenCalledTimes(1);
    });

    it('should handle large files efficiently', async () => {
      const largeCode = Array(1000).fill('const x = 1;').join('\n');

      mockFormatContent.mockResolvedValueOnce({
        content: largeCode, // Just return the same for the test
        diagnostics: [],
      });

      const start = Date.now();
      const result = await formatter.format(largeCode, 'javascript');
      const duration = Date.now() - start;

      expect(isSuccess(result)).toBe(true);
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });
  });
});
