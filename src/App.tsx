import { useState } from 'react'
import { Descendant } from 'slate'

import Textbit, {
  Menu,
  Toolbar,
  usePluginRegistry,
  useTextbit,
  ContextMenu,
  useContextMenuHints,
  SpellingError
} from '../lib'

import {
  BulletList,
  NumberList,
  Link,
  CodeBlock
} from './plugins'

import './editor-variables.css'
import './toolmenu.css'
import './toolbox.css'
import './spelling.css'
import './contextmenu.css'
import './app.css'

const initialValue: Descendant[] = [
  {
    type: 'core/text',
    id: '538345e5-bacc-48f9-8ef1-a219891b6011',
    class: 'text',
    properties: {
      type: 'h1'
    },
    children: [
      { text: 'Kalmar Sweden' }
    ]
  },
  {
    type: 'core/text',
    id: '538345e5-bacc-48f9-8ef0-1219891b6034',
    class: 'text',
    properties: {
      type: 'h1'
    },
    children: [
      { text: '' }
    ]
  },
  {
    type: 'core/text',
    id: '538345e5-bacc-48f9-8ef0-1219891b6024',
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
      { text: ' compared to the normal styled text found elsewhere in the document.' }
    ]
  },
  {
    type: 'core/text',
    id: '538345e5-bacc-48f9-8ef0-1219891b6014',
    class: 'text',
    children: [
      { text: '' }
    ]
  },
  {
    type: 'core/codeblock',
    id: '538345e5-aad1-58f9-8ef0-b2198a1a60a2',
    class: 'block',
    children: [
      {
        type: 'core/codeblock/title',
        class: 'text',
        children: [{ text: 'Title' }]
      },
      {
        type: 'core/codeblock/body',
        class: 'text',
        children: [{ text: 'Body' }]
      }
    ]
  },
  {
    type: 'core/text',
    id: '538343b5-badd-48f9-8ef0-1219891b6061',
    class: 'text',
    properties: {
      lang: 'sv-se'
    },
    children: [
      { text: 'Här följer text som är på svenska och följaktligen bör stavningskollas på svenska. ' },
      {
        text: 'Stavningskontrollen fungerar '
      },
      {
        text: 'korrrekt',
        'core/italic': true
      },
      { text: ' på flera språk.' }
    ]
  },
  {
    type: 'core/text',
    id: '538343b5-badd-48f9-8ef0-1219891b6066',
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
      { text: ' compared to the normal styled text found else where in the document.' }
    ]
  },
  {
    type: 'core/text',
    id: '538345e5-bacc-48f9-8ef0-1219891b6041',
    class: 'text',
    children: [
      { text: '' }
    ]
  }
]

export function App() {
  return (
    <div style={{
      margin: '0 auto',
      maxWidth: '800px',
      display: 'flex',
      flexDirection: 'column'
    }}
    >
      <div style={{ margin: '20px 0', border: '1px solid gray', padding: '5px' }}>
        <Textbit.Root
          verbose={true}
          autoFocus={true}
          debounce={200}
          plugins={[]}
          placeholder='Add text here...'
        >
          <strong>No menu, with single placeholder</strong>
          <Textbit.Editable value={[{
            type: 'core/text',
            id: '0',
            class: 'text',
            children: [{
              text: ''
            }]
          }]}
          />
        </Textbit.Root>
      </div>


      <div style={{ margin: '20px 0', border: '1px solid gray' }}>
        <Textbit.Root
          verbose={true}
          placeholders='multiple'
          plugins={[
            ...Textbit.Plugins.map((p) => p()),
            BulletList({
              listStyle: 'circle'
            }),
            NumberList(),
            Link({
              option1: true // Example option
            }),
            CodeBlock()
          ]}
        >
          <strong>Multiple placeholders</strong>
          <Editor initialValue={initialValue} />
        </Textbit.Root>
      </div>


      <div style={{ margin: '20px 0', border: '1px solid gray' }}>
        <Textbit.Root
          verbose={true}
          debounce={1000}
          plugins={[...Textbit.Plugins.map((p) => p())]}
        >
          <strong>Long debounce</strong>
          <Editor initialValue={initialValue} />
        </Textbit.Root>
      </div>
    </div>
  )
}


type SpellcheckedText = SpellingError[]

