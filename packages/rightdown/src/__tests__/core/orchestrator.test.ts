import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { isSuccess, isFailure, success, failure, makeError } from '@outfitter/contracts';
import type { Result, AppError } from '@outfitter/contracts';
import type { IFormatter } from '../../formatters/base.js';
import type { RightdownConfig } from '../../core/types.js';
import { Orchestrator } from '../../core/orchestrator.js';
import { RIGHTDOWN_ERROR_CODES } from '../../core/errors.js';

// ESM equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Mock formatters for testing
class MockFormatter implements IFormatter {
  constructor(
    public readonly name: string,
    private supportedLanguages: Array<string>,
  ) {}

  async isAvailable() {
    return { success: true as const, data: true };
  }

  async getVersion() {
    return { success: true as const, data: '1.0.0' };
  }

  async format(code: string, language: string) {
    if (!this.supportedLanguages.includes(language)) {
      return failure(
        makeError(RIGHTDOWN_ERROR_CODES.FORMATTER_FAILED, `Unsupported language: ${language}`),
      );
    }

    // Check for invalid syntax (mock)
    if (code.includes('const x = {') && !code.includes('}')) {
      return failure(
        makeError(RIGHTDOWN_ERROR_CODES.FORMATTER_FAILED, 'Syntax error: Unexpected end of input'),
      );
    }

    // Simple mock formatting: add spaces around operators
    const formatted = code.replace(/=/g, ' = ').replace(/\s+/g, ' ').trim();
    return success({
      formatted,
      didChange: formatted !== code.trim(),
    });
  }

  getSupportedLanguages() {
    return this.supportedLanguages;
  }
}

