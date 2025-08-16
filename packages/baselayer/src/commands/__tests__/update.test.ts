import { existsSync } from 'node:fs';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Result } from '@outfitter/contracts';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { FileSystemError } from '../../utils/file-system.js';
import { checkUpdateAvailable, update } from '../update.js';

describe('update command', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = await mkdtemp(join(tmpdir(), 'baselayer-update-test-'));
    process.chdir(testDir);
  });

  afterEach(async () => {
    if (testDir && existsSync(testDir)) {
      await rm(testDir, { recursive: true, force: true });
    }
  });

  it('should handle missing configuration with default config', async () => {
    const result = await update({ dryRun: true, verbose: false });

    // Should succeed with default config when no configuration exists
    expect(result.success).toBe(true);
  });

  it('should create backup and update configuration', async () => {
    // Create a basic baselayer.jsonc
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

    const result = await update({ dryRun: false, verbose: true });

    expect(result.success).toBe(true);
    expect(existsSync('baselayer.jsonc')).toBe(true);
  });

  it('should perform dry run without making changes', async () => {
    const configContent = {
      features: {
        typescript: true,
        markdown: false,
      },
    };

    await writeFile('baselayer.jsonc', JSON.stringify(configContent, null, 2));
    const originalConfig = JSON.stringify(configContent, null, 2);

    const result = await update({ dryRun: true, verbose: true });

    expect(result.success).toBe(true);

    // Config should not have changed in dry run
    const updatedConfig = await import('node:fs/promises').then((fs) =>
      fs.readFile('baselayer.jsonc', 'utf-8')
    );
    expect(updatedConfig).toBe(originalConfig);
  });

  it('should check if update is available', async () => {
    // No config file
    let result = await checkUpdateAvailable();
    expect(result.success).toBe(true);
    expect(result.data).toBe(false); // No config to update

    // Config with old schema
    const oldConfig = {
      features: {
        typescript: true,
        markdown: true,
      },
    };

    await writeFile('baselayer.jsonc', JSON.stringify(oldConfig, null, 2));

    result = await checkUpdateAvailable();
    expect(result.success).toBe(true);
    expect(result.data).toBe(true); // Update available
  });

  describe('error scenarios', () => {
    describe('corrupted configuration', () => {
      it('should handle invalid JSON gracefully', async () => {
        // Write malformed JSON
        await writeFile(
          'baselayer.jsonc',
          '{ "features": { "typescript": true, }'
        );

        const result = await update({
          dryRun: false,
          verbose: true,
        });

        expect(result.success).toBe(true); // Should create new config with defaults
        expect(existsSync('baselayer.jsonc')).toBe(true);
      });

      it('should handle missing required fields', async () => {
        // Write config without features
        await writeFile('baselayer.jsonc', '{"version": "1.0.0"}');

        const result = await update({
          dryRun: false,
          verbose: true,
        });

        expect(result.success).toBe(true); // Should merge with defaults
      });

      it('should handle malformed configuration structure', async () => {
        // Write config with wrong structure
        await writeFile('baselayer.jsonc', '{"features": "not-an-object"}');

        const result = await update({
          dryRun: false,
          verbose: true,
        });

        expect(result.success).toBe(true); // Should use defaults
      });

      it('should handle empty config file', async () => {
        await writeFile('baselayer.jsonc', '');

        const result = await update({
          dryRun: false,
          verbose: true,
        });

        expect(result.success).toBe(true); // Should create new config
      });

      it('should handle config with null features', async () => {
        await writeFile('baselayer.jsonc', '{"features": null}');

        const result = await update({
          dryRun: false,
          verbose: true,
        });

        expect(result.success).toBe(true); // Should use defaults
      });

      it('should handle deeply nested malformed JSON', async () => {
        await writeFile(
          'baselayer.jsonc',
          '{"features": {"typescript": {"nested": "invalid"}}}'
        );

        const result = await update({
          dryRun: false,
          verbose: true,
        });

        expect(result.success).toBe(true); // Should handle gracefully
      });
    });

    describe('file system errors', () => {
      it('should handle permission errors when reading config', async () => {
        await writeFile(
          'baselayer.jsonc',
          '{"features": {"typescript": true}}'
        );

        // Mock ConfigLoader to simulate permission error
        vi.spyOn(
          await import('../../orchestration/config-loader.js'),
          'ConfigLoader'
        ).mockImplementation(
          () =>
            ({
              loadConfig: vi.fn().mockResolvedValue({
                success: false,
                error: {
                  message: 'Permission denied',
                  code: 'CONFIG_LOAD_FAILED',
                },
              }),
            }) as Result<void, FileSystemError>
        );

        const result = await update({
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
        vi.spyOn(
          await import('../../utils/file-system.js'),
          'writeJSON'
        ).mockResolvedValue({
          success: false,
          error: { message: 'No space left on device', code: 'ENOSPC' },
        } as Result<void, FileSystemError>);

        const result = await update({
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
        } as Result<void, FileSystemError>);

        const result = await update({
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

      it('should handle interrupted operations', async () => {
        const configContent = { features: { typescript: true } };
        await writeFile(
          'baselayer.jsonc',
          JSON.stringify(configContent, null, 2)
        );

        // Mock writeJSON to fail with interrupted system call error
        vi.spyOn(
          await import('../../utils/file-system.js'),
          'writeJSON'
        ).mockResolvedValue({
          success: false,
          error: { message: 'Interrupted system call', code: 'EINTR' },
        } as Result<void, FileSystemError>);

        const result = await update({
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
        const configContent = { features: { typescript: true, styles: true } };
        await writeFile(
          'baselayer.jsonc',
          JSON.stringify(configContent, null, 2)
        );

        // Mock stylelint generator to throw
        const toolsModule = await import('../../constants/tools.js');
        const originalGenerator = toolsModule.TOOL_GENERATORS.stylelint;

        toolsModule.TOOL_GENERATORS.stylelint = () => {
          throw new Error('Generator crashed');
        };

        const result = await update({
          dryRun: false,
          verbose: true,
        });

        // Restore original generator
        toolsModule.TOOL_GENERATORS.stylelint = originalGenerator;

        expect(result.success).toBe(true); // Should continue despite generator failure
        expect(existsSync('baselayer.jsonc')).toBe(true);
      });

      it('should handle async generator failures', async () => {
        const configContent = { features: { typescript: true, styles: true } };
        await writeFile(
          'baselayer.jsonc',
          JSON.stringify(configContent, null, 2)
        );

        // Mock a tool generator to return failure result
        const { TOOL_GENERATORS } = await import('../../constants/tools.js');
        const originalStylelintGenerator = TOOL_GENERATORS.stylelint;

        TOOL_GENERATORS.stylelint = async () => {
          return { success: false, error: { message: 'Generator failed' } };
        };

        const result = await update({
          dryRun: false,
          verbose: true,
        });

        // Restore original generator
        TOOL_GENERATORS.stylelint = originalStylelintGenerator;

        expect(result.success).toBe(true); // Should continue despite generator failure
      });

      it('should handle multiple generator failures', async () => {
        const configContent = {
          features: {
            typescript: true,
            styles: true,
            markdown: true,
            json: true,
          },
        };
        await writeFile(
          'baselayer.jsonc',
          JSON.stringify(configContent, null, 2)
        );

        // Mock multiple tool generators to fail
        const { TOOL_GENERATORS } = await import('../../constants/tools.js');
        const originalGenerators = {
          stylelint: TOOL_GENERATORS.stylelint,
          prettier: TOOL_GENERATORS.prettier,
          markdownlint: TOOL_GENERATORS.markdownlint,
        };

        TOOL_GENERATORS.stylelint = () => {
          throw new Error('Stylelint failed');
        };
        TOOL_GENERATORS.prettier = async () => ({
          success: false,
          error: { message: 'Prettier failed' },
        });
        TOOL_GENERATORS.markdownlint = () => {
          throw new Error('Markdownlint failed');
        };

        const result = await update({
          dryRun: false,
          verbose: true,
        });

        // Restore original generators
        Object.assign(TOOL_GENERATORS, originalGenerators);

        expect(result.success).toBe(true); // Should continue despite multiple failures
      });

      it('should handle generator timeout/network failures', async () => {
        const configContent = { features: { typescript: true, json: true } };
        await writeFile(
          'baselayer.jsonc',
          JSON.stringify(configContent, null, 2)
        );

        // Mock a tool generator to throw network error
        const { TOOL_GENERATORS } = await import('../../constants/tools.js');
        const originalPrettierGenerator = TOOL_GENERATORS.prettier;

        TOOL_GENERATORS.prettier = async () => {
          const error = new Error('Network timeout') as NodeJS.ErrnoException;
          error.code = 'ETIMEDOUT';
          throw error;
        };

        const result = await update({
          dryRun: false,
          verbose: true,
        });

        // Restore original generator
        TOOL_GENERATORS.prettier = originalPrettierGenerator;

        expect(result.success).toBe(true); // Should continue despite network failure
      });
    });

    describe('input validation edge cases', () => {
      it('should handle null options', async () => {
        // Test passing null (invalid input)
        const result = await update(null as never);

        expect(result.success).toBe(false);
        expect(result.error?.message).toContain(
          'Invalid options: expected object, got object'
        );
      });

      it('should handle undefined options', async () => {
        // Test passing undefined (invalid input)
        const result = await update(undefined as never);

        expect(result.success).toBe(false);
        expect(result.error?.message).toContain(
          'Invalid options: expected object, got undefined'
        );
      });

      it('should handle invalid dryRun type', async () => {
        // Test passing invalid dryRun type
        const result = await update({ dryRun: 'true' as never });

        expect(result.success).toBe(false);
        expect(result.error?.message).toContain(
          'Invalid dryRun: expected boolean, got string'
        );
      });

      it('should handle invalid verbose type', async () => {
        // Test passing invalid verbose type
        const result = await update({ verbose: 1 as never });

        expect(result.success).toBe(false);
        expect(result.error?.message).toContain(
          'Invalid verbose: expected boolean, got number'
        );
      });

      it('should handle options with extra properties', async () => {
        // Test passing extra properties that should be ignored
        const result = await update({
          dryRun: true,
          verbose: false,
          invalidProp: 'should be ignored',
        } as never);

        expect(result.success).toBe(true); // Should ignore extra properties
      });
    });

    describe('concurrent access issues', () => {
      it('should handle config file changes during operation', async () => {
        const configContent = { features: { typescript: true } };
        await writeFile(
          'baselayer.jsonc',
          JSON.stringify(configContent, null, 2)
        );

        // Start update operation
        const updatePromise = update({
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

        const result = await updatePromise;

        // Should complete successfully despite concurrent modification
        expect(result.success).toBe(true);
      });

      it('should handle config file deletion during operation', async () => {
        const configContent = { features: { typescript: true } };
        await writeFile(
          'baselayer.jsonc',
          JSON.stringify(configContent, null, 2)
        );

        // Start update operation
        const updatePromise = update({
          dryRun: false,
          verbose: false,
        });

        // Simulate concurrent deletion
        setTimeout(async () => {
          try {
            await rm('baselayer.jsonc');
          } catch (_error) {
            // Ignore deletion errors during race condition
          }
        }, 10);

        const result = await updatePromise;

        // Should complete successfully despite file deletion
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
        } as Result<void, FileSystemError>);

        const result = await update({
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

      it('should handle backup directory permission errors', async () => {
        const configContent = { features: { typescript: true } };
        await writeFile(
          'baselayer.jsonc',
          JSON.stringify(configContent, null, 2)
        );

        // Mock backup to fail with permission error
        vi.spyOn(
          await import('../../utils/file-system.js'),
          'backupFile'
        ).mockResolvedValue({
          success: false,
          error: {
            message: 'Permission denied: cannot create backup directory',
          },
        } as Result<void, FileSystemError>);

        const result = await update({
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

    describe('migration failures', () => {
      it('should handle config migration errors gracefully', async () => {
        // Create old-style config that might cause migration issues
        const oldConfig = {
          version: '0.1.0',
          tools: ['typescript', 'eslint'], // Old format
          features: { typescript: true },
        };
        await writeFile('baselayer.jsonc', JSON.stringify(oldConfig, null, 2));

        const result = await update({
          dryRun: false,
          verbose: true,
        });

        // Should handle migration gracefully
        expect(result.success).toBe(true);
      });

      it('should handle missing migration logic', async () => {
        // Create config with unknown fields
        const unknownConfig = {
          unknownField: 'value',
          features: { typescript: true },
          experimental: { newFeature: true },
        };
        await writeFile(
          'baselayer.jsonc',
          JSON.stringify(unknownConfig, null, 2)
        );

        const result = await update({
          dryRun: false,
          verbose: true,
        });

        // Should preserve known fields and handle unknowns
        expect(result.success).toBe(true);
      });
    });

    describe('edge case scenarios', () => {
      it('should handle extremely large config files', async () => {
        // Create config with many features
        const largeConfig = {
          features: Object.fromEntries(
            Array.from({ length: 1000 }, (_, i) => [`feature${i}`, i % 2 === 0])
          ),
        };
        await writeFile(
          'baselayer.jsonc',
          JSON.stringify(largeConfig, null, 2)
        );

        const result = await update({
          dryRun: true,
          verbose: false,
        });

        expect(result.success).toBe(true);
      });

      it('should handle config files with unicode characters', async () => {
        const unicodeConfig = {
          features: {
            typescript: true,
            日本語: true, // Japanese
            العربية: false, // Arabic
            '🚀feature': true, // Emoji
          },
        };
        await writeFile(
          'baselayer.jsonc',
          JSON.stringify(unicodeConfig, null, 2)
        );

        const result = await update({
          dryRun: false,
          verbose: true,
        });

        expect(result.success).toBe(true);
      });
    });
  });
});
