# CLAUDE.md — @ttab/textbit

## What This Is

Unstyled, plugin-based rich text editor React component built on Slate. Supports real-time collaboration via Yjs (slate-yjs).

## Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start Vite dev server (demo app in `src/`) |
| `npm run build` | Vite library build → `dist/` |
| `npm run lint` | ESLint (flat config, cached) |
| `npm run lint:fix` | ESLint with auto-fix |
| `npm test` | Vitest (single run) |
| `npm run test:ui` | Vitest with browser UI |
| `npm run tsc` | TypeScript type-check (no emit) |

## Project Structure

```
lib/                    # Library source (entry: lib/main.ts)
  components/           # React components (TextbitRoot, TextbitEditable, Element/, etc.)
    TextbitEditable/
      handleOnKeyDown/  # Keyboard navigation (arrow handlers, block navigation)
    Element/            # Slate element renderers (Parent, Child, Inline, Leaf)
    ContentTools/       # Gutter/content menu (compound component API)
    ContextTools/       # Selection-based toolbar
    ContextMenu/        # Right-click context menu (spelling corrections)
    GutterProvider/     # Block-level gutter area
    PresenceOverlay/    # Collaborative cursor overlay
    core/               # Built-in plugins (Text, Bold, Italic, Underline, Navigation, Loader)
  contexts/             # React contexts (Textbit, PluginRegistry, SelectionBounds, DragState, AdjacentBlock)
  hooks/                # Public hooks (useAction, usePluginRegistry, useTextbit, useEditor, etc.)
  utils/                # Utilities (TextbitEditor, TextbitElement, TextbitPlugin, stats, pipes, etc.)
  with/                 # Slate editor enhancers (withInsertBreak, withNormalizeNode, withSpeling, etc.)
  types/                # TypeScript types + Slate CustomTypes augmentation
src/                    # Demo app (not part of library output)
tests/                  # Vitest tests (jsdom environment)
dist/                   # Build output (index.es.js, index.umd.js, main.d.ts)
```

## Architecture

### Compound Component API

The editor uses a compound component pattern with shared context:
- `Textbit.Root` → `Textbit.Editable` → `Menu.*` / `Toolbar.*` / `Textbit.ContextMenu.*`

### Three Content Modes

The `value` prop accepts `string`, `Descendant[]` (Slate nodes), or `Y.XmlText` (Yjs collaborative).

### Plugin System

Plugins are either `ElementDefinition` (for text/inline/block/void/generic elements) or `LeafDefinition` (for leaf formatting like bold/italic). Each plugin has a `name` like `core/text`, optional `actions` with hotkeys, a `componentEntry` for rendering, and optional `consumer`/`events`. Standard plugins (`core/text`, `core/bold`, `core/italic`, `core/underline`) are included by default.

### Slate Editor Enhancers

Editor behavior is extended via composable `with*` functions applied in `SlateContainer.tsx`: `withInsertBreak`, `withNormalizeNode`, `withInsertHtml`, `withUniqueIds`, `withDeletionManagement`, etc.

### Adjacent Block Caret

A virtual caret state for keyboard navigation beside non-text blocks (blocks with no direct text cursor entry point). Managed by `AdjacentBlockContext` and handled in `handleOnKeyDown/`.

## Build & Publishing

- **Vite library mode**: entry `lib/main.ts` → dual ESM/UMD output in `dist/`
- **Type declarations**: generated via `vite-plugin-dts` using `tsconfig.lib.json`
- **Externals** (not bundled): `react`, `react-dom`, `slate`, `slate-react`, `slate-history`, `yjs`
- **Registry**: GitHub npm (`https://npm.pkg.github.com/ttab`), scope `@ttab`
- **Version workflow**: `npm version` runs tests + build (preversion), then pushes tags (postversion)

## Testing

- **Framework**: Vitest + jsdom + @testing-library/react + @testing-library/jest-dom
- **Setup**: `tests/_vitest.setup.ts` (mocks for Range, getBoundingClientRect, getSelection, crypto)
- **Fixtures**: `tests/_fixtures.ts` (reusable Slate content arrays)
- **Path alias**: `@` → `./lib` (tests import library internals via `@/...`)

## Key Conventions

- ESM throughout (`"type": "module"`)
- TypeScript strict mode, multiple tsconfig files (lib, app, node, test)
- Slate `CustomTypes` augmented in `lib/types/slate.ts`
- Plugin names follow `namespace/name` convention (e.g. `core/text`)
- `withSpeling` typo is intentional
- Plugins should not use void elements, instead use block elements with normalizers.
