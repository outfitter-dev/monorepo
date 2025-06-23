# VS Code Integration Guide

Rightdown can be integrated with Visual Studio Code in several ways to provide in-editor formatting for Markdown files with code blocks.

## Quick Setup Options

### Option 1: Custom Local Formatters Extension (Recommended)

1. Install the [Custom Local Formatters](https://marketplace.visualstudio.com/items?itemName=jkillian.custom-local-formatters) extension
2. Add to your workspace `.vscode/settings.json`:

```json
{
  "customLocalFormatters.formatters": [
    {
      "command": "npx @outfitter/rightdown --write ${file}",
      "languages": ["markdown"]
    }
  ],
  "[markdown]": {
    "editor.defaultFormatter": "jkillian.custom-local-formatters",
    "editor.formatOnSave": true
  }
}
```

### Option 2: Run on Save Extension

1. Install the [Run on Save](https://marketplace.visualstudio.com/items?itemName=emeraldwalk.RunOnSave) extension
2. Add to your workspace settings:

```json
{
  "emeraldwalk.runonsave": {
    "commands": [
      {
        "match": "\\.md$",
        "cmd": "npx @outfitter/rightdown --write ${file}"
      }
    ]
  }
}
```

### Option 3: VS Code Tasks

1. Create `.vscode/tasks.json`:

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Format Markdown",
      "type": "shell",
      "command": "npx @outfitter/rightdown --write ${file}",
      "group": "build",
      "presentation": {
        "reveal": "silent"
      }
    }
  ]
}
```

2. Run with: `Cmd+Shift+P` → `Tasks: Run Task` → `Format Markdown`

## How It Works

When you format a Markdown file (via `Shift+Alt+F` or on save), Rightdown will:

1. Parse the Markdown to find code blocks
2. Identify the language of each code block
3. Format each block with the appropriate formatter (Prettier, Biome, etc.)
4. Preserve the original fence style and metadata
5. Write the formatted content back to the file

## Configuration

Rightdown looks for configuration in the following order:

1. `.rightdown.config.{yaml,yml,json}` in the current directory
2. Parent directories up to the git root
3. Default configuration if none found

## Comparison with Native Prettier

While the Prettier VS Code extension can format Markdown files, Rightdown offers:

- **Unified configuration**: Single config for all your formatters
- **Multiple formatter support**: Use Biome for JS/TS, Prettier for others
- **Terminology enforcement**: Ensure consistent terminology across docs
- **Better fence preservation**: Maintains your exact fence style
- **Format verification**: Check if files are already formatted

## Future: Native VS Code Extension

We're planning a native VS Code extension that will:

- Provide real-time formatting without CLI overhead
- Show formatting errors inline
- Offer code actions for quick fixes
- Support format-on-type
- Integrate with VS Code's diff viewer

Stay tuned for updates!

## Troubleshooting

### Formatter not working

1. Ensure Rightdown is installed: `npm install -D @outfitter/rightdown`
2. Check that the command works in terminal: `npx rightdown --check README.md`
3. Verify your VS Code settings point to the correct formatter

### Performance issues

For large files, consider:
- Using `--cache` flag to skip unchanged blocks
- Limiting format-on-save to specific file patterns
- Running formatting as a pre-commit hook instead

### Conflicts with other extensions

If you have multiple Markdown formatters installed:
1. Set Rightdown as the default: `"[markdown]": { "editor.defaultFormatter": "..." }`
2. Or use "Format Document With..." to choose Rightdown specifically