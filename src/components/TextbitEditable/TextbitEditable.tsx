import React, { // Necessary for esbuild
  PropsWithChildren,
  useMemo,
  useCallback,
  useRef,
  useState
} from 'react'
import { createEditor, Editor as SlateEditor, Descendant, BaseEditor, Editor, NodeEntry, Node, Text, Range } from "slate"
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
import { debounce } from '@/lib/debounce'
import { calculateStats, TextbitElement } from '@/lib'
import { PluginRegistryComponent } from '../PluginRegistry/lib/types'
import { PlaceholdersVisibility } from '../TextbitRoot/TextbitContext'

export interface TextbitEditableProps extends PropsWithChildren {
  onChange?: (value: Descendant[]) => void
  onSpellcheck?: OnSpellcheckCallback
  value?: Descendant[]
  yjsEditor?: Editor
  gutter?: boolean
  dir?: 'ltr' | 'rtl'
  className?: string
}

type OnSpellcheckCallback = (texts: string[]) => Array<{
  text: string,
  offset: number,
  subs: string[]
}[]>

type SpellcheckLookupTable = Map<string, {
  text: string,
  spelling?: {
    offset: number,
    subs: string[]
    text: string
  }[]
}>

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
  const { autoFocus, onBlur, onFocus, placeholders } = useTextbit()
  const { dispatch, debounce: debounceTimeout, spellcheckDebounce: spellcheckDebounceTimeout } = useTextbit()
  const [spellcheckLookup, setSpellcheckLookup] = useState<SpellcheckLookupTable>(new Map())

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

  // Debounced onChange handler
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

  // Debounced onSpellcheck handler
  const onSpellcheckCallback = useCallback(
    debounce(() => {
      if (textbitEditor && onSpellcheck && spellcheckLookup) {
        setSpellcheckLookup(
          updateSpellcheckTable(textbitEditor, onSpellcheck, spellcheckLookup)
        )
        // spellcheckTable.current = updateSpellcheckTable(textbitEditor, onSpellcheck, spellcheckTable.current)
        // textbitEditor.onChange()
      }

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
                  onDecorate={(entry: NodeEntry) => {
                    return decorate(textbitEditor, entry, components, placeholders, spellcheckLookup)
                  }}
                  renderSlateElement={renderSlateElement}
                  renderLeafComponent={renderLeafComponent}
                  textbitEditor={textbitEditor}
                  actions={actions}
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


/**
 * Create ranges for all decorations needed
 *
 * @param editor
 * @param nodeEntry
 * @param components
 * @param placeholders
 * @param spellcheckLookupTable
 *
 * @returns Range[]
 */
function decorate(
  editor: Editor,
  nodeEntry: NodeEntry,
  components: Map<string, PluginRegistryComponent>,
  placeholders?: PlaceholdersVisibility,
  spellcheckLookupTable?: SpellcheckLookupTable
): Range[] {
  const [node, path] = nodeEntry
  const ranges: Range[] = []

  // Add ranges from spellchecking
  if (spellcheckLookupTable?.size && Text.isText(node)) {
    const [topNode] = Editor.node(editor, [path[0]])

    if (TextbitElement.isElement(topNode) && topNode.id) {
      const spellcheck = spellcheckLookupTable.get(topNode.id)

      if (spellcheck?.spelling) {
        const text = node.text

        spellcheck.spelling.forEach(item => {
          const indices = [...text.matchAll(new RegExp(`\\b${item.text}\\b`, 'gi'))]

          indices.forEach(match => {
            ranges.push({
              anchor: { path, offset: match.index },
              focus: { path, offset: match.index + item.text.length },
              misspelled: true,
              subs: item.subs
            })
          })
        })
      }
    }
  }

  // Placeholders
  if (path.length === 2 && Text.isText(node) && node.text === '' && placeholders === 'multiple') {
    const parentNode = Node.parent(editor, path)

    if (TextbitElement.isElement(parentNode) && Node.string(parentNode) === '') {
      const componentEntry = components.get(parentNode.type)

      ranges.push({
        anchor: { path, offset: 0 },
        focus: { path, offset: 0 },
        placeholder: (componentEntry?.componentEntry?.placeholder) ? componentEntry.componentEntry.placeholder : ''
      })
    }
  }

  return ranges
}


function updateSpellcheckTable(
  editor: Editor,
  onSpellcheck: OnSpellcheckCallback,
  currentSpellcheckTable: SpellcheckLookupTable
): SpellcheckLookupTable {
  // Find all nodes that need spellchecking
  const tracker: SpellcheckLookupTable = new Map()
  const spellcheck: string[] = []

  for (const node of editor.children) {
    if (!TextbitElement.isElement(node) || !node.id) {
      continue
    }

    const currentEntry = currentSpellcheckTable.get(node.id)
    const text = Node.string(node)

    if (!currentEntry || currentEntry.text !== text) {
      // New node, or existing changed node. Needs spellchecking.
      const isEmpty = text.trim() === ''
      tracker.set(node.id, {
        text,
        spelling: !isEmpty ? undefined : [] // Only spellcheck non empty texts
      })

      if (!isEmpty) {
        spellcheck.push(node.id)
      }
    }
    else {
      // Existing unchanged node
      tracker.set(node.id, currentEntry)
    }
  }

  // Send all changed or added strings to spellcheck in one call
  const result = onSpellcheck(
    Array.from(tracker.values())
      .filter(entry => !entry.spelling) // Spellcheck those without spelling info
      .map(entry => entry.text)
  )

  // Add all spellchecking results
  if (result.length === spellcheck.length) {
    for (let i = 0; i < spellcheck.length; i++) {
      const entry = tracker.get(spellcheck[i])
      if (entry) {
        entry.spelling = result[i]
      }
    }
  }

  return tracker
}
