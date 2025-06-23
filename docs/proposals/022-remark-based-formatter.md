---
author: "Matt Galligan"
id: "ADR-022"
date: 2025-06-23
status: "Draft"
related: ["ADR-021", "ADR-023"]
---
# Proposal: Lightweight Formatting Setup Tool

## Summary

Create `@outfitter/formatting` - a lightweight formatting setup tool that installs config packages, detects available formatters, and configures projects for consistent code formatting across JavaScript/TypeScript (Biome), Markdown (Remark), and other files (Prettier). Future expansion includes ESLint and markdownlint-cli2 for broader ecosystem compatibility.

## Motivation

### Configuration Drift
Keeping formatting configs synchronized across multiple packages in this monorepo is manual and error-prone. Each package potentially has its own `.prettierrc`, `biome.json`, and other config files that can drift out of sync.

### Project Consistency
Projects created by Outfitter CLI need the same formatting standards as the monorepo. Currently there's no automated way to ensure new projects start with the correct formatting setup.

### External Adoption
Teams who want to adopt Outfitter's opinionated formatting standards have no easy way to do so. They must manually copy configuration files and keep them updated.

### Tool Overlap and Separation of Concerns
While Biome, Prettier, and Remark have overlapping capabilities, there's value in an orchestration layer that:

- Routes specific file types to the most appropriate formatter
- Manages the complexity of tool-specific configurations
- Provides a unified interface while leveraging each tool's strengths

### Multiple Configuration Formats
Each formatter requires its own config file format:

- Prettier: `.prettierrc` (JSON/YAML/JS)
- Biome: `biome.json` or `biome.jsonc`
- Remark: `.remarkrc` (JSON/YAML/JS)
- EditorConfig: `.editorconfig` (INI format)

This proposal addresses these challenges with a unified approach that provides shared config packages and a lightweight setup tool.

## Architecture

### Overview

```
User runs: npx @outfitter/formatting init
                    ↓
            [Detect formatters]
          /         |          \
    Local?      Global?      System?
         \         |          /
          [Install config packages]
                    ↓
         @outfitter/prettier-config
         @outfitter/biome-config
         @outfitter/remark-config
                    ↓
         [Create config files]
         [Update package.json]
```

### Tool Detection Strategy

The package provides configs but not the heavy formatter tools themselves:

```json
{
  "name": "@outfitter/formatting",
  "dependencies": {
    // Lightweight config packages only
    "@outfitter/prettier-config": "workspace:*",
    "@outfitter/biome-config": "workspace:*",
    "@outfitter/remark-config": "workspace:*"
  },
  "peerDependencies": {
    // Tools are optional - user provides these
    "prettier": "^3.0.0",
    "@biomejs/biome": "^1.9.0",
    "remark-cli": "^12.0.0"
  },
  "peerDependenciesMeta": {
    "prettier": { "optional": true },
    "@biomejs/biome": { "optional": true },
    "remark-cli": { "optional": true }
  }
}
```

### Init Command Implementation

