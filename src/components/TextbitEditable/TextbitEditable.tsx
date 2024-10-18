import React, { // Necessary for esbuild
  PropsWithChildren,
  useMemo,
  useCallback,
  useState,
  useRef
} from 'react'
import { createEditor, Editor as SlateEditor, Descendant, BaseEditor, Editor, NodeEntry, Node, Text } from "slate"
import { HistoryEditor, withHistory } from "slate-history"
import { ReactEditor, RenderElementProps, RenderLeafProps, withReact } from "slate-react"
import { YHistoryEditor } from '@slate-yjs/core'

import { DragStateProvider } from './DragStateProvider'
import { withInline } from './with/inline'

import { ElementComponent } from './components/Element'
import { Leaf } from './components/Leaf'
import { withInsertText } from './with/insertText'
import { withNormalizeNode } from './with/normalizeNode'
import { withEditableVoids } from './with/editableVoids'
import { withInsertBreak } from './with/insertBreak'
import { withInsertHtml } from './with/insertHtml'
import { PresenceOverlay } from './components/PresenceOverlay/PresenceOverlay'
import { useTextbit } from '../TextbitRoot'
import { usePluginRegistry } from '../PluginRegistry'
import { PositionProvider } from '../ContextTools/PositionProvider'
import { Gutter } from '../GutterProvider'
import { SlateEditable } from './components/Slate/SlateEditable'
import { SlateSlate } from './components/Slate/SlateSlate'
import { withUniqueIds } from './with/uniqueIds'
import { getTextNodesInTopAncestor } from '@/lib/utils'
import { TBElement, TBText } from '@/types'
import { debounce } from '@/lib/debounce'
import { calculateStats, TextbitElement } from '@/lib'

export interface TextbitEditableProps extends PropsWithChildren {
  onChange?: (value: Descendant[]) => void
  onSpellcheck?: (texts: string[]) => Array<{
    str: string,
    pos: number,
    sub: string[]
  }[]>
  value?: Descendant[]
  yjsEditor?: Editor
  gutter?: boolean
  dir?: 'ltr' | 'rtl'
  className?: string
}

export const TextbitEditable = ({
  children,
  value,
  onChange,
  onSpellcheck,
  yjsEditor,
  gutter = true,
  dir = 'ltr',
  className = ''
}: TextbitEditableProps) => {
  const { plugins, components, actions } = usePluginRegistry()
  const { autoFocus, onBlur, onFocus } = useTextbit()
  const { dispatch, debounce: debounceTimeout, spellcheckDebounce: spellcheckDebounceTimeout } = useTextbit()
  const spellcheckTable = useRef<Map<string, {
    id: string,
    path: number[]
    textNodes?: NodeEntry<Descendant>[],
    text: string,
    ranges: Range[]
  }>>(new Map())

  const textbitEditor = useMemo<BaseEditor & ReactEditor & HistoryEditor>(() => {
    const e = SlateEditor.isEditor(yjsEditor) ? yjsEditor : createEditor()

    if (!YHistoryEditor.isYHistoryEditor(e)) {
      withHistory(e)
    }
    withReact(e)

    withInline(e)
    withInsertText(e, plugins)
    withNormalizeNode(e, plugins, components)

    withEditableVoids(e, components)
    withInsertBreak(e, components)
    withInsertHtml(e, components, plugins)
    withUniqueIds(e)
    return e
  }, [])


  const renderSlateElement = useCallback((props: RenderElementProps) => {
    return ElementComponent(props)

  }, [])

  const renderLeafComponent = useCallback((props: RenderLeafProps) => {
    return Leaf(props)
  }, [])

  // Debounce onChange handler
  const onChangeCallback = useCallback(
    debounce((value: Descendant[]) => {
      if (onChange) {
        onChange(value)
      }

      const [words, characters] = calculateStats(textbitEditor)
      dispatch({ words, characters })
    }, debounceTimeout),
    [textbitEditor, onChange, debounceTimeout]
  )

  //
  // Debounce onSpellcheck handler
  //
  // TODO: Refactor logic to its own file and make it asynchnonous!
  //
  const onSpellcheckCallback = useCallback(
    debounce(() => {
      if (!onSpellcheck || !spellcheckTable) {
        return
      }

      // Find all nodes that need spellchecking
      const tracker = new Map()
      let path = 0
      for (const child of textbitEditor.children) {
        if (TextbitElement.isElement(child) && child.id) {
          const childId = child.id
          const text = Node.string(child)
          const entry = spellcheckTable.current.get(child.id)

          if (!spellcheckTable.current.has(childId)) {
            // Add the new element (without ranges to trigger spellchecking)
            tracker.set(childId, {
              path: [path],
              text,
              textNodes: Array.from(Node.descendants(child, { pass: ([n]) => Text.isText(n) }))
            })
          }
          else if (entry && text !== entry?.text) {
            // Readd changed element (without ranges to trigger spellchecking)
            tracker.set(childId, {
              path: [path],
              text,
              textNodes: Array.from(Node.descendants(child, { pass: ([n]) => Text.isText(n) }))
            })
          }
          else {
            // Add the unchanged previous entry, but update the path
            tracker.set(childId, { ...entry, path: [path] })
          }
        }

        path++
      }

      // Send all changed or added strings to spellcheck in one call
      const result = onSpellcheck(
        Array.from(tracker.values())
          .filter(entry => !entry.ranges)
          .map(entry => entry.text)
      )

      // Add ranges for the spelling mistakes
      let i = 0
      tracker.forEach(entry => {
        if (!entry.ranges) {
          entry.ranges = []

          for (const spellingError of result[i]) {
            entry.ranges.push({
              anchor: {
                path: [i],
                offset: spellingError.pos
              },
              focus: {
                path: [i],
                offset: spellingError.pos + spellingError.str.length
              },
              misspelled: true,
              sub: spellingError.sub
            })
          }

          i++
        }
      })

      // TODO: Remove console.log
      console.log(tracker)
      spellcheckTable.current = tracker

      //
      // TODO: Forward data in spellcheckTable.current to decorate in SlateEditable
      //
    }, spellcheckDebounceTimeout),
    [textbitEditor, onSpellcheck, spellcheckDebounceTimeout]
  )

  return (
    <DragStateProvider>
      <SlateSlate editor={textbitEditor} value={value} onChange={onChangeCallback} onSpellcheck={onSpellcheckCallback}>
        <PositionProvider inline={true}>
          <Gutter.Provider dir={dir} gutter={gutter}>

            <Gutter.Content>
              <PresenceOverlay isCollaborative={!!yjsEditor}>
                <SlateEditable
                  className={className}
                  autoFocus={autoFocus}
                  onBlur={onBlur}
                  onFocus={onFocus}
                  renderSlateElement={renderSlateElement}
                  renderLeafComponent={renderLeafComponent}
                  textbitEditor={textbitEditor}
                  actions={actions}
                  components={components}
                />
              </PresenceOverlay>
            </Gutter.Content>

            {children}

          </Gutter.Provider>
        </PositionProvider>
      </SlateSlate>
    </DragStateProvider >
  )
}
