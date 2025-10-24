# @outfitter/config

## 1.0.0

Initial stable release of @outfitter/config with universal configuration loader.

### Features

**Universal Configuration Loader:**
- Multi-format support (TOML, YAML, JSONC) using Bun native APIs
- XDG Base Directory specification compliance for cross-platform config discovery
- Scope precedence: project → user → default
- Format precedence: TOML → JSONC → YAML (configurable)
- Schema validation with Zod and detailed diagnostics
- Defaults merging with partial config support
- Result-based error handling with structured ValidationError
- Sub-path modules: `/loader`, `/loaders`, `/resolvers`, `/schema-helpers`

**Format Loaders:**
- `loadToml()` - Uses Bun's native TOML parser
- `loadYaml()` - Uses Bun.YAML.parse() (native)
- `loadJsonc()` - JSON with comments and trailing commas via strip-json-comments

**Path Resolvers:**
- XDG directory resolution (`~/.config/[name]/`, `./.config/[name]/`)
- Project-local config discovery (`./[name].config.{ext}`)
- Multi-scope path generation with precedence
- Config file existence checking and discovery

**Schema Helpers:**
- Zod schema validation with Result pattern
- Partial config validation
- Config merging with validation
- Detailed diagnostic output with paths, messages, and codes

**Outfitter Schema Integration:**
- `loadOutfitterConfig()` - Async file-based loading with XDG resolution
- `loadOutfitterConfigFrom()` - Load from explicit path
- Preserves existing sync APIs for backward compatibility
- Feature flags, overrides, project metadata, presets, extends support
- 83 comprehensive tests covering all functionality
- 1,291-line README with complete API reference and examples

### Dependencies

- `strip-json-comments` - JSONC support (only external dependency)
- Leverages Bun native APIs for TOML and YAML (zero additional deps)

### Documentation

- Comprehensive README with universal loader and Outfitter schema usage
- API reference for all modules
- Best practices for schema validation and error handling
- Examples for TOML, YAML, and JSONC configuration files
- Sub-path module documentation

## 0.1.0

- Add Outfitter configuration schema, defaults, and parsing helpers.
- Provide JSON Schema export for editor IntelliSense.
- Expose utilities for merging user config with defaults and safe parsing via Outfitter `Result`.
