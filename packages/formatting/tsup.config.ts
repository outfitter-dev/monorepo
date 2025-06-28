import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/cli.ts', 'src/remark-plugins/format-code-blocks.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  splitting: false,
  sourcemap: true,
  minify: false,
  target: 'node18',
  tsconfig: './tsconfig.json',
  external: [
    '@outfitter/contracts',
    '@outfitter/contracts-zod',
    '@outfitter/prettier-config',
    '@outfitter/biome-config',
    '@outfitter/remark-config',
  ],
});
