import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { mkdtempSync, rmSync } from 'fs';
import { initCommand } from '../../commands/init.js';
import type { RightdownConfig } from '../../core/types.js';
import { colors } from '../../utils/colors.js';

describe('initCommand', () => {
  let tempDir: string;
  let originalCwd: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'rightdown-test-'));
    originalCwd = process.cwd();
    process.chdir(tempDir);
  });

  afterEach(() => {
    process.chdir(originalCwd);
    rmSync(tempDir, { recursive: true, force: true });
    vi.clearAllMocks();
  });

  describe('execute', () => {
    it('should create basic config with default preset', async () => {
      await initCommand({ preset: 'standard', $0: 'init', _: ['init'] } as any);

      const configPath = '.rightdown.config.yaml';
      expect(existsSync(configPath)).toBe(true);

      const content = readFileSync(configPath, 'utf-8');
      expect(content).toContain('version: 2');
      expect(content).toContain('preset: standard');
      expect(content).toContain('formatters:');
      expect(content).toContain('default: prettier');
    });

    it('should create config with strict preset', async () => {
      await initCommand({ preset: 'strict', $0: 'init', _: ['init'] } as any);

      const configPath = '.rightdown.config.yaml';
      expect(existsSync(configPath)).toBe(true);

      const content = readFileSync(configPath, 'utf-8');
      expect(content).toContain('version: 2');
      expect(content).toContain('preset: strict');
    });

    it('should create config with relaxed preset', async () => {
      await initCommand({ preset: 'relaxed', $0: 'init', _: ['init'] } as any);

      const configPath = '.rightdown.config.yaml';
      expect(existsSync(configPath)).toBe(true);

      const content = readFileSync(configPath, 'utf-8');
      expect(content).toContain('version: 2');
      expect(content).toContain('preset: relaxed');
    });

    it('should not overwrite existing config', async () => {
      const existingConfig = '# Existing config\nversion: 2\npreset: custom';
      writeFileSync('.rightdown.config.yaml', existingConfig);

      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      const processExit = vi.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
      
      try {
        await initCommand({ preset: 'standard', $0: 'init', _: ['init'] } as any);
      } catch (e) {
        // Expected
      }

      // Config should not be changed
      const content = readFileSync('.rightdown.config.yaml', 'utf-8');
      expect(content).toBe(existingConfig);
      expect(consoleError).toHaveBeenCalledWith(colors.error('Error:'), 'Configuration file already exists. Use --force to overwrite.');

      consoleError.mockRestore();
      processExit.mockRestore();
    });

    it('should create config with biome for javascript', async () => {
      await initCommand({ preset: 'standard', $0: 'init', _: ['init'] } as any);

      const content = readFileSync('.rightdown.config.yaml', 'utf-8');
      expect(content).toContain('languages:');
      expect(content).toContain('javascript: biome');
      expect(content).toContain('typescript: biome');
    });

    it('should include formatter options', async () => {
      await initCommand({ preset: 'strict', $0: 'init', _: ['init'] } as any);

      const content = readFileSync('.rightdown.config.yaml', 'utf-8');
      expect(content).toContain('formatterOptions:');
      expect(content).toContain('prettier:');
      expect(content).toContain('printWidth: 80');
      expect(content).toContain('biome:');
      expect(content).toContain('indentWidth: 2');
    });

    it('should include example rules', async () => {
      await initCommand({ preset: 'strict', $0: 'init', _: ['init'] } as any);

      const content = readFileSync('.rightdown.config.yaml', 'utf-8');
      expect(content).toContain('rules:');
      expect(content).toContain('line-length:');
    });

    it('should include example ignores', async () => {
      await initCommand({ preset: 'standard', $0: 'init', _: ['init'] } as any);

      const content = readFileSync('.rightdown.config.yaml', 'utf-8');
      expect(content).toContain('ignores:');
      expect(content).toContain('- node_modules/**');
      expect(content).toContain('- dist/**');
    });

    it('should test quiet mode', async () => {
      const consoleLog = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      await initCommand({ preset: 'standard', quiet: true, $0: 'init', _: ['init'] } as any);

      const configPath = '.rightdown.config.yaml';
      expect(existsSync(configPath)).toBe(true);
      expect(consoleLog).not.toHaveBeenCalled();

      consoleLog.mockRestore();
    });

    it('should log success message', async () => {
      const consoleLog = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      await initCommand({ preset: 'standard', $0: 'init', _: ['init'] } as any);

      expect(consoleLog).toHaveBeenCalledWith(expect.stringMatching(/Created.*\.rightdown\.config\.yaml/));

      consoleLog.mockRestore();
    });

    it('should handle write errors gracefully', async () => {
      // Make directory read-only to force write error
      const fs = await import('fs');
      const writeFileSyncSpy = vi.spyOn(fs, 'writeFileSync').mockImplementation(() => {
        throw new Error('Permission denied');
      });

      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      const processExit = vi.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
      
      try {
        await initCommand({ preset: 'standard', $0: 'init', _: ['init'] } as any);
      } catch (e) {
        // Expected
      }

      expect(consoleError).toHaveBeenCalledWith(expect.stringContaining('Failed to create config'));

      consoleError.mockRestore();
      processExit.mockRestore();
      writeFileSyncSpy.mockRestore();
    });

    it('should use proper indentation in generated YAML', async () => {
      await initCommand({ preset: 'standard', $0: 'init', _: ['init'] } as any);

      const content = readFileSync('.rightdown.config.yaml', 'utf-8');
      
      // Check proper 2-space indentation
      const lines = content.split('\n');
      const formatterLine = lines.find(l => l.trim() === 'formatters:');
      const formatterIndex = lines.indexOf(formatterLine!);
      const nextLine = lines[formatterIndex + 1];
      
      expect(nextLine.startsWith('  ')).toBe(true);
      expect(nextLine.startsWith('    ')).toBe(false);
    });
  });
});