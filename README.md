# Textbit editable

## Description

An editable component based on Slate for embedding into react applications. See [Slate documentation](https://docs.slatejs.org/) for more information on Slate.

## Development

### Installation and local usage
`npm i`
`npm run start`

### Building ESM and CJS
`npm run build`

This will product both an ESM and CJS modules in as well as a typescript definition (_index.d.ts_) file in `dist/`.

## Structure

### Types and other exports

All exported types are prefixed with _`TB`_ to distinguish types from core Slate types. Examples are `TBElement`, `TBText` and `TBDescendant`.

Objects, functions and components use full _`Textbit`_ name as prefix. The actual editable component is called `TextbitEditable`. Utility functions and type narrowing functions are found in `TextbitEditor` which inherits from Slate `Editor` and `TextbitElement` which inherits from Slate `Element`.

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


```jsx
import {
  TextbitEditable,
  type TBDescendant
} from '@ttab/textbit'

import '@ttapp/textbit/dist/esm/index.css'

import { uploadImages } from './images'
import {
  Image,
  List
} from './plugins'

const initialValue: TBDescendant[] = [
    {
        type: 'core/text',
        id: '538345e5-bacc-48f9-8ef1-a219891b60eb',
        class: 'text',
        {
            properties: {
                type: 'h1'
            }
        },
        children: [
            { text: 'Better music?' }
        ]
    },
    {
        type: 'core/text',
        id: '538345e5-bacc-48f9-9ed2-b219892b51dc',
        class: 'text',
        children: [
            { text: 'It is one of those days when better music makes all the difference in the world. At least to me, my inner and imaginary friend.' }
        ]
    }
]

const [value, setValue] = useState<TBDescendant[]>(initialValue)

function App() {
    return (
        <TextbitEditable
            value={value}
            plugins={[
              Image,
              List
            ]}
            onChange={(value) => onChangeImpl(setValue, value)}
        />
    )
}
```

## Plugins

Plugins can be provided as an array of Plugins.


### How to define a "plugin"

Plugins are defined by the interface `TBplugin`. See type definitions for all types used by this interface.

```javascript
export interface TBPlugin {
  class: 'leaf' | 'inline' | 'text' | 'textblock' | 'block' | 'void' | 'generic'
  name: string
  consumer?: {
    consumes: TBConsumesFunction  // Can you consume [data], [true/false, provides `type` as response]
    consume: TBConsumeFunction // Consume [data] please
  }
  events?: {
    onInsertText?: (editor: Editor, text: string) => true | void
    onNormalizeNode?: (editor: Editor, entry: NodeEntry) => true | void
  }
  actions?: Array<{
    tool?: JSX.Element | Array<JSX.Element | TBToolFunction>
    hotkey?: string
    title?: string
    description?: string
    handler: (props: TBActionHandlerProps) => boolean | void
    visibility?: (element: Element, rootElement?: Element) => [boolean, boolean, boolean] // visible, enabled, active
  }>
  component?: TBComponent
}
```

**class**

Defines generics for a class. See below for more details on the plugin classes.

**name**

Name of plugin. Used to derive default component _type_. I.e a plugin named *core/heading-1* having a slate rendered component with no specifed _type_ will inherit the plugin name as the component type.

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

Optional function for adding custom normalization. See [Slate Normalizing](https://docs.slatejs.org/concepts/11-normalizing) for details.

**actions**

An array of action functions. Can optionally specify tools (JSX component rendered in a various toolbars depending on specified plugin class), OS independend hotkey (keyboard shortcut) definition defined as `mod+i` for either `CTRL+i` or `CMD+í` and a title/text helper.

If the handler returns true the editor defaults to Slate default actions if exists. Right now used for e.g bold, italic.


**components**

Array of JSX components that can be rendered in the editable area. The *type* property is used to match a Slate custom element type to know which element should be rendered.

The default component for the plugin must not have a specified type. The type is in that case inherited from the plugin name.

If the default component have sub components they should have a type specified. The type will be appended to the default component type. Examples:

```javascript
const OembedVideo: TBPlugin = {
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
                class: 'text',
                render: renderTitle
            }
        ]
    }
}
```

The above will result in three component types. The default component will be typed as `core/oembed` and correspond to a custom element also typed the same. The two other will internally be typed as `core/oembed/embed` and `core/oembed/title`.

```javascript
const Image: TBPlugin = {
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
                class: 'text',
                render: renderAltText
            },
            {
                type: 'text',
                class: 'text',
                render: renderText
            }
        ]
    }
}
```

## Plugin classes

Textbit introduces a concept of plugins of different classes. Some relate to Slate node types (leaf, etc) and some are composites or not nodes at all. These all accomodate different ways of handling content in various ways.

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
export interface TBElement extends BaseElement {
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

export interface TBText extends BaseText {
  text: string
  placeholder?: string
  [key: string]: boolean | string | undefined
}

export type TBDescendant = TBElement | TBText

/** Slate module extensions */
declare module 'slate' {
  interface CustomTypes {
    Editor: BaseEditor & ReactEditor & HistoryEditor
    Element: TBElement
    Text: TBText
  }
}
```

An example `core/image` Element node based could then look like below.

```javascript
{
    id: '538345e5-bacc-48f9-8ef0-1219891b60ef',
    class: 'block',
    type: 'core/image',
    properties: {
        type: 'image/jpeg',
        src: 'https://...',
        title: 'myimage.jpg',
        size: 237005,
        width: 800,
        height: 600
    },
    children: [
        {
            type: 'core/image/image',
            children: [{ text: '' }]
        },
        {
            type: 'core/image/altText',
            children: [{ text: name }]
        },
        {
            type: 'core/image/text',
            children: [{ text: '' }]
        }
    ]
}
```


An example of paragraph Text node with bold and italic leafs. (_Note that paragraphs, or body text, has no properties_.)

```javascript
{
    id: '538345e5-bacc-48f9-8ef0-1219891b60ef',
    class: 'text',
    type: 'core/text',
    children: [
        { text: 'An example paragraph that contains text that is a wee bit ' },
        { text: 'stronger', formats: ['bold'] },
        { text: ' than normal but also text that is somewhat ' },
        { text: 'emphasized', formats: ['italic'] },
        { text: ' compared to the normal styled text found elsewhere in the document.' },
    ],
}
```
