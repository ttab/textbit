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
        name: 'title',
        id: '538345e5-bacc-48f9-8ef1-a219891b60eb',
        class: 'text',
        children: [
            { text: 'Better music?' }
        ]
    },
    {
        name: 'leadin',
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

## Plugin types

Elephant-slate introduces a concept of plugins of different types. Some relate to Slate node types (leaf, etc) and some are composites or not nodes at all. These all accomodate different ways of handling content in various ways.

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


## Typescript
All types are defined in `src/types.ts`


## Registry

This is where everything is stored when a plugin is registered.
`src/components/editor/registry.ts`