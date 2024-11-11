import {
  type PropsWithChildren,
  useMemo,
  useCallback,
  useEffect
} from 'react'
import { createEditor, Editor as SlateEditor, type Descendant, Editor, type NodeEntry, Node, Text, Range } from 'slate'
import { withHistory } from 'slate-history'
import { type RenderElementProps, type RenderLeafProps, withReact } from 'slate-react'
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
import { Gutter } from '../GutterProvider'
import { SlateEditable } from './components/Slate/SlateEditable'
import { SlateSlate } from './components/Slate/SlateSlate'
import { withUniqueIds } from './with/uniqueIds'
import { debounce } from '../../lib/debounce'
import { calculateStats, TextbitElement } from '../../lib'
import { type PluginRegistryComponent } from '../PluginRegistry/lib/types'
import { type PlaceholdersVisibility } from '../TextbitRoot/TextbitContext'
import { withSpelling } from './with/withSpelling'
import type { SpellingError } from '../../types'

export interface TextbitEditableProps extends PropsWithChildren {
  onChange?: (value: Descendant[]) => void
  onSpellcheck?: (texts: string[]) => Promise<Omit<SpellingError, 'id'>[][]>
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
  dir = 'ltr',
  className = ''
}: TextbitEditableProps) => {
  const { plugins, components, actions } = usePluginRegistry()
  const { autoFocus, onBlur, onFocus, placeholders } = useTextbit()
  const { dispatch, debounce: debounceTimeout, spellcheckDebounce: spellcheckDebounceTimeout } = useTextbit()

  const textbitEditor = useMemo<Editor>(() => {
    const e = SlateEditor.isEditor(yjsEditor) ? yjsEditor : createEditor()

    if (!YHistoryEditor.isYHistoryEditor(e)) {
      withHistory(e)
    }
    withReact(e)
    withSpelling(e, onSpellcheck, spellcheckDebounceTimeout)
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

  useEffect(() => {
    if (textbitEditor?.spellcheck) {
      textbitEditor?.spellcheck()
    }
  }, [])

  return (
    <DragStateProvider>
      <SlateSlate editor={textbitEditor} value={value} onChange={onChangeCallback}>
        <Gutter.Provider dir={dir}>

          <Gutter.Content>
            <PresenceOverlay isCollaborative={!!yjsEditor}>
              <SlateEditable
                className={className}
                autoFocus={autoFocus}
                onBlur={onBlur}
                onFocus={onFocus}
                onDecorate={(entry: NodeEntry) => {
                  return decorate(textbitEditor, entry, components, placeholders)
                }}
                renderSlateElement={renderSlateElement}
                renderLeafComponent={renderLeafComponent}
                textbitEditor={textbitEditor}
                actions={actions}
              />
            </PresenceOverlay>
          </Gutter.Content>

          <div style={{ position: 'relative' }}>
            {children}
          </div>

        </Gutter.Provider>
      </SlateSlate>
    </DragStateProvider>
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
  placeholders?: PlaceholdersVisibility
): Range[] {
  const [node, path] = nodeEntry
  const ranges: Range[] = []

  // Add ranges from spellchecking
  if (editor.spellingLookupTable?.size && Text.isText(node)) {
    const [topNode] = Editor.node(editor, [path[0]])

    if (TextbitElement.isElement(topNode) && topNode.id) {
      const spelling = editor.spellingLookupTable.get(topNode.id)

      if (spelling?.errors.length) {
        const text = node.text

        spelling.errors.forEach((spellingError) => {
          const indices = [...text.matchAll(new RegExp(`\\b${spellingError.text}\\b`, 'gi'))]

          indices.forEach((match) => {
            ranges.push({
              anchor: { path, offset: match.index },
              focus: { path, offset: match.index + spellingError.text.length },
              spellingError
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
