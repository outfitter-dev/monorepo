import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, writeFile, mkdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { setup } from '../index.js';
import type { OutfitterConfig } from '../types/index.js';

describe('rightdown integration', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'baselayer-rightdown-test-'));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it('should generate rightdown config when markdown tool is rightdown', async () => {
    // Create .outfitter directory and config
    await mkdir(join(tempDir, '.outfitter'), { recursive: true });

    const customConfig: Partial<OutfitterConfig> = {
      baselayer: {
        tools: {
          markdown: 'rightdown',
        },
      },
      strictness: 'strict',
    };

    await writeFile(
      join(tempDir, '.outfitter', 'config.jsonc'),
      JSON.stringify(customConfig, null, 2),
      'utf-8',
    );

    const result = await setup({ cwd: tempDir });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.generatedFiles).toContain('.rightdown.config.jsonc');

      // Check that the config file was actually created
      const configContent = await readFile(join(tempDir, '.rightdown.config.jsonc'), 'utf-8');
      expect(configContent).toContain('rightdown configuration');
      expect(configContent).toContain('strictness: strict');
      expect(configContent).toContain('terminology');
      expect(configContent).toContain('JavaScript');
      expect(configContent).toContain('TypeScript');
    }
  });

  it('should not generate rightdown config when markdown tool is prettier', async () => {
    // Create .outfitter directory and config
    await mkdir(join(tempDir, '.outfitter'), { recursive: true });

    const customConfig: Partial<OutfitterConfig> = {
      baselayer: {
        tools: {
          markdown: 'prettier',
        },
      },
    };

    await writeFile(
      join(tempDir, '.outfitter', 'config.jsonc'),
      JSON.stringify(customConfig, null, 2),
      'utf-8',
    );

    const result = await setup({ cwd: tempDir });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.generatedFiles).not.toContain('.rightdown.config.jsonc');
    }
  });

  it('should use relaxed preset for relaxed strictness', async () => {
    await mkdir(join(tempDir, '.outfitter'), { recursive: true });

    const customConfig: Partial<OutfitterConfig> = {
      baselayer: {
        tools: {
          markdown: 'rightdown',
        },
      },
      strictness: 'relaxed',
    };

    await writeFile(
      join(tempDir, '.outfitter', 'config.jsonc'),
      JSON.stringify(customConfig, null, 2),
      'utf-8',
    );

    const result = await setup({ cwd: tempDir });

    expect(result.success).toBe(true);
    if (result.success) {
      const configContent = await readFile(join(tempDir, '.rightdown.config.jsonc'), 'utf-8');
      expect(configContent).toContain('strictness: relaxed');
      expect(configContent).toContain('"preset": "relaxed"');
    }
  });

  it('should use strict preset for pedantic strictness', async () => {
    await mkdir(join(tempDir, '.outfitter'), { recursive: true });

    const customConfig: Partial<OutfitterConfig> = {
      baselayer: {
        tools: {
          markdown: 'rightdown',
        },
      },
      strictness: 'pedantic',
    };

    await writeFile(
      join(tempDir, '.outfitter', 'config.jsonc'),
      JSON.stringify(customConfig, null, 2),
      'utf-8',
    );

    const result = await setup({ cwd: tempDir });

    expect(result.success).toBe(true);
    if (result.success) {
      const configContent = await readFile(join(tempDir, '.rightdown.config.jsonc'), 'utf-8');
      expect(configContent).toContain('strictness: pedantic');
      expect(configContent).toContain('"preset": "strict"');
    }
  });

  it('should merge overrides with base configuration', async () => {
    await mkdir(join(tempDir, '.outfitter'), { recursive: true });

    const customConfig: Partial<OutfitterConfig> = {
      baselayer: {
        tools: {
          markdown: 'rightdown',
        },
      },
      overrides: {
        rightdown: {
          customRules: ['./custom-rule.js'],
          ignores: ['docs/special/**'],
          terminology: [{ incorrect: 'Docker', correct: 'docker' }],
        },
      },
    };

    await writeFile(
      join(tempDir, '.outfitter', 'config.jsonc'),
      JSON.stringify(customConfig, null, 2),
      'utf-8',
    );

    const result = await setup({ cwd: tempDir });

    expect(result.success).toBe(true);
    if (result.success) {
      const configContent = await readFile(join(tempDir, '.rightdown.config.jsonc'), 'utf-8');
      expect(configContent).toContain('./custom-rule.js');
      expect(configContent).toContain('docs/special/**');
      expect(configContent).toContain('"incorrect": "Docker"');
      expect(configContent).toContain('"correct": "docker"');
      // Should also contain the default terminology
      expect(configContent).toContain('"incorrect": "Javascript"');
    }
  });
});