```typescript
export async function init(options: InitOptions = {}) {
  console.log('🚀 Initializing Outfitter formatting...');
  
  // 1. Detect available formatters
  const formatters = await detectAvailableFormatters();
  
  console.log('\n🔍 Detected formatters:');
  console.log('  Biome:', formatters.biome?.type || '❌ not found');
  console.log('  Prettier:', formatters.prettier?.type || '❌ not found');
  console.log('  Remark:', formatters.remark?.type || '❌ not found');
  
  // 2. Detect project structure
  const projectInfo = await detectProjectStructure();
  console.log('\n📁 Project type:', projectInfo.type);
  
  // 3. Load and apply preset
  const presetName = options.preset || 'standard';
  const preset = await loadPreset(presetName);
  console.log(`\n📋 Using preset: ${preset.name}`);
  
  // 4. Install config packages only (lightweight)
  const configPackages = [
    '@outfitter/prettier-config',
    '@outfitter/biome-config',
    '@outfitter/remark-config',
    // Future expansion
    '@outfitter/eslint-config',
    '@outfitter/markdownlint-config'
  ].filter(pkg => {
    // Only install configs for detected formatters
    const formatter = pkg.split('/')[1].replace('-config', '');
    return formatters[formatter] || ['prettier', 'biome', 'remark'].includes(formatter);
  });
  
  console.log('\n📦 Installing config packages...');
  await installPackages(configPackages, { dev: true });
  
  // 5. Generate and create config files
  console.log('\n📝 Creating config files...');
  await createConfigFiles(preset, formatters, projectInfo);
  
  // 6. Update package.json scripts
  console.log('\n⚙️  Updating package.json scripts...');
  await updatePackageScripts(preset.scripts, projectInfo);
  
  // 7. Offer to install missing tools
  await handleMissingFormatters(formatters);
  
  console.log('\n✅ Formatting setup complete!');
}

// Helper constants and type definitions
const FORMATTER_COMMANDS = {
  biome: '@biomejs/biome',
  prettier: 'prettier', 
  remark: 'remark-cli',
  // Future expansion
  eslint: 'eslint',
  markdownlint: 'markdownlint-cli2'
};

async function detectAvailableFormatters() {
  const formatters: FormattersInfo = {};
  
  for (const [name, command] of Object.entries(FORMATTER_COMMANDS)) {
    formatters[name] = await findFormatter(command);
  }
  
  return formatters;
}

async function findFormatter(name: string): Promise<FormatterInfo | null> {
  // 1. Check local node_modules
  try {
    const localPath = require.resolve(name);
    return { type: 'local', path: localPath, version: await getVersion(name) };
  } catch {}
  
  // 2. Check global installation (cross-platform)
  const globalPath = await findGlobalBinary(name);
  if (globalPath) {
    return { type: 'global', path: globalPath, version: await getVersion(name, true) };
  }
  
  // 3. Check system PATH (Docker, devcontainer, etc.)
  const systemPath = await which(name).catch(() => null);
  if (systemPath) {
    return { type: 'system', path: systemPath, version: 'system' };
  }
  
  return null;
}

// Cross-platform global binary detection
async function findGlobalBinary(name: string): Promise<string | null> {
  try {
    // Use which/where command based on platform
    const command = process.platform === 'win32' ? 'where' : 'which';
    const result = await execa(command, [name]);
    return result.stdout.trim();
  } catch {
    // Fallback: check common global paths
    const globalPaths = process.platform === 'win32' 
      ? [process.env.APPDATA + '\\npm', 'C:\\Users\\' + process.env.USERNAME + '\\AppData\\Roaming\\npm']
      : ['/usr/local/bin', process.env.HOME + '/.local/bin'];
    
    for (const basePath of globalPaths) {
      const binPath = path.join(basePath, name + (process.platform === 'win32' ? '.cmd' : ''));
      if (await fs.pathExists(binPath)) {
        return binPath;
      }
    }
    return null;
  }
}

// Helper function stubs
async function getVersion(name: string, global = false): Promise<string> {
  try {
    const result = await execa(name, ['--version']);
    return result.stdout.trim();
  } catch {
    return 'unknown';
  }
}

async function promptVSCode(): Promise<boolean> {
  const { createVSCode } = await prompt({
    type: 'confirm',
    message: 'Create VS Code settings for formatter integration?',
    initial: true
  });
  return createVSCode;
}

function generateVSCodeSettings(formatters: FormattersInfo): Record<string, any> {
  const settings: Record<string, any> = {};
  
  if (formatters.remark) {
    settings['[markdown]'] = { 'editor.defaultFormatter': 'unifiedjs.vscode-remark' };
  }
  if (formatters.biome) {
    settings['[typescript]'] = { 'editor.defaultFormatter': 'biomejs.biome' };
    settings['[javascript]'] = { 'editor.defaultFormatter': 'biomejs.biome' };
    settings['[json]'] = { 'editor.defaultFormatter': 'biomejs.biome' };
    settings['[jsonc]'] = { 'editor.defaultFormatter': 'biomejs.biome' };
  }
  if (formatters.prettier) {
    settings['[yaml]'] = { 'editor.defaultFormatter': 'esbenp.prettier-vscode' };
    settings['[css]'] = { 'editor.defaultFormatter': 'esbenp.prettier-vscode' };
    settings['[html]'] = { 'editor.defaultFormatter': 'esbenp.prettier-vscode' };
  }
  
  return settings;
}

function deepMerge(target: any, source: any): any {
  const result = { ...target };
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(result[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }
  return result;
}

function getSchemaUrl(tool: string): string {
  const schemas = {
    biome: 'https://biomejs.dev/schemas/1.9.4/schema.json',
    prettier: 'https://json.schemastore.org/prettierrc',
    remark: 'https://json.schemastore.org/remarkrc'
  };
  return schemas[tool] || '';
}

function getConfigFilename(tool: string): string {
  const filenames = {
    biome: 'biome.jsonc',      // JSONC supports comments
    prettier: '.prettierrc.yaml', // YAML supports comments
    remark: '.remarkrc.yaml',     // YAML supports comments
    eslint: 'eslint.config.js',   // JS supports comments (future)
    markdownlint: '.markdownlint.yaml' // YAML supports comments (future)
  };
  return filenames[tool] || `.${tool}rc.yaml`;
}

function formatConfigFile(tool: string, config: any): string {
  // Generate configs with comments where possible
  switch (tool) {
    case 'biome':
      // JSONC format with comments
      return `// Generated by @outfitter/formatting
// Schema: https://biomejs.dev/schemas/1.9.4/schema.json
${JSON.stringify(config, null, 2)}`;
    
    case 'prettier':
    case 'remark':
    default:
      // YAML format with comments for everything else
      return `# Generated by @outfitter/formatting
# Tool: ${tool}
# Preset: ${config._preset || 'standard'}

${generateYAML(config)}`;
  }
}

function generateYAML(config: any): string {
  // Remove internal metadata before YAML generation
  const { _preset, $schema, ...cleanConfig } = config;
  
  // Use a YAML library like js-yaml for proper generation
  return yaml.dump(cleanConfig, {
    indent: 2,
    quotingType: '"',
    forceQuotes: false
  });
}

function generateEditorConfig(common: any, projectInfo: any): string {
  return `# Generated by @outfitter/formatting
root = true

[*]
end_of_line = ${common.endOfLine || 'lf'}
indent_style = ${common.indentation?.style || 'space'}
indent_size = ${common.indentation?.width || 2}
trim_trailing_whitespace = true
insert_final_newline = true
charset = utf-8

[*.{md,mdx,mdc}]
trim_trailing_whitespace = false

[Makefile]
indent_style = tab
`;
}

async function getPackageName(formatterName: string): string {
  return FORMATTER_COMMANDS[formatterName] || formatterName;
}
```

### Script Generation

