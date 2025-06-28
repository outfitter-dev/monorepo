import { describe, it, expect } from 'vitest';
import { config, generate } from '../index.js';

describe('@outfitter/biome-config', () => {
  describe('config export', () => {
    it('should export base config', () => {
      expect(config).toBeDefined();
      expect(config.formatter).toBeDefined();
      expect(config.javascript).toBeDefined();
    });

    it('should have expected default settings', () => {
      expect(config.formatter.indentStyle).toBe('space');
      expect(config.formatter.indentWidth).toBe(2);
      expect(config.formatter.lineWidth).toBe(100);
      expect(config.javascript.formatter.quoteStyle).toBe('single');
    });
  });

  describe('generate function', () => {
    it('should return base config when no options provided', () => {
      const generated = generate();
      expect(generated).toEqual(config);
    });

    it('should apply indentation settings', () => {
      const generated = generate({
        indentation: {
          style: 'tab',
          width: 4,
        },
      });

      expect(generated.formatter.indentStyle).toBe('tab');
      expect(generated.formatter.indentWidth).toBe(4);
    });

    it('should apply line width setting', () => {
      const generated = generate({
        lineWidth: 80,
      });

      expect(generated.formatter.lineWidth).toBe(80);
    });

    it('should apply quote settings', () => {
      const generated = generate({
        quotes: {
          style: 'double',
          jsx: 'single',
        },
      });

      expect(generated.javascript.formatter.quoteStyle).toBe('double');
      expect(generated.javascript.formatter.jsxQuoteStyle).toBe('single');
    });

    it('should apply semicolon settings', () => {
      const generatedAlways = generate({
        semicolons: 'always',
      });
      expect(generatedAlways.javascript.formatter.semicolons).toBe('always');

      const generatedAsNeeded = generate({
        semicolons: 'asNeeded',
      });
      expect(generatedAsNeeded.javascript.formatter.semicolons).toBe('asNeeded');

      const generatedTrue = generate({
        semicolons: true,
      });
      expect(generatedTrue.javascript.formatter.semicolons).toBe('always');
    });

    it('should apply trailing comma settings', () => {
      const generated = generate({
        trailingComma: 'es5',
      });

      expect(generated.javascript.formatter.trailingCommas).toBe('es5');
    });

    it('should apply arrow parentheses settings', () => {
      const generated = generate({
        arrowParens: 'asNeeded',
      });

      expect(generated.javascript.formatter.arrowParentheses).toBe('asNeeded');
    });

    it('should apply multiple settings together', () => {
      const generated = generate({
        indentation: { style: 'space', width: 2 },
        lineWidth: 80,
        quotes: { style: 'single', jsx: 'double' },
        semicolons: 'always',
        trailingComma: 'all',
        arrowParens: 'always',
      });

      expect(generated.formatter.indentStyle).toBe('space');
      expect(generated.formatter.indentWidth).toBe(2);
      expect(generated.formatter.lineWidth).toBe(80);
      expect(generated.javascript.formatter.quoteStyle).toBe('single');
      expect(generated.javascript.formatter.jsxQuoteStyle).toBe('double');
      expect(generated.javascript.formatter.semicolons).toBe('always');
      expect(generated.javascript.formatter.trailingCommas).toBe('all');
      expect(generated.javascript.formatter.arrowParentheses).toBe('always');
    });

    it('should not mutate the base config', () => {
      const originalLineWidth = config.formatter.lineWidth;

      generate({
        lineWidth: 120,
      });

      expect(config.formatter.lineWidth).toBe(originalLineWidth);
    });
  });
});
