# @outfitter/formatting

Lightweight formatting setup tool that orchestrates Prettier, Biome, ESLint, and Remark configurations for consistent code formatting across projects.

## Features

- 🔍 **Auto-detection** - Detects available formatters in your project
- ⚙️ **Preset-based** - Standard, strict, and relaxed formatting presets
- 📝 **Configuration generation** - Creates config files with sensible defaults
- 📦 **Script integration** - Updates package.json with formatting scripts
- 🔧 **Programmatic API** - Use as a library or CLI tool

## Installation

```bash
# Install the formatting tool
pnpm add -D @outfitter/formatting

# Then choose your setup:

# Option A: Traditional setup (Prettier + ESLint)
pnpm add -D prettier eslint remark-cli

# Option B: Modern all-in-one (Biome replaces Prettier + ESLint)
pnpm add -D @biomejs/biome remark-cli
```

## Quick Start

### CLI Usage

```bash
# Set up formatting with auto-detection
npx outfitter-formatting setup

# Use a specific preset
npx outfitter-formatting setup --preset strict

# Configure only specific formatters
npx outfitter-formatting setup --formatters prettier biome

# See what would be done without making changes
npx outfitter-formatting setup --dry-run --verbose
```

### Programmatic Usage

```typescript
import { setup, detectAvailableFormatters } from '@outfitter/formatting';

// Detect what's available
const detection = await detectAvailableFormatters();
console.log('Available formatters:', detection.data?.available);

// Set up formatting
const result = await setup({
  preset: 'standard',
  updateScripts: true,
  verbose: true,
});

if (result.success) {
  console.log('Setup completed!');
  console.log('Generated configs:', result.data.configs);
}
```

## Presets

### Standard (Default)
Balanced formatting for most projects:
- 80 character line width
- 2-space indentation
- Single quotes, double for JSX
- Always semicolons
- All trailing commas

### Strict
Rigorous formatting for documentation-heavy projects:
- 80 character line width
- 2-space indentation  
- Single quotes everywhere
- Always semicolons
- All trailing commas

### Relaxed
Flexible formatting for rapid development:
- 120 character line width
- 2-space indentation
- Single quotes, double for JSX
- Semicolons as needed
- ES5 trailing commas

## Commands

### `setup`
Set up formatting configuration for your project.

```bash
outfitter-formatting setup [options]
```

**Options:**
- `-p, --preset <preset>` - Preset to use (standard, strict, relaxed)
- `-f, --formatters <formatters...>` - Specific formatters to configure
- `--no-scripts` - Skip updating package.json scripts
- `--install-missing` - Attempt to install missing formatters
- `--dry-run` - Show what would be done without making changes
- `-v, --verbose` - Verbose output
- `--target-dir <dir>` - Target directory for setup

### `detect`
Detect available formatters in your project.

```bash
outfitter-formatting detect [options]
```

**Options:**
- `-v, --verbose` - Show detailed information including paths and versions

### `presets`
List available formatting presets.

```bash
outfitter-formatting presets
```

## Formatter Roles

Understanding what each tool does:

| Tool | Purpose | Handles |
|------|---------|---------|
| **Prettier** | Code formatting | JS/TS files, JSON, YAML, Markdown (including code blocks) |
| **ESLint** | Code linting | Code quality, bugs, patterns |
| **Biome** | All-in-one | JS/TS formatting AND linting (not Markdown) |
| **Remark** | Markdown formatting | Markdown structure only (not code blocks) |

### Recommended Combinations

1. **Modern Setup** (Recommended for JS/TS-only projects)
   - Biome (handles all JS/TS formatting and linting)
   - Remark (for Markdown structure)
   - Note: Code blocks in Markdown won't be formatted

2. **Traditional Setup** (Better for mixed-language documentation)
   - Prettier (formats code AND Markdown with code blocks)
   - ESLint (linting)
   - Remark (for Markdown structure)

### Code Blocks in Markdown

**Important**: How code blocks in markdown files are handled depends on your setup:

