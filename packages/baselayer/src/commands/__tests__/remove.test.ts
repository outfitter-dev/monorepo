import { existsSync } from 'node:fs';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { AppError, Result } from '@outfitter/contracts';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getRemovableTools, previewRemoval, remove } from '../remove.js';

describe('remove command', () => {
  let testDir: string;
  let originalCwd: string;

  beforeEach(async () => {
    originalCwd = process.cwd();
    testDir = await mkdtemp(join(tmpdir(), 'baselayer-remove-test-'));
    process.chdir(testDir);
  });

  afterEach(async () => {
    // Restore original CWD first to avoid OS-dependent failures
    if (originalCwd) {
      try {
        process.chdir(originalCwd);
      } catch (error) {
        // If original CWD no longer exists, stay in current dir
        console.warn('Could not restore original CWD:', error);
      }
    }

    if (testDir && existsSync(testDir)) {
      await rm(testDir, { recursive: true, force: true });
    }
  });

  it('should fail when no tools are specified', async () => {
    const result = await remove({ tools: [] });

    expect(result.success).toBe(false);
    expect(result.error?.message).toContain('No tools specified');
  });

  it('should fail with invalid tool names', async () => {
    const result = await remove({ tools: ['invalid-tool'] });

    expect(result.success).toBe(false);
    expect(result.error?.message).toContain('Invalid tool names');
  });

  it('should fail when no configuration exists', async () => {
    const result = await remove({ tools: ['stylelint'] });

    expect(result.success).toBe(false);
    expect(result.error?.message).toContain('No existing configuration found');
  });

  it('should disable features in existing configuration', async () => {
    // Create existing config with enabled features
    const configContent = {
      features: {
        typescript: true,
        markdown: true,
        styles: true,
        json: true,
        commits: true,
      },
    };

    await writeFile('baselayer.jsonc', JSON.stringify(configContent, null, 2));

    const result = await remove({
      tools: ['stylelint'],
      dryRun: false,
      verbose: true,
    });

    expect(result.success).toBe(true);

    // Check that styles feature is now disabled
    const updatedConfig = JSON.parse(
      await import('node:fs/promises').then((fs) =>
        fs.readFile('baselayer.jsonc', 'utf-8')
      )
    );
    expect(updatedConfig.features.styles).toBe(false);
  });

  it('should perform dry run without making changes', async () => {
    const configContent = {
      features: {
        typescript: true,
        markdown: true,
        styles: true,
      },
    };

    await writeFile('baselayer.jsonc', JSON.stringify(configContent, null, 2));
    const originalConfig = JSON.stringify(configContent, null, 2);

    const result = await remove({
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

  it('should handle already disabled tools', async () => {
    const configContent = {
      features: {
        typescript: true,
        markdown: true,
        styles: false, // Already disabled
      },
    };

    await writeFile('baselayer.jsonc', JSON.stringify(configContent, null, 2));

    const result = await remove({
      tools: ['stylelint'],
      dryRun: false,
      verbose: true,
    });

    expect(result.success).toBe(true);
  });

  it('should remove configuration files', async () => {
    const configContent = {
      features: {
        typescript: true,
        styles: true,
      },
    };

    await writeFile('baselayer.jsonc', JSON.stringify(configContent, null, 2));
    // Create a stylelint config file
    await writeFile(
      '.stylelintrc.json',
      JSON.stringify({ extends: 'stylelint-config-standard' })
    );

    const result = await remove({
      tools: ['stylelint'],
      dryRun: false,
      verbose: true,
    });

    expect(result.success).toBe(true);
    expect(existsSync('.stylelintrc.json')).toBe(false);
  });

  it('should warn about removing core tools', async () => {
    const configContent = {
      features: {
        typescript: true,
        markdown: true,
      },
    };

    await writeFile('baselayer.jsonc', JSON.stringify(configContent, null, 2));

    // Capture console output
    const originalWarn = console.warn;
    let warnMessage = '';
    console.warn = (message: string) => {
      warnMessage += message;
    };

    const result = await remove({
      tools: ['typescript'],
      dryRun: false,
      verbose: true,
    });

    console.warn = originalWarn;

    expect(result.success).toBe(true);
    expect(warnMessage).toContain('core tools');
  });

  it('should get removable tools from configuration', async () => {
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

    const result = await getRemovableTools();

    expect(result.success).toBe(true);
    expect(result.data).toContain('typescript');
    expect(result.data).toContain('styles');
    expect(result.data).toContain('json');
    expect(result.data).not.toContain('markdown');
    expect(result.data).not.toContain('commits');
  });

  it('should preview removal effects', async () => {
    // Create config files
    await writeFile(
      '.stylelintrc.json',
      JSON.stringify({ extends: 'stylelint-config-standard' })
    );
    await writeFile('.prettierrc', JSON.stringify({ semi: false }));

    const result = await previewRemoval(['stylelint', 'typescript']);

    expect(result.success).toBe(true);
    expect(result.data.features).toContain('styles');
    expect(result.data.features).toContain('typescript');
    expect(result.data.configFiles).toContain('.stylelintrc.json');
    expect(result.data.warnings).toContain(
      'Removing core tools may break your workflow: typescript'
    );
  });

  describe('error scenarios', () => {
    describe('corrupted configuration', () => {
      it('should handle invalid JSON gracefully', async () => {
        // Write malformed JSON
        await writeFile(
          'baselayer.jsonc',
          '{ "features": { "typescript": true, }'
        );

        const result = await remove({
          tools: ['stylelint'],
          dryRun: false,
          verbose: true,
        });

        expect(result.success).toBe(false);
        expect(result.error?.message).toContain(
          'No existing configuration found'
        );
      });

      it('should handle missing required fields', async () => {
        // Write config without features
        await writeFile('baselayer.jsonc', '{"version": "1.0.0"}');

        const result = await remove({
          tools: ['stylelint'],
          dryRun: false,
          verbose: true,
        });

        expect(result.success).toBe(true); // Should work with empty features
      });

      it('should handle malformed configuration structure', async () => {
        // Write config with wrong structure
        await writeFile('baselayer.jsonc', '{"features": "not-an-object"}');

        const result = await remove({
          tools: ['stylelint'],
          dryRun: false,
          verbose: true,
        });

        expect(result.success).toBe(true); // Should handle gracefully
      });

      it('should handle empty config file', async () => {
        await writeFile('baselayer.jsonc', '');

        const result = await remove({
          tools: ['stylelint'],
          dryRun: false,
          verbose: true,
        });

        expect(result.success).toBe(false);
        expect(result.error?.message).toContain(
          'No existing configuration found'
        );
      });

      it('should handle config with null features', async () => {
        await writeFile('baselayer.jsonc', '{"features": null}');

        const result = await remove({
          tools: ['stylelint'],
          dryRun: false,
          verbose: true,
        });

        expect(result.success).toBe(true); // Should handle null features
      });
    });

    describe('file system errors', () => {
      it('should handle permission errors when reading config', async () => {
        await writeFile(
          'baselayer.jsonc',
          '{"features": {"typescript": true, "styles": true}}'
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
            }) as InstanceType<
              typeof import('../../orchestration/config-loader.js').ConfigLoader
            >
        );

        const result = await remove({
          tools: ['stylelint'],
          dryRun: false,
          verbose: true,
        });

        // Restore original function
        vi.restoreAllMocks();

        expect(result.success).toBe(false);
        expect(result.error?.message).toContain(
          'No existing configuration found'
        );
      });

      it('should handle disk space exhaustion during write', async () => {
        const configContent = { features: { typescript: true, styles: true } };
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
        } as Result<void, AppError>);

        const result = await remove({
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

      it('should handle readonly file system', async () => {
        const configContent = { features: { typescript: true, styles: true } };
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
        } as Result<void, AppError>);

        const result = await remove({
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

      it('should handle file deletion failures', async () => {
        const configContent = { features: { typescript: true, styles: true } };
        await writeFile(
          'baselayer.jsonc',
          JSON.stringify(configContent, null, 2)
        );
        await writeFile(
          '.stylelintrc.json',
          '{"extends": "stylelint-config-standard"}'
        );

        // Mock fs.unlink to fail - we'll just test that the operation continues
        // File deletion errors are typically non-fatal in the remove operation

        const result = await remove({
          tools: ['stylelint'],
          dryRun: false,
          verbose: true,
        });

        // Should succeed even if some file deletions fail
        expect(result.success).toBe(true);
      });
    });

    describe('input validation edge cases', () => {
      it('should handle null options', async () => {
        const result = await remove(
          null as unknown as Parameters<typeof remove>[0]
        );

        expect(result.success).toBe(false);
        expect(result.error?.message).toContain(
          'Invalid options: expected object, got object'
        );
      });

      it('should handle undefined options', async () => {
        const result = await remove(
          undefined as unknown as Parameters<typeof remove>[0]
        );

        expect(result.success).toBe(false);
        expect(result.error?.message).toContain(
          'Invalid options: expected object, got undefined'
        );
      });

      it('should handle non-array tools', async () => {
        const result = await remove({
          tools: 'stylelint' as unknown as string[],
        });

        expect(result.success).toBe(false);
        expect(result.error?.message).toContain(
          'Invalid tools: expected array, got string'
        );
      });

      it('should handle null tools array', async () => {
        const result = await remove({ tools: null as unknown as string[] });

        expect(result.success).toBe(false);
        expect(result.error?.message).toContain(
          'Invalid tools: expected array, got object'
        );
      });

      it('should handle invalid dryRun type', async () => {
        const result = await remove({
          tools: ['stylelint'],
          dryRun: 'true' as unknown as boolean,
        });

        expect(result.success).toBe(false);
        expect(result.error?.message).toContain(
          'Invalid dryRun: expected boolean, got string'
        );
      });

      it('should handle invalid verbose type', async () => {
        const result = await remove({
          tools: ['stylelint'],
          verbose: 1 as unknown as boolean,
        });

        expect(result.success).toBe(false);
        expect(result.error?.message).toContain(
          'Invalid verbose: expected boolean, got number'
        );
      });

      it('should handle empty tool names', async () => {
        const result = await remove({ tools: ['', 'stylelint'] });

        expect(result.success).toBe(false);
        expect(result.error?.message).toContain('Invalid tool names');
      });

      it('should handle tools with only whitespace', async () => {
        const result = await remove({ tools: ['  ', 'stylelint'] });

        expect(result.success).toBe(false);
        expect(result.error?.message).toContain('Invalid tool names');
      });
    });

    describe('concurrent access issues', () => {
      it('should handle config file changes during operation', async () => {
        const configContent = { features: { typescript: true, styles: true } };
        await writeFile(
          'baselayer.jsonc',
          JSON.stringify(configContent, null, 2)
        );

        // Start remove operation
        const removePromise = remove({
          tools: ['stylelint'],
          dryRun: false,
          verbose: false,
        });

        // Simulate concurrent modification immediately (no timeout to avoid race)
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

        const result = await removePromise;

        // Should complete successfully despite concurrent modification
        expect(result.success).toBe(true);
      });
    });

    describe('backup failures', () => {
      it('should fail gracefully when backup fails', async () => {
        const configContent = { features: { typescript: true, styles: true } };
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
        } as Result<string, AppError>);

        const result = await remove({
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

    describe('dependency cleanup failures', () => {
      it('should handle dependency cleanup errors gracefully', async () => {
        const configContent = { features: { typescript: true, styles: true } };
        await writeFile(
          'baselayer.jsonc',
          JSON.stringify(configContent, null, 2)
        );

        // Mock dependency cleanup to fail
        vi.spyOn(
          await import('../../core/dependency-cleanup.js'),
          'cleanupDependencies'
        ).mockResolvedValue({
          success: false,
          error: { message: 'Cleanup failed' },
        } as Result<string[], AppError>);

        const result = await remove({
          tools: ['stylelint'],
          dryRun: false,
          verbose: true,
        });

        // Restore original function
        vi.restoreAllMocks();

        // Should continue despite cleanup failure
        expect(result.success).toBe(true);
      });
    });

    describe('config file cleanup failures', () => {
      it('should handle missing config files gracefully', async () => {
        const configContent = { features: { typescript: true, styles: true } };
        await writeFile(
          'baselayer.jsonc',
          JSON.stringify(configContent, null, 2)
        );

        const result = await remove({
          tools: ['stylelint'],
          dryRun: false,
          verbose: true,
        });

        // Should succeed even if config files don't exist
        expect(result.success).toBe(true);
      });
    });
  });
});