```typescript
function generateScripts(formatters: FormattersInfo, projectInfo: ProjectInfo) {
  const scripts: Record<string, string> = {};
  
  // Main format command - uses our router if available, falls back to individual tools
  if (formatters.biome || formatters.prettier) {
    scripts['format'] = 'outfitter-formatting format . --write';
    scripts['format:check'] = 'outfitter-formatting format . --check';
  }
  
  // Individual formatter commands (only if tool is available)
  if (formatters.biome) {
    scripts['format:biome'] = 'biome format . --write';
    scripts['lint'] = 'biome lint .';
    scripts['lint:fix'] = 'biome lint . --write';
  }
  
  if (formatters.prettier) {
    scripts['format:prettier'] = 'prettier --write "**/*.{yml,yaml,css,scss,less,html}"';
  }
  
  if (formatters.remark) {
    scripts['format:markdown'] = 'remark . --output --quiet';
    scripts['lint:docs'] = 'remark . --quiet --frail';
  }
  
  // Combined lint command
  const lintCommands = [];
  if (formatters.biome) lintCommands.push('biome lint .');
  if (formatters.remark) lintCommands.push('remark . --quiet --frail');
  if (lintCommands.length > 0) {
    scripts['lint:all'] = lintCommands.join(' && ');
  }
  
  // CI command
  scripts['ci:format'] = 'pnpm format:check && pnpm lint:all';
  
  // Monorepo adjustments
  if (projectInfo.type === 'monorepo') {
    return wrapScriptsForMonorepo(scripts);
  }
  
  return scripts;
}

function wrapScriptsForMonorepo(scripts: Record<string, string>) {
  const monorepoScripts: Record<string, string> = {};
  
  for (const [name, command] of Object.entries(scripts)) {
    // Root level runs recursively
    if (name.startsWith('format') || name.startsWith('lint')) {
      monorepoScripts[name] = `pnpm -r ${name}`;
      monorepoScripts[`${name}:root`] = command; // Also provide root-only version
    } else {
      monorepoScripts[name] = command;
    }
  }
  
  return monorepoScripts;
}
```

### Config File Creation

```typescript
async function createConfigFiles(preset: Preset, formatters: FormattersInfo, projectInfo: ProjectInfo) {
  // Process preset to generate tool configs
  const configs = await processPreset(preset, formatters);
  
  // Update package.json with config references (for tools that support it)
  const packageJson = await fs.readJson('package.json');
  
  // Write config files for all detected formatters
  for (const [tool, config] of Object.entries(configs)) {
    if (!formatters[tool]) continue; // Skip if tool not available
    
    const filename = getConfigFilename(tool);
    await fs.writeFile(filename, formatConfigFile(tool, config));
    console.log(`  ✓ Created ${filename}`);
  }
  
  // Always create .editorconfig
  const editorConfig = generateEditorConfig(preset.common, projectInfo);
  await fs.writeFile('.editorconfig', editorConfig);
  console.log('  ✓ Created .editorconfig');
  
  // VS Code settings (if .vscode exists or user wants it)
  if (await fs.pathExists('.vscode') || await promptVSCode()) {
    await fs.ensureDir('.vscode');
    const vscodeSettings = generateVSCodeSettings(formatters);
    await fs.writeJson('.vscode/settings.json', vscodeSettings, { spaces: 2 });
    console.log('  ✓ Created .vscode/settings.json');
  }
}

async function processPreset(preset: Preset, formatters: FormattersInfo): Promise<ToolConfigs> {
  const configs: ToolConfigs = {};
  
  for (const [tool, toolConfig] of Object.entries(preset.tools)) {
    if (!formatters[tool]) continue;
    
    // Start with mapped common settings
    let config = mapCommonToTool(preset.common, tool);
    
    // Merge in raw tool-specific settings
    if (toolConfig.raw) {
      config = deepMerge(config, toolConfig.raw);
    }
    
    // Add schema reference
    config.$schema = getSchemaUrl(tool);
    
    configs[tool] = config;
  }
  
  return configs;
}

function mapCommonToTool(common: CommonConfig, tool: string): any {
  switch (tool) {
    case 'biome':
      return {
        formatter: {
          indentStyle: common.indentation.style,
          indentWidth: common.indentation.width,
          lineWidth: common.lineWidth
        },
        javascript: {
          formatter: {
            quoteStyle: common.quotes.style,
            jsxQuoteStyle: common.quotes.jsx,
            semicolons: common.semicolons,
            trailingComma: common.trailingComma,
            arrowParentheses: common.arrowParens
          }
        }
      };
      
    case 'prettier':
      return {
        tabWidth: common.indentation.width,
        useTabs: common.indentation.style === 'tab',
        printWidth: common.lineWidth,
        singleQuote: common.quotes.style === 'single',
        jsxSingleQuote: common.quotes.jsx === 'single',
        semi: common.semicolons === 'always' || common.semicolons === true,
        trailingComma: common.trailingComma,
        bracketSpacing: common.bracketSpacing,
        arrowParens: common.arrowParens === 'asNeeded' ? 'avoid' : common.arrowParens,
        endOfLine: common.endOfLine
      };
      
    default:
      return {};
  }
}
```

### DevContainer Support

For users who prefer containerized development environments:

