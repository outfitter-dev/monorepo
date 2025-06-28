import { describe, it, expect } from 'vitest';
import { getPreset, getAllPresets, standard, strict, relaxed } from '../core/presets.js';
import type { PresetName } from '../types/index.js';

describe('presets', () => {
  describe('individual presets', () => {
    it('should export standard preset', () => {
      expect(standard).toBeDefined();
      expect(standard.name).toBe('standard');
      expect(standard.lineWidth).toBe(80);
      expect(standard.indentation.style).toBe('space');
      expect(standard.quotes.style).toBe('single');
    });

    it('should export strict preset', () => {
      expect(strict).toBeDefined();
      expect(strict.name).toBe('strict');
      expect(strict.lineWidth).toBe(80);
      expect(strict.quotes.jsx).toBe('single'); // Different from standard
    });

    it('should export relaxed preset', () => {
      expect(relaxed).toBeDefined();
      expect(relaxed.name).toBe('relaxed');
      expect(relaxed.lineWidth).toBe(120); // Different from others
      expect(relaxed.semicolons).toBe('asNeeded');
    });
  });

  describe('getPreset', () => {
    it('should return standard preset', () => {
      const preset = getPreset('standard');
      expect(preset).toEqual(standard);
    });

    it('should return strict preset', () => {
      const preset = getPreset('strict');
      expect(preset).toEqual(strict);
    });

    it('should return relaxed preset', () => {
      const preset = getPreset('relaxed');
      expect(preset).toEqual(relaxed);
    });

    it('should throw for unknown preset', () => {
      expect(() => getPreset('unknown' as PresetName)).toThrow('Unknown preset: unknown');
    });
  });

  describe('getAllPresets', () => {
    it('should return all presets', () => {
      const presets = getAllPresets();

      expect(presets).toHaveProperty('standard');
      expect(presets).toHaveProperty('strict');
      expect(presets).toHaveProperty('relaxed');

      expect(presets.standard).toEqual(standard);
      expect(presets.strict).toEqual(strict);
      expect(presets.relaxed).toEqual(relaxed);
    });
  });

  describe('preset differences', () => {
    it('should have different line widths', () => {
      expect(standard.lineWidth).toBe(80);
      expect(strict.lineWidth).toBe(80);
      expect(relaxed.lineWidth).toBe(120);
    });

    it('should have different JSX quote styles', () => {
      expect(standard.quotes.jsx).toBe('double');
      expect(strict.quotes.jsx).toBe('single');
      expect(relaxed.quotes.jsx).toBe('double');
    });

    it('should have different semicolon preferences', () => {
      expect(standard.semicolons).toBe('always');
      expect(strict.semicolons).toBe('always');
      expect(relaxed.semicolons).toBe('asNeeded');
    });

    it('should have different trailing comma preferences', () => {
      expect(standard.trailingComma).toBe('all');
      expect(strict.trailingComma).toBe('all');
      expect(relaxed.trailingComma).toBe('es5');
    });
  });
});