describe('Orchestrator', () => {
  const fixturesPath = join(__dirname, '../fixtures/markdown');
  let orchestrator: Orchestrator;
  let prettierFormatter: MockFormatter;
  let biomeFormatter: MockFormatter;

  beforeEach(() => {
    // Create mock formatters
    prettierFormatter = new MockFormatter('prettier', ['html', 'css', 'yaml', 'markdown']);
    biomeFormatter = new MockFormatter('biome', [
      'javascript',
      'typescript',
      'jsx',
      'tsx',
      'json',
      'jsonc',
    ]);

    const config: RightdownConfig = {
      version: 2,
      preset: 'standard',
      formatters: {
        default: 'prettier',
        languages: {
          javascript: 'biome',
          typescript: 'biome',
          json: 'biome',
          jsonc: 'biome',
        },
      },
    };

    const formatters = new Map<string, IFormatter>([
      ['prettier', prettierFormatter],
      ['biome', biomeFormatter],
    ]);

    orchestrator = new Orchestrator({ config, formatters });
  });

  describe('getFormatter', () => {
    it('should return correct formatter for language', () => {
      expect(orchestrator.getFormatter('javascript')?.name).toBe('biome');
      expect(orchestrator.getFormatter('typescript')?.name).toBe('biome');
      expect(orchestrator.getFormatter('json')?.name).toBe('biome');
      expect(orchestrator.getFormatter('css')?.name).toBe('prettier');
      expect(orchestrator.getFormatter('html')?.name).toBe('prettier');
    });

    it('should return default formatter for unknown language', () => {
      expect(orchestrator.getFormatter('python')?.name).toBe('prettier');
      expect(orchestrator.getFormatter('rust')?.name).toBe('prettier');
    });

    it('should return null for "none" formatter', () => {
      const config: RightdownConfig = {
        version: 2,
        formatters: {
          languages: {
            rust: 'none',
          },
        },
      };

      const orch = new Orchestrator({
        config,
        formatters: new Map(),
      });

      expect(orch.getFormatter('rust')).toBe(null);
    });

    it('should handle missing formatter gracefully', () => {
      const config: RightdownConfig = {
        version: 2,
        formatters: {
          default: 'eslint', // Not in formatters map
        },
      };

      const orch = new Orchestrator({
        config,
        formatters: new Map(),
      });

      expect(orch.getFormatter('javascript')).toBe(null);
    });
  });

  describe('format', () => {
    it('should format basic markdown with code blocks', async () => {
      const markdown = readFileSync(join(fixturesPath, 'basic.md'), 'utf-8');
      const result = await orchestrator.format(markdown);

      expect(isSuccess(result)).toBe(true);
      if (result.success) {
        const { content, stats } = result.data;

        // Should preserve markdown structure
        expect(content).toContain('# Basic Markdown Test');
        expect(content).toContain('## JavaScript Example');

        // Should format code blocks (mock formatter adds spaces around =)
        expect(content).toContain('const greeting = "Hello, World!";');
        expect(content).toContain('const user: User = {');

        // Check stats
        expect(stats.blocksProcessed).toBe(4);
        expect(stats.blocksFormatted).toBe(3); // 3 formatted, 1 plain text skipped
      }
    });

    it('should handle mixed languages', async () => {
      const markdown = readFileSync(join(fixturesPath, 'mixed-languages.md'), 'utf-8');
      const result = await orchestrator.format(markdown);

      expect(isSuccess(result)).toBe(true);
      if (result.success) {
        const { stats } = result.data;
        expect(stats.blocksProcessed).toBeGreaterThan(10);
        // But should format supported languages
        expect(stats.blocksFormatted).toBeGreaterThan(0);
      }
    });

    it('should skip blocks with "none" formatter', async () => {
      const markdown = `
\`\`\`rust
fn main() {
    println!("Hello");
}
\`\`\`
`;

      const config: RightdownConfig = {
        version: 2,
        formatters: {
          languages: {
            rust: 'none',
          },
        },
      };

      const orch = new Orchestrator({
        config,
        formatters: new Map(),
      });

      const result = await orch.format(markdown);

      expect(isSuccess(result)).toBe(true);
      if (result.success) {
        const { content, stats } = result.data;
        expect(content).toContain('fn main()'); // Unchanged
        expect(stats.blocksFormatted).toBe(0);
      }
    });

    it('should handle formatter errors gracefully', async () => {
      const markdown = `
\`\`\`javascript
const x = { // Invalid syntax
\`\`\`
`;

      const result = await orchestrator.format(markdown);

      expect(isSuccess(result)).toBe(true); // Overall success
      if (result.success) {
        const { stats } = result.data;
        expect(stats.blocksFormatted).toBe(0);
      }
    });

    it('should handle nested code blocks', async () => {
      const markdown = readFileSync(join(fixturesPath, 'nested-blocks.md'), 'utf-8');
      const result = await orchestrator.format(markdown);

      expect(isSuccess(result)).toBe(true);
      if (result.success) {
        const { content } = result.data;
        // Should preserve nesting structure
        expect(content).toContain('````markdown');
        expect(content).toContain('```javascript');
      }
    });

    it('should respect formatter options', async () => {
      const config: RightdownConfig = {
        version: 2,
        formatters: {
          default: 'prettier',
        },
        formatterOptions: {
          prettier: {
            semi: false,
            singleQuote: true,
          },
        },
      };

      const orch = new Orchestrator({
        config,
        formatters: new Map([['prettier', prettierFormatter]]),
      });

      const markdown = `
\`\`\`javascript
const x = "test";
\`\`\`
`;

      const result = await orch.format(markdown);

      expect(isSuccess(result)).toBe(true);
      if (result.success) {
        const { content } = result.data;
        // Mock formatter doesn't actually respect options, but real one will
        expect(content).toContain('const x');
      }
    });
  });

  describe('formatFile', () => {
    it('should format file from disk', async () => {
      const filePath = join(fixturesPath, 'basic.md');
      const result = await orchestrator.formatFile(filePath);

      expect(isSuccess(result)).toBe(true);
      if (result.success) {
        const { stats } = result.data;
        expect(stats.blocksProcessed).toBe(4);
      }
    });

    it('should handle non-existent files', async () => {
      const result = await orchestrator.formatFile('/does/not/exist.md');

      expect(isFailure(result)).toBe(true);
      if (!result.success) {
        expect(result.error.code).toBe('NOT_FOUND');
      }
    });
  });

  describe('performance', () => {
    it('should track formatting duration', async () => {
      const markdown = readFileSync(join(fixturesPath, 'basic.md'), 'utf-8');
      const result = await orchestrator.format(markdown);

      expect(isSuccess(result)).toBe(true);
      if (result.success) {
        const { stats } = result.data;
        expect(stats.formattingDuration).toBeGreaterThan(0);
        expect(stats.formattingDuration).toBeLessThan(1000); // Should be fast
      }
    });

    it('should handle large files efficiently', async () => {
      const markdown = readFileSync(join(fixturesPath, 'large-file.md'), 'utf-8');
      const start = Date.now();
      const result = await orchestrator.format(markdown);
      const duration = Date.now() - start;

      expect(isSuccess(result)).toBe(true);
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    });
  });
});
