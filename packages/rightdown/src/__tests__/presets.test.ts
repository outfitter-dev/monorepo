import { describe, it, expect } from 'vitest';
import { getPresetConfig, presets } from '../presets/index.js';

describe('presets', () => {
  describe('getPresetConfig', () => {
    it('should return strict preset config', () => {
      const config = getPresetConfig('strict');

      expect(config).toHaveProperty('MD013');
      expect((config as any).MD013).toBe(false); // MD013 is disabled in strict preset
      expect((config as any).default).toBe(true);
    });

    it('should return standard preset config', () => {
      const config = getPresetConfig('standard');

      expect((config as any).MD013).toBe(false);
      expect((config as any).MD033).toBe(false);
      expect((config as any).default).toBe(true);
    });

    it('should return relaxed preset config', () => {
      const config = getPresetConfig('relaxed');

      expect((config as any).default).toBe(false);
      expect((config as any).MD001).toBe(true);
    });

    it('should default to standard for invalid preset', () => {
      const config = getPresetConfig('invalid' as any);
      const standardConfig = getPresetConfig('standard');

      expect(JSON.stringify(config)).toEqual(JSON.stringify(standardConfig));
    });
  });

  describe('presets metadata', () => {
    it('should have all three presets defined', () => {
      expect(presets).toHaveProperty('strict');
      expect(presets).toHaveProperty('standard');
      expect(presets).toHaveProperty('relaxed');
    });

    it('should have names and descriptions', () => {
      expect(presets.strict).toHaveProperty('name', 'strict');
      expect(presets.strict).toHaveProperty('description');
      expect(presets.standard).toHaveProperty('name', 'standard');
      expect(presets.standard).toHaveProperty('description');
      expect(presets.relaxed).toHaveProperty('name', 'relaxed');
      expect(presets.relaxed).toHaveProperty('description');
    });
  });
});
