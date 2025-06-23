import { describe, it, expect } from 'vitest';
import { isSuccess, isFailure } from '@outfitter/contracts';
import type { Result, AppError } from '@outfitter/contracts';
import type { RightdownConfig } from '../../core/types.js';
import { ConfigCompiler } from '../../core/config-compiler.js';

describe('ConfigCompiler', () => {
  const compiler = new ConfigCompiler();

  describe('compile', () => {
    it('should generate configs for basic config', () => {
      const config: RightdownConfig = {
        version: 2,
        preset: 'standard',
        formatters: {
          default: 'prettier',
          languages: {
            javascript: 'biome',
            typescript: 'biome',
          },
        },
      };

      const result = compiler.compile(config);

      expect(isSuccess(result)).toBe(true);
      if (result.success) {
        const configs = result.data;

        // Should always generate markdownlint config
        expect(configs.markdownlint).toBeDefined();
        expect(configs.markdownlint.rules).toBeDefined();

        // Should generate prettier config (default formatter)
        expect(configs.prettier).toBeDefined();

        // Should generate biome config (used for JS/TS)
        expect(configs.biome).toBeDefined();
      }
    });

    it('should only generate configs for used formatters', () => {
      const config: RightdownConfig = {
        version: 2,
        formatters: {
          default: 'prettier',
          // No biome usage
        },
      };

      const result = compiler.compile(config);

      expect(isSuccess(result)).toBe(true);
      if (result.success) {
        const configs = result.data;
        expect(configs.prettier).toBeDefined();
        expect(configs.biome).toBeUndefined();
      }
    });
  });

  describe('generateMarkdownlintConfig', () => {
    it('should generate config for strict preset', () => {
      const config: RightdownConfig = {
        version: 2,
        preset: 'strict',
      };

      const mdConfig = compiler.generateMarkdownlintConfig(config);

      expect(mdConfig.rules).toBeDefined();
      expect(mdConfig.rules['heading-increment']).toBe(true);
      expect(mdConfig.rules['first-line-heading']).toBe(true);
      expect(mdConfig.rules['blanks-around-headings']).toBe(true);
    });

    it('should generate config for standard preset', () => {
      const config: RightdownConfig = {
        version: 2,
        preset: 'standard',
      };

      const mdConfig = compiler.generateMarkdownlintConfig(config);

      expect(mdConfig.rules).toBeDefined();
      expect(mdConfig.rules['line-length']).toBe(false);
      expect(mdConfig.rules['no-duplicate-heading']).toBe(false);
    });

    it('should apply custom rule overrides', () => {
      const config: RightdownConfig = {
        version: 2,
        preset: 'standard',
        rules: {
          'line-length': 100,
          'heading-increment': false,
          'custom-rule': true,
        },
      };

      const mdConfig = compiler.generateMarkdownlintConfig(config);

      expect(mdConfig.rules['line-length']).toBe(100);
      expect(mdConfig.rules['heading-increment']).toBe(false);
      expect(mdConfig.rules['custom-rule']).toBe(true);
    });

    it('should include custom rules path', () => {
      const config: RightdownConfig = {
        version: 2,
        preset: 'standard',
        terminology: [{ incorrect: 'javascript', correct: 'JavaScript' }],
      };

      const mdConfig = compiler.generateMarkdownlintConfig(config);

      expect(mdConfig.customRules).toBeDefined();
      expect(mdConfig.customRules).toContain('consistent-terminology');
    });

    it('should include ignore patterns', () => {
      const config: RightdownConfig = {
        version: 2,
        ignores: ['node_modules/**', 'dist/**', '*.generated.md'],
      };

      const mdConfig = compiler.generateMarkdownlintConfig(config);

      expect(mdConfig.ignores).toEqual(['node_modules/**', 'dist/**', '*.generated.md']);
    });
  });

  describe('generatePrettierConfig', () => {
    it('should generate prettier config when used', () => {
      const config: RightdownConfig = {
        version: 2,
        formatters: {
          default: 'prettier',
        },
      };

      const prettierConfig = compiler.generatePrettierConfig(config);

      expect(prettierConfig).toBeDefined();
      // Default options
      expect(prettierConfig?.printWidth).toBe(80);
      expect(prettierConfig?.tabWidth).toBe(2);
      expect(prettierConfig?.semi).toBe(true);
    });

    it('should apply custom prettier options', () => {
      const config: RightdownConfig = {
        version: 2,
        formatters: {
          default: 'prettier',
        },
        formatterOptions: {
          prettier: {
            printWidth: 100,
            semi: false,
            singleQuote: true,
            tabWidth: 4,
          },
        },
      };

      const prettierConfig = compiler.generatePrettierConfig(config);

      expect(prettierConfig?.printWidth).toBe(100);
      expect(prettierConfig?.semi).toBe(false);
      expect(prettierConfig?.singleQuote).toBe(true);
      expect(prettierConfig?.tabWidth).toBe(4);
    });

    it('should not generate prettier config when not used', () => {
      const config: RightdownConfig = {
        version: 2,
        formatters: {
          default: 'biome',
        },
      };

      const prettierConfig = compiler.generatePrettierConfig(config);

      expect(prettierConfig).toBeUndefined();
    });
  });

  describe('generateBiomeConfig', () => {
    it('should generate biome config when used', () => {
      const config: RightdownConfig = {
        version: 2,
        formatters: {
          languages: {
            javascript: 'biome',
            typescript: 'biome',
          },
        },
      };

      const biomeConfig = compiler.generateBiomeConfig(config);

      expect(biomeConfig).toBeDefined();
      expect(biomeConfig?.$schema).toBe('https://biomejs.dev/schemas/1.9.4/schema.json');
      expect(biomeConfig?.formatter?.enabled).toBe(true);
    });

    it('should apply custom biome options', () => {
      const config: RightdownConfig = {
        version: 2,
        formatters: {
          default: 'biome',
        },
        formatterOptions: {
          biome: {
            indentStyle: 'space',
            indentWidth: 4,
            lineWidth: 100,
            formatter: {
              quoteStyle: 'double',
              semicolons: 'asNeeded',
            },
          },
        },
      };

      const biomeConfig = compiler.generateBiomeConfig(config);

      expect(biomeConfig?.formatter?.indentStyle).toBe('space');
      expect(biomeConfig?.formatter?.indentWidth).toBe(4);
      expect(biomeConfig?.formatter?.lineWidth).toBe(100);
      expect(biomeConfig?.javascript?.formatter?.quoteStyle).toBe('double');
      expect(biomeConfig?.javascript?.formatter?.semicolons).toBe('asNeeded');
    });

    it('should not generate biome config when not used', () => {
      const config: RightdownConfig = {
        version: 2,
        formatters: {
          default: 'prettier',
        },
      };

      const biomeConfig = compiler.generateBiomeConfig(config);

      expect(biomeConfig).toBeUndefined();
    });
  });

  describe('edge cases', () => {
    it('should handle empty formatters config', () => {
      const config: RightdownConfig = {
        version: 2,
        preset: 'standard',
      };

      const result = compiler.compile(config);

      expect(isSuccess(result)).toBe(true);
      if (result.success) {
        const configs = result.data;
        expect(configs.markdownlint).toBeDefined();
        // No formatters defined, so no formatter configs
        expect(configs.prettier).toBeUndefined();
        expect(configs.biome).toBeUndefined();
      }
    });

    it('should handle invalid formatter names gracefully', () => {
      const config: RightdownConfig = {
        version: 2,
        formatters: {
          default: 'unknown-formatter',
        },
      };

      const result = compiler.compile(config);

      expect(isSuccess(result)).toBe(true);
      // Should ignore unknown formatters
    });

    it('should merge preset rules with custom rules correctly', () => {
      const config: RightdownConfig = {
        version: 2,
        preset: 'strict',
        rules: {
          'line-length': false, // Override strict preset
          'custom-rule': true, // Add new rule
        },
      };

      const mdConfig = compiler.generateMarkdownlintConfig(config);

      // Should have preset rules
      expect(mdConfig.rules['heading-increment']).toBe(true);
      // Should override preset rule
      expect(mdConfig.rules['line-length']).toBe(false);
      // Should add custom rule
      expect(mdConfig.rules['custom-rule']).toBe(true);
    });
  });
});
