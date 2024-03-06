import React, { useState } from 'react'
import { Descendant } from 'slate'
import { createRoot } from 'react-dom/client'
import Textbit, {
  Menu,
  Toolbar,
  usePluginRegistry,
  useTextbit
} from '../../src'
import { ThemeSwitcher } from './themeSwitcher'
import {
  BulletList,
  NumberList,
  Link
} from './plugins'

import './editor-variables.css'
import './toolmenu.css'
import './toolbox.css'

const initialValue: Descendant[] = [
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
  return (
    <div style={{
      margin: '0 auto',
      height: '100vh',
      maxWidth: '800px',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <div style={{ height: '50vh' }}>
        <Textbit.Root
          verbose={true}
          plugins={[...Textbit.Plugins, BulletList, NumberList, Link]}
        >
          <Editor initialValue={initialValue} />
        </Textbit.Root >
      </div>

      <div style={{ height: '50vh' }}>
        <Textbit.Root
          verbose={true}
          plugins={[...Textbit.Plugins]}
        >
          <Editor initialValue={initialValue} />
        </Textbit.Root>
      </div>
    </div >
  )
}

function Editor({ initialValue }: { initialValue: Descendant[] }) {
  const [value, setValue] = useState<Descendant[]>(initialValue)
  const { characters } = useTextbit()
  const { actions } = usePluginRegistry()

  return (
    <>
      <div style={{ height: '47px', display: 'flex', justifyItems: 'center', alignItems: 'center' }}>
        <ThemeSwitcher />
        <div>
          Characters: {characters}
        </div>
      </div>

      <div style={{ flex: '1', display: 'flex', flexDirection: 'column' }}>
        <Textbit.Editable
          value={value}
          onChange={value => {
            console.log(value, null, 2)
            setValue(value)
          }}
        >
          <Textbit.DropMarker />

          <Textbit.Gutter className="textbit-contenttools-gutter">
            <Menu.Root className="textbit-contenttools-menu">

              <Menu.Trigger className="textbit-contenttools-trigger">⋮</Menu.Trigger>
              <Menu.Content className="textbit-contenttools-popover">
                <Menu.Group className="textbit-contenttools-group">
                  {actions.filter(action => !['leaf', 'generic', 'inline'].includes(action.plugin.class)).map(action => {
                    return (
                      <Menu.Item
                        className="textbit-contenttools-item"
                        key={`${action.key}`}
                        action={action}
                      >
                        <Menu.Icon className="textbit-contenttools-icon" />
                        <Menu.Label className="textbit-contenttools-label" />
                        <Menu.Hotkey className="textbit-contenttools-hotkey" />
                      </Menu.Item>
                    )
                  })}
                </Menu.Group>
              </Menu.Content>
            </Menu.Root>
          </Textbit.Gutter>

          <Toolbar.Root className='textbit-contexttools-menu'>
            <Toolbar.Group key="leafs" className="textbit-contexttools-group">
              {actions.filter(action => ['leaf'].includes(action.plugin.class)).map(action => {
                return <Toolbar.Item
                  className="textbit-contexttools-item"
                  action={action} key={`${action.plugin.class}-${action.plugin.name}-${action.title}`}
                />
              })}
            </Toolbar.Group>
            <Toolbar.Group key="inlines" className="textbit-contexttools-group">
              {actions.filter(action => ['inline'].includes(action.plugin.class)).map(action => {
                return <Toolbar.Item
                  className="textbit-contexttools-item"
                  action={action} key={`${action.plugin.class}-${action.plugin.name}-${action.title}`}
                />
              })}
            </Toolbar.Group>
          </Toolbar.Root>

        </Textbit.Editable>
      </div>
    </>
  )
}

const container = document.getElementById('app')
const root = createRoot(container!)
root.render(<App />)
