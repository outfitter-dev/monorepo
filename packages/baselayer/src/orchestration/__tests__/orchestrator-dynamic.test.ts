import { beforeEach, describe, expect, it } from 'vitest';
import type { BaselayerConfig } from '../../schemas/baselayer-config.js';
import { Orchestrator } from '../orchestrator.js';

describe('Orchestrator Dynamic Configuration', () => {
  let orchestrator: Orchestrator;

  beforeEach(() => {
    orchestrator = new Orchestrator();
  });

  describe('configuration loading', () => {
    it('should initialize with default configuration', async () => {
      const result = await orchestrator.initialize();
      expect(result.success).toBe(true);

      const config = orchestrator.getCurrentConfig();
      expect(config).toBeDefined();
      expect(config?.features?.typescript).toBe(true);
      expect(config?.features?.json).toBe(true);
    });

    it('should handle missing configuration file gracefully', async () => {
      const result = await orchestrator.initialize('/nonexistent/path');
      expect(result.success).toBe(true); // Should use defaults

      const config = orchestrator.getCurrentConfig();
      expect(config?.features?.typescript).toBe(true);
    });
  });

  describe('dynamic adapter registration', () => {
    it('should register adapters based on enabled features', async () => {
      const config: BaselayerConfig = {
        features: {
          typescript: true,
          json: true,
          styles: false, // Disabled - Prettier should handle CSS
          markdown: false, // Disabled - Prettier should handle MD
        },
      };

      await orchestrator.reconfigure(config);

      const registry = orchestrator.getAdapterRegistry();
      expect(registry.hasAdapter('typescript')).toBe(true);
      expect(registry.hasAdapter('json')).toBe(true);
      expect(registry.hasAdapter('css')).toBe(false); // Disabled
      expect(registry.hasAdapter('markdown')).toBe(false); // Disabled
    });

    it('should configure tool boundaries correctly', async () => {
      const config: BaselayerConfig = {
        features: {
          typescript: true,
          json: true,
          styles: false, // CSS handled by Prettier
          markdown: false, // Markdown handled by Prettier
        },
      };

      await orchestrator.reconfigure(config);

      const fileMatcher = orchestrator.getFileMatcher();
      const handlers = fileMatcher.getActiveHandlers();

      // When stylelint is disabled, Prettier (json) should handle CSS files
      expect(handlers.json).toContain('.css');
      expect(handlers.json).toContain('.scss');
      expect(handlers.json).toContain('.md');
      expect(handlers.json).toContain('.mdx');

      // CSS and Markdown handlers should be empty
      expect(handlers.css).toHaveLength(0);
      expect(handlers.markdown).toHaveLength(0);
    });
  });

  describe('file categorization', () => {
    it('should categorize files based on dynamic configuration', async () => {
      const config: BaselayerConfig = {
        features: {
          typescript: true,
          json: true,
          styles: false, // Prettier handles CSS
          markdown: true, // Markdownlint enabled
        },
      };

      await orchestrator.reconfigure(config);

      const fileMatcher = orchestrator.getFileMatcher();
      const files = ['test.ts', 'style.css', 'readme.md', 'config.json'];
      const categorized = fileMatcher.categorizeFiles(files, config);

      expect(categorized.typescript).toContain('test.ts');
      expect(categorized.json).toContain('style.css'); // CSS handled by Prettier
      expect(categorized.json).toContain('config.json');
      expect(categorized.markdown).toContain('readme.md'); // Markdownlint enabled
      expect(categorized.css).toHaveLength(0); // Stylelint disabled
    });
  });

  describe('orchestration summary', () => {
    it('should provide useful debugging information', async () => {
      const config: BaselayerConfig = {
        features: {
          typescript: true,
          json: true,
          styles: false,
          markdown: false,
        },
      };

      await orchestrator.reconfigure(config);

      const summary = orchestrator.getSummary();

      expect(summary.configLoaded).toBe(true);
      expect(summary.adapters.totalAdapters).toBeGreaterThan(0);
      expect(summary.adapters.disabledFeatures).toContain('styles');
      expect(summary.adapters.disabledFeatures).toContain('markdown');
      expect(summary.fileHandlers.json).toContain('.css'); // Prettier handles CSS
    });
  });
});
