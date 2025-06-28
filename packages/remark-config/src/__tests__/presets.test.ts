import { describe, it, expect } from 'vitest';
import { standard, strict, relaxed, generate } from '../presets/index.js';

describe('@outfitter/remark-config', () => {
  describe('presets', () => {
    it('should export standard preset', () => {
      expect(standard).toBeDefined();
      expect(standard.plugins).toBeInstanceOf(Array);
      expect(standard.settings).toBeDefined();
    });

    it('should export strict preset', () => {
      expect(strict).toBeDefined();
      expect(strict.plugins).toBeInstanceOf(Array);
      expect(strict.settings).toBeDefined();
    });

    it('should export relaxed preset', () => {
      expect(relaxed).toBeDefined();
      expect(relaxed.plugins).toBeInstanceOf(Array);
      expect(relaxed.settings).toBeDefined();
    });

    it('should have different line length rules for different presets', () => {
      const standardLineLength = standard.plugins?.find(
        (plugin) => Array.isArray(plugin) && plugin[0] === 'remark-lint-maximum-line-length',
      );
      const strictLineLength = strict.plugins?.find(
        (plugin) => Array.isArray(plugin) && plugin[0] === 'remark-lint-maximum-line-length',
      );
      const relaxedLineLength = relaxed.plugins?.find(
        (plugin) => Array.isArray(plugin) && plugin[0] === 'remark-lint-maximum-line-length',
      );

      expect(standardLineLength).toEqual(['remark-lint-maximum-line-length', 80]);
      expect(strictLineLength).toEqual(['remark-lint-maximum-line-length', 80]);
      expect(relaxedLineLength).toEqual(['remark-lint-maximum-line-length', 120]);
    });

    it('should use consistent list marker style across presets', () => {
      const standardListMarker = standard.plugins?.find(
        (plugin) =>
          Array.isArray(plugin) && plugin[0] === 'remark-lint-unordered-list-marker-style',
      );
      const strictListMarker = strict.plugins?.find(
        (plugin) =>
          Array.isArray(plugin) && plugin[0] === 'remark-lint-unordered-list-marker-style',
      );
      const relaxedListMarker = relaxed.plugins?.find(
        (plugin) =>
          Array.isArray(plugin) && plugin[0] === 'remark-lint-unordered-list-marker-style',
      );

      expect(standardListMarker).toEqual(['remark-lint-unordered-list-marker-style', '-']);
      expect(strictListMarker).toEqual(['remark-lint-unordered-list-marker-style', '-']);
      expect(relaxedListMarker).toEqual(['remark-lint-unordered-list-marker-style', '-']);
    });

    it('should use consistent settings across presets', () => {
      const expectedSettings = {
        bullet: '-',
        emphasis: '*',
        strong: '*',
        listItemIndent: 'one',
        fence: '`',
        rule: '-',
        setext: false,
      };

      expect(standard.settings).toEqual(expectedSettings);
      expect(strict.settings).toEqual(expectedSettings);
      expect(relaxed.settings).toEqual(expectedSettings);
    });
  });

  describe('generate function', () => {
    it('should generate standard preset by default', () => {
      const config = generate();
      expect(config.plugins).toEqual(standard.plugins);
      expect(config.settings).toEqual(standard.settings);
    });

    it('should generate specified preset', () => {
      const strictConfig = generate({ preset: 'strict' });
      expect(strictConfig.plugins).toEqual(strict.plugins);

      const relaxedConfig = generate({ preset: 'relaxed' });
      expect(relaxedConfig.plugins).toEqual(relaxed.plugins);
    });

    it('should add additional plugins', () => {
      const additionalPlugins = ['remark-lint-no-html', ['remark-lint-emphasis-marker', '*']];
      const config = generate({ additionalPlugins });

      expect(config.plugins).toEqual([...(standard.plugins || []), ...additionalPlugins]);
    });

    it('should override settings', () => {
      const customSettings = { bullet: '*' as const, emphasis: '_' as const };
      const config = generate({ settings: customSettings });

      expect(config.settings).toEqual({
        ...standard.settings,
        ...customSettings,
      });
    });

    it('should combine preset, additional plugins, and custom settings', () => {
      const config = generate({
        preset: 'strict',
        additionalPlugins: ['remark-lint-no-html'],
        settings: { bullet: '*' },
      });

      expect(config.plugins).toEqual([...(strict.plugins || []), 'remark-lint-no-html']);
      expect(config.settings).toEqual({
        ...strict.settings,
        bullet: '*',
      });
    });
  });
});
