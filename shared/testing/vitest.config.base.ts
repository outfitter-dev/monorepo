import { defineConfig } from 'vitest/config';

/**

- Base Vitest configuration for all packages in the Outfitter monorepo
- Individual packages can extend this config and add package-specific settings
 */
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      exclude: [
        'node_modules/**',
        'dist/**',
        'build/**',
        '**/*.config.{js,ts}',
        '**/*.test.{js,ts}',
        '**/**tests**/**',
        '**/test-utils/**',
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
      },
    },
    setupFiles: [],
    testTimeout: 10_000,
    hookTimeout: 10_000,
  },
  esbuild: {
    target: 'node18',
  },
});
