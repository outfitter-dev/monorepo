import { ErrorCode } from '@outfitter/contracts';
import { describe, expect, it } from 'vitest';
import { ConfigLoader } from '../config-loader';

describe('ConfigLoader - Runtime Validation', () => {
  const configLoader = new ConfigLoader();

  describe('validateConfigurationObject method', () => {
    it('should validate valid configuration objects', () => {
      const validConfig = {
        features: { typescript: true, markdown: false },
        overrides: {
          biome: { formatter: { indentWidth: 2 } },
        },
      };

      const result = configLoader.validateConfigurationObject(validConfig);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.features?.typescript).toBe(true);
        expect(result.data.features?.markdown).toBe(false);
      }
    });

    it('should reject invalid configuration objects with type errors', () => {
      const invalidConfig = {
        features: { typescript: 'not-boolean' }, // Should be boolean
      };

      const result = configLoader.validateConfigurationObject(invalidConfig);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe(ErrorCode.SCHEMA_VALIDATION_FAILED);
        expect(result.error.details?.validationErrors).toBeDefined();
        expect(Array.isArray(result.error.details?.validationErrors)).toBe(
          true
        );
      }
    });

    it('should provide detailed validation error information', () => {
      const invalidConfig = {
        features: {
          typescript: 123, // Invalid type
        },
        project: {
          type: 'invalid-type', // Invalid enum value
        },
      };

      const result = configLoader.validateConfigurationObject(invalidConfig);

      expect(result.success).toBe(false);
      if (!result.success) {
        const errors = result.error.details?.validationErrors as Array<any>;
        expect(errors).toBeDefined();
        expect(errors.length).toBeGreaterThan(0);

        // Check error structure
        const firstError = errors[0];
        expect(firstError).toHaveProperty('path');
        expect(firstError).toHaveProperty('message');
        expect(firstError).toHaveProperty('code');

        // Should have user-friendly messages
        expect(typeof firstError.message).toBe('string');
        expect(firstError.message.length).toBeGreaterThan(0);
      }
    });

    it('should accept minimal valid configuration', () => {
      const minimalConfig = {
        features: { typescript: true },
      };

      const result = configLoader.validateConfigurationObject(minimalConfig);

      expect(result.success).toBe(true);
    });

    it('should accept empty configuration object', () => {
      const emptyConfig = {};

      const result = configLoader.validateConfigurationObject(emptyConfig);

      expect(result.success).toBe(true);
      if (result.success) {
        // Should apply defaults
        expect(result.data.features?.typescript).toBe(true); // default
        expect(result.data.features?.markdown).toBe(true); // default
        expect(result.data.features?.styles).toBe(false); // default
      }
    });

    it('should handle complex nested validation errors', () => {
      const invalidNestedConfig = {
        features: {
          typescript: true,
          markdown: 'invalid', // Should be boolean
        },
        overrides: {
          biome: 'not-an-object', // Should be object
        },
        project: {
          type: 'invalid-project-type', // Invalid enum
          packageManager: 123, // Should be string
        },
      };

      const result =
        configLoader.validateConfigurationObject(invalidNestedConfig);

      expect(result.success).toBe(false);
      if (!result.success) {
        const errors = result.error.details?.validationErrors as Array<any>;
        expect(errors.length).toBeGreaterThan(1); // Should have multiple errors

        // Check that paths are properly formatted
        const paths = errors.map((e) => e.path);
        expect(paths).toContain('features.markdown');
        expect(paths).toContain('overrides.biome');
      }
    });
  });

  describe('Error message formatting', () => {
    it('should provide user-friendly error messages for type mismatches', () => {
      const result = configLoader.validateConfigurationObject({
        features: { typescript: 'string-instead-of-boolean' },
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        const errors = result.error.details?.validationErrors as Array<any>;
        const typeError = errors.find((e) => e.path === 'features.typescript');

        expect(typeError).toBeDefined();
        expect(typeError.message).toMatch(
          /Expected.*boolean.*received.*string/i
        );
      }
    });

    it('should provide user-friendly error messages for enum validation', () => {
      const result = configLoader.validateConfigurationObject({
        project: { type: 'invalid-enum-value' },
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        const errors = result.error.details?.validationErrors as Array<any>;
        const enumError = errors.find((e) => e.path === 'project.type');

        expect(enumError).toBeDefined();
        expect(enumError.message).toMatch(/Valid options are:/i);
      }
    });
  });
});
