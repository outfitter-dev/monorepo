# Core Principles

- **Shared Core Alignment:** This repo is the execution vehicle for the `SHARED_CORE.md` plan. Every package we add must map back to that document (contracts, types, config, CLI kit, etc.).
- **Composable Packages:** Prefer small, focused workspaces with explicit dependencies. Avoid “kitchen sink” utility modules.
- **Reproducibility:** Pin tool versions (Bun, Ultracite, Biome, Vitest) and ensure commands work the same on clean clones.
- **Docs-as-code:** Update `README.md`, `.agents/rules/`, and relevant package READMEs whenever behavior changes. If it’s not documented, assume an agent can’t rely on it.
