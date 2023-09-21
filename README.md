# Elephant Editor (elephant-slate)

## Description

An editor component based on Slate for embedding into react applications. See [Slate documentation](https://docs.slatejs.org/) for more information.

## Development

### Installation and local usage
`npm i`
`npm run start`

### Building ESM and CJS
`npm run build`

This will product both an ESM and CJS modules in as well as a typescript definition (_index.d.ts_) file in `dist/`.

## Structure

### Main directory structure

`src/`

Actual editor code. Handled by rollup and published to _https://npm.pkg.github.com/_ as private NPM package which is defined in .npmrc with an __authToken_ that allows write and read of packages.

`__tooling__/`

All tooling except `.tsconfig.json` due to issues with building types definition file correctly.

`dist/`

Build output directory


### Local development support directory structure

`local/`

Not part of the editor component. Code for running the editor locally during development using _esbuild_ and _esbuildserve_.

`local/src/` and `local/www/`

React code in _src/_ is build into _local/www/build/_ and mounted using _local/www/index.html_.

`local/__tooling__/`

Tooling for _esbuild_ and _esbuildserve_.

# Developer documentation

## Using in other projects

This example is not expressed in full and assumes there is an NPM package available. Which at this point it's not.

```jsx
import { Editor } from '@ttapp/elephant-slate'
import '@ttapp/elephant-slate/dist/esm/index.css'

import { Descendant } from 'slate'
import { uploadImages } from './images'

const initialValue: Descendant[] = [
    {
        type: 'core/heading-1',
        id: '538345e5-bacc-48f9-8ef1-a219891b60eb',
        class: 'text',
        children: [
            { text: 'Better music?' }
        ]
    },
    {
        type: 'core/preamble',
        id: '538345e5-bacc-48f9-9ed2-b219892b51dc',
        class: 'text',
        children: [
            { text: 'It is one of those days when better music makes all the difference in the world. At least to me, my inner and imaginary friend.' }
        ]
    }
]

const [value, setValue] = useState<Descendant[]>(initialValue)

function App() {
    return (
        <Editor
            value={value}
            onChange={(value) => onChangeImpl(setValue, value)}
        />
    )
}
```

## Plugins

Plugins does not really exist yet. These are hard coded into the src and can be found in `src/components/editor/standardPlugins` sub directories depending on the type of plugin it is (see below for type of plugins).


### How to define a "plugin"

Plugins are defined using the interface below. (See `src/types.ts` for all the types.)


```javascript

interface MimerComponent {
  class?: string
  type?: string
  placeholder?: string,
  render: RenderElementFunction | RenderLeafFunction
  children?: MimerComponent[]
  constraints?: {
    minElements?: number
    maxElements?: number
    maxLength?: number
    allowBreak?: boolean
    allowSoftBreak?: boolean
  }
}

interface ConsumerInput {
  source: string
  type: string
  data: any
}

interface ConsumesProps {
  input: ConsumerInput
}

interface ConsumerProps {
  input: ConsumerInput | ConsumerInput[]
}

type ConsumesFunction = (props: ConsumesProps) => [boolean, (string | null)?, boolean?]
type ConsumeFunction = (props: ConsumerProps) => Promise<any | undefined>

interface MimerPlugin {
  class: 'leaf' | 'inline' | 'text' | 'textblock' | 'block' | 'void' | 'generic'
  name: string
  consumer?: {
    consumes: ConsumesFunction  // Can you consume [data], [true/false, provides `type` as response]
    consume: ConsumeFunction // Consume [data] please
  }
  events?: {
    onNormalizeNode?: (editor: Editor, entry: NodeEntry) => true | void
  }
  actions?: Array<{
    tool?: JSX.Element | Array<JSX.Element | ToolFunction>
    hotkey?: string
    title?: string
    handler: (props: MimerActionHandlerProps) => boolean
  }>
  component?: MimerComponent
}


```

**class** 

Plugin class (see below for more details on the plugin classes).

```javascript
type MimerPluginClass = 'leaf' | 'inline' | 'text' | 'textblock' | 'block' | 'void' | 'generic'
```

**name**

Name of plugin. Used to derive default component type names. I.e a plugin named *core/heading-1* having a slate rendered component with no specifed type will inherit the plugin name as the component type.

**consumer**

The plugin can define two functions, one that can anser whether the plugin can consume a specific type of data and another that should be able to consume that data.

The `consumer.consumes()` is asked for each data item. Input is a structure with `source` (_drop_, _fileinput_ or _text_), `type` (e.g. _image/jpeg_, _text/uri-list_, _text/plain_) and `data` (either a _File_ object or text data).

The response can be `[false]` to say the plugin won't handle the data, or e.g. `[true, 'core/gallery', true]` to say it 1. wants to handle it, 2. it will return a specific data object and 3. it wants to receive all data as an array (in bulk).

If the response is positive the `consumer.consume()` function will receive data items either as individual items (function is called for each data item) or all supported items have been aggregated into one array. The `consumer.consume()` should be _async_ or respond with a Promise.

If the `consumer.consume()` function return a supported element it will automatically be inserted in the editor where the drop took place or where the current selection is.

It the `consumer.consume()` function receives text and returns `false` it suppresses default behaviour. This is useful when text input is manipulated and handled by the consume function, or if you would like to hinder insertion of a specific text string. Normal behaviour when not returning anything is to fall back to inserting the default text.

**placeholder**

Optional placeholder text for empty text in the editor. Used to visualize the text type on empty lines. Only useful for text plugins.

**events.onNormalizeNode**

Optional function for adding normalization. See [Slate Normalizing](https://docs.slatejs.org/concepts/11-normalizing) for details.

```javascript
type NormalizeFunction = (editor: Editor, entry: NodeEntry) => void
type Normalizer = {
    name: string
    class?: string
    normalize: NormalizeFunction
}
```

**actions**

An array of action functions. Can optionally specify tools (JSX component rendered in a various toolbars depending on specified plugin class), OS independend hotkey (keyboard shortcut) definition defined as `mod+i` for either `CTRL+i` or `CMD+í` and a title/text helper.

If the handler returns true the editor defaults to Slate default actions if exists. Right now used for e.g bold, italic.


**components**

Array of JSX components that can be rendered in the editable area. The *type* property is used to match a Slate custom element type to know which element should be rendered.

The default component for the plugin must not have a specified type. The type is in that case inherited from the plugin name.

If the default component have sub components they should have a type specified. The type will be appended to the default component type. Example:

```javascript
const OembedVideo: MimerPlugin = {
    class: 'block',
    name: 'core/oembed',
    consumer: {
        consumes,
        consume
    },
    events: {
        onNormalizeNode
    },
    component: {
        render,
        children: [
            {
                type: 'embed',
                class: 'void',
                render: renderVideo
            },
            {
                type: 'title',
                render: renderTitle
            }
        ]
    }
}
```

The above will result in three component types. The default component will be typed as `core/oembed` and correspond to a custom element also typed the same. The two other will internally be typed as `core/oembed/embed` and `core/oembed/title`.

## Plugin classes

Elephant-slate introduces a concept of plugins of different classes. Some relate to Slate node types (leaf, etc) and some are composites or not nodes at all. These all accomodate different ways of handling content in various ways.

### Leaf

Leafs inside text or text block elements. Examples are bold, italic. Carries no more data. Also called annotations in other systems.

*Right now only one leaf plugin for multiple types.*

Example `src/components/editor/standardPlugins/leaf/leaf.tsx`

### Inline

Similar to leaf inside text or text block elements. Can carry additional data and UI.

Example `src/components/editor/standardPlugins/inline/link`

### Text

Simple text nodes like *paragraph*, *title* etc.

Example `src/components/editor/standardPlugins/text/paragraph`

### Textblock

Similar to a text node but can contain child text nodes. This is used in the blockquote to allow "multiple input fields" without the drawbacks of using void nodes where the user can not naturally move in and out between different input fields using the the keyboard only. Does not support drag'n drop.

Example `src/components/editor/standardPlugins/textblock/blockquote`

### Block

A standard block element (or object) which can include both void and text child nodes. This is a selectable content object which support drag'n drop. Used for example to support _image_ or _oembed_.

Example `src/components/editor/standardPlugins/block/image`

### Void

Standalone void node type that has no editable properties. Editor does not handle anything inside it. Right now this is only used as a temporary content node visualising uploading an image. When done this node is replaced by the image block node.

Example `src/components/editor/standardPlugins/void/loader`

A specific block element that have no editable properties 

### Generic

So far the only plugin type not rendered in the editable area. Used for quote handling, navigation etc.

Example `src/components/editor/standardPlugins/generic/quotes.tsx`

## Elements

Element and Text interfaces have both been extended from Slate original BaseElement and BaseText interfaces.

```javascript
declare module 'slate' {
    interface CustomTypes {
        Editor: BaseEditor & ReactEditor & HistoryEditor
        Element: BaseElement & {
            id?: string
            class?: string
            type: string
            hotKey?: string
            properties?: {
                [key: string]: string | number
            }
            attributes?: {
                [key: string]: string | number
            }
        }
        Text: BaseText & {
            text: string
            formats?: string[]
            placeholder?: string
        }
    }
}
```

An example `core/image` Element node based would then look like below.

```javascript
const Image: MimerPlugin = {
    class: 'block',
    name: 'core/image',
    consumer: {
        consumes,
        consume
    },
    actions: [
        {
            title: 'Image',
            tool: <BsImage />,
            handler: actionHandler
        }
    ],
    events: {
        onNormalizeNode
    },
    component: {
        render,
        children: [
            {
                type: 'image',
                class: 'void',
                render: renderImage
            },
            {
                type: 'altText',
                render: renderAltText
            },
            {
                type: 'text',
                render: renderText
            }
        ]
    }
}
```

An example `core/heading-1` Text node would in turn look like below.

```javascript
const Title: MimerPlugin = {
    class: 'text',
    name: 'core/heading-1',
    component: {
        render,
        placeholder: 'Title',
    },
    actions: [
        {
            title: 'Title',
            tool: <MdTitle />,
            hotkey: 'mod+1',
            handler: ({ editor }) => {
                convertToText(editor, 'core/heading-1')
            }
        }
    ],
}
```

A more full example of paragraph Text node with bold and italic leafs.

```javascript
{
    type: 'core/paragraph',
    id: '538345e5-bacc-48f9-8ef0-1219891b60ef',
    class: 'text',
    children: [
        { text: 'An example paragraph that contains text that is a wee bit ' },
        { text: 'stronger', formats: ['bold'] },
        { text: ' than normal but also text that is somewhat ' },
        { text: 'emphasized', formats: ['italic'] },
        { text: ' compared to the normal styled text found elsewhere in the document.' },
    ],
}
```

## Typescript

All Slate types are defined in `src/types.ts`

All Elephant/Mimer types are defined in `src/components/editor/types.ts`

## Registry

This is where everything is stored when a plugin is registered.
`src/components/editor/registry.ts`