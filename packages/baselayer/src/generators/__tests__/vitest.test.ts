import { describe, expect, it } from 'vitest';
import type { BaselayerConfig } from '../../schemas/baselayer-config.js';
import { generateTestSetup, generateVitestConfig } from '../vitest.js';

describe('generateVitestConfig', () => {
  it('should generate basic Node.js configuration', () => {
    const config = generateVitestConfig();

    expect(config).toContain('vitest/config');
    expect(config).toContain('globals: true');
    expect(config).toContain("environment: 'node'");
    expect(config).toContain("setupFiles: './src/test-setup.ts'");
    expect(config).toContain('coverage');
  });

  it('should configure for React projects', () => {
    const baselayerConfig: BaselayerConfig = {
      project: { framework: 'react' },
    };

    const config = generateVitestConfig(baselayerConfig);

    expect(config).toContain('@vitejs/plugin-react');
    expect(config).toContain("environment: 'jsdom'");
    expect(config).toContain('react()');
  });

  it('should configure for Next.js projects', () => {
    const baselayerConfig: BaselayerConfig = {
      project: { framework: 'next' },
    };

    const config = generateVitestConfig(baselayerConfig);

    expect(config).toContain('@vitejs/plugin-react');
    expect(config).toContain("environment: 'jsdom'");
    expect(config).toContain('react()');
  });

  it('should add monorepo includes', () => {
    const baselayerConfig: BaselayerConfig = {
      project: { type: 'monorepo' },
    };

    const config = generateVitestConfig(baselayerConfig);

    expect(config).toContain(
      'packages/*/src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'
    );
  });

  it('should add custom ignores to exclude', () => {
    const baselayerConfig: BaselayerConfig = {
      ignore: ['custom-build/', '*.generated.*'],
    };

    const config = generateVitestConfig(baselayerConfig);

    expect(config).toContain('custom-build/');
    expect(config).toContain('*.generated.*');
  });

  it('should include coverage configuration', () => {
    const config = generateVitestConfig();

    expect(config).toContain('coverage');
    expect(config).toContain("provider: 'v8'");
    expect(config).toContain("'text'");
    expect(config).toContain("'json'");
    expect(config).toContain("'html'");
    expect(config).toContain('thresholds');
    expect(config).toContain('branches: 80');
    expect(config).toContain('functions: 80');
    expect(config).toContain('lines: 80');
    expect(config).toContain('statements: 80');
  });
});

describe('generateTestSetup', () => {
  it('should generate basic test setup', () => {
    const setup = generateTestSetup();

    expect(setup).toContain('// Custom matchers or global test utilities');
    expect(setup).toContain('// Example: extend expect with custom matchers');
  });

  it('should include React cleanup for React projects', () => {
    const baselayerConfig: BaselayerConfig = {
      project: { framework: 'react' },
    };

    const setup = generateTestSetup(baselayerConfig);

    expect(setup).toContain('@testing-library/react');
    expect(setup).toContain('cleanup');
    expect(setup).toContain('afterEach(() => {');
    expect(setup).toContain('cleanup()');
  });

  it('should include React cleanup for Next.js projects', () => {
    const baselayerConfig: BaselayerConfig = {
      project: { framework: 'next' },
    };

    const setup = generateTestSetup(baselayerConfig);

    expect(setup).toContain('@testing-library/react');
    expect(setup).toContain('cleanup');
    expect(setup).toContain('afterEach(() => {');
    expect(setup).toContain('cleanup()');
  });
});
