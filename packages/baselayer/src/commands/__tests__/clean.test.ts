import { isFailure, isSuccess } from '@outfitter/contracts';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createEslintConfig,
  createPackageJson,
  createPrettierConfig,
  createTestContext,
  resetMocks,
} from '../../test-utils/index.js';
import { clean } from '../clean.js';

describe('clean command', () => {
  let ctx: ReturnType<typeof createTestContext>;

  beforeEach(() => {
    ctx = createTestContext({
      '/package.json': createPackageJson({
        scripts: {
          lint: 'eslint src',
          format: 'prettier --write .',
        },
        devDependencies: {
          eslint: '^8.0.0',
          prettier: '^3.0.0',
          husky: '^8.0.0',
        },
      }),
    });
  });

  afterEach(() => {
    resetMocks();
  });

  it('should fail if no package.json exists', async () => {
    ctx.mockFs['/package.json'] = undefined;

    const result = await clean({});

    expect(isFailure(result)).toBe(true);
    if (isFailure(result)) {
      expect(result.error.code).toBe('NOT_FOUND');
    }
  });

  it('should succeed when no configurations found', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const result = await clean({});

    expect(isSuccess(result)).toBe(true);
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('No configuration files found to clean up')
    );

    consoleSpy.mockRestore();
  });

  it('should detect old tool configurations', async () => {
    ctx.mockFs['.eslintrc.json'] = createEslintConfig();
    ctx.mockFs['.prettierrc'] = createPrettierConfig();
    ctx.mockFs['.husky/pre-commit'] = '#!/bin/sh\nnpm test';

    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    // Mock prompts to cancel
    vi.mock('@inquirer/prompts', () => ({
      select: vi.fn().mockResolvedValue('cancel'),
      confirm: vi.fn().mockResolvedValue(false),
    }));

    const result = await clean({});

    expect(isSuccess(result)).toBe(true);
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Old tool configurations:')
    );

    consoleSpy.mockRestore();
  });

  it('should detect Flint-generated configurations', async () => {
    ctx.mockFs['biome.json'] =
      '{"$schema": "https://biomejs.dev/schemas/1.9.4/schema.json"}';
    ctx.mockFs['oxlint.json'] = '{}';
    ctx.mockFs['.markdownlint.json'] = '{}';

    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    // Mock prompts to cancel
    vi.mock('@inquirer/prompts', () => ({
      select: vi.fn().mockResolvedValue('cancel'),
      confirm: vi.fn().mockResolvedValue(false),
    }));

    const result = await clean({});

    expect(isSuccess(result)).toBe(true);
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Flint-generated configurations:')
    );

    consoleSpy.mockRestore();
  });

  it('should clean all configurations with force flag', async () => {
    ctx.mockFs['.eslintrc.json'] = createEslintConfig();
    ctx.mockFs['.prettierrc'] = createPrettierConfig();
    ctx.mockFs['biome.json'] = '{}';

    const result = await clean({ force: true });

    expect(isSuccess(result)).toBe(true);
    expect(ctx.mockFs['.eslintrc.json']).toBeUndefined();
    expect(ctx.mockFs['.prettierrc']).toBeUndefined();
    expect(ctx.mockFs['biome.json']).toBeUndefined();
  });

  it('should allow selection of configurations to clean', async () => {
    ctx.mockFs['.eslintrc.json'] = createEslintConfig();
    ctx.mockFs['.prettierrc'] = createPrettierConfig();
    ctx.mockFs['biome.json'] = '{}';

    // Mock prompts for individual selection
    vi.mock('@inquirer/prompts', () => ({
      select: vi.fn().mockResolvedValue('select'),
      confirm: vi
        .fn()
        .mockResolvedValueOnce(true) // Remove .eslintrc.json
        .mockResolvedValueOnce(false) // Keep .prettierrc
        .mockResolvedValueOnce(false) // Keep biome.json
        .mockResolvedValueOnce(true), // Proceed with cleanup
    }));

    const result = await clean({});

    expect(isSuccess(result)).toBe(true);
    expect(ctx.mockFs['.eslintrc.json']).toBeUndefined();
    expect(ctx.mockFs['.prettierrc']).toBeDefined();
    expect(ctx.mockFs['biome.json']).toBeDefined();
  });

  it('should clean only old tools', async () => {
    ctx.mockFs['.eslintrc.json'] = createEslintConfig();
    ctx.mockFs['.prettierrc'] = createPrettierConfig();
    ctx.mockFs['biome.json'] = '{}';

    vi.mock('@inquirer/prompts', () => ({
      select: vi.fn().mockResolvedValue('old'),
      confirm: vi.fn().mockResolvedValue(true),
    }));

    const result = await clean({});

    expect(isSuccess(result)).toBe(true);
    expect(ctx.mockFs['.eslintrc.json']).toBeUndefined();
    expect(ctx.mockFs['.prettierrc']).toBeUndefined();
    expect(ctx.mockFs['biome.json']).toBeDefined(); // Flint config should remain
  });

  it('should clean only Flint configurations', async () => {
    ctx.mockFs['.eslintrc.json'] = createEslintConfig();
    ctx.mockFs['biome.json'] = '{}';
    ctx.mockFs['oxlint.json'] = '{}';

    vi.mock('@inquirer/prompts', () => ({
      select: vi.fn().mockResolvedValue('flint'),
      confirm: vi.fn().mockResolvedValue(true),
    }));

    const result = await clean({});

    expect(isSuccess(result)).toBe(true);
    expect(ctx.mockFs['.eslintrc.json']).toBeDefined(); // Old config should remain
    expect(ctx.mockFs['biome.json']).toBeUndefined();
    expect(ctx.mockFs['oxlint.json']).toBeUndefined();
  });

  it('should create backup before cleaning', async () => {
    ctx.mockFs['.eslintrc.json'] = createEslintConfig();

    vi.mock('@inquirer/prompts', () => ({
      select: vi.fn().mockResolvedValue('all'),
      confirm: vi.fn().mockResolvedValue(true),
    }));

    const result = await clean({});

    expect(isSuccess(result)).toBe(true);
    const backupFiles = Object.keys(ctx.mockFs).filter((f) =>
      f.includes('flint-backup')
    );
    expect(backupFiles.length).toBeGreaterThan(0);
  });

  it('should clean dependencies when removing old tools', async () => {
    ctx.mockFs['.eslintrc.json'] = createEslintConfig();
    ctx.mockExec.mockReturnValue({ stdout: '', stderr: '' });

    vi.mock('@inquirer/prompts', () => ({
      select: vi.fn().mockResolvedValue('old'),
      confirm: vi
        .fn()
        .mockResolvedValueOnce(true) // Proceed with cleanup
        .mockResolvedValueOnce(true), // Clean dependencies
    }));

    const result = await clean({});

    expect(isSuccess(result)).toBe(true);
    expect(ctx.mockExec).toHaveBeenCalledWith(
      expect.stringContaining('uninstall')
    );
  });

  it('should handle cleanup errors gracefully', async () => {
    ctx.mockFs['.eslintrc.json'] = createEslintConfig();

    // Mock file removal to fail
    vi.mock('node:fs', async () => {
      const actual = await vi.importActual<typeof import('node:fs')>('node:fs');
      return {
        ...actual,
        rmSync: vi.fn(() => {
          throw new Error('Permission denied');
        }),
      };
    });

    vi.mock('@inquirer/prompts', () => ({
      select: vi.fn().mockResolvedValue('all'),
      confirm: vi.fn().mockResolvedValue(true),
    }));

    const result = await clean({});

    expect(isFailure(result)).toBe(true);
    if (isFailure(result)) {
      expect(result.error.message).toContain('Permission denied');
    }
  });

  it('should cancel when user selects cancel', async () => {
    ctx.mockFs['.eslintrc.json'] = createEslintConfig();

    vi.mock('@inquirer/prompts', () => ({
      select: vi.fn().mockResolvedValue('cancel'),
    }));

    const result = await clean({});

    expect(isSuccess(result)).toBe(true);
    expect(ctx.mockFs['.eslintrc.json']).toBeDefined(); // File should still exist
  });

  it('should cancel when user declines confirmation', async () => {
    ctx.mockFs['.eslintrc.json'] = createEslintConfig();

    vi.mock('@inquirer/prompts', () => ({
      select: vi.fn().mockResolvedValue('all'),
      confirm: vi.fn().mockResolvedValue(false),
    }));

    const result = await clean({});

    expect(isSuccess(result)).toBe(true);
    expect(ctx.mockFs['.eslintrc.json']).toBeDefined(); // File should still exist
  });

  it('should show next steps after cleaning old tools', async () => {
    ctx.mockFs['.eslintrc.json'] = createEslintConfig();
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    vi.mock('@inquirer/prompts', () => ({
      select: vi.fn().mockResolvedValue('old'),
      confirm: vi.fn().mockResolvedValue(true),
    }));

    const result = await clean({});

    expect(isSuccess(result)).toBe(true);
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Next steps:')
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('flint init')
    );

    consoleSpy.mockRestore();
  });
});