```typescript
async function handleMissingFormatters(formatters: FormattersInfo) {
  const missing = Object.entries(formatters)
    .filter(([_, info]) => !info)
    .map(([name]) => name);
    
  if (missing.length === 0) return;
  
  console.log('\n⚠️  Missing formatters:', missing.join(', '));
  console.log('\nYou have several options:');
  console.log('  1. Install locally: pnpm add -D', missing.map(getPackageName).join(' '));
  console.log('  2. Install globally: npm install -g', missing.join(' '));
  console.log('  3. Use a devcontainer with tools pre-installed');
  
  const { createDevContainer } = await prompt({
    type: 'confirm',
    message: 'Would you like to create a devcontainer configuration?'
  });
  
  if (createDevContainer) {
    await createDevContainerConfig();
  }
}

async function createDevContainerConfig() {
  const config = {
    "name": "Outfitter Dev",
    "image": "mcr.microsoft.com/devcontainers/javascript-node:20",
    "features": {
      "ghcr.io/devcontainers-contrib/features/prettier:1": {},
      "ghcr.io/devcontainers-contrib/features/biome:1": {}
    },
    "postCreateCommand": "npm install -g remark-cli remark-preset-lint-recommended",
    "customizations": {
      "vscode": {
        "extensions": [
          "biomejs.biome",
          "esbenp.prettier-vscode",
          "unifiedjs.vscode-remark"
        ]
      }
    }
  };
  
  await fs.ensureDir('.devcontainer');
  await fs.writeJson('.devcontainer/devcontainer.json', config, { spaces: 2 });
  console.log('  ✓ Created .devcontainer/devcontainer.json');
}
```

### Core Implementation

```typescript
// Formatter router command - routes files to appropriate formatters
export class FormatterRouter {
  private formatters: FormattersInfo;
  
  constructor(formatters: FormattersInfo) {
    this.formatters = formatters;
  }
  
  async format(patterns: string[], options: FormatOptions) {
    const files = await globby(patterns);
    const filesByFormatter = this.groupFilesByFormatter(files);
    
    for (const [formatter, files] of Object.entries(filesByFormatter)) {
      if (!this.formatters[formatter]) {
        console.warn(`⚠️  ${formatter} not available, skipping ${files.length} files`);
        continue;
      }
      
      await this.runFormatter(formatter, files, options);
    }
  }
  
  private groupFilesByFormatter(files: string[]): Record<string, string[]> {
    const groups: Record<string, string[]> = {};
    
    for (const file of files) {
      const formatter = this.getFormatterForFile(file);
      if (!groups[formatter]) groups[formatter] = [];
      groups[formatter].push(file);
    }
    
    return groups;
  }
  
  private getFormatterForFile(file: string): string {
    const ext = path.extname(file).slice(1);
    
    // Biome handles JS/TS/JSON files
    if (['js', 'jsx', 'ts', 'tsx', 'mjs', 'cjs', 'json', 'jsonc'].includes(ext)) {
      return 'biome';
    }
    
    // Remark handles markdown files
    if (['md', 'mdx', 'mdc'].includes(ext)) {
      return 'remark';
    }
    
    // Prettier handles everything else (YAML, CSS, HTML, etc.)
    return 'prettier';
  }
  
  private async runFormatter(name: string, files: string[], options: FormatOptions) {
    // Handle large file lists by chunking to avoid argv length limits
    const chunks = this.chunkFiles(files, options.concurrency || 5);
    
    for (const chunk of chunks) {
      await this.runFormatterChunk(name, chunk, options);
    }
  }
  
  private chunkFiles(files: string[], chunkSize: number): string[][] {
    // Conservative chunk size to avoid argv length limits on Windows (~8191 chars)
    // Consider file path lengths when setting chunk size
    const chunks: string[][] = [];
    for (let i = 0; i < files.length; i += chunkSize) {
      chunks.push(files.slice(i, i + chunkSize));
    }
    return chunks;
  }
  
  private async runFormatterChunk(name: string, files: string[], options: FormatOptions) {
    // Note: For very large file lists, consider using stdin-based approaches when available
    // e.g., biome format --files-from-stdin or tmpfile with @- syntax
    
    const commands = {
      biome: `biome format ${files.join(' ')} ${options.write ? '--write' : ''} ${options.check ? '--write=false' : ''}`,
      prettier: `prettier ${files.join(' ')} ${options.write ? '--write' : '--check'}`,
      remark: `remark ${files.join(' ')} ${options.write ? '--output --quiet' : '--quiet --frail'}`
    };
    
    const command = commands[name];
    if (!command) return;
    
    console.log(`Running ${name} on ${files.length} files...`);
    await execa.command(command, { stdio: 'inherit' });
  }
}
```

### CLI Interface

```typescript
#!/usr/bin/env node
import { Command } from 'commander';
import { ConfigManager, RemarkFormatter } from '@outfitter/formatting';
import globby from 'globby';

const program = new Command();

program
  .name('outfitter-formatting')
  .description('Setup and manage code formatting')
  .version('1.0.0');

// Initialize formatting setup
program
  .command('init')
  .description('Initialize formatting configuration')
  .option('--preset <name>', 'Use a preset configuration', 'standard')
  .option('--no-devcontainer', 'Skip devcontainer prompt')
  .action(async (options) => {
    await init(options);
  });

// Format files using detected formatters
program
  .command('format [patterns...]')
  .description('Format files using appropriate formatters')
  .option('--write', 'Write formatted files (default: check only)')
  .option('--check', 'Check if files are formatted')
  .option('--concurrency <number>', 'Number of files to process in parallel', '5')
  .action(async (patterns, options) => {
    // Handle conflicting options
    if (options.write && options.check) {
      console.error('Error: --write and --check cannot be used together');
      process.exit(1);
    }
    
    const formatters = await detectAvailableFormatters();
    const router = new FormatterRouter(formatters);
    
    // Default to all files if no patterns provided
    const filePatterns = patterns.length > 0 ? patterns : ['.'];
    
    // Expand patterns and check file count
    const files = await globby(filePatterns);
    if (files.length > 100) {
      console.warn(`⚠️  Processing ${files.length} files. Consider using more specific patterns for better performance.`);
    }
    
    await router.format(filePatterns, {
      write: options.write,
      check: options.check || !options.write,
      concurrency: parseInt(options.concurrency)
    });
  });

// Show detected formatters
program
  .command('status')
  .description('Show available formatters')
  .action(async () => {
    const formatters = await detectAvailableFormatters();
    
    console.log('Detected formatters:');
    for (const [name, info] of Object.entries(formatters)) {
      if (info) {
        console.log(`  ✓ ${name}: ${info.type} (${info.version || 'unknown version'})`);
      } else {
        console.log(`  ✗ ${name}: not found`);
      }
    }
  });

program.parse();
```

