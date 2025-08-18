import { failure, isFailure, type Result, success } from '@outfitter/contracts';
import type { BaselayerConfig } from '../schemas/baselayer-config.js';
import { writeFile } from '../utils/file-system.js';

/**

- Generate vitest.config.ts configuration
 */
export function generateVitestConfig(config?: BaselayerConfig): string {
  const isReactProject =
    config?.project?.framework === 'react' ||
    config?.project?.framework === 'next';

  const imports = ["import { defineConfig } from 'vitest/config'"];

  if (isReactProject) {
    imports.push("import react from '@vitejs/plugin-react'");
  }

  const plugins = [];
  if (isReactProject) {
    plugins.push('react()');
  }

  const testConfig = {
    globals: true,
    environment: isReactProject ? 'jsdom' : 'node',
    setupFiles: './src/test-setup.ts',
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/cypress/**',
      '**/.{idea,git,cache,output,temp}/**',
      '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*',
    ],
  };

  // Add coverage configuration
  const coverage = {
    provider: 'v8' as const,
    reporter: ['text', 'json', 'html'],
    exclude: [
      'coverage/**',
      'dist/**',
      'packages/*/test{,s}/**',
      '**/*.d.ts',
      'cypress/**',
      'test{,s}/**',
      'test{,-*}.{js,cjs,mjs,ts,tsx,jsx}',
      '**/*{.,-}test.{js,cjs,mjs,ts,tsx,jsx}',
      '**/*{.,-}spec.{js,cjs,mjs,ts,tsx,jsx}',
      '**/**tests**/**',
      '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*',
      '**/.{eslint,mocha,prettier}rc.{js,cjs,yml}',
    ],
    thresholds: {
      global: {
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80,
      },
    },
  };

  // Monorepo-specific configuration
  if (config?.project?.type === 'monorepo') {
    testConfig.include.push(
      'packages/*/src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'
    );
    coverage.exclude.push('packages/*/dist/**', 'packages/*/build/**');
  }

  // Add custom ignores to exclude
  if (config?.ignore) {
    testConfig.exclude.push(...config.ignore);
    coverage.exclude.push(...config.ignore);
  }

  const configObject = {
    plugins: plugins.length > 0 ? plugins : undefined,
    test: testConfig,
    coverage,
  };

  const configString = JSON.stringify(configObject, null, 2)
    .replace(/"/g, "'")
    .replace(/'(\w+)':/g, '$1:')
    .replace(/'(react\(\))'/g, '$1'); // Remove quotes from function calls

  return `${imports.join('\n')}

export default defineConfig(${configString})
`;
}

/**

- Generate test setup file content
 */
export function generateTestSetup(config?: BaselayerConfig): string {
  const isReactProject =
    config?.project?.framework === 'react' ||
    config?.project?.framework === 'next';

  const imports = [];
  const setup = [];

  if (isReactProject) {
    imports.push(
      "import { cleanup } from '@testing-library/react'",
      "import { afterEach } from 'vitest'"
    );
    setup.push('afterEach(() => {\n  cleanup()\n})');
  }

  // Add global test utilities
  setup.push(`
// Custom matchers or global test utilities can be added here
// Example: extend expect with custom matchers
// expect.extend({
//   toBeWithinRange(received, floor, ceiling) {
//     const pass = received >= floor && received <= ceiling
//     if (pass) {
//       return {
//         message: () => \`expected \${received} not to be within range \${floor} - \${ceiling}\`,
//         pass: true,
//       }
//     } else {
//       return {
//         message: () => \`expected \${received} to be within range \${floor} - \${ceiling}\`,
//         pass: false,
//       }
//     }
//   },
// })
`);

  return `${imports.join('\n')}

${setup.join('\n\n')}
`;
}

/**

- Write Vitest configuration files
 */
export async function generateVitestConfigFiles(
  config?: BaselayerConfig
): Promise<Result<void, Error>> {
  try {
    // Generate vitest.config.ts
    const vitestConfig = generateVitestConfig(config);
    const vitestResult = await writeFile('vitest.config.ts', vitestConfig);
    if (isFailure(vitestResult)) {
      return failure(new Error(vitestResult.error.message));
    }

    // Generate test setup file if it doesn't exist
    const testSetup = generateTestSetup(config);
    const setupResult = await writeFile('src/test-setup.ts', testSetup);
    if (isFailure(setupResult)) {
      return failure(new Error(setupResult.error.message));
    }

    return success(undefined);
  } catch (error) {
    return failure(error as Error);
  }
}