function fakeSpellChecker(text: string, lang: string): SpellcheckedText {
  const result: SpellcheckedText = []

  const svSuggestions: Record<string, Suggestion[]> = {
    korrrekt: [
      { text: 'korrekt' },
      { text: 'korrektur' }
    ]
  }

  const enSuggestions: Record<string, Suggestion[]> = {
    wee: [
      { text: 'we', description: 'Alternative single word' },
      { text: 'teeny', description: 'Alternative single word' },
      { text: 'weeny', description: 'Alternative single word' },
      { text: 'a little', description: 'Alternative phrase for "wee bit"' }
    ],
    emphasized: [
      { text: 'emphasised', description: 'UK vs US spelling' }
    ],
    'else where': [
      { text: 'elsewhere', description: 'One word instead of two' }
    ]
  }

  // Choose suggestions dict based on lang
  const suggestions = (lang.startsWith('sv')) ? svSuggestions : enSuggestions

  for (const misspelled of Object.keys(suggestions)) {
    if (text.toLowerCase().includes(misspelled.toLowerCase())) {
      result.push({
        id: '',
        text: misspelled,
        suggestions: suggestions[misspelled]
      })
    }
  }

  return result
}

interface Suggestion {
  text: string
  description?: string
}

function Editor({ initialValue }: { initialValue: Descendant[] }) {
  const [value, setValue] = useState<Descendant[]>(initialValue)
  const { characters } = useTextbit()
  const { actions } = usePluginRegistry()
  const { spelling } = useContextMenuHints()

  return (
    <>
      <div style={{ lineHeight: '47px', marginLeft: '3.25rem' }}>
        Characters:
        {' '}
        {characters}
      </div>

      <div tabIndex={-1} style={{ flex: '1', display: 'flex', flexDirection: 'column', maxHeight: '250px', overflow: 'scroll' }}>
        <Textbit.Editable
          value={value}
          onChange={(value) => {
            console.log(value)
            setValue(value)
          }}
          onSpellcheck={(texts) => {
            return new Promise((resolve) => {
              setTimeout(() => {
                resolve(texts.map((text) => fakeSpellChecker(text.text, text.lang)))
              }, 100)
            })
          }}
        >
          <Textbit.DropMarker />

          <Textbit.Gutter className='textbit-contenttools-gutter'>
            <Menu.Root className='textbit-contenttools-menu'>

              <Menu.Trigger className='textbit-contenttools-trigger'>⋮</Menu.Trigger>
              <Menu.Content className='textbit-contenttools-popover'>
                <Menu.Group className='textbit-contenttools-group'>
                  {actions.filter((action) => !['leaf', 'generic', 'inline'].includes(action.plugin.class)).map((action) => {
                    return (
                      <Menu.Item
                        className='textbit-contenttools-item'
                        key={action.name}
                        action={action.name}
                      >
                        <Menu.Icon className='textbit-contenttools-icon' />
                        <Menu.Label className='textbit-contenttools-label' />
                        <Menu.Hotkey className='textbit-contenttools-hotkey' />
                      </Menu.Item>
                    )
                  })}
                </Menu.Group>
              </Menu.Content>
            </Menu.Root>
          </Textbit.Gutter>

          {!!spelling && (
            <ContextMenu.Root className='textbit-contextmenu'>
              <ContextMenu.Group className='textbit-contextmenu-group' key='spelling-suggestions'>
                {spelling?.suggestions.length === 0 && (
                  <ContextMenu.Item className='textbit-contextmenu-item'>
                    No spelling suggestions
                  </ContextMenu.Item>
                )}

                {spelling?.suggestions.map((suggestion) => {
                  const { text, description } = suggestion

                  return (
                    <ContextMenu.Item
                      className='textbit-contextmenu-item'
                      key={text}
                      func={() => {
                        spelling.apply(text)
                      }}
                    >
                      {text}
                      {' '}
                      -
                      {' '}
                      <em>{description}</em>
                    </ContextMenu.Item>
                  )
                })}
              </ContextMenu.Group>
            </ContextMenu.Root>
          )}
          <Toolbar.Root className='textbit-contexttools-menu'>
            <Toolbar.Group key='leafs' className='textbit-contexttools-group'>
              {actions.filter((action) => ['leaf'].includes(action.plugin.class)).map((action) => {
                return (
                  <Toolbar.Item
                    className='textbit-contexttools-item'
                    action={action}
                    key={action.name}
                  />
                )
              })}
            </Toolbar.Group>
            <Toolbar.Group key='inlines' className='textbit-contexttools-group'>
              {actions.filter((action) => ['inline'].includes(action.plugin.class)).map((action) => {
                return (
                  <Toolbar.Item
                    className='textbit-contexttools-item'
                    action={action}
                    key={action.name}
                  />
                )
              })}
            </Toolbar.Group>
          </Toolbar.Root>

        </Textbit.Editable>
      </div>
    </>
  )
}
