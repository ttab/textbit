# Textbit editable

## Description

An unstyled editable component with an easy to use plugin framework for creating custom rich text editors in React applications. Based on Slate. See [Slate documentation](https://docs.slatejs.org/) for more information on Slate. As it is early in development basic functionality and types can and will change.

## Development

Installation and local usage.

```
npm i
npm run dev
```

Building ESM and CJS.

```
npm run build`
```

This will produce both an ESM and CJS modules in as well as a typescript definition (_index.d.ts_) file in `dist/`.

## Using it in your project

### Installing

Textbit is available as NPM package published on Github. To install the Textbit package in your project add `@ttab:registry=https://npm.pkg.github.com/` to your `.npmrc`. It should look something like below.

```
registry=https://registry.npmjs.org/
@ttab:registry=https://npm.pkg.github.com/
```

Then it's just a matter of installing it using your favourite package manager.

```
npm i @ttab/textbit
```

### Basic usage

Below is the basic structure of the components and their usage. The example is lacking necessary styling and actions. Gutter, Menu and Toolbar components all receive a `className` property for styling. Clone the repo and see the directory `local/` for a more thorough example including additional link, list item plugins and example CSS.

**MyEditor.tsx**

```jsx
import React, { useState } from 'react'
import Textbit, {
  Menu,
  Toolbar,
  usePluginRegistry,
  useTextbit
} from '@ttab/textbit'
import './editor-variables.css'
import {
  Plugin1,
  Plugin2
} from 'plugin-bundle'

const initialValue: TBDescendant[] = [
  {
    type: 'core/text',
    id: '538345e5-bacc-48f9-8ef1-a219891b60eb',
    class: 'text',
    children: [
      { text: '' }
    ]
  }
]

function MyEditor() {
  return (
    <Textbit.Root
      verbose={true}
      plugins={[
        Plugin1(),
        Plugin2({
          option1: true,
          option2: false
        })
      ]}
    >
      <Textbit.Editable
        value={initialValue}
        onChange={value => {
          console.log(value, null, 2)
        }}
      >
        <Textbit.DropMarker />

        <Textbit.Gutter>
          <Menu.Root>
             <Menu.Trigger>⋮</Menu.Trigger>
             <Menu.Content>
              <Menu.Group>
                  <Menu.Item key="title" action={}>
                    <Menu.Icon/>
                    <Menu.Label>Text</Menu.Label>
                    <Menu.Hotkey>mod+0</Menu.Hotkey>
                  </Menu.Item>
                  <Menu.Item key="bodytext" action={}>
                    <Menu.Icon/>
                    <Menu.Label/>
                    <Menu.Hotkey/>
                  </Menu.Item>
              </Menu.Group>
            </Menu.Content>
          <Menu.Root>
        </Textbit.Gutter>

        <Toolbar.Root>
          <Toolbar.Group>
            <Toolbar.Item key="bold" action={}/>
            <Toolbar.Item key="italic" action={}/>
          </Toolbar.Group>
        </Toolbar.Root>

      </Textbit.Editable>
    </Textbit.Root>
  )
}
```

# Component Reference

## Textbit.Root

Top level Texbit component. Receives all plugins. Base plugins is exported from Textbit as `Textbit.Plugins[]`.

### Props

| Name | Type | Description |
| ----------- | ----------- | ----------- |
| verbose | boolean | Optional, default false|
| autoFocus | boolean | Optional, default false|
| onBlur | React.FocusEventHandler<HTMLDivElement> | Optional |
| onFocus | React.FocusEventHandler<HTMLDivElement> | Optional |
| plugins | Plugin.Definition[] | |
| debounce | number? | Optional debounce time for calling `onChange()` handler. Defaults to 250 ms.
| debounceSpellcheck | number? | Optional debounce time for calling `onSpellcheck()` handler. Defaults to 1250 ms.

### Provides PluginRegistryContext

PluginRegistryContext: access through convenience hook `usePluginRegistry()`.

| Name | Type | Description |
| ----------- | ----------- | ----------- |
| plugins | Plugin.Definition[] | All registered plugins |
| components | Map<string, PluginRegistryComponent> | Slate element render components |
| actions | PluginRegistryAction[] | Convenience structure |
| verbose | boolean | Output extra info about plugins and settings in the browsers developer console |
| debounce | number | Optional, set debounce value for onChange(), default 250ms |
| placeholder | string | Optional, placeholder text for entire editor, default is empty. Should not be combined with _placeholders_. |
| placeholders | 'none' | 'single' | 'multiple' | Optional, controls how placeholders are used. Single will display one placeholder for entire editor. Multiple will display plugins placeholders on each textline. Default is 'single' if the _placeholder_ property is set, otherwise 'none'. |
| dispatch | Dispatch<PluginRegistryReducerAction> | Add or delete plugins |

### Provides TextbitContext, useTextbit()

TextbitContext: access through convenience hook `useTextbit()`.

| Name | Type | Description |
| ----------- | ----------- | ----------- |
| stats | TextbitStats | words and characters in article parts or full document  |
| verbose | boolean | Output extra info on console |
| autoFocus | boolean | Whether autoFocus is true or false |
| onBlur | React.FocusEventHandler<HTMLDivElement> | Event handler for when editor loses focus |
| onFocus | React.FocusEventHandler<HTMLDivElement> | Event handler for when editor receives focus |

---

## Textbit.Editable

Editable area component, acts as wrapper around Slate.

### Props

| Name | Type | Description |
| ----------- | ----------- | ----------- |
| value | Descendant[] | Optional, initial content |
| onChange | (Descendant[] => void) | Function to receive all changes |
| onSpellcheck | onSpellcheck?: (texts: string[]) => Array<Array<{<br> str: string,<br> pos: number,<br> sub: string[]<br> }>> | Optional, callback function to handle spellchecking of strings |
| dir | "ltr" \| "rtl" | Optional, defaults to _ltr_ |
| lang | string | Optional langage (e.g en, en-BR, sv, sv_FI). Falls back to html document language, then browser language and last "en".
| yjsEditor | BaseEditor | BaseEditor created with `withYjs()` and `withCursors()` |
| gutter | boolean | Optional, defaults to true (render gutter). |
| className | string |  |
| readOnly | boolean | Optional, defaults to false |
| children | React.ReactNode \| undefined  |  |
| ref | React.LegacyRef<HTMLDivElement> | Provides reference to Slate Editable dom node |

### Provides GutterContext (_used internally_)

| Name | Type | Description |
| ----------- | ----------- | ----------- |
| gutter | boolean | |
| setOffset | ({ left: number, top: number }) => void | |
| offset | { left: number, top: number } | |

### Data attribute

| Name | Value | Description |
| ----------- | ----------- | ----------- |
| [data-state] | "focused" \| "" | Indicate whether editor has focus or not. |

## Example

Basic, not complete, example of using it with Yjs.

```javascript
const editor = useMemo(() => {
  return withYHistory(
    withCursors(
      withYjs(
        createEditor(),
        provider.document.get('content', Y.XmlText)
      ),
      provider.awareness,
      { data: user as unknown as Record<string, unknown> }
    )
  )
}, [provider.awareness, provider.document, user])
```

```jsx
<Textbit.Editable yjsEditor={editor} />
```

---

## Textbit.Element

Can be used to wrap all elements in plugin components. Provides data state attribute used for styling.

### Props

| Name | Type | Description |
| ----------- | ----------- | ----------- |
| className | string |  |
| children |  |  |

### Data attribute

| Name | Value | Description |
| ----------- | ----------- | ----------- |
| [data-state] | "active" \| "inactive" | The values "active" or "inactive" indicates whether the cursor is in the element or the element is part of a selection. |

### Styling spelling errors

When using the spellchecking functionality words (or combination of words) that are misspelled
are rendered as `<span>` child elements having the data attribute `data-spelling-error`. This
can be used to style all the spelling errors. See context menu handling for handling spelling errors
in more detail.

It is possible to differentiate between spelling errors and suggestions using the `data-spelling-level` which is set to `suggestion` if supported by the spellchecking functionality.

| Name | Value | Description |
| ----------- | ----------- | ----------- |
| [data-spelling-error] | string | Id of individual spelling error |
| [data-spelling-level] | `error`| `suggestion` | Level of the spelling error |

**Using a CSS style rule**

```css
[data-spelling-error] {
  text-decoration: underline;
  text-decoration-style: dotted;
}
[data-spelling-level="error"] {
    text-decoration-color: rgb(239, 68, 68);
}
[data-spelling-level="suggestion"] {
  text-decoration-color: rgb(68, 68, 239);
}
```

**Using Tailwind**

```JSX
return (
  <Textbit.Editable
    onSpellcheck={async (texts) => checkSpelling(texts)}
    className={`outline-none
      h-full
      dark:text-slate-100
      [&_[data-spelling-error]]:underline
      [&_[data-spelling-error]]:decoration-dotted
      [&_[data-spelling-level="error"]]:decoration-red-500
      [&_[data-spelling-level="suggestion"]]:decoration-blue-500`}
  >
    <ContextMenu />
  </Textbit.Editable>
)
```

---

## Textbit.DropMarker

Provides a drop marker indicator. Handles positioning and displaying automatically. Provides a html data attribute to use for styling when dragOver is happening and what type of dragOver is wanted. If `data-dragover` is `between` a line should be displayed between elements. This is the default behaviour. If a plugin component has property `droppable` set to `true` the droppable marker will encompass the whole element component. The `data-dragover` attribute will be set to `around`.

### Props

| Name | Type | Description |
| ----------- | ----------- | ----------- |
| className | string |  |

### Data attribute

| Name | Value | Description |
| ----------- | ----------- | ----------- |
| [data-dragover] | "none" \| "between" \| "around" | True when dragover is active |

## Textbit.Gutter

Provides a gutter for the content tool menu. Handles positioning automatically. Allows placement to the left or right of the content area. Context is used internally. Has inline styling for size and relative positioning of children.

---

## Menu.Root

Root component for the Menu structure.

### Props

| Name | Type | Description |
| ----------- | ----------- | ----------- |
| className | string | |

### Data attribute

| Name | Value | Description |
| ----------- | ----------- | ----------- |
| [data-state] | "open" \| "closed" | |

### Provides context (_used internally_)

| Name | Value | Description |
| ----------- | ----------- | ----------- |
| isOpen | boolean | |
| setIsOpen: | (boolean) => void | |

## Menu.Trigger

### Props

| Name | Type | Description |
| ----------- | ----------- | ----------- |
| className | string | |

## Menu.Content

### Props

| Name | Type | Description |
| ----------- | ----------- | ----------- |
| className | string | |

## Menu.Group

### Props

| Name | Type | Description |
| ----------- | ----------- | ----------- |
| className | string | |

## Menu.Item

### Props

| Name | Type | Description |
| ----------- | ----------- | ----------- |
| className | string |  |
| action | PluginRegistryAction | _Retrieved from hook usePluginRegistry()_ |

### Data attribute

| Name | Value | Description |
| ----------- | ----------- | ----------- |
| [data-state] | "active" \| "inactive" | Cursor or selection on content type. |

### Provides context (_used internally_)

| Name | Type |
| ----------- | ----------- |
| active | boolean |
| action | PluginRegistryAction |

### Example

```jsx
const { actions } = usePluginRegistry()

// ...

{actions.filter(action => !['leaf', 'generic', 'inline'].includes(action.plugin.class)).map(action => {
  <Menu.Item
    className="ct-item"
    key={`${action.plugin.class}-${action.plugin.name}-${action.title}`}
    action={action}
  >
    <Menu.Icon className="ct-icon" />
    <Menu.Label className="ct-label">{action.title}</Menu.Label>
    <Menu.Hotkey className="ct-hotkey" />
  </Menu.Item>
  })}
```

## Menu.Icon

Display an icon in the menu item. Can be automatic or overridden by children.

| Name | Type | Description |
| ----------- | ----------- | ----------- |
| className | string |  |
| children |  | Optional. Overrides default action tool icon |

## Menu.Label

Display a label for the menu item. Can be automatic or overridden by children when for example different translations are needed.

| Name | Type | Description |
| ----------- | ----------- | ----------- |
| className | string |  |
| children |  | Optional. Overrides default label |

## Menu.Hotkey

Displays a keyboard shortcut. If no children are provided it will automatically transform shortcuts from, for example, `mod+b` per platform to `ctrl+b` or `cmd+b`.

| Name | Type | Description |
| ----------- | ----------- | ----------- |
| className | string |  |
| children |  | Optional. Overrides default "translation" of action keyboard shortcut |

---

## Toolbar.Root

Root component around the context toolbox in the editor area providing access to tools like bold, links etc. Handles some style inline for hiding/showing the toolbox through manipulating _position_, _z-index_, _opacity_, _top_ and _left_.

| Name | Type | Description |
| ----------- | ----------- | ----------- |
| className | string |  |

## Toolbar.Group

| Name | Type | Description |
| ----------- | ----------- | ----------- |
| className | string |  |

## Toolbar.Item

| Name | Type | Description |
| ----------- | ----------- | ----------- |
| className | string |  |
| action | PluginRegistryAction | _Retrieved from hook usePluginRegistry()_ |

### Data attribute

| Name | Value | Description |
| ----------- | ----------- | ----------- |
| [data-state] | "active" \| "inactive" | Cursor or selection on leaf or inline like bold, italic, link. |

### Example

```jsx
const { actions } = usePluginRegistry()

// ...

{actions.filter(action => ['inline'].includes(action.plugin.class)).map(action => {
  <Toolbar.Item
    className="ctx-item"
    action={action} key={`${action.plugin.class}-${action.plugin.name}-${action.title}`}
  />
})}
```

---

## ContextMenu.Root

Root component around the context menu in the editor area providing a way to display spelling suggestions on spelling errors.

| Name | Type | Description |
| ----------- | ----------- | ----------- |
| className | string |  |

## ## ContextMenu.Group

| Name | Type | Description |
| ----------- | ----------- | ----------- |
| className | string |  |

## ## ContextMenu.Item

| Name | Type | Description |
| ----------- | ----------- | ----------- |
| className | string |  |
| func | () => void | Callback function to execute on click |

### useContextMenuHints() hook

Provides context click context hints, like which slate node, offset and spelling suggestions if they exist.

```typescript
interface {
    isOpen: boolean
    position?: {
      x: number,
      y: number
    }
    target?: HTMLElement
    event?: MouseEvent
    nodeEntry?: NodeEntry
    spelling?: {
      text: string
      level?: 'error' | 'suggestion'
      suggestions: string[]
      range?: Range
      apply: (replacementString: string) => void
    }
  }
```

### Example

```jsx
<ContextMenu.Root className='textbit-contextmenu'>
  {!!spelling?.suggestions &&
    <ContextMenu.Group className='textbit-contextmenu-group' key='spelling-suggestions'>
      {spelling.suggestions.map(suggestion => {
        return (
          <ContextMenu.Item
            className='textbit-contextmenu-item'
            key={suggestion}
            func={() => {
              spelling.apply(suggestion)
            }}
          >
            {suggestion}
          </ContextMenu.Item>
        )
      })}
    </ContextMenu.Group>
  }
</ContextMenu.Root>
```

## Plugin development

Content objects are handled by plugins. Plugins are defined by a structure which define hooks, render components and other parts of the plugin. Examples below should outline the general structure, they are not complete.

Plugins can be either

| class | |
| ----------- | ----------- |
| leaf | Bold, italic, etc. |
| inline | Inline blocks in the text, like links. |
| text | Normal text of various types. |
| _textblock_ | **deprecated** _Use block instead._ |
| block | Regular block elements like image, video. Automatically becomes draggable. |
| void | Non editable objects, like a spinning loader. Should seldom be used.|
| generic| Non rendered plugins. Like transforming input characters. |

### Examples

**Bold example**

```jsx
import { BoldIcon } from 'lucide-react'

const Bold: Plugin.InitFunction = () => {
  return {
    class: 'leaf',
    name: 'core/bold',
    actions: [{
      name: 'toggle-bold',
      tool: () => <BoldIcon style={{ width: '0.8em', height: '0.8em' }} />,
      hotkey: 'mod+b',
      handler: () => true
    }],
    getStyle: () => {
      return 'font-bold'
    }
  }
}
```

**Blockquote example**

```jsx
const Blockquote: Plugin.InitFunction = () => {
  return {
    class: 'textblock',
    name: 'core/blockquote',
    actions: [
      {
        name: 'set-blockquote',
        title: 'Blockquote',
        tool: () => <MessageSquareQuoteIcon style={{ width: '1em', height: '1em' }} />,
        hotkey: 'mod+shift+2',
        handler: actionHandler,
        visibility: (element) => {
          return [
            true, // Always visible
            true, // Always enabled
            (element.type === 'core/blockquote') // Active when isBlockquote
          ]
        }
      }
    ],
    componentEntry: {
      class: 'textblock',
      component: BlockquoteComponent,
      constraints: {
        normalizeNode: normalizeBlockquote // Render function for main/wrapper component
      },
      children: [
        {
          type: 'body',
          class: 'text',
          component: BlockquoteBody // Render the quote
        },
        {
          type: 'caption',
          class: 'text',
          component: BlockquoteCaption // Render the caption
        }
      ]
    }
  }
}
```

### Component rendering

A component is used to render an element. One plugin can have many different child components and even allow other plugin components as children.

Each component receives the props

| class | Type | Description |
| ----------- | ----------- | ----------- |
| children | `TBElement[]` | Child components that should be rendered |
| element | `TBElement` | The actual element being rendered |
| rootNode | `TBElement` | If the rendered component is a child node, rootNode gives access to the topmost root node which carries properties etc |
| options | `Record<string, unknown>` | An object with plugin options provided at plugin instantiation |

Using the hook `useAction()` it is possible to call a named action defined in the plugin specification, including providing a argument object (`Record<string, unknown>`).

_If a child component is using a html element as its rendered root element (e.g `<tr>`, `<td>`, etc) the child component must be defined as a ForwardedRef component. This allows Textbit to not add extra wrapper elements._

**Example**

```javascript
import { useAction, type Plugin } from '@ttab/textbit'

export const Factbox = ({ children, element }: Plugin.ComponentProps): JSX.Element => {
  const setFactIsChecked = useAction('core/factbox', 'fact-is-checked') // Use a defined action in a specified plugin

  return <>
    <a
      href="#"
      contentEditable={false}
      onMouseDown={event) => {
        // Prevent href click
        event.preventDefault()

         // Call the specified action
        setFactIsChecked({
          state: true
        })
      }}
    >
      Set is factchecked
    </a>
    <div>
      {children}
    </div>
  </>
}
```

```javascript
import { forwardRef, type PropsWithChildren } from 'react'

export const TableRow = forwardRef<HTMLTableRowElement, PropsWithChildren>(({ children }, ref) => (
  <tr ref={ref}>{children}</tr>
))

TableRow.displayName = 'TableRow'
```

### TextbitElement

The format of an element, or content object, in Texbit is based on Slate Element. Note the use of `properties` which is used to carry data about the element as well as how formatting like bold, italic et al is added directly on the text node.

**A text element of type 'h1'**

```json
{
    type: 'core/text',
    id: '538345e5-bacc-48f9-8ef1-a219891b60eb',
    class: 'text',
    properties: {
      type: 'h1'
    },
    children: [
      { text: 'Better music?' }
    ]
  }
```

**Example of bold/italic**

```json
{
    type: 'core/text',
    id: '538345e5-bacc-48f9-8ef0-1219891b60ef',
    class: 'text',
    children: [
      { text: 'An example paragraph  with ' },
      {
        text: 'stronger',
        'core/bold': true,
        'core/italic': true
      },
      {
        text: ' text.'
      }
    ]
  }
```

**Image example**

```json
{
  id: '538345e5-bacc-48f9-8ef0-1219891b60ef',
  class: 'block',
  type: 'core/image',
  properties: {
    type: 'image/png',
    src: 'https://www...image.png',
    title: 'My image',
    size: '234300,
    width: 1024,
    height: 986
  },
  children: [
    {
      type: 'core/image/image',
      class: 'text',
      children: [{ text: '' }]
    },
    {
      type: 'core/image/text',
      class: 'text',
      children: [{ text: 'An image of people taken 2001 in the countryside' }]
    },
    {
      type: 'core/image/altText',
      class: 'text',
      children: [{ text: 'Three people by a tree' }]
    }
  ]
}
```
