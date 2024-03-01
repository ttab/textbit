# Textbit editable

## Description

An editable component with an easy to use plugin framework for creating custom rich text editors in React applications. Based on Slate. See [Slate documentation](https://docs.slatejs.org/) for more information on Slate. As it is early in development basic functionality and types can and will change.

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
```javascript
import React, { useState } from 'react'
import Textbit, {
  Menu,
  Toolbar,
  usePluginRegistry,
  useTextbit
} from '@ttab/textbit'
import './editor-variables.css'

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
    <Textbit.Editor verbose={true} plugins={Textbit.Plugins}>
      <Textbit.Editable
        value={initialValue}
        onChange={value => {
          console.log(value, null, 2)
        }}
      >
        <Textbit.Gutter>
          <Menu.Root>
             <Menu.Trigger>⋮</Menu.Trigger>
             <Menu.Content>
              <Menu.Group>
                  <Menu.Item key="title" action={}>
                    <Menu.Icon/>
                    <Menu.Label>Text</Menu.Label>
                    <Menu.Hotkey hotkey="mod+0"/>
                  </Menu.Item>
                  <Menu.Item key="bodytext" action={}>
                    <Menu.Icon/>
                    <Menu.Label>Text</Menu.Label>
                    <Menu.Hotkey hotkey="mod+0"/>
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
    </Textbit.Editor>
  )
}
```

**editor-variables.css**

```css
:root {
  --font-family-serif: Georgia, serif;
  --font-family-sans-serif: Helvetica, sans-serif;
  --font-family-mono: monospace;
  --font-family-ui: system-ui;

  --background: 0 0% 100%;
  --foreground: 240 10% 3.9%;
  --card: 0 0% 100%;
  --card-foreground: 240 10% 3.9%;
  --popover: 0 0% 100%;
  --popover-foreground: 240 10% 3.9%;
  --primary: 346.8 77.2% 49.8%;
  --primary-foreground: 355.7 100% 97.3%;
  --secondary: 240 4.8% 95.9%;
  --secondary-foreground: 240 5.9% 10%;
  --muted: 240 4.8% 95.9%;
  --muted-foreground: 240 3.8% 46.1%;
  --accent: 240 4.8% 95.9%;
  --accent-foreground: 240 5.9% 10%;
  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 0 0% 98%;
  --border: 240 5.9% 90%;
  --input: 240 5.9% 90%;
  --ring: 346.8 77.2% 49.8%;
  --radius: 0.5rem;
}

.dark {
  --background: 20 14.3% 4.1%;
  --foreground: 0 0% 95%;
  --card: 24 9.8% 10%;
  --card-foreground: 0 0% 95%;
  --popover: 0 0% 9%;
  --popover-foreground: 0 0% 95%;
  --primary: 346.8 77.2% 49.8%;
  --primary-foreground: 355.7 100% 97.3%;
  --secondary: 240 3.7% 15.9%;
  --secondary-foreground: 0 0% 98%;
  --muted: 0 0% 15%;
  --muted-foreground: 240 5% 64.9%;
  --accent: 12 6.5% 15.1%;
  --accent-foreground: 0 0% 98%;
  --destructive: 0 62.8% 30.6%;
  --destructive-foreground: 0 85.7% 97.3%;
  --border: 240 3.7% 15.9%;
  --input: 240 3.7% 15.9%;
  --ring: 346.8 77.2% 49.8%;
}
```

## Component Reference

### Textbit.Textbit

Top level Texbit component. Receives all plugins. Base plugins is exported from Textbit as `Textbit.Plugins`.

#### Props
| Name | Type | Description |
| ----------- | ----------- | ----------- |
| verbose | boolean | |
| plugins | Plugin.Definition[] | |

#### Provides context
Access through convenience hook `usePluginRegistry()`.

| Name | Type | Description |
| ----------- | ----------- | ----------- |
| plugins | Plugin.Definition[] | All registered plugins |
| leafComponents | Map<string, PluginRegistryComponent> | Slate leaf render components |
| elementComponents | Map<string, PluginRegistryComponent> | Slate element render components |
| actions | PluginRegistryAction[] | Convenience structure |
| verbose | boolean | Output extra info on console |
| dispatch | Dispatch<PluginRegistryReducerAction> | Add or delete plugins |

### Textbit.Editable

Editable area component, acts as wrapper around Slate.

#### Props
| Name | Type | Description |
| ----------- | ----------- | ----------- |
| value | Descendant[] | Optional, initial content |
| onChange | (Descendant[] => void) | Function to receive all changes |
| dir | "ltr" \| "rtl" | Optional, defaults to _ltr_ |
| yjsEditor | BaseEditor | BaseEditor created with `withYjs()` and `withCursors()`|
| gutter | boolean | Optional, defaults to true (render gutter). |

#### Provides GutterContext (_used internally_)
| Name | Type | Description |
| ----------- | ----------- | ----------- |
| gutter | boolean | |
| setOffset | ({ left: number, top: number }) => void | |
| offset | { left: number, top: number } | |

### Example

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

### Textbit.Gutter

Provides a gutter for the content tool menu. Handles positioning automatically. Allows placement to the left or right of the content area. Context is used internally. Has inline styling for size and relative positioning of children.

### Menu.Root

Root component for the Menu structure.

#### Props
| Name | Type | Description |
| ----------- | ----------- | ----------- |
| className | string | |

#### Data attribute
| Name | Value | Description |
| ----------- | ----------- | ----------- |
| [data-state] | "open" \| "closed" | |

#### Provides context (_used internally_)
| Name | Value | Description |
| ----------- | ----------- | ----------- |
| isOpen | boolean | |
| setIsOpen: | (boolean) => void | |

### Menu.Trigger

#### Props
| Name | Type | Description |
| ----------- | ----------- | ----------- |
| className | string | |

### Menu.Content

#### Props
| Name | Type | Description |
| ----------- | ----------- | ----------- |
| className | string | |

### Menu.Group

#### Props
| Name | Type | Description |
| ----------- | ----------- | ----------- |
| className | string | |

### Menu.Item

#### Props
| Name | Type | Description |
| ----------- | ----------- | ----------- |
| className | string |  |
| action | PluginRegistryAction | _Retrieved from hook usePluginRegistry()_ |

#### Data attribute
| Name | Value | Description |
| ----------- | ----------- | ----------- |
| [data-state] | "active" \| "inactive" | Cursor or selection on content type. |

#### Provides context (_used internally_)
| Name | Type |
| ----------- | ----------- |
| active | boolean |
| action | PluginRegistryAction |

#### Example

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
    <Menu.Hotkey hotkey={action.hotkey} className="ct-hotkey" />
  </Menu.Item>
  })}
