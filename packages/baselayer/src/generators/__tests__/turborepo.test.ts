import { describe, expect, it } from 'vitest';
import type { BaselayerConfig } from '../../schemas/baselayer-config.js';
import {
  generateProjectTurboConfig,
  generateTurboConfig,
} from '../turborepo.js';

describe('generateTurboConfig', () => {
  it('should generate basic Turborepo configuration', () => {
    const config = generateTurboConfig();

    expect(config.$schema).toBe('https://turbo.build/schema.json');
    expect(config.ui).toBe('tui');
    expect(config.pipeline).toBeDefined();
    expect(config.globalDependencies).toContain('tsconfig*.json');
    expect(config.globalEnv).toContain('NODE_ENV');
  });

  it('should include essential pipeline tasks', () => {
    const config = generateTurboConfig();

    expect(config.pipeline).toHaveProperty('build');
    expect(config.pipeline).toHaveProperty('lint');
    expect(config.pipeline).toHaveProperty('format');
    expect(config.pipeline).toHaveProperty('dev');
    expect(config.pipeline).toHaveProperty('clean');

    // Build should depend on upstream builds
    expect(config.pipeline.build.dependsOn).toContain('^build');
    expect(config.pipeline.build.outputs).toContain('dist/**');
  });

  it('should include type-check when TypeScript enabled', () => {
    const baselayerConfig: BaselayerConfig = {
      features: { typescript: true },
    };

    const config = generateTurboConfig(baselayerConfig);

    expect(config.pipeline).toHaveProperty('type-check');
    expect(config.pipeline['type-check'].dependsOn).toContain('^type-check');
    expect(config.pipeline['type-check'].inputs).toContain('tsconfig*.json');
  });

  it('should exclude type-check when TypeScript disabled', () => {
    const baselayerConfig: BaselayerConfig = {
      features: { typescript: false },
    };

    const config = generateTurboConfig(baselayerConfig);

    expect(config.pipeline).not.toHaveProperty('type-check');
  });

  it('should include test tasks when testing enabled', () => {
    const baselayerConfig: BaselayerConfig = {
      features: { testing: true },
    };

    const config = generateTurboConfig(baselayerConfig);

    expect(config.pipeline).toHaveProperty('test');
    expect(config.pipeline).toHaveProperty('test:run');
    expect(config.pipeline.test.dependsOn).toContain('^build');
    expect(config.pipeline.test.outputs).toContain('coverage/**');
    expect(config.pipeline['test:run'].cache).toBe(false);
  });

  it('should exclude test tasks when testing disabled', () => {
    const baselayerConfig: BaselayerConfig = {
      features: { testing: false },
    };

    const config = generateTurboConfig(baselayerConfig);

    expect(config.pipeline).not.toHaveProperty('test');
    expect(config.pipeline).not.toHaveProperty('test:run');
  });

  it('should include Next.js specific tasks', () => {
    const baselayerConfig: BaselayerConfig = {
      project: { framework: 'next' },
    };

    const config = generateTurboConfig(baselayerConfig);

    expect(config.pipeline).toHaveProperty('build:next');
    expect(config.pipeline['build:next'].inputs).toContain('next.config.*');
    expect(config.pipeline['build:next'].outputs).toContain('.next/**');
    expect(config.pipeline['build:next'].env).toContain('NEXT_PUBLIC_*');
  });
});

describe('generateProjectTurboConfig', () => {
  it('should optimize for library projects', () => {
    const baselayerConfig: BaselayerConfig = {
      project: { type: 'library' },
    };

    const config = generateProjectTurboConfig(baselayerConfig);

    // Libraries don't need dev servers
    expect(config.pipeline).not.toHaveProperty('dev');
    expect(config.pipeline).not.toHaveProperty('start');

    // But they should have declaration builds
    expect(config.pipeline).toHaveProperty('build:declarations');
    expect(config.pipeline['build:declarations'].outputs).toContain(
      'dist/**/*.d.ts'
    );
  });

  it('should optimize for applications', () => {
    const baselayerConfig: BaselayerConfig = {
      project: { type: 'application' },
    };

    const config = generateProjectTurboConfig(baselayerConfig);

    // Apps might not publish
    expect(config.pipeline).not.toHaveProperty('prepublishOnly');

    // But they should have deployment tasks
    expect(config.pipeline).toHaveProperty('deploy');
    expect(config.pipeline.deploy.dependsOn).toContain('build');
    expect(config.pipeline.deploy.cache).toBe(false);
  });

  it('should maintain monorepo tasks', () => {
    const baselayerConfig: BaselayerConfig = {
      project: { type: 'monorepo' },
      features: { testing: true }, // Need to enable testing to get test tasks
    };

    const config = generateProjectTurboConfig(baselayerConfig);

    // Should have all standard tasks for monorepos
    expect(config.pipeline).toHaveProperty('build');
    expect(config.pipeline).toHaveProperty('dev');
    expect(config.pipeline).toHaveProperty('test');
    expect(config.pipeline).toHaveProperty('lint');
  });
});