## Package Architecture Benefits

Using existing config packages provides:

1. **Independent versioning** - Each config can evolve with its own version
2. **Direct consumption** - Other projects can use `@outfitter/prettier-config` without the formatting package
3. **Type safety** - Config packages can export TypeScript types
4. **Testing isolation** - Each config can be tested independently
5. **Clear dependencies** - package.json shows exactly which configs are used

### Package Structure

The `@outfitter/formatting` package is lightweight, containing only configs:

```json
{
  "name": "@outfitter/formatting",
  "bin": {
    "outfitter-formatting": "./dist/cli.js"
  },
  "dependencies": {
    // Config packages only - no heavy formatter tools
    "@outfitter/prettier-config": "workspace:*",
    "@outfitter/biome-config": "workspace:*",
    "@outfitter/remark-config": "workspace:*",
    
    // CLI utilities
    "commander": "^12.0.0",
    "execa": "^8.0.0",
    "globby": "^14.0.0",
    "prompts": "^2.4.2",
    "which": "^4.0.0",
    "js-yaml": "^4.1.0"
  },
  "peerDependencies": {
    // Formatters are optional - detected at runtime
    "prettier": "^3.0.0",
    "@biomejs/biome": "^1.9.0",
    "remark-cli": "^12.0.0"
  },
  "peerDependenciesMeta": {
    "prettier": { "optional": true },
    "@biomejs/biome": { "optional": true },
    "remark-cli": { "optional": true }
  }
}
```

### User Installation Flow

```bash
# 1. Install the formatting package (lightweight)
pnpm add -D @outfitter/formatting

# 2. Run init to set up configs
pnpm exec outfitter-formatting init

# 3. Choose how to install formatters:
#    a) Locally: pnpm add -D prettier @biomejs/biome remark-cli
#    b) Globally: npm i -g prettier @biomejs/biome remark-cli  
#    c) Use devcontainer/Docker with pre-installed tools
#    d) Use system-installed tools (homebrew, apt, etc.)
```

## Generated Configurations

The system generates standalone config files for all detected formatters:

### .prettierrc.yaml

```yaml
# Generated by @outfitter/formatting
# Tool: prettier  
# Preset: standard

endOfLine: lf
tabWidth: 2
useTabs: false
printWidth: 80
singleQuote: true
trailingComma: all
plugins:
  - prettier-plugin-tailwindcss

# File-specific overrides
overrides:
  - files: ["**/*.{yml,yaml}"]
    options:
      bracketSpacing: true
      proseWrap: preserve
  
  - files: ["**/*.{css,scss,less}"]
    options:
      singleQuote: true
  
  - files: ["**/.{prettier,eslint}rc*", "**/package.json"]
    options:
      parser: json5
      trailingComma: none
```

### biome.jsonc

```jsonc
// Generated by @outfitter/formatting
// Tool: biome
// Preset: standard
// Schema: https://biomejs.dev/schemas/1.9.4/schema.json
{
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 80
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "single",
      "semicolons": "always",
      "trailingComma": "all",
      "arrowParentheses": "always"
    }
  },
  "json": {
    "formatter": {
      "trailingComma": "none"
    }
  },
  "vcs": {
    "enabled": true,
    "clientKind": "git"
  }
}
```

### .editorconfig

```ini
# Generated by @outfitter/formatting
# Preset: standard
root = true

[*]
end_of_line = lf
indent_style = space
indent_size = 2
trim_trailing_whitespace = true
insert_final_newline = true
charset = utf-8

[*.{md,mdx,mdc}]
trim_trailing_whitespace = false

[*.{yml,yaml}]
indent_size = 2

[Makefile]
indent_style = tab
```

### .vscode/settings.json

```json
{
  "[markdown]": {
    "editor.defaultFormatter": "unifiedjs.vscode-remark"
  },
  "[typescript]": {
    "editor.defaultFormatter": "biomejs.biome"
  },
  "[javascript]": {
    "editor.defaultFormatter": "biomejs.biome"
  },
  "[yaml]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[json]": {
    "editor.defaultFormatter": "biomejs.biome"
  },
  "[jsonc]": {
    "editor.defaultFormatter": "biomejs.biome"
  }
}
```

### .remarkrc.yaml

```yaml
# Generated by @outfitter/formatting
# Tool: remark
# Preset: standard

plugins:
  - remark-preset-lint-recommended
  - [remark-lint-list-marker-style, "-"]
  - [remark-lint-heading-style, "atx"]
  - [remark-lint-maximum-line-length, 80]
  - remark-lint-no-duplicate-headings

# Settings for unified/remark ecosystem
settings:
  bullet: "-"
  emphasis: "*"
  strong: "*"
  listItemIndent: "one"
```

## Benefits