```

### Menu.Icon

| Name | Type | Description |
| ----------- | ----------- | ----------- |
| className | string |  |

### Menu.Label

| Name | Type | Description |
| ----------- | ----------- | ----------- |
| className | string |  |

### Menu.Hotkey

| Name | Type | Description |
| ----------- | ----------- | ----------- |
| className | string |  |
| hotkey | string | Exmple `mod+b`. Translated per platform to `ctrl+b` or `cmd+b`  |

### Toolbar.Root

Root component around the context toolbox in the editor area providing access to tools like bold, links etc. Handles some style inline for hiding/showing the toolbox through manipulating _position_, _z-index_, _opacity_, _top_ and _left_.

| Name | Type | Description |
| ----------- | ----------- | ----------- |
| className | string |  |

### Toolbar.Group

| Name | Type | Description |
| ----------- | ----------- | ----------- |
| className | string |  |

### Toolbar.Item

| Name | Type | Description |
| ----------- | ----------- | ----------- |
| className | string |  |
| action | PluginRegistryAction | _Retrieved from hook usePluginRegistry()_ |

#### Data attribute
| Name | Value | Description |
| ----------- | ----------- | ----------- |
| [data-state] | "active" \| "inactive" | Cursor or selection on leaf or inline like bold, italic, link. |

#### Example

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
