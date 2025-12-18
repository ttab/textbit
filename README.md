# Textbit

An unstyled, plugin-based rich text editor component for React applications. Built on Slate with support for collaborative editing via Yjs.

## Installation

Textbit is available as an NPM package published on GitHub. Add the following to your `.npmrc`:

```
registry=https://registry.npmjs.org/
@ttab:registry=https://npm.pkg.github.com/
```

Then install using your favorite package manager:

```bash
npm install @ttab/textbit
```

## Development

```bash
npm install
npm run dev
```

Build ESM and CJS modules:

```bash
npm run build
```

This produces ESM and CJS modules along with TypeScript definitions in `dist/`.

## Quick Start

```tsx
import { Textbit } from '@ttab/textbit'
import type { TBElement } from '@ttab/textbit'

const initialValue: TBElement[] = [
  {
    type: 'core/text',
    id: crypto.randomUUID(),
    class: 'text',
    children: [{ text: 'Hello world!' }]
  }
]

function MyEditor() {
  const [value, setValue] = useState(initialValue)

  return (
    <Textbit.Root
      value={value}
      onChange={setValue}
      placeholder="Start typing..."
    >
      <Textbit.Editable className="editor" />
    </Textbit.Root>
  )
}
```

## Table of Contents

- [Core Components](#core-components)
  - [Textbit.Root](#textbitroot)
  - [Textbit.Editable](#textbiteditable)
  - [Textbit.Gutter](#textbitgutter)
  - [Textbit.DropMarker](#textbitdropmarker)
- [Menu Components](#menu-components)
- [Toolbar Components](#toolbar-components)
- [Context Menu Components](#context-menu-components)
- [Hooks](#hooks)
- [Styling](#styling)
- [Collaborative Editing](#collaborative-editing)
- [Plugin Development](#plugin-development)
- [Utilities](#utilities)
- [TypeScript](#typescript)

---

## Core Components

### Textbit.Root

The root component that provides context for the editor. All other Textbit components must be descendants of `Textbit.Root`.

#### Props

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `string \| Descendant[] \| Y.XmlText` | - | **Required.** Editor content. Can be a string, Slate Descendant array, or Yjs XmlText for collaboration. |
| `onChange` | `(value: string \| Descendant[]) => void` | - | Called when content changes. Will serve Descendant[] when used with Y.XmlText. |
| `awareness` | `Awareness \| null` | - | Yjs awareness instance for collaborative cursors. Only valid when `value` is `Y.XmlText`. |
| `cursor` | `CursorConfig` | - | Cursor configuration for collaboration. See [Collaborative Editing](#collaborative-editing). |
| `plugins` | `TBPluginDefinition[]` | - | Array of plugin definitions. |
| `placeholder` | `string` | `''` | Placeholder text when editor is empty. |
| `placeholders` | `'none' \| 'single' \| 'multiple'` | `'none'` | Controls placeholder display mode. When using `multiple` text plugins displays their own placeholders per text object. |
| `readOnly` | `boolean` | `false` | Makes editor read-only. |
| `debounce` | `number` | `1250` | Debounce time for onChange in milliseconds. |
| `spellcheckDebounce` | `number` | `1250` | Debounce time for spellcheck in milliseconds. |
| `onSpellcheck` | `SpellcheckFunction` | - | Async function to handle spellchecking. |
| `verbose` | `boolean` | `false` | Enables console logging for debugging. |
| `className` | `string` | - | CSS class for root container. |
| `style` | `React.CSSProperties` | - | Inline styles for root container. |
| `dir` | `'ltr' \| 'rtl'` | `'ltr'` | Text direction. |
| `lang` | `string` | `'en'` | Language code (e.g., 'en', 'sv'). |

#### Spellcheck Function Type

A spellcheck function will receive an array of texts (with language code and the actual text). The function is expected to resolve with an array of spelling issues. Each spelling issue defines the identified string, start position of the string, an array of suggested substitutions and severity level.

When loading the editor the first time the whole text will be spellchecked. After that only the text object changed will be checked.

```typescript
type SpellcheckFunction = (
  texts: Array<{ lang: string; text: string }>
) => Promise<Array<Array<Omit<SpellingError, 'id'>>>>

interface SpellingError {
  str: string      // The misspelled text
  pos: number      // Position in the text
  sub: string[]    // Suggested replacements
  level?: 'error' | 'suggestion'  // Severity level
}
```

#### Examples

**String Mode**

```tsx
function SimpleEditor() {
  const [text, setText] = useState('')

  return (
    <Textbit.Root value={text} onChange={setText}>
      <Textbit.Editable />
    </Textbit.Root>
  )
}
```

**Structured Mode**

```tsx
import { Bold, Italic, Heading } from './plugins'

const initialValue = Descendant[] = [
  {
    type: 'core/text',
    id: '538345e5-bacc-48f9-8ef1-a219891b6011',
    class: 'text',
    properties: {
      role: 'heading-1'
    },
    children: [
      { text: 'The Baltic Sea' }
    ]
  },
  {
    type: 'core/text',
    id: '538345e5-bacc-48f9-8ef0-1219891b6024',
    class: 'text',
    children: [
      { text: 'This text editor was built on an island in the ' },
      {
        text: 'Baltic Sea',
        'core/bold': true
      },
      {
        text: '.'
      }
    ]
  }
]

function RichTextEditor() {
  const [value, setValue] = useState(initialValue)

  return (
    <Textbit.Root
      value={value}
      onChange={setValue}
      plugins={[Bold(), Italic(), Heading()]}
    >
      <Textbit.Editable />
    </Textbit.Root>
  )
}
```

**With Spellcheck**

```tsx
function EditorWithSpellcheck() {
  const [value, setValue] = useState(initialValue)

  const handleSpellcheck = async (texts) => {
    return texts.map(({ text, lang }) => {
      // Return array of spelling errors for each text
      return [
        { str: 'teh', pos: 0, sub: ['the', 'tea'], level: 'error' },
        { str: 'recieve', pos: 10, sub: ['receive'], level: 'error' }
      ]
    })
  }

  return (
    <Textbit.Root
      value={value}
      onChange={setValue}
      onSpellcheck={handleSpellcheck}
    >
      <Textbit.Editable />
    </Textbit.Root>
  )
}
```

---

### Textbit.Editable

The editable content area. Must be a child of `Textbit.Root`.

#### Props

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `autoFocus` | `boolean \| 'start' \| 'end'` | `false` | Auto-focus behavior. `true`/`'start'` focuses at start, `'end'` focuses at end. |
| `onFocus` | `React.FocusEventHandler<HTMLDivElement>` | - | Called when editor receives focus. |
| `onBlur` | `React.FocusEventHandler<HTMLDivElement>` | - | Called when editor loses focus. |
| `className` | `string` | - | CSS class for editable container. |
| `style` | `React.CSSProperties` | - | Inline styles for editable container. |
| `children` | `React.ReactNode` | - | Additional components (Toolbar, Gutter, etc.). |

#### Data Attributes

| Attribute | Values | Description |
|-----------|--------|-------------|
| `data-state` | `"focused" \| ""` | Indicates whether editor has focus. |

#### Example

```tsx
<Textbit.Editable
  autoFocus="end"
  className="prose dark:prose-invert"
  onFocus={() => console.log('Editor focused')}
  onBlur={() => console.log('Editor blurred')}
>
  <Textbit.Gutter>
    <Menu.Root>{/* ... */}</Menu.Root>
  </Textbit.Gutter>
  <Toolbar.Root>{/* ... */}</Toolbar.Root>
</Textbit.Editable>
```

---

### Textbit.Gutter

Provides a gutter area for content tools (like a menu). Automatically positions itself relative to the active block.

#### Props

| Name | Type | Description |
|------|------|-------------|
| `children` | `React.ReactNode` | Content to display in gutter (typically `Menu.Root`). |

#### Example

```tsx
<div style={{ display: 'grid', gridTemplateColumns: '50px 1fr' }}>
  <Textbit.Gutter>
    <Menu.Root>
      <Menu.Trigger>⋮</Menu.Trigger>
      <Menu.Content>
        {/* Menu items */}
      </Menu.Content>
    </Menu.Root>
  </Textbit.Gutter>

  <Textbit.Editable />
</div>
```

---

### Textbit.DropMarker

Visual indicator for drag-and-drop operations. Automatically handles positioning and visibility.

#### Props

| Name | Type | Description |
|------|------|-------------|
| `className` | `string` | CSS class for styling the drop marker. |

#### Data Attributes

| Attribute | Values | Description |
|-----------|--------|-------------|
| `data-dragover` | `"none" \| "between" \| "around"` | Indicates drag state. `"between"` shows line between elements, `"around"` encompasses droppable element. |

#### Example

```tsx
<Textbit.Editable>
  <Textbit.DropMarker className="drop-marker" />
  {/* Other children */}
</Textbit.Editable>
```

**CSS Styling**

```css
.drop-marker[data-dragover="between"] {
  height: 2px;
  background: #3b82f6;
}

.drop-marker[data-dragover="around"] {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}
```

---

### Textbit.Plugins

Array of standard plugins included with Textbit.

```tsx
import { Textbit } from '@ttab/textbit'

// Use default plugins
<Textbit.Root plugins={Textbit.Plugins}>
  <Textbit.Editable />
</Textbit.Root>

// Use custom plugins
<Textbit.Root plugins={[...Textbit.Plugins, MyCustomPlugin()]}>
  <Textbit.Editable />
</Textbit.Root>
```

---

## Menu Components

Components for building a content menu (block-level tools). Typically used in the gutter.

### Menu.Root

Root component for the menu structure.

#### Props

| Name | Type | Description |
|------|------|-------------|
| `className` | `string` | CSS class for menu root. |
| `children` | `React.ReactNode` | Menu content. |

#### Data Attributes

| Attribute | Values | Description |
|-----------|--------|-------------|
| `data-state` | `"open" \| "closed"` | Indicates menu open state. |

---

### Menu.Trigger

Button that toggles the menu.

#### Props

| Name | Type | Description |
|------|------|-------------|
| `className` | `string` | CSS class for trigger button. |
| `children` | `React.ReactNode` | Trigger content (text, icon). |

---

### Menu.Content

Container for menu items.

#### Props

| Name | Type | Description |
|------|------|-------------|
| `className` | `string` | CSS class for menu content. |
| `children` | `React.ReactNode` | Menu groups and items. |

---

### Menu.Group

Groups related menu items.

#### Props

| Name | Type | Description |
|------|------|-------------|
| `className` | `string` | CSS class for group. |
| `children` | `React.ReactNode` | Menu items. |

---

### Menu.Item

Individual menu item that triggers a plugin action.

#### Props

| Name | Type | Description |
|------|------|-------------|
| `action` | `string \| TBPluginRegistryAction` | **Required.** Action name or action object from plugin registry. |
| `className` | `string` | CSS class for item. |
| `children` | `React.ReactNode` | Item content (icon, label, hotkey). |

#### Data Attributes

| Attribute | Values | Description |
|-----------|--------|-------------|
| `data-state` | `"active" \| "inactive"` | Indicates if item's plugin is active in current selection. |

#### Example

```tsx
import { usePluginRegistry } from '@ttab/textbit'

function ContentMenu() {
  const { actions } = usePluginRegistry()

  return (
    <Menu.Root className="menu">
      <Menu.Trigger className="menu-trigger">⋮</Menu.Trigger>
      <Menu.Content className="menu-content">
        <Menu.Group className="menu-group">
          {actions
            .filter(a => a.plugin.class === 'text')
            .map(action => (
              <Menu.Item 
                key={action.name} 
                action={action.name}
                className="menu-item"
              >
                <Menu.Icon className="menu-icon" />
                <Menu.Label className="menu-label" />
                <Menu.Hotkey className="menu-hotkey" />
              </Menu.Item>
            ))
          }
        </Menu.Group>
      </Menu.Content>
    </Menu.Root>
  )
}
```

---

### Menu.Icon

Displays the action's icon. Auto-populated from plugin or can be overridden.

#### Props

| Name | Type | Description |
|------|------|-------------|
| `className` | `string` | CSS class for icon. |
| `children` | `React.ReactNode` | Optional. Override default icon. |

---

### Menu.Label

Displays the action's label. Auto-populated from plugin or can be overridden.

#### Props

| Name | Type | Description |
|------|------|-------------|
| `className` | `string` | CSS class for label. |
| `children` | `React.ReactNode` | Optional. Override default label. |

---

### Menu.Hotkey

Displays the action's keyboard shortcut. Automatically formats platform-specific shortcuts (e.g., `mod+b` becomes `⌘B` on Mac, `Ctrl+B` on Windows).

#### Props

| Name | Type | Description |
|------|------|-------------|
| `className` | `string` | CSS class for hotkey. |
| `children` | `React.ReactNode` | Optional. Override default hotkey. |

---

## Toolbar Components

Components for building a context toolbar (inline tools like bold, italic). The toolbar automatically positions itself near the current selection.

### Toolbar.Root

Root component for context toolbar.

#### Props

| Name | Type | Description |
|------|------|-------------|
| `className` | `string` | CSS class for toolbar. |
| `children` | `React.ReactNode` | Toolbar groups and items. |

---

### Toolbar.Group

Groups related toolbar items.

#### Props

| Name | Type | Description |
|------|------|-------------|
| `className` | `string` | CSS class for group. |
| `children` | `React.ReactNode` | Toolbar items. |

---

### Toolbar.Item

Individual toolbar button that triggers a plugin action.

#### Props

| Name | Type | Description |
|------|------|-------------|
| `action` | `string \| TBPluginRegistryAction` | **Required.** Action name or action object from plugin registry. |
| `className` | `string` | CSS class for item. |

#### Data Attributes

| Attribute | Values | Description |
|-----------|--------|-------------|
| `data-state` | `"active" \| "inactive"` | Indicates if item's plugin is active in current selection. |

#### Example

```tsx
import { usePluginRegistry } from '@ttab/textbit'

function ContextToolbar() {
  const { actions } = usePluginRegistry()

  return (
    <Toolbar.Root className="toolbar">
      <Toolbar.Group className="toolbar-group">
        {actions
          .filter(a => a.plugin.class === 'leaf')
          .map(action => (
            <Toolbar.Item 
              key={action.name} 
              action={action} 
              className="toolbar-item"
            />
          ))
        }
      </Toolbar.Group>
      <Toolbar.Group className="toolbar-group">
        {actions
          .filter(a => a.plugin.class === 'inline')
          .map(action => (
            <Toolbar.Item 
              key={action.name} 
              action={action} 
              className="toolbar-item"
            />
          ))
        }
      </Toolbar.Group>
    </Toolbar.Root>
  )
}
```

---

## Context Menu Components

Components for building a context menu (right-click menu), primarily for spelling suggestions and custom actions.

### Textbit.ContextMenu.Root

Root component for context menu. Automatically positions based on right-click location.

#### Props

| Name | Type | Description |
|------|------|-------------|
| `className` | `string` | CSS class for context menu. |
| `children` | `React.ReactNode` | Menu groups and items. |

---

### Textbit.ContextMenu.Group

Groups related context menu items.

#### Props

| Name | Type | Description |
|------|------|-------------|
| `className` | `string` | CSS class for group. |
| `children` | `React.ReactNode` | Context menu items. |

---

### Textbit.ContextMenu.Item

Individual context menu item.

#### Props

| Name | Type | Description |
|------|------|-------------|
| `func` | `() => void` | Callback function executed on click. Optional if only displaying static content. |
| `className` | `string` | CSS class for item. |
| `children` | `React.ReactNode` | Item content. |

#### Example

```tsx
import { useContextMenuHints } from '@ttab/textbit'

function SpellingContextMenu() {
  const { spelling } = useContextMenuHints()

  return (
    <Textbit.ContextMenu.Root className="context-menu">
      <Textbit.ContextMenu.Group className="context-menu-group">
        {spelling?.suggestions.length === 0 && (
          <Textbit.ContextMenu.Item className="context-menu-item">
            No spelling suggestions
          </Textbit.ContextMenu.Item>
        )}
        
        {spelling?.suggestions.map(({ text, description }) => (
          <Textbit.ContextMenu.Item
            key={text}
            className="context-menu-item"
            func={() => spelling.apply(text)}
          >
            {text}
            {description && <em> - {description}</em>}
          </Textbit.ContextMenu.Item>
        ))}
      </Textbit.ContextMenu.Group>
    </Textbit.ContextMenu.Root>
  )
}

// Use it in Textbit.Editable
<Textbit.Editable>
  <SpellingContextMenu />
</Textbit.Editable>
```

---

## Hooks

### useTextbit()

Access Textbit context and editor state.

```typescript
const {
  stats,          // TextbitStats
  verbose,        // boolean
  readOnly,       // boolean
  collaborative,  // boolean
  placeholders,   // PlaceholdersVisibility
  placeholder,    // string
  dir,            // 'ltr' | 'rtl'
  lang,           // string
  dispatch        // Dispatch<PluginRegistryReducerAction>
} = useTextbit()

interface TextbitStats {
  full: { words: number; characters: number }
  short: { words: number; characters: number }
}
```

#### Statistics

Full statistics includes all nodes of class `'text'` regardless of level. Short statistics only include top nodes of type `'core/text'`.

#### Example

```tsx
function EditorStats() {
  const { stats } = useTextbit()
  
  return (
    <div>
      <div>Words: {stats.full.words}</div>
      <div>Characters: {stats.full.characters}</div>
      {stats.short.words > 0 && (
        <div>Short: {stats.short.words} words</div>
      )}
    </div>
  )
}
```

---

### usePluginRegistry()

Access registered plugins and actions.

```typescript
const {
  plugins,    // TBPluginDefinition[]
  components, // Map<string, PluginRegistryComponent>
  actions     // TBPluginRegistryAction[]
} = usePluginRegistry()
```

#### Example

```tsx
function PluginList() {
  const { plugins, actions } = usePluginRegistry()
  
  return (
    <div>
      <h3>Registered Plugins: {plugins.length}</h3>
      <ul>
        {actions.map(action => (
          <li key={action.name}>{action.title}</li>
        ))}
      </ul>
    </div>
  )
}
```

---

### useAction(pluginName, actionName)

Get a specific action function from a plugin. Useful for programmatic control.

```typescript
const myAction = useAction('core/image', 'upload-image')

// Call it with optional arguments
myAction({ file: imageFile, url: 'https://...' })
```

#### Example

```tsx
function ImageUploader() {
  const uploadImage = useAction('core/image', 'insert-image')
  
  const handleFileSelect = async (file: File) => {
    const url = await uploadToServer(file)
    uploadImage({ url, alt: file.name })
  }
  
  return <input type="file" onChange={e => handleFileSelect(e.target.files[0])} />
}
```

---

### useContextMenuHints()

Access context menu state and spelling information.

```typescript
const {
  isOpen,     // boolean
  position,   // { x: number; y: number } | undefined
  target,     // HTMLElement | undefined
  event,      // MouseEvent | undefined
  nodeEntry,  // NodeEntry | undefined
  spelling    // SpellingInfo | undefined
} = useContextMenuHints()

interface SpellingInfo {
  text: string
  level?: 'error' | 'suggestion'
  suggestions: Array<{
    text: string
    description?: string
  }>
  range?: Range
  apply: (replacement: string) => void
}
```

#### Example

```tsx
function ContextMenu() {
  const { isOpen, spelling, position } = useContextMenuHints()
  
  if (!isOpen || !spelling) {
    return null
  }
  
  return (
    <div style={{ position: 'fixed', left: position?.x, top: position?.y }}>
      {spelling.suggestions.map(({ text }) => (
        <button key={text} onClick={() => spelling.apply(text)}>
          {text}
        </button>
      ))}
    </div>
  )
}
```

---

### useSelectionBounds()

Get the current selection's bounding rectangle.

```typescript
const bounds = useSelectionBounds()
// Returns: DOMRect | null
```

#### Example

```tsx
function SelectionHighlight() {
  const bounds = useSelectionBounds()
  
  if (!bounds) return null
  
  return (
    <div
      style={{
        position: 'fixed',
        left: bounds.left,
        top: bounds.top,
        width: bounds.width,
        height: bounds.height,
        border: '2px solid blue',
        pointerEvents: 'none'
      }}
    />
  )
}
```

---

## Styling

Textbit provides minimal default styling, allowing you to fully customize the appearance.

### Data Attributes for Styling

#### Editor State

```css
/* When editor has focus */
[data-state="focused"] {
  outline: 2px solid #3b82f6;
}
```

#### Menu and Toolbar Items

```css
/* Active plugin */
[data-state="active"] {
  background: #dbeafe;
  color: #1e40af;
}

/* Inactive plugin */
[data-state="inactive"] {
  opacity: 0.6;
}
```

#### Drag and Drop

```css
/* Line between elements */
[data-dragover="between"] {
  height: 2px;
  background: #3b82f6;
  margin: 4px 0;
}

/* Highlight around droppable element */
[data-dragover="around"] {
  outline: 2px dashed #3b82f6;
  outline-offset: 2px;
}
```

### Spelling Errors

Spelling errors are rendered with data attributes for custom styling:

| Attribute | Values | Description |
|-----------|--------|-------------|
| `data-spelling-error` | `string` | Unique ID of spelling error. |
| `data-spelling-level` | `"error" \| "suggestion"` | Severity level. |

#### CSS Example

```css
[data-spelling-error] {
  text-decoration: underline dotted;
}

[data-spelling-level="error"] {
  text-decoration-color: #ef4444;
}

[data-spelling-level="suggestion"] {
  text-decoration-color: #3b82f6;
}
```

#### Tailwind Example

```tsx
<Textbit.Editable
  className="
    [&_[data-spelling-error]]:underline
    [&_[data-spelling-error]]:decoration-dotted
    [&_[data-spelling-level='error']]:decoration-red-500
    [&_[data-spelling-level='suggestion']]:decoration-blue-500
  "
/>
```

---

## Collaborative Editing

Textbit supports real-time collaboration using Yjs.

### Basic Setup

```tsx
import * as Y from 'yjs'
import { WebrtcProvider } from 'y-webrtc'
import { Textbit } from '@ttab/textbit'

function CollaborativeEditor() {
  const ydoc = useMemo(() => new Y.Doc(), [])
  const provider = useMemo(
    () => new WebrtcProvider('my-room-name', ydoc),
    [ydoc]
  )
  const sharedContent = useMemo(
    () => ydoc.get('content', Y.XmlText),
    [ydoc]
  )

  return (
    <Textbit.Root
      value={sharedContent}
      awareness={provider.awareness}
      cursor={{
        data: {
          name: 'John Doe',
          color: 'rgb(59, 130, 246)',
          initials: 'JD'
        }
      }}
    >
      <Textbit.Editable />
    </Textbit.Root>
  )
}
```

### Cursor Configuration

When using collaborative editing, configure how cursors are displayed:

```typescript
interface CursorConfig {
  stateField?: string              // Awareness field name for cursor state
  dataField?: string               // Awareness field name for cursor data
  autoSend?: boolean               // Auto-send cursor updates (default: true)
  data: {
    name: string                   // User's display name
    color: string                  // User's cursor color (rgb/hex)
    initials: string               // User's initials
    avatar?: string                // Optional avatar URL
    [key: string]: unknown         // Additional custom data
  }
}
```

### Full Collaborative Example

```tsx
import { useMemo, useEffect } from 'react'
import * as Y from 'yjs'
import { WebrtcProvider } from 'y-webrtc'
import { Textbit } from '@ttab/textbit'
import { slateNodesToInsertDelta } from '@slate-yjs/core'

function CollaborativeEditor() {
  const ydoc = useMemo(() => new Y.Doc(), [])
  const provider = useMemo(
    () => new WebrtcProvider('room-' + roomId, ydoc),
    [ydoc, roomId]
  )
  const content = useMemo(() => ydoc.get('content', Y.XmlText), [ydoc])

  // Initialize with existing content
  useEffect(() => {
    if (content.length === 0 && initialContent.length > 0) {
      content.applyDelta(slateNodesToInsertDelta(initialContent))
    }
  }, [content, initialContent])

  return (
    <Textbit.Root
      value={content}
      awareness={provider.awareness}
      cursor={{
        autoSend: true,
        data: {
          name: currentUser.name,
          color: currentUser.color,
          initials: currentUser.initials,
          avatar: currentUser.avatarUrl
        }
      }}
      plugins={[/* your plugins */]}
    >
      <Textbit.Editable>
        {/* Other components */}
      </Textbit.Editable>
    </Textbit.Root>
  )
}
```

---

## Plugin Development

Plugins extend Textbit with custom content types and behaviors.

### Plugin Types

| Class | Description | Examples |
|-------|-------------|----------|
| `leaf` | Inline formatting | Bold, italic, underline |
| `inline` | Inline blocks | Links, mentions |
| `text` | Text blocks | Paragraphs, headings, blockquotes |
| `block` | Block elements | Images, videos, embeds |
| `void` | Non-editable elements | Loaders, a child image element in a block element |
| `generic` | Non-visual plugins | Input transformers, validators |

### Drag'n drop
Block and void class elements are automatically draggable in all parts not occupied by a child text element.

Any DOM element with the attribute `draggable` set to `true` will enable dragging of the entire top level ancestor block. This is useful if one need to make a text element draggable. Usually these DOM elements also need to have `contentEditable` set to `false` as well.

### Plugin Structure

```typescript
import type { TBPluginInitFunction } from '@ttab/textbit'

const MyPlugin: TBPluginInitFunction = (options) => {
  return {
    class: 'block',
    name: 'namespace/image',
    
    actions: [{
      name: 'toggle-image',
      title: 'Image',
      hotkey: 'mod+i',
      tool: () => <ImageIcon />,
      handler: ({ editor, options }) => {
        // Custom logic here
        // Return true to also use default behavior
        // Return false if you handled everything
        return true
      }
    }],
    
    componentEntry: {
      class: 'void',
      component: Figure,
      constraints: {
        normalizeNode: normalizeImage
      }
    },
    
    // Optional: Plugin options
    options: options || {}
  }
}
```

### Component Props

Plugin components receive these props:

```typescript
interface TBComponentProps {
  element: TBElement           // Current element being rendered
  children: React.ReactNode    // Child elements to render
  rootNode?: TBElement         // Root element if this is a descendant component
  options?: Record<string, unknown> // Plugin options
}
```

### Example: Bold Plugin

```tsx
import { BoldIcon } from 'lucide-react'
import type { TBPluginInitFunction, TBComponentProps } from '@ttab/textbit'

const Bold: TBPluginInitFunction = () => {
  return {
    class: 'leaf',
    name: 'core/bold',
    
    actions: [{
      name: 'toggle-bold',
      title: 'Bold',
      hotkey: 'mod+b',
      tool: () => <BoldIcon size={16} />,
      handler: () => true // Use default toggle behavior
    }],

    getStyle: () => {
      // Leaf CSS styling
      return {
        fontWeight: 'bold'
      }
    }
  }
}

export { Bold }
```

### Example: Link Plugin

```tsx
import { LinkIcon } from 'lucide-react'
import type { TBPluginInitFunction, TBComponentProps } from '@ttab/textbit'
import { Editor, Transforms } from 'slate'

const Link: TBPluginInitFunction = () => {
  return {
    class: 'inline',
    name: 'core/link',
    
    actions: [{
      name: 'insert-link',
      title: 'Link',
      hotkey: 'mod+k',
      tool: () => <LinkIcon size={16} />,
      handler: ({ editor }) => {
        const url = prompt('Enter URL:')
        if (!url) return false
        
        const link = {
          type: 'core/link',
          url,
          children: [{ text: url }]
        }
        
        if (editor.selection) {
          Transforms.wrapNodes(editor, link, { split: true })
        } else {
          Transforms.insertNodes(editor, link)
        }
        
        return false // We handled everything
      }
    }],
    
    componentEntry: {
      class: 'inline',
      component: LinkComponent
    }
  }
}

function LinkComponent({ element, children }: TBComponentProps) {
  return (
    <a 
      href={element.url} 
      target="_blank" 
      rel="noopener noreferrer"
      className="text-blue-600 underline"
    >
      {children}
    </a>
  )
}

export { Link }
```

### Example: Image Block Plugin

```tsx
import { ImageIcon } from 'lucide-react'
import type { TBPluginInitFunction, TBComponentProps } from '@ttab/textbit'
import { Transforms } from '@ttab/textbit'

const Image: TBPluginInitFunction = () => {
  return {
    class: 'block',
    name: 'core/image',
    
    actions: [{
      name: 'insert-image',
      title: 'Image',
      hotkey: 'mod+shift+i',
      tool: () => <ImageIcon size={16} />,
      handler: ({ editor }) => {
        const url = prompt('Enter image URL:')
        if (!url) return false
        
        const image = {
          type: 'core/image',
          class: 'block',
          id: crypto.randomUUID(),
          properties: { src: url },
          children: [
            {
              type: 'core/image/caption',
              class: 'text',
              children: [{ text: '' }]
            }
          ]
        }
        
        Transforms.insertNodes(editor, image)
        return false
      }
    }],
    
    componentEntry: {
      class: 'block',
      component: FigureComponent,
      constraints: {
        normalizeNode: normalizeImage
      },
      children: [
        {
          type: 'image',
          class: 'void',
          component: ImageComponent
        },
        {
          type: 'text',
          class: 'text',
          component: CaptionComponent,
          constraints: {
            allowBreak: false
          }
        }
      ]
    }
  }
}

function FigureComponent({ element, children }: TBComponentProps) {
  return (
    <figure className="my-4">
      {children}
    </figure>
  )
}

function ImageComponent({ element, children }: TBComponentProps) {
  return (
    <img 
      src={element.properties.src} 
      alt=""
      className="w-full rounded"
    />
  )
}

function CaptionComponent({ children }: TBComponentProps) {
  return (
    <div className="p-2 flex rounded rounded-xs text-sm bg-slate-200 dark:bg-slate-800">
      <label className="grow-0 w-16 opacity-70" contentEditable={false}>Text:</label >
      <figcaption className="grow">
        {children}
      </figcaption>
    </div >
  )
}

export { Image }
```

### Using Actions in Components

Use the `useAction` hook to call plugin actions from within components:

```tsx
import { useAction } from '@ttab/textbit'
import type { TBComponentProps } from '@ttab/textbit'

function ImageComponent({ element }: TBComponentProps) {
  const deleteImage = useAction('core/image', 'delete-image')
  
  return (
    <figure contentEditable={false}>
      <img src={element.properties.src} alt="" />
      <button onClick={() => deleteImage({ id: element.id })}>
        Delete
      </button>
    </figure>
  )
}
```

### Forwarding Refs for HTML Elements

If your component wants to use a specific wrapper HTML element (like `<tr>`, `<td>`, etc.), use `ref`:

```tsx
import type { TBComponentProps } from '@ttab/textbit'

export const TableRow = ({ children, ref }: TBComponentProps<HTMLTableRowElement>) => (
  <tr ref={ref}>{children}</tr>
)

TableRow.displayName = 'TableRow'

```

---

## Utilities

### File Handling

Process dropped files or file input changes:

```typescript
import { 
  consumeFileDropEvent, 
  consumeFileInputChangeEvent 
} from '@ttab/textbit'

// Handle drop events
const handleDrop = async (event: DragEvent) => {
  const files = await consumeFileDropEvent(event)
  files.forEach(file => {
    console.log(file.name, file.type, file.size)
  })
}

// Handle file input
const handleChange = async (event: ChangeEvent<HTMLInputElement>) => {
  const files = await consumeFileInputChangeEvent(event)
  files.forEach(file => {
    console.log(file.name, file.type, file.size)
  })
}
```

### Calculate Statistics

Calculate word and character counts:

```typescript
import { useTextbit } from '@ttab/textbit'

function EditorStats() {
  const { stats } = useTextbit()
  
  return (
    <div>
      <div>Words: {stats.full.words}</div>
      <div>Characters: {stats.full.characters}</div>
      {stats.short.words > 0 && (
        <div>Selected: {stats.short.words} words</div>
      )}
    </div>
  )
}
```

### Editor Utilities

Helper utilities for working with the editor:

```typescript
import { TextbitEditor, TextbitElement, TextbitPlugin } from '@ttab/textbit'

// Check if element is a certain type
if (TextbitElement.isOfType(element, 'core/text')) {
  console.log('This is a core text element')
}

// Get plugin by type
const plugin = TextbitPlugin.get(plugins, 'core/bold')

```

---

## TypeScript

Textbit is written in TypeScript and provides comprehensive type definitions.

### Exported Types

```typescript
import type {
  // Element and editor types
  TBElement,          // Textbit element
  TBText,             // Text node
  TBEditor,           // Extended Slate editor
  TBRange,            // Range type
  
  // Plugin types
  TBPluginDefinition, // Plugin definition
  TBPluginInitFunction, // Plugin initialization function
  TBComponentProps,   // Component props
  TBAction,           // Action definition
  TBPluginOptions,    // Plugin options
  TBPluginRegistryAction, // Registry action
  
  // Resource and component types
  TBResource,         // Resource definition
  TBComponentEntry,   // Component entry
  TBComponent,        // Component type
  TBToolComponent,    // Tool component
  TBToolComponentProps, // Tool component props
  
  // Other types
  TBSpellingError,    // Spelling error structure
  TBConsumeFunction,  // Consume function type
  TBConsumesFunction  // Consumes function type
} from '@ttab/textbit'
```

### Re-exported Slate Types

Textbit re-exports Slate types with the correct type augmentation:

```typescript
import {
  // Utilities
  Editor,      // Slate Editor utilities
  Element,     // Slate Element utilities
  Text,        // Slate Text utilities
  Transforms,  // Slate transform operations
  Node,        // Slate Node utilities
  Range        // Slate Range utilities
} from '@ttab/textbit'

import type {
  // Base types
  Descendant,  // Slate content node
  Ancestor,    // Slate ancestor node
  BaseEditor,  // Base editor type
  BaseElement, // Base element type
  BaseText,    // Base text type
  BaseRange    // Base range type
} from '@ttab/textbit'
```

### Type Augmentation

Textbit uses TypeScript declaration merging to extend Slate's types. When you import from `@ttab/textbit`, you get the augmented types automatically:

```typescript
import { Editor, Element } from '@ttab/textbit'

// These now use Textbit's augmented types
const editor: Editor // Actually TBEditor
const element: Element // Actually TBElement
```

### Custom Plugin Types

When creating plugins, use the type helpers:

```typescript
import type { 
  TBPluginInitFunction, 
  TBComponentProps,
  TBElement
} from '@ttab/textbit'

// Plugin initialization
const MyPlugin: TBPluginInitFunction = (options) => {
  return {
    // Plugin definition
  }
}

// Component
function MyComponent({ element, children }: TBComponentProps) {
  // Component implementation
}

// Type guard
function isMyPlugin(element: TBElement): element is TBElement & { 
  type: 'namespace/my-plugin' 
} {
  return element.type === 'namespace/my-plugin'
}
```

---

## Element Structure

Textbit elements are based on Slate elements with additional conventions:

### Text Element

```typescript
{
  type: 'core/text',
  id: '538345e5-bacc-48f9-8ef1-a219891b60eb',
  class: 'text',
  properties: {
    role: 'heading-1'  // Optional sub-type
    // Additional properties can be defined
  },
  children: [
    { text: 'Better music?' }
  ]
}
```

### Formatted Text

```typescript
{
  type: 'core/text',
  id: '538345e5-bacc-48f9-8ef0-1219891b60ef',
  class: 'text',
  children: [
    { text: 'An example paragraph with ' },
    {
      text: 'stronger',
      'core/bold': true,
      'core/italic': true
    },
    { text: ' text.' }
  ]
}
```

### Block Element (Image Example)

```typescript
{
  id: '538345e5-bacc-48f9-8ef0-1219891b60ef',
  class: 'block',
  type: 'core/image',
  properties: {
    src: 'https://example.com/image.png',
    alt: 'Description',
    width: 1024,
    height: 768
  },
  children: [
    {
      type: 'core/image/caption',
      class: 'text',
      children: [{ text: 'An image of people taken 2001' }]
    }
  ]
}
```

---

## Complete Example

See `./src` for several complete examples.

---

## License

MIT
