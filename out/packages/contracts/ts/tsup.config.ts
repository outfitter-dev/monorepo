import { defineConfig } from 'tsup';

export default defineConfig({
  entry: [
    'src/index.ts', // root barrel
    'src/error.ts',
    'src/result.ts',
    'src/assert.ts',
    'src/types/index.ts',
    'src/types/branded.ts',
  ],
  format: ['esm'],
  treeshake: true, // ensure per-entry shakeability
  splitting: false, // avoid a shared chunk that defeats tree-shaking
  dts: false, // TypeScript handles this via tsc --emitDeclarationOnly
  clean: true,
  sourcemap: true,
  tsconfig: './tsconfig.json',
  outExtension() {
    return {
      js: '.js', // Since package.json has "type": "module", .js files are ESM
    };
  },
});
