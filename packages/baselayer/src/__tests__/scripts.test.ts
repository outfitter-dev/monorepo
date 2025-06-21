import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, writeFile, mkdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { setup } from '../index.js';
import type { OutfitterConfig } from '../types/index.js';

describe('package.json scripts generation', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'baselayer-scripts-test-'));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it('should include rightdown in lint scripts when markdown tool is rightdown', async () => {
    // Create package.json
    const packageJson = {
      name: 'test-package',
      version: '1.0.0',
    };
    await writeFile(join(tempDir, 'package.json'), JSON.stringify(packageJson, null, 2), 'utf-8');

    // Create .outfitter directory and config
    await mkdir(join(tempDir, '.outfitter'), { recursive: true });
    const customConfig: Partial<OutfitterConfig> = {
      baselayer: {
        tools: {
          typescript: 'biome',
          markdown: 'rightdown',
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
      expect(result.data.generatedFiles).toContain('package.json (scripts updated)');

      // Check that package.json was updated with rightdown scripts
      const updatedPackageJson = JSON.parse(await readFile(join(tempDir, 'package.json'), 'utf-8'));
      expect(updatedPackageJson.scripts.lint).toContain('rightdown');
      expect(updatedPackageJson.scripts['lint:fix']).toContain('rightdown --fix');
    }
  });

  it('should not include rightdown in scripts when markdown tool is prettier', async () => {
    // Create package.json
    const packageJson = {
      name: 'test-package',
      version: '1.0.0',
    };
    await writeFile(join(tempDir, 'package.json'), JSON.stringify(packageJson, null, 2), 'utf-8');

    // Create .outfitter directory and config
    await mkdir(join(tempDir, '.outfitter'), { recursive: true });
    const customConfig: Partial<OutfitterConfig> = {
      baselayer: {
        tools: {
          typescript: 'biome',
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
      // Check that package.json was updated but without rightdown
      const updatedPackageJson = JSON.parse(await readFile(join(tempDir, 'package.json'), 'utf-8'));
      expect(updatedPackageJson.scripts.lint).not.toContain('rightdown');
      expect(updatedPackageJson.scripts['lint:fix']).not.toContain('rightdown');
    }
  });

  it('should include rightdown in ESLint-based scripts', async () => {
    // Create package.json
    const packageJson = {
      name: 'test-package',
      version: '1.0.0',
    };
    await writeFile(join(tempDir, 'package.json'), JSON.stringify(packageJson, null, 2), 'utf-8');

    // Create .outfitter directory and config
    await mkdir(join(tempDir, '.outfitter'), { recursive: true });
    const customConfig: Partial<OutfitterConfig> = {
      baselayer: {
        tools: {
          typescript: 'eslint',
          markdown: 'rightdown',
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
      // Check that package.json was updated with ESLint + rightdown scripts
      const updatedPackageJson = JSON.parse(await readFile(join(tempDir, 'package.json'), 'utf-8'));
      expect(updatedPackageJson.scripts.lint).toContain('eslint');
      expect(updatedPackageJson.scripts.lint).toContain('rightdown');
      expect(updatedPackageJson.scripts['lint:fix']).toContain('eslint');
      expect(updatedPackageJson.scripts['lint:fix']).toContain('rightdown --fix');
    }
  });
});
