# @outfitter/remark-config

Shared Remark configuration for consistent Markdown processing across Outfitter projects.

## Installation

```bash
pnpm add @outfitter/remark-config
```

## Usage

### Basic Usage

```typescript
import remarkConfig from '@outfitter/remark-config';

// Use with remark
import { remark } from 'remark';

const processor = remark()
  .use(remarkConfig.plugins)
  .use(remarkConfig.settings);
```

### Preset Selection

```typescript
import { strict, relaxed, standard } from '@outfitter/remark-config';

// Use specific presets
const strictProcessor = remark().use(strict.plugins);
const relaxedProcessor = remark().use(relaxed.plugins);
```

### Custom Configuration

```typescript
import { generate } from '@outfitter/remark-config';

// Generate custom config
const config = generate({
  preset: 'strict',
  additionalPlugins: ['remark-lint-no-html'],
  settings: {
    bullet: '*',
    emphasis: '_',
  },
});
```

## Presets

### Standard (Default)
- Balanced rules for most projects
- 80 character line length
- ATX headings (# ## ###)
- Dash list markers (-)

### Strict
- Rigorous linting for documentation-heavy projects
- 80 character line length
- All standard rules plus additional checks
- Strict formatting consistency

### Relaxed
- Minimal rules for flexible projects
- 120 character line length
- Essential formatting only
- More permissive style

## Configuration Reference

All presets include these base settings:

```typescript
{
  bullet: '-',          // Use - for list markers
  emphasis: '*',        // Use * for emphasis
  strong: '*',         // Use * for strong emphasis  
  listItemIndent: 'one', // Single space indent for lists
  fence: '`',          // Use ` for code fences
  rule: '-',           // Use - for horizontal rules
  setext: false,       // Disable setext headings (=== style)
}
```

## Integration with .remarkrc

Create a `.remarkrc.yaml` file:

```yaml
plugins:
  - '@outfitter/remark-config'
```

Or for custom configuration:

```yaml
plugins:
  - ['@outfitter/remark-config/presets/strict']
```

## Development

```bash
# Install dependencies
pnpm install

# Build the package
pnpm build

# Run tests
pnpm test

# Type check
pnpm type-check
```

## License

ISC