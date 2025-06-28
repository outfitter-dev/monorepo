import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  loadYamlPreset,
  yamlPresetToConfig,
  mergeRawConfig,
  resolvePresetInheritance,
} from '../utils/yaml-presets.js';

describe('YAML Preset System', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = join(tmpdir(), `yaml-preset-test-${Date.now()}`);
    await mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  describe('loadYamlPreset', () => {
    it('should load a valid YAML preset', async () => {
      const presetPath = join(testDir, 'test.yaml');
      const presetContent = `
name: test
description: Test preset
common:
  lineWidth: 100
  indentation:
    style: tab
    width: 4
`;
      await writeFile(presetPath, presetContent);

      const result = await loadYamlPreset(presetPath);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('test');
        expect(result.data.description).toBe('Test preset');
        expect(result.data.common?.lineWidth).toBe(100);
        expect(result.data.common?.indentation?.style).toBe('tab');
      }
    });

    it('should fail if preset has no name', async () => {
      const presetPath = join(testDir, 'invalid.yaml');
      const presetContent = `
description: Invalid preset
common:
  lineWidth: 80
`;
      await writeFile(presetPath, presetContent);

      const result = await loadYamlPreset(presetPath);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('must have a name');
      }
    });

    it('should fail if file does not exist', async () => {
      const result = await loadYamlPreset(join(testDir, 'nonexistent.yaml'));
      expect(result.success).toBe(false);
    });
  });

  describe('yamlPresetToConfig', () => {
    it('should convert YAML preset to PresetConfig', () => {
      const yamlPreset = {
        name: 'custom',
        common: {
          lineWidth: 100,
          indentation: {
            style: 'tab' as const,
            width: 4,
          },
          quotes: {
            style: 'double' as const,
            jsx: 'single' as const,
          },
          semicolons: 'asNeeded' as const,
          trailingComma: 'es5' as const,
          bracketSpacing: false,
          arrowParens: 'asNeeded' as const,
          endOfLine: 'crlf' as const,
        },
      };

      const config = yamlPresetToConfig(yamlPreset);

      expect(config.name).toBe('standard'); // Falls back to standard for unknown preset names
      expect(config.lineWidth).toBe(100);
      expect(config.indentation.style).toBe('tab');
      expect(config.indentation.width).toBe(4);
      expect(config.quotes.style).toBe('double');
      expect(config.quotes.jsx).toBe('single');
      expect(config.semicolons).toBe('asNeeded');
      expect(config.trailingComma).toBe('es5');
      expect(config.bracketSpacing).toBe(false);
      expect(config.arrowParens).toBe('asNeeded');
      expect(config.endOfLine).toBe('crlf');
    });

    it('should use defaults for missing fields', () => {
      const yamlPreset = {
        name: 'minimal',
      };

      const config = yamlPresetToConfig(yamlPreset);

      expect(config.lineWidth).toBe(80);
      expect(config.indentation.style).toBe('space');
      expect(config.indentation.width).toBe(2);
      expect(config.quotes.style).toBe('single');
      expect(config.quotes.jsx).toBe('double');
      expect(config.semicolons).toBe('always');
      expect(config.trailingComma).toBe('all');
      expect(config.bracketSpacing).toBe(true);
      expect(config.arrowParens).toBe('always');
      expect(config.endOfLine).toBe('lf');
    });
  });

  describe('mergeRawConfig', () => {
    it('should merge raw config with generated config', () => {
      const generated = {
        printWidth: 80,
        tabWidth: 2,
        useTabs: false,
        singleQuote: true,
      };

      const raw = {
        printWidth: 100,
        proseWrap: 'always',
        plugins: ['prettier-plugin-tailwindcss'],
      };

      const merged = mergeRawConfig(generated, raw);

      expect(merged).toEqual({
        printWidth: 100, // overridden
        tabWidth: 2, // kept
        useTabs: false, // kept
        singleQuote: true, // kept
        proseWrap: 'always', // added
        plugins: ['prettier-plugin-tailwindcss'], // added
      });
    });

    it('should deep merge nested objects', () => {
      const generated = {
        formatter: {
          indentStyle: 'space',
          indentWidth: 2,
        },
        linter: {
          enabled: true,
        },
      };

      const raw = {
        formatter: {
          indentWidth: 4,
          lineWidth: 100,
        },
        linter: {
          rules: {
            complexity: 'error',
          },
        },
      };

      const merged = mergeRawConfig(generated, raw);

      expect(merged).toEqual({
        formatter: {
          indentStyle: 'space', // kept
          indentWidth: 4, // overridden
          lineWidth: 100, // added
        },
        linter: {
          enabled: true, // kept
          rules: {
            complexity: 'error', // added
          },
        },
      });
    });

    it('should return generated config if no raw config provided', () => {
      const generated = { test: 'value' };
      const merged = mergeRawConfig(generated);
      expect(merged).toEqual(generated);
    });
  });

  describe('resolvePresetInheritance', () => {
    it('should resolve single level inheritance', async () => {
      const presetsDir = join(testDir, 'presets');
      await mkdir(presetsDir, { recursive: true });

      // Create parent preset
      const parentContent = `
name: base
common:
  lineWidth: 80
  indentation:
    style: space
    width: 2
`;
      await writeFile(join(presetsDir, 'base.yaml'), parentContent);

      // Create child preset
      const childContent = `
name: child
extends: base
common:
  lineWidth: 100
  quotes:
    style: double
`;
      await writeFile(join(presetsDir, 'child.yaml'), childContent);

      const childPreset = {
        name: 'child',
        extends: 'base',
        common: {
          lineWidth: 100,
          quotes: {
            style: 'double' as const,
          },
        },
      };

      const result = await resolvePresetInheritance(childPreset, presetsDir);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.common?.lineWidth).toBe(100); // overridden
        expect(result.data.common?.indentation?.style).toBe('space'); // inherited
        expect(result.data.common?.indentation?.width).toBe(2); // inherited
        expect(result.data.common?.quotes?.style).toBe('double'); // new
      }
    });

    it('should resolve multiple levels of inheritance', async () => {
      const presetsDir = join(testDir, 'presets');
      await mkdir(presetsDir, { recursive: true });

      // Create grandparent preset
      await writeFile(
        join(presetsDir, 'grandparent.yaml'),
        `
name: grandparent
common:
  lineWidth: 80
  indentation:
    style: space
    width: 2
`,
      );

      // Create parent preset
      await writeFile(
        join(presetsDir, 'parent.yaml'),
        `
name: parent
extends: grandparent
common:
  lineWidth: 100
  quotes:
    style: single
`,
      );

      // Create child preset
      await writeFile(
        join(presetsDir, 'child.yaml'),
        `
name: child
extends: parent
common:
  quotes:
    style: double
  semicolons: asNeeded
`,
      );

      const childPreset = {
        name: 'child',
        extends: 'parent',
        common: {
          quotes: {
            style: 'double' as const,
          },
          semicolons: 'asNeeded' as const,
        },
      };

      const result = await resolvePresetInheritance(childPreset, presetsDir);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.common?.lineWidth).toBe(100); // from parent
        expect(result.data.common?.indentation?.style).toBe('space'); // from grandparent
        expect(result.data.common?.indentation?.width).toBe(2); // from grandparent
        expect(result.data.common?.quotes?.style).toBe('double'); // overridden
        expect(result.data.common?.semicolons).toBe('asNeeded'); // new
      }
    });

    it('should merge raw configurations through inheritance', async () => {
      const presetsDir = join(testDir, 'presets');
      await mkdir(presetsDir, { recursive: true });

      // Create parent preset with raw config
      await writeFile(
        join(presetsDir, 'parent.yaml'),
        `
name: parent
raw:
  prettier:
    printWidth: 80
    proseWrap: preserve
  biome:
    formatter:
      indentStyle: space
`,
      );

      // Create child preset with raw config
      await writeFile(
        join(presetsDir, 'child.yaml'),
        `
name: child
extends: parent
raw:
  prettier:
    printWidth: 100
    plugins:
      - prettier-plugin-tailwindcss
  biome:
    formatter:
      indentWidth: 4
`,
      );

      const childPreset = await loadYamlPreset(join(presetsDir, 'child.yaml'));
      expect(childPreset.success).toBe(true);
      if (!childPreset.success) return;

      const result = await resolvePresetInheritance(childPreset.data, presetsDir);
      expect(result.success).toBe(true);
      if (result.success) {
        // Prettier config should be merged
        expect(result.data.raw?.prettier).toEqual({
          printWidth: 100, // overridden
          proseWrap: 'preserve', // inherited
          plugins: ['prettier-plugin-tailwindcss'], // new
        });

        // Biome config should be merged
        expect(result.data.raw?.biome).toEqual({
          formatter: {
            indentStyle: 'space', // inherited
            indentWidth: 4, // new
          },
        });
      }
    });

    it('should fail if parent preset not found', async () => {
      const presetsDir = join(testDir, 'presets');
      await mkdir(presetsDir, { recursive: true });

      const childPreset = {
        name: 'child',
        extends: 'nonexistent',
      };

      const result = await resolvePresetInheritance(childPreset, presetsDir);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('Parent preset not found');
      }
    });
  });
});
