import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/**', 'dist/**', '*.config.*', 'src/**/*.d.ts'],
    },
    // Clear mocks between tests
    clearMocks: true,
    restoreMocks: true,
    // Enable mock modules for proper testing
    mockReset: true,
    // Configure test paths
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
  },
});
