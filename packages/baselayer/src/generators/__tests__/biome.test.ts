import * as childProcess from 'node:child_process';
import { isFailure, isSuccess } from '@outfitter/contracts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { BaselayerConfig } from '../../schemas/baselayer-config.js';
import { generateBiomeConfig, installBiomeConfig } from '../biome.js';

vi.mock('node:child_process');

describe('generateBiomeConfig', () => {
  it('should generate basic Biome configuration', () => {
    const config = generateBiomeConfig();
    const parsed = JSON.parse(config);

    expect(parsed).toMatchObject({
      $schema: 'https://biomejs.dev/schemas/1.9.4/schema.json',
      extends: ['ultracite'],
      files: {
        ignore: expect.arrayContaining([
          'node_modules/**',
          'dist/**',
          'build/**',
        ]),
      },
    });
  });

  it('should add monorepo exclusions', () => {
    const baselayerConfig: BaselayerConfig = {
      project: { type: 'monorepo' },
    };

    const config = generateBiomeConfig(baselayerConfig);
    const parsed = JSON.parse(config);

    expect(parsed.files.ignore).toContain('packages/**/node_modules/**');
  });

  it('should add custom ignores', () => {
    const baselayerConfig: BaselayerConfig = {
      ignore: ['custom-build/', '*.generated.*'],
    };

    const config = generateBiomeConfig(baselayerConfig);
    const parsed = JSON.parse(config);

    expect(parsed.files.ignore).toContain('custom-build/');
    expect(parsed.files.ignore).toContain('*.generated.*');
  });

  it('should apply user overrides', () => {
    const baselayerConfig: BaselayerConfig = {
      overrides: {
        biome: {
          formatter: {
            indentStyle: 'tab',
          },
        },
      },
    };

    const config = generateBiomeConfig(baselayerConfig);
    const parsed = JSON.parse(config);

    expect(parsed.formatter).toMatchObject({
      indentStyle: 'tab',
    });
  });
});

describe('installBiomeConfig', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should run ultracite init with correct arguments', async () => {
    const execSyncMock = vi
      .spyOn(childProcess, 'execSync')
      .mockImplementation(() => '');

    const result = await installBiomeConfig();

    expect(isSuccess(result)).toBe(true);
    expect(execSyncMock).toHaveBeenCalledWith('bunx ultracite init --yes', {
      stdio: 'inherit',
      env: expect.objectContaining({
        FORCE_COLOR: '1',
      }),
    });
  });

  it('should handle errors from ultracite init', async () => {
    const error = new Error('Command failed');
    vi.spyOn(childProcess, 'execSync').mockImplementation(() => {
      throw error;
    });

    const result = await installBiomeConfig();

    expect(isFailure(result)).toBe(true);
    if (isFailure(result)) {
      expect(result.error).toBeInstanceOf(Error);
      expect((result.error as Error).message).toContain('Command failed');
    }
  });
});
