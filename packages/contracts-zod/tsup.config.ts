import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
  },
  format: ['esm', 'cjs'],
  sourcemap: true,
  target: 'node18',
  dts: false,
  clean: true,
});
