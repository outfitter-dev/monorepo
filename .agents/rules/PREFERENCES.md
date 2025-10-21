# Project Preferences

- **Bun:** Pin to the version declared in `package.json`/`bunfig.toml`. Upgrade intentionally.
- **Tooling:** Use Ultracite commands (`bunx ultracite check|fix`) to run Biome. Avoid per-package overrides unless documented.
- **Dependencies:** Keep `dependencies` empty at the root; add third-party deps at the package/app level only when needed.
- **CI stubs:** Until full CI lands, run the root scripts locally before submitting (`format`, `lint`, `test`).
- **Docs:** Update `README.md` and `.agents/rules/` when configuration changes. Consistency is priority.
