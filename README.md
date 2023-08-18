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
            hooks={[{
                on: 'receive',
                for: ['image'],
                handler: async (files) => {
                    try {
                        const response = await uploadImages(files as any)
                        const images: any[] = []
                        for (let n = 0; n < response.length; n++) {
                            images.push({
                                type: response[n].type,
                                src: response[n].src,
                                title: response[n].title,
                                size: 0,
                                width: response[n].width,
                                height: response[n].height
                            })
                        }
                        return images
                    }
                    catch (ex: any) {
                        alert(ex.message)
                        throw (ex)
                    }
                }
            }]}
        />
    )
}
```

## Plugins

Plugins does not really exist yet. These are hard coded into the src and can be found in `src/components/editor/standardPlugins` sub directories depending on the type of plugin it is (see below for type of plugins).


### How to define a "plugin"

Plugins are defined using the interface below. (See `src/types.ts` for all the types.)

```javascript
type MimerPlugin = {
    class: MimerPluginClass
    name: string
    placeholder?: string
    normalize?: NormalizeFunction
    actions?: Array<{
        tool?: JSX.Element | Array<JSX.Element | ToolFunction>
        hotkey?: string
        title?: string
        handler: ActionFunction
    }>
    events?: Array<{
        on: MimerEventTypes,
        handler: InputEventFunction | DropEventFunction | FileInputEventFunction,
        match?: EventMatchFunction
    }>
    components?: Array<{
        type?: string
        class?: string
        render: RenderFunction
    }>
    style?: React.CSSProperties
}
```

**class** 

Plugin class (see below for more details on the plugin classes).

```javascript
type MimerPluginClass = 'leaf' | 'inline' | 'text' | 'textblock' | 'block' | 'void' | 'generic'
```

**name**

Name of plugin. Used to derive default component type names. I.e a plugin named *core/heading-1* having a slate rendered component with no specifed type will inherit the plugin name as the component type.

**placeholder**

Optional placeholder text for empty text in the editor. Used to visualize the text type on empty lines. Only useful for text plugins.

**normalize**

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

**events**

List of event handlers.

Supported events
```javascript
type MimerEventTypes = 'input' | 'drop' | 'fileinput'
```

The *match* function gives the ability to investigate whether a plugin wants to react to an event. If this returns `true` the handler is called and no more plugins will be asked.

```javascript
type EventMatchFunction = (event: React.DragEvent | React.ChangeEvent) => boolean
```

**components**

Array of JSX components that can be rendered in the editable area. The *type* property is used to match a Slate custom element type to know which element should be rendered.

The default component for the plugin must not have a specified type. The type is in that case inherited from the plugin name.

If the default component have sub components they should have a type specified. The type will be appended to the default component type. Example:

```javascript
OembedVideo: MimerPlugin = {
    class: 'block',
    name: 'core/oembed',
    components: [
        {
            render
        },
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
        Editor: ReactEditor
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
{
    id: '11E7342C-772C-4027-81B5-1972DF8B0BA0',
    class: 'block',
    type: 'core/image',
    properties: {
        type: 'image/jpg',
        src: 'https:/...',
        size: '512023',
        width: '2048',
        height: '1365'
    },
    children: [
        {
            type: 'core/image/image',
            children: [{ text: '' }]
        },
        {
            type: 'core/image/altText',
            children: [{ text: object.src }]
        },
        {
            type: 'core/image/text',
            children: [{ text: '' }]
        }
    ]
}
```

An example `core/heading-1` Text node would in turn look like below.

```javascript
{
    type: 'core/heading-1',
    id: '538345e5-bacc-48f9-8ef1-a219891b60eb',
    class: 'text',
    children: [
        { text: 'Better music?' }
    ]
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
All types are defined in `src/types.ts`


## Registry

This is where everything is stored when a plugin is registered.
`src/components/editor/registry.ts`