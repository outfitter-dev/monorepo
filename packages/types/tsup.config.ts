import { defineConfig } from 'tsup';

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/utilities/index.ts',
    'src/utilities/deep.ts',
    'src/utilities/object.ts',
    'src/utilities/array.ts',
    'src/utilities/string.ts',
    'src/utilities/conditional.ts',
    'src/core/index.ts',
    'src/core/branded.ts',
    'src/core/result.ts',
    'src/core/error.ts',
    'src/domains/index.ts',
    'src/domains/web.ts',
    'src/domains/api.ts',
  ],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  splitting: false,
  sourcemap: true,
  treeshake: true,
});
