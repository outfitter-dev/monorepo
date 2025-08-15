import { describe, expect, it } from 'vitest';
import type { BaselayerConfig } from '../../schemas/baselayer-config.js';
import {
  generateProjectTypeScriptConfigs,
  generateTypeScriptConfig,
} from '../typescript.js';

describe('generateTypeScriptConfig', () => {
  it('should generate strict preset by default', () => {
    const config = generateTypeScriptConfig();

    expect(config.compilerOptions).toMatchObject({
      target: 'ES2022',
      lib: ['ES2022'],
      module: 'ESNext',
      moduleResolution: 'bundler',
      strict: true,
      noImplicitAny: true,
      noImplicitReturns: true,
      noUncheckedIndexedAccess: true,
    });

    expect(config.include).toEqual(['src/**/*']);
    expect(config.exclude).toContain('node_modules');
  });

  it('should configure for React projects', () => {
    const baselayerConfig: BaselayerConfig = {
      project: { framework: 'react' },
    };

    const config = generateTypeScriptConfig(baselayerConfig);

    expect(config.compilerOptions).toMatchObject({
      jsx: 'react-jsx',
      lib: expect.arrayContaining(['ES2022', 'DOM', 'DOM.Iterable']),
    });
  });

  it('should configure for Next.js projects', () => {
    const baselayerConfig: BaselayerConfig = {
      project: { framework: 'next' },
    };

    const config = generateTypeScriptConfig(baselayerConfig);

    expect(config.compilerOptions).toMatchObject({
      jsx: 'preserve',
      lib: expect.arrayContaining(['ES2022', 'DOM', 'DOM.Iterable']),
      incremental: true,
      plugins: [{ name: 'next' }],
    });
  });

  it('should configure for library projects', () => {
    const baselayerConfig: BaselayerConfig = {
      project: { type: 'library' },
    };

    const config = generateTypeScriptConfig(baselayerConfig);

    expect(config.compilerOptions).toMatchObject({
      declaration: true,
      declarationMap: true,
      outDir: './dist',
      rootDir: './src',
    });
  });

  it('should add monorepo exclusions', () => {
    const baselayerConfig: BaselayerConfig = {
      project: { type: 'monorepo' },
    };

    const config = generateTypeScriptConfig(baselayerConfig);

    expect(config.exclude).toContain('packages/**/node_modules');
    expect(config.exclude).toContain('packages/**/dist');
  });

  it('should include testing files when testing enabled', () => {
    const baselayerConfig: BaselayerConfig = {
      features: { testing: true },
    };

    const config = generateTypeScriptConfig(baselayerConfig);

    expect(config.include).toContain('**/*.test.*');
    expect(config.include).toContain('**/*.spec.*');
  });

  it('should add custom ignore patterns', () => {
    const baselayerConfig: BaselayerConfig = {
      ignore: ['custom-build/', '*.generated.*'],
    };

    const config = generateTypeScriptConfig(baselayerConfig);

    expect(config.exclude).toContain('custom-build/');
    expect(config.exclude).toContain('*.generated.*');
  });
});

describe('generateProjectTypeScriptConfigs', () => {
  it('should generate basic config for simple projects', () => {
    const configs = generateProjectTypeScriptConfigs();

    expect(Object.keys(configs)).toContain('tsconfig.json');
    expect(configs['tsconfig.json'].compilerOptions).toMatchObject({
      target: 'ES2022',
      strict: true,
    });
  });

  it('should generate build config for libraries', () => {
    const baselayerConfig: BaselayerConfig = {
      project: { type: 'library' },
    };

    const configs = generateProjectTypeScriptConfigs(baselayerConfig);

    expect(Object.keys(configs)).toContain('tsconfig.build.json');
    expect(configs['tsconfig.build.json']).toMatchObject({
      extends: './tsconfig.json',
      compilerOptions: {
        composite: true,
        declaration: true,
      },
      exclude: expect.arrayContaining(['**/*.test.*', '**/*.spec.*']),
    });
  });

  it('should generate test config when testing enabled', () => {
    const baselayerConfig: BaselayerConfig = {
      features: { testing: true },
    };

    const configs = generateProjectTypeScriptConfigs(baselayerConfig);

    expect(Object.keys(configs)).toContain('tsconfig.test.json');
    expect(configs['tsconfig.test.json']).toMatchObject({
      extends: './tsconfig.json',
      compilerOptions: {
        types: ['vitest/globals', 'node'],
      },
      include: expect.arrayContaining(['**/*.test.*', '**/*.spec.*']),
    });
  });
});
