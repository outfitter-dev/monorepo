# @outfitter/rightdown

> A unified Markdown formatter that orchestrates code block formatting tools

## Overview

Rightdown is a powerful Markdown formatter that goes beyond traditional linting. It orchestrates multiple code formatters (Prettier, Biome, etc.) to format code blocks within your Markdown files, ensuring your documentation stays as clean and consistent as your code.

## Features

- 🎯 **Unified formatting** - One tool to format both Markdown structure and embedded code
- 🔧 **Multiple formatter support** - Use Prettier, Biome, or other formatters for different languages
- 🎨 **Language-specific routing** - Configure different formatters for different languages
- 🚀 **Fast and efficient** - Parallel processing with minimal overhead
- 📝 **Preserves fence styles** - Maintains your preferred ``` or ~~~ style
- 🔌 **Extensible** - Easy to add new formatters

## Installation

```bash
# Install the package
pnpm add -D @outfitter/rightdown

# Install peer dependencies (choose what you need)
pnpm add -D prettier @biomejs/biome
```

## Quick Start

1. Initialize a configuration file:

```bash
rightdown init
```

2. Format your Markdown files:

```bash
# Dry run (see what would change)
rightdown

# Format in place
rightdown --write

# Format specific files
rightdown README.md docs/**/*.md --write

# Check if files are formatted
rightdown --check
```

## Configuration

Create a `.rightdown.config.yaml` file in your project root:

```yaml
# Required version field
version: 2

# Preset for base rules (strict, standard, or relaxed)
preset: standard

# Formatter configuration
formatters:
  # Default formatter for unlisted languages
  default: prettier
  
  # Language-specific formatters
  languages:
    javascript: biome
    typescript: biome
    jsx: biome
    tsx: biome
    json: biome
    css: prettier
    html: prettier
    yaml: prettier

# Formatter-specific options
formatterOptions:
  prettier:
    printWidth: 80
    tabWidth: 2
    semi: true
    singleQuote: true
    
  biome:
    indentWidth: 2
    lineWidth: 80

# Markdown structure rules (passed to markdownlint)
rules:
  line-length: 80
  code-block-style: fenced

# Files to ignore
ignores:
  - node_modules/**
  - dist/**
  - "*.min.js"

# Custom terminology rules
terminology:
  - incorrect: Javascript
    correct: JavaScript
  - incorrect: NPM
    correct: npm
```

## Language Support

Rightdown can format any language that your configured formatters support. Common examples:

### JavaScript/TypeScript (via Biome or Prettier)
- `javascript`, `js`
- `typescript`, `ts` 
- `jsx`, `tsx`
- `json`, `jsonc`

### Web Languages (via Prettier)
- `html`
- `css`, `scss`, `less`
- `yaml`, `yml`
- `markdown`, `md`

### Other Languages
Configure additional formatters for:
- Python (via Black)
- Rust (via rustfmt)
- Go (via gofmt)
- And many more...

## Presets

Rightdown includes three built-in presets:

- **`strict`** - Enforces consistent style with tight rules
- **`standard`** - Balanced rules for most projects (default)
- **`relaxed`** - Minimal rules for maximum flexibility

## CLI Options

```bash
rightdown [files...] [options]

Options:
  --write, -w       Write formatted output to files
  --check, -c       Check if files are formatted
  --fix             Auto-fix issues found during formatting
  --dry-run         Show what changes would be made without writing
  --write-configs   Write tool-specific configuration files
  --check-drift     Check if configurations are out of sync
  --config          Path to config file (default: .rightdown.config.yaml)
  --help, -h        Show help
  --version, -v     Show version
```

## Programmatic Usage

```typescript
import { Orchestrator, ConfigReader } from '@outfitter/rightdown';
import { PrettierFormatter, BiomeFormatter } from '@outfitter/rightdown';

// Read configuration
const configReader = new ConfigReader();
const configResult = await configReader.read('.rightdown.config.yaml');

if (!configResult.success) {
  console.error('Failed to read config:', configResult.error);
  process.exit(1);
}

// Set up formatters
const formatters = new Map([
  ['prettier', new PrettierFormatter()],
  ['biome', new BiomeFormatter()],
]);

// Create orchestrator
const orchestrator = new Orchestrator({
  config: configResult.data,
  formatters,
});

// Format markdown content
const markdown = `# Example

\`\`\`javascript
const   x={y:1}
\`\`\`
`;

const result = await orchestrator.format(markdown);
if (result.success) {
  console.log(result.data.content);
  console.log('Stats:', result.data.stats);
}
```

## How It Works

1. **Parse** - Rightdown uses an AST-based approach to reliably extract code blocks
2. **Route** - Each code block is routed to the appropriate formatter based on language
3. **Format** - Formatters process the code and return formatted results
4. **Replace** - Formatted code is carefully placed back, preserving fence styles
5. **Validate** - Optional terminology and structure rules are applied

## Differences from markdownlint

While markdownlint focuses on Markdown structure and style rules, Rightdown goes further by:

- Actually formatting code blocks (not just linting)
- Orchestrating multiple formatters
- Providing a unified configuration for all formatting needs
- Offering language-specific formatter routing

## Contributing

We welcome contributions! Please see our [Contributing Guide](../../CONTRIBUTING.md) for details.

## License

MIT © Outfitter