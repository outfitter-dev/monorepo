import { isFailure, isSuccess } from '@outfitter/contracts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { BaselayerConfig } from '../../schemas/baselayer-config.js';
import * as fileSystem from '../../utils/file-system.js';
import {
  generatePrettierConfig,
  generatePrettierConfigObject,
  generatePrettierIgnore,
} from '../prettier.js';

vi.mock('../../utils/file-system.js');

describe('generatePrettierConfigObject', () => {
  it('should generate basic prettier config', () => {
    const config = generatePrettierConfigObject();

    expect(config).toMatchObject({
      semi: true,
      singleQuote: true,
      tabWidth: 2,
      trailingComma: 'es5',
      printWidth: 80,
      endOfLine: 'lf',
      arrowParens: 'always',
      proseWrap: 'preserve',
    });
  });

  it('should handle JSON files by default', () => {
    const config = generatePrettierConfigObject();

    expect(config.overrides).toContainEqual({
      files: ['*.json', '*.jsonc'],
      options: {
        singleQuote: false,
        trailingComma: 'none',
      },
    });
  });

  it('should handle markdown when enabled', () => {
    const baselayerConfig: BaselayerConfig = {
      features: { markdown: true },
    };

    const config = generatePrettierConfigObject(baselayerConfig);

    expect(config.overrides).toContainEqual({
      files: ['*.md', '*.mdx'],
      options: {
        proseWrap: 'preserve',
        printWidth: 100,
      },
    });
  });

  it('should handle CSS when stylelint disabled', () => {
    const baselayerConfig: BaselayerConfig = {
      features: { styles: false },
    };

    const config = generatePrettierConfigObject(baselayerConfig);

    expect(config.overrides).toContainEqual({
      files: ['*.css', '*.scss', '*.less'],
      options: {
        singleQuote: false,
      },
    });
  });

  it('should apply user overrides', () => {
    const baselayerConfig: BaselayerConfig = {
      overrides: {
        prettier: {
          printWidth: 120,
          tabWidth: 4,
        },
      },
    };

    const config = generatePrettierConfigObject(baselayerConfig);

    expect(config.printWidth).toBe(120);
    expect(config.tabWidth).toBe(4);
  });
});

describe('generatePrettierIgnore', () => {
  it('should generate basic ignore patterns', () => {
    const ignore = generatePrettierIgnore();

    expect(ignore).toContain('node_modules/');
    expect(ignore).toContain('dist/');
    expect(ignore).toContain('*.js');
    expect(ignore).toContain('*.ts');
  });

  it('should add monorepo ignores', () => {
    const baselayerConfig: BaselayerConfig = {
      project: { type: 'monorepo' },
    };

    const ignore = generatePrettierIgnore(baselayerConfig);

    expect(ignore).toContain('packages/**/dist/');
    expect(ignore).toContain('packages/**/build/');
  });

  it('should not ignore JS files when TypeScript disabled', () => {
    const baselayerConfig: BaselayerConfig = {
      features: { typescript: false },
    };

    const ignore = generatePrettierIgnore(baselayerConfig);

    // Should not have JS-related ignores
    expect(ignore).not.toMatch(/\*\.js$/m);
    expect(ignore).not.toMatch(/\*\.jsx$/m);
  });

  it('should add custom ignores', () => {
    const baselayerConfig: BaselayerConfig = {
      ignore: ['custom-build/', '*.generated.*'],
    };

    const ignore = generatePrettierIgnore(baselayerConfig);

    expect(ignore).toContain('custom-build/');
    expect(ignore).toContain('*.generated.*');
  });
});

describe('generatePrettierConfig', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should generate prettierignore file', async () => {
    vi.mocked(fileSystem.writeJSON).mockResolvedValue({
      success: true,
      data: undefined,
    } as any);

    let writtenIgnore: string;
    vi.mocked(fileSystem.writeFile).mockImplementation(
      async (_path, content) => {
        writtenIgnore = content;
        return {
          success: true,
          data: undefined,
        } as any;
      }
    );

    const result = await generatePrettierConfig();

    expect(isSuccess(result)).toBe(true);
    expect(writtenIgnore!).toContain('*.js');
    expect(writtenIgnore!).toContain('*.jsx');
    expect(writtenIgnore!).toContain('*.ts');
    expect(writtenIgnore!).toContain('*.tsx');
    expect(writtenIgnore!).toContain('node_modules/');
    expect(writtenIgnore!).toContain('dist/');
  });

  it('should handle write errors', async () => {
    const error = new Error('Write failed');
    vi.mocked(fileSystem.writeJSON).mockResolvedValue({
      success: false,
      error,
    } as any);

    const result = await generatePrettierConfig();

    expect(isFailure(result)).toBe(true);
    if (isFailure(result)) {
      expect(result.error).toBe(error);
    }
  });
});
