import './assets/app.css'
import './assets/contextmenu.css'
import './assets/contexttools.css'
import './assets/toolmenu.css'

import { ContextMenu, Menu, Textbit, Toolbar, useContextMenuHints, usePluginRegistry, useTextbit } from '../lib/main'
import { document } from './assets/document'
import { useEffect, useMemo, useRef, useState } from 'react'
import * as Y from 'yjs'
import { Awareness } from 'y-protocols/awareness'
import { slateNodesToInsertDelta } from '@slate-yjs/core'
import { spellChecker } from './spellChecker'

export function App() {

  const headerStyle = {
    fontSize: '12px',
    lineHeight: '24px',
    fontFamily: 'sans-serif',
    paddingLeft: '5px'
  }

  const editorStyle = {
    border: '1px solid #ddd',
    padding: '10px',
    margin: 0,
    borderRadius: '5px',
    fontSize: '16px',
    lineHeight: '1.5',
    maxHeight: '175px',
    overflow: 'scroll',
    backgroundColor: '#fff'
  }

  return (
    <div style={{
      margin: '0 auto',
      padding: '20px',
      maxWidth: '800px',
      display: 'flex',
      flexDirection: 'column',
      gap: '20px'
    }}
    >

      <TextbitFormatEditor style={editorStyle} headerStyle={headerStyle} />

      <TextbitFormatEditor style={editorStyle} headerStyle={headerStyle} readOnly />

      <TextEditor style={editorStyle} headerStyle={headerStyle} />

      <YjsEditor style={editorStyle} headerStyle={headerStyle} />
    </div >
  )
}

/**
 * Textbit (slate extended) format editor
 */
function TextbitFormatEditor({ style, headerStyle, readOnly }: {
  style: React.CSSProperties
  headerStyle: React.CSSProperties
  readOnly?: boolean
}) {
  const [value, setValue] = useState(document)

  return (
    <Textbit.Root
      verbose={true}
      debounce={200}
      readOnly={readOnly}
      value={value}
      onChange={() => {
        if (readOnly) {
          // This should not happen if readOnly = true
          console.error('Readonly editor should not change or even warn!')
          return
        }

        setValue(value)
      }}
      onSpellcheck={(texts) => {
        return new Promise((resolve) => {
          // Fake asyn response from an external spellchecker service
          setTimeout(() => {
            resolve(texts.map((text) => spellChecker(text.text, text.lang)))
          }, 100)
        })
      }}
    >
      <strong style={headerStyle}>Multi line - {readOnly ? 'read-only' : 'editable'}</strong>

      <div style={{display: 'grid', gridTemplateColumns: '50px 1fr'}}>
        <div style={{overflow: 'hidden'}}>
          <ContentMenu />
        </div>

        <Textbit.Editable
          style={{
            ...style,
            backgroundColor: readOnly ? '#eee' : '#fff'
          }}
        >
          <Textbit.DropMarker />
          <ContextTools/>
          <EditorSpellingContextmenu />
        </Textbit.Editable>
      </div>

      <EditorFooter />
    </Textbit.Root>
  )
}

/**
 * Text editor
 */
function TextEditor({ style, headerStyle }: {
  style: React.CSSProperties
  headerStyle: React.CSSProperties
}) {
  const [value, setValue] = useState('This is some text')

  return (
    <Textbit.Root
      verbose={true}
      debounce={200}
      value={value}
      onChange={setValue}
      onSpellcheck={(texts) => {
        return new Promise((resolve) => {
          // Fake async response from an external spellchecker service
          setTimeout(() => {
            resolve(texts.map((text) => spellChecker(text.text, text.lang)))
          }, 100)
        })
      }}
    >
      <strong style={headerStyle}>Text/string based editor - with placeholder</strong>

      <div style={{display: 'grid', gridTemplateColumns: '50px 1fr'}}>
        <div>
          <ContentMenu />
        </div>

        <Textbit.Editable
          placeholder='Type text here...'
          style={style}
        >
          <Textbit.DropMarker />
          <ContextTools/>
          <EditorSpellingContextmenu />
        </Textbit.Editable>
      </div>

      <EditorFooter />
    </Textbit.Root>
  )
}


/**
 * YJS Editor
 */
function YjsEditor({ style, headerStyle }: {
  style: React.CSSProperties
  headerStyle: React.CSSProperties
}) {
  const doc = useMemo(() => new Y.Doc(), [])
  const value = useMemo(() => doc.get('content', Y.XmlText), [doc])
  const awareness = useMemo(() => new Awareness(doc), [doc])
  const ref = useRef(false)

  useEffect(() => {
    if (!ref.current) {
      ref.current = true
      value.applyDelta(slateNodesToInsertDelta(document))
    }
  }, [value])

  return (
    <Textbit.Root
      verbose={true}
      debounce={200}
      value={value}
      onSpellcheck={(texts) => {
        return new Promise((resolve) => {
          // Fake async response from an external spellchecker service
          setTimeout(() => {
            resolve(texts.map((text) => spellChecker(text.text, text.lang)))
          }, 100)
        })
      }}
      awareness={awareness}
      cursor={{
        data: {
          name: 'Ragnhild',
          color: '#FF6B6B'
        }
      }}
    >

      <strong style={headerStyle}>Yjs editor</strong>

      <div style={{display: 'grid', gridTemplateColumns: '50px 1fr'}}>
        <div>
          <ContentMenu />
        </div>

          <Textbit.Editable style={style}>
            <ContextTools/>
            <Textbit.DropMarker />
            <EditorSpellingContextmenu />
          </Textbit.Editable>
      </div>

      <EditorFooter />
    </Textbit.Root>
  )
}

/**
 * Footer with stats
 */
function EditorFooter() {
  const { stats } = useTextbit()

  return (
    <div style={{
      fontWeight: 'semibold',
      fontFamily: 'sans-serif',
      padding: '5px',
      fontSize: '11px',
      textTransform: 'uppercase',
      opacity: 0.5,
      textAlign: 'right'
    }}>
      <div>
        Words: {stats.full.words}, Characters: {stats.full.characters}
      </div>
    </div>
  )
}

/**
 * Content menu
 */
function ContentMenu() {
  const { actions } = usePluginRegistry()

  return (
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
  )
}

/**
 * Context tools (bold, italic, et al)
 */
function ContextTools() {
  const { actions } = usePluginRegistry()

  return (
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
  )
}

/**
 * Context menu on spellchecked words
 */
function EditorSpellingContextmenu() {
  const { spelling } = useContextMenuHints()

  return (
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
  )
}