1. **Lightweight installation** - Only installs config packages, not heavy formatter tools
2. **Flexible tool management** - Use local, global, or containerized formatters
3. **No version conflicts** - Projects can use their preferred formatter versions
4. **Container-friendly** - Perfect for devcontainers and CI environments
5. **Simple setup** - One `init` command configures everything
6. **Monorepo aware** - Detects and configures monorepo structures
7. **Modular configs** - Config packages can be used independently
8. **Smart routing** - Automatically routes files to appropriate formatters
9. **Graceful degradation** - Works with whatever formatters are available

## Implementation Milestones

### Milestone 1: Core Infrastructure

- Create `@outfitter/remark-config` package with standard rules
- Build init command with formatter detection
- Script generation for package.json
- Monorepo detection and configuration
- Basic formatter router (Prettier, Biome, Remark)

### Milestone 2: Enhanced Features

- DevContainer configuration generator
- Preset support (strict, relaxed, library)
- Better error messages for missing tools
- Performance optimization for formatter routing
- Integration tests

### Milestone 3: Production Ready

- Comprehensive documentation
- Example configurations
- Migration guide from individual tools
- GitHub Action for CI
- VS Code workspace recommendations

### Milestone 4: Extended Ecosystem (Future)

- Create `@outfitter/eslint-config` package
- Create `@outfitter/markdownlint-config` package
- Extend formatter router for ESLint and markdownlint-cli2
- Update presets to include linting rules
- Cross-tool rule consistency (e.g., line length across formatters and linters)

## Preset Configuration

### Common Configuration Format

The formatting package uses a YAML-based preset system that maps common formatting concepts across tools:

```yaml
# /formatting/presets/standard.yaml
version: 1
name: standard
description: "Balanced formatting for most projects"

# Common formatting rules that map across tools
common:
  indentation:
    style: space
    width: 2
  lineWidth: 80
  quotes:
    style: double
    jsx: double
  semicolons: always
  trailingComma: all
  bracketSpacing: true
  arrowParens: always
  endOfLine: lf

# Tool-specific configurations
tools:
  biome:
    # Inherits all common settings automatically
    # Additional Biome-specific settings under 'raw'
    raw:
      linter:
        rules:
          recommended: true
          correctness:
            noUnusedVariables: warn
      vcs:
        enabled: true
        clientKind: git

  prettier:
    # Inherits common settings
    # Prettier-specific additions
    raw:
      proseWrap: preserve
      htmlWhitespaceSensitivity: css
      plugins:
        - prettier-plugin-tailwindcss  # Note: Plugin versions managed by config package
    
  remark:
    # Remark doesn't share common formatter concepts
    # Everything goes in raw
    raw:
      plugins:
        - remark-preset-lint-recommended
        - [remark-lint-list-marker-style, "-"]
        - [remark-lint-heading-style, "atx"]

# Scripts to add to package.json
scripts:
  format: "outfitter-formatting format . --write"
  format:check: "outfitter-formatting format . --check"
  lint: "biome lint . && remark . --quiet --frail"
  lint:fix: "biome lint . --write"
  ci:format: "pnpm format:check && pnpm lint"
```

### How Mapping Works

The `common` section defines universal formatting concepts that are automatically mapped to tool-specific settings:

```typescript
// Common concept → Tool mappings
common.indentation.style → biome.formatter.indentStyle
                        → prettier.useTabs (inverted)

common.indentation.width → biome.formatter.indentWidth
                        → prettier.tabWidth

common.lineWidth        → biome.formatter.lineWidth
                        → prettier.printWidth

common.quotes.style     → biome.javascript.formatter.quoteStyle
                        → prettier.singleQuote (inverted)
```

The `raw` section in each tool contains settings that:

- Have no common equivalent
- Are tool-specific features
- Override the common mappings if needed

### Additional Presets

```yaml
# /formatting/presets/strict.yaml
version: 1
name: strict

common:
  indentation:
    style: space
    width: 2
  lineWidth: 80
  quotes:
    style: single
    jsx: single
  semicolons: always
  trailingComma: all
  bracketSpacing: true
  arrowParens: always
  endOfLine: lf
  
tools:
  biome:
    raw:
      linter:
        rules:
          recommended: true
          correctness:
            all: true
          style:
            all: true
            noNonNullAssertion: error

# /formatting/presets/relaxed.yaml
version: 1
name: relaxed

common:
  indentation:
    style: space
    width: 2
  lineWidth: 120
  quotes:
    style: single
    jsx: single
  semicolons: asNeeded
  trailingComma: es5
  bracketSpacing: true
  arrowParens: avoid
  endOfLine: lf
  
tools:
  biome:
    raw:
      linter:
        rules:
          recommended: true
          correctness:
            noUnusedVariables: off
```

## Migration Strategy

### From Manual Setup

```bash
# 1. Install the formatting package
pnpm add -D @outfitter/formatting

# 2. Run init (detects existing configs and tools)
pnpm exec outfitter-formatting init

# 3. Review generated scripts in package.json
# 4. Test the new setup
pnpm format
pnpm lint:all

# 5. Remove old config files (optional)
rm .prettierrc .remarkrc  # Keep if you need custom overrides
```

### For Monorepos

```bash
# Run init at the root
cd monorepo-root
pnpm add -D @outfitter/formatting
pnpm exec outfitter-formatting init

# Init will detect monorepo and offer to:
# - Set up root-level formatting scripts
# - Add formatting to all workspace packages
# - Create shared config at root
```

### Using DevContainers

```bash
# If formatters aren't installed locally
pnpm exec outfitter-formatting init

# When prompted about missing formatters, choose:
# "Create devcontainer configuration"

# This generates .devcontainer/devcontainer.json with all tools pre-installed
```

