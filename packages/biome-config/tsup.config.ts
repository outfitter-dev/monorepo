import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: false, // Disable dts for now due to incremental compilation issue
  clean: true,
  splitting: false,
  sourcemap: true,
  minify: false,
  target: 'node18',
});
