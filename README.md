# postcss-prune-vars
A PostCSS plugin that removes unused CSS custom properties, with content file scanning support for Vue, React, and plain HTML projects.

## Installation
```sh
npm install @adoratorio/postcss-prune-vars
```

## Usage
```typescript
import pruneVars from '@adoratorio/postcss-prune-vars';

// In your PostCSS config
const plugins = [
  pruneVars({ dirs: ['./src'] }),
];
```

## Why
Tools like PurgeCSS and `postcss-prune-var` only analyze CSS to determine which custom properties are used. Variables referenced in template inline styles (`style="color: var(--color-primary)"`) are invisible to them and get incorrectly removed.

This plugin scans both CSS declarations **and** content files (Vue templates, JSX, HTML) to build a complete picture of variable usage before pruning.

## Configuration

### PluginOptions
| Parameter | Type | Default | Description |
| :-------: | :--: | :-----: | :---------- |
| dirs | `string[]` | `['./src']` | Directories to scan for content files |
| extensions | `string[]` | `['.vue', '.js', '.ts', '.jsx', '.tsx', '.html']` | File extensions to scan |

## How It Works

1. **Scans content files** in the configured directories for `var(--name)` references
2. **Scans CSS declarations** for `var(--name)` in non-custom-property rules (e.g. `color: var(--text)`)
3. **Resolves dependency chains** — if `--color-primary: var(--color-dark)` is used, both variables are preserved
4. **Removes unused declarations** — any `--variable` not referenced directly or through a chain is removed
5. **Cleans up empty nodes** — empty `:root`, `@layer`, and `@media` blocks are removed

## Integration

### Vite + Vue
```typescript
import { defineConfig } from 'vite';
import purgecss from '@fullhuman/postcss-purgecss';
import pruneVars from '@adoratorio/postcss-prune-vars';

export default defineConfig({
  css: {
    postcss: {
      plugins: [
        ...(process.env.NODE_ENV === 'production'
          ? [
              purgecss({ /* ... */ }),
              pruneVars({ dirs: ['./src'] }),
            ]
          : []),
      ],
    },
  },
});
```

### Nuxt
```typescript
export default defineNuxtConfig({
  postcss: {
    plugins: {
      '@adoratorio/postcss-prune-vars': process.env.NODE_ENV === 'production'
        ? { dirs: ['./components', './layouts', './pages'] }
        : false,
    },
  },
});
```

## TypeScript Support
The plugin is written in TypeScript and includes full type definitions:

```typescript
import type { PluginOptions } from '@adoratorio/postcss-prune-vars';
```
