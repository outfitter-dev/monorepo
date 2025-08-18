/*
---

slug: testing-vitest-config
title: Vitest configuration with coverage and TypeScript paths
description: Complete Vitest configuration template with coverage, globals, and path aliases.
type: template
---

*/

import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Enable global test APIs (describe, it, expect)
    globals: true,

    // Test environment
    environment: 'node', // Use 'jsdom' for browser-like testing

    // Setup files
    setupFiles: ['./src/test/setup.ts'],

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      exclude: [
        'node_modules/**',
        'src/test/**',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData/**',
        '**/*.stories.tsx',
      ],
      thresholds: {
        statements: 80,
        branches: 80,
        functions: 80,
        lines: 80,
      },
    },

    // Test timeout
    testTimeout: 10_000,

    // Retry failed tests
    retry: process.env.CI ? 2 : 0,

    // Reporter configuration
    reporters: process.env.CI ? ['verbose', 'junit'] : ['verbose'],

    // Output file for JUnit reporter
    outputFile: {
      junit: './test-results/junit.xml',
    },
  },

  // Path resolution
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@test': path.resolve(__dirname, './src/test'),
    },
  },
});
