import React, { useState } from 'react'
import { createRoot } from 'react-dom/client'
import { TBDescendant, TextbitEditable } from '../../src'
import { ThemeSwitcher } from './themeSwitcher'

const initialValue: TBDescendant[] = [
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
  },
  {
    type: 'core/text',
    id: '538345e5-bacc-48f9-9ed2-b219892b51dc',
    class: 'text',
    properties: {
      type: 'preamble'
    },
    children: [
      { text: 'It is one of those days when better music makes all the difference in the world. At least to me, my inner and imaginary friend.' }
    ]
  },
  {
    type: 'core/text',
    id: '538345e5-cadd-4558-9ed2-a219892b51dc',
    class: 'text',
    properties: {
      type: 'dateline'
    },
    children: [
      { text: 'Kalmar' }
    ]
  },
  {
    type: 'core/text',
    id: '538345e5-bacc-48f9-8ef0-1219891b60ef',
    class: 'text',
    children: [
      { text: 'An example paragraph that contains text that is a wee bit ' },
      {
        text: 'stronger',
        'core/bold': true
      },
      {
        text: ' than normal but also text that is somewhat '
      },
      {
        text: 'emphasized',
        'core/italic': true
      },
      { text: ' compared to the normal styled text found elsewhere in the document.' },
    ],
  },
  {
    type: 'core/blockquote',
    class: 'textblock',
    id: '538345e5-bacc-48f9-8ef1-1214443a32da',
    children: [
      {
        type: 'core/blockquote/body',
        class: 'text',
        children: [
          { text: 'Just a regular paragraph that contains some nonsensical writing' }
        ]
      },
      {
        type: 'core/blockquote/caption',
        class: 'text',
        children: [
          { text: 'Mr Smith' }
        ]
      }
    ]
  },
  {
    type: 'core/text',
    class: 'text',
    id: '538345e5-bacc-48f9-8ef1-1215892b61ed',
    children: [
      { text: 'This, here now is just a regular paragraph that contains some nonsensical writing written by me.' },
    ],
  },
  {
    type: 'core/text',
    id: '538343b5-badd-48f9-8ef0-1219891b60ef',
    class: 'text',
    children: [
      { text: 'An example paragraph that contains text that is a wee bit ' },
      {
        text: 'stronger',
        'core/bold': true,
        'core/italic': true
      },
      { text: ' than normal but also text that is somewhat ' },
      {
        text: 'emphasized',
        'core/italic': true
      },
      { text: ' compared to the normal styled text found elsewhere in the document.' },
    ],
  }
]

function App() {
  const [value, setValue] = useState<TBDescendant[]>(initialValue)

  return (
    <div style={{ position: 'relative', height: '1200px' }}>
      <ThemeSwitcher />

      <TextbitEditable
        value={initialValue}
        onChange={value => {
          setValue(value)
        }}
        verbose={true}
      />
    </div>
  )
}

const container = document.getElementById('app')
const root = createRoot(container!)
root.render(<App />)
