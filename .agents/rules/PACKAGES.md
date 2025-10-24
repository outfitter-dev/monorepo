# Package Guidelines

- Create packages with `bun init` inside `packages/<name>`; set `"name": "@outfitter/<name>"` and mark them private until they are ready to publish.
- Every package must export ESM entrypoints (no CommonJS). Provide `"types"` or `"exports"` entries as needed.
- Add local scripts: `"build"`, `"lint"`, `"test"` to defer to root scripts when possible. Use package-level scripts only when behavior differs.
- Co-locate tests under `src/__tests__` or `tests/` with matching file names (`*.test.ts`).
- Document the package: minimal README covering purpose, API surface, and usage examples.
