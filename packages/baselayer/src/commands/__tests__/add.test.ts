import { existsSync } from 'node:fs';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { add, getEnabledTools, listAvailableTools } from '../add.js';

describe('add command', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = await mkdtemp(join(tmpdir(), 'baselayer-add-test-'));
    process.chdir(testDir);
  });

  afterEach(async () => {
    if (testDir && existsSync(testDir)) {
      await rm(testDir, { recursive: true, force: true });
    }
  });

  it('should fail when no tools are specified', async () => {
    const result = await add({ tools: [] });

    expect(result.success).toBe(false);
    expect(result.error?.message).toContain('No tools specified');
  });

  it('should fail with invalid tool names', async () => {
    const result = await add({ tools: ['invalid-tool'] });

    expect(result.success).toBe(false);
    expect(result.error?.message).toContain('Invalid tool names');
  });

  it('should create new configuration when none exists', async () => {
    const result = await add({
      tools: ['stylelint'],
      dryRun: false,
      verbose: true,
    });

    expect(result.success).toBe(true);
    expect(existsSync('baselayer.jsonc')).toBe(true);
  });

  it('should update existing configuration', async () => {
    // Create existing config
    const configContent = {
      features: {
        typescript: true,
        markdown: true,
        styles: false,
        json: true,
        commits: true,
      },
    };

    await writeFile('baselayer.jsonc', JSON.stringify(configContent, null, 2));

    const result = await add({
      tools: ['stylelint'],
      dryRun: false,
      verbose: true,
    });

    expect(result.success).toBe(true);

    // Check that styles feature is now enabled
    const updatedConfig = JSON.parse(
      await import('node:fs/promises').then((fs) =>
        fs.readFile('baselayer.jsonc', 'utf-8')
      )
    );
    expect(updatedConfig.features.styles).toBe(true);
  });

  it('should perform dry run without making changes', async () => {
    const configContent = {
      features: {
        typescript: true,
        markdown: true,
        styles: false,
      },
    };

    await writeFile('baselayer.jsonc', JSON.stringify(configContent, null, 2));
    const originalConfig = JSON.stringify(configContent, null, 2);

    const result = await add({
      tools: ['stylelint'],
      dryRun: true,
      verbose: true,
    });

    expect(result.success).toBe(true);

    // Config should not have changed in dry run
    const updatedConfig = await import('node:fs/promises').then((fs) =>
      fs.readFile('baselayer.jsonc', 'utf-8')
    );
    expect(updatedConfig).toBe(originalConfig);
  });

  it('should handle already enabled tools', async () => {
    const configContent = {
      features: {
        typescript: true,
        markdown: true,
        styles: true, // Already enabled
      },
    };

    await writeFile('baselayer.jsonc', JSON.stringify(configContent, null, 2));

    const result = await add({
      tools: ['stylelint'],
      dryRun: false,
      verbose: true,
    });

    expect(result.success).toBe(true);
  });

  it('should list available tools', () => {
    const result = listAvailableTools();

    expect(result.success).toBe(true);
    expect(result.data).toContain('biome');
    expect(result.data).toContain('prettier');
    expect(result.data).toContain('stylelint');
    expect(result.data).toContain('markdownlint');
    expect(result.data).toContain('lefthook');
  });

  it('should get enabled tools from configuration', async () => {
    const configContent = {
      features: {
        typescript: true,
        markdown: false,
        styles: true,
        json: true,
        commits: false,
      },
    };

    await writeFile('baselayer.jsonc', JSON.stringify(configContent, null, 2));

    const result = await getEnabledTools();

    expect(result.success).toBe(true);
    expect(result.data).toContain('typescript');
    expect(result.data).toContain('styles');
    expect(result.data).toContain('json');
    expect(result.data).not.toContain('markdown');
    expect(result.data).not.toContain('commits');
  });

  describe('error scenarios', () => {
    describe('corrupted configuration', () => {
      it('should handle invalid JSON gracefully', async () => {
        // Write malformed JSON
        await writeFile(
          'baselayer.jsonc',
          '{ "features": { "typescript": true, }'
        );

        const result = await add({
          tools: ['stylelint'],
          dryRun: false,
          verbose: true,
        });

        expect(result.success).toBe(true); // Should create new config
        expect(existsSync('baselayer.jsonc')).toBe(true);
      });

      it('should handle missing required fields', async () => {
        // Write config without features
        await writeFile('baselayer.jsonc', '{"version": "1.0.0"}');

        const result = await add({
          tools: ['stylelint'],
          dryRun: false,
          verbose: true,
        });

        expect(result.success).toBe(true); // Should merge with defaults
      });

      it('should handle malformed configuration structure', async () => {
        // Write config with wrong structure
        await writeFile('baselayer.jsonc', '{"features": "not-an-object"}');

        const result = await add({
          tools: ['stylelint'],
          dryRun: false,
          verbose: true,
        });

        expect(result.success).toBe(true); // Should use defaults
      });

      it('should handle empty config file', async () => {
        await writeFile('baselayer.jsonc', '');

        const result = await add({
          tools: ['stylelint'],
          dryRun: false,
          verbose: true,
        });

        expect(result.success).toBe(true); // Should create new config
      });

      it('should handle config with null features', async () => {
        await writeFile('baselayer.jsonc', '{"features": null}');

        const result = await add({
          tools: ['stylelint'],
          dryRun: false,
          verbose: true,
        });

        expect(result.success).toBe(true); // Should use defaults
      });
    });

    describe('file system errors', () => {
      it('should handle permission errors when reading config', async () => {
        // Create config file first
        await writeFile(
          'baselayer.jsonc',
          '{"features": {"typescript": true}}'
        );

        // Mock ConfigLoader to simulate permission error
        const { ConfigLoader } = await import(
          '../../orchestration/config-loader.js'
        );
        const _originalLoadConfig = ConfigLoader.prototype.loadConfig;

        vi.spyOn(ConfigLoader.prototype, 'loadConfig').mockResolvedValue({
          success: false,
          error: { message: 'Permission denied', code: 'CONFIG_LOAD_FAILED' },
        } as any);

        const result = await add({
          tools: ['stylelint'],
          dryRun: false,
          verbose: true,
        });

        // Restore original function
        vi.restoreAllMocks();

        expect(result.success).toBe(true); // Should fall back to default config
      });

      it('should handle disk space exhaustion during write', async () => {
        const configContent = { features: { typescript: true } };
        await writeFile(
          'baselayer.jsonc',
          JSON.stringify(configContent, null, 2)
        );

        // Mock writeJSON to fail with disk space error
        const { writeJSON } = await import('../../utils/file-system.js');
        vi.spyOn(
          await import('../../utils/file-system.js'),
          'writeJSON'
        ).mockResolvedValue({
          success: false,
          error: { message: 'No space left on device', code: 'ENOSPC' },
        } as any);

        const result = await add({
          tools: ['stylelint'],
          dryRun: false,
          verbose: true,
        });

        // Restore original function
        vi.restoreAllMocks();

        expect(result.success).toBe(false);
        expect(result.error?.message).toContain(
          'Failed to write updated config'
        );
      });

      it('should handle missing parent directories', async () => {
        // Change to non-existent directory
        const originalCwd = process.cwd();
        try {
          process.chdir('/tmp/non-existent-directory-12345');

          const result = await add({
            tools: ['stylelint'],
            dryRun: false,
            verbose: true,
          });

          expect(result.success).toBe(true); // Should handle gracefully
        } catch (error) {
          // If chdir fails, that's expected
          expect((error as Error).message).toContain(
            'no such file or directory'
          );
        } finally {
          process.chdir(originalCwd);
        }
      });

      it('should handle readonly file system', async () => {
        const configContent = { features: { typescript: true } };
        await writeFile(
          'baselayer.jsonc',
          JSON.stringify(configContent, null, 2)
        );

        // Mock writeJSON to fail with readonly error
        vi.spyOn(
          await import('../../utils/file-system.js'),
          'writeJSON'
        ).mockResolvedValue({
          success: false,
          error: { message: 'Read-only file system', code: 'EROFS' },
        } as any);

        const result = await add({
          tools: ['stylelint'],
          dryRun: false,
          verbose: true,
        });

        // Restore original function
        vi.restoreAllMocks();

        expect(result.success).toBe(false);
        expect(result.error?.message).toContain(
          'Failed to write updated config'
        );
      });
    });

    describe('generator failures', () => {
      it('should handle generator exceptions gracefully', async () => {
        const configContent = { features: { typescript: true } };
        await writeFile(
          'baselayer.jsonc',
          JSON.stringify(configContent, null, 2)
        );

        // Mock stylelint generator to throw
        const toolsModule = await import('../../constants/tools.js');
        const originalGenerator = toolsModule.TOOL_GENERATORS.stylelint;

        // Replace the generator function temporarily
        toolsModule.TOOL_GENERATORS.stylelint = () => {
          throw new Error('Generator crashed');
        };

        const result = await add({
          tools: ['stylelint'],
          dryRun: false,
          verbose: true,
        });

        // Restore original generator
        toolsModule.TOOL_GENERATORS.stylelint = originalGenerator;

        expect(result.success).toBe(true); // Should continue despite generator failure
        expect(existsSync('baselayer.jsonc')).toBe(true);
      });

      it('should handle async generator failures', async () => {
        const configContent = { features: { typescript: true } };
        await writeFile(
          'baselayer.jsonc',
          JSON.stringify(configContent, null, 2)
        );

        // Mock stylelint generator to return failure
        const toolsModule = await import('../../constants/tools.js');
        const originalGenerator = toolsModule.TOOL_GENERATORS.stylelint;

        toolsModule.TOOL_GENERATORS.stylelint = async () => {
          return { success: false, error: { message: 'Generator failed' } };
        };

        const result = await add({
          tools: ['stylelint'],
          dryRun: false,
          verbose: true,
        });

        // Restore original generator
        toolsModule.TOOL_GENERATORS.stylelint = originalGenerator;

        expect(result.success).toBe(true); // Should continue despite generator failure
      });

      it('should handle generator network failures', async () => {
        const configContent = { features: { typescript: true } };
        await writeFile(
          'baselayer.jsonc',
          JSON.stringify(configContent, null, 2)
        );

        // Mock biome generator to throw network error
        const toolsModule = await import('../../constants/tools.js');
        const originalGenerator = toolsModule.TOOL_GENERATORS.biome;

        toolsModule.TOOL_GENERATORS.biome = async () => {
          const error = new Error('Network error') as NodeJS.ErrnoException;
          error.code = 'ENOTFOUND';
          throw error;
        };

        const result = await add({
          tools: ['biome'],
          dryRun: false,
          verbose: true,
        });

        // Restore original generator
        toolsModule.TOOL_GENERATORS.biome = originalGenerator;

        expect(result.success).toBe(true); // Should continue despite network failure
      });
    });

    describe('input validation edge cases', () => {
      it('should handle null options', async () => {
        const result = await add(null as any);

        expect(result.success).toBe(false);
        expect(result.error?.message).toContain(
          'Invalid options: expected object, got object'
        );
      });

      it('should handle undefined options', async () => {
        const result = await add(undefined as any);

        expect(result.success).toBe(false);
        expect(result.error?.message).toContain(
          'Invalid options: expected object, got undefined'
        );
      });

      it('should handle non-array tools', async () => {
        const result = await add({ tools: 'stylelint' as any });

        expect(result.success).toBe(false);
        expect(result.error?.message).toContain(
          'Invalid tools: expected array, got string'
        );
      });

      it('should handle null tools array', async () => {
        const result = await add({ tools: null as any });

        expect(result.success).toBe(false);
        expect(result.error?.message).toContain(
          'Invalid tools: expected array, got object'
        );
      });

      it('should handle invalid dryRun type', async () => {
        const result = await add({
          tools: ['stylelint'],
          dryRun: 'true' as any,
        });

        expect(result.success).toBe(false);
        expect(result.error?.message).toContain(
          'Invalid dryRun: expected boolean, got string'
        );
      });

      it('should handle invalid verbose type', async () => {
        const result = await add({
          tools: ['stylelint'],
          verbose: 1 as any,
        });

        expect(result.success).toBe(false);
        expect(result.error?.message).toContain(
          'Invalid verbose: expected boolean, got number'
        );
      });

      it('should handle empty tool names', async () => {
        const result = await add({ tools: ['', 'stylelint'] });

        expect(result.success).toBe(false);
        expect(result.error?.message).toContain('Invalid tool names');
      });

      it('should handle tools with only whitespace', async () => {
        const result = await add({ tools: ['  ', 'stylelint'] });

        expect(result.success).toBe(false);
        expect(result.error?.message).toContain('Invalid tool names');
      });
    });

    describe('concurrent access issues', () => {
      it('should handle config file changes during operation', async () => {
        const configContent = { features: { typescript: true } };
        await writeFile(
          'baselayer.jsonc',
          JSON.stringify(configContent, null, 2)
        );

        // Start add operation
        const addPromise = add({
          tools: ['stylelint'],
          dryRun: false,
          verbose: false,
        });

        // Simulate concurrent modification
        setTimeout(async () => {
          const newContent = {
            features: { typescript: false, markdown: true },
          };
          try {
            await writeFile(
              'baselayer.jsonc',
              JSON.stringify(newContent, null, 2)
            );
          } catch (_error) {
            // Ignore write errors during race condition
          }
        }, 10);

        const result = await addPromise;

        // Should complete successfully despite concurrent modification
        expect(result.success).toBe(true);
      });
    });

    describe('backup failures', () => {
      it('should fail gracefully when backup fails', async () => {
        const configContent = { features: { typescript: true } };
        await writeFile(
          'baselayer.jsonc',
          JSON.stringify(configContent, null, 2)
        );

        // Mock backup to fail
        vi.spyOn(
          await import('../../utils/file-system.js'),
          'backupFile'
        ).mockResolvedValue({
          success: false,
          error: { message: 'Backup failed' },
        } as any);

        const result = await add({
          tools: ['stylelint'],
          dryRun: false,
          verbose: true,
        });

        // Restore original function
        vi.restoreAllMocks();

        expect(result.success).toBe(false);
        expect(result.error?.message).toContain(
          'Failed to backup current config'
        );
      });
    });
  });
});
