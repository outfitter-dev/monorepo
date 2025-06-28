import { describe, it, expect } from 'vitest';
import {
  validateSetupOptions,
  validateCLISetupOptions,
  validatePresetName,
  validateFormatterTypes,
  validatePackageJson,
  createSafeFunction,
} from '../utils/validation.js';
import { z } from 'zod';

describe('validation utilities', () => {
  describe('validateSetupOptions', () => {
    it('should accept valid setup options', () => {
      const options = {
        preset: 'standard',
        formatters: ['prettier'],
        verbose: true,
      };

      const result = validateSetupOptions(options);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.preset).toBe('standard');
        expect(result.data.formatters).toEqual(['prettier']);
        expect(result.data.verbose).toBe(true);
      }
    });

    it('should provide defaults', () => {
      const result = validateSetupOptions({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.preset).toBe('standard');
        expect(result.data.installMissing).toBe(false);
        expect(result.data.updateScripts).toBe(true);
      }
    });

    it('should reject invalid options', () => {
      const options = {
        preset: 'invalid',
        formatters: ['unknown'],
      };

      const result = validateSetupOptions(options);
      expect(result.success).toBe(false);
    });
  });

  describe('validateCLISetupOptions', () => {
    it('should transform CLI options to setup options', () => {
      const cliOptions = {
        preset: 'strict',
        formatters: ['prettier', 'biome'],
        scripts: false,
        verbose: true,
      };

      const result = validateCLISetupOptions(cliOptions);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.preset).toBe('strict');
        expect(result.data.formatters).toEqual(['prettier', 'biome']);
        expect(result.data.updateScripts).toBe(false);
        expect(result.data.verbose).toBe(true);
      }
    });

    it('should filter invalid formatters', () => {
      const cliOptions = {
        formatters: ['prettier', 'invalid', 'biome'],
      };

      const result = validateCLISetupOptions(cliOptions);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.formatters).toEqual(['prettier', 'biome']);
      }
    });

    it('should default to standard preset for invalid preset', () => {
      const cliOptions = {
        preset: 'custom',
      };

      const result = validateCLISetupOptions(cliOptions);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.preset).toBe('standard');
      }
    });
  });

  describe('validatePresetName', () => {
    it('should return valid preset names', () => {
      expect(validatePresetName('standard')).toBe('standard');
      expect(validatePresetName('strict')).toBe('strict');
      expect(validatePresetName('relaxed')).toBe('relaxed');
    });

    it('should default to standard for invalid names', () => {
      expect(validatePresetName('invalid')).toBe('standard');
      expect(validatePresetName('')).toBe('standard');
      expect(validatePresetName('custom')).toBe('standard');
    });
  });

  describe('validateFormatterTypes', () => {
    it('should filter valid formatter types', () => {
      const types = ['prettier', 'invalid', 'biome', 'unknown', 'remark'];
      const result = validateFormatterTypes(types);

      expect(result).toEqual(['prettier', 'biome', 'remark']);
    });

    it('should return undefined for no valid types', () => {
      const types = ['invalid', 'unknown'];
      const result = validateFormatterTypes(types);

      expect(result).toBeUndefined();
    });

    it('should handle empty array', () => {
      const result = validateFormatterTypes([]);
      expect(result).toBeUndefined();
    });
  });

  describe('validatePackageJson', () => {
    it('should parse valid JSON', async () => {
      const content = JSON.stringify({
        name: 'test-package',
        version: '1.0.0',
        scripts: {
          test: 'vitest',
        },
      });

      const result = await validatePackageJson(content);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('test-package');
        expect(result.data.scripts).toEqual({ test: 'vitest' });
      }
    });

    it('should handle invalid JSON', async () => {
      const content = '{ invalid json }';

      const result = await validatePackageJson(content);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('JSON');
      }
    });

    it('should preserve unknown fields', async () => {
      const content = JSON.stringify({
        name: 'test',
        customField: 'value',
        nested: { data: true },
      });

      const result = await validatePackageJson(content);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.customField).toBe('value');
        expect(result.data.nested).toEqual({ data: true });
      }
    });
  });

  describe('createSafeFunction', () => {
    it('should validate input and run function', async () => {
      const schema = z.object({
        name: z.string(),
        age: z.number().min(0),
      });

      const fn = (input: z.infer<typeof schema>) => {
        return `${input.name} is ${input.age} years old`;
      };

      const safeFn = createSafeFunction(schema, fn);

      const result = await safeFn({ name: 'Alice', age: 30 });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('Alice is 30 years old');
      }
    });

    it('should return validation error for invalid input', async () => {
      const schema = z.object({
        name: z.string(),
        age: z.number().min(0),
      });

      const fn = (input: z.infer<typeof schema>) => {
        return `${input.name} is ${input.age} years old`;
      };

      const safeFn = createSafeFunction(schema, fn);

      const result = await safeFn({ name: 'Alice', age: -5 });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(z.ZodError);
      }
    });

    it('should handle function errors', async () => {
      const schema = z.object({ value: z.number() });

      const fn = (input: z.infer<typeof schema>) => {
        if (input.value === 0) {
          throw new Error('Cannot divide by zero');
        }
        return 100 / input.value;
      };

      const safeFn = createSafeFunction(schema, fn);

      const result = await safeFn({ value: 0 });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe('Cannot divide by zero');
      }
    });

    it('should handle async functions', async () => {
      const schema = z.object({ delay: z.number() });

      const fn = async (input: z.infer<typeof schema>) => {
        await new Promise((resolve) => setTimeout(resolve, input.delay));
        return `Waited ${input.delay}ms`;
      };

      const safeFn = createSafeFunction(schema, fn);

      const result = await safeFn({ delay: 10 });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('Waited 10ms');
      }
    });
  });
});
