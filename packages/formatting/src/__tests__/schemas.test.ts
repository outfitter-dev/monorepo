import { describe, it, expect } from 'vitest';
import {
  FormatterTypeSchema,
  PresetNameSchema,
  PresetConfigSchema,
  SetupOptionsSchema,
  PackageJsonSchema,
} from '../schemas/index.js';

describe('schemas', () => {
  describe('FormatterTypeSchema', () => {
    it('should accept valid formatter types', () => {
      expect(FormatterTypeSchema.parse('prettier')).toBe('prettier');
      expect(FormatterTypeSchema.parse('biome')).toBe('biome');
      expect(FormatterTypeSchema.parse('remark')).toBe('remark');
      expect(FormatterTypeSchema.parse('eslint')).toBe('eslint');
    });

    it('should reject invalid formatter types', () => {
      expect(() => FormatterTypeSchema.parse('unknown')).toThrow();
      expect(() => FormatterTypeSchema.parse('')).toThrow();
      expect(() => FormatterTypeSchema.parse('typescript')).toThrow();
    });
  });

  describe('PresetNameSchema', () => {
    it('should accept valid preset names', () => {
      expect(PresetNameSchema.parse('standard')).toBe('standard');
      expect(PresetNameSchema.parse('strict')).toBe('strict');
      expect(PresetNameSchema.parse('relaxed')).toBe('relaxed');
    });

    it('should reject invalid preset names', () => {
      expect(() => PresetNameSchema.parse('custom')).toThrow();
      expect(() => PresetNameSchema.parse('loose')).toThrow();
      expect(() => PresetNameSchema.parse(123)).toThrow();
    });
  });

  describe('PresetConfigSchema', () => {
    it('should accept valid preset config', () => {
      const config = {
        name: 'standard',
        lineWidth: 80,
        indentation: {
          style: 'space',
          width: 2,
        },
        quotes: {
          style: 'single',
          jsx: 'double',
        },
        semicolons: 'always',
        trailingComma: 'all',
        bracketSpacing: true,
        arrowParens: 'always',
        endOfLine: 'lf',
      };

      const parsed = PresetConfigSchema.parse(config);
      expect(parsed).toEqual(config);
    });

    it('should reject invalid line widths', () => {
      const config = {
        name: 'standard',
        lineWidth: 30, // Too small
        indentation: { style: 'space', width: 2 },
        quotes: { style: 'single', jsx: 'double' },
        semicolons: 'always',
        trailingComma: 'all',
        bracketSpacing: true,
        arrowParens: 'always',
        endOfLine: 'lf',
      };

      expect(() => PresetConfigSchema.parse(config)).toThrow();
    });

    it('should reject invalid indentation width', () => {
      const config = {
        name: 'standard',
        lineWidth: 80,
        indentation: { style: 'space', width: 10 }, // Too large
        quotes: { style: 'single', jsx: 'double' },
        semicolons: 'always',
        trailingComma: 'all',
        bracketSpacing: true,
        arrowParens: 'always',
        endOfLine: 'lf',
      };

      expect(() => PresetConfigSchema.parse(config)).toThrow();
    });
  });

  describe('SetupOptionsSchema', () => {
    it('should provide defaults for optional fields', () => {
      const options = {};
      const parsed = SetupOptionsSchema.parse(options);

      expect(parsed).toEqual({
        preset: 'standard',
        installMissing: false,
        updateScripts: true,
        targetDir: process.cwd(),
        dryRun: false,
        verbose: false,
        devcontainer: false,
      });
    });

    it('should accept valid setup options', () => {
      const options = {
        preset: 'strict',
        formatters: ['prettier', 'biome'],
        installMissing: true,
        updateScripts: false,
        targetDir: '/custom/path',
        dryRun: true,
        verbose: true,
      };

      const parsed = SetupOptionsSchema.parse(options);
      expect(parsed).toEqual({
        ...options,
        devcontainer: false,
      });
    });

    it('should reject invalid formatters', () => {
      const options = {
        formatters: ['prettier', 'invalid'],
      };

      expect(() => SetupOptionsSchema.parse(options)).toThrow();
    });

    it('should accept partial preset config', () => {
      const options = {
        presetConfig: {
          lineWidth: 100,
          quotes: { style: 'double', jsx: 'single' },
        },
      };

      const parsed = SetupOptionsSchema.parse(options);
      expect(parsed.presetConfig).toEqual(options.presetConfig);
    });
  });

  describe('PackageJsonSchema', () => {
    it('should parse valid package.json', () => {
      const packageJson = {
        name: 'test-package',
        version: '1.0.0',
        scripts: {
          test: 'vitest',
          build: 'tsup',
        },
        dependencies: {
          zod: '^3.22.4',
        },
      };

      const parsed = PackageJsonSchema.parse(packageJson);
      expect(parsed).toEqual(packageJson);
    });

    it('should allow missing optional fields', () => {
      const packageJson = {};
      const parsed = PackageJsonSchema.parse(packageJson);
      expect(parsed).toEqual(packageJson);
    });

    it('should preserve unknown fields with passthrough', () => {
      const packageJson = {
        name: 'test',
        customField: 'value',
        nested: { data: true },
      };

      const parsed = PackageJsonSchema.parse(packageJson);
      expect(parsed).toEqual(packageJson);
    });
  });
});
