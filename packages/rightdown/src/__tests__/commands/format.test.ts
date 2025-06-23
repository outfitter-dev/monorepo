import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { mkdtempSync, rmSync } from 'fs';
import { formatCommand } from '../../commands/format.js';
import type { RightdownConfig } from '../../core/types.js';
import glob from 'fast-glob';

// Mock modules
vi.mock('../../core/config-reader.js');
vi.mock('../../core/orchestrator.js');
vi.mock('../../formatters/prettier.js');
vi.mock('../../formatters/biome.js');
vi.mock('fast-glob');

describe('formatCommand', () => {
  let tempDir: string;
  let originalCwd: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'rightdown-test-'));
    originalCwd = process.cwd();
    process.chdir(tempDir);
    vi.clearAllMocks();
  });

  afterEach(() => {
    process.chdir(originalCwd);
    rmSync(tempDir, { recursive: true, force: true });
    vi.clearAllMocks();
  });

  describe('execute', () => {
    it('should format files in dry run mode by default', async () => {
      // Create test files
      const testMd = '# Test\n\n```javascript\nconst x=1;\n```\n';
      writeFileSync('test.md', testMd);

      // Create config
      const config: RightdownConfig = {
        version: 2,
        preset: 'standard',
        formatters: {
          default: 'prettier',
        },
      };
      writeFileSync('.rightdown.config.yaml', `version: 2\npreset: standard`);

      // Mock config reader
      const { ConfigReader } = await import('../../core/config-reader.js');
      const mockRead = vi.fn().mockResolvedValue({
        success: true,
        data: config,
      });
      (ConfigReader as any).mockImplementation(() => ({
        read: mockRead,
      }));

      // Mock orchestrator
      const { Orchestrator } = await import('../../core/orchestrator.js');
      const mockFormat = vi.fn().mockResolvedValue({
        success: true,
        data: {
          content: '# Test\n\n```javascript\nconst x = 1;\n```\n',
          stats: {
            blocksProcessed: 1,
            blocksFormatted: 1,
            formattingDuration: 10,
          },
        },
      });
      (Orchestrator as any).mockImplementation(() => ({
        format: mockFormat,
      }));

      // Execute command
      await formatCommand({
        files: ['test.md'],
        write: false,
        check: false,
        config: undefined,
        $0: 'format',
        _: ['format'],
      } as any);

      // Verify file was not modified (dry run)
      const content = readFileSync('test.md', 'utf-8');
      expect(content).toBe(testMd);
      expect(mockFormat).toHaveBeenCalledWith(testMd);
    });

    it('should write formatted files with --write flag', async () => {
      // Create test file
      const testMd = '# Test\n\n```javascript\nconst x=1;\n```\n';
      const formattedMd = '# Test\n\n```javascript\nconst x = 1;\n```\n';
      writeFileSync('test.md', testMd);
      writeFileSync('.rightdown.config.yaml', `version: 2\npreset: standard`);

      // Mock config reader
      const { ConfigReader } = await import('../../core/config-reader.js');
      const mockRead = vi.fn().mockResolvedValue({
        success: true,
        data: { version: 2, preset: 'standard' },
      });
      (ConfigReader as any).mockImplementation(() => ({
        read: mockRead,
      }));

      // Mock orchestrator
      const { Orchestrator } = await import('../../core/orchestrator.js');
      const mockFormat = vi.fn().mockResolvedValue({
        success: true,
        data: {
          content: formattedMd,
          stats: {
            blocksProcessed: 1,
            blocksFormatted: 1,
            formattingDuration: 10,
          },
        },
      });
      (Orchestrator as any).mockImplementation(() => ({
        format: mockFormat,
      }));

      // Execute command with write flag
      await formatCommand({
        files: ['test.md'],
        write: true,
        check: false,
        config: undefined,
        $0: 'format',
        _: ['format'],
      } as any);

      // Verify file was modified
      const content = readFileSync('test.md', 'utf-8');
      expect(content).toBe(formattedMd);
    });

    it('should check formatting with --check flag', async () => {
      // Create test file
      const testMd = '# Test\n\n```javascript\nconst x=1;\n```\n';
      const formattedMd = '# Test\n\n```javascript\nconst x = 1;\n```\n';
      writeFileSync('test.md', testMd);
      writeFileSync('.rightdown.config.yaml', `version: 2\npreset: standard`);

      // Mock config reader
      const { ConfigReader } = await import('../../core/config-reader.js');
      const mockRead = vi.fn().mockResolvedValue({
        success: true,
        data: { version: 2, preset: 'standard' },
      });
      (ConfigReader as any).mockImplementation(() => ({
        read: mockRead,
      }));

      // Mock orchestrator
      const { Orchestrator } = await import('../../core/orchestrator.js');
      const mockFormat = vi.fn().mockResolvedValue({
        success: true,
        data: {
          content: formattedMd,
          stats: {
            blocksProcessed: 1,
            blocksFormatted: 1,
            formattingDuration: 10,
          },
        },
      });
      (Orchestrator as any).mockImplementation(() => ({
        format: mockFormat,
      }));

      // Mock console.error and process.exit
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      const processExit = vi.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
      
      // Execute command with check flag
      try {
        await formatCommand({
          files: ['test.md'],
          write: false,
          check: true,
          config: undefined,
          $0: 'format',
          _: ['format'],
        } as any);
      } catch (e) {
        // Expected
      }

      // Should exit with code 1 when formatting needed
      expect(processExit).toHaveBeenCalledWith(1);
      expect(consoleError).toHaveBeenCalledWith(expect.stringContaining('test.md'));
      
      consoleError.mockRestore();
      processExit.mockRestore();
    });

    it('should find all markdown files when no files specified', async () => {
      // Create test files
      writeFileSync('file1.md', '# File 1');
      writeFileSync('file2.md', '# File 2');
      writeFileSync('ignored.txt', 'Not markdown');
      writeFileSync('.rightdown.config.yaml', `version: 2\npreset: standard`);

      // Mock config reader
      const { ConfigReader } = await import('../../core/config-reader.js');
      const mockRead = vi.fn().mockResolvedValue({
        success: true,
        data: { version: 2, preset: 'standard' },
      });
      (ConfigReader as any).mockImplementation(() => ({
        read: mockRead,
      }));

      // Mock orchestrator
      const { Orchestrator } = await import('../../core/orchestrator.js');
      const mockFormat = vi.fn().mockResolvedValue({
        success: true,
        data: {
          content: '# Formatted',
          stats: {
            blocksProcessed: 0,
            blocksFormatted: 0,
            formattingDuration: 5,
          },
        },
      });
      (Orchestrator as any).mockImplementation(() => ({
        format: mockFormat,
      }));

      // Mock glob to return our test files
      (glob as any).mockResolvedValue(['file1.md', 'file2.md']);
      
      // Execute command
      await formatCommand({
        files: [],
        write: false,
        check: false,
        config: undefined,
        $0: 'format',
        _: ['format'],
      } as any);

      // Should have processed both .md files
      expect(mockFormat).toHaveBeenCalledTimes(2);
    });

    it('should handle missing config file', async () => {
      writeFileSync('test.md', '# Test');
      
      // Mock config reader to return not found
      const { ConfigReader } = await import('../../core/config-reader.js');
      const mockRead = vi.fn().mockResolvedValue({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Config not found' },
      });
      (ConfigReader as any).mockImplementation(() => ({
        read: mockRead,
      }));

      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      const processExit = vi.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
      
      try {
        await formatCommand({
          files: ['test.md'],
          write: false,
          check: false,
          config: undefined,
          $0: 'format',
          _: ['format'],
        } as any);
      } catch (e) {
        // Expected
      }

      expect(consoleError).toHaveBeenCalledWith(expect.stringContaining('Config not found'));
      consoleError.mockRestore();
      processExit.mockRestore();
    });

    it('should use custom config path', async () => {
      writeFileSync('test.md', '# Test');
      writeFileSync('custom.yaml', `version: 2\npreset: strict`);

      // Mock config reader
      const { ConfigReader } = await import('../../core/config-reader.js');
      const mockRead = vi.fn().mockResolvedValue({
        success: true,
        data: { version: 2, preset: 'strict' },
      });
      (ConfigReader as any).mockImplementation(() => ({
        read: mockRead,
      }));

      // Mock orchestrator
      const { Orchestrator } = await import('../../core/orchestrator.js');
      const mockFormat = vi.fn().mockResolvedValue({
        success: true,
        data: {
          content: '# Test',
          stats: {
            blocksProcessed: 0,
            blocksFormatted: 0,
            formattingDuration: 5,
          },
        },
      });
      (Orchestrator as any).mockImplementation(() => ({
        format: mockFormat,
      }));

      await formatCommand({
        files: ['test.md'],
        write: false,
        check: false,
        config: 'custom.yaml',
        $0: 'format',
        _: ['format'],
      } as any);

      expect(mockRead).toHaveBeenCalledWith('custom.yaml');
    });

    it('should handle orchestrator errors', async () => {
      writeFileSync('test.md', '# Test\n```js\nbad code\n```');
      writeFileSync('.rightdown.config.yaml', `version: 2`);

      // Mock config reader
      const { ConfigReader } = await import('../../core/config-reader.js');
      const mockRead = vi.fn().mockResolvedValue({
        success: true,
        data: { version: 2 },
      });
      (ConfigReader as any).mockImplementation(() => ({
        read: mockRead,
      }));

      // Mock orchestrator to return error
      const { Orchestrator } = await import('../../core/orchestrator.js');
      const mockFormat = vi.fn().mockResolvedValue({
        success: false,
        error: { code: 'FORMATTER_FAILED', message: 'Syntax error' },
      });
      (Orchestrator as any).mockImplementation(() => ({
        format: mockFormat,
      }));

      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      const processExit = vi.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
      
      try {
        await formatCommand({
          files: ['test.md'],
          write: false,
          check: false,
          config: undefined,
          $0: 'format',
          _: ['format'],
        } as any);
      } catch (e) {
        // Expected
      }

      expect(consoleError).toHaveBeenCalledWith(expect.stringContaining('Failed to format test.md'));
      consoleError.mockRestore();
      processExit.mockRestore();
    });

    it('should respect ignores from config', async () => {
      writeFileSync('test.md', '# Test');
      writeFileSync('ignored.md', '# Ignored');
      writeFileSync('.rightdown.config.yaml', `version: 2\nignores:\n  - ignored.md`);

      // Mock config reader
      const { ConfigReader } = await import('../../core/config-reader.js');
      const mockRead = vi.fn().mockResolvedValue({
        success: true,
        data: { 
          version: 2,
          ignores: ['ignored.md'],
        },
      });
      (ConfigReader as any).mockImplementation(() => ({
        read: mockRead,
      }));

      // Mock orchestrator
      const { Orchestrator } = await import('../../core/orchestrator.js');
      const mockFormat = vi.fn().mockResolvedValue({
        success: true,
        data: {
          content: '# Test',
          stats: {
            blocksProcessed: 0,
            blocksFormatted: 0,
            formattingDuration: 5,
          },
        },
      });
      (Orchestrator as any).mockImplementation(() => ({
        format: mockFormat,
      }));

      // Mock glob to return only test.md (ignored.md filtered out)
      (glob as any).mockResolvedValue(['test.md']);
      
      await formatCommand({
        files: [],
        write: false,
        check: false,
        config: undefined,
        $0: 'format',
        _: ['format'],
      } as any);

      // Should only process test.md, not ignored.md
      expect(mockFormat).toHaveBeenCalledTimes(1);
      expect(mockFormat).toHaveBeenCalledWith('# Test');
    });
  });
});