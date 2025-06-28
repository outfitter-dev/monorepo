/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';

export default defineConfig({
  resolve: {
    alias: {
      '@outfitter/contracts': resolve(__dirname, '../contracts/typescript/src/index.ts'),
      '@outfitter/contracts-zod': resolve(__dirname, '../contracts-zod/src/index.ts'),
      '@outfitter/biome-config': resolve(__dirname, '../biome-config/src/index.ts'),
      '@outfitter/prettier-config': resolve(__dirname, '../prettier-config/index.js'),
      '@outfitter/remark-config': resolve(__dirname, '../remark-config/src/index.ts'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/coverage/**',
        'src/cli.ts', // CLI tested separately
      ],
    },
  },
});
