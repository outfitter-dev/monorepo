import { describe, expect, it } from 'vitest';
import {
  generateSyncpackConfigObject,
  type SyncpackConfig,
} from '../syncpack.js';

describe('syncpack generator', () => {
  describe('generateSyncpackConfigObject', () => {
    it('should generate default configuration', () => {
      const config = generateSyncpackConfigObject();

      expect(config).toBeDefined();
      expect(config.versionGroups).toBeDefined();
      expect(config.semverGroups).toBeDefined();
      expect(config.sortAz).toBeDefined();
      expect(config.sortFirst).toBeDefined();
    });

    it('should handle monorepo configuration', () => {
      const config = generateSyncpackConfigObject(undefined, {
        monorepo: true,
        internalPackageScope: '@mycompany',
      });

      expect(config.versionGroups).toHaveLength(1);
      expect(config.versionGroups?.[0]).toMatchObject({
        label: 'Use workspace protocol for internal packages',
        dependencies: ['@mycompany/**'],
        pinVersion: 'workspace:*',
      });
    });

    it('should exclude workspace protocol for single packages', () => {
      const config = generateSyncpackConfigObject(undefined, {
        monorepo: false,
      });

      expect(config.versionGroups).toHaveLength(0);
    });

    it('should add additional semver groups', () => {
      const additionalGroups: SyncpackConfig['semverGroups'] = [
        {
          label: 'Keep React versions in sync',
          packages: ['**'],
          dependencies: ['react', 'react-dom'],
          dependencyTypes: ['prod'],
          range: '^',
        },
      ];

      const config = generateSyncpackConfigObject(undefined, {
        additionalSemverGroups: additionalGroups,
      });

      const reactGroup = config.semverGroups?.find(
        (g) => g.label === 'Keep React versions in sync'
      );
      expect(reactGroup).toBeDefined();
    });

    it('should filter out disabled tools', () => {
      const config = generateSyncpackConfigObject({
        features: {
          linting: false,
          formatting: false,
          markdown: false,
          testing: false,
          gitHooks: false,
        },
        // biome-ignore lint/suspicious/noExplicitAny: Testing with partial config
      } as any);

      // Should keep TypeScript groups
      const tsGroup = config.semverGroups?.find((g) =>
        g.dependencies.includes('typescript')
      );
      expect(tsGroup).toBeDefined();

      // Should remove tool-specific groups
      const biomeGroup = config.semverGroups?.find((g) =>
        g.dependencies.some((d) => d.includes('biome'))
      );
      expect(biomeGroup).toBeUndefined();
    });
  });
});