- **Prettier**: Formats code blocks for supported languages (JS, TS, JSON, YAML, CSS, HTML, etc.)
- **Biome**: Does NOT process markdown files or their code blocks
- **Remark**: Only handles markdown structure, not code block contents

If your markdown files contain code examples, the tool intelligently configures code block formatting based on available formatters:

#### Automatic Code Block Formatting

When both Remark and code formatters are available, the tool automatically configures code block formatting:

- **TypeScript/JavaScript blocks** → Formatted with Biome (if available) or Prettier
- **JSON/YAML/CSS/HTML blocks** → Formatted with Prettier (if available)
- **Other language blocks** → Left untouched

This happens automatically during `remark . --output` when the generated config includes the formatting plugin.

## Generated Files

The tool generates appropriate configuration files based on detected formatters:

| Formatter | Config File | Scripts Added |
|-----------|-------------|---------------|
| Prettier | `.prettierrc.json` | `format:prettier`, `format:prettier:check` |
| Biome | `biome.json` | `format:biome`, `lint:biome`, etc. |
| ESLint | `.eslintrc.json` | `lint:eslint`, `lint:eslint:fix` |
| Remark | `.remarkrc.yaml` | `format:markdown`, `format:markdown:check` |

When multiple formatters are available, combined scripts are created:
- `format` - Runs all formatters
- `format:check` - Checks formatting with all tools

## Programmatic API

### Core Functions

```typescript
import { 
  setup,
  detectAvailableFormatters,
  generateConfigs,
  getPreset,
  getAllPresets
} from '@outfitter/formatting';
```

### Types

```typescript
import type {
  SetupOptions,
  SetupResult,
  FormatterDetectionResult,
  PresetConfig,
  FormatterType
} from '@outfitter/formatting';
```

### Examples

#### Custom Setup

```typescript
import { setup } from '@outfitter/formatting';

const result = await setup({
  preset: 'standard',
  presetConfig: {
    lineWidth: 100,
    quotes: { style: 'double', jsx: 'single' }
  },
  formatters: ['prettier', 'biome'],
  updateScripts: true,
  dryRun: false,
});
```

#### Detection Only

```typescript
import { detectAvailableFormatters } from '@outfitter/formatting';

const detection = await detectAvailableFormatters();
if (detection.success) {
  console.log('Available:', detection.data.available);
  console.log('Missing:', detection.data.missing);
}
```

#### Generate Configs

```typescript
import { generateConfigs, getPreset } from '@outfitter/formatting';

const preset = getPreset('strict');
const configs = await generateConfigs(['prettier'], preset);

if (configs.success) {
  for (const config of configs.data) {
    console.log(`Generated ${config.path}`);
  }
}
```

## Integration

### DevContainer

The tool works well in DevContainer environments where formatters may be pre-installed globally.

### CI/CD

Use the generated scripts in your CI pipeline:

```yaml
# .github/workflows/format.yml
- name: Check formatting
  run: pnpm format:check

- name: Check linting  
  run: pnpm lint
```

### VS Code

Generated configurations work automatically with VS Code extensions:
- Prettier extension uses `.prettierrc.json`
- Biome extension uses `biome.json`
- Remark extension uses `.remarkrc.yaml`

## Troubleshooting

### No Formatters Detected

If no formatters are detected, choose your preferred setup:

```bash
# Option A: Traditional setup
pnpm add -D prettier           # For code formatting
pnpm add -D eslint             # For code linting
pnpm add -D remark-cli         # For Markdown

# Option B: Modern setup (recommended)
pnpm add -D @biomejs/biome     # Replaces both Prettier + ESLint
pnpm add -D remark-cli         # For Markdown
```

**Note**: Biome is an all-in-one tool that handles both formatting and linting, making it a modern alternative to using Prettier and ESLint together.

### Configuration Conflicts

The tool skips files that already exist. To regenerate:

1. Remove existing config files
2. Run setup again

### Missing Scripts

If package.json scripts aren't updated:

1. Ensure package.json exists in target directory
2. Check permissions
3. Use `--verbose` for detailed output

## License

ISC