## Technical Notes

### Plugin Version Management
Prettier plugins referenced in configurations (e.g., `prettier-plugin-tailwindcss`) are managed as dependencies of the config packages. This ensures:

- Consistent plugin versions across all projects
- Proper version pinning and security auditing via Renovate and `npm audit`
- No need for users to manually install plugins

### Security Pipeline
Config packages use automated dependency management:

- **Renovate** for automated security updates of plugin dependencies
- **npm audit** in CI to catch vulnerable dependencies
- **Lockfile validation** to ensure reproducible builds
- **Pin exact versions** for plugins to prevent supply chain attacks

### Biome API Stability
The Biome JavaScript API is still stabilizing. The formatter integration may need updates as the API evolves. Current implementation should use the available API (e.g., `createProject`) with appropriate error handling for API changes.

### Configuration Precedence
The simplified approach has clear precedence:

1. **Local config files** (generated by formatting package)
2. **Config package defaults** (when config files reference them)  
3. **Tool built-in defaults**

All configuration is explicit and visible in the generated config files - no hidden package.json fields or complex resolution logic.

### DevContainer Features
The proposal references DevContainer features for Biome and Prettier:

- `ghcr.io/devcontainers-contrib/features/prettier:1` - **Verified available**
- `ghcr.io/devcontainers-contrib/features/biome:1` - **Status unknown, may need custom implementation**

**Fallback strategy**: Install Biome via npm in `postCreateCommand` if DevContainer feature unavailable:

```json
"postCreateCommand": "npm install -g @biomejs/biome remark-cli"
```

### Remark Configuration Resolution
When migration instructions suggest removing `.remarkrc`, the system handles remark config through:

- Generated `.remarkrc.json` with `@outfitter/remark-config` settings
- CLI invocation: `remark . --use @outfitter/remark-config --output --quiet`
- VS Code integration via `unifiedjs.vscode-remark` extension

### Astro Starlight Integration
To support the planned move to **Astro Starlight** for documentation sites, the formatting package (or a future `@outfitter/docs-site` helper) should expose a tiny utility that can be imported into `astro.config.mjs`.  

**Example `astro.config.mjs` snippet**

```js
// astro.config.mjs
import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";

// 🔽 NEW: pulls in the same remark preset used by `@outfitter/remark-config`
import { outfitterRemarkPlugins } from "@outfitter/remark-config/astro"; // hypothetical helper

export default defineConfig({
  integrations: [starlight()],

  markdown: {
    remarkPlugins: [
      ...outfitterRemarkPlugins(), // ensures docs follow the same rules as repo markdown
    ],
  },
});
```

Key points:

1. **Single-source of truth** – `outfitterRemarkPlugins()` returns the exact plugin list already defined in `@outfitter/remark-config`, so your docs site stays in sync with the repository-wide rules.
2. **Optional widening** – Projects can still add their own plugins *after* the helper (e.g. `remark-smartypants`) without losing the core defaults.
3. **Future package** – A forthcoming `@outfitter/docs-site` package could expose a CLI (`pnpm exec outfitter-docs init`) that:
   - Generates/updates `astro.config.mjs` with the snippet above.
   - Adds Starlight, the helper package, and any required remark/rehype plugins to `package.json`.
   - Optionally scaffolds a starter `src/content/docs` tree.
4. **CI parity** – Because the same remark plugins are used when formatting `.md` files in the repo and when building the site, there is no drift between "code view" and "rendered view.

_No immediate changes are required to land the formatter, but reserving this extension point now avoids a breaking change later._

### Cross-Platform EOL Handling
EditorConfig standardizes on `lf` line endings. Windows considerations:

- **Git checkout**: Configure `git config core.autocrlf input` for consistent LF in repo
- **WSL vs Windows**: EditorConfig enforces LF in both environments
- **IDE behavior**: VS Code respects EditorConfig and converts on save

### Preset to Config Package Translation
The YAML presets are translated into published config packages through a build process:

1. **Preset Processing**: `standard.yaml` → extract `common` + tool-specific `raw` settings
2. **Config Generation**: Apply `mapCommonToTool()` + merge `raw` → tool-native format
3. **Package Publishing**: Generated configs become the exported defaults in `@outfitter/*-config` packages
4. **Runtime Resolution**: Projects importing config packages get the preset-derived settings

This ensures presets and config packages stay synchronized while allowing both approaches (preset-based generation vs. direct config package usage).

### Formatter Check Mode Limitations
The `--check` flag behavior varies across formatters:

- **Prettier**: Full `--check` support (exits non-zero if formatting needed)
- **Biome**: Uses `--write=false` flag for check-only mode  
- **Remark**: Uses `--frail` for check mode (exits non-zero on lint issues)

All formatters support check mode, but with different CLI syntax. The router normalizes this behavior.

### Configuration File Format Strategy

The formatting package generates configuration files with **comments and consistency** as priorities:

**Format Selection Priority:**

1. **YAML** (preferred) - Supports comments, human-readable, consistent syntax
2. **JSONC** - For tools that require JSON but support comments (Biome)
3. **INI** - For legacy tools (.editorconfig)
4. **JavaScript** - For tools requiring programmatic configs (future ESLint)

**Benefits of YAML-first approach:**

- **Consistent commenting** across all config files
- **Human-readable** configuration
- **Tool identification** in headers (generated by, tool, preset)
- **Schema references** where supported
- **Easier maintenance** and debugging

**Generated file headers include:**

