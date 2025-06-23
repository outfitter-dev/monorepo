import { describe, it, expect, beforeEach } from 'vitest';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// ESM equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import the real implementation
import { ConfigReader } from '../../core/config-reader.js';

describe('ConfigReader', () => {
  let configReader: ConfigReader;
  const fixturesPath = join(__dirname, '../fixtures/configs');

  beforeEach(() => {
    configReader = new ConfigReader();
  });

  describe('read', () => {
    it('should fail to read config without version field', async () => {
      const configPath = join(fixturesPath, 'no-version.yaml');
      const result = await configReader.read(configPath);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
        expect(result.error.message).toContain('Configuration must have version: 2');
      }
    });

    it('should read and parse basic config', async () => {
      const configPath = join(fixturesPath, 'basic.yaml');
      const result = await configReader.read(configPath);

      expect(result.success).toBe(true);
      if (result.success) {
        const config = result.data;
        expect(config.version).toBe(2);
        expect(config.preset).toBe('standard');
        expect(config.formatters?.default).toBe('prettier');
        expect(config.formatters?.languages?.javascript).toBe('biome');
      }
    });

    it('should read and parse full config', async () => {
      const configPath = join(fixturesPath, 'full.yaml');
      const result = await configReader.read(configPath);

      expect(result.success).toBe(true);
      if (result.success) {
        const config = result.data;
        expect(config.version).toBe(2);
        expect(config.preset).toBe('strict');
        expect(config.formatters?.languages?.javascript).toBe('biome');
        expect(config.formatters?.languages?.html).toBe('prettier');
        expect(config.formatterOptions?.prettier?.printWidth).toBe(80);
        expect(config.formatterOptions?.biome?.indentWidth).toBe(2);
      }
    });

    it('should fail on non-existent file', async () => {
      const configPath = join(fixturesPath, 'does-not-exist.yaml');
      const result = await configReader.read(configPath);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('NOT_FOUND');
      }
    });

    it('should fail on invalid YAML', async () => {
      // We'll need to create a fixture with invalid YAML
      const configPath = join(fixturesPath, 'invalid-yaml.yaml');
      const result = await configReader.read(configPath);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
      }
    });
  });

  describe('validateConfig', () => {
    it('should validate config with all required fields', () => {
      const config = {
        version: 2,
        preset: 'standard',
        formatters: {
          default: 'prettier',
          languages: {
            javascript: 'biome',
          },
        },
      };

      const result = configReader.validateConfig(config);
      expect(result.success).toBe(true);
    });

    it('should fail on invalid config', () => {
      const config = {
        version: 2,
        preset: 'not-a-valid-preset',
        formatters: {
          default: 123, // Should be string
        },
      };

      const result = configReader.validateConfig(config);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
      }
    });

    it('should fail on config with invalid formatter options', () => {
      const config = {
        version: 2,
        formatters: {
          languages: {
            javascript: ['biome', 'prettier'], // Should be single formatter
          },
        },
      };

      const result = configReader.validateConfig(config);
      expect(result.success).toBe(false);
    });

    it('should fail on config without version field', () => {
      const config = {
        preset: 'standard',
        rules: {
          'line-length': false,
        },
      };

      const result = configReader.validateConfig(config);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
      }
    });

    it('should fail on config with wrong version number', () => {
      const config = {
        version: 3, // Not supported yet
        preset: 'standard',
      };

      const result = configReader.validateConfig(config);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
      }
    });
  });

  describe('config version', () => {
    it('should only accept configs with version 2', () => {
      const config = {
        version: 2,
        preset: 'standard',
      };

      const result = configReader.validateConfig(config);
      expect(result.success).toBe(true);
    });

    it('should reject configs without version field', () => {
      const config = {
        preset: 'standard',
        rules: {},
      };

      const result = configReader.validateConfig(config);
      expect(result.success).toBe(false);
    });
  });
});
