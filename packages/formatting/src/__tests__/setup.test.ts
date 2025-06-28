import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { setup } from '../core/setup.js';
import { readFile, writeFile, access, constants } from 'node:fs/promises';
import * as detectionModule from '../utils/detection.js';
import * as generatorModule from '../core/generator.js';

// Mock modules
vi.mock('node:fs/promises');
vi.mock('../utils/detection.js');
vi.mock('../core/generator.js');

describe('setup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('basic setup flow', () => {
    it('should complete successful setup', async () => {
      // Mock detection
      vi.mocked(detectionModule.detectAvailableFormatters).mockResolvedValue({
        success: true,
        data: {
          formatters: [
            { type: 'prettier', available: true, version: '3.1.0', location: 'local' },
            { type: 'biome', available: true, version: '1.8.3', location: 'local' },
          ],
          available: ['prettier', 'biome'],
          missing: ['remark'],
        },
      });

      // Mock config generation
      vi.mocked(generatorModule.generateConfigs).mockResolvedValue({
        success: true,
        data: [
          { path: '.prettierrc.json', content: '{}', formatter: 'prettier', generated: true },
          { path: 'biome.json', content: '{}', formatter: 'biome', generated: true },
        ],
      });

      // Mock package.json scripts
      vi.mocked(generatorModule.generatePackageJsonScripts).mockReturnValue({
        format: 'pnpm format:prettier && pnpm format:biome',
        'format:prettier': 'prettier --write .',
        'format:biome': 'biome format --write .',
      });

      // Mock file operations
      vi.mocked(access).mockImplementation(async (path) => {
        // package.json exists, config files don't
        if (path.toString().includes('package.json')) {
          return undefined;
        }
        throw new Error('Not found');
      });
      vi.mocked(writeFile).mockResolvedValue(undefined);

      // Mock package.json
      vi.mocked(readFile).mockResolvedValue(
        JSON.stringify({
          name: 'test-project',
          scripts: {},
        }),
      );

      const result = await setup({
        preset: 'standard',
        verbose: true,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.success).toBe(true);
        expect(result.data.configs).toHaveLength(2);
        expect(result.data.scripts).toHaveProperty('format');
        expect(result.data.info).toContain('Using preset: standard');
        expect(result.data.info).toContain('Available formatters: prettier, biome');
        expect(result.data.info).toContain('Setup completed successfully for 2 formatter(s)');
      }

      // Verify file writes
      expect(writeFile).toHaveBeenCalledTimes(3); // 2 configs + 1 package.json

      // Verify package.json was updated
      expect(writeFile).toHaveBeenCalledWith(
        expect.stringContaining('package.json'),
        expect.stringContaining('"format"'),
        'utf-8',
      );
    });

    it('should handle no available formatters', async () => {
      vi.mocked(detectionModule.detectAvailableFormatters).mockResolvedValue({
        success: true,
        data: {
          formatters: [],
          available: [],
          missing: ['prettier', 'biome', 'remark'],
        },
      });

      const result = await setup({});

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.success).toBe(true);
        expect(result.data.warnings).toContain('No formatters available for setup');
        expect(result.data.info).toContain(
          'Consider installing formatters or use --install-missing flag',
        );
        expect(result.data.configs).toHaveLength(0);
      }
    });

    it('should skip existing config files', async () => {
      vi.mocked(detectionModule.detectAvailableFormatters).mockResolvedValue({
        success: true,
        data: {
          formatters: [{ type: 'prettier', available: true, version: '3.1.0', location: 'local' }],
          available: ['prettier'],
          missing: [],
        },
      });

      vi.mocked(generatorModule.generateConfigs).mockResolvedValue({
        success: true,
        data: [{ path: '.prettierrc.json', content: '{}', formatter: 'prettier', generated: true }],
      });

      // Config file already exists
      vi.mocked(access).mockResolvedValueOnce(undefined);

      const result = await setup({});

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.warnings).toContain('File already exists: .prettierrc.json (skipping)');
        expect(result.data.configs).toHaveLength(0);
      }

      expect(writeFile).not.toHaveBeenCalled();
    });

    it('should handle dry run mode', async () => {
      vi.mocked(detectionModule.detectAvailableFormatters).mockResolvedValue({
        success: true,
        data: {
          formatters: [{ type: 'prettier', available: true, version: '3.1.0', location: 'local' }],
          available: ['prettier'],
          missing: [],
        },
      });

      vi.mocked(generatorModule.generateConfigs).mockResolvedValue({
        success: true,
        data: [{ path: '.prettierrc.json', content: '{}', formatter: 'prettier', generated: true }],
      });

      vi.mocked(generatorModule.generatePackageJsonScripts).mockReturnValue({
        format: 'prettier --write .',
      });

      vi.mocked(access).mockRejectedValue(new Error('Not found'));

      const result = await setup({ dryRun: true });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.info).toContain('Would generate: .prettierrc.json');
        expect(result.data.info).toContain('Would update package.json scripts');
      }

      expect(writeFile).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should handle invalid options', async () => {
      const result = await setup({
        preset: 'invalid' as any,
        formatters: ['unknown'] as any,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
        expect(result.error.message).toContain('Invalid setup options');
      }
    });

    it('should handle detection failure', async () => {
      vi.mocked(detectionModule.detectAvailableFormatters).mockResolvedValue({
        success: false,
        error: makeError('INTERNAL_ERROR', 'Detection failed'),
      });

      const result = await setup({});

      expect(result.success).toBe(true); // Setup continues but reports error
      if (result.success) {
        expect(result.data.success).toBe(false);
        expect(result.data.errors).toContain('Failed to detect formatters: Detection failed');
      }
    });

    it('should handle config generation failure', async () => {
      vi.mocked(detectionModule.detectAvailableFormatters).mockResolvedValue({
        success: true,
        data: {
          formatters: [{ type: 'prettier', available: true, version: '3.1.0', location: 'local' }],
          available: ['prettier'],
          missing: [],
        },
      });

      vi.mocked(generatorModule.generateConfigs).mockResolvedValue({
        success: false,
        error: makeError('INTERNAL_ERROR', 'Config generation failed'),
      });

      const result = await setup({});

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.success).toBe(false);
        expect(result.data.errors).toContain(
          'Failed to generate configs: Config generation failed',
        );
      }
    });

    it('should handle file write errors', async () => {
      vi.mocked(detectionModule.detectAvailableFormatters).mockResolvedValue({
        success: true,
        data: {
          formatters: [{ type: 'prettier', available: true, version: '3.1.0', location: 'local' }],
          available: ['prettier'],
          missing: [],
        },
      });

      vi.mocked(generatorModule.generateConfigs).mockResolvedValue({
        success: true,
        data: [{ path: '.prettierrc.json', content: '{}', formatter: 'prettier', generated: true }],
      });

      vi.mocked(access).mockRejectedValue(new Error('Not found'));
      vi.mocked(writeFile).mockRejectedValue(new Error('Permission denied'));

      const result = await setup({});

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.errors).toContain('Failed to write .prettierrc.json: Permission denied');
      }
    });

    it('should handle missing package.json', async () => {
      vi.mocked(detectionModule.detectAvailableFormatters).mockResolvedValue({
        success: true,
        data: {
          formatters: [{ type: 'prettier', available: true, version: '3.1.0', location: 'local' }],
          available: ['prettier'],
          missing: [],
        },
      });

      vi.mocked(generatorModule.generateConfigs).mockResolvedValue({
        success: true,
        data: [],
      });

      vi.mocked(generatorModule.generatePackageJsonScripts).mockReturnValue({
        format: 'prettier --write .',
      });

      // package.json doesn't exist
      vi.mocked(access).mockRejectedValue(new Error('Not found'));

      const result = await setup({ updateScripts: true });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.warnings).toContain(
          'Failed to update package.json: package.json not found',
        );
      }
    });

    it('should handle invalid package.json', async () => {
      vi.mocked(detectionModule.detectAvailableFormatters).mockResolvedValue({
        success: true,
        data: {
          formatters: [{ type: 'prettier', available: true, version: '3.1.0', location: 'local' }],
          available: ['prettier'],
          missing: [],
        },
      });

      vi.mocked(generatorModule.generateConfigs).mockResolvedValue({
        success: true,
        data: [],
      });

      vi.mocked(generatorModule.generatePackageJsonScripts).mockReturnValue({
        format: 'prettier --write .',
      });

      vi.mocked(access).mockResolvedValueOnce(undefined); // package.json exists
      vi.mocked(readFile).mockResolvedValue('{ invalid json }');

      const result = await setup({ updateScripts: true });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.warnings).toContain(
          'Failed to update package.json: Invalid package.json format',
        );
      }
    });
  });

  describe('formatter selection', () => {
    it('should configure only requested formatters', async () => {
      vi.mocked(detectionModule.detectAvailableFormatters).mockResolvedValue({
        success: true,
        data: {
          formatters: [
            { type: 'prettier', available: true, version: '3.1.0', location: 'local' },
            { type: 'biome', available: true, version: '1.8.3', location: 'local' },
            { type: 'remark', available: true, version: '15.0.1', location: 'local' },
          ],
          available: ['prettier', 'biome', 'remark'],
          missing: [],
        },
      });

      const mockGenerateConfigs = vi.mocked(generatorModule.generateConfigs);
      mockGenerateConfigs.mockResolvedValue({
        success: true,
        data: [{ path: '.prettierrc.json', content: '{}', formatter: 'prettier', generated: true }],
      });

      const result = await setup({
        formatters: ['prettier'], // Only configure prettier
      });

      expect(result.success).toBe(true);
      expect(mockGenerateConfigs).toHaveBeenCalledWith(['prettier'], expect.any(Object), undefined);
    });

    it('should filter unavailable requested formatters', async () => {
      vi.mocked(detectionModule.detectAvailableFormatters).mockResolvedValue({
        success: true,
        data: {
          formatters: [
            { type: 'prettier', available: true, version: '3.1.0', location: 'local' },
            { type: 'biome', available: false },
          ],
          available: ['prettier'],
          missing: ['biome', 'remark'],
        },
      });

      const mockGenerateConfigs = vi.mocked(generatorModule.generateConfigs);
      mockGenerateConfigs.mockResolvedValue({
        success: true,
        data: [],
      });

      const result = await setup({
        formatters: ['prettier', 'biome'], // Request both but only prettier available
      });

      expect(result.success).toBe(true);
      expect(mockGenerateConfigs).toHaveBeenCalledWith(['prettier'], expect.any(Object), undefined);
    });
  });
});

// Helper to create errors that match contracts
function makeError(code: string, message: string): { code: string; message: string } {
  return { code, message };
}