```yaml
# Generated by @outfitter/formatting
# Tool: [formatter-name]  
# Preset: [preset-name]
# Last updated: [timestamp]
```

### Simplified Configuration Strategy

The formatting package generates **standalone config files** for all tools to maintain consistency and simplicity:

**Benefits of standalone files:**

- **Consistent behavior** across all tools
- **No tool-specific configuration methods** to remember
- **Self-documenting** with comments and headers
- **Easy debugging** - all settings visible in one place
- **Predictable file locations** - no hunting through package.json

**Configuration files generated:**

- `.prettierrc.yaml` - Prettier configuration with comments
- `biome.jsonc` - Biome configuration with comments  
- `.remarkrc.yaml` - Remark configuration with comments
- `.editorconfig` - EditorConfig with comments
- `.eslintrc.yaml` - ESLint configuration (future)
- `.markdownlint.yaml` - Markdownlint configuration (future)

### Required Changes to Existing Config Packages

#### @outfitter/prettier-config
**Current state**: Static config export in `index.js`
**Required changes**:

```typescript
// Add to package.json
"exports": {
  ".": "./index.js",
  "./base": "./base.js"  // For programmatic access
}

// Update index.js to support both static and programmatic use
module.exports = {
  printWidth: 80,  // Align with preset (currently 100)
  semi: true,
  singleQuote: true,
  tabWidth: 2,
  trailingComma: 'all',
  useTabs: false,
  // Export function for programmatic generation
  generate: (presetConfig) => ({
    ...module.exports,
    ...mapPresetToPrettier(presetConfig)
  })
};
```

#### @outfitter/biome-config  
**Current state**: Static `biome.config.json` file
**Required changes**:

```typescript
// Add src/index.ts for programmatic access
export const config = {
  // Current biome.config.json content
};

export function generate(presetConfig) {
  return {
    ...config,
    ...mapPresetToBiome(presetConfig)
  };
}

// Update package.json main field to point to dist/index.js
```

#### @outfitter/remark-config (New Package)
**Required structure**:

```
packages/remark-config/
├── package.json
├── src/
│   └── index.ts
└── presets/
    ├── standard.js
    ├── strict.js
    └── relaxed.js
```

## Note on Rightdown

Rightdown is a work-in-progress package related to documentation formatting. The `@outfitter/formatting` package will supersede any formatting use cases where Rightdown was previously used.

## Success Criteria

1. **Adoption** - All Outfitter packages migrated
2. **Performance** - < 1s to format average markdown file (defined as ~500 lines with 5-10 code blocks)
   - *Note: Chunked processing may spawn multiple formatter processes; benchmarks should account for process overhead*
3. **Compatibility** - Zero breaks in existing workflows  
4. **Developer Experience** - Single config file, clear error messages
5. **IDE Integration** - Seamless VS Code experience

## Addendum: Why Choose Remark Over Prettier for Markdown Formatting

Although both Prettier and Remark can format Markdown, they serve different philosophies and capabilities. For the sophisticated documentation workflows envisioned in this proposal, Remark (and the wider **unified** ecosystem) offers several decisive advantages:

### Key advantages of Remark

- **Delegated code-block formatting** – Custom plugins can detect fenced code blocks (```` ```ts ```` etc.), pass them to the *language-specific* formatter of your choice (Biome, Prettier, Rust fmt — anything), and then re-insert the results. Prettier formats code blocks using its own built-in printers and cannot delegate.
- **Plugin-driven extensibility** – Remark exposes the Markdown AST (**mdast**). Hundreds of community plugins – or your own – can modify, lint, validate, or generate content during the same pass. Prettier is intentionally *not* extensible to keep its output predictable.
- **Unified processing pipelines** – Because Remark participates in `unified`, you can chain Remark → Rehype → etc. to produce HTML, run link checking, generate tables of contents, or apply GitHub-Flavoured Markdown transforms – all without extra I/O.
- **Semantic understanding** – Working on the AST means rules can be context-aware (e.g. "only re-wrap paragraphs inside list items" or "ensure heading IDs are unique"). Prettier treats the document as text and focuses on surface formatting.
- **Custom project conventions** – Need alphabetical list sorting, automatic front-matter updates, or house-style link rewriting? Write a small plugin once and ship it with your config package.

### Quick comparison

| Capability | Remark (unified) | Prettier |
| --- | --- | --- |
| Code-block delegation | ✅ via plugins | ❌ not possible |
| Custom formatting rules | ✅ limitless | 🚧 intentionally limited |
| Combined lint + format pipeline | ✅ (`remark-lint` + others) | ❌ |
| AST access | ✅ (`mdast`) | ❌ |
| Simplicity / zero-config | ▢ requires selecting plugins | ✅ one command |

In short, Prettier remains an excellent *baseline* formatter, but Remark is better suited when you need **language-aware code-block handling, custom style rules, or rich content pipelines** – all of which align with the goals of Outfitter's formatting tool.

## Next Steps

### Immediate (Milestone 1)

1. **Create `@outfitter/remark-config` package** - New package (doesn't exist)
2. **Update `@outfitter/prettier-config`** - Add programmatic access and align with presets
3. **Update `@outfitter/biome-config`** - Add programmatic access to existing config  
4. **Validate config schema** with team
5. **Build core formatter router** for Prettier, Biome, Remark

### Future Expansion (Milestone 4)

5. Research ESLint config package requirements and rule compatibility
6. Research markdownlint-cli2 integration with remark workflows
7. Design cross-tool rule consistency strategy (e.g., unified line length settings)
8. Create migration tooling for existing ESLint/markdownlint setups
