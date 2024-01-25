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

Below is the minimum needed for basic usage. Clone the repo and see the directory `local/` for a more thorough example including a local list item plugin.

**MyEditor.tsx**
```javascript
import React, { useState } from 'react'
import {
  Textbit,
  TextbitEditable,
  TextbitFooter,
  type TBDescendant
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
    <Textbit>
      <TextbitEditable
        value={initialValue}
        onChange={value => {
          console.log(value, null, 2)
        }}
        verbose={true}
      />
      <TextbitFooter />
    </Textbit>
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
